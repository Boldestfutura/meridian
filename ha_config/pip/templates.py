"""Pip's mood and stats, as Home Assistant template sensors (UI template helpers).

Everything is derived from four input_datetimes (last pet, fed, talked to, born) and the
house's own sensors, so nothing needs a decay timer. The Meridian Pip card and the ESP32
screen both read these sensors.
"""
PRE = """{%- set n = as_timestamp(now()) -%}
{%- set pet_h = (n - (state_attr('input_datetime.pip_last_pet', 'timestamp') or n)) / 3600 -%}
{%- set fed_h = (n - (state_attr('input_datetime.pip_last_fed', 'timestamp') or n)) / 3600 -%}
{%- set talk_h = (n - (state_attr('input_datetime.pip_last_talk', 'timestamp') or n)) / 3600 -%}
{%- set h = now().hour + now().minute / 60 -%}
{%- set food = [0, 100 - fed_h * 4] | max -%}
{%- set fun = [0, 100 - ([pet_h, talk_h] | min) * 2.1] | max -%}
{%- set m1 = states('sensor.soil_moisture_sensor_1_humidity') | float(50) -%}
{%- set m2 = states('sensor.moisture_sensor_2_humidity') | float(50) -%}
{%- set water = [0, [100, (([m1, m2] | min) - 10) / 40 * 100] | min] | max -%}
{%- set rest = 100 if h < 7 else [10, 100 - (h - 7) * 5.5] | max -%}
"""
MOOD = PRE + """{%- set temp = states('sensor.air_quality_monitor_temperature') | float(22) -%}
{%- set night = is_state('input_boolean.bedroom_night_mode', 'on') or (is_state('binary_sensor.bedroom_dark', 'on') and (h >= 22 or h < 6)) -%}
{%- if night -%}asleep
{%- elif h >= 21.5 or h < 6 or rest < 20 -%}sleepy
{%- elif temp > 28 -%}hot
{%- elif temp < 17 -%}cold
{%- elif [pet_h, talk_h] | min > 48 -%}angry
{%- elif pet_h > 12 -%}sad
{%- elif food < 30 -%}hungry
{%- elif is_state('binary_sensor.any_plant_needs_water', 'on') -%}thirsty
{%- elif states('sensor.air_quality_monitor_voc_index') | float(0) > 400 or states('sensor.air_quality_monitor_pm2_5') | float(0) > 35 -%}stuffy
{%- elif is_state('input_boolean.guest_mode', 'on') -%}guests
{%- elif ['media_player.living_room_amp_2', 'media_player.homepod_mini_kitchen_2', 'media_player.kitchen_display_2'] | select('is_state', 'playing') | list | count -%}music
{%- elif states('weather.forecast_home') in ['rainy', 'pouring', 'lightning-rainy'] -%}rain
{%- elif pet_h < 0.5 and food > 70 and fun > 70 -%}happy
{%- else -%}idle{%- endif -%}"""
STAGE = """{%- set d = (as_timestamp(now()) - (state_attr('input_datetime.pip_born', 'timestamp') or as_timestamp(now()))) / 86400 -%}
{{ 0 if d < 3 else 1 if d < 14 else 2 if d < 42 else 3 }}"""
SENSORS = {
    "Pip mood": (MOOD, None),
    "Pip food": (PRE + "{{ food | round(0) }}", "%"),
    "Pip fun": (PRE + "{{ fun | round(0) }}", "%"),
    "Pip water": (PRE + "{{ water | round(0) }}", "%"),
    "Pip rest": (PRE + "{{ rest | round(0) }}", "%"),
    "Pip stage": (STAGE, None),
}
