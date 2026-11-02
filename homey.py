"""Homey-style test dashboard (ha-homey). A trial layout, not a replacement.

Modelled on the Homey app's Devices screen (homey.app/features/devices): a
"My Home" title, two-up summary cards (Lights - 3 turned on), two-up mood pills
with a colour dot, then one section per room of square device tiles, three to
a row on a phone. Each tile carries an outline icon top left, a status mark top
right (the light's own colour, a temperature badge, a reading) and the name
underneath; a device that is off fades back.

Tap does the obvious thing (toggle a light, play/pause a speaker); hold opens
HA's more-info, whose vertical brightness slider stands in for Homey's light
sheet. The summary cards open subviews filtered to one kind of device.

Built fresh, so a plain `./deploy.py homey` is safe until Cameron edits it by
hand. After that, patch it like the others.
"""
import design as d
from design import INK, MUTED, SURF, FONT, mix

TILE_H = 120          # two 56px grid rows plus the 8px gap: a square on a phone
PURPLE = "#8e5bd8"
ORANGE = "#f07b1d"
GREEN  = "#2fa36b"
AMBER  = "#f5b041"
GREY   = mix(INK, 14)

LIGHTS = ["light.kitchen_light_2", "light.bench_lamp", "light.couch_lamp", "light.tv_lamp",
          "light.corner_light", "light.mushroom_lamp", "light.bedside_left",
          "light.bedside_right", "light.guest_bedroom_lamp"]
SPEAKERS = ["media_player.living_room_amp", "media_player.homepod_mini_kitchen",
            "media_player.homepod_mini_master_bedroom"]
OPENINGS = ["binary_sensor.door_sensor", "binary_sensor.window_sensor"]
HOME = "/ha-homey/home"


# ---------------------------------------------------------------------------
# building blocks
# ---------------------------------------------------------------------------

def grid(card, cols, rows=None, entity=None):
    g = {"columns": cols}
    if rows:
        g["rows"] = rows
    card = dict(card, grid_options=g)
    if entity:
        card["visibility"] = [{"condition": "state", "entity": entity,
                               "state_not": "unavailable"}]
    return card


def title(text, sub_js):
    return grid({
        "type": "custom:button-card", "show_icon": False, "show_state": False,
        "name": text, "tap_action": {"action": "none"},
        "custom_fields": {"s": sub_js},
        "styles": {
            "card": [{"background": "transparent"}, {"box-shadow": "none"}, {"border": "none"},
                     {"padding": "6px 4px 0"}, {"font-family": FONT}],
            "grid": [{"grid-template-areas": '"n" "s"'}, {"grid-template-columns": "1fr"}],
            "name": [{"font-size": "30px"}, {"font-weight": "800"}, {"color": INK},
                     {"justify-self": "start"}, {"letter-spacing": "-.02em"}],
            "custom_fields": {"s": [{"justify-self": "start"}, {"font-size": "14px"},
                                    {"color": MUTED}, {"margin-top": "2px"}]},
        },
    }, "full")


def summary(label, icon, colour, sub_js, tap):
    """The two-up cards under the title: coloured glyph, bold name, muted count."""
    return grid({
        "type": "custom:button-card", "name": label, "icon": icon,
        "show_state": False, "tap_action": tap,
        "custom_fields": {"s": sub_js},
        "styles": {
            "card": [{"height": "56px"}, {"border-radius": "14px"}, {"padding": "0 12px"},
                     {"background": SURF}, {"box-shadow": "0 1px 3px rgba(0,0,0,.06)"},
                     {"border": "none"}, {"font-family": FONT}],
            "grid": [{"grid-template-areas": '"i n" "i s"'},
                     {"grid-template-columns": "30px 1fr"}, {"grid-template-rows": "1fr 1fr"},
                     {"column-gap": "10px"}, {"width": "100%"}],
            "img_cell": [{"justify-content": "center"}],
            "icon": [{"width": "26px"}, {"color": colour}],
            "name": [{"font-size": "14px"}, {"font-weight": "700"}, {"color": INK},
                     {"justify-self": "start"}, {"align-self": "end"}],
            "custom_fields": {"s": [{"justify-self": "start"}, {"align-self": "start"},
                                    {"font-size": "12.5px"}, {"color": MUTED},
                                    {"white-space": "nowrap"}, {"overflow": "hidden"},
                                    {"text-overflow": "ellipsis"}, {"max-width": "100%"}]},
        },
        "extra_styles": "#card{transition:transform 90ms ease}"
                        "#card:active{transform:scale(.97) !important}",
    }, 6)


def mood(entity, label, sub_js, colours, toggle=False):
    """A Homey mood: a gradient dot, the name, and what it touches."""
    a, b = colours
    on = "states['%s'].state === 'on'" % entity
    return grid({
        "type": "custom:button-card", "entity": entity, "name": label,
        "show_icon": False, "show_state": False,
        "tap_action": {"action": "toggle"} if toggle else
                      {"action": "call-service", "service": "script.turn_on",
                       "service_data": {"entity_id": entity}},
        "hold_action": {"action": "more-info"},
        "custom_fields": {
            "dot": "[[[ return `<div style=\"width:30px;height:30px;border-radius:50%%;"
                   "background:linear-gradient(135deg,%s,%s);box-shadow:inset 0 0 0 1px "
                   "rgba(0,0,0,.06)\"></div>`; ]]]" % (a, b),
            "s": sub_js,
        },
        "styles": {
            "card": [{"height": "56px"}, {"border-radius": "14px"}, {"padding": "0 12px"},
                     {"box-shadow": "0 1px 3px rgba(0,0,0,.06)"}, {"border": "none"},
                     {"font-family": FONT},
                     {"background": "[[[ return %s ? '%s' : '%s'; ]]]" % (on, mix(a, 18), SURF)}],
            "grid": [{"grid-template-areas": '"dot n" "dot s"'},
                     {"grid-template-columns": "30px 1fr"}, {"grid-template-rows": "1fr 1fr"},
                     {"column-gap": "10px"}, {"width": "100%"}],
            "name": [{"font-size": "14px"}, {"font-weight": "700"}, {"color": INK},
                     {"justify-self": "start"}, {"align-self": "end"},
                     {"white-space": "nowrap"}, {"overflow": "hidden"},
                     {"text-overflow": "ellipsis"}, {"max-width": "100%"}],
            "custom_fields": {"dot": [{"align-self": "center"}],
                              "s": [{"justify-self": "start"}, {"align-self": "start"},
                                    {"font-size": "12.5px"}, {"color": MUTED}]},
        },
        "extra_styles": "#card{transition:transform 90ms ease}"
                        "#card:active{transform:scale(.97) !important}",
    }, 6)


def room(title_text, icon, group=None):
    """Grey icon chip, bold room name, chevron. Tapping it opens the room's lights."""
    chev = "<ha-icon icon=\"mdi:chevron-right\" style=\"--mdc-icon-size:22px;color:%s\"></ha-icon>" % MUTED
    return grid({
        "type": "custom:button-card", "show_icon": False, "show_state": False,
        "show_name": False,
        "tap_action": {"action": "more-info", "entity": group} if group else {"action": "none"},
        **({"entity": group} if group else {}),
        "custom_fields": {"h": """[[[ return `<div style="display:flex;align-items:center;gap:10px">
          <div style="width:32px;height:32px;border-radius:9px;background:%s;display:grid;place-items:center">
            <ha-icon icon="%s" style="--mdc-icon-size:19px;color:%s"></ha-icon></div>
          <span style="font-size:20px;font-weight:800;color:%s;letter-spacing:-.01em">%s</span>%s
        </div>`; ]]]""" % (mix(INK, 8), icon, INK, INK, title_text, chev if group else "")},
        "styles": {
            "card": [{"background": "transparent"}, {"box-shadow": "none"}, {"border": "none"},
                     {"height": "48px"}, {"padding": "8px 2px 0"}, {"font-family": FONT}],
            "grid": [{"grid-template-areas": '"h"'}, {"grid-template-columns": "1fr"}],
            "custom_fields": {"h": [{"justify-self": "start"}]},
        },
    }, "full")


def device(entity, name, icon, mark_js, on_js, tap=None, hold=None):
    """The square tile. `mark_js` returns the HTML for the top-right corner,
    `on_js` is a boolean expression; a tile that is not on fades back."""
    return grid({
        "type": "custom:button-card", "entity": entity, "name": name, "icon": icon,
        "show_state": False,
        "tap_action": tap or {"action": "toggle"},
        "hold_action": hold or {"action": "more-info"},
        "custom_fields": {"m": "[[[ %s ]]]" % mark_js},
        "styles": {
            "card": [{"height": "%dpx" % TILE_H}, {"border-radius": "14px"},
                     {"padding": "12px 12px 11px"}, {"border": "none"}, {"font-family": FONT},
                     {"box-shadow": "[[[ return (%s) ? '0 1px 3px rgba(0,0,0,.08)' : 'none'; ]]]" % on_js},
                     {"background": "[[[ return (%s) ? '%s' : '%s'; ]]]"
                                    % (on_js, SURF, mix(INK, 4, "transparent"))}],
            "grid": [{"grid-template-areas": '"i m" "n n"'},
                     {"grid-template-columns": "1fr auto"},
                     {"grid-template-rows": "1fr auto"}, {"height": "100%"}],
            "img_cell": [{"justify-self": "start"}, {"align-self": "start"},
                         {"width": "34px"}, {"height": "34px"}],
            "icon": [{"width": "34px"},
                     {"color": "[[[ return (%s) ? '%s' : '%s'; ]]]" % (on_js, INK, MUTED)},
                     {"opacity": "[[[ return (%s) ? '1' : '.55'; ]]]" % on_js}],
            "name": [{"justify-self": "start"}, {"align-self": "end"}, {"text-align": "left"},
                     {"font-size": "14px"}, {"font-weight": "500"}, {"line-height": "1.25"},
                     {"white-space": "normal"}, {"display": "-webkit-box"},
                     {"-webkit-line-clamp": "2"}, {"-webkit-box-orient": "vertical"},
                     {"overflow": "hidden"},
                     {"color": "[[[ return (%s) ? '%s' : '%s'; ]]]" % (on_js, INK, MUTED)}],
            "custom_fields": {"m": [{"justify-self": "end"}, {"align-self": "start"}]},
        },
        "extra_styles": "#card{transition:transform 90ms ease,background 200ms ease}"
                        "#card:active{transform:scale(.96) !important}",
    }, 4, 2, entity)


# --- top-right marks ------------------------------------------------------

def dot_js(colour_expr):
    return ("return `<div style=\"width:24px;height:24px;border-radius:50%%;background:${%s};"
            "box-shadow:0 0 0 3px %s,0 1px 4px rgba(0,0,0,.25)\"></div>`;" % (colour_expr, SURF))


def badge_js(text_expr, colour_expr):
    return ("return `<div style=\"min-width:26px;height:26px;padding:0 6px;box-sizing:border-box;"
            "border-radius:13px;background:${%s};color:#fff;font-size:13px;font-weight:700;"
            "display:grid;place-items:center\">${%s}</div>`;" % (colour_expr, text_expr))


def reading_js(text_expr, colour=INK):
    return ("return `<div style=\"font-size:14px;font-weight:700;color:%s;"
            "white-space:nowrap\">${%s}</div>`;" % (colour, text_expr))


# --- device kinds ---------------------------------------------------------

def light(entity, name, icon="mdi:lightbulb-outline"):
    colour = ("(entity.state !== 'on') ? '%s' : (entity.attributes.rgb_color ? "
              "'rgb(' + entity.attributes.rgb_color.join(',') + ')' : '%s')" % (GREY, AMBER))
    return device(entity, name, icon, dot_js(colour), "entity.state === 'on'")


def plug(entity, name, icon):
    return device(entity, name, icon,
                  dot_js("entity.state === 'on' ? '%s' : '%s'" % (GREEN, GREY)),
                  "entity.state === 'on'")


def speaker(entity, name, icon="mdi:speaker"):
    playing = "entity.state === 'playing'"
    bars = ("const p = %s; const c = p ? '%s' : '%s';"
            "const b = [10,18,13,20].map((h,i) => `<i style=\"display:block;width:3px;"
            "height:${h}px;border-radius:2px;background:${c};${p ? `animation:hb 900ms ${i*120}ms "
            "ease-in-out infinite alternate` : ''}\"></i>`).join('');"
            "return `<div style=\"display:flex;align-items:flex-end;gap:3px;height:22px\">${b}</div>`;"
            % (playing, PURPLE, GREY))
    c = device(entity, name, icon, bars, "['playing','paused'].includes(entity.state)",
               tap={"action": "call-service", "service": "media_player.media_play_pause",
                    "service_data": {"entity_id": entity}})
    c["extra_styles"] += ("@keyframes hb{from{transform:scaleY(.35)}to{transform:scaleY(1)}}"
                          "i{transform-origin:bottom}")
    return c


def tv(entity, name):
    on = "!['off','standby','unavailable'].includes(entity.state)"
    return device(entity, name, "mdi:television",
                  dot_js("(%s) ? '%s' : '%s'" % (on, "#3b82f6", GREY)), on,
                  tap={"action": "more-info"})


def thermostat(entity, name):
    on = "entity.state !== 'off'"
    colour = ("entity.state === 'cool' ? '#3b82f6' : entity.state === 'off' ? '%s' : '%s'"
              % (GREY, ORANGE))
    text = ("(entity.state === 'off') ? 'Off' : Math.round(entity.attributes.temperature)")
    return device(entity, name, "mdi:thermostat", badge_js(text, colour), on,
                  tap={"action": "more-info"})


def sensor(entity, name, icon, unit, colour=INK):
    return device(entity, name, icon,
                  reading_js("Math.round(parseFloat(entity.state)) + '%s'" % unit, colour),
                  "true", tap={"action": "more-info"}, hold={"action": "more-info"})


def plant(entity, name):
    low = "parseFloat(entity.state) < 25"
    return device(entity, name, "mdi:sprout-outline",
                  badge_js("Math.round(parseFloat(entity.state)) + '%'",
                           "(%s) ? '%s' : '%s'" % (low, ORANGE, GREEN)),
                  "true", tap={"action": "more-info"}, hold={"action": "more-info"})


def opening(entity, name, icon_closed, icon_open):
    c = device(entity, name, icon_closed,
               "return entity.state === 'on' ? `<ha-icon icon=\"mdi:alert-circle\" "
               "style=\"--mdc-icon-size:26px;color:%s\"></ha-icon>` : '';" % "#f2b705",
               "true", tap={"action": "more-info"}, hold={"action": "more-info"})
    c["icon"] = "[[[ return entity.state === 'on' ? '%s' : '%s'; ]]]" % (icon_open, icon_closed)
    return c


# ---------------------------------------------------------------------------
# counts for the summary cards
# ---------------------------------------------------------------------------

def _count(ids, test, one, many, none):
    return ("[[[ const n = %s.filter(e => states[e] && %s).length;"
            " return n === 0 ? '%s' : n + ' ' + (n === 1 ? '%s' : '%s'); ]]]"
            % (ids, test, none, one, many))


LIGHTS_ON = _count(LIGHTS, "states[e].state === 'on'", "turned on", "turned on", "All off")
PLAYING = _count(SPEAKERS, "states[e].state === 'playing'", "playing", "playing", "Nothing playing")
OPEN = _count(OPENINGS, "states[e].state === 'on'", "open", "open", "All closed")
CLIMATE = ("[[[ const c = states['climate.living_room']; const t = states['%s'];"
           " const r = t ? Math.round(parseFloat(t.state)) + '°' : '';"
           " const m = !c || c.state === 'off' ? 'Off' : c.state.charAt(0).toUpperCase() + c.state.slice(1);"
           " return r + ' inside · ' + m; ]]]" % "sensor.air_quality_monitor_temperature")
WHO = ("[[[ const p = ['person.cameron','person.paget'].filter(e => states[e] && states[e].state === 'home')"
       ".map(e => states[e].attributes.friendly_name);"
       " return p.length ? p.join(' & ') + (p.length > 1 ? ' are' : ' is') + ' home' : 'Nobody home'; ]]]")


# ---------------------------------------------------------------------------
# rooms - device list in one place, reused by the subviews
# ---------------------------------------------------------------------------

ROOMS = [
    ("Kitchen", "mdi:fridge-outline", "light.kitchen_lights", [
        ("mood", "script.kitchen_dimmed", "Kitchen Dim", "Dims the kitchen", ("#ffcf70", "#f08a24")),
        ("light", "light.kitchen_light_2", "Kitchen Light", "mdi:ceiling-light-outline"),
        ("light", "light.bench_lamp", "Bench Lamp", "mdi:desk-lamp"),
        ("speaker", "media_player.homepod_mini_kitchen", "HomePod mini"),
        ("sensor", "sensor.air_quality_monitor_temperature", "Temperature",
         "mdi:thermometer", "°"),
        ("sensor", "sensor.air_quality_monitor_humidity", "Humidity", "mdi:water-outline", "%"),
    ]),
    ("Living Room", "mdi:sofa-outline", "light.living_room", [
        ("mood", "script.living_room_dimmed", "Living Dim", "Dims the living room", ("#c9a7ff", "#7b4fd6")),
        ("light", "light.couch_lamp", "Couch Lamp", "mdi:floor-lamp-outline"),
        ("light", "light.tv_lamp", "TV Lamp", "mdi:lamp-outline"),
        ("light", "light.corner_light", "Corner Light", "mdi:floor-lamp-torchiere-outline"),
        ("speaker", "media_player.living_room_amp", "Sonos Amp", "mdi:speaker"),
        ("tv", "media_player.living_room", "Apple TV"),
        ("thermostat", "climate.living_room", "Heatpump"),
        ("plant", "sensor.soil_moisture_sensor_1_humidity", "Fiddle Leaf Fig"),
        ("plant", "sensor.moisture_sensor_2_humidity", "Banana Leaf"),
        ("opening", "binary_sensor.door_sensor", "Door", "mdi:door-closed", "mdi:door-open"),
        ("opening", "binary_sensor.window_sensor", "Window", "mdi:window-closed-variant",
         "mdi:window-open-variant"),
        ("plug", "switch.smart_plug", "Smart Plug", "mdi:power-socket-au"),
    ]),
    ("Master Bedroom", "mdi:bed-king-outline", "light.master_bedroom_lights", [
        ("mood", "script.bedroom_dimmed", "Bedroom Dim", "Dims the bedroom", ("#ffb3d1", "#c2477f")),
        ("light", "light.mushroom_lamp", "Mushroom Lamp", "mdi:mushroom-outline"),
        ("light", "light.bedside_left", "Bedside Left", "mdi:lamp-outline"),
        ("light", "light.bedside_right", "Bedside Right", "mdi:lamp-outline"),
        ("speaker", "media_player.homepod_mini_master_bedroom", "HomePod mini"),
        ("plug", "switch.tp_link_power_strip_6e3f_dehumidifier", "Dehumidifier",
         "mdi:air-humidifier"),
        ("sensor", "sensor.air_quality_monitor_temperature_2", "Temperature",
         "mdi:thermometer", "°"),
        ("sensor", "sensor.air_quality_monitor_humidity_2", "Humidity", "mdi:water-outline", "%"),
    ]),
    ("Guest Bedroom", "mdi:bed-outline", "light.guest_bedroom_lamp", [
        ("mood", "script.guest_bedroom_dimmed", "Guest Dim", "Dims the guest room", ("#a8d8ff", "#3f7fd6")),
        ("light", "light.guest_bedroom_lamp", "Guest Lamp", "mdi:lamp-outline"),
    ]),
]

KINDS = {"light": light, "speaker": speaker, "tv": tv, "thermostat": thermostat,
         "sensor": sensor, "plant": plant, "opening": opening, "plug": plug}


def _card(item):
    kind, *args = item
    if kind == "mood":
        entity, label, sub, colours = args
        # one mood per room, so it takes the whole row; half width left the
        # square tiles staggering around it
        return dict(mood(entity, label, "[[[ return '%s'; ]]]" % sub, colours),
                    grid_options={"columns": "full"})
    return KINDS[kind](*args)


def home_moods():
    on_off = "[[[ return entity.state === 'on' ? 'On' : 'Off'; ]]]"
    return [
        mood("script.goodnight", "Goodnight", "[[[ return 'Every light off'; ]]]",
             ("#7f86ff", "#2b2f7a")),
        mood("script.heatpump_cool_30min", "Heat / Cool", "[[[ return 'Heatpump, 30 min'; ]]]",
             ("#7fe0d6", "#2a8f88")),
        mood("input_boolean.guest_mode", "Guest Mode", on_off, ("#9be39f", "#2f9a5a"),
             toggle=True),
    ]


def home_sections():
    top = [title("My Home", WHO),
           summary("Lights", "mdi:lightbulb-group", AMBER, LIGHTS_ON,
                   {"action": "navigate", "navigation_path": "/ha-homey/lights"}),
           summary("Speakers", "mdi:music-note", PURPLE, PLAYING,
                   {"action": "navigate", "navigation_path": "/ha-homey/speakers"}),
           summary("Climate", "mdi:thermometer", ORANGE, CLIMATE,
                   {"action": "navigate", "navigation_path": "/ha-homey/climate"}),
           summary("Activity", "mdi:walk", "#3b82f6", OPEN,
                   {"action": "navigate", "navigation_path": "/ha-homey/activity"}),
           ] + home_moods()
    out = [{"type": "grid", "cards": top}]
    for name, icon, group, items in ROOMS:
        out.append({"type": "grid", "cards": [room(name, icon, group)] + [_card(i) for i in items]})
    return out


def filtered(kinds):
    """Rooms again, holding only the given device kinds; empty rooms drop out."""
    out = []
    for name, icon, group, items in ROOMS:
        keep = [_card(i) for i in items if i[0] in kinds]
        if keep:
            out.append({"type": "grid", "cards": [room(name, icon, group)] + keep})
    return out


def view(path, title_text, sections, sub=True):
    v = {"title": title_text, "path": path, "type": "sections", "theme": "Overlook",
         "max_columns": 4, "dense_section_placement": True, "badges": [],
         "sections": sections}
    if sub:
        v.update(subview=True, back_path=HOME)
    return v


def build():
    return {"views": [
        view("home", "My Home", home_sections(), sub=False),
        view("lights", "Lights", filtered({"light", "mood"})),
        view("speakers", "Speakers", filtered({"speaker", "tv"})),
        view("climate", "Climate", filtered({"thermostat", "sensor", "plug"})),
        view("activity", "Activity", filtered({"opening", "plant"})),
    ]}
