"""Shared design language for the Overlook-styled HA dashboards.

Everything is custom:button-card - card-mod 4.2.1 injects nothing on HA 2026.10.2.

Colours are theme-derived, not hardcoded: surfaces and text come from HA's own
CSS variables, and every tint is color-mix()'d against the current surface. That
is what makes dark mode work without a second palette.
"""
import json

# --- theme-derived tokens --------------------------------------------------
SURF  = "var(--ha-card-background, var(--card-background-color, #ffffff))"
INK   = "var(--primary-text-color, #1c1d21)"
MUTED = "var(--secondary-text-color, #80848e)"
FONT  = "Figtree, system-ui, sans-serif"

# --- the three entities this module has baked into its templates ----------
# Override before calling any builder, e.g.
#     design.CLIMATE_ENTITY = "climate.upstairs"
# _retarget() rewrites them on the way out, so the templates stay readable.
WEATHER_ENTITY = "weather.forecast_home"
CLIMATE_ENTITY = "climate.living_room"
TIME_ENTITY    = "sensor.time"

_DEFAULTS = {"weather.forecast_home": lambda: WEATHER_ENTITY,
             "climate.living_room":   lambda: CLIMATE_ENTITY,
             "sensor.time":           lambda: TIME_ENTITY}


def retarget(obj):
    """Swap this module's default entity ids for whatever has been configured.

    Done as a post-pass over the built card rather than threading an `entity`
    argument through ~15 builders and their %-formatted JS templates, which is
    where a previous attempt went wrong.
    """
    pairs = [(k, v()) for k, v in _DEFAULTS.items() if k != v()]
    if not pairs:
        return obj
    blob = json.dumps(obj)
    for old, new in pairs:
        blob = blob.replace(old, new)
    return json.loads(blob)


def mix(colour, pct, base=None):
    """pct% of `colour` over the card surface - follows light/dark automatically."""
    return "color-mix(in srgb, %s %d%%, %s)" % (colour, pct, base or SURF)


AMBER   = "#e0a63c"
VIOLET  = "#7b63b8"
BLUE    = "#5a7ea8"
GREEN   = "#3f8f63"
RED     = "#c0564a"
INDIGO  = "#6b6fa8"
MAUVE   = "#a4628f"
TEAL    = "#3f8f8a"
LEAF    = "#5ea664"   # plants
HEAT    = "#c06a28"   # heating: darker orange
COOLBLU = "#2f6fa8"   # cooling: darker blue

AMBER_BG  = mix(AMBER, 16)
VIOLET_BG = mix(VIOLET, 15)
BLUE_BG   = mix(BLUE, 14)
NEUTRAL   = mix(INK, 7)          # icon circle when off
SUBTLE    = mix(INK, 5)          # control-button background
WARM      = mix("#e08a3c", 16)
COOL      = mix("#4c8fc4", 15)

# --- weather ---------------------------------------------------------------
# Only an accent and a name per condition; the tint is mixed from the accent so
# it is correct in both themes.
WEATHER = {
    "sunny":           {"ac": "#d79a2b", "nm": "Sunny",         "ic": "mdi:weather-sunny"},
    "clear-night":     {"ac": "#6b6fa8", "nm": "Clear Night",   "ic": "mdi:weather-night"},
    "partlycloudy":    {"ac": "#5a7ea8", "nm": "Partly Cloudy", "ic": "mdi:weather-partly-cloudy"},
    "cloudy":          {"ac": "#78828f", "nm": "Cloudy",        "ic": "mdi:weather-cloudy"},
    "rainy":           {"ac": "#4c7f9c", "nm": "Rainy",         "ic": "mdi:weather-rainy"},
    "pouring":         {"ac": "#3b6b89", "nm": "Pouring",       "ic": "mdi:weather-pouring"},
    "lightning":       {"ac": "#7158ab", "nm": "Lightning",     "ic": "mdi:weather-lightning"},
    "lightning-rainy": {"ac": "#6a56a0", "nm": "Thunderstorms", "ic": "mdi:weather-lightning-rainy"},
    "snowy":           {"ac": "#6e9ab4", "nm": "Snowy",         "ic": "mdi:weather-snowy"},
    "snowy-rainy":     {"ac": "#5f8ca6", "nm": "Sleet",         "ic": "mdi:weather-snowy-rainy"},
    "hail":            {"ac": "#54809b", "nm": "Hail",          "ic": "mdi:weather-hail"},
    "windy":           {"ac": "#5f8a74", "nm": "Windy",         "ic": "mdi:weather-windy"},
    "windy-variant":   {"ac": "#5f8a74", "nm": "Windy",         "ic": "mdi:weather-windy-variant"},
    "fog":             {"ac": "#8a857d", "nm": "Fog",           "ic": "mdi:weather-fog"},
    "exceptional":     {"ac": "#b0635a", "nm": "Exceptional",   "ic": "mdi:alert-circle-outline"},
}
WJS = json.dumps(WEATHER)
FALLBACK = '{"ac":"#78828f","nm":"Unknown","ic":"mdi:weather-cloudy"}'
SURF_JS = json.dumps(SURF)


def base(bg, h=None, pad="16px 20px", radius=26):
    s = [{"background": bg}, {"border-radius": "%dpx" % radius},
         {"box-shadow": "none"}, {"border": "none"}, {"padding": pad},
         {"font-family": FONT}]
    if h:
        s.insert(1, {"height": "%dpx" % h})
    return s


def tint_js(accent_js, pct=16):
    """Build a color-mix() string inside a JS template."""
    return "`color-mix(in srgb, ${%s} %d%%, ${%s})`" % (accent_js, pct, "SURF")


# ===========================================================================
# Wall-panel builders (big targets, for the 1024x600 kitchen screen)
# ===========================================================================

def _header(place, big=34, clock=31, h=None, middle=None, title_nav=None):
    card = [{"background": "transparent"}, {"box-shadow": "none"}, {"border": "none"},
            {"padding": "0 4px"}, {"font-family": FONT}]
    if h:
        card.append({"height": "%dpx" % h})
    return {
        "type": "custom:button-card", "entity": "sensor.time",
        "show_icon": False, "show_name": False, "show_state": False,
        "tap_action": {"action": "none"},
        "styles": {
            "card": card,
            "grid": [{"grid-template-areas": '"l m r"' if middle else '"l r"'},
                     {"grid-template-columns": "auto 1fr auto" if middle else "1fr auto"},
                     {"column-gap": "16px"}, {"align-items": "center"}],
            "custom_fields": dict(
                {"l": [{"justify-self": "start"}, {"text-align": "left"}],
                 "r": [{"justify-self": "end"}, {"text-align": "right"}]},
                **({"m": [{"justify-self": "stretch"}, {"min-width": "0"},
                          {"width": "100%"}, {"align-self": "center"}]} if middle else {})),
        },
        "custom_fields": {
            "l": ({"card": {
                    "type": "custom:button-card",
                    "show_icon": False, "show_name": False, "show_state": False,
                    "tap_action": {"action": "navigate", "navigation_path": title_nav},
                    "styles": {
                        "card": [{"background": "transparent"}, {"box-shadow": "none"},
                                 {"border": "none"}, {"padding": "0"},
                                 {"font-family": FONT}],
                        "grid": [{"grid-template-areas": '"g"'},
                                 {"justify-items": "start"}],
                        "custom_fields": {"g": [{"justify-self": "start"},
                                                {"text-align": "left"}]},
                    },
                    "custom_fields": {"g": """[[[
                      const h = new Date().getHours();
                      const g = h < 12 ? 'Good morning' : (h < 18 ? 'Good afternoon' : 'Good evening');
                      return `<div style="font-size:13px;color:%s">${g}</div>
                              <div style="font-size:%dpx;font-weight:700;color:%s;letter-spacing:-.02em;line-height:1.15">%s</div>`;
                    ]]]""" % (MUTED, big, INK, place)},
                  }} if title_nav else """[[[
              const h = new Date().getHours();
              const g = h < 12 ? 'Good morning' : (h < 18 ? 'Good afternoon' : 'Good evening');
              return `<div style="font-size:13px;color:%s">${g}</div>
                      <div style="font-size:%dpx;font-weight:700;color:%s;letter-spacing:-.02em;line-height:1.15">%s</div>`;
            ]]]""" % (MUTED, big, INK, place)),
            "r": """[[[
              const d = new Date();
              const t = d.toLocaleTimeString('en-AU',{hour:'numeric',minute:'2-digit'});
              const s = d.toLocaleDateString('en-AU',{weekday:'short',day:'numeric',month:'short'});
              return `<div style="font-size:%dpx;font-weight:600;color:%s;line-height:1.1">${t}</div>
                      <div style="font-size:13px;color:%s;margin-top:3px">${s}</div>`;
            ]]]""" % (clock, INK, MUTED),
            **({"m": {"card": middle}} if middle else {}),
        },
    }


def _weather(h=None, num=54, icon=96, forecast=False, slots=5):
    """forecast: False | "below" | "side"."""
    """Current conditions, optionally with the daily forecast inside the same card.

    The forecast is NOT an entity attribute any more (it only comes from the
    `weather.get_forecasts` service), so it has to be HA's own
    `weather-forecast` card. Nesting it in a custom_field and setting
    `--ha-card-background: transparent` on that container makes it inherit into
    the nested card's shadow DOM and sit flush on this card's tint - which is
    what card-mod would otherwise have been for.
    """
    side = forecast == "side"
    if side:
        areas, cols = '"b f"', "auto 1fr"
    elif forecast:
        areas, cols = '"b i" "f f"', "1fr auto"
    else:
        areas, cols = '"b i"', "1fr auto"
    rows = [{"grid-template-rows": "auto auto"}] if forecast and not side else []
    cf = {"b": [{"justify-self": "start"}, {"text-align": "left"},
                {"min-width": "0"}, {"overflow": "hidden"},
                {"align-self": "center" if side else "start"}]}
    if not side:
        cf["i"] = [{"justify-self": "end"}, {"align-self": "center"},
                   {"padding-right": "4px"}, {"width": "%dpx" % icon}]
    fields = {
        "b": """[[[
          const W = %s; const e = states['weather.forecast_home'];
          const w = W[e.state] || %s;
          const t = Math.round(e.attributes.temperature);
          return `<div style="font-size:12px;color:${w.ac};letter-spacing:.09em;font-weight:700">OUTSIDE</div>
                  <div style="font-size:18px;font-weight:600;color:%s;margin-top:6px">${w.nm}</div>
                  <div style="font-size:%dpx;font-weight:700;color:%s;letter-spacing:-.03em;line-height:1.02">${t}\u00B0</div>
                  <div style="font-size:13px;color:${w.ac};margin-top:4px">Humidity ${e.attributes.humidity}%%</div>`;
        ]]]""" % (WJS, FALLBACK, INK, num, INK),
    }
    if not side:
        fields["i"] = """[[[
          const W = %s; const w = W[states['weather.forecast_home'].state] || %s;
          return `<ha-icon icon="${w.ic}" style="--mdc-icon-size:%dpx;width:%dpx;height:%dpx;color:${w.ac};opacity:.8"></ha-icon>`;
        ]]]""" % (WJS, FALLBACK, icon, icon, icon)
    if forecast:
        cf["f"] = [{"justify-self": "stretch"}, {"width": "100%"},
                   {"align-self": "center"}, {"min-width": "0"},
                   {"--ha-card-background": "transparent"},
                   {"--ha-card-box-shadow": "none"},
                   {"--ha-card-border-width": "0"},
                   {"margin-top": "2px"}]
        fields["f"] = {"card": {"type": "weather-forecast",
                                "entity": "weather.forecast_home",
                                "forecast_type": "daily", "forecast_slots": slots,
                                "show_current": False, "show_forecast": True}}
    return {
        "type": "custom:button-card", "entity": "weather.forecast_home",
        "show_icon": False, "show_name": False, "show_state": False,
        "tap_action": {"action": "more-info"},
        "styles": {
            "card": base(SURF, h) + [{"background": """[[[
                const W = %s; const S = %s;
                const w = W[states['weather.forecast_home'].state] || %s;
                return `color-mix(in srgb, ${w.ac} 17%%, ${S})`;
              ]]]""" % (WJS, SURF_JS, FALLBACK)}],
            "grid": [{"grid-template-areas": areas},
                     {"grid-template-columns": cols}] + rows +
                    [{"column-gap": "14px"},
                     {"align-items": "center" if side else "start"}],
            "custom_fields": cf,
        },
        "custom_fields": fields,
    }


MODE_SEL = {"heat": HEAT, "cool": COOLBLU}


def mode_btn(label, hvac, icon, hgt=52):
    """Heat / Cool / Off. The selected one takes a colour that means something:
    darker orange for heating, darker blue for cooling, plain grey for off."""
    sel = "states['climate.living_room'].state === '%s'" % hvac
    colour = MODE_SEL.get(hvac)
    if colour:
        bg = "[[[ return %s ? '%s' : '%s'; ]]]" % (sel, colour, SUBTLE)
        fg = "[[[ return %s ? '#ffffff' : '%s'; ]]]" % (sel, MUTED)
        nm = "[[[ return %s ? '#ffffff' : '%s'; ]]]" % (sel, INK)
    else:
        # off selected is grey, so the glyph and label stay dark
        bg = "[[[ return %s ? '%s' : '%s'; ]]]" % (sel, mix(INK, 17), SUBTLE)
        fg = MUTED
        nm = INK
    return {
        "type": "custom:button-card", "entity": "climate.living_room",
        "name": label, "icon": icon, "show_state": False,
        "tap_action": {"action": "call-service", "service": "climate.set_hvac_mode",
                       "service_data": {"entity_id": "climate.living_room", "hvac_mode": hvac}},
        "styles": {
            "card": [{"height": "%dpx" % hgt}, {"border-radius": "14px"},
                     {"box-shadow": "none"}, {"border": "none"}, {"padding": "5px 4px"},
                     {"font-family": FONT}, {"background": bg}],
            "icon": [{"width": "20px"}, {"color": fg}],
            "name": [{"font-size": "12px"}, {"font-weight": "600"}, {"margin-top": "1px"},
                     {"color": nm}],
        },
    }


def _heatpump(h=None, num=46):
    return {
        "type": "custom:button-card", "entity": "climate.living_room",
        "show_icon": False, "show_name": False, "show_state": False,
        "tap_action": {"action": "none"},
        "styles": {
            "card": base(SURF, h) + [{"background": """[[[
                const s = states['climate.living_room'].state;
                return s === 'heat' ? '%s' : (s === 'cool' ? '%s' : '%s');
              ]]]""" % (mix(HEAT, 14), mix(COOLBLU, 13), SURF)}],
            "grid": [{"grid-template-areas": '"t" "m"'},
                     {"grid-template-rows": "1fr 52px"}, {"row-gap": "8px"},
                     {"align-items": "start"}],
            "custom_fields": {"t": [{"justify-self": "start"}, {"text-align": "left"}],
                              "m": [{"justify-self": "stretch"}, {"width": "100%"}]},
        },
        "custom_fields": {
            "t": """[[[
              const e = states['climate.living_room'];
              const st = e.state === 'off' ? 'Off'
                       : e.state.replace(/_/g,' ').replace(/\\b\\w/g, c => c.toUpperCase());
              return `<div style="font-size:12px;color:%s;letter-spacing:.09em;font-weight:700">HEATPUMP</div>
                      <div style="font-size:18px;font-weight:600;color:%s;margin-top:6px">${st}</div>
                      <div style="font-size:%dpx;font-weight:700;color:%s;letter-spacing:-.03em;line-height:1.02">${e.attributes.current_temperature}\\u00B0</div>
                      <div style="font-size:13px;color:%s;margin-top:1px">Set to ${e.attributes.temperature}\\u00B0</div>`;
            ]]]""" % (MUTED, INK, num, INK, MUTED),
            "m": {"card": {"type": "horizontal-stack", "cards": [
                mode_btn("Heat", "heat", "mdi:fire"),
                mode_btn("Cool", "cool", "mdi:snowflake"),
                mode_btn("Off", "off", "mdi:power"),
            ]}},
        },
    }


def light(entity, label, h=None, circle=72, glyph=36, icon="mdi:lightbulb",
          on_bg=None, on_ac=None):
    """Vertical tile: icon circle over name and state. Not lights-only."""
    on_bg = on_bg or AMBER_BG
    on_ac = on_ac or AMBER
    on = "states['%s'].state === 'on'" % entity
    return {
        "type": "custom:button-card", "entity": entity, "name": label, "icon": icon,
        "show_state": True,
        "tap_action": {"action": "toggle"}, "hold_action": {"action": "more-info"},
        "state_display": "[[[ return %s ? 'On' : 'Off'; ]]]" % on,
        "styles": {
            "card": base(SURF, h, "14px 10px") + [
                {"background": "[[[ return %s ? '%s' : '%s'; ]]]" % (on, on_bg, SURF)}],
            "grid": [{"grid-template-areas": '"i" "n" "s"'},
                     {"grid-template-rows": "1fr auto auto"}, {"width": "100%"},
                     {"align-items": "center"}],
            "img_cell": [{"background": "[[[ return %s ? '%s' : '%s'; ]]]" % (on, on_ac, NEUTRAL)},
                         {"border-radius": "50%"}, {"width": "%dpx" % circle},
                         {"height": "%dpx" % circle}, {"margin": "0 auto"}],
            "icon": [{"width": "%dpx" % glyph},
                     {"color": "[[[ return %s ? '#ffffff' : '%s'; ]]]" % (on, MUTED)}],
            "name": [{"font-size": "16px"}, {"font-weight": "600"}, {"color": INK},
                     {"margin-top": "10px"}, {"white-space": "nowrap"},
                     {"overflow": "hidden"}, {"text-overflow": "ellipsis"},
                     {"max-width": "100%"}],
            "state": [{"font-size": "13px"}, {"margin-top": "2px"},
                      {"color": "[[[ return %s ? '%s' : '%s'; ]]]" % (on, on_ac, MUTED)}],
        },
    }


# ===========================================================================
# Compact builders, sized to the OG Home dashboard: 56px rows, 36px circles
# ===========================================================================

def tile(entity, label, icon, on_bg=None, on_ac=AMBER, state_fn=None, tap=None):
    on_bg = on_bg or AMBER_BG
    on = "states['%s'].state === 'on'" % entity
    return {
        "type": "custom:button-card", "entity": entity, "name": label, "icon": icon,
        "show_state": True,
        "tap_action": tap or {"action": "toggle"},
        "hold_action": {"action": "more-info"},
        "state_display": state_fn or ("[[[ return %s ? 'On' : 'Off'; ]]]" % on),
        "styles": {
            "card": [{"height": "56px"}, {"border-radius": "16px"}, {"box-shadow": "none"},
                     {"border": "none"}, {"padding": "0 10px"}, {"font-family": FONT},
                     {"background": "[[[ return %s ? '%s' : '%s'; ]]]" % (on, on_bg, SURF)}],
            "grid": [{"grid-template-areas": '"i n" "i s"'},
                     {"grid-template-columns": "36px 1fr"},
                     {"grid-template-rows": "1fr 1fr"},
                     {"align-items": "center"}, {"column-gap": "10px"}],
            "img_cell": [{"background": "[[[ return %s ? '%s' : '%s'; ]]]" % (on, on_ac, NEUTRAL)},
                         {"border-radius": "50%"}, {"width": "36px"}, {"height": "36px"}],
            "icon": [{"width": "19px"},
                     {"color": "[[[ return %s ? '#ffffff' : '%s'; ]]]" % (on, MUTED)}],
            "name": [{"font-size": "14px"}, {"font-weight": "600"}, {"color": INK},
                     {"justify-self": "start"}, {"text-align": "left"}, {"align-self": "end"},
                     {"white-space": "nowrap"}, {"overflow": "hidden"},
                     {"text-overflow": "ellipsis"}],
            "state": [{"font-size": "12px"}, {"justify-self": "start"}, {"text-align": "left"},
                      {"align-self": "start"}, {"white-space": "nowrap"},
                      {"overflow": "hidden"}, {"text-overflow": "ellipsis"},
                      {"color": "[[[ return %s ? '%s' : '%s'; ]]]" % (on, on_ac, MUTED)}],
        },
    }


def tile_scene(entity, label, icon, accent=AMBER):
    """Tints with a darkened version of its own accent while active.

    A `script.*` is 'on' only while running, so that reads as a tap flash.
    A `scene.*` state is the timestamp it was last activated, so it stays lit
    until another scene in the same room is used - which is more useful.
    """
    if entity.startswith("scene."):
        sel = "states['%s'].__ov_latest === true" % entity   # set by SCENE_LATEST below
    else:
        sel = "states['%s'].state === 'on'" % entity
    return {
        "type": "custom:button-card", "entity": entity, "name": label, "icon": icon,
        "show_state": False,
        "tap_action": {"action": "call-service",
                       "service": entity.split(".")[0] + (
                           ".press" if entity.startswith("button.") else ".turn_on"),
                       "service_data": {"entity_id": entity}},
        "styles": {
            "card": [{"height": "56px"}, {"border-radius": "16px"}, {"box-shadow": "none"},
                     {"border": "none"}, {"padding": "0 10px"}, {"font-family": FONT},
                     {"background": "[[[ return %s ? '%s' : '%s'; ]]]"
                                    % (sel, mix(accent, 26), SURF)}],
            "grid": [{"grid-template-areas": '"i n"'},
                     {"grid-template-columns": "36px 1fr"}, {"width": "100%"},
                     {"align-items": "center"}, {"column-gap": "10px"}],
            "img_cell": [{"background": "[[[ return %s ? '%s' : '%s'; ]]]"
                                        % (sel, accent, mix(accent, 16))},
                         {"border-radius": "50%"}, {"width": "36px"}, {"height": "36px"}],
            "icon": [{"width": "19px"},
                     {"color": "[[[ return %s ? '#ffffff' : '%s'; ]]]" % (sel, accent)}],
            "name": [{"font-size": "14px"}, {"font-weight": "600"}, {"color": INK},
                     {"justify-self": "start"}, {"text-align": "left"},
                     {"white-space": "nowrap"}, {"overflow": "hidden"},
                     {"text-overflow": "ellipsis"}],
        },
        # A press-state, so the tap is felt in the scene's own colour. The
        # script's `on` state lasts milliseconds, so it can't carry this.
        # button-card writes styles.card inline, hence !important.
        "extra_styles": (
            "#card{transition:background 90ms ease}"
            "#card:active{background:%s !important}"
            "#card:active #img-cell{background:%s !important}"
            "#card:active #icon{color:#ffffff !important}"
        ) % (mix(accent, 42), accent),
    }


def tile_sensor(entity, label, icon, accent=None, state_fn=None):
    accent = accent or BLUE
    return {
        "type": "custom:button-card", "entity": entity, "name": label, "icon": icon,
        "show_state": True, "tap_action": {"action": "more-info"},
        "state_display": state_fn,
        "styles": {
            "card": [{"height": "56px"}, {"border-radius": "16px"}, {"box-shadow": "none"},
                     {"border": "none"}, {"padding": "0 10px"}, {"font-family": FONT},
                     {"background": mix(accent, 14)}],
            "grid": [{"grid-template-areas": '"i n" "i s"'},
                     {"grid-template-columns": "36px 1fr"},
                     {"grid-template-rows": "1fr 1fr"},
                     {"align-items": "center"}, {"column-gap": "10px"}],
            "img_cell": [{"background": mix(accent, 22)}, {"border-radius": "50%"},
                         {"width": "36px"}, {"height": "36px"}],
            "icon": [{"width": "19px"}, {"color": accent}],
            "name": [{"font-size": "14px"}, {"font-weight": "600"}, {"color": INK},
                     {"justify-self": "start"}, {"text-align": "left"}, {"align-self": "end"},
                     {"white-space": "nowrap"}, {"overflow": "hidden"},
                     {"text-overflow": "ellipsis"}],
            "state": [{"font-size": "12px"}, {"color": MUTED}, {"justify-self": "start"},
                      {"align-self": "start"}],
        },
    }


# ===========================================================================
# Media
# ===========================================================================

def _mbtn(entity, icon, service, accent=False):
    return {
        "type": "custom:button-card", "entity": entity, "icon": icon,
        "show_name": False, "show_state": False,
        "tap_action": {"action": "call-service", "service": "media_player." + service,
                       "service_data": {"entity_id": entity}},
        "styles": {
            "card": [{"height": "38px"}, {"border-radius": "11px"}, {"box-shadow": "none"},
                     {"border": "none"}, {"padding": "0"},
                     {"background": VIOLET if accent else SUBTLE}],
            "icon": [{"width": "18px"}, {"color": "#ffffff" if accent else INK}],
        },
    }


def _play_btn(entity):
    p = "states['%s'].state === 'playing'" % entity
    return {
        "type": "custom:button-card", "entity": entity,
        "show_name": False, "show_state": False,
        "icon": "[[[ return %s ? 'mdi:pause' : 'mdi:play'; ]]]" % p,
        "tap_action": {"action": "call-service", "service": "media_player.media_play_pause",
                       "service_data": {"entity_id": entity}},
        "styles": {
            "card": [{"height": "38px"}, {"border-radius": "11px"}, {"box-shadow": "none"},
                     {"border": "none"}, {"padding": "0"},
                     {"background": "[[[ return %s ? '%s' : '%s'; ]]]" % (p, VIOLET, SUBTLE)}],
            "icon": [{"width": "18px"},
                     {"color": "[[[ return %s ? '#ffffff' : '%s'; ]]]" % (p, INK)}],
        },
    }


def _mute_btn(entity):
    m = "states['%s'].attributes.is_volume_muted === true" % entity
    return {
        "type": "custom:button-card", "entity": entity,
        "show_name": False, "show_state": False,
        "icon": "[[[ return %s ? 'mdi:volume-off' : 'mdi:volume-high'; ]]]" % m,
        "tap_action": {"action": "call-service", "service": "media_player.volume_mute",
                       "service_data": {"entity_id": entity,
                                        "is_volume_muted": "[[[ return !(%s); ]]]" % m}},
        "styles": {
            "card": [{"height": "38px"}, {"border-radius": "11px"}, {"box-shadow": "none"},
                     {"border": "none"}, {"padding": "0"},
                     {"background": "[[[ return %s ? '%s' : '%s'; ]]]" % (m, mix(RED, 18), SUBTLE)}],
            "icon": [{"width": "18px"},
                     {"color": "[[[ return %s ? '%s' : '%s'; ]]]" % (m, RED, INK)}],
        },
    }


def _control(entity, tok):
    if tok == "play":     return _play_btn(entity)
    if tok == "mute":     return _mute_btn(entity)
    if tok == "prev":     return _mbtn(entity, "mdi:skip-previous", "media_previous_track")
    if tok == "next":     return _mbtn(entity, "mdi:skip-next", "media_next_track")
    if tok == "vol_up":   return _mbtn(entity, "mdi:volume-plus", "volume_up")
    if tok == "vol_down": return _mbtn(entity, "mdi:volume-minus", "volume_down")
    if tok == "power":    return _mbtn(entity, "mdi:power", "toggle")
    raise ValueError(tok)


def media_card(entity, label, controls=("play", "vol_down", "vol_up"), icon="mdi:speaker"):
    p = "states['%s'].state === 'playing'" % entity
    return {
        "type": "custom:button-card", "entity": entity,
        "show_icon": False, "show_name": False, "show_state": False,
        "tap_action": {"action": "more-info"},
        "styles": {
            "card": [{"height": "124px"}, {"border-radius": "20px"}, {"box-shadow": "none"},
                     {"border": "none"}, {"padding": "12px 12px"}, {"font-family": FONT},
                     {"background": "[[[ return %s ? '%s' : '%s'; ]]]" % (p, VIOLET_BG, SURF)}],
            "grid": [{"grid-template-areas": '"a t" "c c"'},
                     {"grid-template-columns": "42px 1fr"},
                     {"grid-template-rows": "1fr auto"},
                     {"column-gap": "10px"}, {"row-gap": "10px"},
                     {"align-items": "center"}],
            "custom_fields": {
                "a": [{"align-self": "center"}],
                "t": [{"justify-self": "start"}, {"text-align": "left"},
                      {"min-width": "0"}, {"overflow": "hidden"}, {"width": "100%"}],
                "c": [{"justify-self": "stretch"}, {"width": "100%"}],
            },
        },
        "custom_fields": {
            "a": """[[[
              const e = states['%s'];
              const art = e.attributes.entity_picture;
              if (art) return `<img src="${art}" style="width:42px;height:42px;border-radius:10px;object-fit:cover;display:block">`;
              const bg = %s ? '%s' : '%s';
              const fg = %s ? '#ffffff' : '%s';
              return `<div style="width:42px;height:42px;border-radius:50%%;background:${bg};display:flex;align-items:center;justify-content:center">
                        <ha-icon icon="%s" style="--mdc-icon-size:21px;width:21px;height:21px;color:${fg}"></ha-icon>
                      </div>`;
            ]]]""" % (entity, p, VIOLET, NEUTRAL, p, MUTED, icon),
            "t": """[[[
              const e = states['%s'];
              let sub;
              if (e.state === 'playing' || e.state === 'paused') {
                const t = e.attributes.media_title;
                const a = e.attributes.media_artist || e.attributes.app_name;
                sub = t ? (a ? `${t} \\u00B7 ${a}` : t) : (e.state === 'paused' ? 'Paused' : 'Playing');
              } else {
                sub = e.state.charAt(0).toUpperCase() + e.state.slice(1);
              }
              return `<div style="font-size:14px;font-weight:600;color:%s;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">%s</div>
                      <div style="font-size:12px;color:%s;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px">${sub}</div>`;
            ]]]""" % (entity, INK, label, MUTED),
            "c": {"card": {"type": "conditional",
                "conditions": [
                    {"condition": "state", "entity": entity, "state_not": "unavailable"},
                    {"condition": "state", "entity": entity, "state_not": "unknown"},
                ],
                "card": {"type": "horizontal-stack",
                         "cards": [_control(entity, t) for t in controls]}}},
        },
    }


# ===========================================================================
# Room headers (the bubble-card separators, restyled) and status pills
# ===========================================================================

def room_header(title, icon, group=None):
    fields = {"n": """[[[ return `<div style="display:flex;align-items:center;gap:9px">
        <ha-icon icon="%s" style="--mdc-icon-size:19px;width:19px;height:19px;color:%s"></ha-icon>
        <span style="font-size:16px;font-weight:700;color:%s;letter-spacing:-.01em">%s</span>
      </div>`; ]]]""" % (icon, MUTED, INK, title)}
    areas, cols = '"n"', "1fr"
    cf = {"n": [{"justify-self": "start"}, {"align-self": "center"}]}
    if group:
        on = "states['%s'].state === 'on'" % group
        areas, cols = '"n g"', "1fr auto"
        cf["g"] = [{"justify-self": "end"}, {"align-self": "center"}]
        fields["g"] = {"card": {
            "type": "custom:button-card", "entity": group,
            "icon": "mdi:lightbulb-group", "show_name": False, "show_state": False,
            "tap_action": {"action": "toggle"}, "hold_action": {"action": "more-info"},
            "styles": {
                "card": [{"width": "40px"}, {"height": "32px"}, {"border-radius": "11px"},
                         {"box-shadow": "none"}, {"border": "none"}, {"padding": "0"},
                         {"background": "[[[ return %s ? '%s' : '%s'; ]]]" % (on, AMBER, NEUTRAL)}],
                "icon": [{"width": "18px"},
                         {"color": "[[[ return %s ? '#ffffff' : '%s'; ]]]" % (on, MUTED)}],
            }}}
    return {
        "type": "custom:button-card", "show_icon": False, "show_name": False,
        "show_state": False, "tap_action": {"action": "none"},
        "styles": {
            "card": [{"background": "transparent"}, {"box-shadow": "none"},
                     {"border": "none"}, {"height": "40px"}, {"padding": "0 2px"},
                     {"font-family": FONT}],
            "grid": [{"grid-template-areas": areas}, {"grid-template-columns": cols},
                     {"align-items": "center"}],
            "custom_fields": cf,
        },
        "custom_fields": fields,
    }


def pill(entity, icon, text_js, accent=AMBER, on_test=None, off_accent=None):
    """Small rounded status chip. `text_js` is a JS expression returning a string.

    `off_accent` tints the inactive state too (a person who is away is not a
    neutral fact), instead of leaving it on the plain surface.
    """
    on = on_test or ("states['%s'].state === 'on'" % entity)
    off_bg = mix(off_accent, 16) if off_accent else SURF
    off_fg = off_accent or INK
    off_ic = off_accent or MUTED
    return {
        "type": "custom:button-card", "entity": entity,
        "show_icon": False, "show_name": False, "show_state": False,
        "tap_action": {"action": "more-info"},
        "styles": {
            "card": [{"height": "38px"}, {"border-radius": "19px"}, {"box-shadow": "none"},
                     {"border": "none"}, {"padding": "0 11px"}, {"font-family": FONT},
                     {"background": "[[[ return %s ? '%s' : '%s'; ]]]" % (on, mix(accent, 16), off_bg)}],
            "grid": [{"grid-template-areas": '"i s"'},
                     {"grid-template-columns": "auto auto"}, {"align-items": "center"},
                     {"justify-content": "start"}, {"column-gap": "7px"}],
            "custom_fields": {
                "i": [{"justify-self": "start"}, {"align-self": "center"}],
                "s": [{"justify-self": "start"}, {"align-self": "center"},
                      {"min-width": "0"}, {"overflow": "hidden"}],
            },
        },
        "custom_fields": {
            "i": """[[[ const c = %s ? '%s' : '%s';
              return `<ha-icon icon="%s" style="--mdc-icon-size:17px;width:17px;height:17px;color:${c};display:block"></ha-icon>`;
            ]]]""" % (on, accent, off_ic, icon),
            "s": """[[[ const c = %s ? '%s' : '%s'; const v = (%s);
              return `<div style="font-size:12.5px;font-weight:600;color:${c};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${v}</div>`;
            ]]]""" % (on, accent, off_fg, text_js),
        },
    }


def only_when_available(card, entity):
    return dict(card, visibility=[
        {"condition": "state", "entity": entity, "state_not": "unavailable"},
        {"condition": "state", "entity": entity, "state_not": "unknown"},
    ])


def only_when_on(card, entity):
    """The OG dashboard's conditional badges: render only while state is on."""
    return dict(card, visibility=[
        {"condition": "state", "entity": entity, "state": "on"},
    ])


def _temp_btn(delta, icon):
    """Nudge the heatpump setpoint. Clamped to the entity's own min/max."""
    return {
        "type": "custom:button-card", "entity": "climate.living_room", "icon": icon,
        "show_name": False, "show_state": False,
        "tap_action": {"action": "call-service", "service": "climate.set_temperature",
                       "service_data": {
                           "entity_id": "climate.living_room",
                           "temperature": """[[[
                             const a = states['climate.living_room'].attributes;
                             const step = a.target_temp_step || 1;
                             const v = (a.temperature ?? a.current_temperature) + (%d) * step;
                             return Math.min(a.max_temp ?? 30, Math.max(a.min_temp ?? 10, v));
                           ]]]""" % delta}},
        "styles": {
            "card": [{"width": "38px"}, {"height": "38px"}, {"border-radius": "11px"},
                     {"box-shadow": "none"}, {"border": "none"}, {"padding": "0"},
                     {"background": SUBTLE}],
            "icon": [{"width": "19px"}, {"color": INK}],
        },
    }


def _heatpump_stepper(show_label=True):
    """Heatpump card with a - / setpoint / + stepper beside the reading.

    `show_label=False` drops the word "Heatpump" for narrow columns where a
    section header already says it - at ~350px it otherwise collides with the
    stepper and gets cut mid-word.
    """
    c = _heatpump()
    c["styles"]["card"] = [
        {"border-radius": "20px"}, {"box-shadow": "none"}, {"border": "none"},
        {"padding": "12px 14px"}, {"font-family": FONT},
        {"background": """[[[
            const s = states['climate.living_room'].state;
            return s === 'heat' ? '%s' : (s === 'cool' ? '%s' : '%s');
          ]]]""" % (mix(HEAT, 14), mix(COOLBLU, 13), SURF)}]
    c["styles"]["grid"] = [{"grid-template-areas": '"t p" "m m"'},
                           {"grid-template-columns": "1fr auto"},
                           {"grid-template-rows": "auto 44px"},
                           {"row-gap": "10px"}, {"column-gap": "10px"},
                           {"align-items": "center"}]
    c["styles"]["custom_fields"] = {
        "t": [{"justify-self": "start"}, {"text-align": "left"}, {"align-self": "center"},
              {"min-width": "0"}, {"overflow": "hidden"}],
        "p": [{"justify-self": "end"}, {"align-self": "center"}, {"flex": "0 0 auto"}],
        "m": [{"justify-self": "stretch"}, {"width": "100%"}],
    }
    c["custom_fields"]["t"] = """[[[
      const e = states['climate.living_room'];
      const st = e.state === 'off' ? 'Off'
               : e.state.replace(/_/g,' ').replace(/\\b\\w/g, c => c.toUpperCase());
      return `<div style="display:flex;align-items:baseline;gap:10px;min-width:0">
                <div style="font-size:30px;font-weight:700;color:%s;letter-spacing:-.02em;line-height:1;flex:0 0 auto">${e.attributes.current_temperature}\\u00B0</div>
                <div style="font-size:14px;font-weight:600;color:%s;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">%s${st}</div>
              </div>`;
    ]]]""" % (INK, INK, "Heatpump &middot; " if show_label else "")
    c["custom_fields"]["p"] = {"card": {"type": "horizontal-stack", "cards": [
        _temp_btn(-1, "mdi:minus"),
        {"type": "custom:button-card", "entity": "climate.living_room",
         "show_icon": False, "show_name": False, "show_state": False,
         "tap_action": {"action": "more-info"},
         "styles": {
             "card": [{"width": "58px"}, {"height": "38px"}, {"border-radius": "11px"},
                      {"box-shadow": "none"}, {"border": "none"}, {"padding": "0"},
                      {"background": "transparent"}, {"font-family": FONT}],
             "grid": [{"grid-template-areas": '"v"'}, {"align-items": "center"}],
             "custom_fields": {"v": [{"justify-self": "center"}]},
         },
         "custom_fields": {"v": """[[[
            const a = states['climate.living_room'].attributes;
            return `<div style="font-size:17px;font-weight:700;color:%s;white-space:nowrap">${a.temperature}\\u00B0</div>`;
         ]]]""" % INK}},
        _temp_btn(1, "mdi:plus"),
    ]}}
    c["custom_fields"]["m"] = {"card": {"type": "horizontal-stack", "cards": [
        mode_btn("Heat", "heat", "mdi:fire", hgt=44),
        mode_btn("Cool", "cool", "mdi:snowflake", hgt=44),
        mode_btn("Off", "off", "mdi:power", hgt=44),
    ]}}
    return c


def data_pill(entity, icon, accent, decimals=0):
    """Compact reading: icon + value + unit, sized to its content."""
    txt = ("""(() => { const e = states['%s'];
        const n = parseFloat(e.state);
        const v = isNaN(n) ? e.state : n.toFixed(%d);
        const u = e.attributes.unit_of_measurement || '';
        return v + (u === '\\u00b0C' ? '\\u00b0' : (u ? ' ' + u : ''));
      })()""" % (entity, decimals))
    p = pill(entity, icon, txt, accent=accent, on_test="true")
    p["styles"]["card"][4] = {"padding": "0 11px"}
    return p


def _cols(n, rows):
    return (n + rows - 1) // rows


def _areas(keys, rows):
    """grid-template-areas for the strip, filled ROW-major.

    button-card gives every custom_field `grid-area: <fieldname>`, so this
    string alone decides placement and grid-auto-flow never gets a say.

    Row-major, not column-major, because reading order has to match list
    order. Filling columns first put Heat/Cool, Guest Mode and Bedroom Dim
    across the top row of the scene strip - the list order was still in there
    but you had to read down-then-across to find it, which nobody does.

    A short last row is padded with "." - an unnamed cell. Without the
    padding the rows are unequal, the browser throws the whole declaration
    out as malformed, and every card piles into cell one.
    """
    cols = _cols(len(keys), rows)
    grid = [["." for _ in range(cols)] for _ in range(rows)]
    for i, k in enumerate(keys):
        grid[i // cols][i % cols] = k
    return " ".join('"%s"' % " ".join(r) for r in grid)


def pill_strip(items, gap=8, pad="1px 2px", rows=1, col_w=None):
    """A horizontally scrollable strip of cards, one row or several.

    One button-card acts as the scroll container; each item is a nested card in
    its own custom_field, so they stay individually tappable. `grid-auto-columns:
    max-content` is what makes each pill only as wide as its contents instead of
    sharing the row equally.

    items: [{card: <card>, cond: <entity>, state: "on"}] - `cond` wraps that pill
    in a conditional so it only appears while the entity is in `state`.

    rows > 1 fills top-to-bottom then left-to-right, so seven cards at rows=2
    become four columns with the last one half empty. That is the ordinary
    shape for a scrolling shelf and it beats the alternative here: laid out as
    a plain grid, seven half-width tiles leave the last one stranded alone on
    a fourth row.

    col_w fixes every column to that many pixels. Leave it None for the
    max-content behaviour the status pills want, and set it for anything whose
    cards should line up as a block - uneven label lengths otherwise give you
    a ragged grid.
    """
    keys = ["p%d" % i for i in range(len(items))]
    fields = {}
    for k, it in zip(keys, items):
        card = it["card"]
        if it.get("cond"):
            card = {"type": "conditional",
                    "conditions": [{"condition": "state", "entity": it["cond"],
                                    "state": it.get("state", "on")}],
                    "card": card}
        fields[k] = {"card": card}
    return {
        "type": "custom:button-card",
        "show_icon": False, "show_name": False, "show_state": False,
        "tap_action": {"action": "none"},
        "styles": {
            "card": [{"background": "transparent"}, {"box-shadow": "none"},
                     {"border": "none"}, {"padding": pad}, {"font-family": FONT}],
            "grid": [{"grid-template-areas": _areas(keys, rows)},
                     {"grid-template-columns": "repeat(%d, %s)"
                      % (_cols(len(keys), rows), col_w and "%dpx" % col_w or "max-content")},
                     {"grid-template-rows": "repeat(%d, auto)" % rows},
                     {"grid-auto-flow": "row"},
                     {"grid-auto-columns": col_w and "%dpx" % col_w or "max-content"},
                     {"justify-content": "start"},
                     {"column-gap": "%dpx" % gap},
                     {"row-gap": "%dpx" % gap},
                     {"overflow-x": "auto"}, {"overflow-y": "hidden"},
                     {"scrollbar-width": "none"},
                     {"-ms-overflow-style": "none"},
                     {"align-items": "center"}],
            "custom_fields": {k: [{"justify-self": "stretch" if col_w else "start"},
                                  {"align-self": "center"}]
                              for k in keys},
        },
        "custom_fields": fields,
    }


def range_pill(label, icon, accent, entities, hash_id, decimals=0):
    """One bubble per sensor TYPE, showing the min-max across its sources.

    A source is `entity` or `entity:attribute` - the living room temperature only
    exists as `climate.living_room`'s `current_temperature`, never as a sensor.
    Taps through to a Bubble Card pop-up (`hash_id`) holding one tile per source.
    """
    arr = "[" + ",".join("'%s'" % e for e in entities) + "]"
    txt = """(() => {
        const es = %s.map(x => {
            const [id, attr] = x.split(':');
            const s = states[id];
            if (!s) return null;
            return attr ? {state: s.attributes[attr], attributes: s.attributes} : s;
        }).filter(Boolean);
        const vs = es.map(e => parseFloat(e.state)).filter(v => !isNaN(v));
        if (!vs.length) return '--';
        const lo = Math.min(...vs), hi = Math.max(...vs);
        const u = (es[0].attributes.unit_of_measurement) || '';
        const unit = u === '\\u00b0C' ? '\\u00b0' : (u ? ' ' + u : '');
        const f = v => v.toFixed(%d);
        return (lo === hi ? f(lo) : f(lo) + '\\u2013' + f(hi)) + unit;
      })()""" % (arr, decimals)
    p = pill(entities[0], icon, txt, accent=accent, on_test="true")
    p["tap_action"] = {"action": "navigate", "navigation_path": "#" + hash_id}
    p["styles"]["card"][4] = {"padding": "0 11px"}
    return p


def sensor_popup(hash_id, title, icon, readings, accent):
    """Bubble Card pop-up: one tile per source behind a range bubble.

    A source may be `entity` or `entity:attribute`; the latter reads the value
    off the attribute, which is how the living room temperature gets in.
    """
    cards = []
    for src, lbl in readings:
        ent = src.split(":", 1)[0]
        if ":" in src:
            attr = src.split(":", 1)[1]
            fn = """[[[
              const a = states['%s'].attributes;
              const v = a['%s'];
              return (v === undefined || v === null) ? '\u2014'
                   : v + (a.unit_of_measurement || '\u00b0');
            ]]]""" % (ent, attr)
        else:
            fn = PRETTY_STATE % ent
        cards.append(tile_sensor(ent, lbl, icon, accent=accent, state_fn=fn))
    return {
        "type": "custom:bubble-card", "card_type": "pop-up",
        "hash": "#" + hash_id, "name": title, "icon": icon,
        "cards": [{"type": "grid", "columns": 2, "square": False, "cards": cards}],
    }


PRETTY_STATE = """[[[
  const e = states['%s'];
  const s = e.state;
  const dc = e.attributes.device_class || '';
  const u = e.attributes.unit_of_measurement;
  if (u) return s + (u === '\u00b0C' ? '\u00b0' : ' ' + u);
  if (['opening','door','window','garage_door'].includes(dc))
    return s === 'on' ? 'Open' : (s === 'off' ? 'Closed' : s);
  if (dc === 'battery') return s === 'on' ? 'Low' : 'OK';
  if (dc === 'problem') return s === 'on' ? 'Needs attention' : 'OK';
  if (dc === 'moisture') return s === 'on' ? 'Wet' : 'Dry';
  const M = {home:'Home', not_home:'Away', on:'On', off:'Off',
             unavailable:'Unavailable', unknown:'Unknown'};
  return M[s] || (s.charAt(0).toUpperCase() + s.slice(1));
]]]"""


def info_popup(hash_id, title, icon, rows, extra=None):
    """Bubble Card pop-up holding a 2-column grid of tiles, plus optional raw cards.

    rows: [(entity, label, icon, accent)]
    """
    cards = []
    if rows:
        cards.append({"type": "grid", "columns": 2, "square": False,
                      "cards": [tile_sensor(e, l, i, accent=a,
                                            state_fn=PRETTY_STATE % e)
                                for e, l, i, a in rows]})
    cards += (extra or [])
    return {"type": "custom:bubble-card", "card_type": "pop-up",
            "hash": "#" + hash_id, "name": title, "icon": icon, "cards": cards}


# --- public builders: thin wrappers so retarget() always runs -------------
# (the originals are _-prefixed; keeping the wrap here means no builder can be
#  added later that forgets to retarget)

def header(*a, **k):            return retarget(_header(*a, **k))
def weather(*a, **k):           return retarget(_weather(*a, **k))
def heatpump(*a, **k):          return retarget(_heatpump(*a, **k))
def heatpump_stepper(*a, **k):  return retarget(_heatpump_stepper(*a, **k))
