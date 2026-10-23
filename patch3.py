"""Top row: status pills + one range bubble per sensor type, horizontally
scrollable; each range bubble opens a Bubble Card pop-up listing its sensors.

Patches the LIVE config so Cameron's own layout edits survive.
"""
import json
import re
import design as d

ROOMS = [("sensor.air_quality_monitor_%s", "Kitchen"),
         ("sensor.air_quality_monitor_%s_2", "Master Bedroom")]

# Sources that exist for one type only. The living room has no temperature
# sensor - the heatpump reports it as an attribute - so it is listed as
# "entity:attribute" and both range_pill and the pop-up tile read it that way.
EXTRA = {"temperature": [("climate.living_room:current_temperature", "Living Room")]}
LIVING_ROOM_TEMP = "climate.living_room"

TYPES = [
    # key,        label,        icon,                 accent,  decimals
    ("temperature", "Temperature", "mdi:thermometer",   d.RED,   1),
    ("humidity",    "Humidity",    "mdi:water-percent", d.BLUE,  0),
    ("pm2_5",       "PM2.5",       "mdi:blur",          d.AMBER, 0),
    ("voc_index",   "VOC",         "mdi:air-filter",    d.TEAL,  0),
]

STATUS_ENTS = {
    "person.cameron", "person.paget",
    "binary_sensor.door_sensor", "binary_sensor.window_sensor",
    "update.home_assistant_operating_system_update",
    "update.home_assistant_core_update",
    "binary_sensor.any_device_battery_low",
    "binary_sensor.any_plant_needs_water",
}


def q(s):
    return "'" + s.replace("'", "\\'") + "'"


def person(entity, name):
    home = "states['%s'].state === 'home'" % entity
    return d.pill(entity, "mdi:account",
                  "%s ? %s : %s" % (home, q(name), q(name + " away")),
                  accent=d.GREEN, on_test=home, off_accent=d.VIOLET)


def ents_for(key):
    entities = [tmpl % key for tmpl, _ in ROOMS]
    if key == "temperature":
        entities.append(LIVING_ROOM_TEMP)
    return entities


def readings_for(key):
    readings = [(tmpl % key, room) for tmpl, room in ROOMS]
    if key == "temperature":
        readings.append((LIVING_ROOM_TEMP, "Living Room"))
    return readings


def temperature_pill():
    sensors = json.dumps([tmpl % "temperature" for tmpl, _ in ROOMS])
    text = """(() => {
        const values = %s.map(id => states[id] && parseFloat(states[id].state));
        const room = states[%s];
        if (room) values.push(parseFloat(room.attributes.current_temperature));
        const vs = values.filter(Number.isFinite);
        if (!vs.length) return '--';
        const lo = Math.min(...vs), hi = Math.max(...vs);
        const f = v => v.toFixed(1);
        return (lo === hi ? f(lo) : f(lo) + '\\u2013' + f(hi)) + '\\u00b0';
      })()""" % (sensors, json.dumps(LIVING_ROOM_TEMP))
    p = d.pill(ents_for("temperature")[0], "mdi:thermometer", text,
               accent=d.RED, on_test="true")
    p["tap_action"] = {"action": "navigate", "navigation_path": "#ov-temperature"}
    p["styles"]["card"][4] = {"padding": "0 11px"}
    return p


def temperature_popup():
    readings = [d.tile_sensor(tmpl % "temperature", room, "mdi:thermometer",
                              accent=d.RED)
                for tmpl, room in ROOMS]
    current_temp = """[[[
      const e = states[%s];
      const t = e && Number(e.attributes.current_temperature);
      return Number.isFinite(t) ? t.toFixed(1) + '\\u00b0' : '\\u2014';
    ]]]""" % json.dumps(LIVING_ROOM_TEMP)
    readings.append(d.tile_sensor(LIVING_ROOM_TEMP, "Living Room", "mdi:thermometer",
                                  accent=d.RED, state_fn=current_temp))
    return d.info_popup("ov-temperature", "Temperature", "mdi:thermometer", None,
                        extra=[{"type": "grid", "columns": 2, "square": False,
                                "cards": readings}])


def nav(card, hash_id):
    card = dict(card)
    card["tap_action"] = {"action": "navigate", "navigation_path": "#" + hash_id}
    return card


def top_strip():
    items = [
        {"card": nav(person("person.cameron", "Cameron"), "ov-cameron")},
        {"card": nav(person("person.paget", "Paget"), "ov-paget")},
        {"card": nav(d.pill("binary_sensor.door_sensor", "mdi:door-open",
                            q("Door open"), accent=d.AMBER), "ov-openings"),
         "cond": "binary_sensor.door_sensor"},
        {"card": nav(d.pill("binary_sensor.window_sensor", "mdi:window-open",
                            q("Window open"), accent=d.AMBER), "ov-openings"),
         "cond": "binary_sensor.window_sensor"},
    ]
    for key, label, icon, accent, dec in TYPES:
        pill = (temperature_pill() if key == "temperature"
                else d.range_pill(label, icon, accent, ents_for(key), "ov-" + key, dec))
        items.append({"card": pill})
    items += [
        {"card": nav(d.pill("update.home_assistant_operating_system_update", "mdi:package-up",
                            q("HA OS update"), accent=d.RED), "ov-updates"),
         "cond": "update.home_assistant_operating_system_update"},
        {"card": nav(d.pill("update.home_assistant_core_update", "mdi:package-up",
                            q("HA Core update"), accent=d.RED), "ov-updates"),
         "cond": "update.home_assistant_core_update"},
        {"card": nav(d.pill("binary_sensor.any_device_battery_low", "mdi:battery-alert",
                            q("Battery low"), accent=d.RED), "ov-battery"),
         "cond": "binary_sensor.any_device_battery_low"},
        {"card": nav(d.pill("binary_sensor.any_plant_needs_water", "mdi:watering-can",
                            q("Plant needs water"), accent=d.BLUE), "ov-plants"),
         "cond": "binary_sensor.any_plant_needs_water"},
    ]
    return d.pill_strip(items)


BATTERIES = [
    ("sensor.door_sensor_battery",                     "Door sensor"),
    ("sensor.window_sensor_battery",                   "Window sensor"),
    ("sensor.dimmer_switch_battery",                   "Dimmer switch"),
    ("sensor.master_bedroom_dimmer_battery",           "MB dimmer"),
    ("sensor.shortcut_button_battery",                 "Shortcut button"),
    ("sensor.kitchen_living_room_dimmer_switch_battery", "Kitchen dimmer"),
    ("sensor.master_bedroom_dimmer_switch_battery",    "MB dimmer switch"),
    ("sensor.soil_moisture_sensor_1_battery",          "Fiddle leaf fig"),
    ("sensor.moisture_sensor_2_battery",               "Banana Leaf"),
    ("sensor.iphone_battery_level",                    "Cameron iPhone"),
    ("sensor.paget_s_iphone_battery_level",            "Paget iPhone"),
    ("sensor.camerons_ipad_pro_battery_level",         "Cameron iPad"),
    ("sensor.paget_s_ipad_battery_level",              "Paget iPad"),
]

UPDATE_ENTS = [
    ("update.home_assistant_core_update",             "Core"),
    ("update.home_assistant_operating_system_update", "Operating System"),
    ("update.home_assistant_supervisor_update",       "Supervisor"),
]


def update_tile(entity, label):
    """Native tile: the update-actions feature is what makes Install tappable."""
    return {"type": "tile", "entity": entity, "name": label,
            "features_position": "bottom",
            "features": [{"type": "update-actions", "backup": "ask"}]}


def popups():
    out = [temperature_popup() if key == "temperature"
           else d.sensor_popup("ov-" + key, label, icon, readings_for(key), accent)
           for key, label, icon, accent, _ in TYPES]

    out.append(d.info_popup("ov-cameron", "Cameron", "mdi:account", [
        ("person.cameron",                        "Location",    "mdi:map-marker",      d.GREEN),
        ("device_tracker.iphone",                 "iPhone",      "mdi:cellphone",       d.GREEN),
        ("device_tracker.camerons_ipad_pro",      "iPad Pro",    "mdi:tablet",          d.GREEN),
        ("device_tracker.camerons_iphone_apple_watch", "Watch",  "mdi:watch",           d.GREEN),
        ("sensor.iphone_battery_level",           "iPhone battery", "mdi:battery",      d.AMBER),
        ("sensor.camerons_ipad_pro_battery_level", "iPad battery",  "mdi:battery",      d.AMBER),
    ]))
    out.append(d.info_popup("ov-paget", "Paget", "mdi:account", [
        ("person.paget",                       "Location",       "mdi:map-marker", d.GREEN),
        ("device_tracker.paget_s_iphone",      "iPhone",         "mdi:cellphone",  d.GREEN),
        ("sensor.paget_s_iphone_battery_level", "iPhone battery", "mdi:battery",   d.AMBER),
        ("sensor.paget_s_ipad_battery_level",   "iPad battery",   "mdi:battery",   d.AMBER),
    ]))
    out.append(d.info_popup("ov-openings", "Doors & Windows", "mdi:door-open", [
        ("binary_sensor.door_sensor",     "Door",            "mdi:door-open",   d.AMBER),
        ("binary_sensor.window_sensor",   "Window",          "mdi:window-open", d.AMBER),
        ("sensor.door_sensor_battery",    "Door battery",    "mdi:battery",     d.RED),
        ("sensor.window_sensor_battery",  "Window battery",  "mdi:battery",     d.RED),
    ]))
    out.append(d.info_popup("ov-battery", "Batteries", "mdi:battery-alert",
        [(e, l, "mdi:battery", d.AMBER) for e, l in BATTERIES]))
    out.append(d.info_popup("ov-plants", "Plants", "mdi:sprout", [
        ("sensor.soil_moisture_sensor_1_humidity",    "Fiddle leaf fig",  "mdi:sprout",      d.LEAF),
        ("sensor.moisture_sensor_2_humidity",         "Banana Leaf",      "mdi:sprout",      d.LEAF),
        ("sensor.soil_moisture_sensor_1_temperature", "Fiddle soil temp", "mdi:thermometer", d.RED),
        ("sensor.moisture_sensor_2_temperature",      "Banana soil temp", "mdi:thermometer", d.RED),
    ]))
    out.append(d.info_popup("ov-updates", "Updates", "mdi:package-up", None,
        extra=[update_tile(e, l) for e, l in UPDATE_ENTS]))
    out += device_popups()
    return out


def player_popup(hash_id, title, entity, icon):
    """Playback and volume controls with a compact now-playing summary."""
    entity_js = json.dumps(entity)
    now_playing = """[[[
      const e = states[%s]; const a = e && e.attributes || {};
      return a.media_title || (e && e.state === 'playing' ? 'Playing' : 'Nothing playing');
    ]]]""" % entity_js
    app = """[[[
      const e = states[%s]; const a = e && e.attributes || {};
      return a.app_name || a.source || (e ? e.state : '\u2014');
    ]]]""" % entity_js
    return d.info_popup(hash_id, title, icon, None, extra=[
        {"type": "tile", "entity": entity, "name": title,
         "state_content": "state", "features_position": "bottom",
         "features": [{"type": "media-player-playback"},
                      {"type": "media-player-volume-slider"}]},
        {"type": "grid", "columns": 2, "square": False, "cards": [
            d.tile_sensor(entity, "Now playing", "mdi:music-note", accent=d.VIOLET,
                          state_fn=now_playing),
            d.tile_sensor(entity, "App / source", "mdi:music-box", accent=d.VIOLET,
                          state_fn=app),
        ]},
    ])


def weather_popup():
    """Current conditions and the daily forecast inside a Bubble Card pop-up."""
    return d.info_popup("ov-weather", "Weather", "mdi:weather-partly-cloudy", None,
                        extra=[d.weather(num=46, icon=68, forecast="below", slots=5)])


def _contains_entity(value, entity):
    if isinstance(value, dict):
        return value.get("entity") == entity or any(
            _contains_entity(child, entity) for child in value.values())
    if isinstance(value, list):
        return any(_contains_entity(child, entity) for child in value)
    return False


def _cards(value, skip_popups=False):
    if isinstance(value, dict):
        if (skip_popups and value.get("type") == "custom:bubble-card"
                and value.get("card_type") == "pop-up"):
            return
        yield value
        for child in value.values():
            yield from _cards(child, skip_popups=skip_popups)
    elif isinstance(value, list):
        for child in value:
            yield from _cards(child, skip_popups=skip_popups)


def _is_top_strip(card):
    fields = card.get("custom_fields")
    return (card.get("type") == "custom:button-card"
            and isinstance(fields, dict) and len(fields) >= 10
            and all(re.fullmatch(r"p\d+", key) for key in fields))


def apply_all(cfg):
    out = []
    view = cfg["views"][0]
    for sec in view.get("sections", []):
        cards = sec.get("cards", [])
        ents = {c.get("entity") for c in cards}
        has_strip = any(c.get("_ov_top") or _is_top_strip(c) for c in cards)
        if not (ents & STATUS_ENTS) and not has_strip:
            continue
        keep = [c for c in cards
                if c.get("entity") not in STATUS_ENTS
                and not c.get("_ov_top")
                and not _is_top_strip(c)
                and not (c.get("type") == "custom:bubble-card"
                         and str(c.get("hash", "")).startswith("#ov-"))]
        strip = dict(top_strip(), _ov_top=True, grid_options={"columns": "full"})
        extras = popups()
        if _contains_entity(view, "weather.forecast_home"):
            extras.append(weather_popup())
        sec["cards"] = [strip] + extras + keep
        out.append("top strip rebuilt with %d pop-ups" % len(extras))
        break
    return out


# --- device pop-ups -------------------------------------------------------

def sw(entity, label, icon, accent=None):
    return d.tile(entity, label, icon,
                  on_bg=d.mix(accent or d.VIOLET, 16), on_ac=accent or d.VIOLET)


AMP = "media_player.living_room_amp"
AMP_SOURCES = [
    ("TV",               "mdi:television"),
    ("Line-in",          "mdi:audio-input-rca"),
    ("Sound System",     "mdi:speaker-multiple"),
    ("Check This Radio", "mdi:radio"),
    ("Rain",             "mdi:weather-pouring"),
    ("Taylor Swift",     "mdi:music"),
    ("The Era's Tour",   "mdi:music-note"),
]


def source_tile(name, icon):
    """Pick an amp source. Highlights whichever one is live."""
    sel = "states['%s'].attributes.source === %s" % (AMP, json.dumps(name))
    return {
        "type": "custom:button-card", "entity": AMP, "name": name, "icon": icon,
        "show_state": False,
        "tap_action": {"action": "call-service", "service": "media_player.select_source",
                       "service_data": {"entity_id": AMP, "source": name}},
        "styles": {
            "card": [{"height": "56px"}, {"border-radius": "16px"}, {"box-shadow": "none"},
                     {"border": "none"}, {"padding": "0 10px"}, {"font-family": d.FONT},
                     {"background": "[[[ return %s ? '%s' : '%s'; ]]]"
                                    % (sel, d.mix(d.VIOLET, 18), d.SURF)}],
            "grid": [{"grid-template-areas": '"i n"'},
                     {"grid-template-columns": "36px 1fr"}, {"width": "100%"},
                     {"align-items": "center"}, {"column-gap": "10px"}],
            "img_cell": [{"background": "[[[ return %s ? '%s' : '%s'; ]]]"
                                        % (sel, d.VIOLET, d.NEUTRAL)},
                         {"border-radius": "50%"}, {"width": "36px"}, {"height": "36px"}],
            "icon": [{"width": "19px"},
                     {"color": "[[[ return %s ? '#ffffff' : '%s'; ]]]" % (sel, d.MUTED)}],
            "name": [{"font-size": "14px"}, {"font-weight": "600"}, {"color": d.INK},
                     {"justify-self": "start"}, {"text-align": "left"},
                     {"white-space": "nowrap"}, {"overflow": "hidden"},
                     {"text-overflow": "ellipsis"}],
        },
    }


HP = "climate.living_room"
FAN_MODES = [("quiet","Quiet","mdi:volume-low"), ("low","Low","mdi:fan-speed-1"),
             ("medium_low","Medium Low","mdi:fan-speed-1"), ("medium","Medium","mdi:fan-speed-2"),
             ("medium_high","Medium High","mdi:fan-speed-3"), ("high","High","mdi:fan"),
             ("auto","Auto","mdi:fan-auto")]
SWING_MODES = [("stopped","Stopped","mdi:arrow-collapse-vertical"),
               ("rangefull","Full range","mdi:arrow-expand-vertical")]


def option_tile(entity, service, key, value, label, icon, attr):
    """Pick one value of a climate attribute; highlights the live one."""
    sel = "states['%s'].attributes.%s === %s" % (entity, attr, json.dumps(value))
    return {
        "type": "custom:button-card", "entity": entity, "name": label, "icon": icon,
        "show_state": False,
        "tap_action": {"action": "call-service", "service": service,
                       "service_data": {"entity_id": entity, key: value}},
        "styles": {
            "card": [{"height": "56px"}, {"border-radius": "16px"}, {"box-shadow": "none"},
                     {"border": "none"}, {"padding": "0 10px"}, {"font-family": d.FONT},
                     {"background": "[[[ return %s ? '%s' : '%s'; ]]]"
                                    % (sel, d.mix(d.TEAL, 18), d.SURF)}],
            "grid": [{"grid-template-areas": '"i n"'},
                     {"grid-template-columns": "36px 1fr"}, {"width": "100%"},
                     {"align-items": "center"}, {"column-gap": "10px"}],
            "img_cell": [{"background": "[[[ return %s ? '%s' : '%s'; ]]]"
                                        % (sel, d.TEAL, d.NEUTRAL)},
                         {"border-radius": "50%"}, {"width": "36px"}, {"height": "36px"}],
            "icon": [{"width": "19px"},
                     {"color": "[[[ return %s ? '#ffffff' : '%s'; ]]]" % (sel, d.MUTED)}],
            "name": [{"font-size": "14px"}, {"font-weight": "600"}, {"color": d.INK},
                     {"justify-self": "start"}, {"text-align": "left"},
                     {"white-space": "nowrap"}, {"overflow": "hidden"},
                     {"text-overflow": "ellipsis"}],
        },
    }


def attr_tile(label, icon, attr, hash_id, pretty):
    """Compact tile showing a climate attribute, tapping through to its picker."""
    return dict(
        d.tile_sensor(HP, label, icon, accent=d.TEAL,
                      state_fn="""[[[
                        const v = states['%s'].attributes.%s;
                        const M = %s;
                        return v ? (M[v] || v) : '\u2014';
                      ]]]""" % (HP, attr, json.dumps(pretty))),
        tap_action={"action": "navigate", "navigation_path": "#" + hash_id})


def volume_tile(entity, has_mute=True):
    """Native volume slider on a tinted surface.

    The slider and mute button only come from a native tile. Setting
    `--ha-card-background: transparent` on this wrapper's custom_field makes
    that nested card sit flush on the tint, which is blue normally and light red
    while muted.

    The mute button itself stays HA grey: `--control-button-background-color` is
    set by HA on an ancestor closer than this wrapper (it computes to #bdbdbd no
    matter what is set here), and `--control-slider-color` likewise. Recolouring
    them needs card-mod, which does not work on this HA version.
    """
    muted = "states['%s'].attributes.is_volume_muted === true" % entity
    if has_mute:
        bg = "[[[ return %s ? '%s' : '%s'; ]]]" % (muted, d.mix(d.RED, 13), d.mix(d.BLUE, 14))
    else:
        bg = d.mix(d.BLUE, 14)
    return {
        "type": "custom:button-card",
        "show_icon": False, "show_name": False, "show_state": False,
        "tap_action": {"action": "none"},
        "grid_options": {"columns": "full"},
        "styles": {
            "card": [{"background": bg}, {"border-radius": "20px"},
                     {"box-shadow": "none"}, {"border": "none"},
                     {"padding": "2px 4px"}, {"font-family": d.FONT}],
            "grid": [{"grid-template-areas": '"v"'}, {"width": "100%"}],
            "custom_fields": {"v": [
                {"width": "100%"}, {"justify-self": "stretch"},
                {"text-align": "left"},
                {"--ha-card-background": "transparent"},
                {"--ha-card-box-shadow": "none"},
                {"--ha-card-border-width": "0"},
            ]},
        },
        "custom_fields": {"v": {"card": {
            "type": "tile", "entity": entity,
            "name": "Volume", "icon": "mdi:volume-high",
            "state_content": "volume_level",
            "features_position": "bottom",
            "features": [{"type": "media-player-volume-slider"}]}}},
    }


ATV = "media_player.living_room"
ATV_APPS = [
    ("TV","mdi:television-classic"), ("YouTube","mdi:youtube"), ("Plex","mdi:plex"),
    ("Spotify","mdi:spotify"), ("Music","mdi:music"), ("Podcasts","mdi:podcast"),
    ("Infuse","mdi:play-box"), ("Kayo","mdi:soccer"), ("ABC iview","mdi:television-box"),
    ("SBS On Demand","mdi:television-box"), ("9Now","mdi:television-box"),
    ("7plus","mdi:television-box"), ("10","mdi:television-box"),
    ("TVNZ+","mdi:television-box"), ("ThreeNow","mdi:television-box"),
    ("Photos","mdi:image-multiple"), ("Fitness","mdi:run"), ("Arcade","mdi:gamepad-variant"),
    ("App\u00a0Store","mdi:apps"), ("Search","mdi:magnify"), ("Settings","mdi:cog"),
]


def app_tile(name, icon):
    return {
        "type": "custom:button-card", "entity": ATV, "name": name, "icon": icon,
        "show_state": False,
        "tap_action": {"action": "call-service", "service": "media_player.select_source",
                       "service_data": {"entity_id": ATV, "source": name}},
        "styles": {
            "card": [{"height": "56px"}, {"border-radius": "16px"}, {"box-shadow": "none"},
                     {"border": "none"}, {"padding": "0 10px"}, {"font-family": d.FONT},
                     {"background": d.SURF}],
            "grid": [{"grid-template-areas": '"i n"'},
                     {"grid-template-columns": "36px 1fr"}, {"width": "100%"},
                     {"align-items": "center"}, {"column-gap": "10px"}],
            "img_cell": [{"background": d.mix(d.VIOLET, 16)}, {"border-radius": "50%"},
                         {"width": "36px"}, {"height": "36px"}],
            "icon": [{"width": "19px"}, {"color": d.VIOLET}],
            "name": [{"font-size": "14px"}, {"font-weight": "600"}, {"color": d.INK},
                     {"justify-self": "start"}, {"text-align": "left"},
                     {"white-space": "nowrap"}, {"overflow": "hidden"},
                     {"text-overflow": "ellipsis"}],
        },
    }


def now_playing_tile(entity, h=118):
    """Half-width, double-height: artwork over title and artist."""
    playing = "states['%s'].state === 'playing'" % entity
    return {
        "type": "custom:button-card", "entity": entity,
        "show_icon": False, "show_name": False, "show_state": False,
        "tap_action": {"action": "more-info"},
        "styles": {
            "card": [{"height": "%dpx" % h}, {"border-radius": "16px"},
                     {"box-shadow": "none"}, {"border": "none"},
                     {"padding": "10px"}, {"font-family": d.FONT},
                     {"background": "[[[ return %s ? '%s' : '%s'; ]]]"
                                    % (playing, d.VIOLET_BG, d.SURF)}],
            "grid": [{"grid-template-areas": '"a" "t"'},
                     {"grid-template-rows": "auto 1fr"}, {"row-gap": "8px"},
                     {"width": "100%"}, {"justify-items": "center"},
                     {"align-content": "center"}],
            "custom_fields": {
                "a": [{"justify-self": "center"}],
                "t": [{"justify-self": "stretch"}, {"text-align": "center"},
                      {"min-width": "0"}, {"overflow": "hidden"}, {"width": "100%"}],
            },
        },
        "custom_fields": {
            "a": """[[[
              const e = states['%s'];
              const art = e.attributes.entity_picture;
              if (art) return `<img src="${art}" style="width:46px;height:46px;border-radius:10px;object-fit:cover;display:block">`;
              const bg = %s ? '%s' : '%s';
              const fg = %s ? '#ffffff' : '%s';
              return `<div style="width:46px;height:46px;border-radius:50%%;background:${bg};display:flex;align-items:center;justify-content:center">
                        <ha-icon icon="mdi:play-circle" style="--mdc-icon-size:23px;width:23px;height:23px;color:${fg}"></ha-icon>
                      </div>`;
            ]]]""" % (entity, playing, d.VIOLET, d.NEUTRAL, playing, d.MUTED),
            "t": """[[[
              const e = states['%s'];
              const t = e.attributes.media_title;
              const a = e.attributes.media_artist || e.attributes.app_name || '';
              const sub = t ? a : (e.state === 'playing' ? 'Playing' : 'Nothing playing');
              return `<div style="font-size:13px;font-weight:600;color:%s;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t || 'Now playing'}</div>
                      <div style="font-size:11.5px;color:%s;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px">${sub}</div>`;
            ]]]""" % (entity, d.INK, d.MUTED),
        },
    }


def app_picker_tile(h=118):
    """Mirrors now_playing_tile's shape so the two sit as an even pair."""
    return {
        "type": "custom:button-card", "entity": ATV,
        "show_icon": False, "show_name": False, "show_state": False,
        "styles": {
            "card": [{"height": "%dpx" % h}, {"border-radius": "16px"},
                     {"box-shadow": "none"}, {"border": "none"},
                     {"padding": "10px"}, {"font-family": d.FONT},
                     {"background": d.mix(d.VIOLET, 13)}],
            "grid": [{"grid-template-areas": '"a" "t"'},
                     {"grid-template-rows": "auto 1fr"}, {"row-gap": "8px"},
                     {"width": "100%"}, {"justify-items": "center"},
                     {"align-content": "center"}],
            "custom_fields": {
                "a": [{"justify-self": "center"}],
                "t": [{"justify-self": "stretch"}, {"text-align": "center"},
                      {"min-width": "0"}, {"overflow": "hidden"}, {"width": "100%"}],
            },
        },
        "custom_fields": {
            "a": """[[[ return `<div style="width:46px;height:46px;border-radius:50%%;background:%s;display:flex;align-items:center;justify-content:center">
                        <ha-icon icon="mdi:apps" style="--mdc-icon-size:23px;width:23px;height:23px;color:#ffffff"></ha-icon>
                      </div>`; ]]]""" % d.VIOLET,
            "t": """[[[
              const a = states['%s'].attributes;
              return `<div style="font-size:13px;font-weight:600;color:%s">App</div>
                      <div style="font-size:11.5px;color:%s;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px">${a.source || 'Choose app'}</div>`;
            ]]]""" % (ATV, d.INK, d.MUTED),
        },
    }


PLANTS = [
    ("plant-fiddle", "Fiddle leaf fig", "sensor.soil_moisture_sensor_1_humidity",
     "sensor.soil_moisture_sensor_1_temperature", "sensor.soil_moisture_sensor_1_battery"),
    ("plant-banana", "Banana Leaf", "sensor.moisture_sensor_2_humidity",
     "sensor.moisture_sensor_2_temperature", "sensor.moisture_sensor_2_battery"),
]


def plant_popup(slug, name, moisture, temp, battery):
    """Per-plant pop-up: a week of moisture, then the current readings.

    mini-graph-card (installed) rather than HA's history-graph - it draws a clean
    line with no axis furniture, which suits these cards.
    """
    return d.info_popup("ov-" + slug, name, "mdi:sprout", None, extra=[
        {"type": "custom:mini-graph-card",
         "entities": [{"entity": moisture, "name": "Moisture"}],
         "name": name, "icon": "mdi:water-percent",
         "hours_to_show": 168, "points_per_hour": 1,
         "line_color": d.LEAF, "line_width": 3,
         "font_size": 70, "animate": True,
         "show": {"labels": True, "extrema": True, "fill": "fade", "icon": False},
         "grid_options": {"columns": "full"}},
        {"type": "custom:mini-graph-card",
         "entities": [{"entity": temp, "name": "Soil temp"}],
         "name": "Soil temperature", "icon": "mdi:thermometer",
         "hours_to_show": 168, "points_per_hour": 1,
         "line_color": d.RED, "line_width": 3,
         "font_size": 70, "animate": True,
         "show": {"labels": True, "extrema": True, "fill": "fade", "icon": False},
         "grid_options": {"columns": "full"}},
        {"type": "grid", "columns": 2, "square": False, "cards": [
            d.tile_sensor(moisture, "Moisture", "mdi:water-percent", accent=d.LEAF,
                          state_fn=d.PRETTY_STATE % moisture),
            d.tile_sensor(temp, "Soil temp", "mdi:thermometer", accent=d.RED,
                          state_fn=d.PRETTY_STATE % temp),
            d.tile_sensor(battery, "Battery", "mdi:battery", accent=d.AMBER,
                          state_fn=d.PRETTY_STATE % battery),
            dict(d.tile_sensor("binary_sensor.any_plant_needs_water", "Needs water",
                               "mdi:watering-can", accent=d.BLUE,
                               state_fn=d.PRETTY_STATE % "binary_sensor.any_plant_needs_water")),
        ]},
    ])


def device_popups():
    heat = d.info_popup("ov-heatpump", "Heatpump", "mdi:sun-snowflake-variant", None, extra=[
        {"type": "grid", "columns": 2, "square": False, "cards": [
            attr_tile("Fan speed", "mdi:fan", "fan_mode", "ov-hp-fan",
                      {k: lbl for k, lbl, _ in FAN_MODES}),
            attr_tile("Swing", "mdi:arrow-expand-vertical", "swing_mode", "ov-hp-swing",
                      {k: lbl for k, lbl, _ in SWING_MODES}),
        ]},
        {"type": "grid", "columns": 2, "square": False, "cards": [
            sw("switch.living_room_climate_react", "Climate React", "mdi:auto-mode", d.TEAL),
            sw("switch.living_room_timer", "Timer", "mdi:timer-outline", d.TEAL),
        ]},
        {"type": "conditional",
         "conditions": [{"condition": "state", "entity": "switch.living_room_timer",
                         "state": "on"}],
         "card": {"type": "grid", "columns": 1, "square": False, "cards": [
             d.tile_sensor("sensor.living_room_timer_end_time", "Timer ends",
                           "mdi:timer-outline", accent=d.BLUE)]}},
        {"type": "grid", "columns": 2, "square": False, "cards": [
            d.tile_sensor("binary_sensor.living_room_filter_clean_required", "Filter",
                          "mdi:air-filter", accent=d.RED,
                          state_fn=d.PRETTY_STATE % "binary_sensor.living_room_filter_clean_required"),
            d.tile_scene("button.living_room_reset_filter", "Reset filter",
                         "mdi:air-filter", accent=d.TEAL),
        ]},
    ])

    amp = d.info_popup("ov-amp", "Amp", "mdi:speaker", None, extra=[
        # volume on its own, stripped of the name and playback state
        volume_tile(AMP, has_mute=True),
        # input + source, same compact shape as the switches below
        {"type": "grid", "columns": 2, "square": False, "cards": [
            d.tile_sensor("sensor.living_room_amp_audio_input_format", "Input",
                          "mdi:audio-input-rca", accent=d.VIOLET,
                          state_fn=d.PRETTY_STATE % "sensor.living_room_amp_audio_input_format"),
            # a dropdown will not fit in a 56px tile, so this opens a pop-up
            # of the sources instead
            dict(d.tile_sensor("media_player.living_room_amp", "Source", "mdi:import",
                               accent=d.VIOLET,
                               state_fn="""[[[
                                 const a = states['media_player.living_room_amp'].attributes;
                                 return a.source || '\u2014';
                               ]]]"""),
                 tap_action={"action": "navigate",
                             "navigation_path": "#ov-amp-source"}),
        ]},
        {"type": "grid", "columns": 2, "square": False, "cards": [
            sw("switch.living_room_amp_speech_enhancement", "Speech", "mdi:account-voice"),
            sw("switch.living_room_amp_night_sound", "Night sound", "mdi:weather-night", d.INDIGO),
            sw("switch.living_room_amp_loudness", "Loudness", "mdi:volume-vibrate"),
            sw("switch.living_room_amp_crossfade", "Crossfade", "mdi:shuffle-variant"),
            sw("switch.living_room_amp_subwoofer_enabled", "Subwoofer", "mdi:speaker-wireless"),
            sw("switch.living_room_amp_surround_enabled", "Surround", "mdi:surround-sound"),
        ]},
        {"type": "grid", "columns": 2, "square": False, "cards": [
            {"type": "tile", "entity": "number.living_room_amp_bass", "name": "Bass",
             "features_position": "bottom", "features": [{"type": "numeric-input",
                                                          "style": "slider"}]},
            {"type": "tile", "entity": "number.living_room_amp_treble", "name": "Treble",
             "features_position": "bottom", "features": [{"type": "numeric-input",
                                                          "style": "slider"}]},
        ]},
    ])

    atv = d.info_popup("ov-appletv", "Apple TV", "mdi:television", None, extra=[
        # App and Now playing as a matched pair: both half width, both 118px
        {"type": "grid", "columns": 2, "square": False, "cards": [
            dict(app_picker_tile(), tap_action={"action": "navigate",
                                                "navigation_path": "#ov-atv-apps"}),
            now_playing_tile(ATV),
        ]},
        {"type": "grid", "columns": 1, "square": False, "cards": [
            sw("automation.living_room_lights_dim_for_apple_tv", "Dim lights on play",
               "mdi:lightbulb-auto", d.AMBER),
        ]},
    ])

    sources = d.info_popup("ov-amp-source", "Amp source", "mdi:import", None, extra=[
        {"type": "grid", "columns": 2, "square": False,
         "cards": [source_tile(n, i) for n, i in AMP_SOURCES]},
    ])
    fan = d.info_popup("ov-hp-fan", "Fan speed", "mdi:fan", None, extra=[
        {"type": "grid", "columns": 2, "square": False,
         "cards": [option_tile(HP, "climate.set_fan_mode", "fan_mode", k, lbl, ic, "fan_mode")
                   for k, lbl, ic in FAN_MODES]}])
    swing = d.info_popup("ov-hp-swing", "Swing", "mdi:arrow-expand-vertical", None, extra=[
        {"type": "grid", "columns": 2, "square": False,
         "cards": [option_tile(HP, "climate.set_swing_mode", "swing_mode", k, lbl, ic, "swing_mode")
                   for k, lbl, ic in SWING_MODES]}])
    apps = d.info_popup("ov-atv-apps", "Apple TV apps", "mdi:apps", None, extra=[
        {"type": "grid", "columns": 2, "square": False,
         "cards": [app_tile(n, i) for n, i in ATV_APPS]}])
    display = player_popup("ov-kitchen-display", "Kitchen Display",
                           "media_player.kitchen_display", "mdi:monitor")
    kitchen_homepod = player_popup("ov-homepod-kitchen", "Kitchen HomePod",
                                   "media_player.homepod_mini_kitchen", "mdi:speaker")
    bedroom_homepod = player_popup("ov-homepod-bedroom", "Bedroom HomePod",
                                   "media_player.homepod_mini_master_bedroom", "mdi:speaker")
    return [heat, fan, swing, amp, sources, atv, apps,
            display, kitchen_homepod, bedroom_homepod] + [plant_popup(*p) for p in PLANTS]


NAV_TARGETS = {
    "climate.living_room": "ov-heatpump",
    "media_player.living_room_amp": "ov-amp",
    "media_player.living_room": "ov-appletv",
    "media_player.kitchen_display": "ov-kitchen-display",
    "media_player.homepod_mini_kitchen": "ov-homepod-kitchen",
    "media_player.homepod_mini_master_bedroom": "ov-homepod-bedroom",
}


def attach_nav(cfg):
    """Point supported card roots at their custom pop-ups."""
    done = []
    views = cfg.get("views", [])
    panel = bool(views and views[0].get("type") == "panel")
    weather_popup_exists = any(c.get("type") == "custom:bubble-card"
                               and c.get("hash") == "#ov-weather"
                               for c in _cards(cfg))
    kitchen_weather_view = any(v.get("path") == "weather" for v in views)

    for view in views:
        for sec in view.get("sections", []):
            for c in sec.get("cards", []):
                h = NAV_TARGETS.get(c.get("entity"))
                if h and c.get("type") == "custom:button-card":
                    c["tap_action"] = {"action": "navigate", "navigation_path": "#" + h}
                    done.append(c["entity"])

    if not panel:
        for c in _cards(cfg, skip_popups=True):
            entity = c.get("entity")
            fields = c.get("custom_fields")
            if (entity in NAV_TARGETS and c.get("type") == "custom:button-card"
                    and isinstance(fields, dict) and {"a", "t", "c"}.issubset(fields)):
                c["tap_action"] = {"action": "navigate",
                                    "navigation_path": "#" + NAV_TARGETS[entity]}
                if entity not in done:
                    done.append(entity)
            elif (entity == "weather.forecast_home" and weather_popup_exists
                  and c.get("type") == "custom:button-card"):
                c["tap_action"] = {"action": "navigate", "navigation_path": "#ov-weather"}
    elif views and views[0].get("path") == "kitchen" and kitchen_weather_view:
        for c in _cards(views[0]):
            if c.get("entity") == "weather.forecast_home" and c.get("type") == "custom:button-card":
                c["tap_action"] = {"action": "navigate",
                                    "navigation_path": "/ha-kitchen/weather"}
    return done
