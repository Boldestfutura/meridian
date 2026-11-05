# Working on Cameron's live install

`AGENTS.md` is written for someone adapting these dashboards to *another* house. This file
is for working on **this** one: Home Assistant at `http://192.168.1.117:8123`, HA 2026.10.2.
Handed over from Claude Code on 2026-10-27. Read `AGENTS.md` first anyway, for the general
rules.

**Two kinds of dashboard live here: classic and Show.** `docs/DASHBOARDS.md` says which is which
and how to deploy each without clobbering anything.

## The five rules that matter most

1. **Cameron hand-edits these dashboards. Never deploy a full rebuild over them.**
   - Read the live config (`lovelace/config`) and save a backup copy to a scratch file.
   - Replace only the cards you own. Find them by **full equality** with what the
     generator built *before* your change, not by title: the tablet has two "Scenes"
     headers, for example.
   - Assert that everything else is unchanged, then `lovelace/config/save`.
   - Then update the generator (`tablet.py` and the rest) so it matches what is live.
   - If a card doesn't match, he edited it. Keep his change (on 2026-10-27 the tablet's
     Scenes icon turned out to be ours, not his, but check every time).
2. **Verify by using it.** Drive the page over CDP (`tools/cdp.py`, port 9233, headless
   Helium) and click the thing.
   - Read state back through the websocket.
   - Check 1280x800 for the tablet, 390 wide for the phone, and 1440x820 / 1920x950 for
     the computer.
   - A screenshot alone is not proof.
3. **Repo is PUBLIC** (Cameron made it public on purpose, 2026-11-03). Everything pushed is
   world-readable, history included.
   - Before every push, scan the diff for tokens, passwords and keys. Credentials stay in
     files on HA/luna (`~/.config/...`, `/config/.norish.json`) and are only ever *read*.
   - Write the MA config entry id as a placeholder in the repo.
4. **Audio tests only when nobody is home**: `person.cameron` and `person.paget` both
   `not_home`. Pause afterwards.
5. **Never print the HA token** (`~/.config/ha/token`), the Immich key
   (`~/.config/immich/token`) or Music Assistant's token.

## Tools and access

- `deploy.py` / `ha_ws.py` give websocket access:
  `ws, ids = deploy.connect(); ha_ws.call(ws, next(ids), type=...)`.
  - `ha_ws.recv` ignores the frame opcode, so a call that runs longer than about 30s can
    die on an HA PING frame. It shows up as a fake timeout or `JSONDecodeError`. Keep
    calls short.
- `configuration.yaml` is edited over SSH: `root@192.168.1.117 -i ~/.config/ha/vmkey`, with
  a scratch `UserKnownHostsFile` if host-key checking complains.
  - The add-on has **no python3**. Copy the file down, edit it locally, **keep the CRLF
    line endings**, and copy it back.
  - Back up as `configuration.yaml.bak-<date>` first.
  - Check it with REST `POST /api/config/core/check_config`, then reload with
    `template.reload` (or the relevant reload).
- Removing a config entry uses REST `DELETE /api/config/config_entries/entry/<id>`. There
  is no websocket command for it.
- **card-mod is dead on 2026.10.2.** It loads and injects nothing. Style everything with
  `custom:button-card`'s `styles:` / `extra_styles` (keyframes work there).
- The VM **can't reach Sol's LAN IP**. Anything HA calls on Sol uses `100.84.24.51`:
  Immich on :2283, Music Assistant on :30278.
- **MA's "Internal URL" must stay `http://100.84.24.51:30278/`** (MA: Settings > System >
  Webserver). MA announces it over mDNS and HA's MA integration copies it; when it falls back
  to the LAN IP, every `_2` player goes unavailable (2026-10-28, 10-31, 11-05). A root cron job
  on Sol (id 526, every 5 min) runs `tools/sol/ma-url-watch.sh` from
  `/mnt/SSDs/appconfig/`: it stops MA, fixes `settings.json` and starts it again, at most once
  per 30 minutes, and logs to `/mnt/SSDs/appconfig/ma-url-watch.log`.

## What exists, by dashboard

**ha-kitchen** (Nest Hub 1st gen, 1024x600, cast; `kitchen.py`)
- Since 2026-10-28 a **room screen** like the bedroom (`roomscreen.py`): kitchen things
  only. Pages: `kitchen` (clock over the dimmed Family album), `lights` (Kitchen,
  Living Room and Goodnight, full height), `media` (the Amp: Sonos entity
  for controls, MA `_2` for playlists) and `climate` (the kitchen air monitor plus the
  heatpump). `photos` (the idle cast) and `weather` (the clock's tap) remain.
- **Since 2026-11-03 the Nest Hub shows Kitchen Show (`ha-show/show`), not ha-kitchen.**
  `automation.kitchen_display_keep_the_cast_alive` casts it whenever the Hub drops the cast.
  The slideshow-when-idle and back-on-activity automations are turned **off**: Kitchen Show
  goes to photos by itself after 5 minutes. To go back, point the keep-alive at
  `ha-kitchen`/`kitchen` and turn the other two on (backup:
  `~/.config/ha/kitchen-cast-automations.before-show-2026-11-03.json`, local only).
  ha-kitchen itself is untouched.
- The old layout, which Cameron had hand-edited, was replaced at his request. A backup is
  at `~/.config/ha/ha-kitchen.before-roomscreen-2026-10-28.json` (local only).
- **Each room screen has its own slideshow** of the Immich Family album
  (`Screen(photos=...)`): the kitchen is `camera.album_slideshow_family`, the bedroom
  `camera.album_slideshow_family_bedroom` (a second album_slideshow entry, 2026-10-28).
  One camera has one current photo, so sharing it made both screens show the same
  picture. Both are random order, 20s, cover. A new room screen needs its own entry.
- **Never use a card that loads images by relative URL here.** The cast receiver runs at
  cast.home-assistant.io, so relative URLs 301 to a stock Nest Hub picture.
  `album-slideshow-card` broke this way and was reverted.

**ha-tablet** (control centre, also the future Pi panel)
- Room switcher: `input_select.tablet_room` (Kitchen, Living Room, Master Bedroom, Guest,
  Media).
  - Each room's cards carry per-card `visibility` on that helper, never a conditional or
    grid wrapper. That keeps them draggable in edit mode.
  - Each room has its own header, so edit mode shows separate groups.
- Every media card spans two grid rows (`grid_options.rows: 2`).
- Scenes: a scrolling `pill_strip`, with a header chevron (`room_header(swipe=True)`) that
  nudges right.
- **Media tab**, playing Spotify through **Music Assistant** with the Soloist provider.
  HA's own Spotify integration can't drive the Sonos Amp or the AirPlay-only HomePods.
  - `input_select.tablet_speaker` picks Amp / Kitchen / Bedroom / Guest, which map to
    `media_player.living_room_amp_2`, `homepod_mini_kitchen_2`, `bedroom_echo` and
    `guest_bedroom_homepod_mini_2`. These are the MA players, not the Sonos/AirPlay ones.
    (The Echo has only the one player, `bedroom_echo`.)
  - Speaker cards: `media_card(..., volume=True)` shows the volume at the top right.
    Tapping one opens the shared pop-ups through `patch3.NAV_TARGETS` (`#ov-amp`,
    `#ov-homepod-kitchen`, `#ov-echo-bedroom`, `#ov-homepod-guest`).
  - Playlists: 8 slots read `sensor.tablet_playlists` (attribute `items`; its state is the
    count, which hides empty slots). Tapping one calls `music_assistant.play_media`.
- Sensors live in `configuration.yaml`; the repo copy is `ha_config/tablet_playlists.yaml`.
  - `sensor.spotify_recent_playlists` is the last 30 playlists Cameron started in the
    Spotify app on any device. It comes from HA's Spotify integration
    (`media_player.spotify_cameron`, watch-only).
    - Spotify-made playlists (Daily Mix, Discover Weekly) never appear: the API won't
      return them. DJ does appear.
  - `sensor.tablet_playlists` puts those first, then MA's last-played order. It filters
    MA's generated mixes and the six Plex playlists out **by name**, because
    `get_library` has no provider field.
- **Next job:** `docs/tasks/paget-spotify.md`.

**ha-bedroom** (Echo Show 5 2nd gen, 960x480, Master Bedroom only; `bedroom.py`)
- Four panel views (Clock, Lights, Music, Air) with a right-hand rail. Built fresh on
  2026-10-28, so a plain `./deploy.py bedroom` is safe **until Cameron edits it by hand**.
  After that, patch it like the others.
- Nested button-cards need explicit `calc()` heights; `100%` resolves to nothing.
  Templates inside a nested card can't use `entity`, so name the entity id.
- Device setup: `docs/tasks/echo-show-bedroom.md`.
- **Night mode (2026-11-05):** `automation.master_bedroom_sleep_sounds_overnight` (repo copy
  `ha_config/bedroom_night.json`) turns `input_boolean.bedroom_night_mode` on 9pm-7:30am while
  anyone (or guest mode) is home, including on arrival inside the window, and loops
  `/config/www/sounds/cataract-falls.m4a` on `media_player.bedroom_echo` (the Echo Show through SendSpin Player and Music Assistant) at 15%.
  - MA fetches the file from HA's **tailnet** address (`http://100.108.150.25:8123/local/...`);
    Sol can't reach the VM's LAN IP.
  - The Bedroom Show (`night:` in showbedroom.py) shows a red clock on black while it's on.
    A tap wakes it on Lights, and it goes back to the clock after 30s.
  - Screen: `notify.mobile_app_echo_show_5` with `message: command_screen_brightness_level`,
    `data.command` 0-255. The automation sets 3 (about 1%) at the start and 102 at the end. It needs
    `appops set io.homeassistant.companion.android WRITE_SETTINGS allow`, already done on the device.
  - The 15% loudness still needs Cameron's verdict.
- **Echo as a speaker:** SendSpin Player (`com.sendspindroid`) connects it to Music Assistant as
  `media_player.bedroom_echo`, its only media player. The old bedroom HomePod moved to the guest
  bedroom on 2026-11-05: `media_player.guest_bedroom_homepod_mini` (AirPlay) and `_2` (MA).

**ha-phone** (room list) and **ha-computer** (whole house at once)
- Media cards are `columns 6, rows 2`, so tiles stack and drag freely.
- The Scenes header has the same swipe chevron. The 7-scene strip overflows at every size.

**ha-homey** ("Homey lights test", `homey_lights.py`, 2026-11-02)
- The live phone config with only the light tiles swapped for Homey-style ones (outline
  icon, colour dot in the bulb's real colour, grey when off). Replaces nothing.
- `./deploy.py homey_lights` re-reads ha-phone each time, so it always tracks his phone edits.

**Shared**
- `patch3.py` owns the status strip and **all the Bubble Card pop-ups** (`#ov-*`).
  `attach_nav` points cards at them.
- Theme `themes/overlook.yaml` (deployed to `/config/themes/overlook/`) is the app-wide
  default.
  - It needs **both** `modes.light` and `modes.dark`: HA forces dark on a theme that only
    has dark.
  - HA 2026 buttons and toggles read `--ha-color-primary-05..95`, not `primary-color`.

## House facts that trip people up

- `climate.living_room` is named "Heatpump". Entity ids were renamed on 2026-10-20 to
  match reality (bedside_left / bedside_right / mushroom_lamp / smart_plug). If you
  rename, rename the whole device.
- **Presence is iPhone-only.** An iPad attached to a person pins them at home and silently
  kills the away automations.
- `input_boolean.guest_mode` blocks the two "everyone away" automations and counts as
  someone home for the three that need presence.
- The Hue bridge is gone. The two RWL022 dimmers are **bound directly** to their bulbs in
  ZHA. Don't add automations on top: the dim steps would double.
- The Zigbee dongle is passed through from Sol by vendor/product id. A watchdog
  automation plus `~/.local/bin/zigbee-watch` on luna cover it dropping out.
- Nabu Casa is active. Alexa linking is **not** turned on yet; it's planned for when the
  Sonos Era 100 arrives, with a curated expose list.
