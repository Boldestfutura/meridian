#!/usr/bin/env python3
"""A generic starting point: describe a home once, get all four dashboards.

Every entity id below is a **placeholder**. Replace them with real ones from the
target install (see AGENTS.md for how to inventory it) and this generates the
phone, tablet, computer and wall-panel layouts without touching design.py.

    python3 examples/generic.py --check          # build, print sizes, write nothing
    python3 examples/generic.py --deploy phone   # needs ../deploy.py style env

Keep rooms in the order you want them to read. Any key may be omitted or empty.
"""
import os, sys, json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import design as d

# ---------------------------------------------------------------------------
# Describe the home. This is the only part you edit.
# ---------------------------------------------------------------------------

# design.py has three entities baked into its templates; point them at yours.
d.WEATHER_ENTITY = "weather.home"
d.CLIMATE_ENTITY = "climate.living_room"   # the thermostat the heatpump card drives
d.TIME_ENTITY    = "sensor.time"           # from the Time & Date integration

WEATHER = d.WEATHER_ENTITY
CLIMATE = d.CLIMATE_ENTITY               # set to None if there is no thermostat
PEOPLE  = [("person.alex", "Alex"), ("person.sam", "Sam")]

# shown as pills along the top; the alerts only appear while they are `on`
STATUS_ALERTS = [
    ("update.home_assistant_core_update", "Core update",  "mdi:package-up",     d.RED),
    ("binary_sensor.any_battery_low",     "Battery low",  "mdi:battery-alert",  d.RED),
]
# a bubble per sensor type, showing the range across the listed entities
READINGS = [
    ("Temperature", "mdi:thermometer",   d.RED,   1,
     [("sensor.kitchen_temperature", "Kitchen"), ("sensor.bedroom_temperature", "Bedroom")]),
    ("Humidity",    "mdi:water-percent", d.BLUE,  0,
     [("sensor.kitchen_humidity", "Kitchen"), ("sensor.bedroom_humidity", "Bedroom")]),
]

SCENES = [
    ("script.goodnight",    "Goodnight",   "mdi:weather-night",    d.INDIGO),
    ("script.evening",      "Evening",     "mdi:lightbulb-on-30",  d.AMBER),
    ("script.movie_time",   "Movie",       "mdi:movie-open",       d.MAUVE),
    ("script.all_off",      "All Off",     "mdi:power",            d.TEAL),
]

ROOMS = [
    {"name": "Kitchen", "icon": "mdi:fridge", "group": "light.kitchen",
     "lights": [("light.kitchen_main", "Main"), ("light.kitchen_bench", "Bench")],
     "media":  [("media_player.kitchen_speaker", "Speaker",
                 ("play", "vol_down", "vol_up", "mute"), "mdi:speaker")]},

    {"name": "Living Room", "icon": "mdi:sofa", "group": "light.living_room",
     "lights": [("light.living_room_lamp", "Lamp"), ("light.living_room_corner", "Corner")],
     "media":  [("media_player.living_room_tv", "TV", ("power", "play"), "mdi:television"),
                ("media_player.living_room_speaker", "Speaker",
                 ("play", "vol_down", "vol_up", "mute"), "mdi:speaker")],
     "switches": [("switch.living_room_plug", "Plug", "mdi:power-plug")],
     "sensors":  [("sensor.plant_moisture", "Plant", "mdi:sprout", d.LEAF)]},

    {"name": "Bedroom", "icon": "mdi:bed-king", "group": "light.bedroom",
     "lights": [("light.bedroom_left", "Left"), ("light.bedroom_right", "Right")],
     "media":  [("media_player.bedroom_speaker", "Speaker",
                 ("play", "vol_down", "vol_up"), "mdi:speaker")]},
]

# ---------------------------------------------------------------------------
# Everything below turns that into dashboards. You should not need to edit it.
# ---------------------------------------------------------------------------

FULL, HALF = 12, 6


def span(card, cols, entity=None):
    c = dict(card, grid_options={"columns": cols})
    return d.only_when_available(c, entity) if entity else c


def q(s):
    return "'" + s.replace("'", "\\'") + "'"


def status_strip():
    items = []
    for ent, name in PEOPLE:
        home = "states['%s'].state === 'home'" % ent
        items.append({"card": d.pill(ent, "mdi:account",
                                     "%s ? %s : %s" % (home, q(name), q(name + " away")),
                                     accent=d.GREEN, on_test=home, off_accent=d.VIOLET)})
    for label, icon, accent, dec, ents in READINGS:
        items.append({"card": d.range_pill(label, icon, accent, [e for e, _ in ents],
                                           "gen-" + label.lower(), dec)})
    for ent, label, icon, accent in STATUS_ALERTS:
        items.append({"card": d.pill(ent, icon, q(label), accent=accent), "cond": ent})
    return d.pill_strip(items)


def popups():
    return [d.sensor_popup("gen-" + label.lower(), label, icon, ents, accent)
            for label, icon, accent, _, ents in READINGS]


def room_cards(r, media_width=FULL):
    out = [span(d.room_header(r["name"], r["icon"], r.get("group")), FULL)]
    for ent, label in r.get("lights", []):
        out.append(span(d.tile(ent, label, "mdi:lightbulb"), HALF, ent))
    for ent, label, icon, *_ in r.get("switches", []):
        out.append(span(d.tile(ent, label, icon, on_bg=d.BLUE_BG, on_ac=d.BLUE), HALF, ent))
    for ent, label, controls, icon in r.get("media", []):
        out.append(span(d.media_card(ent, label, controls=controls, icon=icon),
                        media_width, ent))
    for ent, label, icon, accent in r.get("sensors", []):
        out.append(span(d.tile_sensor(ent, label, icon, accent=accent), HALF, ent))
    return out


def scene_cards():
    return [span(d.tile_scene(e, n, i, accent=a), HALF) for e, n, i, a in SCENES]


def _strip_section(column_span=None):
    sec = {"type": "grid",
           "cards": [dict(status_strip(), grid_options={"columns": "full"})]
                    + [dict(p, grid_options={"columns": "full"}) for p in popups()]}
    if column_span:
        sec["column_span"] = column_span
    return sec


def phone():
    secs = [_strip_section(),
            {"type": "grid", "cards": [span(d.room_header("Scenes", "mdi:creation"), FULL)]
                                      + scene_cards()}]
    if CLIMATE:
        secs[1]["cards"].insert(0, span(d.heatpump_stepper(), FULL, CLIMATE))
    secs += [{"type": "grid", "cards": room_cards(r)} for r in ROOMS]
    return _view(secs, max_columns=1)


def tablet():
    rail = {"type": "grid", "cards": [span(d.weather(num=52, icon=86), FULL)]}
    if CLIMATE:
        rail["cards"].append(span(d.heatpump_stepper(), FULL, CLIMATE))
    rail["cards"] += [span(d.room_header("Scenes", "mdi:creation"), FULL)] + scene_cards()
    rooms = {"type": "grid", "cards": [c for r in ROOMS for c in room_cards(r, HALF)]}
    return _view([_strip_section(column_span=2), rail, rooms], max_columns=2)


def computer():
    first = {"type": "grid", "cards": [
        span(d.room_header("Outside", "mdi:weather-partly-cloudy"), FULL),
        span(d.weather(num=44, icon=64), FULL)]}
    if CLIMATE:
        first["cards"] += [span(d.room_header("Climate", "mdi:thermostat"), FULL),
                           span(d.heatpump_stepper(show_label=False), FULL, CLIMATE)]
    first["cards"] += [span(d.room_header("Scenes", "mdi:creation"), FULL)] + scene_cards()
    secs = [_strip_section(column_span=len(ROOMS) + 1), first]
    secs += [{"type": "grid", "cards": room_cards(r)} for r in ROOMS]
    return _view(secs, max_columns=len(ROOMS) + 1)


def panel():
    """Fixed wall display. Sized for 1024x600; adjust the heights for other screens."""
    ROW, LIGHTS = 230, 196
    rows = {"type": "vertical-stack", "cards": [
        d.header("Home", big=30, clock=28, h=64, middle=status_strip()),
        {"type": "horizontal-stack", "cards": scene_cards()[:4]},
        {"type": "horizontal-stack",
         "cards": [d.weather(ROW, num=46, icon=72)]
                  + ([d.heatpump_stepper()] if CLIMATE else [])},
        {"type": "horizontal-stack",
         "cards": [d.light(r["group"], r["name"], LIGHTS, circle=52, glyph=26)
                   for r in ROOMS if r.get("group")]},
    ]}
    wrapper = {"type": "custom:button-card",
               "show_icon": False, "show_name": False, "show_state": False,
               "tap_action": {"action": "none"},
               "styles": {"card": [{"background": "transparent"}, {"box-shadow": "none"},
                                   {"border": "none"}, {"padding": "6px 16px 16px"}],
                          "grid": [{"grid-template-areas": '"c"'}],
                          "custom_fields": {"c": [{"width": "100%"},
                                                  {"justify-self": "stretch"}]}},
               "custom_fields": {"c": {"card": rows}}}
    return {"views": [{"title": "Home", "path": "home", "type": "panel",
                       "theme": "Overlook", "badges": [], "cards": [wrapper]}]}


def _view(sections, max_columns):
    return {"views": [{"title": "Home", "path": "home", "type": "sections",
                       "theme": "Overlook", "max_columns": max_columns,
                       "dense_section_placement": True, "badges": [],
                       "sections": sections}]}


BUILDERS = {"phone": phone, "tablet": tablet, "computer": computer, "panel": panel}

if __name__ == "__main__":
    for name, fn in BUILDERS.items():
        cfg = fn()
        n = sum(len(s.get("cards", [])) for s in cfg["views"][0].get("sections", [])) \
            or len(cfg["views"][0].get("cards", []))
        print("  %-9s %6d bytes, %2d top-level cards" % (name, len(json.dumps(cfg)), n))
