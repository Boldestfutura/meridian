"""Bedroom Show (ha-show-bedroom): the Show card on the Echo Show 5 by the bed.

The same card as ha-show (show.CARD) in `bedside` mode, for a 960x480 screen: the
kitchen's dock on the left with Controls, Media, Climate and Calendar, and the photo
button below it. Photos are home: the bedroom's Family album with the clock and the
dock over it, and the screen idles back there after five minutes. At night
(`night`, binary_sensor.bedroom_dark) home is a red clock on black instead, and a
woken screen goes back to it after 30 seconds. Everything comes
from the Bedroom entry in show.CARD["rooms"], so its group and switches show up on
Controls and its sensors on Climate. Hold the clock for 1.5s to uncover HA.
"""
import show

VERSION = show.VERSION
ROOM = next(r for r in show.CARD["rooms"] if r["name"] == "Bedroom")

# the Echo itself first and the default; the others only when picked
SPEAKERS = sorted((dict(s, auto=s["name"] == "Bedroom Echo") for s in show.CARD["speakers"]),
                  key=lambda s: s["name"] != "Bedroom Echo")

CARD = dict(show.CARD, bedside=True, room=ROOM, speakers=SPEAKERS,
            photos="camera.album_slideshow_family_bedroom", status=[], scenes=[],
            # when the room is dark (lights off, Echo light sensor under 3 lx): a red clock on black
            night="binary_sensor.bedroom_dark",
            # voice: weather questions to the Echo (Assist satellite in area `bedroom`) open the weather page
            voice="bedroom",
            # a blue glow round the edge while the Echo's Assist satellite is listening/answering
            voice_satellite="assist_satellite.bedroom_echo_va")


def build():
    return {"title": "Bedroom Show",
            "views": [{"title": "Show", "path": "show", "type": "panel", "cards": [CARD]}]}
