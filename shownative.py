"""Test dashboard (ha-show-native): the Phone Show built from ordinary HA cards.

The same tiles, pop-ups and look as ha-show-phone, but every tile is its own card in an
HA sections view, so HA's own editor arranges them (drag, resize, the pencil, + Add
card). The overlook-dock card swaps HA's header for the floating tab bar and sets HA's
grid to the design's sizes; hold Home on the dock to edit. Calendar and Recipes are
their own views holding the full card on that page.

`./deploy.py shownative` ships the card JS (shared with ha-show) and the pop-ups JSON,
and writes this layout only while the live one is still what it last wrote: once it
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
    if AUTO.get(x["entity"].split(".")[0]) != x["type"]:
        card["kind"] = x["type"]
    if x["type"] == "media":   # the phone hides a speaker that's switched off at the wall
        card["visibility"] = [{"condition": "state", "entity": x["entity"], "state_not": "unavailable"}]
    return card


def section(*cards):
    return {"type": "grid", "cards": list(cards)}


def heading(name, icon, group=None):
    h = {"type": "custom:overlook-heading", "name": name, "icon": icon}
    if group:
        h["group"] = group
    return h


PAGE = dict(show.CARD, phone=True, embedded=True, dock=True)
for k in ("photos", "idle", "rooms", "scenes", "sensors", "status"):
    PAGE.pop(k, None)


def build():
    home = [section({"type": "custom:overlook-status", "status": show.CARD["status"], "status_air": STATUS_AIR}),
            section(heading("Scenes", "mdi:creation"), {"type": "custom:overlook-scenes", "scenes": SCENES})]
    home += [section(heading(r["name"], r["icon"], r.get("group")), *[tile(x) for x in r["items"]]) for r in ROOMS]
    home.append(section({"type": "custom:overlook-dock"}))
    return {"title": "Phone Show (new)", "views": [
        {"title": "Home", "path": "home", "icon": "mdi:home-variant-outline", "type": "sections",
         "max_columns": 4, "sections": home},
        {"title": "Calendar", "path": "calendar", "icon": "mdi:calendar-month-outline", "type": "panel",
         "cards": [dict(PAGE, page="calendar")]},
        {"title": "Recipes", "path": "recipes", "icon": "mdi:silverware-fork-knife", "type": "panel",
         "cards": [dict(PAGE, page="recipes")]},
    ]}


def popups_json():
    """Served as /local/overlook-popups.json: the native cards' pop-ups and what opens them."""
    return {"popups": POPUPS, "links": LINKS}
