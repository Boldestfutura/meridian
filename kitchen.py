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


def _weather():
    c = d.weather(MID, num=46, icon=72)
    c["tap_action"] = {"action": "navigate", "navigation_path": "/ha-kitchen/weather"}
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
            _weather(), _heatpump(), _amp(),
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
        weather_view(),
    ]}


def weather_view():
    """A panel-compatible custom weather detail view for the Nest Hub."""
    return {"title": "Weather", "path": "weather", "type": "panel",
            "theme": "Overlook", "badges": [], "subview": True,
            "cards": [{"type": "vertical-stack", "cards": [
                d.header("Weather", big=30, clock=28, h=HDR,
                         title_nav="/ha-kitchen/kitchen"),
                d.weather(450, num=46, icon=72, forecast="below", slots=5),
            ]}]}


def apply_weather_detail(cfg):
    """Patch just the live Kitchen weather tap and add its detail subview."""
    view = next((v for v in cfg.get("views", []) if v.get("path") == "kitchen"), None)
    if view is None:
        raise ValueError("Kitchen view not found")
    changed = []
    for card in patch3._cards(view):
        if (card.get("entity") == "weather.forecast_home"
                and card.get("type") == "custom:button-card"):
            card["tap_action"] = {"action": "navigate",
                                  "navigation_path": "/ha-kitchen/weather"}
            changed.append("weather tap")
    if not any(v.get("path") == "weather" for v in cfg.get("views", [])):
        cfg.setdefault("views", []).append(weather_view())
        changed.append("weather subview")
    return changed


def apply_temperature_strip(cfg):
    """Refresh only the Kitchen panel's temperature bubble, preserving its other pills."""
    view = next((v for v in cfg.get("views", []) if v.get("path") == "kitchen"), None)
    if view is None:
        raise ValueError("Kitchen view not found")
    strips = [card for card in patch3._cards(view) if patch3._is_top_strip(card)]
    if len(strips) != 1:
        raise ValueError("expected one Kitchen status strip, found %d" % len(strips))
    fresh = _no_popup(patch3.top_strip())
    fields = fresh.get("custom_fields", {})
    temp_keys = [key for key, value in fields.items()
                 if isinstance(value, dict) and isinstance(value.get("card"), dict)
                 and value["card"].get("entity") == "sensor.air_quality_monitor_temperature"]
    if len(temp_keys) != 1:
        raise ValueError("could not identify the temperature bubble")
    key = temp_keys[0]
    strips[0]["custom_fields"][key] = fields[key]
    return key


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
