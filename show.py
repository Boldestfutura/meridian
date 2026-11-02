"""Test dashboard (ha-show): the kitchen screen in the Echo Show 16 layout.

For the 8" tablet. Everything is one custom card, www/overlook-show.js, which
covers the whole screen: a dock of pages on the left, weather and the clock top
right. It opens on the Family album and goes back to it after five idle minutes.
Hold the clock for 1.5s to uncover HA itself (for edit mode).

`./deploy.py show` copies the card to /config/www, bumps its resource version,
and saves this config.
"""
import design as d

VERSION = "0.6.3"
CARD = {
    "type": "custom:overlook-show",
    "photos": "camera.album_slideshow_family",
    "weather": "weather.forecast_home",
    "idle": 300,
    "lights": [
        {"entity": "light.kitchen_lights", "name": "Kitchen Lights", "icon": "mdi:lightbulb-group"},
    ],
    "climate": "climate.living_room",
    # each speaker lists its plain entity first, then the Music Assistant one
    "speakers": [
        {"name": "Living Room Amp", "icon": "mdi:speaker",
         "entities": ["media_player.living_room_amp", "media_player.living_room_amp_2"],
         "ma": "media_player.living_room_amp_2"},
        {"name": "Kitchen HomePod", "icon": "mdi:speaker-wireless",
         "entities": ["media_player.homepod_mini_kitchen_2", "media_player.homepod_mini_kitchen"],
         "ma": "media_player.homepod_mini_kitchen_2"},
        {"name": "Bedroom HomePod", "icon": "mdi:speaker-wireless",
         "entities": ["media_player.homepod_mini_master_bedroom_2"],
         "ma": "media_player.homepod_mini_master_bedroom_2", "auto": False},
    ],
    "playlists": "sensor.tablet_playlists",   # template sensor, Music Assistant library
    "recipes": "/local/norish",               # tools/norish_sync.py keeps this current
    "calendars": [{"entity": "calendar.p_c", "color": "#e5484d"}],
    "todo": "todo.shopping_list",
    # Home page: one tab per room, the same things the ha-tablet dashboard shows
    "rooms": [
        {"name": "Kitchen", "icon": "mdi:stove", "group": "light.kitchen_lights",
         "lights": [{"entity": "light.kitchen_light_2", "name": "Kitchen Light", "icon": "mdi:ceiling-light"},
                    {"entity": "light.bench_lamp", "name": "Bench Lamp", "icon": "mdi:lamp"}],
         "media": [{"entity": "media_player.kitchen_display", "name": "Nest Hub", "icon": "mdi:google-home"},
                   {"entity": "media_player.homepod_mini_kitchen", "name": "HomePod", "icon": "mdi:speaker-wireless"}],
         "scenes": [{"entity": "script.kitchen_dimmed", "name": "Kitchen Dim", "icon": "mdi:lightbulb-on-30"}]},
        {"name": "Living Room", "icon": "mdi:sofa", "group": "light.living_room", "climate": "climate.living_room",
         "lights": [{"entity": "light.couch_lamp", "name": "Couch Lamp", "icon": "mdi:floor-lamp"},
                    {"entity": "light.tv_lamp", "name": "TV Lamp", "icon": "mdi:lamp"},
                    {"entity": "light.corner_light", "name": "Corner Light", "icon": "mdi:floor-lamp-torchiere"}],
         "media": [{"entity": "media_player.living_room_amp", "name": "Amp", "icon": "mdi:speaker"},
                   {"entity": "media_player.living_room", "name": "Apple TV", "icon": "mdi:television"}],
         "switches": [{"entity": "switch.smart_plug", "name": "Smart Plug", "icon": "mdi:power-socket-au"}],
         "plants": [{"entity": "sensor.soil_moisture_sensor_1_humidity", "name": "Fiddle Leaf Fig"},
                    {"entity": "sensor.moisture_sensor_2_humidity", "name": "Banana Leaf"}],
         "scenes": [{"entity": "scene.new_scene", "name": "Movie Time", "icon": "mdi:movie-open"},
                    {"entity": "script.living_room_dimmed", "name": "Living Dim", "icon": "mdi:sofa"},
                    {"entity": "script.heatpump_cool_30min", "name": "Heat/Cool 30 min", "icon": "mdi:sun-snowflake-variant"}]},
        {"name": "Bedroom", "icon": "mdi:bed-king-outline", "group": "light.master_bedroom_lights",
         "lights": [{"entity": "light.bedside_left", "name": "Bedside Left", "icon": "mdi:lamp"},
                    {"entity": "light.bedside_right", "name": "Bedside Right", "icon": "mdi:lamp"},
                    {"entity": "light.mushroom_lamp", "name": "Mushroom Lamp", "icon": "mdi:mushroom-outline"}],
         "media": [{"entity": "media_player.homepod_mini_master_bedroom", "name": "HomePod", "icon": "mdi:speaker-wireless"}],
         "switches": [{"entity": "switch.tp_link_power_strip_6e3f_dehumidifier", "name": "Dehumidifier",
                       "icon": "mdi:air-humidifier"}],
         "scenes": [{"entity": "script.bedroom_dimmed", "name": "Bedroom Dim", "icon": "mdi:bed"},
                    {"entity": "script.goodnight", "name": "Goodnight", "icon": "mdi:weather-night"}]},
        {"name": "Guest", "icon": "mdi:bed-outline",
         "lights": [{"entity": "light.guest_bedroom_lamp", "name": "Guest Lamp", "icon": "mdi:lamp"}],
         "scenes": [{"entity": "script.guest_bedroom_dimmed", "name": "Guest Dim", "icon": "mdi:bed-outline"},
                    {"entity": "input_boolean.guest_mode", "name": "Guest Mode", "icon": "mdi:account-group"}]},
        {"name": "Media", "icon": "mdi:music", "music": True},
    ],
    "sensors": [
        {"entity": "sensor.air_quality_monitor_temperature", "name": "Temp", "icon": "mdi:thermometer",
         "unit": "°", "color": "#f39a43"},
        {"entity": "sensor.air_quality_monitor_humidity", "name": "Humidity", "icon": "mdi:water-percent",
         "color": "#3f86f2"},
        {"entity": "sensor.air_quality_monitor_pm2_5", "name": "PM2.5", "icon": "mdi:blur",
         "unit": "", "color": "#3f8f63"},
    ],
}


def build():
    return {"title": "Kitchen Show",
            "views": [{"title": "Show", "path": "show", "type": "panel", "cards": [CARD]}]}
