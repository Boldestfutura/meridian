#!/usr/bin/env python3
"""Copy the LIVE ha-phone into the ha-phone-showlook test dashboard, in the Show look.

    ./tools/showlook.py            copy, restyle, save (creates the dashboard first time)
    ./tools/showlook.py --dry-run  show what would change, write nothing

The layout is ha-phone's, read live each run (Cameron edits ha-phone by hand), so
re-running picks up his changes. The look comes from:
  - the view theme "Overlook Show" (themes/overlook-show.yaml: ground, cards, ink, accent)
  - swapping ha-phone's fixed accent colours and corner radii for the Show card's own,
    and giving its cards the Show's shadow and white edge (the button-card styles set
    literal colours, box-shadow: none and border: none, which a theme can't reach).
ha-phone itself is only read, never written.
"""
import json, os, re, sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import deploy, ha_ws

SRC, DST = "ha-phone", "ha-phone-showlook"
TITLE, ICON = "Phone (Show look)", "mdi:cellphone-sound"

# ha-phone colour -> the Show card's (www/overlook-show.js tokens)
COLOURS = {
    "#e0a63c": "#f39a43",   # amber: lights on, warnings -> --warm
    "#c06a28": "#f39a43",   # heat -> --warm
    "#c0564a": "#e5484d",   # alerts -> the Show's red
    "#7b63b8": "#1d5cf0",   # media and accents -> --accent
    "#6b6fa8": "#1d5cf0",
    "#5a7ea8": "#3f86f2",   # cool, water -> --cool
    "#2f6fa8": "#3f86f2",
    "#1c1d21": "#142038",   # ink fallback -> --ink
    "#80848e": "#6c7891",   # muted fallback -> --muted
}
# button-card corner radii -> the Show's (tiles 20px, big cards 26px)
RADII = {"16px": "20px", "20px": "26px"}


# cards (not the small buttons inside them) get the Show's soft shadow and white edge
CARD_RADII = {"20px", "26px"}


def lift(node):
    if isinstance(node, list):
        for x in node:
            lift(x)
        return
    if not isinstance(node, dict):
        return
    card = (node.get("styles") or {}).get("card") if isinstance(node.get("styles"), dict) else None
    if isinstance(card, list) and any(isinstance(x, dict) and x.get("border-radius") in CARD_RADII for x in card):
        for x in card:
            if isinstance(x, dict) and x.get("box-shadow") == "none":
                x["box-shadow"] = "var(--ha-card-box-shadow)"
            if isinstance(x, dict) and x.get("border") == "none":
                x["border"] = "1px solid var(--ha-card-border-color)"
    for v in node.values():
        lift(v)


def restyle(cfg):
    s = json.dumps(cfg)
    for a, b in COLOURS.items():
        s = re.sub(re.escape(a) + r"\b", b, s, flags=re.I)
    for a, b in RADII.items():
        s = s.replace('{"border-radius": "%s"}' % a, '{"border-radius": "%s"}' % b)
    out = json.loads(s)
    lift(out)
    for v in out["views"]:
        v["theme"] = "Overlook Show"
    return out


def main():
    dry = "--dry-run" in sys.argv
    ws, ids = deploy.connect()
    src = ha_ws.call(ws, next(ids), type="lovelace/config", url_path=SRC)["result"]
    cfg = restyle(src)
    have = {d["url_path"] for d in ha_ws.call(ws, next(ids), type="lovelace/dashboards/list")["result"]}
    if dry:
        live = ha_ws.call(ws, next(ids), type="lovelace/config", url_path=DST).get("result") if DST in have else None
        print("%s: %d values would change" % (DST, len(list(deploy.diff(live, cfg))) if live else -1))
        return
    if DST not in have:
        ha_ws.call(ws, next(ids), type="lovelace/dashboards/create", url_path=DST, title=TITLE, icon=ICON,
                   show_in_sidebar=True, require_admin=False)
        print("created", DST)
    r = ha_ws.call(ws, next(ids), type="lovelace/config/save", url_path=DST, config=cfg)
    print("%s <- %s: %s" % (DST, SRC, "ok" if r.get("success") else r.get("error")))


if __name__ == "__main__":
    main()
