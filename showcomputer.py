"""Computer Show (ha-show-computer): the Kitchen Show's card on the computer.

The same full-screen card as ha-show (show.CARD): dock on the left with the
Kitchen, Home, Calendar and Recipes pages, clock and weather top right. No photo
slideshow, so it never drifts off to photos when left alone, and `windowed` keeps
it beside HA's sidebar (header hidden) instead of over the whole window. Like ha-show it is
one custom card: change it here and in www/overlook-show.js, not in HA's editor.
"""
import show

VERSION = show.VERSION
CARD = dict(show.CARD, photos=None, windowed=True)


def build():
    return {"title": "Computer Show",
            "views": [{"title": "Show", "path": "show", "type": "panel", "cards": [CARD]}]}
