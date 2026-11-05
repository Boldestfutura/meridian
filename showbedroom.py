"""Bedroom Show (ha-show-bedroom): the Show card on the Echo Show 5 by the bed.

The same card as ha-show (show.CARD) in `bedside` mode, for a 960x480 screen: the
kitchen's dock on the left with Lights, Media, Climate and Calendar, and the photo
button below it. Photos are home: the bedroom's Family album with the clock and the
dock over it, and the screen idles back there after five minutes. At night
(`night`, input_boolean.bedroom_night_mode) home is a red clock on black instead, and a
woken screen goes back to it after 30 seconds. Everything comes
from the Bedroom entry in show.CARD["rooms"], so a light or scene added there shows up
here too. Hold the clock for 1.5s to uncover HA.
"""
import show

VERSION = show.VERSION
ROOM = next(r for r in show.CARD["rooms"] if r["name"] == "Bedroom")

# the Echo itself first and the default; the others only when picked
SPEAKERS = sorted((dict(s, auto=s["name"] == "Bedroom Echo") for s in show.CARD["speakers"]),
                  key=lambda s: s["name"] != "Bedroom Echo")

CARD = dict(show.CARD, bedside=True, room=ROOM, speakers=SPEAKERS,
            photos="camera.album_slideshow_family_bedroom", status=[], scenes=[],
            # on 9pm-7:30am (the night-mode automation): home becomes a red clock on black
            night="input_boolean.bedroom_night_mode")


def build():
    return {"title": "Bedroom Show",
            "views": [{"title": "Show", "path": "show", "type": "panel", "cards": [CARD]}]}
