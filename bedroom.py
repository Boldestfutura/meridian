"""Master Bedroom bedside screen: an Echo Show 5 (2nd gen), 960x480, rooted.

Laid out after the Stockpot Echo Show enclosure's demo screen: an ambient
clock filling the screen, with a slim vertical rail of page icons on the right.
The look is the Overlook language, not the demo's: Figtree, 26px surfaces,
color-mix tints, and the bedroom's own accent (MAUVE, as on its scene tile).

Four `panel` views - Clock, Lights, Music, Air. A panel view renders only its
first card, so each one is a single button-card holding the page and the rail.
Bubble Card pop-ups do not open from a panel view (see kitchen.py), so every
hold goes to HA's own more-info dialog.

Heights follow the screen rather than a fixed px budget: on a browser HA's
toolbar takes --header-height (56px), in a kiosk it is gone, and the page
should fill whatever is left either way.
"""
import design as d
import scenes
import tablet

ROOM    = "Master Bedroom"
ACCENT  = d.MAUVE
URL     = "ha-bedroom"
PLAYER  = "media_player.homepod_mini_master_bedroom_2"   # the Music Assistant player
LIGHTS  = "light.master_bedroom_lights"
TEMP    = "sensor.air_quality_monitor_temperature_2"
HUMID   = "sensor.air_quality_monitor_humidity_2"
PM25    = "sensor.air_quality_monitor_pm2_5_2"
VOC     = "sensor.air_quality_monitor_voc_index_2"
DEHUM   = "switch.tp_link_power_strip_6e3f_dehumidifier"

GAP = 12
# Usable height: the viewport, less the toolbar (if any) and the wrapper padding.
FULL = "calc(100vh - var(--header-height, 56px) - %dpx)" % (2 * GAP)
SCENE_H = 64            # the scene row under the lamps
PLAYLIST_H = 3 * 56 + 2 * 8   # three rows of playlist slots, HA grid gap 8px


def _centred(c):
    """d.light pins the circle to the top and the name to the bottom (1fr row),
    which leaves a hole in a tall tile. Here the three sit together, centred."""
    c["styles"]["grid"] = [{"grid-template-areas": '"i" "n" "s"'},
                           {"grid-template-rows": "auto auto auto"}, {"width": "100%"},
                           {"height": "100%"}, {"align-content": "center"}]
    return c


def less(px, parts=1):
    """FULL minus `px`, split `parts` ways. Every card gets an explicit height:
    a nested button-card's host has no height, so 100% resolves to nothing."""
    return "calc((100vh - var(--header-height, 56px) - %dpx) / %d)" % (2 * GAP + px, parts)

#        path      title     icon
PAGES = [("clock",  "Clock",  "mdi:home"),
         ("lights", "Lights", "mdi:lightbulb-group"),
         ("music",  "Music",  "mdi:music"),
         ("air",    "Air",    "mdi:thermometer")]

# What lights a rail icon up when the page has something going on.
BUSY = {"lights": ("states['%s'].state === 'on'" % LIGHTS, d.AMBER),
        "music":  ("states['%s'].state === 'playing'" % PLAYER, d.VIOLET),
        "air":    ("states['%s'].state === 'on'" % DEHUM, d.BLUE)}


def _bare(extra=None):
    """A transparent button-card shell with no chrome of its own."""
    return [{"background": "transparent"}, {"box-shadow": "none"}, {"border": "none"},
            {"padding": "0"}, {"font-family": d.FONT}] + (extra or [])


def rail_button(path, title, icon, active):
    busy, tint = BUSY.get(path, ("false", ACCENT))
    if active:
        bg, fg = ACCENT, "#ffffff"
    else:
        bg = "[[[ return %s ? '%s' : 'transparent'; ]]]" % (busy, d.mix(tint, 22))
        fg = "[[[ return %s ? '%s' : '%s'; ]]]" % (busy, tint, d.MUTED)
    return {
        "type": "custom:button-card", "icon": icon, "name": title,
        "show_name": False, "show_state": False,
        "triggers_update": "all",
        "tap_action": {"action": "navigate", "navigation_path": "/%s/%s" % (URL, path)},
        "hold_action": {"action": "none"},
        "styles": {
            "card": [{"width": "48px"}, {"height": "48px"}, {"border-radius": "50%"},
                     {"padding": "0"}, {"box-shadow": "none"}, {"border": "none"},
                     {"margin": "0 auto"}, {"background": bg}],
            "icon": [{"width": "24px"}, {"color": fg}],
        },
    }


def rail(active):
    """The vertical page switcher, as on the demo screen: a pill down the right edge."""
    return {
        "type": "custom:button-card",
        "show_icon": False, "show_name": False, "show_state": False,
        "tap_action": {"action": "none"},
        "styles": {
            "card": d.base(d.SURF, pad="8px 0") + [{"height": FULL}],
            "grid": [{"grid-template-areas": '"%s"' % '" "'.join(p for p, _, _ in PAGES)},
                     {"grid-template-rows": "repeat(%d, auto)" % len(PAGES)},
                     {"align-content": "space-evenly"}, {"height": "100%"}],
        },
        "custom_fields": {p: {"card": rail_button(p, t, i, p == active)} for p, t, i in PAGES},
    }


def page(path, body, entity=None, triggers=None):
    """Body on the left, rail on the right, filling the screen."""
    card = {
        "type": "custom:button-card",
        "show_icon": False, "show_name": False, "show_state": False,
        "tap_action": {"action": "none"},
        "styles": {
            "card": _bare([{"padding": "%dpx" % GAP}, {"overflow": "visible"}]),
            "grid": [{"grid-template-areas": '"m r"'},
                     {"grid-template-columns": "minmax(0, 1fr) 64px"},
                     {"column-gap": "%dpx" % GAP}, {"align-items": "stretch"}],
            "custom_fields": {"m": [{"min-width": "0"}, {"justify-self": "stretch"}],
                              "r": [{"justify-self": "stretch"}]},
        },
        "custom_fields": {"m": {"card": body}, "r": {"card": rail(path)}},
    }
    if entity:
        card["entity"] = entity
    if triggers:
        card["triggers_update"] = triggers
    title = next(t for p, t, _ in PAGES if p == path)
    view = {"title": title, "path": path, "type": "panel", "theme": "Overlook",
            "badges": [], "cards": [card]}
    if path != PAGES[0][0]:
        view["visible"] = False
    return view


# ---------------------------------------------------------------------------
# Clock
# ---------------------------------------------------------------------------

PHOTOS = "camera.album_slideshow_family"   # the kitchen's Immich Family album


def clock():
    """The ambient screen: the Family album full-bleed, as on the kitchen's
    photo view, with the clock over it in white.

    The photo is a picture-entity sized to cover the card - at least as wide
    as 16:9 of the card's height, centred, the card cropping the overflow -
    the same trick as kitchen.photo_view. A gradient scrim sits between it
    and the text so a bright photo cannot wash the clock out. If the camera
    is unavailable the card's own background shows instead: the bedroom
    blobs, darkened by the same scrim.
    """
    art = ", ".join([
        "radial-gradient(circle at 18% 88%, " + d.mix(ACCENT, 34) + " 0 28%, transparent 28.5%)",
        "radial-gradient(circle at 92% 8%, " + d.mix(d.INDIGO, 26) + " 0 24%, transparent 24.5%)",
        "radial-gradient(ellipse 60% 80% at 72% 96%, " + d.mix(d.AMBER, 20) + " 0 50%, transparent 51%)",
        d.mix(ACCENT, 9),
    ])
    face = """[[[
      const W = %s; const e = states['weather.forecast_home'];
      const w = (e && W[e.state]) || %s;
      const t = e ? Math.round(e.attributes.temperature) : null;
      const n = new Date();
      const parts = new Intl.DateTimeFormat('en-AU',{hour:'numeric',minute:'2-digit'}).formatToParts(n);
      const hm = parts.filter(p => p.type === 'hour' || p.type === 'minute' || p.type === 'literal' && p.value === ':')
                      .map(p => p.value).join('');
      const ap = (parts.find(p => p.type === 'dayPeriod') || {}).value || '';
      const dt = n.toLocaleDateString('en-AU',{weekday:'long',day:'numeric',month:'long'});
      const r = states['%s'], h = states['%s'];
      const ok = s => s && !['unavailable','unknown'].includes(s.state);
      const room = ok(r) ? `${Math.round(parseFloat(r.state))}\u00B0 inside` + (ok(h) ? ` \u00B7 ${Math.round(parseFloat(h.state))}%% humidity` : '') : '';
      const dot = `<span style="opacity:.6;margin:0 8px">\u00B7</span>`;
      return `<div style="display:flex;align-items:baseline;justify-content:center;gap:10px">
                <span style="font-size:min(128px, 27vh);font-weight:600;letter-spacing:-.045em;line-height:1">${hm}</span>
                <span style="font-size:min(28px, 6vh);font-weight:600;opacity:.85">${ap}</span></div>
              <div style="font-size:min(22px, 4.8vh);font-weight:600;margin-top:10px">${dt}</div>
              <div style="display:inline-flex;align-items:center;margin-top:16px;padding:8px 16px;border-radius:999px;
                          background:rgba(0,0,0,.32);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
                          text-shadow:none;font-size:min(16px, 3.6vh);font-weight:600">
                <ha-icon icon="${w.ic}" style="--mdc-icon-size:20px;margin-right:8px"></ha-icon>
                ${w.nm}${t == null ? '' : ' ' + t + '\u00B0'}${room ? dot + room : ''}</div>`;
    ]]]""" % (d.WJS, d.FALLBACK, TEMP, HUMID)
    cover = "max(100%%, calc(%s * 16 / 9))" % less(0)
    return {
        "type": "custom:button-card", "entity": "sensor.time",
        "triggers_update": ["weather.forecast_home", TEMP, HUMID],
        "show_icon": False, "show_name": False, "show_state": False,
        "tap_action": {"action": "none"},
        "styles": {
            "card": d.base(art, pad="0") + [{"height": FULL}, {"position": "relative"},
                                             {"overflow": "hidden"}],
            "grid": [{"grid-template-areas": '"f"'}, {"height": "100%"},
                     {"align-content": "center"}],
            "custom_fields": {
                "p": [{"position": "absolute"}, {"left": "50%"}, {"top": "50%"},
                      {"transform": "translate(-50%, -50%)"}, {"width": cover},
                      {"pointer-events": "none"},
                      # a backdrop, not the subject: dimmed and a little
                      # desaturated so the clock leads
                      {"filter": "brightness(.5) saturate(.8)"}],
                "s": [{"position": "absolute"}, {"inset": "0"}, {"pointer-events": "none"},
                      {"background": "radial-gradient(ellipse 75% 70% at 50% 50%,"
                                     " rgba(0,0,0,.42), rgba(0,0,0,.18))"}],
                "f": [{"justify-self": "center"}, {"text-align": "center"}, {"z-index": "1"},
                      {"color": "#fff"},
                      {"text-shadow": "0 1px 3px rgba(0,0,0,.55), 0 2px 14px rgba(0,0,0,.4)"}],
            },
        },
        "custom_fields": {
            "p": {"card": {
                "type": "picture-entity", "entity": PHOTOS,
                "camera_view": "auto", "fit_mode": "cover",
                "show_name": False, "show_state": False,
                "tap_action": {"action": "none"}, "hold_action": {"action": "none"},
                "double_tap_action": {"action": "none"},
            }},
            "s": "",
            "f": face,
        },
    }


# ---------------------------------------------------------------------------
# Lights
# ---------------------------------------------------------------------------

def lights():
    lamps = [("light.bedside_left", "Bedside Left", "mdi:lamp"),
             ("light.bedside_right", "Bedside Right", "mdi:lamp"),
             ("light.mushroom_lamp", "Mushroom Lamp", "mdi:mushroom-outline"),
             (LIGHTS, "All Bedroom", "mdi:lightbulb-group")]
    row = []
    for e, n, i in lamps:
        c = _centred(d.light(e, n, circle=72, glyph=36, icon=i))
        c["styles"]["card"].append({"height": less(GAP + SCENE_H)})
        row.append(c)
    keep = {"script.bedroom_dimmed", "script.goodnight"}
    sc = [scenes.card(*s, height=SCENE_H) for s in scenes.SCENES if s[0] in keep]
    return _stack([_row(row)],
                  [{"type": "grid", "columns": len(sc), "square": False, "cards": sc}],
                  top="auto", bottom="auto")


def _row(cards):
    """Cards side by side, each stretched to the row's full height. HA's own
    grid card sizes rows to content, so a 100%-height card collapses in it."""
    keys = "abcdefgh"[:len(cards)]
    return {
        "type": "custom:button-card",
        "show_icon": False, "show_name": False, "show_state": False,
        "tap_action": {"action": "none"},
        "styles": {
            "card": _bare([{"height": "100%"}, {"overflow": "visible"}]),
            "grid": [{"grid-template-areas": '"%s"' % " ".join(keys)},
                     {"grid-template-columns": "repeat(%d, minmax(0, 1fr))" % len(cards)},
                     {"column-gap": "%dpx" % GAP}, {"height": "100%"}],
            "custom_fields": {k: [{"justify-self": "stretch"}, {"height": "100%"},
                                  {"min-height": "0"}] for k in keys},
        },
        "custom_fields": {k: {"card": c} for k, c in zip(keys, cards)},
    }


def _stack(top_cards, bottom_cards, top="1fr", bottom="auto"):
    """Two rows that together fill the page height."""
    return {
        "type": "custom:button-card",
        "show_icon": False, "show_name": False, "show_state": False,
        "tap_action": {"action": "none"},
        "styles": {
            "card": _bare([{"height": FULL}, {"overflow": "visible"}]),
            "grid": [{"grid-template-areas": '"t" "b"'},
                     {"grid-template-rows": "%s %s" % (top, bottom)},
                     {"row-gap": "%dpx" % GAP}, {"height": "100%"}],
            "custom_fields": {"t": [{"justify-self": "stretch"}, {"min-height": "0"},
                                    {"height": "100%"}],
                              "b": [{"justify-self": "stretch"}]},
        },
        "custom_fields": {
            "t": {"card": top_cards[0] if len(top_cards) == 1 else
                  {"type": "vertical-stack", "cards": top_cards}},
            "b": {"card": bottom_cards[0] if len(bottom_cards) == 1 else
                  {"type": "vertical-stack", "cards": bottom_cards}},
        },
    }


# ---------------------------------------------------------------------------
# Music
# ---------------------------------------------------------------------------

def music():
    now = d.media_card(PLAYER, "Bedroom HomePod",
                       controls=("prev", "play", "next", "vol_down", "vol_up"), volume=True)
    now["styles"]["card"] = [{"height": less(GAP + PLAYLIST_H)} if "height" in x else x
                             for x in now["styles"]["card"]]
    now["styles"]["card"] = [{"border-radius": "26px"} if "border-radius" in x else x
                             for x in now["styles"]["card"]]
    # bedside size: bigger artwork and type than the tablet's 124px card
    a = now["custom_fields"]["a"]
    now["custom_fields"]["a"] = a.replace("width:42px;height:42px", "width:96px;height:96px") \
                                 .replace("border-radius:10px", "border-radius:18px") \
                                 .replace("--mdc-icon-size:21px;width:21px;height:21px",
                                          "--mdc-icon-size:44px;width:44px;height:44px")
    t = now["custom_fields"]["t"]
    now["custom_fields"]["t"] = t.replace("font-size:14px", "font-size:22px") \
                                 .replace("font-size:12px", "font-size:16px")
    now["styles"]["grid"][1] = {"grid-template-columns": "96px 1fr auto"}
    now["styles"]["grid"].append({"column-gap": "18px"})
    now["styles"]["card"] = [{"padding": "18px"} if "padding" in x else x
                             for x in now["styles"]["card"]]
    slots = []
    for i in range(6):
        s = tablet.playlist_slot(i, player=PLAYER)
        # a panel view ignores `visibility`; the slot already renders empty
        # when there is no playlist for it
        s.pop("visibility", None)
        slots.append(s)
    return _stack([now], [{"type": "grid", "columns": 2, "square": False, "cards": slots}],
                  top="auto", bottom="auto")


# ---------------------------------------------------------------------------
# Air
# ---------------------------------------------------------------------------

def reading(entity, label, icon, accent, unit, verdict_js="''"):
    """A big-number sensor card: tile_sensor's colours at bedside-screen size."""
    return {
        "type": "custom:button-card", "entity": entity,
        "show_icon": False, "show_name": False, "show_state": False,
        "tap_action": {"action": "more-info"},
        "styles": {
            "card": d.base(d.mix(accent, 14), pad="14px 16px") + [{"height": less(GAP, 2)}],
            "grid": [{"grid-template-areas": '"i v" "n n"'},
                     {"grid-template-columns": "44px 1fr"},
                     {"grid-template-rows": "1fr auto"}, {"height": "100%"},
                     {"column-gap": "10px"}],
            "custom_fields": {"i": [{"align-self": "start"}],
                              "v": [{"justify-self": "end"}, {"align-self": "start"}],
                              "n": [{"justify-self": "start"}, {"text-align": "left"},
                                    {"align-self": "end"}]},
        },
        "custom_fields": {
            "i": """<div style="width:44px;height:44px;border-radius:50%%;background:%s;display:flex;
                     align-items:center;justify-content:center"><ha-icon icon="%s"
                     style="--mdc-icon-size:22px;color:%s"></ha-icon></div>""" % (d.mix(accent, 22), icon, accent),
            "v": """[[[
              const s = states['%s'].state;
              if (['unavailable','unknown'].includes(s)) return `<div style="font-size:15px;color:%s">No reading</div>`;
              const v = Math.round(parseFloat(s));
              return `<div style="font-size:56px;font-weight:700;color:%s;letter-spacing:-.03em;line-height:1">${v}<span style="font-size:17px;font-weight:600;color:%s;margin-left:2px">%s</span></div>`;
            ]]]""" % (entity, d.MUTED, d.INK, d.MUTED, unit),
            "n": """[[[
              const v = parseFloat(states['%s'].state); const q = isNaN(v) ? '' : (%s);
              return `<div style="font-size:15px;font-weight:600;color:%s">%s</div>
                      <div style="font-size:13px;color:%s;margin-top:2px">${q || '&nbsp;'}</div>`;
            ]]]""" % (entity, verdict_js, d.INK, label, accent),
        },
    }


def air():
    cards = [
        reading(TEMP, "Temperature", "mdi:thermometer", d.AMBER, "°",
                "v < 17 ? 'Cool' : (v > 25 ? 'Warm' : 'Comfortable')"),
        reading(HUMID, "Humidity", "mdi:water-percent", d.BLUE, "%",
                "v < 35 ? 'Dry' : (v > 60 ? 'Humid' : 'Comfortable')"),
        reading(PM25, "Fine dust (PM2.5)", "mdi:blur", d.GREEN, "",
                "v <= 12 ? 'Good' : (v <= 35 ? 'Moderate' : 'Poor')"),
        reading(VOC, "Air quality (VOC)", "mdi:air-filter", d.TEAL, "",
                "v <= 150 ? 'Good' : (v <= 250 ? 'Moderate' : 'Poor')"),
    ]
    dh = _centred(d.light(DEHUM, "Dehumidifier", circle=64, glyph=32, icon="mdi:air-humidifier",
                 on_bg=d.BLUE_BG, on_ac=d.BLUE))
    dh["styles"]["card"].append({"height": less(0)})
    return {
        "type": "custom:button-card",
        "show_icon": False, "show_name": False, "show_state": False,
        "tap_action": {"action": "none"},
        "styles": {
            "card": _bare([{"height": FULL}, {"overflow": "visible"}]),
            "grid": [{"grid-template-areas": '"a b d" "c e d"'},
                     {"grid-template-columns": "1fr 1fr 0.8fr"},
                     {"grid-template-rows": "1fr 1fr"},
                     {"gap": "%dpx" % GAP}, {"height": "100%"}],
            "custom_fields": {k: [{"justify-self": "stretch"}, {"height": "100%"},
                                  {"min-height": "0"}] for k in "abcde"},
        },
        "custom_fields": dict(zip("abce", ({"card": c} for c in cards)), d={"card": dh}),
    }


def build():
    return {"title": ROOM, "views": [
        page("clock", clock()),
        page("lights", lights()),
        page("music", music()),
        page("air", air()),
    ]}
