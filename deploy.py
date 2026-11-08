#!/usr/bin/env python3
"""Build and deploy the Overlook dashboards to Home Assistant.

    ./deploy.py --list                  what is on the box
    ./deploy.py kitchen computer        rebuild those two from the generators
    ./deploy.py --patch phone           patch the LIVE phone config in place
    ./deploy.py --dry-run kitchen       build and diff, write nothing

`--patch` is the safe mode for a dashboard that has been edited by hand: it
reads what is live, swaps only the cards it owns, and refuses to write if
anything else moved. Plain deploy overwrites the whole config.
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
    "shownative": ("ha-show-native", "Phone Show", "mdi:cellphone-cog"),
    "showcomputer": ("ha-show-computer", "Computer Show", "mdi:monitor-dashboard"),
    "showbedroom": ("ha-show-bedroom", "Bedroom Show", "mdi:bed-clock"),
    "showhub": ("ha-show-hub", "Hub Show", "mdi:monitor-speaker"),
}
# edited in HA's own editor: deploy writes their layout only until that happens
NATIVE = ("shownative",)
SNAP = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".deployed")


def push_show(ws, ids):
    """Copy the show card to /config/www and point its resource at this version."""
    import show, subprocess
    here = os.path.dirname(os.path.abspath(__file__))
    subprocess.run(["scp", "-q", "-o", "BatchMode=yes", "-o", "UserKnownHostsFile=/tmp/claude-1000/ha_known",
                    "-i", os.path.expanduser("~/.config/ha/vmkey"),
                    os.path.join(here, "www/overlook-show.js"), os.path.join(here, "www/lit-all.min.js"),
                    "root@%s:/config/www/" % HOST], check=True)
    # artwork: the amp's TV and phono inputs, and the weather icons (tools/weather_icons.py)
    subprocess.run(["scp", "-q", "-r", "-o", "BatchMode=yes", "-o", "UserKnownHostsFile=/tmp/claude-1000/ha_known",
                    "-i", os.path.expanduser("~/.config/ha/vmkey"),
                    os.path.join(here, "www/inputs"), os.path.join(here, "www/weather"), "root@%s:/config/www/" % HOST], check=True)
    import shownative
    pj = os.path.join(here, "www/overlook-popups.json")
    json.dump(shownative.popups_json(), open(pj, "w"))
    subprocess.run(["scp", "-q", "-o", "BatchMode=yes", "-o", "UserKnownHostsFile=/tmp/claude-1000/ha_known",
                    "-i", os.path.expanduser("~/.config/ha/vmkey"), pj, "root@%s:/config/www/" % HOST], check=True)
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


def edited_live(name, live):
    """True once the live dashboard is no longer what deploy last wrote, i.e. it was
    changed in HA's editor. The NATIVE dashboards are edited there, so their layout is written
    only until then; the card JS and pop-ups still ship."""
    try:
        return json.load(open(os.path.join(SNAP, name + ".json"))) != live
    except FileNotFoundError:
        return False


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

        if (name in ("show", "showcomputer", "showbedroom", "showhub") or name in NATIVE) and not a.dry_run:
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

        if name in NATIVE and url in have:
            live = ha_ws.call(ws, next(ids), type="lovelace/config", url_path=url).get("result")
            if live and edited_live(name, live):
                print("%-9s edited in HA - kept the live layout (card JS and pop-ups shipped)" % name)
                continue

        if a.dry_run:
            live = ha_ws.call(ws, next(ids), type="lovelace/config", url_path=url)["result"]
            n = len(list(diff(live, cfg)))
            print("%-9s dry run: %d values would change" % (name, n))
            continue
        r = ha_ws.call(ws, next(ids), type="lovelace/config/save", url_path=url, config=cfg)
        print("%-9s -> %-13s %s" % (name, url, "ok" if r.get("success") else json.dumps(r.get("error"))[:120]))
        if r.get("success") and name in NATIVE:
            os.makedirs(SNAP, exist_ok=True)
            json.dump(cfg, open(os.path.join(SNAP, name + ".json"), "w"))


if __name__ == "__main__":
    main()
