"""Second Homey test (ha-homey2): Homey's layout in the phone dashboard's look.

Same structure as homey.py, minus its "My Home" heading: two-up summary cards
that open filtered subviews, moods, then each room as square tiles three to a
row. The styling is Overlook's, as on ha-phone: tiles tint with their accent
when on, a filled icon circle, the state written in the accent, no shadows,
and the phone's own room headers with the light-group button.

Built fresh, so `./deploy.py homey2` is safe until Cameron edits it by hand.
"""
import design as d
import homey
from design import INK, MUTED, SURF, FONT, mix

HOME = "/ha-homey2/home"
TILE_H = 120


def grid(card, cols, rows=None, entity=None):
    return homey.grid(card, cols, rows, entity)


def summary(label, icon, accent, sub_js, path):
    return grid({
        "type": "custom:button-card", "name": label, "icon": icon, "show_state": False,
        "tap_action": {"action": "navigate", "navigation_path": "/ha-homey2/" + path},
        "custom_fields": {"s": sub_js},
        "styles": {
            "card": [{"height": "56px"}, {"border-radius": "16px"}, {"box-shadow": "none"},
                     {"border": "none"}, {"padding": "0 10px"}, {"font-family": FONT},
                     {"background": mix(accent, 14)}],
            "grid": [{"grid-template-areas": '"i n" "i s"'},
                     {"grid-template-columns": "36px 1fr"}, {"grid-template-rows": "1fr 1fr"},
                     {"align-items": "center"}, {"column-gap": "10px"}, {"width": "100%"}],
            "img_cell": [{"background": mix(accent, 24)}, {"border-radius": "50%"},
                         {"width": "36px"}, {"height": "36px"}],
            "icon": [{"width": "19px"}, {"color": accent}],
            "name": [{"font-size": "14px"}, {"font-weight": "600"}, {"color": INK},
                     {"justify-self": "start"}, {"align-self": "end"}],
            "custom_fields": {"s": [{"justify-self": "start"}, {"align-self": "start"},
                                    {"font-size": "12px"}, {"color": MUTED},
                                    {"white-space": "nowrap"}, {"overflow": "hidden"},
                                    {"text-overflow": "ellipsis"}, {"max-width": "100%"}]},
        },
    }, 6)


def mood(entity, label, icon, accent, cols, toggle=False):
    c = d.tile_scene(entity, label, icon, accent=accent)
    c["hold_action"] = {"action": "more-info"}
    if toggle:
        c["tap_action"] = {"action": "toggle"}
    return grid(c, cols)


def device(entity, name, icon, accent_js, on_js, state_js, tap=None, hold=None, mark_js=None):
    """Square tile in the phone's colours. `accent_js` is a JS expression for
    the colour, so a plant can turn amber when it is dry."""
    a = "[[[ const a = %s; return (%s) ? %%s : %%s; ]]]" % (accent_js, on_js)
    mixed = lambda pct: "color-mix(in srgb, ${a} %d%%, %s)" % (pct, SURF)
    card = {
        "type": "custom:button-card", "entity": entity, "name": name, "icon": icon,
        "show_state": True, "state_display": "[[[ %s ]]]" % state_js,
        "tap_action": tap or {"action": "toggle"},
        "hold_action": hold or {"action": "more-info"},
        "styles": {
            "card": [{"height": "%dpx" % TILE_H}, {"border-radius": "20px"},
                     {"box-shadow": "none"}, {"border": "none"}, {"padding": "12px"},
                     {"font-family": FONT},
                     {"background": a % ("`%s`" % mixed(16), "'%s'" % SURF)}],
            "grid": [{"grid-template-areas": '"i m" "n n" "s s"'},
                     {"grid-template-columns": "1fr auto"},
                     {"grid-template-rows": "1fr auto auto"}, {"height": "100%"}],
            "img_cell": [{"justify-self": "start"}, {"align-self": "start"},
                         {"width": "40px"}, {"height": "40px"}, {"border-radius": "50%"},
                         {"background": a % ("a", "'%s'" % d.NEUTRAL)}],
            "icon": [{"width": "21px"},
                     {"color": a % ("'#ffffff'", "'%s'" % MUTED)}],
            "name": [{"justify-self": "start"}, {"text-align": "left"}, {"font-size": "14px"},
                     {"font-weight": "600"}, {"color": INK}, {"white-space": "nowrap"},
                     {"overflow": "hidden"}, {"text-overflow": "ellipsis"}, {"max-width": "100%"}],
            "state": [{"justify-self": "start"}, {"text-align": "left"}, {"font-size": "12px"},
                      {"margin-top": "1px"}, {"white-space": "nowrap"}, {"overflow": "hidden"},
                      {"text-overflow": "ellipsis"}, {"max-width": "100%"},
                      {"color": a % ("a", "'%s'" % MUTED)}],
            "custom_fields": {"m": [{"justify-self": "end"}, {"align-self": "start"}]},
        },
        "extra_styles": "#card{transition:transform 90ms ease,background 200ms ease}"
                        "#card:active{transform:scale(.96) !important}",
    }
    if mark_js:
        card["custom_fields"] = {"m": "[[[ %s ]]]" % mark_js}
    return grid(card, 4, 2, entity)


def q(s):
    return "'%s'" % s


ON = "entity.state === 'on'"
ONOFF = "return entity.state === 'on' ? 'On' : 'Off';"
CAP = "entity.state.charAt(0).toUpperCase() + entity.state.slice(1)"


def light(entity, name, icon="mdi:lightbulb"):
    st = ("if (entity.state !== 'on') return 'Off';"
          " const b = entity.attributes.brightness;"
          " return b ? Math.round(b / 2.55) + '%' : 'On';")
    return device(entity, name, icon.replace("-outline", ""), q(d.AMBER), ON, st)


def plug(entity, name, icon):
    return device(entity, name, icon, q(d.BLUE), ON, ONOFF)


def speaker(entity, name, icon="mdi:speaker"):
    playing = "entity.state === 'playing'"
    bars = ("if (entity.state !== 'playing') return '';"
            "const b = [9,15,11,17].map((h,i) => `<i style=\"display:block;width:3px;"
            "height:${h}px;border-radius:2px;background:%s;animation:hb 900ms ${i*120}ms "
            "ease-in-out infinite alternate\"></i>`).join('');"
            "return `<div style=\"display:flex;align-items:flex-end;gap:3px;height:18px\">${b}</div>`;"
            % d.VIOLET)
    st = ("const t = entity.attributes.media_title;"
          " return entity.state === 'playing' && t ? t : %s;" % CAP)
    c = device(entity, name, icon, q(d.VIOLET), "['playing','paused'].includes(entity.state)", st,
               tap={"action": "call-service", "service": "media_player.media_play_pause",
                    "service_data": {"entity_id": entity}}, mark_js=bars)
    c["extra_styles"] += ("@keyframes hb{from{transform:scaleY(.35)}to{transform:scaleY(1)}}"
                          "i{transform-origin:bottom}")
    return c


def tv(entity, name):
    on = "!['off','standby','unavailable'].includes(entity.state)"
    return device(entity, name, "mdi:television", q(d.INDIGO), on,
                  "return (%s) ? %s : 'Off';" % (on, CAP), tap={"action": "more-info"})


def thermostat(entity, name):
    colour = "entity.state === 'cool' ? '%s' : '%s'" % (d.COOLBLU, d.HEAT)
    st = ("if (entity.state === 'off') return 'Off';"
          " return %s + ' · ' + Math.round(entity.attributes.temperature) + '°';" % CAP)
    return device(entity, name, "mdi:thermostat", colour, "entity.state !== 'off'", st,
                  tap={"action": "more-info"})


def sensor(entity, name, icon, unit):
    return device(entity, name, icon.replace("-outline", ""), q(d.BLUE), "true",
                  "return Math.round(parseFloat(entity.state)) + '%s';" % unit,
                  tap={"action": "more-info"})


def plant(entity, name):
    colour = "parseFloat(entity.state) < 25 ? '%s' : '%s'" % (d.AMBER, d.LEAF)
    return device(entity, name, "mdi:sprout", colour, "true",
                  "const v = Math.round(parseFloat(entity.state));"
                  " return v + '%' + (v < 25 ? ' · thirsty' : '');",
                  tap={"action": "more-info"})


def opening(entity, name, icon_closed, icon_open):
    c = device(entity, name, icon_closed, q(d.AMBER), ON,
               "return entity.state === 'on' ? 'Open' : 'Closed';",
               tap={"action": "more-info"})
    c["icon"] = "[[[ return entity.state === 'on' ? '%s' : '%s'; ]]]" % (icon_open, icon_closed)
    return c


KINDS = {"light": light, "speaker": speaker, "tv": tv, "thermostat": thermostat,
         "sensor": sensor, "plant": plant, "opening": opening, "plug": plug}

# the room moods, keyed by script, in the accents scenes.py gives them
SCENE = {s[0]: s for s in __import__("scenes").SCENES}


def _card(item):
    kind, *args = item
    if kind == "mood":
        _, label, icon, accent, _t = SCENE[args[0]]
        return mood(args[0], label, icon, accent, "full")
    return KINDS[kind](*args)


def room(name, icon, group):
    return grid(d.room_header(name, icon, group), "full")


def home_section():
    g, h, gm = (SCENE[e] for e in ("script.goodnight", "script.heatpump_cool_30min",
                                   "input_boolean.guest_mode"))
    return {"type": "grid", "cards": [
        summary("Lights", "mdi:lightbulb-group", d.AMBER, homey.LIGHTS_ON, "lights"),
        summary("Speakers", "mdi:music-note", d.VIOLET, homey.PLAYING, "speakers"),
        summary("Climate", "mdi:thermometer", d.HEAT, homey.CLIMATE, "climate"),
        summary("Activity", "mdi:door-open", d.BLUE, homey.OPEN, "activity"),
        room("Scenes", "mdi:creation", None),
        mood(gm[0], gm[1], gm[2], gm[3], "full", toggle=True),
        mood(g[0], g[1], g[2], g[3], 6),
        mood(h[0], h[1], h[2], h[3], 6),
    ]}


def rooms(kinds=None):
    out = []
    for name, icon, group, items in homey.ROOMS:
        keep = [_card(i) for i in items if kinds is None or i[0] in kinds]
        if keep:
            out.append({"type": "grid", "cards": [room(name, icon.replace("-outline", ""), group)] + keep})
    return out


def view(path, title, sections, sub=True):
    v = homey.view(path, title, sections, sub)
    if sub:
        v["back_path"] = HOME
    return v


def build():
    return {"views": [
        view("home", "Home", [home_section()] + rooms(), sub=False),
        view("lights", "Lights", rooms({"light", "mood"})),
        view("speakers", "Speakers", rooms({"speaker", "tv"})),
        view("climate", "Climate", rooms({"thermostat", "sensor", "plug"})),
        view("activity", "Activity", rooms({"opening", "plant"})),
    ]}
