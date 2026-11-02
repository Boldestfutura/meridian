"""Test dashboard (ha-homey): the phone dashboard with Homey-style light tiles.

Copies the LIVE ha-phone config, so every hand edit on the phone comes along,
and swaps only the light tiles. Everything else is the phone, card for card.

The light tile borrows Homey's device tile, kept at the phone's 56px half-width
size: an outline lamp icon with no circle, the name and brightness, and a dot
on the right in the bulb's actual colour. A light that is off goes flat grey
and fades back; one that is on sits on a white card.

Rebuild with `./deploy.py homey`; it re-reads the phone each time.
"""
import copy
import ha_ws
from design import INK, MUTED, SURF, FONT, mix

AMBER = "#f5b041"     # dot for a dimmable-only bulb, which reports no colour
GREY = mix(INK, 14)

ICONS = {
    "light.kitchen_light_2": "mdi:ceiling-light-outline",
    "light.bench_lamp": "mdi:desk-lamp",
    "light.couch_lamp": "mdi:floor-lamp-outline",
    "light.tv_lamp": "mdi:lamp-outline",
    "light.corner_light": "mdi:floor-lamp-torchiere-outline",
    "light.mushroom_lamp": "mdi:mushroom-outline",
    "light.bedside_left": "mdi:lamp-outline",
    "light.bedside_right": "mdi:lamp-outline",
    "light.guest_bedroom_lamp": "mdi:lamp-outline",
}


def light(entity, name, keep):
    on = "entity.state === 'on'"
    colour = ("(entity.state !== 'on') ? '%s' : (entity.attributes.rgb_color ? "
              "'rgb(' + entity.attributes.rgb_color.join(',') + ')' : '%s')" % (GREY, AMBER))
    pick = lambda a, b: "[[[ return (%s) ? %s : %s; ]]]" % (on, a, b)
    card = {
        "type": "custom:button-card", "entity": entity, "name": name,
        "icon": ICONS.get(entity, "mdi:lightbulb-outline"),
        "show_state": True,
        "state_display": "[[[ if (entity.state !== 'on') return 'Off';"
                         " const b = entity.attributes.brightness;"
                         " return b ? Math.round(b / 2.55) + '%' : 'On'; ]]]",
        "tap_action": {"action": "toggle"}, "hold_action": {"action": "more-info"},
        "custom_fields": {"d": "[[[ return `<div style=\"width:18px;height:18px;"
                               "border-radius:50%%;background:${%s};box-shadow:0 0 0 2px %s,"
                               "0 1px 3px rgba(0,0,0,.22)\"></div>`; ]]]" % (colour, SURF)},
        "styles": {
            "card": [{"height": "56px"}, {"border-radius": "16px"}, {"border": "none"},
                     {"padding": "0 12px 0 10px"}, {"font-family": FONT},
                     {"background": pick("'%s'" % SURF, "'%s'" % mix(INK, 5, "transparent"))},
                     {"box-shadow": pick("'0 1px 3px rgba(0,0,0,.08)'", "'none'")}],
            "grid": [{"grid-template-areas": '"i n d" "i s d"'},
                     {"grid-template-columns": "26px 1fr auto"},
                     {"grid-template-rows": "1fr 1fr"}, {"column-gap": "8px"},
                     {"align-items": "center"}, {"width": "100%"}],
            "img_cell": [{"justify-content": "center"}],
            "icon": [{"width": "24px"}, {"color": pick("'%s'" % INK, "'%s'" % MUTED)},
                     {"opacity": pick("'1'", "'.6'")}],
            "name": [{"font-size": "14px"}, {"font-weight": "600"}, {"justify-self": "start"},
                     {"align-self": "end"}, {"white-space": "nowrap"}, {"overflow": "hidden"},
                     {"text-overflow": "ellipsis"}, {"max-width": "100%"},
                     {"color": pick("'%s'" % INK, "'%s'" % MUTED)}],
            "state": [{"font-size": "12px"}, {"color": MUTED}, {"justify-self": "start"},
                      {"align-self": "start"}],
            "custom_fields": {"d": [{"align-self": "center"}]},
        },
        "extra_styles": "#card{transition:transform 90ms ease,background 200ms ease}"
                        "#card:active{transform:scale(.97) !important}",
    }
    for k in ("grid_options", "visibility"):
        if k in keep:
            card[k] = keep[k]
    return card


def build():
    import deploy
    ws, ids = deploy.connect()
    cfg = copy.deepcopy(ha_ws.call(ws, next(ids), type="lovelace/config",
                                   url_path="ha-phone")["result"])
    for v in cfg["views"]:
        for s in v.get("sections", []):
            s["cards"] = [light(c["entity"], c.get("name") or c["entity"], c)
                          if c.get("type") == "custom:button-card"
                          and c.get("entity", "").startswith("light.") else c
                          for c in s.get("cards", [])]
    return cfg
