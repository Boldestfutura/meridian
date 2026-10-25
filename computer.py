"""Computer dashboard: the whole house at once, no tabs, no scrolling.

Targets two viewports: a 1920x1080 desktop (~1920x950 in a maximised browser)
and an M1 MacBook Air (CSS viewport 1440x900, so ~1440x820). HA sections caps a
column near 500px and drops columns to fit, so this gets 4 columns at 1920 and
3 at 1440 - the column contents are ordered so that reflow stays sensible.
"""
import design as d
import scenes
import patch3

FULL = 12
HALF = 6


def span(card, cols, entity=None):
    c = dict(card, grid_options={"columns": cols})
    return d.only_when_available(c, entity) if entity else c


def light(entity, label):
    return span(d.tile(entity, label, "mdi:lightbulb"), HALF, entity)


def media(entity, label, controls, icon="mdi:speaker"):
    return span(d.media_card(entity, label, controls=controls, icon=icon), FULL, entity)


def sections():
    return [
        # one band of bubbles across every column
        {"type": "grid", "column_span": 4,
         "cards": [dict(patch3.top_strip(), grid_options={"columns": "full"})]
                  + [dict(p, grid_options={"columns": "full"}) for p in patch3.popups()]
                  + [dict(patch3.weather_popup(), grid_options={"columns": "full"})]},

        {"type": "grid", "cards": [
            span(d.room_header("Outside", "mdi:weather-partly-cloudy"), FULL),
            span(d.weather(num=44, icon=64), FULL),
            span(d.room_header("Heatpump", "mdi:sun-snowflake-variant",), FULL),
            span(d.heatpump_stepper(show_label=False), FULL, "climate.living_room"),
            span(d.room_header("Scenes", "mdi:creation"), FULL),
            span(d.pill_strip([{"card": c} for c in scenes.cards()],
                          rows=2, col_w=168, gap=8, pad="0"), FULL),
        ]},

        {"type": "grid", "cards": [
            span(d.room_header("Kitchen", "mdi:fridge", "light.kitchen_lights"), FULL),
            light("light.kitchen_light_2", "Kitchen Light"),
            light("light.bench_lamp", "Bench Lamp"),
            media("media_player.kitchen_display", "Display",
                  ("vol_down", "mute", "vol_up"), icon="mdi:monitor"),
            media("media_player.homepod_mini_kitchen", "HomePod",
                  ("play", "vol_down", "vol_up", "mute")),
        ]},

        {"type": "grid", "cards": [
            span(d.room_header("Living Room", "mdi:sofa", "light.living_room"), FULL),
            light("light.couch_lamp", "Couch Lamp"),
            light("light.tv_lamp", "TV Lamp"),
            light("light.corner_light", "Corner Light"),
            span(d.tile("switch.smart_plug", "Smart Plug", "mdi:power-plug",
                        on_bg=d.BLUE_BG, on_ac=d.BLUE), HALF, "switch.smart_plug"),
            media("media_player.living_room_amp", "Amp",
                  ("play", "vol_down", "vol_up", "mute")),
            media("media_player.living_room", "Apple TV", ("power", "play"),
                  icon="mdi:television"),
            span(dict(d.tile_sensor("sensor.soil_moisture_sensor_1_humidity", "Fiddle leaf fig",
                                    "mdi:sprout", accent=d.LEAF),
                      tap_action={"action": "navigate",
                                  "navigation_path": "#ov-plant-fiddle"}), HALF),
            span(dict(d.tile_sensor("sensor.moisture_sensor_2_humidity", "Banana Leaf",
                                    "mdi:sprout", accent=d.LEAF),
                      tap_action={"action": "navigate",
                                  "navigation_path": "#ov-plant-banana"}), HALF),
        ]},

        {"type": "grid", "cards": [
            span(d.room_header("Master Bedroom", "mdi:bed-king", "light.master_bedroom_lights"), FULL),
            light("light.bedside_left", "Bedside Left"),
            light("light.bedside_right", "Bedside Right"),
            light("light.mushroom_lamp", "Mushroom"),
            span(d.tile("switch.tp_link_power_strip_6e3f_dehumidifier", "Dehumidifier",
                        "mdi:air-humidifier", on_bg=d.BLUE_BG, on_ac=d.BLUE), HALF,
                 "switch.tp_link_power_strip_6e3f_dehumidifier"),
            media("media_player.homepod_mini_master_bedroom", "HomePod",
                  ("play", "vol_down", "vol_up")),
            span(d.room_header("Guest Bedroom", "mdi:bed-double", "light.guest_bedroom_lamp"), FULL),
            light("light.guest_bedroom_lamp", "Guest Lamp"),
        ]},
    ]


def build():
    cfg = {"views": [{
        "title": "Home", "path": "home", "type": "sections",
        "theme": "Overlook", "max_columns": 4,
        "dense_section_placement": True, "badges": [],
        "sections": sections(),
    }]}
    patch3.attach_nav(cfg)
    return cfg
