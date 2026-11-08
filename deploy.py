#!/usr/bin/env python3
"""Build and deploy the Overlook dashboards to Home Assistant.

    ./deploy.py --list                      what is on the box
    ./deploy.py show showhub                rebuild those two from the generators
    ./deploy.py --dry-run showbedroom       build and diff, write nothing

Every Show dashboard first ships the card (www/overlook-show.js) and its artwork, then
saves its config. ha-show-native is the exception: once it has been edited in HA's own
editor, only the card ships and the live layout is kept.
"""
import argparse, itertools, json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ha_ws

HOST = os.environ.get("HA_HOST", "192.168.1.117")
TOKEN_FILE = os.environ.get("HA_TOKEN_FILE", "~/.config/ha/token")

TARGETS = {           # name -> (url_path, title, icon)
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
    return __import__(name).build()


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
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    ws, ids = connect()

    if a.list:
        for d in ha_ws.call(ws, next(ids), type="lovelace/dashboards/list")["result"]:
            print("  %-16s %s" % (d.get("url_path"), d.get("title")))
        return

    shipped = False                           # the card is the same file for all of them
    for name in a.targets or list(TARGETS):
        url, title, icon = TARGETS[name]
        have = {d["url_path"] for d in
                ha_ws.call(ws, next(ids), type="lovelace/dashboards/list")["result"]}
        if url not in have and not a.dry_run:
            ha_ws.call(ws, next(ids), type="lovelace/dashboards/create", url_path=url,
                       title=title, icon=icon, show_in_sidebar=True, require_admin=False)
            print("created %s" % url)

        if not a.dry_run and not shipped:
            push_show(ws, ids); shipped = True
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
