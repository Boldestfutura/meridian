"""Test dashboard (ha-show-phone): ha-phone's layout in the Kitchen Show look.

Same card as show.py with `phone: true`. The Home page follows ha-phone's order:
status pills, Scenes, then each room's tiles. Calendar and Recipes are extra
pages on the floating tab bar. No photo slideshow. Hold the greeting for 1.5s
to uncover HA for edit mode.

`./deploy.py showphone` ships the card (shared with ha-show) and saves this config.
"""
import show

VERSION = show.VERSION


def light(entity, name, icon="mdi:lightbulb"):
    return {"type": "light", "entity": entity, "name": name, "icon": icon}


def media(entity, name, icon="mdi:speaker"):
    return {"type": "media", "entity": entity, "name": name, "icon": icon}


# ha-phone's scene row, same order (read from the live config 2026-11-03)
SCENES = [
    {"entity": "input_boolean.guest_mode", "name": "Guest Mode", "icon": "mdi:account-group"},
    {"entity": "script.heatpump_cool_30min", "name": "Heat/Cool", "icon": "mdi:sun-snowflake-variant"},
    {"entity": "script.goodnight", "name": "Goodnight", "icon": "mdi:weather-night"},
    {"entity": "script.kitchen_dimmed", "name": "Kitchen Dim", "icon": "mdi:lightbulb-on-30"},
    {"entity": "script.bedroom_dimmed", "name": "Bedroom Dim", "icon": "mdi:bed"},
    {"entity": "script.living_room_dimmed", "name": "Living Dim", "icon": "mdi:sofa"},
    {"entity": "script.guest_bedroom_dimmed", "name": "Guest Dim", "icon": "mdi:bed-outline"},
]

# ha-phone's room sections, tile for tile and in its order
ROOMS = [
    {"name": "Kitchen", "icon": "mdi:fridge", "group": "light.kitchen_lights", "items": [
        media("media_player.kitchen_display", "Kitchen Display", "mdi:monitor-speaker"),
        media("media_player.homepod_mini_kitchen", "HomePod", "mdi:speaker-wireless"),
        light("light.kitchen_light_2", "Kitchen Light"),
        light("light.bench_lamp", "Bench Lamp"),
    ]},
    {"name": "Living Room", "icon": "mdi:sofa", "group": "light.living_room", "items": [
        {"type": "climate", "entity": "climate.living_room"},
        media("media_player.living_room_amp", "Amp"),
        media("media_player.living_room", "Apple TV", "mdi:television"),
        {"type": "plant", "entity": "sensor.soil_moisture_sensor_1_humidity", "name": "Fiddle Leaf Fig"},
        {"type": "plant", "entity": "sensor.moisture_sensor_2_humidity", "name": "Banana Leaf"},
        light("light.couch_lamp", "Couch Lamp"),
        light("light.tv_lamp", "TV Lamp"),
        light("light.corner_light", "Corner Light"),
        {"type": "switch", "entity": "switch.smart_plug", "name": "Smart Plug", "icon": "mdi:power-plug"},
    ]},
    {"name": "Master Bedroom", "icon": "mdi:bed-king-outline", "group": "light.master_bedroom_lights", "items": [
        media("media_player.homepod_mini_master_bedroom", "HomePod", "mdi:speaker-wireless"),
        {"type": "switch", "entity": "switch.tp_link_power_strip_6e3f_dehumidifier", "name": "Dehumidifier",
         "icon": "mdi:air-humidifier"},
        light("light.mushroom_lamp", "Mushroom Lamp"),
        light("light.bedside_left", "Bedside Left"),
        light("light.bedside_right", "Bedside Right"),
    ]},
    {"name": "Guest Bedroom", "icon": "mdi:bed-outline", "items": [
        light("light.guest_bedroom_lamp", "Guest Lamp"),
    ]},
]

CARD = dict(show.CARD, phone=True, scenes=SCENES, phone_rooms=ROOMS, status_air=show.air())
CARD.pop("photos", None)
CARD.pop("idle", None)


def build():
    return {"title": "Phone Show",
            "views": [{"title": "Phone", "path": "phone", "type": "panel", "cards": [CARD]}]}
