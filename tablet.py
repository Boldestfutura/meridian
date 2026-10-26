"""Tablet dashboard: a control centre, not the phone layout widened.

Handheld iPad, so scrolling is fine and both orientations must work. Two
sections: a fixed rail (weather, heatpump, status, scenes) and a room panel
whose contents switch via `input_select.tablet_room`. At portrait width HA
stacks the two sections; in landscape they sit side by side.
"""
import design as d
import scenes

ROOM = "input_select.tablet_room"
ROOMS = ["Kitchen", "Living Room", "Master Bedroom", "Guest"]
ICONS = {"Kitchen": "mdi:fridge", "Living Room": "mdi:sofa",
         "Master Bedroom": "mdi:bed-king", "Guest": "mdi:bed-double"}
SHORT = {"Kitchen": "Kitchen", "Living Room": "Living", "Master Bedroom": "Bedroom",
         "Guest": "Guest"}
GROUPS = {"Kitchen": "light.kitchen_lights", "Living Room": "light.living_room",
          "Master Bedroom": "light.master_bedroom_lights",
          "Guest": "light.guest_bedroom_lamp"}


def span(card, cols, entity=None):
    c = dict(card, grid_options={"columns": cols})
    return d.only_when_available(c, entity) if entity else c


def q(s):
    return "'" + s.replace("'", "\\'") + "'"


def tab(room):
    sel = "states['%s'].state === '%s'" % (ROOM, room)
    return {
        "type": "custom:button-card", "entity": ROOM,
        "name": SHORT[room], "icon": ICONS[room], "show_state": False,
        "tap_action": {"action": "call-service", "service": "input_select.select_option",
                       "service_data": {"entity_id": ROOM, "option": room}},
        "styles": {
            "card": [{"height": "62px"}, {"border-radius": "16px"}, {"box-shadow": "none"},
                     {"border": "none"}, {"padding": "6px 4px"}, {"font-family": d.FONT},
                     {"background": "[[[ return %s ? '%s' : '%s'; ]]]" % (sel, d.AMBER, d.SURF)}],
            "icon": [{"width": "22px"},
                     {"color": "[[[ return %s ? '#ffffff' : '%s'; ]]]" % (sel, d.MUTED)}],
            "name": [{"font-size": "12.5px"}, {"font-weight": "600"}, {"margin-top": "3px"},
                     {"white-space": "nowrap"}, {"overflow": "hidden"},
                     {"text-overflow": "ellipsis"},
                     {"color": "[[[ return %s ? '#ffffff' : '%s'; ]]]" % (sel, d.INK)}],
        },
    }


SCENES = {
    "Living Room": [
        ("scene.new_scene",              "Movie Time", "mdi:movie-open",          d.RED),
    ],
    # The Hue bridge's Bright/Dimmed/Relax/Read/Nightlight scenes went with the
    # bridge. Room scenes now live in the shared strip in scenes.py.
    "Master Bedroom": [],
    "Kitchen": [],
    "Guest": [],
}


def tall(card):
    """Two grid rows (56 + 8 + 56 = 120px), level with two stacked tiles."""
    return dict(card, grid_options={"rows": 2})


def room_cards(room, cards):
    """Every card of a room panel as its own section card, shown only while
    that room's tab is selected.

    This used to be one conditional card holding a fixed grid, which welded
    the tiles together: none of them could be dragged in the UI, and a tile
    beside a media card was stranded at the top of a tall row. Separate cards
    with a visibility rule switch rooms exactly the same way and can be
    rearranged freely; tall() cards span two rows so tiles stack beside them.
    """
    shown = [{"condition": "state", "entity": ROOM, "state": room}]
    sc = SCENES.get(room) or []
    if sc:
        cards = cards + [dict(d.room_header("Scenes", "mdi:palette"),
                              grid_options={"columns": 12})] \
                      + [d.tile_scene(e, n, i, accent=a) for e, n, i, a in sc]
    out = []
    for c in cards:
        g = {"columns": 6, **c.get("grid_options", {})}
        out.append(dict(c, grid_options=g, visibility=shown + c.get("visibility", [])))
    return out


def panels():
    L = d.tile
    return {
        "Kitchen": [
            tall(d.media_card("media_player.kitchen_display", "Display", icon="mdi:monitor",
                              controls=("vol_down", "mute", "vol_up"))),
            tall(d.media_card("media_player.homepod_mini_kitchen", "HomePod",
                              controls=("play", "vol_down", "vol_up", "mute"))),
            L("light.kitchen_light_2", "Kitchen Light", "mdi:lightbulb"),
            L("light.bench_lamp", "Bench Lamp", "mdi:lightbulb"),
            L("light.kitchen_lights", "All Kitchen", "mdi:lightbulb-group"),
        ],
        "Living Room": [
            L("light.couch_lamp", "Couch Lamp", "mdi:lightbulb"),
            L("light.tv_lamp", "TV Lamp", "mdi:lightbulb"),
            L("light.corner_light", "Corner Light", "mdi:lightbulb"),
            L("light.living_room", "All Living Room", "mdi:lightbulb-group"),
            tall(d.media_card("media_player.living_room_amp", "Amp",
                              controls=("play", "vol_down", "vol_up", "mute"))),
            tall(d.media_card("media_player.living_room", "Apple TV", icon="mdi:television",
                              controls=("power", "play"))),
            dict(d.tile_sensor("sensor.soil_moisture_sensor_1_humidity", "Fiddle leaf fig",
                          "mdi:sprout", accent=d.LEAF),
                 tap_action={"action":"navigate","navigation_path":"#ov-plant-fiddle"}),
            dict(d.tile_sensor("sensor.moisture_sensor_2_humidity", "Banana Leaf",
                          "mdi:sprout", accent=d.LEAF),
                 tap_action={"action":"navigate","navigation_path":"#ov-plant-banana"}),
            L("switch.smart_plug", "Smart Plug", "mdi:power-plug",
              on_bg=d.BLUE_BG, on_ac=d.BLUE),
        ],
        "Master Bedroom": [
            L("light.bedside_left", "Bedside Left", "mdi:lightbulb"),
            L("light.bedside_right", "Bedside Right", "mdi:lightbulb"),
            L("light.mushroom_lamp", "Mushroom Lamp", "mdi:lightbulb"),
            L("light.master_bedroom_lights", "All Bedroom", "mdi:lightbulb-group"),
            tall(d.media_card("media_player.homepod_mini_master_bedroom", "HomePod",
                              controls=("play", "vol_down", "vol_up"))),
            tall(d.light("switch.tp_link_power_strip_6e3f_dehumidifier", "Dehumidifier",
                         118, circle=46, glyph=23, icon="mdi:air-humidifier",
                         on_bg=d.BLUE_BG, on_ac=d.BLUE)),
        ],
        "Guest": [
            L("light.guest_bedroom_lamp", "Guest Lamp", "mdi:lightbulb"),
        ],
    }


def room_header_card():
    """One header that renames itself with the selected room."""
    return {
        "type": "custom:button-card", "entity": ROOM,
        "show_icon": False, "show_name": False, "show_state": False,
        "tap_action": {"action": "none"},
        "styles": {
            "card": [{"background": "transparent"}, {"box-shadow": "none"},
                     {"border": "none"}, {"height": "40px"}, {"padding": "0 2px"},
                     {"font-family": d.FONT}],
            "grid": [{"grid-template-areas": '"n g"'},
                     {"grid-template-columns": "1fr auto"}, {"align-items": "center"}],
            "custom_fields": {"n": [{"justify-self": "start"}],
                              "g": [{"justify-self": "end"}]},
        },
        "custom_fields": {
            "n": """[[[
              const r = states['%s'].state;
              const I = %s;
              return `<div style="display:flex;align-items:center;gap:9px">
                <ha-icon icon="${I[r]||'mdi:home'}" style="--mdc-icon-size:19px;width:19px;height:19px;color:%s"></ha-icon>
                <span style="font-size:16px;font-weight:700;color:%s;letter-spacing:-.01em">${r}</span></div>`;
            ]]]""" % (ROOM, __import__("json").dumps(ICONS), d.MUTED, d.INK),
            "g": {"card": {
                "type": "custom:button-card", "entity": ROOM,
                "icon": "mdi:lightbulb-group", "show_name": False, "show_state": False,
                "tap_action": {"action": "call-service", "service": "light.toggle",
                               "service_data": {"entity_id": """[[[
                                 const G = %s; return G[states['%s'].state];
                               ]]]""" % (__import__("json").dumps(GROUPS), ROOM)}},
                "styles": {
                    "card": [{"width": "40px"}, {"height": "32px"}, {"border-radius": "11px"},
                             {"box-shadow": "none"}, {"border": "none"}, {"padding": "0"},
                             {"background": """[[[
                                const G = %s; const g = states[G[states['%s'].state]];
                                return (g && g.state === 'on') ? '%s' : '%s';
                             ]]]""" % (__import__("json").dumps(GROUPS), ROOM, d.AMBER, d.NEUTRAL)}],
                    "icon": [{"width": "18px"},
                             {"color": """[[[
                                const G = %s; const g = states[G[states['%s'].state]];
                                return (g && g.state === 'on') ? '#ffffff' : '%s';
                             ]]]""" % (__import__("json").dumps(GROUPS), ROOM, d.MUTED)}],
                }}},
        },
    }


def build():
    import patch3
    # bubbles get their own full-width band above both columns
    strip = {"type": "grid", "column_span": 2,
             "cards": [span(status_strip(), "full"),
                       dict(patch3.weather_popup(), grid_options={"columns": "full"})]}
    rail = {"type": "grid", "cards": [
        span(d.weather(num=52, icon=86), 12),
        span(d.heatpump_stepper(), 12, "climate.living_room"),
        span(d.room_header("Scenes", "mdi:creation"), 12),
        span(d.pill_strip([{"card": c} for c in scenes.cards()],
                          rows=2, col_w=168, gap=8, pad="0"), 12),
    ]}
    P = panels()
    rooms_section = {"type": "grid", "cards":
        [span(t, 3) for t in (tab(r) for r in ROOMS)]
        + [span(room_header_card(), 12)]
        + [c for r in ROOMS for c in room_cards(r, P[r])]}
    return {"views": [{
        "title": "Home", "path": "home", "type": "sections",
        "theme": "Overlook", "max_columns": 2,
        "dense_section_placement": False, "badges": [],
        "sections": [strip, rail, rooms_section],
    }]}


def status_strip():
    import patch3
    return patch3.top_strip()
