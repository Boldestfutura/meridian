"""Kitchen wall panel, 1024x600.

A `panel` view, because a sections view caps each column near 500px and will
not span the screen. A panel view renders only its FIRST card, so that card is
a vertical-stack holding the gutter wrapper plus every Bubble Card pop-up.

The pop-ups have to be direct children of that stack: nested inside a
button-card `custom_field` they render into the DOM but hash navigation never
opens them.

Height: toolbar takes 56 of 600 -> 544 usable.
  wrapper 22 + header 64 + 12 + scenes 52 + 12 + mid 200 + 12 + lights 160 = 534.
"""
import design as d
import patch3

HDR, SCENE, MID, LIGHTS = 64, 52, 200, 160


def _no_popup(card):
    """Bubble Card pop-ups do not open from a panel view, so on this screen the
    pills fall back to HA's own more-info dialog, which does work here."""
    if isinstance(card, dict):
        ta = card.get('tap_action')
        if isinstance(ta, dict) and ta.get('action') == 'navigate' \
           and str(ta.get('navigation_path','')).startswith('#ov-'):
            card['tap_action'] = {'action': 'more-info'}
        for v in card.values():
            _no_popup(v)
    elif isinstance(card, list):
        for v in card:
            _no_popup(v)
    return card


def _fixed(card, h, radius=26):
    card["styles"]["card"] = [x for x in card["styles"]["card"] if "height" not in x]
    card["styles"]["card"].insert(0, {"height": "%dpx" % h})
    card["styles"]["card"] = [{"border-radius": "%dpx" % radius} if "border-radius" in x else x
                              for x in card["styles"]["card"]]
    return card


def _amp():
    c = _fixed(d.media_card("media_player.living_room_amp", "Amp",
                            controls=("play", "vol_down", "vol_up", "mute")), MID)
    c["styles"]["grid"] = [{"grid-template-areas": '"a" "t" "c"'},
                           {"grid-template-rows": "auto auto auto"},
                           {"row-gap": "10px"}, {"justify-items": "center"},
                           {"align-content": "center"}]
    c["styles"]["custom_fields"] = {
        "a": [{"justify-self": "center"}],
        "t": [{"justify-self": "stretch"}, {"text-align": "center"},
              {"min-width": "0"}, {"overflow": "hidden"}, {"width": "100%"}],
        "c": [{"justify-self": "stretch"}, {"width": "100%"}],
    }
    return c


def _heatpump():
    c = _fixed(d.heatpump_stepper(), MID)
    # the column here is ~330px: side-by-side clips "Heatpump . Off" against the
    # stepper, so stack them instead - MID has the vertical room
    c["styles"]["grid"] = [{"grid-template-areas": '"t" "p" "m"'},
                           {"grid-template-rows": "auto auto 48px"},
                           {"row-gap": "10px"}, {"align-content": "center"}]
    c["styles"]["custom_fields"] = {
        "t": [{"justify-self": "start"}, {"text-align": "left"}],
        "p": [{"justify-self": "start"}],
        "m": [{"justify-self": "stretch"}, {"width": "100%"}],
    }
    c["custom_fields"]["m"] = {"card": {"type": "horizontal-stack", "cards": [
        d.mode_btn("Heat", "heat", "mdi:fire", hgt=48),
        d.mode_btn("Cool", "cool", "mdi:snowflake", hgt=48),
        d.mode_btn("Off", "off", "mdi:power", hgt=48),
    ]}}
    return c


def _scene(entity, label, icon, accent):
    c = d.tile_scene(entity, label, icon, accent=accent)
    c["styles"]["card"] = [{"height": "%dpx" % SCENE} if "height" in x else x
                           for x in c["styles"]["card"]]
    return c


def build():
    rows = {"type": "vertical-stack", "cards": [
        d.header("Kitchen", big=30, clock=28, h=HDR,
                 middle=_no_popup(patch3.top_strip()),
                 title_nav="/ha-kitchen/photos"),
        {"type": "horizontal-stack", "cards": [
            _scene("script.goodnight", "Goodnight", "mdi:weather-night", d.INDIGO),
            _scene("script.kitchen_dimmed", "Kitchen Dim", "mdi:lightbulb-on-30", d.AMBER),
            _scene("script.bedroom_dimmed", "Bedroom Dim", "mdi:bed", d.MAUVE),
            _scene("script.heatpump_cool_30min", "Heat/Cool", "mdi:sun-snowflake-variant", d.TEAL),
        ]},
        {"type": "horizontal-stack", "cards": [
            d.weather(MID, num=46, icon=72), _heatpump(), _amp(),
        ]},
        {"type": "horizontal-stack", "cards": [
            d.light("light.kitchen_lights", "Kitchen", LIGHTS, circle=52, glyph=26),
            d.light("light.living_room", "Living Room", LIGHTS, circle=52, glyph=26),
            d.light("light.master_bedroom_lights", "Bedroom", LIGHTS, circle=52, glyph=26),
            d.light("light.all_lights", "Home", LIGHTS, circle=52, glyph=26),
        ]},
    ]}
    wrapper = {
        "type": "custom:button-card",
        "show_icon": False, "show_name": False, "show_state": False,
        "tap_action": {"action": "none"},
        "styles": {
            "card": [{"background": "transparent"}, {"box-shadow": "none"},
                     {"border": "none"}, {"padding": "6px 16px 16px"}],
            "grid": [{"grid-template-areas": '"c"'}],
            "custom_fields": {"c": [{"width": "100%"}, {"justify-self": "stretch"}]},
        },
        "custom_fields": {"c": {"card": rows}},
    }
    return {"views": [
        {"title": "Kitchen", "path": "kitchen", "type": "panel",
         "theme": "Overlook", "badges": [], "cards": [wrapper]},
        photo_view(),
    ]}


def photo_view():
    """Full-screen Immich slideshow. Tapping anywhere returns to the dashboard.

    picture-entity rather than an iframe: an iframe swallows the tap, so there
    would be no way back out without a card-mod overlay.
    """
    return {"title": "Photos", "path": "photos", "type": "panel",
            "theme": "Overlook", "badges": [], "subview": True,
            "cards": [{
                "type": "picture-entity",
                "entity": "camera.album_slideshow_family",
                "camera_view": "auto",
                "show_name": False, "show_state": False,
                "fit_mode": "cover",
                "tap_action": {"action": "navigate",
                               "navigation_path": "/ha-kitchen/kitchen"},
                "hold_action": {"action": "none"},
                "double_tap_action": {"action": "none"},
            }]}
