"""The scene strip, in one place.

This list was copy-pasted into all four generators, each ending up with its
own order and its own subset. Cameron reordered the strip and added two dims
through the UI, and nothing propagated back - so every generator would have
reverted his edit on the next deploy. One list, four layouts.

Order is deliberate and was chosen at the panel: the two whole-house actions
first, then the mode, then the per-room dims. `guest_mode` is a toggle rather
than a script, so it is flagged and rendered differently.
"""
import design as d

#        entity                          label          icon                        accent     toggle
SCENES = [
    ("script.heatpump_cool_30min",       "Heat/Cool",   "mdi:sun-snowflake-variant", d.TEAL,   False),
    ("script.goodnight",                 "Goodnight",   "mdi:weather-night",         d.INDIGO, False),
    ("input_boolean.guest_mode",         "Guest Mode",  "mdi:account-group",         d.GREEN,  True),
    ("script.kitchen_dimmed",            "Kitchen Dim", "mdi:lightbulb-on-30",       d.AMBER,  False),
    ("script.bedroom_dimmed",            "Bedroom Dim", "mdi:bed",                   d.MAUVE,  False),
    ("script.living_room_dimmed",        "Living Dim",  "mdi:sofa",                  d.VIOLET, False),
    ("script.guest_bedroom_dimmed",      "Guest Dim",   "mdi:bed-outline",            d.BLUE,   False),
]


def card(entity, label, icon, accent, toggle, height=None, compact=False):
    """One strip tile.

    A scene fires a script and has nothing to report afterwards, so it is a
    single line. Guest mode is different in kind: it is a *mode* that gates
    the away automations, and one left on silently is a real failure. Where
    there is room it gets the two-row tile that spells out On/Off; `compact`
    drops it back to the one-line scene shape for rows that cannot spare the
    height, where the accent fill is the only state indicator.
    """
    if toggle and not compact:
        c = d.tile(entity, label, icon, on_bg=d.mix(accent, 16), on_ac=accent)
    else:
        c = d.tile_scene(entity, label, icon, accent=accent)
        if toggle:
            c["tap_action"] = {"action": "toggle"}
    if height is not None:
        c["styles"]["card"] = [{"height": "%dpx" % height} if "height" in x else x
                               for x in c["styles"]["card"]]
    return c


def cards(height=None, compact=False):
    return [card(*s, height=height, compact=compact) for s in SCENES]
