"""Computer Show (ha-show-computer): the Kitchen Show's card on the computer.

The same card as ha-show (show.CARD), on its `desk` page: the whole house on one
page: outside, heat pump and scenes, then lights (a card per room), plugs and
plants, then media grouped by room, with the card's own light pills and players. No dock and no photos.
`windowed` keeps it beside HA's sidebar (header hidden) instead of over the whole
window. Like ha-show it is one custom card: change it here and in
www/overlook-show.js, not in HA's editor.
"""
import show
from showphone import STATUS_AIR, POPUPS, LINKS

VERSION = show.VERSION
# status_air: the phone's house-wide reading pills (temperature, humidity, PM2.5, VOC);
# popups/links: the Phone Show's pop-ups, opened by the same taps
CARD = dict(show.CARD, photos=None, windowed=True, desk=True, status_air=STATUS_AIR,
            popups=POPUPS, links=LINKS)


def build():
    return {"title": "Computer Show",
            "views": [{"title": "Show", "path": "show", "type": "panel", "cards": [CARD]}]}
