"""Master Bedroom bedside screen: an Echo Show 5 (2nd gen), 960x480, rooted.

Pages: Clock, Lights, Music, Air. The layout and every builder live in
roomscreen.py; this file only says what is in the bedroom.
"""
import design as d
import roomscreen as rs

PLAYER  = "media_player.homepod_mini_master_bedroom_2"   # the Music Assistant player
LIGHTS  = "light.master_bedroom_lights"
TEMP    = "sensor.air_quality_monitor_temperature_2"
HUMID   = "sensor.air_quality_monitor_humidity_2"
PM25    = "sensor.air_quality_monitor_pm2_5_2"
VOC     = "sensor.air_quality_monitor_voc_index_2"
DEHUM   = "switch.tp_link_power_strip_6e3f_dehumidifier"

SCREEN = rs.Screen(
    url="ha-bedroom", title="Master Bedroom", accent=d.MAUVE,
    #        path      title     icon
    pages=[("clock",  "Clock",  "mdi:home"),
           ("lights", "Lights", "mdi:lightbulb-group"),
           ("music",  "Music",  "mdi:music"),
           ("air",    "Air",    "mdi:thermometer")],
    busy={"lights": ("states['%s'].state === 'on'" % LIGHTS, d.AMBER),
          "music":  ("states['%s'].state === 'playing'" % PLAYER, d.VIOLET),
          "air":    ("states['%s'].state === 'on'" % DEHUM, d.BLUE)},
    temp=TEMP, humid=HUMID, photos="camera.album_slideshow_family_bedroom")


def build():
    dehum = rs.centred(d.light(DEHUM, "Dehumidifier", circle=64, glyph=32,
                               icon="mdi:air-humidifier", on_bg=d.BLUE_BG, on_ac=d.BLUE))
    dehum["styles"]["card"].append({"height": rs.FULL})
    return {"title": SCREEN.title, "views": SCREEN.views({
        "lights": rs.lights_page(
            [("light.bedside_left", "Bedside Left", "mdi:lamp"),
             ("light.bedside_right", "Bedside Right", "mdi:lamp"),
             ("light.mushroom_lamp", "Mushroom Lamp", "mdi:mushroom-outline"),
             (LIGHTS, "All Bedroom", "mdi:lightbulb-group")],
            {"script.bedroom_dimmed", "script.goodnight"}),
        "music": rs.media_page(PLAYER, "Bedroom HomePod",
                               ("prev", "play", "next", "vol_down", "vol_up"), PLAYER),
        "air": rs.air_page(rs.air_readings(TEMP, HUMID, PM25, VOC), dehum),
    })}
