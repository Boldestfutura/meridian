"""The scene strip, in one place.

This list was copy-pasted into all four generators, each ending up with its
own order and its own subset. Cameron reordered the strip and added two dims
through the UI, and nothing propagated back - so every generator would have
reverted his edit on the next deploy. One list, four layouts.

Order is deliberate: guest mode first (Cameron, 2026-10-31), then the two
whole-house actions, then the per-room dims. `guest_mode` is a toggle rather
than a script, so it is flagged and rendered differently.
"""
import design as d

#        entity                          label          icon                        accent     toggle
SCENES = [
    ("input_boolean.guest_mode",         "Guest Mode",  "mdi:account-group",         d.GREEN,  True),
    ("script.heatpump_cool_30min",       "Heat/Cool",   "mdi:sun-snowflake-variant", d.TEAL,   False),
    ("script.goodnight",                 "Goodnight",   "mdi:weather-night",         d.INDIGO, False),
    ("script.kitchen_dimmed",            "Kitchen Dim", "mdi:lightbulb-on-30",       d.AMBER,  False),
    ("script.bedroom_dimmed",            "Bedroom Dim", "mdi:bed",                   d.MAUVE,  False),
    ("script.living_room_dimmed",        "Living Dim",  "mdi:sofa",                  d.VIOLET, False),
    ("script.guest_bedroom_dimmed",      "Guest Dim",   "mdi:bed-outline",            d.BLUE,   False),
    # the bedroom's stream sounds by hand; the 9pm automation flips the same switch
    ("input_boolean.bedroom_night_mode", "Sleep Sounds", "mdi:waves",                 d.COOLBLU, True),
]


def card(entity, label, icon, accent, toggle, height=None):
    """One strip tile. Every scene renders identically - that is the point.

    Guest mode briefly used design.tile instead, to get a two-row card
    spelling out On/Off, on the reasoning that a *mode* which gates the away
    automations deserves explicit state. Wrong call. design.tile only tints
    when the entity is on, so guest mode sat grey in a row where every other
    tile wears its accent, and it was twice the width as well. It read as a
    broken tile, not a considered one. Its state is legible from the accent
    fill exactly as every scene's is.

    The only thing `toggle` still changes is the tap action, which is
    behaviour rather than appearance: a scene fires a script, guest mode
    flips a boolean.
    """
    c = d.tile_scene(entity, label, icon, accent=accent)
    if toggle:
        c["tap_action"] = {"action": "toggle"}
    if height is not None:
        c["styles"]["card"] = [{"height": "%dpx" % height} if "height" in x else x
                               for x in c["styles"]["card"]]
    return c


def cards(height=None):
    return [card(*s, height=height) for s in SCENES]
