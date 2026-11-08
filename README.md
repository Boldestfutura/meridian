# Overlook for Home Assistant

Echo Show-style Home Assistant dashboards. The whole UI is one custom Lit card,
[`www/overlook-show.js`](www/overlook-show.js); a few Python files say which entities go where
for each screen, and `deploy.py` ships the card and saves the dashboards over the websocket API.

| dashboard | screen | layout |
|---|---|---|
| **Kitchen Show** `ha-show` | 8" kitchen tablet, 1280x800 | dock on the left, date, favourites, calendar and shopping list; idles to photos |
| **Hub Show** `ha-show-hub` | Nest Hub, 1024x600, cast | photos are home; Controls, Media, Climate, Calendar and Recipes behind the dock |
| **Bedroom Show** `ha-show-bedroom` | Echo Show 5, 960x480 | photos and a big clock, bedroom controls, red night clock, voice timers and alarms |
| **Computer Show** `ha-show-computer` | 1440x820 to 1920x950, beside HA's sidebar | the whole house on one page |
| **Phone Show** `ha-show-native` | 390 wide | ordinary HA sections built from the card's pieces, so HA's own editor works |

How to change and deploy them: **[docs/DASHBOARDS.md](docs/DASHBOARDS.md)**.
Working on this house's live install: [docs/LIVE.md](docs/LIVE.md).
Separately, [docs/ECHO_MUTE_BUTTON.md](docs/ECHO_MUTE_BUTTON.md) turns an Echo Show 5's top
button into a mute button.

**Type:** Unbounded (headings, clock, big numbers) and Figtree (everything else), from Google
Fonts. Weather icons are our own SVGs, drawn by [`tools/weather_icons.py`](tools/weather_icons.py).

*Calendar entries, the shopping list and the photo in these screenshots are placeholders.*

## Kitchen Show
![Kitchen Show](docs/images/kitchen-show.png)
![Kitchen Show, dark](docs/images/kitchen-show-dark.png)

**Home** goes room by room, with lights as split pills you drag to dim. **Recipes** come from
Norish, synced into HA every 30 minutes.
![Kitchen Show, Home](docs/images/kitchen-show-home.png)
![Kitchen Show, Calendar](docs/images/kitchen-show-calendar.png)
![Kitchen Show, Recipes](docs/images/kitchen-show-recipes.png)

## Hub Show
![Hub Show, photos](docs/images/hub-photos.png)
<p>
  <img src="docs/images/hub-controls.png" width="49%" alt="Hub Show, Controls">
  <img src="docs/images/hub-climate.png" width="49%" alt="Hub Show, Climate">
</p>

## Bedroom Show
![Bedroom Show, photos](docs/images/bedroom-photos.png)
<p>
  <img src="docs/images/bedroom-controls.png" width="49%" alt="Bedroom Show, Controls">
  <img src="docs/images/bedroom-climate.png" width="49%" alt="Bedroom Show, Climate">
</p>

## Computer Show
![Computer Show](docs/images/computer-show.png)
![Computer Show, dark](docs/images/computer-show-dark.png)

## Phone Show
<p>
  <img src="docs/images/phone-show.png" width="260" alt="Phone Show, light">
  <img src="docs/images/phone-show-dark.png" width="260" alt="Phone Show, dark">
</p>

Tapping a speaker, plant, heat pump or status pill opens a bottom sheet:
<p>
  <img src="docs/images/phone-show-amp.png" width="260" alt="Amp sheet">
  <img src="docs/images/phone-show-heatpump.png" width="260" alt="Heat pump sheet">
</p>

## Requirements

- Home Assistant **2026.10** or similar. Nothing from HACS: Lit is vendored in `www/`.
- SSH to the HA box (`deploy.py` copies the card to `/config/www` with `scp`) and a long-lived
  access token at `~/.config/ha/token`.
- Optional, per feature: `album_slideshow` cameras for the photos, Music Assistant for
  playlists (the template sensor in [`ha_config/tablet_playlists.yaml`](ha_config/tablet_playlists.yaml)),
  Norish for recipes (`tools/norish_sync.py`), a `todo` list and calendars.
- The `Overlook` theme ([`themes/overlook.yaml`](themes/overlook.yaml)) for HA's own pages and
  the Phone Show's sections view. **A theme needs both `modes.light` and `modes.dark`**: with
  only `dark`, HA forces dark mode on every device.

## Use

```sh
./deploy.py --list                       # what is on the box
./deploy.py show showhub showbedroom     # ship the card, save those dashboards
./deploy.py --dry-run showcomputer       # build and diff, write nothing
```

`HA_HOST` and `HA_TOKEN_FILE` override the defaults. Bump `VERSION` in both `show.py` and
`www/overlook-show.js` with every card change, or browsers keep the old one.

## Layout

```
www/overlook-show.js   the card: every layout (tablet, hub, bedside, desk, phone) in one file
www/lit-all.min.js     Lit, vendored
www/weather/ inputs/   artwork: weather icons, the amp's TV and phono inputs
show.py                Kitchen Show and the shared CARD config, VERSION
showhub.py             Hub Show
showbedroom.py         Bedroom Show
showcomputer.py        Computer Show
showphone.py           the phone's rooms, scenes and pop-ups (data only)
shownative.py          Phone Show, as native HA sections
deploy.py  ha_ws.py    CLI and a minimal websocket client
ha_config/             automations and sensors the dashboards rely on (repo copies)
device/echo/           Echo Show 5 mute button
tools/                 weather icon generator, Norish sync, headless-browser driver
```

## Adapting it to another install

See **[AGENTS.md](AGENTS.md)**, a brief written for an LLM: what to change, what to leave
alone, how to verify, and the traps that are not obvious.
