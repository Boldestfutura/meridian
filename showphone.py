"""Test dashboard (ha-show-phone): the Kitchen Show card laid out for a phone.

Same card and config as show.py, with `phone: true`: one scrolling column, a
floating tab bar (Home, Rooms, Calendar, Recipes) and no photo slideshow. Hold
the greeting for 1.5s to uncover HA for edit mode.

`./deploy.py showphone` ships the card (shared with ha-show) and saves this config.
"""
import show

VERSION = show.VERSION
CARD = dict(show.CARD, phone=True)
CARD.pop("photos", None)
CARD.pop("idle", None)


def build():
    return {"title": "Phone Show",
            "views": [{"title": "Phone", "path": "phone", "type": "panel", "cards": [CARD]}]}
