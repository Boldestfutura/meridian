"""Bedroom Show (ha-show-bedroom): the Show card on the Echo Show 5 by the bed.

The same card as ha-show (show.CARD) in `bedside` mode, for a 960x480 screen: a dock on
the right with Clock, Lights, Media, Climate and Calendar, plus a photo button. The
clock sits over the bedroom's Family album, dimmed; it idles back there after five
minutes. Everything comes from the Bedroom entry in show.CARD["rooms"], so a light or
scene added there shows up here too. Hold the clock for 1.5s to uncover HA.
"""
import show

VERSION = show.VERSION
ROOM = next(r for r in show.CARD["rooms"] if r["name"] == "Bedroom")

# the bedroom HomePod first and the default; the others only when picked
SPEAKERS = sorted((dict(s, auto=s["name"] == "Bedroom HomePod") for s in show.CARD["speakers"]),
                  key=lambda s: s["name"] != "Bedroom HomePod")

CARD = dict(show.CARD, bedside=True, room=ROOM, speakers=SPEAKERS,
            photos="camera.album_slideshow_family_bedroom", status=[], scenes=[])


def build():
    return {"title": "Bedroom Show",
            "views": [{"title": "Show", "path": "show", "type": "panel", "cards": [CARD]}]}
