# The Show dashboards

Every dashboard here is the Show design: an Echo Show-style look drawn by one Lit card,
`www/overlook-show.js`. The classic button-card dashboards (ha-kitchen, ha-phone, ha-tablet,
ha-computer, ha-bedroom, ha-homey) were retired on 2026-11-08: removed from HA and from this
repo. Their code is in git history before that date if anything ever needs digging out.

<p>
  <img src="images/kitchen-show.png" width="520" alt="Kitchen Show">
  <img src="images/phone-show.png" width="180" alt="Phone Show">
</p>

More screenshots in the [README](../README.md).

## What lives where

| file | what it is |
|---|---|
| `www/overlook-show.js` | the whole UI: one Lit card, every layout in one file |
| `www/lit-all.min.js` | Lit, vendored (no CDN) |
| `www/weather/*.svg` | weather icons, drawn by `tools/weather_icons.py` (edit that, not the SVGs) |
| `www/inputs/*.svg` | artwork for the amp's TV and phono inputs |
| `show.py` | Kitchen Show (`ha-show`): `VERSION`, and `CARD`, the shared config: rooms, scenes, status pills, calendars, recipes. The other dashboards start from `show.CARD` |
| `showhub.py` | Hub Show (`ha-show-hub`) for the Nest Hub (1024x600, cast): `hub` mode. Photos are home; the dock opens Controls, Media, Climate, Calendar and Recipes. Kept alive by `ha_config/kitchen_cast_keepalive.json` |
| `showbedroom.py` | Bedroom Show (`ha-show-bedroom`) for the Echo Show 5 (960x480): `bedside` mode. Photos with the clock are home; Controls, Media, Climate, Calendar. Red night clock, voice timers and alarms (`clock`), full-screen now playing (`nowplaying`, `nowplaying_return`). Everything comes from the Bedroom room in `show.CARD` |
| `showcomputer.py` | Computer Show (`ha-show-computer`): `desk` mode, the whole house on one page grouped by kind, the phone's pop-ups as centred dialogs, beside HA's sidebar (`windowed`) |
| `showphone.py` | the phone's data, no dashboard of its own: rooms and scenes (`ROOMS`, `SCENES`), the reading pills (`STATUS_AIR`), the pop-ups (`POPUPS`) and which tap opens which (`LINKS`). `shownative.py` and `showcomputer.py` read it |
| `shownative.py` | Phone Show (`ha-show-native`): the same rooms, scenes and pop-ups as ordinary HA cards in a sections view (see below) |
| `tools/norish_sync.py` | copies Norish recipes into HA every 30 min (systemd timer on luna) |
| `tools/ha/norish_fav.py` | the recipe heart button, runs on HA |

Every dashboard runs the **same JS file**. A flag in the config picks the layout, and its CSS
lives under a class of the same name: `phone`, `desk`, `bedside`, `hub`. No flag is the
kitchen tablet.

## Changing one

1. **Layout, entities, scenes, pills, pop-ups:** edit the dashboard's Python file.
   **How it looks or behaves:** edit `www/overlook-show.js`.
2. **Bump the version in both places**, to the same number:
   - `VERSION` in `show.py`
   - `const VERSION` near the top of `www/overlook-show.js`

   Skip this and browsers keep the old JS cached, so the change looks like it didn't work.
3. Deploy:
   ```sh
   ./deploy.py show showhub showbedroom showcomputer shownative
   ```
   This copies the JS and artwork to `/config/www` over SSH, points the resource at the new
   version and rewrites the dashboards. ha-show, ha-show-hub, ha-show-bedroom and
   ha-show-computer hold no UI edits, so their config lives in the Python; ha-show-native is
   only rewritten while nobody has edited it in HA.
4. **Reload the devices that keep the page open.** The Echo needs its View Assist Companion
   app restarted (`docs/tasks/echo-show-bedroom.md`). The Nest Hub needs the cast dropped and
   started again (`media_player.turn_off`, then `cast.show_lovelace_view`); recasting the same
   view does not reload it.
5. Check **every** dashboard, even if you only meant to change one. They share the file:
   - Kitchen Show `/ha-show/show` at 1280x800
   - Hub Show `/ha-show-hub/show` at 1024x600, every dock page
   - Bedroom Show `/ha-show-bedroom/show` at 960x480, every dock page
   - Computer Show `/ha-show-computer/show` at 1920x950 and 1440x820, sidebar open
   - Phone Show `/ha-show-native/home` at 390 wide

## Phone Show: native HA cards

`ha-show-native` is the Phone Show built so HA's own editor works on it. Cameron signed it
off on 2026-11-04.

- **Home** is an HA sections view. Every tile is its own card: `overlook-tile` (an
  entity; it picks light / switch / speaker / heat pump / plant / reading / scene from
  the domain, or `kind:` says), `overlook-heading` (room name, icon, all-lights `group`),
  `overlook-scenes` (the scene row), `overlook-status` (the pills). They draw with the
  same markup and CSS as the single card, so they look the same.
- **One view, no tabs.** The last section is **`overlook-edit-button`**: it hides HA's header
  and puts an Edit dashboard button at the bottom; HA's header comes back with Done. While
  any of the cards above are on screen it also sets HA's grid to the design's sizes (62px
  rows, 10px gaps, 16px sides). A tile is one row, a player two.
- Light sheets and pop-ups open in one layer on `<body>` (`overlook-overlay`). Pop-ups and
  links ship as `/local/overlook-popups.json` (written by deploy, gitignored).
- `./deploy.py shownative` writes the layout **only while it is unedited** (snapshot in
  `.deployed/`, gitignored). Once it has been changed in HA, deploy keeps HA's version and
  ships only the JS and pop-ups.

## Adding things

- **A status pill:** add to `CARD["status"]` in `show.py`. Either
  `{entity, name, person}` or `{entity, name, icon, tone, when, toggle}`. `tone` is
  `warn` / `bad` / `cool` / `accent`. `when` = only show while in that state.
- **A phone pop-up:** add a sheet to `POPUPS` in `showphone.py`. Its sections are `tiles`,
  `choices`, `player` or `graph`. Then add `LINKS[entity] = "<popup id>"` so tapping that
  entity opens it. Anything without a link opens HA's normal more-info.
- **A weather icon:** edit `tools/weather_icons.py`, run it, and bump the `?v=` on the icon
  URL in `_wxIcon` so screens fetch the new files.

## Using it

- **Lights:** tap = on/off. Hold a phone light tile, or tap ⋮ on a tablet light pill, and the
  light sheet opens: brightness pill, power, warm/cool white bar, 8 colour swatches (only on
  bulbs that do colour), and for groups each bulb with its own on/off. ⋯ in the corner opens
  HA's standard dialog.
- **Get back to normal HA (edit mode, sidebar):** hold the clock 1.5 s on the tablet, or the
  Home tab on the phone.
- **Idle:** after 5 minutes the tablet, Hub and Echo go to photos (not while a recipe is open).
- **Phone haptics** come from the HA companion app (the `haptic` event), so they only work
  inside the app, not in Safari.

## Traps

- HA's history API returns **one day** unless you pass `end_time`. Graphs that stop short are
  this, not the recorder.
- Lights and heat pump are in use at home: when testing, stub service calls
  (`card._call = ...`) instead of really tapping.
- **A cast loads the page from cast.home-assistant.io.** Any `/local/...` or `/api/...` path
  must go through `this._u()` (makes it absolute with `hass.hassUrl`), or it points at
  Google's server and the image comes up blank.
- Under 680px tall the compact layout kicks in; the heat pump card is the tightest fit.
- **Screenshots for this public repo use placeholders.** The calendar, shopping list and photo
  are faked in the page before capture, and HA's sidebar is cropped off (it shows the
  signed-in user's picture).
