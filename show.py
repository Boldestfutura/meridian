"""Kitchen Show (ha-show/show): the kitchen tablet's pages, also cast to the Nest Hub.

The pages themselves are www/tablet.js. Everything is one custom card, www/overlook-show.js, which
covers the whole screen: a dock of pages on the left, weather and the clock top
right. It opens on the Family album and goes back to it after five idle minutes.
Hold the clock for 1.5s to uncover HA itself (for edit mode).

`./deploy.py show` copies the card to /config/www, bumps its resource version,
and saves this config.
"""

VERSION = "0.32.9"
def air(suffix=""):
    """The four readings of one Air Quality Monitor ("" = kitchen, "_2" = bedroom)."""
    return [
        {"entity": f"sensor.air_quality_monitor_temperature{suffix}", "name": "Temp", "icon": "mdi:thermometer",
         "unit": "°", "color": "#f39a43"},
        {"entity": f"sensor.air_quality_monitor_humidity{suffix}", "name": "Humidity", "icon": "mdi:water-percent",
         "color": "#3f86f2"},
        {"entity": f"sensor.air_quality_monitor_pm2_5{suffix}", "name": "PM2.5", "icon": "mdi:blur",
         "unit": "", "color": "#3f8f63"},
        {"entity": f"sensor.air_quality_monitor_voc_index{suffix}", "name": "VOC", "icon": "mdi:air-filter",
         "unit": "", "color": "#8e5cf0"},
    ]


# The guest bedroom HomePod mini's thermometer and hygrometer. HA can't read a HomePod, so an
# Apple Home automation posts them to a webhook (template sensors in configuration.yaml).
GUEST_AIR = [
    {"entity": "sensor.guest_bedroom_temperature", "name": "Temp", "icon": "mdi:thermometer",
     "unit": "°", "color": "#f39a43"},
    {"entity": "sensor.guest_bedroom_humidity", "name": "Humidity", "icon": "mdi:water-percent",
     "color": "#3f86f2"},
]

KITCHEN_SCENES = [
    {"entity": "script.kitchen_bright", "name": "Bright", "icon": "mdi:white-balance-sunny"},
    {"entity": "script.kitchen_evening", "name": "Evening", "icon": "mdi:weather-sunset"},
    {"entity": "script.kitchen_dimmed", "name": "Dim", "icon": "mdi:lightbulb-on-30"},
]

CARD = {
    "type": "custom:overlook-show",
    "photos": "camera.album_slideshow_family",
    "weather": "weather.forecast_home",
    "idle": 90,
    "lights": [
        {"entity": "light.kitchen_lights", "name": "Kitchen Lights", "icon": "mdi:lightbulb-group"},
    ],
    "climate": "climate.living_room",
    # each speaker lists its plain entity first, then the Music Assistant one
    "speakers": [
        {"name": "Living Room Amp", "icon": "mdi:speaker",
         "entities": ["media_player.living_room_amp", "media_player.living_room_amp_2"],
         "ma": "media_player.living_room_amp_2"},
        {"name": "En Suite HomePod", "icon": "mdi:speaker-wireless",
         "entities": ["media_player.homepod_mini_kitchen_2", "media_player.homepod_mini_kitchen"],
         "ma": "media_player.homepod_mini_kitchen_2"},
        {"name": "Kitchen Tablet", "icon": "mdi:tablet",
         "entities": ["media_player.vaca_alldocube_iplay80miniturbo_bef1_sendspin_player"],
         "ma": "media_player.vaca_alldocube_iplay80miniturbo_bef1_sendspin_player", "auto": False},
        {"name": "Bedroom Echo", "icon": "mdi:speaker-wireless",
         "entities": ["media_player.bedroom_echo"],
         "ma": "media_player.bedroom_echo", "auto": False},
        {"name": "Guest HomePod", "icon": "mdi:speaker-wireless",
         "entities": ["media_player.guest_bedroom_homepod_mini_2"],
         "ma": "media_player.guest_bedroom_homepod_mini_2", "auto": False},
    ],
    "playlists": "sensor.tablet_playlists",   # template sensor, Music Assistant library
    "recipes": "/local/norish",               # tools/norish_sync.py keeps this current
    "calendars": [{"entity": "calendar.p_c", "color": "#e5484d"}],
    "todo": "todo.shopping_list",
    # pills along the top of the Kitchen page: people always, the rest only while on
    # (the same alerts as the status row on ha-phone)
    "status": [
        {"entity": "person.cameron", "name": "Cameron", "person": True},
        {"entity": "person.paget", "name": "Paget", "person": True},
        {"entity": "binary_sensor.door_sensor", "name": "Door open", "icon": "mdi:door-open", "tone": "warn"},
        {"entity": "binary_sensor.window_sensor", "name": "Window open", "icon": "mdi:window-open-variant", "tone": "warn"},
        {"entity": "update.home_assistant_operating_system_update", "name": "OS update", "icon": "mdi:package-up", "tone": "bad"},
        {"entity": "update.home_assistant_core_update", "name": "HA update", "icon": "mdi:home-assistant", "tone": "bad"},
        {"entity": "binary_sensor.any_device_battery_low", "name": "Battery low", "icon": "mdi:battery-alert-variant-outline", "tone": "bad"},
        {"entity": "binary_sensor.any_plant_needs_water", "name": "Water plants", "icon": "mdi:watering-can-outline", "tone": "cool"},
        {"entity": "input_boolean.guest_mode", "name": "Guest mode", "icon": "mdi:account-group", "tone": "accent", "toggle": True},
    ],
    # Rooms page: one tab per room
    "rooms": [
        {"name": "Kitchen", "icon": "mdi:stove", "group": "light.kitchen_lights",
         "lights": [{"entity": "light.kitchen_light_2", "name": "Kitchen Light", "icon": "mdi:ceiling-light"},
                    {"entity": "light.bench_lamp", "name": "Bench Lamp", "icon": "mdi:lamp"}],
         "sensors": air(),
         "media": [{"entity": "media_player.vaca_alldocube_iplay80miniturbo_bef1_sendspin_player",
                    "name": "Kitchen Tablet", "icon": "mdi:tablet"},
                   {"entity": "media_player.kitchen_display", "name": "Nest Hub", "icon": "mdi:monitor-speaker"}],
         "scenes": KITCHEN_SCENES},
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
                    {"entity": "script.living_room_relax", "name": "Relax", "icon": "mdi:sofa-single"},
                    {"entity": "script.living_room_bright", "name": "Bright", "icon": "mdi:white-balance-sunny"},
                    {"entity": "script.living_room_dimmed", "name": "Dim", "icon": "mdi:lightbulb-on-30"},
                    {"entity": "script.living_room_night_light", "name": "Night Light", "icon": "mdi:weather-night"},
                    {"entity": "script.heatpump_cool_30min", "name": "Heat/Cool 30 min", "icon": "mdi:sun-snowflake-variant"}]},
        {"name": "Bedroom", "icon": "mdi:bed-king-outline", "group": "light.master_bedroom_lights",
         "lights": [{"entity": "light.bedside_left", "name": "Bedside Left", "icon": "mdi:lamp"},
                    {"entity": "light.bedside_right", "name": "Bedside Right", "icon": "mdi:lamp"},
                    {"entity": "light.mushroom_lamp", "name": "Mushroom Lamp", "icon": "mdi:mushroom-outline"}],
         "media": [{"entity": "media_player.bedroom_echo", "name": "Echo", "icon": "mdi:speaker-wireless"},
                   {"entity": "media_player.homepod_mini_kitchen", "name": "En Suite HomePod", "icon": "mdi:speaker-wireless"}],
         "switches": [{"entity": "switch.tp_link_power_strip_6e3f_dehumidifier", "name": "Dehumidifier",
                       "icon": "mdi:air-humidifier"}],
         "sensors": air("_2"),   # the bedroom's own monitor
         "scenes": [{"entity": "script.bedroom_reading", "name": "Reading", "icon": "mdi:book-open-variant"},
                    {"entity": "script.bedroom_wind_down", "name": "Wind Down", "icon": "mdi:candle"},
                    {"entity": "script.bedroom_bright", "name": "Bright", "icon": "mdi:white-balance-sunny"},
                    {"entity": "script.bedroom_dimmed", "name": "Dim", "icon": "mdi:lightbulb-on-30"},
                    {"entity": "script.goodnight", "name": "Goodnight", "icon": "mdi:power-sleep"},
                    {"entity": "input_boolean.bedroom_night_mode", "name": "Sleep Sounds", "icon": "mdi:waves"}]},
        {"name": "Guest", "icon": "mdi:bed-outline",
         "lights": [{"entity": "light.guest_bedroom_lamp", "name": "Guest Lamp", "icon": "mdi:lamp"}],
         "media": [{"entity": "media_player.guest_bedroom_homepod_mini", "name": "HomePod", "icon": "mdi:speaker-wireless"}],
         "sensors": GUEST_AIR,   # the HomePod's own sensors, pushed in by an Apple Home shortcut
         "scenes": [{"entity": "script.guest_bedroom_welcome", "name": "Welcome", "icon": "mdi:hand-wave"},
                    {"entity": "script.guest_bedroom_bright", "name": "Bright", "icon": "mdi:white-balance-sunny"},
                    {"entity": "script.guest_bedroom_dimmed", "name": "Dim", "icon": "mdi:lightbulb-on-30"},
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


# Kitchen Favourites row: the few scenes Cameron picked, named for a small square tile
_all = {s["entity"]: s for r in CARD["rooms"] for s in r.get("scenes", [])}
FAV_SCENES = [("script.goodnight", "Goodnight"), ("script.heatpump_cool_30min", "Heat/Cool 30 min"),
              ("input_boolean.guest_mode", "Guest Mode"), ("script.living_room_dimmed", "Living Room Dim"),
              ("script.kitchen_dimmed", "Kitchen Dim"), ("input_boolean.bedroom_night_mode", "Sleep Sounds")]
CARD["scenes"] = [dict(_all[e], name=n) for e, n in FAV_SCENES]

# the kitchen tablet's own pages (www/tablet.js): Home, Rooms, Climate, Media, Recipes
CARD.update({
    "tablet": True,
    # no dock: swipe between Media | Home | Rooms | Recipes (each room's climate is on Rooms)
    "swipe": ["media", "home", "rooms", "recipes"],
    # idle: the time, weather, who's home and what's next over the darkened slideshow
    "photo_clock": True,
    "night": "input_boolean.bedroom_night_mode",
    # the washing machine bubble beside the clock (input_select kept by automation washing_machine)
    "washer": {"entity": "input_select.washing_machine", "started": "input_datetime.washing_machine_started",
               "alert": "input_boolean.washing_machine_alert"},
    "clock": "kitchen",                       # timer.kitchen_timer behind the Timer button
    "tablet_tv": "media_player.living_room",  # its Plex art comes from /local/nowplaying
    "tablet_players": [
        {"entity": "media_player.living_room", "name": "Apple TV", "icon": "mdi:apple",
         "volume": "media_player.living_room_amp_2"},
        {"entity": "media_player.living_room_amp_2", "name": "Living Room Amp", "icon": "mdi:speaker",
         "follows": "media_player.living_room"},
        {"entity": "media_player.homepod_mini_kitchen_2", "name": "En Suite HomePod", "icon": "mdi:speaker-wireless"},
        {"entity": "media_player.vaca_alldocube_iplay80miniturbo_bef1_sendspin_player", "name": "Kitchen Tablet", "icon": "mdi:tablet"},
        {"entity": "media_player.bedroom_echo", "name": "Bedroom Echo", "icon": "mdi:speaker-wireless"},
        {"entity": "media_player.guest_bedroom_homepod_mini_2", "name": "Guest HomePod", "icon": "mdi:speaker-wireless"},
    ],
    "tablet_quick": [
        {"entity": "light.kitchen_lights", "name": "Kitchen", "icon": "mdi:lightbulb-group"},
        {"entity": "light.bench_lamp", "name": "Bench Lamp", "icon": "mdi:lamp"},
        {"entity": "light.living_room", "name": "Living Room", "icon": "mdi:sofa"},
        {"entity": "script.kitchen_dimmed", "name": "Kitchen Dim", "icon": "mdi:lightbulb-on-30"},
        {"entity": "script.goodnight", "name": "Goodnight", "icon": "mdi:weather-night"},
        {"entity": "input_boolean.guest_mode", "name": "Guest Mode", "icon": "mdi:account-group"},
        {"timer": True},
        # past the first seven: the row scrolls sideways
        {"entity": "scene.new_scene", "name": "Movie Time", "icon": "mdi:movie-open-outline"},
        {"entity": "script.living_room_dimmed", "name": "Living Room Dim", "icon": "mdi:lightbulb-on-30"},
        {"entity": "script.heatpump_cool_30min", "name": "Heat/Cool 30 min", "icon": "mdi:hvac"},
        {"entity": "light.master_bedroom_lights", "name": "Bedroom", "icon": "mdi:bed-outline"},
        {"entity": "light.guest_bedroom_lamp", "name": "Guest Lamp", "icon": "mdi:lamp-outline"},
        {"entity": "input_boolean.bedroom_night_mode", "name": "Sleep Sounds", "icon": "mdi:waves"},
        {"entity": "switch.tp_link_power_strip_6e3f_dehumidifier", "name": "Dehumidifier", "icon": "mdi:air-humidifier"},
    ],
    "scheme": "sun.sun",                      # light by day, dark after sunset, whatever the device says
})


def build():
    # the phone's reading pills and pop-ups; showphone imports this module, so not at the top
    from showphone import STATUS_AIR, POPUPS, LINKS
    card = dict(CARD, status_air=STATUS_AIR, popups=POPUPS, links=LINKS)
    return {"title": "Kitchen Show",
            "views": [{"title": "Show", "path": "show", "type": "panel", "cards": [card]}]}
