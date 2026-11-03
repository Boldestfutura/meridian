#!/usr/bin/env python3
"""Build and deploy the Overlook dashboards to Home Assistant.

    ./deploy.py --list                  what is on the box
    ./deploy.py kitchen computer        rebuild those two from the generators
    ./deploy.py --patch phone           patch the LIVE phone config in place
    ./deploy.py --dry-run kitchen       build and diff, write nothing

`--patch` is the safe mode for a dashboard that has been edited by hand: it
reads what is live, swaps only the cards it owns, and refuses to write if
anything else moved. Plain deploy overwrites the whole config, except on the
Show dashboards, which keep whatever was edited on the screen (see keep_screen_edits).
"""
import argparse, copy, itertools, json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ha_ws

HOST = os.environ.get("HA_HOST", "192.168.1.117")
TOKEN_FILE = os.environ.get("HA_TOKEN_FILE", "~/.config/ha/token")

TARGETS = {           # url_path -> (module, title, icon)
    "kitchen":  ("ha-kitchen",  "Kitchen",  "mdi:countertop"),
    "phone":    ("ha-phone",    "Phone",    "mdi:cellphone"),
    "tablet":   ("ha-tablet",   "Tablet",   "mdi:tablet"),
    "computer": ("ha-computer", "Computer", "mdi:laptop"),
    "bedroom":  ("ha-bedroom",  "Bedroom",  "mdi:bed-king"),
    "homey_lights": ("ha-homey", "Homey lights test", "mdi:lightbulb-outline"),
    "show":     ("ha-show",     "Kitchen Show", "mdi:tablet-dashboard"),
    "showphone": ("ha-show-phone", "Phone Show", "mdi:cellphone-text"),
}


def push_show(ws, ids):
    """Copy the show card to /config/www and point its resource at this version."""
    import show, subprocess
    here = os.path.dirname(os.path.abspath(__file__))
    subprocess.run(["scp", "-q", "-o", "BatchMode=yes", "-o", "UserKnownHostsFile=/tmp/claude-1000/ha_known",
                    "-i", os.path.expanduser("~/.config/ha/vmkey"),
                    os.path.join(here, "www/overlook-show.js"), os.path.join(here, "www/lit-all.min.js"),
                    "root@%s:/config/www/" % HOST], check=True)
    url = "/local/overlook-show.js?v=" + show.VERSION
    res = ha_ws.call(ws, next(ids), type="lovelace/resources")["result"]
    mine = [r for r in res if r["url"].startswith("/local/overlook-show.js")]
    if not mine:
        ha_ws.call(ws, next(ids), type="lovelace/resources/create", res_type="module", url=url)
    elif mine[0]["url"] != url:
        ha_ws.call(ws, next(ids), type="lovelace/resources/update", resource_id=mine[0]["id"],
                   res_type="module", url=url)


def connect():
    tok = open(os.path.expanduser(TOKEN_FILE)).read().strip()
    return ha_ws.connect(HOST, tok), itertools.count(1)


def build(name):
    mod = __import__(name)
    cfg = mod.build()
    if name == "tablet":                      # tablet keeps the pop-ups beside the strip
        import patch3
        cfg["views"][0]["sections"][0]["cards"] += [
            dict(p, grid_options={"columns": "full"}) for p in patch3.popups()]
        patch3.attach_nav(cfg)
    return cfg


def diff(a, b, p=""):
    if type(a) is not type(b):
        yield p; return
    if isinstance(a, dict):
        for k in set(a) | set(b):
            if k not in a or k not in b: yield p + "/" + str(k)
            else: yield from diff(a[k], b[k], p + "/" + str(k))
    elif isinstance(a, list):
        if len(a) != len(b): yield p + "[len]"
        else:
            for i, (x, y) in enumerate(zip(a, b)): yield from diff(x, y, p + "[%d]" % i)
    elif a != b:
        yield p


SNAP = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".deployed")


def keep_screen_edits(name, live, cfg):
    """Show cards can be edited on the screen itself (hold Home -> Edit), so a deploy
    must not undo that. Three-way merge per top-level card key against what was last
    deployed: a key that changed live since then is kept as it is live. Returns the
    merged config and the keys that also changed here (those need merging by hand)."""
    try:
        base = json.load(open(os.path.join(SNAP, name + ".json")))
    except FileNotFoundError:
        return cfg, [], []
    card = lambda c: c["views"][0]["cards"][0]
    out = copy.deepcopy(cfg)
    kept, clash = [], []
    lc, bc, oc = card(live), card(base), card(out)
    for k in set(lc) | set(bc):
        if lc.get(k) != bc.get(k):
            kept.append(k)
            if oc.get(k) != bc.get(k):
                clash.append(k)
            if k in lc: oc[k] = lc[k]
            else: oc.pop(k, None)
    return out, sorted(kept), sorted(clash)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("targets", nargs="*", choices=list(TARGETS) + [[]], default=[])
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--patch", action="store_true",
                    help="patch the live config instead of replacing it")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    ws, ids = connect()

    if a.list:
        for d in ha_ws.call(ws, next(ids), type="lovelace/dashboards/list")["result"]:
            print("  %-16s %s" % (d.get("url_path"), d.get("title")))
        return

    for name in a.targets or list(TARGETS):
        url, title, icon = TARGETS[name]
        have = {d["url_path"] for d in
                ha_ws.call(ws, next(ids), type="lovelace/dashboards/list")["result"]}
        if url not in have and not a.dry_run:
            ha_ws.call(ws, next(ids), type="lovelace/dashboards/create", url_path=url,
                       title=title, icon=icon, show_in_sidebar=True, require_admin=False)
            print("created %s" % url)

        if name in ("show", "showphone") and not a.dry_run:
            push_show(ws, ids)

        if a.patch:
            import patch3
            live = ha_ws.call(ws, next(ids), type="lovelace/config", url_path=url)["result"]
            before = copy.deepcopy(live)
            patch3.apply_all(live); patch3.attach_nav(live)
            outside = [p for p in diff(before, live)
                       if not p.startswith("/views[0]/sections[0]")
                       and not p.endswith("tap_action") and "/tap_action/" not in p]
            if outside:
                print("REFUSING %s - would change %d things outside its own section:" % (url, len(outside)))
                for p in outside[:8]: print("    ", p)
                continue
            cfg = live
        else:
            cfg = build(name)
            built = cfg
            if name in ("show", "showphone"):
                live = ha_ws.call(ws, next(ids), type="lovelace/config", url_path=url)["result"]
                cfg, kept, clash = keep_screen_edits(name, live, cfg)
                if kept:
                    print("%-9s kept screen edits to: %s" % (name, ", ".join(kept)))
                if clash:
                    print("%-9s ALSO CHANGED HERE, live wins - merge by hand: %s" % (name, ", ".join(clash)))

        if a.dry_run:
            live = ha_ws.call(ws, next(ids), type="lovelace/config", url_path=url)["result"]
            n = len(list(diff(live, cfg)))
            print("%-9s dry run: %d values would change" % (name, n))
            continue
        r = ha_ws.call(ws, next(ids), type="lovelace/config/save", url_path=url, config=cfg)
        if r.get("success") and not a.patch and name in ("show", "showphone"):
            os.makedirs(SNAP, exist_ok=True)
            json.dump(built, open(os.path.join(SNAP, name + ".json"), "w"), indent=1)
        print("%-9s -> %-13s %s" % (name, url, "ok" if r.get("success") else json.dumps(r.get("error"))[:120]))


if __name__ == "__main__":
    main()
