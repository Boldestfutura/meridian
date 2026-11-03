"""Test dashboard (ha-show-phone): ha-phone's layout in the Kitchen Show look.

Same card as show.py with `phone: true`. The Home page follows ha-phone's order:
status pills, Scenes, then each room's tiles. Calendar and Recipes are extra
pages on the floating tab bar. No photo slideshow and no header.
Hold the Home tab for 1s to edit it on the phone (drag, rename, add, remove);
Save writes into the live config, and deploy.py keeps those edits (keep_screen_edits).

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



# --- pop-ups: ha-phone's Bubble Card pop-ups, same contents (read 2026-11-03) -----
# Sub-pop-ups (fan speed, swing, amp source, Apple TV apps) sit inline in their parent.
def t(entity, name, icon, **kw):
    return dict(entity=entity, name=name, icon=icon, **kw)


def tiles(*items, title=None):
    return {"type": "tiles", "title": title, "items": list(items)}


def air_popup(key, title, icon, kitchen, bedroom, extra=()):
    return {"title": title, "icon": icon, "sections": [tiles(
        t(kitchen, "Kitchen", icon), t(bedroom, "Master Bedroom", icon), *extra)]}


def player_popup(entity, title, icon, *more):
    # the player shows what's playing and from where, so ha-phone's two text tiles aren't repeated
    return {"title": title, "icon": icon, "sections": [{"type": "player", "entity": entity}, *more]}


def plant_popup(title, moisture, temp, battery):
    return {"title": title, "icon": "mdi:sprout", "sections": [
        {"type": "graph", "entity": moisture, "name": "Moisture", "color": "#3f86f2"},
        {"type": "graph", "entity": temp, "name": "Soil temperature", "color": "#f39a43"},
        tiles(t(moisture, "Moisture", "mdi:water-percent"), t(temp, "Soil temp", "mdi:thermometer"),
              t(battery, "Battery", "mdi:battery"),
              t("binary_sensor.any_plant_needs_water", "Needs water", "mdi:watering-can"))]}


CLIMATE = "climate.living_room"
AMP = "media_player.living_room_amp"
ATV = "media_player.living_room"
ATV_APPS = [("TV", "mdi:television-classic"), ("YouTube", "mdi:youtube"), ("Plex", "mdi:plex"),
            ("Spotify", "mdi:spotify"), ("Music", "mdi:music"), ("Podcasts", "mdi:podcast"),
            ("Infuse", "mdi:play-box"), ("Kayo", "mdi:soccer"), ("ABC iview", "mdi:television-box"),
            ("SBS On Demand", "mdi:television-box"), ("9Now", "mdi:television-box"), ("7plus", "mdi:television-box"),
            ("10", "mdi:television-box"), ("TVNZ+", "mdi:television-box"), ("ThreeNow", "mdi:television-box"),
            ("Photos", "mdi:image-multiple"), ("Fitness", "mdi:run"), ("Arcade", "mdi:gamepad-variant"),
            ("App\u00a0Store", "mdi:apps"), ("Search", "mdi:magnify"), ("Settings", "mdi:cog")]

POPUPS = {
    "temperature": air_popup("temperature", "Temperature", "mdi:thermometer",
                             "sensor.air_quality_monitor_temperature", "sensor.air_quality_monitor_temperature_2",
                             [t(CLIMATE, "Living Room", "mdi:thermometer", attr="current_temperature", unit="°")]),
    "humidity": air_popup("humidity", "Humidity", "mdi:water-percent",
                          "sensor.air_quality_monitor_humidity", "sensor.air_quality_monitor_humidity_2",
                          [t(CLIMATE, "Living Room", "mdi:water-percent", attr="current_humidity", unit="%")]),
    "pm2_5": air_popup("pm2_5", "PM2.5", "mdi:blur",
                       "sensor.air_quality_monitor_pm2_5", "sensor.air_quality_monitor_pm2_5_2"),
    "voc": air_popup("voc", "VOC", "mdi:air-filter",
                     "sensor.air_quality_monitor_voc_index", "sensor.air_quality_monitor_voc_index_2"),
    "cameron": {"title": "Cameron", "icon": "mdi:account", "sections": [tiles(
        t("person.cameron", "Location", "mdi:map-marker"), t("device_tracker.iphone", "iPhone", "mdi:cellphone"),
        t("device_tracker.camerons_ipad_pro", "iPad Pro", "mdi:tablet"),
        t("device_tracker.camerons_iphone_apple_watch", "Watch", "mdi:watch"),
        t("sensor.iphone_battery_level", "iPhone battery", "mdi:battery"),
        t("sensor.camerons_ipad_pro_battery_level", "iPad battery", "mdi:battery"))]},
    "paget": {"title": "Paget", "icon": "mdi:account", "sections": [tiles(
        t("person.paget", "Location", "mdi:map-marker"), t("device_tracker.paget_s_iphone", "iPhone", "mdi:cellphone"),
        t("sensor.paget_s_iphone_battery_level", "iPhone battery", "mdi:battery"),
        t("sensor.paget_s_ipad_battery_level", "iPad battery", "mdi:battery"))]},
    "openings": {"title": "Doors & Windows", "icon": "mdi:door-open", "sections": [tiles(
        t("binary_sensor.door_sensor", "Door", "mdi:door-open"), t("binary_sensor.window_sensor", "Window", "mdi:window-open"),
        t("sensor.door_sensor_battery", "Door battery", "mdi:battery"),
        t("sensor.window_sensor_battery", "Window battery", "mdi:battery"))]},
    "battery": {"title": "Batteries", "icon": "mdi:battery-alert", "sections": [tiles(*[
        t(e, n, "mdi:battery") for e, n in [
            ("sensor.door_sensor_battery", "Door sensor"), ("sensor.window_sensor_battery", "Window sensor"),
            ("sensor.dimmer_switch_battery", "Dimmer switch"), ("sensor.master_bedroom_dimmer_battery", "MB dimmer"),
            ("sensor.shortcut_button_battery", "Shortcut button"),
            ("sensor.kitchen_living_room_dimmer_switch_battery", "Kitchen dimmer"),
            ("sensor.master_bedroom_dimmer_switch_battery", "MB dimmer switch"),
            ("sensor.soil_moisture_sensor_1_battery", "Fiddle leaf fig"), ("sensor.moisture_sensor_2_battery", "Banana Leaf"),
            ("sensor.iphone_battery_level", "Cameron iPhone"), ("sensor.paget_s_iphone_battery_level", "Paget iPhone"),
            ("sensor.camerons_ipad_pro_battery_level", "Cameron iPad"),
            ("sensor.paget_s_ipad_battery_level", "Paget iPad")]])]},
    "plants": {"title": "Plants", "icon": "mdi:sprout", "sections": [tiles(
        t("sensor.soil_moisture_sensor_1_humidity", "Fiddle leaf fig", "mdi:sprout"),
        t("sensor.moisture_sensor_2_humidity", "Banana Leaf", "mdi:sprout"),
        t("sensor.soil_moisture_sensor_1_temperature", "Fiddle soil temp", "mdi:thermometer"),
        t("sensor.moisture_sensor_2_temperature", "Banana soil temp", "mdi:thermometer"))]},
    "updates": {"title": "Updates", "icon": "mdi:package-up", "sections": [tiles(
        t("update.home_assistant_core_update", "Core", "mdi:home-assistant", wide=True),
        t("update.home_assistant_operating_system_update", "Operating System", "mdi:package-up", wide=True),
        t("update.home_assistant_supervisor_update", "Supervisor", "mdi:shield-home", wide=True))]},
    "heatpump": {"title": "Heat pump", "icon": "mdi:sun-snowflake-variant", "sections": [
        {"type": "choices", "title": "Fan speed", "entity": CLIMATE, "attr": "fan_mode", "service": "climate.set_fan_mode",
         "field": "fan_mode", "compact": True, "options": [
             ["quiet", "Quiet", "mdi:volume-low"], ["low", "Low", "mdi:fan-speed-1"],
             ["medium_low", "Med low", "mdi:fan-speed-1"], ["medium", "Medium", "mdi:fan-speed-2"],
             ["medium_high", "Med high", "mdi:fan-speed-3"], ["high", "High", "mdi:fan"], ["auto", "Auto", "mdi:fan-auto"]]},
        {"type": "choices", "title": "Swing", "entity": CLIMATE, "attr": "swing_mode", "service": "climate.set_swing_mode",
         "field": "swing_mode", "options": [
             ["stopped", "Stopped", "mdi:arrow-collapse-vertical"], ["rangefull", "Full range", "mdi:arrow-expand-vertical"]]},
        tiles(t("switch.living_room_climate_react", "Climate React", "mdi:auto-mode"),
              t("switch.living_room_timer", "Timer", "mdi:timer-outline"),
              t("sensor.living_room_timer_end_time", "Timer ends", "mdi:timer-outline", wide=True,
                when={"entity": "switch.living_room_timer", "state": "on"}),
              t("binary_sensor.living_room_filter_clean_required", "Filter", "mdi:air-filter"),
              t("button.living_room_reset_filter", "Reset filter", "mdi:air-filter"), title="More")]},
    "amp": player_popup(AMP, "Amp", "mdi:speaker",
        {"type": "choices", "title": "Source", "entity": AMP, "attr": "source", "service": "media_player.select_source",
         "field": "source", "options": [
             ["TV", "TV", "mdi:television"], ["Line-in", "Line-in", "mdi:audio-input-rca"],
             ["Sound System", "Sound System", "mdi:speaker-multiple"], ["Check This Radio", "Check This Radio", "mdi:radio"],
             ["Rain", "Rain", "mdi:weather-pouring"], ["Taylor Swift", "Taylor Swift", "mdi:music"],
             ["The Era's Tour", "The Era's Tour", "mdi:music-note"]]},
        tiles(t("sensor.living_room_amp_audio_input_format", "Input", "mdi:audio-input-rca", wide=True),
              t("switch.living_room_amp_speech_enhancement", "Speech", "mdi:account-voice"),
              t("switch.living_room_amp_night_sound", "Night sound", "mdi:weather-night"),
              t("switch.living_room_amp_loudness", "Loudness", "mdi:volume-vibrate"),
              t("switch.living_room_amp_crossfade", "Crossfade", "mdi:shuffle-variant"),
              t("switch.living_room_amp_subwoofer_enabled", "Subwoofer", "mdi:speaker-wireless"),
              t("switch.living_room_amp_surround_enabled", "Surround", "mdi:surround-sound"),
              t("number.living_room_amp_bass", "Bass", "mdi:music-clef-bass"),
              t("number.living_room_amp_treble", "Treble", "mdi:music-clef-treble"), title="Sound")),
    "appletv": {"title": "Apple TV", "icon": "mdi:television", "sections": [
        {"type": "player", "entity": ATV},
        {"type": "choices", "title": "Apps", "entity": ATV, "attr": "source", "service": "media_player.select_source",
         "field": "source", "compact": True, "options": [[a, a.replace("\u00a0", " "), i] for a, i in ATV_APPS]},
        tiles(t("automation.living_room_lights_dim_for_apple_tv", "Dim lights on play", "mdi:lightbulb-auto", wide=True))]},
    "kitchen_display": player_popup("media_player.kitchen_display", "Kitchen Display", "mdi:monitor"),
    "homepod_kitchen": player_popup("media_player.homepod_mini_kitchen", "Kitchen HomePod", "mdi:speaker"),
    "homepod_bedroom": player_popup("media_player.homepod_mini_master_bedroom", "Bedroom HomePod", "mdi:speaker"),
    "plant_fiddle": plant_popup("Fiddle leaf fig", "sensor.soil_moisture_sensor_1_humidity",
                                "sensor.soil_moisture_sensor_1_temperature", "sensor.soil_moisture_sensor_1_battery"),
    "plant_banana": plant_popup("Banana Leaf", "sensor.moisture_sensor_2_humidity",
                                "sensor.moisture_sensor_2_temperature", "sensor.moisture_sensor_2_battery"),
}

# which tap opens which sheet: the same targets as ha-phone's navigation_path taps
LINKS = {
    "person.cameron": "cameron", "person.paget": "paget",
    "binary_sensor.door_sensor": "openings", "binary_sensor.window_sensor": "openings",
    "update.home_assistant_operating_system_update": "updates", "update.home_assistant_core_update": "updates",
    "binary_sensor.any_device_battery_low": "battery", "binary_sensor.any_plant_needs_water": "plants",
    "sensor.air_quality_monitor_temperature": "temperature", "sensor.air_quality_monitor_humidity": "humidity",
    "sensor.air_quality_monitor_pm2_5": "pm2_5", "sensor.air_quality_monitor_voc_index": "voc",
    CLIMATE: "heatpump", AMP: "amp", ATV: "appletv",
    "media_player.kitchen_display": "kitchen_display", "media_player.homepod_mini_kitchen": "homepod_kitchen",
    "media_player.homepod_mini_master_bedroom": "homepod_bedroom",
    "sensor.soil_moisture_sensor_1_humidity": "plant_fiddle", "sensor.moisture_sensor_2_humidity": "plant_banana",
}

# the reading pills cover the whole house: both air monitors, plus the heat pump's own
# thermometer and hygrometer in the living room
HOUSE = {
    "temperature": [{"attr": "current_temperature"}],
    "humidity": [{"attr": "current_humidity"}],
}
STATUS_AIR = []
for k, b in zip(show.air(), show.air("_2")):
    kind = k["entity"].split("air_quality_monitor_")[1].replace("voc_index", "voc")
    extra = [dict(entity=CLIMATE, **x) for x in HOUSE.get(kind, [])]
    STATUS_AIR.append(dict(k, sources=[{"entity": k["entity"]}, {"entity": b["entity"]}, *extra]))

CARD = dict(show.CARD, phone=True, scenes=SCENES, phone_rooms=ROOMS, status_air=STATUS_AIR,
            popups=POPUPS, links=LINKS)
CARD.pop("photos", None)
CARD.pop("idle", None)


def build():
    return {"title": "Phone Show",
            "views": [{"title": "Phone", "path": "phone", "type": "panel", "cards": [CARD]}]}
