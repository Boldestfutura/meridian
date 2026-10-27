# Working on Cameron's live install

`AGENTS.md` is written for someone adapting these dashboards to *another* house. This file
is for working on **this** one: Home Assistant at `http://192.168.1.117:8123`, HA 2026.10.2.
Handed over from Claude Code on 2026-10-27. Read `AGENTS.md` first anyway, for the general
rules.

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
3. **Repo is private.** Before every push, `curl -s -o /dev/null -w '%{http_code}'
   https://api.github.com/repos/Boldestfutura/overlook-ha` must print `404`.
   - Pushing over SSH works while it's private, so never ask for it to be made public.
   - Scan diffs for tokens. Write the MA config entry id as a placeholder in the repo.
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

## What exists, by dashboard

**ha-kitchen** (Nest Hub 1st gen, 1024x600, a panel view)
- The view-1 photo slideshow is a `picture-entity` on `camera.album_slideshow_family`
  (Immich "Family" album, 20s per slide, `fill_mode` cover). It's sized to cover the
  frame, and a tap navigates back.
- It's cast to `media_player.kitchen_display` by two idle/activity automations, guarded
  on `media_title` ("Kitchen: Photos").
- **Never use a card that loads images by relative URL here.** The cast receiver runs at
  cast.home-assistant.io, so relative URLs 301 to a stock Nest Hub picture.
  `album-slideshow-card` broke this way and was reverted.
- Cameron said to leave the kitchen alone for the draggable-tile work.

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
  - `input_select.tablet_speaker` picks Amp / Kitchen / Bedroom, which map to
    `media_player.living_room_amp_2`, `homepod_mini_kitchen_2` and
    `homepod_mini_master_bedroom_2`. These are the MA players, not the Sonos/AirPlay ones.
  - Speaker cards: `media_card(..., volume=True)` shows the volume at the top right.
    Tapping one opens the shared pop-ups through `patch3.NAV_TARGETS` (`#ov-amp`,
    `#ov-homepod-kitchen`, `#ov-homepod-bedroom`).
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

**ha-phone** (room list) and **ha-computer** (whole house at once)
- Media cards are `columns 6, rows 2`, so tiles stack and drag freely.
- The Scenes header has the same swipe chevron. The 7-scene strip overflows at every size.

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
