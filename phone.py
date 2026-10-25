"""Phone dashboard, reconciled to what is actually live (2026-10-20).

Cameron has hand-edited this dashboard repeatedly; on 2026-10-20 he confirmed the
live version is correct, including lamp names the entity ids get wrong. This file
now mirrors it, so rebuilding from scratch reproduces what he has rather than
reverting his work.

**This is for building from scratch only.** Updates to the running dashboard go
through patch.py / patch3.py, which read the live config and swap cards by entity.
See [[dont-clobber-user-edits]].
"""
import design as d
import scenes
import patch3

HALF = 6
FULL = 12

# Entity ids were renamed to match reality on 2026-10-20, so ids and names now agree:
#   light.bedside_left / light.bedside_right / light.mushroom_lamp


def span(card, cols, entity=None):
    c = dict(card, grid_options={"columns": cols})
    return d.only_when_available(c, entity) if entity else c


def light(entity, label):
    return span(d.tile(entity, label, "mdi:lightbulb"), HALF, entity)


def plug(entity, label, icon):
    return span(d.tile(entity, label, icon, on_bg=d.BLUE_BG, on_ac=d.BLUE), HALF, entity)


def plant(entity, label, slug):
    return span(dict(d.tile_sensor(entity, label, "mdi:sprout", accent=d.LEAF),
                     tap_action={"action": "navigate", "navigation_path": "#ov-" + slug}),
                HALF, entity)


def media(entity, label, controls, icon="mdi:speaker", cols=HALF):
    """A media card. `cols` because a LONE one has to go full width.

    These are ~128px tall against a tile's 56, and an HA grid row takes its
    height from the tallest card in it. Kitchen and the living room each have
    two media cards, so they pair with each other and the row is even. The
    master bedroom has one, so whatever tile landed beside it was stranded
    at the top of a 128px row with 72px of dead space underneath.
    """
    return span(d.media_card(entity, label, controls=controls, icon=icon), cols, entity)


def sections():
    return [
        # status strip + every pop-up; patch3 owns this section
        {"type": "grid", "cards": [dict(patch3.top_strip(),
                                        _ov_top=True,
                                        grid_options={"columns": "full"})]
                                  + [dict(p) for p in patch3.popups()]},

        {"type": "grid", "cards": [
            span(d.room_header("Scenes", "mdi:creation"), FULL),
            span(d.pill_strip([{"card": c} for c in scenes.cards()],
                          rows=2, col_w=168, gap=8, pad="0"), FULL),
        ]},

        {"type": "grid", "cards": [
            span(d.room_header("Kitchen", "mdi:fridge", "light.kitchen_lights"), FULL),
            media("media_player.kitchen_display", "Display",
                  ("vol_down", "mute", "vol_up"), icon="mdi:monitor"),
            media("media_player.homepod_mini_kitchen", "HomePod",
                  ("play", "vol_down", "vol_up", "mute")),
            light("light.kitchen_light_2", "Kitchen Light"),
            light("light.bench_lamp", "Bench Lamp"),
        ]},

        {"type": "grid", "cards": [
            span(d.room_header("Living Room", "mdi:sofa", "light.living_room"), FULL),
            span(d.heatpump_stepper(), FULL, "climate.living_room"),
            media("media_player.living_room_amp", "Amp",
                  ("play", "vol_down", "vol_up", "mute")),
            media("media_player.living_room", "Apple TV", ("power", "play"),
                  icon="mdi:television"),
            plant("sensor.soil_moisture_sensor_1_humidity", "Fiddle leaf fig", "plant-fiddle"),
            plant("sensor.moisture_sensor_2_humidity", "Banana Leaf", "plant-banana"),
            light("light.couch_lamp", "Couch Lamp"),
            light("light.tv_lamp", "TV Lamp"),
            light("light.corner_light", "Corner Light"),
            plug("switch.smart_plug", "Smart Plug", "mdi:power-plug"),
        ]},

        {"type": "grid", "cards": [
            span(d.room_header("Master Bedroom", "mdi:bed-king", "light.master_bedroom_lights"), FULL),
            # Full width: it is the only media card in this room, so at HALF
            # it leaves its partner tile floating over 72px of nothing.
            media("media_player.homepod_mini_master_bedroom", "HomePod",
                  ("play", "vol_down", "vol_up"), cols=FULL),
            plug("switch.tp_link_power_strip_6e3f_dehumidifier", "Dehumidifier",
                 "mdi:air-humidifier"),
            light("light.bedside_left", "Bedside Left"),
            light("light.bedside_right", "Bedside Right"),
            light("light.mushroom_lamp", "Mushroom Lamp"),
        ]},

        {"type": "grid", "cards": [
            span(d.room_header("Guest Bedroom", "mdi:bed-double", "light.guest_bedroom_lamp"), FULL),
            light("light.guest_bedroom_lamp", "Guest Lamp"),
        ]},
    ]


def build(max_columns=1, wide=False):
    cfg = {"views": [{
        "title": "Home", "path": "home", "type": "sections",
        "theme": "Overlook", "max_columns": max_columns,
        "dense_section_placement": True, "badges": [],
        "sections": sections(),
    }]}
    patch3.attach_nav(cfg)
    return cfg
