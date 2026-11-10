# Working on Cameron's live install

`AGENTS.md` is written for someone adapting these dashboards to *another* house. This file
is for working on **this** one: Home Assistant at `http://192.168.1.117:8123`, HA 2026.10.2.
Handed over from Claude Code on 2026-10-27. Read `AGENTS.md` first anyway, for the general
rules.

**Every dashboard is the Show design** (one Lit card, `www/overlook-show.js`). The classic
button-card dashboards were retired on 2026-11-08. `docs/DASHBOARDS.md` says how to change and
deploy them.

## The five rules that matter most

1. **Cameron hand-edits things in HA. Never overwrite his edits.**
   - The Show dashboards other than the Phone Show hold one card, so their config lives in
     the Python and a plain deploy is safe. `ha-show-native` (Phone Show) is edited in HA's
     editor; deploy keeps it once it has been edited.
   - Automations and helpers: read the live config, back it up to a scratch file, change
     only your keys, and assert everything else is unchanged before saving.
2. **Verify by using it.** Drive the page in a headless browser (`tools/cdp.py`) and click
   the thing.
   - Read state back through the websocket.
   - Check every Show dashboard at its own size (list in `docs/DASHBOARDS.md`).
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
- The VM **can't reach Sol's LAN IP**. Anything HA calls on Sol uses `100.84.24.51`:
  Immich on :2283, Music Assistant on :30278.
- **MA's "Internal URL" must stay `http://100.84.24.51:30278/`** (MA: Settings > System >
  Webserver). MA announces it over mDNS and HA's MA integration copies it; when it falls back
  to the LAN IP, every `_2` player goes unavailable (2026-10-28, 10-31, 11-05). A root cron job
  on Sol (id 526, every 5 min) runs `tools/sol/ma-url-watch.sh` from
  `/mnt/SSDs/appconfig/`: it stops MA, fixes `settings.json` and starts it again, at most once
  per 30 minutes, and logs to `/mnt/SSDs/appconfig/ma-url-watch.log`.

## What exists, by dashboard

**Kitchen Show** `ha-show` (`show.py`, 1280x800)
- For the ALLDOCUBE 8" tablet, which hasn't arrived yet. Until then it is used in a browser.

**Hub Show** `ha-show-hub` (Nest Hub 1st gen, 1024x600, cast): Meridian screen cards, edited in HA. Since 2026-11-10 it is the Echo dashboard's layout with kitchen entities (Controls, Media, Climate, Calendar); the old `showhub.py` layout is backed up at `~/.config/ha/ha-show-hub.before-kitchen-2026-11-10.json`
- `automation.kitchen_display_keep_the_cast_alive` (`ha_config/kitchen_cast_keepalive.json`)
  casts `ha-show-hub/controls` every 2 minutes while the Hub is idle or showing something
  other than a `Hub Show:` page. While the Hub shows any dashboard its state is `playing`, so
  it will not pull the Hub off another HA dashboard; only a dropped cast is fixed.
- To reload it after a card change: `media_player.turn_off` the Hub, wait, then
  `cast.show_lovelace_view`. Casting the same view again does not reload the page.
- **Never use a card that loads images by relative URL here.** The cast receiver runs at
  cast.home-assistant.io, so relative URLs 301 to a stock Nest Hub picture.

**Master Bedroom Echo Show** `master-bedroom-echo-show` (Echo Show 5 2nd gen, 788x394): Meridian screen cards (`meridian-dock`, large button, large sensor, calendar, media, playlists), edited in HA. Replaced Bedroom Show (`ha-show-bedroom`) on 2026-11-10; the `bedside` options below now live on its `meridian-dock`
- Runs in the View Assist Companion app (VACA), which is also the voice satellite. Device
  setup: `docs/tasks/echo-show-bedroom.md`. A card change reaches it only after VACA restarts.
- **Night mode (2026-11-05):** `automation.master_bedroom_sleep_sounds_overnight` (repo copy
  `ha_config/bedroom_night.json`) turns `input_boolean.bedroom_night_mode` on 9pm-7:30am while
  anyone (or guest mode) is home, including on arrival inside the window.
  - The card shows a red clock on black while the room is dark (`binary_sensor.bedroom_dark`).
    A tap wakes it on Controls, and it goes back to the clock after 30s.
  - Brightness: `ha_config/bedroom_brightness.json`.
  - Artwork: `TRACK_ART` in overlook-show.js maps the title `Stream Sounds` to
    `/config/www/sounds/stream.svg` (repo copy `www/sounds/stream.svg`, copied up by hand).
- **Echo as a speaker:** SendSpin Player (`com.sendspindroid`) connects it to Music Assistant as
  `media_player.bedroom_echo`, its only media player. The old bedroom HomePod moved to the guest
  bedroom on 2026-11-05: `media_player.guest_bedroom_homepod_mini` (AirPlay) and `_2` (MA).
  - MA fetches local files from HA's **tailnet** address (`http://100.108.150.25:8123/local/...`).
    Keep a plain space in the URL: `%20` shows up in the title. Sol can't reach the VM's LAN IP.

**Phone Show** `ha-show-native` (`shownative.py`)
- Uses the phone's rooms, scenes and pop-ups from `showphone.py`. If a room changes, edit
  `ROOMS`/`SCENES` there.

**Computer Show** `ha-show-computer`
- Meridian cards edited in HA's own editor since 2026-11-10; deploy.py no longer writes it. Its
  heat pump and plant pop-ups were copied from the Phone Show, so a new room or light is added in
  HA by hand. The old full-screen Show config is in `~/.config/ha/ha-show-computer.before-native-2026-11-10.json`.

**Photos.** Each screen has its own `album_slideshow` camera of the Immich Family album
(`camera.album_slideshow_family` for the kitchen and Hub, `camera.album_slideshow_family_bedroom`
for the Echo). One camera has one current photo, so sharing one made both screens show the same
picture. A new photo screen needs its own entry.

**Playlists.** The Media pages play Spotify through **Music Assistant** with the Soloist
provider; HA's own Spotify integration can't drive the Sonos Amp or the AirPlay-only HomePods.
MA players are the `_2` entities (`media_player.living_room_amp_2`, `homepod_mini_kitchen_2`,
`guest_bedroom_homepod_mini_2`), plus `bedroom_echo`.
- `sensor.tablet_playlists` (`ha_config/tablet_playlists.yaml`, in `configuration.yaml`) lists
  what the card shows: `sensor.spotify_recent_playlists` first (the last 30 playlists Cameron
  started in the Spotify app, from HA's watch-only Spotify integration), then MA's last-played
  order. It filters MA's generated mixes and the six Plex playlists out **by name**, because
  `get_library` has no provider field. Spotify-made playlists (Daily Mix, Discover Weekly) never
  appear in the recent list: the API won't return them.
- **Next job:** `docs/tasks/paget-spotify.md`.

**Font.** Amazon Ember since 2026-11-08 (Cameron supplied Amazon's font set). The files are in
`/config/www/fonts/amazon-ember/` on HA only, never in this public repo; Lovelace resource
`/local/fonts/amazon-ember/ember.css` (type css) carries them to HA's own cards. It replaced the two
duplicate Figtree resources.

**Theme.** `themes/meridian.yaml` (deployed to `/config/themes/meridian/`) is the app-wide
default; HA's own pages and the Phone Show's sections view use it.
- It needs **both** `modes.light` and `modes.dark`: HA forces dark on a theme that only has dark.
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

## Sleep Sounds (2026-11-07)

`input_boolean.bedroom_night_mode` is shown as **Sleep Sounds** and is the one switch for the
bedroom stream sounds. `automation.master_bedroom_sleep_sounds` (`ha_config/sleep_sounds.json`)
plays Stream Sounds on the Echo at 9%, looping, while it is on and stops when it goes off.
The 9pm-7:30am automation (`ha_config/bedroom_night.json`) only flips the switch now. Every
dashboard has a Sleep Sounds tile for it: the Bedroom room's scenes and the favourites in
`show.py`, the Phone Show scenes, the Hub's Scenes sheet and a Controls tile on the Echo. A manual "on" stops at the next 7:30am or
when everyone leaves, like the automatic one.

## Room climate by voice and alerts (2026-11-08)

"What's the temp inside the bedroom / in here", "how warm is it in here", "what's the air quality in
here" (`automation.assist_room_climate`, `ha_config/assist_climate.json`) answer from the room's
VINDSTYRKA and open the Show card's Climate page on the asking screen for a minute (action `climate`
on `input_text.overlook_voice`; a touch keeps it there). `automation.master_bedroom_climate_alert_show_on_echo`
(`bedroom_climate_alert_screen.json`) does the same on the bedroom Echo when the humidity or air
quality alert notifies about the bedroom (it watches the alerts' `*_last_sent` helpers, so the two
alert automations are untouched), except while the room is dark. The VINDSTYRKA itself reports
temperature and humidity in whole units (raw 1800 = 18.00 °C), humidity/PM2.5 at most every 30 s
and VOC every 2 minutes; the card shows each report as it arrives.

## Voice timers and alarms (2026-11-07)

Say "set a timer for 10 minutes", "pause/resume/cancel the timer", "how long is left",
"set an alarm for 6:30" / "wake me up at 7", "when is my alarm", "cancel my alarm",
"snooze", and bare "stop" / "pause" (ringing first, then the timer, then any media playing in
the room). Sentence triggers in `automation.voice_timers_and_alarms`
(`ha_config/voice_clock.json`) win over HA's built-in timer intents, whose timers live on the
satellite where no dashboard can see them. The satellite's area picks the helpers:
`timer.<area>_timer`, `input_number.<area>_timer_length` (seconds, for Reset),
`input_datetime.<area>_alarm_time`, `input_boolean.<area>_alarm` and
`input_select.<area>_ringing` (Off / Timer / Alarm). Only `bedroom` has them; typed Assist with
no device uses the bedroom. `automation.voice_timers_and_alarms_ringing`
(`voice_clock_ring.json`) rings the Echo through VACA's `switch.bedroom_echo_va_alarm` (its
alarm volume), brightens a dark screen, turns Sleep Sounds off for an alarm, and stops after
10 minutes. Setting ringing back to Off silences it and puts the brightness back.
`script.voice_clock_snooze` (`voice_clock_snooze.json`) moves the alarm on 9 minutes.

The Show card shows it with option `clock: <area>` (Bedroom Show only): a running or ringing
timer takes the whole screen with Reset and Stop until it ends (tap the digits to pause), a
ringing alarm shows the time with Stop and Snooze, and a newly set alarm shows "Alarm set" for
8 seconds. In a dark room the countdown uses the night clock's red. Option `nowplaying: <media_player>` (Bedroom Show: `media_player.bedroom_echo`) does the
same for music: anything playing on the Echo except Sleep Sounds takes the whole screen (art, title,
progress, prev/play/next in the art's own accent colour; volume is the Echo's own buttons;
long names scroll) until it stops; the chevron closes it to photos, where a
line under the clock shows the track and reopens it on a tap. The idle return brings it back while
music plays, a pause lets it go after `idle`, and a dark room keeps the red clock.

The Echo's top button is a media mute whose red light always matches: `device/echo/privmute.sh` on the
Echo follows the light, `automation.master_bedroom_echo_watchdog` keeps it running. How, why, install
and undo: [ECHO_MUTE_BUTTON.md](ECHO_MUTE_BUTTON.md). A new voice screen needs the
five helpers for its area, a `rooms` entry in the ringing automation, and `clock` on its card.


## Voice music (2026-11-08)

"Play Fleetwood Mac", "play some Radiohead", "play Dreams by Fleetwood Mac", "play my golden
hour playlist", "play Discover Weekly", and bare "play music" (resumes). End with "in the
kitchen" / "on the amp" / "in the guest room" / "in the bedroom" to pick a speaker; otherwise
it plays in the room of the device you spoke to (typed Assist: bedroom). One sentence trigger,
`automation.voice_music` (`ha_config/voice_music.json`), works out the kind from the words
("... playlist", "... by <artist>", "some <artist>") and asks Music Assistant: playlists
are matched loosely against the library (`get_library`, so spoken names need not be exact),
the rest with `music_assistant.search`; a bare name takes an exact artist, then song, then
album, then the top artist. Speakers are the MA players: bedroom `media_player.bedroom_echo`,
kitchen `homepod_mini_kitchen_2`, amp `living_room_amp_2`, guest `guest_bedroom_homepod_mini_2`.
Pause, skip and volume are HA's built-in media intents (bare "pause" goes through the timer
automation first).