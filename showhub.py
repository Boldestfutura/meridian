"""Hub Show (ha-show-hub): the Show card on the kitchen's Google Nest Hub.

The same card as ha-show (show.CARD) in `hub` mode, built for the Hub's 7" 1024x600
screen instead of the 8.8" tablet: photos are home with the dock over them, and the
dock has Controls (Kitchen and Living Room lights, Scenes, the TV, and the media
card), Media (everything playing, then playlists), Climate (the heat pump and the
kitchen's air readings), Calendar and Recipes. A tap on a photo opens Controls and the
screen idles back to photos. ha-show stays as it is for the tablet.
"""
import show

VERSION = show.VERSION

ROOMS = {r["name"]: r for r in show.CARD["rooms"]}
KITCHEN, LIVING = ROOMS["Kitchen"], ROOMS["Living Room"]

# the Scenes tile's sheet: the Kitchen Show's favourites, then each room's own, no repeats
_seen, SCENES = set(), []
for room, scenes in (("", show.CARD["scenes"]), ("Kitchen", KITCHEN["scenes"]), ("Living Room", LIVING["scenes"])):
    for s in scenes:
        if s["entity"] not in _seen:
            _seen.add(s["entity"])
            # "Bright" is in both rooms, so a room's own scenes carry its name
            SCENES.append(dict(s, name=f"{room} {s['name']}") if room and s["name"] in ("Bright", "Evening") else s)
# and the bedroom's sleep sounds, which is not a kitchen scene but is started from anywhere
SCENES += [s for r in show.CARD["rooms"] if r["name"] == "Bedroom" for s in r["scenes"]
           if s["entity"] == "input_boolean.bedroom_night_mode" and s["entity"] not in _seen]

CARD = dict(show.CARD, hub=True, room=KITCHEN, status=[],
            hub_rooms=[{"name": "Kitchen Lights", "icon": "mdi:stove", "group": KITCHEN["group"]},
                       {"name": "Living Room Lights", "icon": "mdi:sofa", "group": LIVING["group"]}],
            hub_scenes=SCENES,
            tv={"entity": "media_player.living_room", "name": "TV", "icon": "mdi:television"})


def build():
    return {"title": "Hub Show",
            "views": [{"title": "Show", "path": "show", "type": "panel", "cards": [CARD]}]}
