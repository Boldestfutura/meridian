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


def span2(card):
    """Make a card two grid rows tall. 56 + 8 gap + 56 = 120px."""
    g = dict(card.get("grid_options", {}))
    g["rows"] = 2
    return dict(card, grid_options=g)


def media(entity, label, controls, icon="mdi:speaker"):
    """A media card, half width and two grid rows tall.

    The section grid is 12 columns of 56px rows with an 8px gap, so two rows
    is 120px: level with two stacked tiles. A media card is ~124px against a
    tile's 56, and a row takes the height of its tallest card, so without the
    span any tile dragged beside one was stranded at the top of a tall row.
    Every media card spans, paired or not, so any arrangement made in the UI
    stays gap-free.
    """
    return span2(span(d.media_card(entity, label, controls=controls, icon=icon), HALF, entity))


def sections():
    return [
        # status strip + every pop-up; patch3 owns this section
        {"type": "grid", "cards": [dict(patch3.top_strip(),
                                        _ov_top=True,
                                        grid_options={"columns": "full"})]
                                  + [dict(p) for p in patch3.popups()]},

        {"type": "grid", "cards": [
            span(d.room_header("Scenes", "mdi:creation", swipe=True), FULL),
            # Sleep Sounds goes 5th, the first cell of row two, so it's in view without
            # scrolling (Cameron, 2026-11-07); the rest keep the shared order
            span(d.pill_strip([{"card": c} for c in scenes.cards(first_screen="input_boolean.bedroom_night_mode")],
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
            media("media_player.bedroom_echo", "Echo",
                  ("play", "vol_down", "vol_up")),
            plug("switch.tp_link_power_strip_6e3f_dehumidifier", "Dehumidifier",
                 "mdi:air-humidifier"),
            light("light.mushroom_lamp", "Mushroom Lamp"),
            light("light.bedside_left", "Bedside Left"),
            light("light.bedside_right", "Bedside Right"),
        ]},

        {"type": "grid", "cards": [
            span(d.room_header("Guest Bedroom", "mdi:bed-double", "light.guest_bedroom_lamp"), FULL),
            light("light.guest_bedroom_lamp", "Guest Lamp"),
            media("media_player.guest_bedroom_homepod_mini", "HomePod",
                  ("play", "vol_down", "vol_up")),
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
