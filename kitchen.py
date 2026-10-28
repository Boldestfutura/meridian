"""Kitchen display: the Nest Hub (1st gen), 1024x600, cast from HA.

Since 2026-10-28 a room screen like the bedroom's (roomscreen.py): kitchen
things only, a clock home page over the Family album, and a rail of pages -
Lights, Media (the Amp) and Climate.

The view paths are load-bearing. Three automations cast this dashboard to
media_player.kitchen_display by path: `photos` when the kitchen goes idle,
`kitchen` on activity and to keep the cast alive. Rename either and the Hub
goes blank.

  kitchen   the clock home page (a rail page)
  lights / media / climate   rail pages
  photos    full-screen album, cast when idle; tap returns to `kitchen`
  weather   forecast; the clock's tap opens it, its title returns home
"""
import design as d
import roomscreen as rs

HDR = 64          # header height on the weather view
TEMP   = "sensor.air_quality_monitor_temperature"   # the kitchen's own monitor
HUMID  = "sensor.air_quality_monitor_humidity"
PM25   = "sensor.air_quality_monitor_pm2_5"
VOC    = "sensor.air_quality_monitor_voc_index"
LIGHTS = "light.kitchen_lights"                      # Bench Lamp + Kitchen Light
AMP    = "media_player.living_room_amp"              # Sonos: transport and volume
AMP_MA = "media_player.living_room_amp_2"            # Music Assistant: playlists
HEAT   = "climate.living_room"                       # the heatpump, open plan

# the heatpump card's surface, tinted by mode as on the other dashboards
SURF_BY_MODE = """[[[
    const s = states['climate.living_room'].state;
    return s === 'heat' ? '%s' : (s === 'cool' ? '%s' : '%s');
  ]]]""" % (d.mix(d.HEAT, 14), d.mix(d.COOLBLU, 13), d.SURF)

SCREEN = rs.Screen(
    url="ha-kitchen", title="Kitchen", accent=d.AMBER,
    #        path       title      icon
    pages=[("kitchen", "Kitchen", "mdi:home"),
           ("lights",  "Lights",  "mdi:lightbulb-group"),
           ("media",   "Media",   "mdi:speaker"),
           ("climate", "Climate", "mdi:thermometer")],
    busy={"lights":  ("['%s', 'light.living_room'].some(e => states[e].state === 'on')"
                      % LIGHTS, d.AMBER),
          "media":   ("states['%s'].state === 'playing'" % AMP, d.VIOLET),
          "climate": ("!['off','unavailable'].includes(states['%s'].state)" % HEAT, d.HEAT)},
    temp=TEMP, humid=HUMID,
    clock_tap={"action": "navigate", "navigation_path": "/ha-kitchen/weather"})


def heatpump():
    """The heatpump as a tall card, filling the column beside the air readings.

    Header like the air cards (icon circle, name, what it is doing), the set
    temperature large in the middle with the room temperature under it, then
    full-width - / +, Heat and Cool side by side, and Off under them. The tint follows
    the mode: orange heating, blue cooling, plain when off.
    """
    def step(delta, icon):
        b = d._temp_btn(delta, icon)
        # no width: a button-card host has none, so 100% collapsed it to 0
        b["styles"]["card"] = [{"height": "60px"}, {"border-radius": "16px"},
                               {"box-shadow": "none"}, {"border": "none"}, {"padding": "0"},
                               {"background": d.SUBTLE}]
        b["styles"]["icon"] = [{"width": "28px"}, {"color": d.INK}]
        return b

    return {
        "type": "custom:button-card", "entity": HEAT,
        "show_icon": False, "show_name": False, "show_state": False,
        "tap_action": {"action": "none"}, "hold_action": {"action": "more-info"},
        "styles": {
            "card": d.base(SURF_BY_MODE, pad="14px 16px") + [{"height": rs.FULL}],
            "grid": [{"grid-template-areas": '"h" "v" "s" "m"'},
                     {"grid-template-rows": "auto 1fr auto auto"},
                     {"row-gap": "12px"}, {"height": "100%"}],
            "custom_fields": {
                "h": [{"justify-self": "stretch"}, {"text-align": "left"}],
                "v": [{"justify-self": "center"}, {"align-self": "center"}, {"text-align": "center"}],
                "s": [{"justify-self": "stretch"}, {"width": "100%"}],
                "m": [{"justify-self": "stretch"}, {"width": "100%"}],
            },
        },
        "custom_fields": {
            "h": """[[[
              const e = states['%s']; const s = e.state;
              const ac = s === 'heat' ? '%s' : (s === 'cool' ? '%s' : '%s');
              const ic = s === 'heat' ? 'mdi:fire' : (s === 'cool' ? 'mdi:snowflake' : 'mdi:hvac-off');
              const st = s === 'off' ? 'Off' : (s === 'heat' ? 'Heating' : (s === 'cool' ? 'Cooling'
                       : s.replace(/_/g,' ').replace(/\\b\\w/g, c => c.toUpperCase())));
              return `<div style="display:flex;align-items:center;gap:10px">
                <div style="width:44px;height:44px;border-radius:50%%;flex:none;display:flex;align-items:center;justify-content:center;
                            background:color-mix(in srgb, ${ac} 22%%, %s)">
                  <ha-icon icon="${ic}" style="--mdc-icon-size:22px;color:${ac}"></ha-icon></div>
                <div><div style="font-size:15px;font-weight:600;color:%s">Heatpump</div>
                     <div style="font-size:13px;color:${ac};margin-top:2px">${st}</div></div></div>`;
            ]]]""" % (HEAT, d.HEAT, d.COOLBLU, d.MUTED, d.SURF, d.INK),
            "v": """[[[
              const a = states['%s'].attributes;
              const set = a.temperature == null ? '\u2013' : a.temperature;
              return `<div style="font-size:13px;font-weight:600;color:%s;letter-spacing:.02em">Set to</div>
                      <div style="font-size:64px;font-weight:700;color:%s;letter-spacing:-.04em;line-height:1.05">${set}\u00B0</div>
                      <div style="font-size:14px;color:%s;margin-top:4px">Room ${a.current_temperature}\u00B0</div>`;
            ]]]""" % (HEAT, d.MUTED, d.INK, d.MUTED),
            "s": {"card": {"type": "horizontal-stack",
                           "cards": [step(-1, "mdi:minus"), step(1, "mdi:plus")]}},
            # Heat and Cool side by side, Off full width under them
            "m": {"card": {"type": "vertical-stack", "cards": [
                {"type": "horizontal-stack", "cards": [
                    d.mode_btn("Heat", "heat", "mdi:fire", hgt=56),
                    d.mode_btn("Cool", "cool", "mdi:snowflake", hgt=56),
                ]},
                d.mode_btn("Off", "off", "mdi:power", hgt=56),
            ]}},
        },
    }


def build():
    views = SCREEN.views({
        # the two room groups and Goodnight, full height - no scene row
        "lights": rs.row([
            rs.lamp(LIGHTS, "Kitchen", "mdi:countertop", rs.FULL),
            rs.lamp("light.living_room", "Living Room", "mdi:sofa", rs.FULL),
            rs.scene_tile("script.goodnight", "Goodnight", "mdi:weather-night",
                          d.INDIGO, rs.FULL),
        ]),
        "media": rs.media_page(AMP, "Amp",
                               ("prev", "play", "next", "vol_down", "vol_up", "mute"), AMP_MA),
        "climate": rs.air_page(rs.air_readings(TEMP, HUMID, PM25, VOC), heatpump()),
    })
    return {"title": "Kitchen", "views": views + [photo_view(), weather_view()]}


def weather_view():
    """A panel-compatible custom weather detail view for the Nest Hub."""
    return {"title": "Weather", "path": "weather", "type": "panel",
            "theme": "Overlook", "badges": [], "subview": True,
            "cards": [{"type": "vertical-stack", "cards": [
                d.header("Weather", big=30, clock=28, h=HDR, ampm=False,
                         title_nav="/ha-kitchen/kitchen"),
                d.weather(450, num=46, icon=72, forecast="below", slots=5),
            ]}]}



def photo_view():
    """Full-screen Immich slideshow. Tapping anywhere returns to the dashboard.

    picture-entity rather than an iframe: an iframe swallows the tap, so there
    would be no way back out without a card-mod overlay.

    Styled like the bedroom screen's clock (bedroom.clock): the photo dimmed to a
    backdrop, a big centred clock with no am/pm, the date, and a frosted pill
    with the weather and the kitchen's own temperature and humidity. The
    wrapper is a button-card on sensor.time so it re-renders every minute; the
    overlay has pointer-events:none so taps still reach the photo underneath.
    """
    overlay = """[[[
      const W = %s; const e = states['weather.forecast_home'];
      const w = (e && W[e.state]) || %s;
      const t = e ? Math.round(e.attributes.temperature) : null;
      const d = new Date();
      const tm = d.toLocaleTimeString('en-AU',{hour:'numeric',minute:'2-digit'})%s;
      const dt = d.toLocaleDateString('en-AU',{weekday:'long',day:'numeric',month:'long'});
      const r = states['%s'], h = states['%s'];
      const ok = s => s && !['unavailable','unknown'].includes(s.state);
      const room = ok(r) ? `${Math.round(parseFloat(r.state))}° inside` + (ok(h) ? ` · ${Math.round(parseFloat(h.state))}%% humidity` : '') : '';
      const dot = `<span style="opacity:.6;margin:0 8px">·</span>`;
      return `<div style="font-size:min(150px, 27vh);font-weight:600;letter-spacing:-.045em;line-height:1">${tm}</div>
              <div style="font-size:min(26px, 4.8vh);font-weight:600;margin-top:12px">${dt}</div>
              <div style="display:inline-flex;align-items:center;margin-top:18px;padding:9px 18px;border-radius:999px;
                          background:rgba(0,0,0,.32);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
                          text-shadow:none;font-size:min(19px, 3.6vh);font-weight:600">
                <ha-icon icon="${w.ic}" style="--mdc-icon-size:22px;margin-right:8px"></ha-icon>
                ${w.nm}${t == null ? '' : ' ' + t + '°'}${room ? dot + room : ''}</div>`;
    ]]]""" % (d.WJS, d.FALLBACK, d.NOAMPM, TEMP, HUMID)
    return {"title": "Photos", "path": "photos", "type": "panel",
            "theme": "Overlook", "badges": [], "subview": True,
            "cards": [{
              "type": "custom:button-card", "entity": "sensor.time",
              "triggers_update": ["weather.forecast_home", TEMP, HUMID],
              "show_icon": False, "show_name": False, "show_state": False,
              "tap_action": {"action": "none"},
              "styles": {
                "card": [{"padding": "0"}, {"border": "none"}, {"border-radius": "0"},
                         {"box-shadow": "none"}, {"background": "#000"},
                         {"overflow": "hidden"}, {"position": "relative"},
                         # Fill the screen exactly. A cast view (hc-main) has
                         # no toolbar; a browser has 56px.
                         {"height": "[[[ return document.querySelector('hc-main')"
                                    " ? '100vh' : 'calc(100vh - 56px)'; ]]]"}],
                "grid": [{"grid-template-areas": '"p"'}],
                "custom_fields": {
                  # picture-entity sizes itself 16:9 from its width. Full width
                  # alone left it 576 tall on the Hub's 1024x600 - a 12px black
                  # bar top and bottom. So it is at least as wide as 16:9 of the
                  # card's height too, centred, and the card crops the sides.
                  # Dimmed to a backdrop, as on the bedroom screen.
                  "p": [{"position": "absolute"}, {"left": "50%"}, {"top": "50%"},
                        {"transform": "translate(-50%, -50%)"},
                        {"filter": "brightness(.5) saturate(.8)"},
                        {"width": "[[[ const h = document.querySelector('hc-main')"
                                  " ? '100vh' : '(100vh - 56px)';"
                                  " return `max(100%, calc(${h} * 16 / 9))`; ]]]"}],
                  "o": [{"position": "absolute"}, {"z-index": "1"}, {"inset": "0"},
                        {"display": "flex"}, {"flex-direction": "column"},
                        {"align-items": "center"}, {"justify-content": "center"},
                        {"text-align": "center"}, {"color": "#fff"},
                        {"font-family": d.FONT}, {"pointer-events": "none"},
                        {"text-shadow": "0 1px 3px rgba(0,0,0,.55), 0 2px 14px rgba(0,0,0,.4)"}],
                },
              },
              "custom_fields": {"o": overlay, "p": {"card": {
                "type": "picture-entity",
                "entity": "camera.album_slideshow_family",
                "camera_view": "auto",
                "show_name": False, "show_state": False,
                "fit_mode": "cover",
                "tap_action": {"action": "navigate",
                               "navigation_path": "/ha-kitchen/kitchen"},
                "hold_action": {"action": "none"},
                "double_tap_action": {"action": "none"},
              }}},
            }]}
