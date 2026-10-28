"""Room screens: one room per display, a clock home page and a rail of pages.

First built for the bedroom's Echo Show 5 (bedroom.py), then the kitchen's
Nest Hub moved to the same layout (kitchen.py). This is the shared part; each
room module only says which entities go on which page.

Laid out after the Stockpot Echo Show enclosure's demo screen: an ambient
clock filling the screen, with a slim vertical rail of page icons on the right.
The look is the Overlook language, not the demo's: Figtree, 26px surfaces,
color-mix tints, and each room's own accent.

Every page is a `panel` view. A panel view renders only its first card, so
each one is a single button-card holding the page and the rail. Bubble Card
pop-ups do not open from a panel view, so every hold goes to HA's own
more-info dialog.

Heights follow the screen rather than a fixed px budget. In a browser HA's
toolbar takes --header-height (56px); a cast view (hc-main, the Nest Hub) and a
kiosk have none. The page fills whatever is left either way.
"""
import design as d
import scenes
import tablet

GAP = 12
SCENE_H = 64                  # the scene row under the lamps
PLAYLIST_H = 3 * 56 + 2 * 8   # three rows of playlist slots, HA grid gap 8px


def less(px, parts=1):
    """The usable height minus `px`, split `parts` ways.

    Every card gets an explicit height: a nested button-card's host has no
    height, so 100% resolves to nothing. It is a template because a cast view
    has no toolbar and does not define --header-height, so the 56px fallback
    would leave a band of nothing at the bottom of the Hub."""
    return ("[[[ return document.querySelector('hc-main')"
            " ? 'calc((100vh - %dpx) / %d)'"
            " : 'calc((100vh - var(--header-height, 56px) - %dpx) / %d)'; ]]]"
            % (2 * GAP + px, parts, 2 * GAP + px, parts))


FULL = less(0)


def bare(extra=None):
    """A transparent button-card shell with no chrome of its own."""
    return [{"background": "transparent"}, {"box-shadow": "none"}, {"border": "none"},
            {"padding": "0"}, {"font-family": d.FONT}] + (extra or [])


def centred(c):
    """d.light pins the circle to the top and the name to the bottom (1fr row),
    which leaves a hole in a tall tile. Here the three sit together, centred."""
    c["styles"]["grid"] = [{"grid-template-areas": '"i" "n" "s"'},
                           {"grid-template-rows": "auto auto auto"}, {"width": "100%"},
                           {"height": "100%"}, {"align-content": "center"}]
    return c


def row(cards):
    """Cards side by side, each stretched to the row's full height. HA's own
    grid card sizes rows to content, so a 100%-height card collapses in it."""
    keys = "abcdefgh"[:len(cards)]
    return {
        "type": "custom:button-card",
        "show_icon": False, "show_name": False, "show_state": False,
        "tap_action": {"action": "none"},
        "styles": {
            "card": bare([{"height": "100%"}, {"overflow": "visible"}]),
            "grid": [{"grid-template-areas": '"%s"' % " ".join(keys)},
                     {"grid-template-columns": "repeat(%d, minmax(0, 1fr))" % len(cards)},
                     {"column-gap": "%dpx" % GAP}, {"height": "100%"}],
            "custom_fields": {k: [{"justify-self": "stretch"}, {"height": "100%"},
                                  {"min-height": "0"}] for k in keys},
        },
        "custom_fields": {k: {"card": c} for k, c in zip(keys, cards)},
    }


def stack(top, bottom):
    """Two cards, one above the other, filling the page height."""
    return {
        "type": "custom:button-card",
        "show_icon": False, "show_name": False, "show_state": False,
        "tap_action": {"action": "none"},
        "styles": {
            "card": bare([{"height": FULL}, {"overflow": "visible"}]),
            "grid": [{"grid-template-areas": '"t" "b"'},
                     {"grid-template-rows": "auto auto"},
                     {"row-gap": "%dpx" % GAP}, {"height": "100%"}],
            "custom_fields": {"t": [{"justify-self": "stretch"}, {"min-height": "0"},
                                    {"height": "100%"}],
                              "b": [{"justify-self": "stretch"}]},
        },
        "custom_fields": {"t": {"card": top}, "b": {"card": bottom}},
    }


def reading(entity, label, icon, accent, unit, verdict_js="''"):
    """A big-number sensor card: tile_sensor's colours at wall-screen size.
    Two of them stack to the page height."""
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
            # Templates inside a nested card run in the OUTER card's context,
            # where `entity` is undefined - so the id is written out.
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


def air_readings(temp, humid, pm25, voc):
    """The four air-monitor cards, in the order they sit on the page."""
    return [
        reading(temp, "Temperature", "mdi:thermometer", d.AMBER, "°",
                "v < 17 ? 'Cool' : (v > 25 ? 'Warm' : 'Comfortable')"),
        reading(humid, "Humidity", "mdi:water-percent", d.BLUE, "%",
                "v < 35 ? 'Dry' : (v > 60 ? 'Humid' : 'Comfortable')"),
        reading(pm25, "Fine dust (PM2.5)", "mdi:blur", d.GREEN, "",
                "v <= 12 ? 'Good' : (v <= 35 ? 'Moderate' : 'Poor')"),
        reading(voc, "Air quality (VOC)", "mdi:air-filter", d.TEAL, "",
                "v <= 150 ? 'Good' : (v <= 250 ? 'Moderate' : 'Poor')"),
    ]


def air_page(readings, side):
    """Four readings in a 2x2 block with one full-height card beside them."""
    return {
        "type": "custom:button-card",
        "show_icon": False, "show_name": False, "show_state": False,
        "tap_action": {"action": "none"},
        "styles": {
            "card": bare([{"height": FULL}, {"overflow": "visible"}]),
            "grid": [{"grid-template-areas": '"a b d" "c e d"'},
                     {"grid-template-columns": "1fr 1fr 0.8fr"},
                     {"grid-template-rows": "1fr 1fr"},
                     {"gap": "%dpx" % GAP}, {"height": "100%"}],
            "custom_fields": {k: [{"justify-self": "stretch"}, {"height": "100%"},
                                  {"min-height": "0"}] for k in "abcde"},
        },
        "custom_fields": dict(zip("abce", ({"card": c} for c in readings)), d={"card": side}),
    }


def lamp(entity, label, icon, height):
    """A tall light tile: d.light, centred, at a given height."""
    c = centred(d.light(entity, label, circle=72, glyph=36, icon=icon))
    c["styles"]["card"].append({"height": height})
    return c


def scene_tile(entity, label, icon, accent, height):
    """A scene or script as a tall tile, sized to sit in a row of lamps.

    Like scenes.card it always wears its accent and has no on/off state - a
    script is 'on' for milliseconds - so the tap is shown as a press state."""
    return {
        "type": "custom:button-card", "entity": entity, "name": label, "icon": icon,
        "show_state": True, "state_display": "Scene",
        "tap_action": {"action": "call-service",
                       "service": entity.split(".")[0] + ".turn_on",
                       "service_data": {"entity_id": entity}},
        "hold_action": {"action": "none"},
        "styles": {
            "card": d.base(d.mix(accent, 14), pad="14px 10px") + [{"height": height}],
            "grid": [{"grid-template-areas": '"i" "n" "s"'},
                     {"grid-template-rows": "auto auto auto"}, {"width": "100%"},
                     {"height": "100%"}, {"align-content": "center"}],
            "img_cell": [{"background": accent}, {"border-radius": "50%"},
                         {"width": "72px"}, {"height": "72px"}, {"margin": "0 auto"}],
            "icon": [{"width": "36px"}, {"color": "#ffffff"}],
            "name": [{"font-size": "16px"}, {"font-weight": "600"}, {"color": d.INK},
                     {"margin-top": "10px"}],
            "state": [{"font-size": "13px"}, {"margin-top": "2px"}, {"color": accent}],
        },
        "extra_styles": ("#card{transition:background 90ms ease}"
                         "#card:active{background:%s !important}") % d.mix(accent, 34),
    }


def lights_page(lamps, scene_ids):
    """A row of tall lamp tiles over a row of scenes from scenes.SCENES."""
    tiles = [lamp(e, n, i, less(GAP + SCENE_H)) for e, n, i in lamps]
    sc = [scenes.card(*s, height=SCENE_H) for s in scenes.SCENES if s[0] in scene_ids]
    return stack(row(tiles), {"type": "grid", "columns": len(sc), "square": False, "cards": sc})


def media_page(entity, label, controls, playlist_player, icon="mdi:speaker"):
    """Now playing, sized for a wall screen, over six playlist slots.

    `entity` drives the now-playing card and its buttons; `playlist_player` is
    the Music Assistant player the playlists start on. They differ for the
    Amp: its own Sonos entity is the dependable one for transport and volume,
    while only Music Assistant can start a Spotify playlist on it."""
    now = d.media_card(entity, label, controls=controls, icon=icon, volume=True)
    now["styles"]["card"] = [{"height": less(GAP + PLAYLIST_H)} if "height" in x else x
                             for x in now["styles"]["card"]]
    now["styles"]["card"] = [{"border-radius": "26px"} if "border-radius" in x else x
                             for x in now["styles"]["card"]]
    now["styles"]["card"] = [{"padding": "18px"} if "padding" in x else x
                             for x in now["styles"]["card"]]
    # bigger artwork and type than the tablet's 124px card
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
    slots = []
    for i in range(6):
        s = tablet.playlist_slot(i, player=playlist_player)
        # a panel view ignores `visibility`; the slot already renders empty
        # when there is no playlist for it
        s.pop("visibility", None)
        slots.append(s)
    return stack(now, {"type": "grid", "columns": 2, "square": False, "cards": slots})


class Screen:
    """One room's display.

    pages  [(path, title, icon)], the first is the clock home page
    busy   {path: (js test, accent)} - lights that page's rail icon when true
    temp, humid  the room's own sensors, shown on the clock's weather pill
    photos the album_slideshow camera behind the clock. One camera has one
           current photo, so each screen gets its own slideshow of the album
           or they all show the same picture at the same time.
    """

    def __init__(self, url, title, accent, pages, busy, temp, humid, photos,
                 clock_tap=None):
        self.url, self.title, self.accent = url, title, accent
        self.pages, self.busy = pages, busy
        self.temp, self.humid, self.photos = temp, humid, photos
        self.clock_tap = clock_tap or {"action": "none"}

    def rail_button(self, path, title, icon, active):
        busy, tint = self.busy.get(path, ("false", self.accent))
        if active:
            bg, fg = self.accent, "#ffffff"
        else:
            bg = "[[[ return %s ? '%s' : 'transparent'; ]]]" % (busy, d.mix(tint, 22))
            fg = "[[[ return %s ? '%s' : '%s'; ]]]" % (busy, tint, d.MUTED)
        return {
            "type": "custom:button-card", "icon": icon, "name": title,
            "show_name": False, "show_state": False,
            "triggers_update": "all",
            "tap_action": {"action": "navigate",
                           "navigation_path": "/%s/%s" % (self.url, path)},
            "hold_action": {"action": "none"},
            "styles": {
                "card": [{"width": "48px"}, {"height": "48px"}, {"border-radius": "50%"},
                         {"padding": "0"}, {"box-shadow": "none"}, {"border": "none"},
                         {"margin": "0 auto"}, {"background": bg}],
                "icon": [{"width": "24px"}, {"color": fg}],
            },
        }

    def rail(self, active):
        """The vertical page switcher, as on the demo screen: a pill down the right edge."""
        return {
            "type": "custom:button-card",
            "show_icon": False, "show_name": False, "show_state": False,
            "tap_action": {"action": "none"},
            "styles": {
                "card": d.base(d.SURF, pad="8px 0") + [{"height": FULL}],
                "grid": [{"grid-template-areas": '"%s"' % '" "'.join(p for p, _, _ in self.pages)},
                         {"grid-template-rows": "repeat(%d, auto)" % len(self.pages)},
                         {"align-content": "space-evenly"}, {"height": "100%"}],
            },
            "custom_fields": {p: {"card": self.rail_button(p, t, i, p == active)}
                              for p, t, i in self.pages},
        }

    def page(self, path, body):
        """Body on the left, rail on the right, filling the screen. Only the
        home page shows in HA's tab bar; the rail is the navigation."""
        card = {
            "type": "custom:button-card",
            "show_icon": False, "show_name": False, "show_state": False,
            "tap_action": {"action": "none"},
            "styles": {
                "card": bare([{"padding": "%dpx" % GAP}, {"overflow": "visible"}]),
                "grid": [{"grid-template-areas": '"m r"'},
                         {"grid-template-columns": "minmax(0, 1fr) 64px"},
                         {"column-gap": "%dpx" % GAP}, {"align-items": "stretch"}],
                "custom_fields": {"m": [{"min-width": "0"}, {"justify-self": "stretch"}],
                                  "r": [{"justify-self": "stretch"}]},
            },
            "custom_fields": {"m": {"card": body}, "r": {"card": self.rail(path)}},
        }
        title = next(t for p, t, _ in self.pages if p == path)
        view = {"title": title, "path": path, "type": "panel", "theme": "Overlook",
                "badges": [], "cards": [card]}
        if path != self.pages[0][0]:
            view["visible"] = False
        return view

    def clock(self):
        """The ambient home page: the Family album full-bleed and dimmed, the
        clock over it in white with no am/pm, then the date and a frosted pill
        with the weather and the room's own temperature and humidity.

        The photo is a picture-entity sized to cover the card - at least as
        wide as 16:9 of the card's height, centred, the card cropping the
        overflow. If the camera is unavailable the card's own background shows
        instead: soft blobs of the room's accent."""
        art = ", ".join([
            "radial-gradient(circle at 18% 88%, " + d.mix(self.accent, 34) + " 0 28%, transparent 28.5%)",
            "radial-gradient(circle at 92% 8%, " + d.mix(d.INDIGO, 26) + " 0 24%, transparent 24.5%)",
            "radial-gradient(ellipse 60% 80% at 72% 96%, " + d.mix(d.AMBER, 20) + " 0 50%, transparent 51%)",
            d.mix(self.accent, 9),
        ])
        face = """[[[
          const W = %s; const e = states['weather.forecast_home'];
          const w = (e && W[e.state]) || %s;
          const t = e ? Math.round(e.attributes.temperature) : null;
          const n = new Date();
          const hm = n.toLocaleTimeString('en-AU',{hour:'numeric',minute:'2-digit'})%s;
          const dt = n.toLocaleDateString('en-AU',{weekday:'long',day:'numeric',month:'long'});
          const r = states['%s'], h = states['%s'];
          const ok = s => s && !['unavailable','unknown'].includes(s.state);
          const room = ok(r) ? `${Math.round(parseFloat(r.state))}° inside` + (ok(h) ? ` · ${Math.round(parseFloat(h.state))}%% humidity` : '') : '';
          const dot = `<span style="opacity:.6;margin:0 8px">·</span>`;
          return `<div style="font-size:min(140px, 27vh);font-weight:600;letter-spacing:-.045em;line-height:1">${hm}</div>
                  <div style="font-size:min(24px, 4.8vh);font-weight:600;margin-top:10px">${dt}</div>
                  <div style="display:inline-flex;align-items:center;margin-top:16px;padding:8px 16px;border-radius:999px;
                              background:rgba(0,0,0,.32);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
                              text-shadow:none;font-size:min(17px, 3.6vh);font-weight:600">
                    <ha-icon icon="${w.ic}" style="--mdc-icon-size:20px;margin-right:8px"></ha-icon>
                    ${w.nm}${t == null ? '' : ' ' + t + '°'}${room ? dot + room : ''}</div>`;
        ]]]""" % (d.WJS, d.FALLBACK, d.NOAMPM, self.temp, self.humid)
        # the photo's width, as a template like every height here
        cover = ("[[[ const h = document.querySelector('hc-main')"
                 " ? '(100vh - %dpx)' : '(100vh - var(--header-height, 56px) - %dpx)';"
                 " return `max(100%%, calc(${h} * 16 / 9))`; ]]]" % (2 * GAP, 2 * GAP))
        return {
            "type": "custom:button-card", "entity": "sensor.time",
            "triggers_update": ["weather.forecast_home", self.temp, self.humid],
            "show_icon": False, "show_name": False, "show_state": False,
            "tap_action": self.clock_tap,
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
                    "f": [{"justify-self": "center"}, {"text-align": "center"}, {"z-index": "1"},
                          {"color": "#fff"}, {"pointer-events": "none"},
                          {"text-shadow": "0 1px 3px rgba(0,0,0,.55), 0 2px 14px rgba(0,0,0,.4)"}],
                },
            },
            "custom_fields": {
                "p": {"card": {
                    "type": "picture-entity", "entity": self.photos,
                    "camera_view": "auto", "fit_mode": "cover",
                    "show_name": False, "show_state": False,
                    "tap_action": {"action": "none"}, "hold_action": {"action": "none"},
                    "double_tap_action": {"action": "none"},
                }},
                "f": face,
            },
        }

    def views(self, bodies):
        """bodies: {path: card} for every page but the clock."""
        home = self.pages[0][0]
        return [self.page(home, self.clock())] + \
               [self.page(p, bodies[p]) for p, _, _ in self.pages[1:]]
