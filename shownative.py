"""Test dashboard (ha-show-native): the Phone Show built from ordinary HA cards.

The same tiles, pop-ups and look as ha-show-phone, but every tile is its own card in an
HA sections view, so HA's own editor arranges them (drag, resize, the pencil, + Add
card). One view, no tabs. The overlook-edit-button card at the bottom hides HA's
header, sets HA's grid to the design's sizes and opens HA's editor.

Each card carries its own pop-up (`popup:`), editable in HA's card editor.

`./deploy.py shownative` ships the card JS (shared with ha-show), and writes this layout only while the live one is still what it last wrote: once it
has been edited in HA, that version stays.
"""
import show
from showphone import SCENES, ROOMS, STATUS_AIR, POPUPS, LINKS

VERSION = show.VERSION

# what overlook-tile picks by itself from the domain; anything else says its kind
AUTO = {"light": "light", "media_player": "media", "climate": "climate", "switch": "switch"}


def tile(x):
    card = {"type": "custom:overlook-tile", "entity": x["entity"]}
    for k in ("name", "icon"):
        if x.get(k):
            card[k] = x[k]
    if x["entity"] in LINKS:
        card["popup"] = POPUPS[LINKS[x["entity"]]]
    if AUTO.get(x["entity"].split(".")[0]) != x["type"]:
        card["kind"] = x["type"]
    if x["type"] == "media":   # the phone hides a speaker that's switched off at the wall
        card["visibility"] = [{"condition": "state", "entity": x["entity"], "state_not": "unavailable"}]
    return card


def with_popups(items):
    """Each pill or reading carries the pop-up it opens."""
    return [dict(x, popup=POPUPS[LINKS[x["entity"]]]) if x["entity"] in LINKS else x for x in items]


def section(*cards):
    return {"type": "grid", "cards": list(cards)}


def heading(name, icon, group=None):
    h = {"type": "custom:overlook-heading", "name": name, "icon": icon}
    if group:
        h["group"] = group
    return h


def build():
    home = [section({"type": "custom:overlook-status", "status": with_popups(show.CARD["status"]),
                     "status_air": with_popups(STATUS_AIR)}),
            section(heading("Scenes", "mdi:creation"), {"type": "custom:overlook-scenes", "scenes": SCENES})]
    home += [section(heading(r["name"], r["icon"], r.get("group")), *[tile(x) for x in r["items"]]) for r in ROOMS]
    home.append(section({"type": "custom:overlook-edit-button"}))
    return {"title": "Phone Show (new)", "views": [
        {"title": "Home", "path": "home", "icon": "mdi:home-variant-outline", "type": "sections",
         "max_columns": 4, "sections": home},
    ]}

