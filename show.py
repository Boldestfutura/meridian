"""Test dashboard (ha-show): the kitchen screen in the Echo Show 16 layout.

For the 8" tablet. Everything is one custom card, www/overlook-show.js, which
covers the whole screen: a dock of pages on the left, weather and the clock top
right. It opens on the Family album and goes back to it after five idle minutes.
Hold the clock for 1.5s to uncover HA itself (for edit mode).

`./deploy.py show` copies the card to /config/www, bumps its resource version,
and saves this config.
"""
import design as d

VERSION = "0.3.2"
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
    "calendars": [],
    "todo": "todo.shopping_list",
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
