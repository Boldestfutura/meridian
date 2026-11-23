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
- The VM **can't reach Sol's LAN IP**. Anything HA calls on Sol uses `100.84.24.51`
  (Immich on :2283).
- Music Assistant is an HA add-on in the VM since 2026-11-14, so the old Sol URL watchdog
  (`tools/sol/ma-url-watch.sh`, cron 526) is gone.

## What exists, by dashboard

**Kitchen Show** `ha-show` (`show.py`, view `show`): the tablet pages in `www/tablet.js`. Shown on
the kitchen display and cast to the Nest Hub since 2026-11-11. Since 0.32.0 (2026-11-13) both swipe between
Media | Home | Rooms | Recipes with no dock (Climate lives in Rooms) and go idle to the photo clock (KS's screensaver since 2026-11-21). Hub Show (`ha-show-hub`), Kitchen
Tablet Show (`kitchen-tablet-show`) and View Assist (`view-assist`) were deleted that day;
backups in `~/.config/ha/*.deleted-2026-11-11.json`.
- **Tablet:** ALLDOCUBE iPlay 80 mini Turbo, Android 16, 1280x800 CSS. Since 2026-11-21 it runs
  **Kiosk Satellite** (KS 2026.11.23, `me.jxl.kiosk_satellite`), which replaced VACA. VACA is
  disabled (`pm disable-user`), not uninstalled, as a rollback until about 2026-11-28.
  - HA sees KS as an ESPHome device: "Kitchen Display", node `ks-kitchen-display`, area Kitchen,
    entities `*.kitchen_display_*` (106). Satellite `assist_satellite.kitchen_display_assist_satellite`,
    pipeline Claude, wake word Okay Nabu (microWakeWord, moderately), stop word on.
  - Settings live in KS, not HA: its remote admin is `http://192.168.1.73:2324` (password and API
    token in `~/.config/ks/`, never in this repo). Start page `ha-show/show`.
  - Music: KS's built-in Sendspin player. Music Assistant creates `media_player.kitchen_display_5`,
    the kitchen voice-music target and the Kitchen room media tile.
  - Idle is KS's screensaver, not Meridian's (the card has no `photos`, `photo_clock` or `night`
    now): after 90 s, KS's Home Assistant Dashboard mode from 5:30 to 8am showing the hidden `kitchen-weather/weather` dashboard (Meridian's morning forecast over the animated sky from `www/sky.js`; `screensaver.dashboard_view`), KS's Immich mode (the Family album straight from Immich, KS's own API key) from
    8am, the Clock from 9pm. **The schedule (`screensaver.schedule`) overrides
    `screensaver.mode`**: change the schedule entry, not the mode. KS's night mode turns the clock
    red under 3 lx and hides the widgets. Widgets apply to every mode (set in KS): small clock,
    weather (`weather.outdoor_south_melbourne`), calendar
    `calendar.p_c`. A calendar entry needs `name` and `on` as well as `entity` and `color`, or its
    badge shows "?". Camera Streams mode draws no widgets.
  - Now Playing is KS's (`sendspin.fullscreen`), split beside the photos
    (`sendspin.fullscreen_split`) with the queue (`sendspin.fullscreen_queue`).
  - Morning, 5:30-8:00: `ks_kitchen_morning_widgets` (`ha_config/kitchen_morning_widgets.json`)
    turns `switch.kitchen_display_screensaver_widgets` off at 5:30 and on at 8:00 (the weather
    dashboard has its own clock and forecast). KS's At a glance row is off for good
    (`screensaver.glance_enabled` false, set in KS). `rest_command.ks_kitchen_settings` (PATCH
    `/api/settings`, token as `ks_kitchen_auth` in secrets.yaml) is still defined but unused.
    The slot was KS's Weather Mood 2026-11-22/23 and the `kitchen-morning` dashboard before that;
    `kitchen-morning` was deleted 2026-11-24.
  - Washing alert: KS's screensaver covers the dashboard, so `washing_alert_wakes_displays`
    switches the screensaver off on the kitchen and the Echo (not in bedroom night mode) while
    `input_boolean.washing_machine_alert` is on.
  - Weather questions get KS's weather card (the forecast panel beside the answer). It comes from
    the HA integration **Voice Satellite LLM Tools** (KS's author, `custom_components/
    voice_satellite_llm_tools`, installed by hand since HACS isn't installed), entry Weather
    Forecast: daily `weather.outdoor_south_melbourne`, hourly `weather.forecast_home` (BoM's
    hourly times have no timezone and the tool reads them as UTC, 11 hours out). Its API
    "Voice Satellite: Weather Forecast" is ticked on the Claude agent. To let the agent get the
    question: automations `assist_weather_forecast` and `assist_rain_forecast` are OFF, and
    `weather.forecast_home` is no longer exposed to Assist (HA's built-in "what's the weather"
    intent answered first, text only). Needs `voice.overlay_mode` full: docked shows no results.
  - KS is Android's home app. The "default home app" and "access all device logs" dialogs pause
    KS and freeze its screen until dismissed; READ_LOGS is granted, so the logs one is gone.
  - Timers: KS's own (voice and Main's presets, via `ks_timers`). See Voice timers below.
    Alarms still use the helpers `input_datetime.kitchen_alarm_time`, `input_boolean.kitchen_alarm`,
    `input_select.kitchen_ringing`; `voice_clock_ring` rings the kitchen with a repeating KS announce.
  - `binary_sensor.kitchen_dark` was deleted 2026-11-21 (nothing used it once KS handled night);
    the light level is `sensor.kitchen_display_ambient_light`.
  - A card change needs KS to reload: `button.kitchen_display_restart_app`, or the admin API's
    `restartApp` command. No WebView devtools; the admin API's `evalJs` command runs JS in the page.
  - ADB is Wireless debugging (paired with luna), so the port changes on every boot:
    `adb mdns services` finds it. No HA ADB watchdog like the Echo's.
  - The WebView keeps old JS for a URL it has seen: bump `VERSION` on every deploy.
- **Nest Hub**: retired 2026-11-14. Its cast keep-alive automation was removed on 2026-11-15.
  - **Never use a card that loads images by relative URL here.** The cast receiver runs at
    cast.home-assistant.io, so relative URLs 301 to a stock Nest Hub picture.
- **Feeds the pages read:** `/local/norish/plan.json` (`tools/ha/norish_plan.py`, the week's
  meal plan) and `/local/nowplaying/index.json` (`tools/ha/plex_art.py`, Plex background and
  logo per show or film, fetched when the Apple TV starts something new). Plex's URL and token
  are in `/config/.plex.json` (mode 600), never in the repo.

**Master Bedroom Echo Show** `master-bedroom-echo-show` (Echo Show 5 2nd gen, 788x394): Meridian screen cards (`meridian-dock`, large button, large sensor, calendar, media, playlists), edited in HA. Replaced Bedroom Show (`ha-show-bedroom`) on 2026-11-10; the `bedside` options below now live on its `meridian-dock`
- Runs in **Kiosk Satellite** since 2026-11-21 (KS 2026.11.23 armeabi-v7a, on R0rt1z2's
  LineageOS 18.1, not KS's own Echo image, so no echo cancellation for the wake word over loud
  music). VACA (`com.msp1974.vacompanion`) and SendSpin Player (`com.sendspindroid`) are disabled
  (`pm disable-user`), not uninstalled. KS is the Android home app.
  - HA: ESPHome device "Bedroom Echo", node `ks-bedroom-echo`, area Bedroom, entities
    `*.bedroom_echo_*`; satellite `assist_satellite.bedroom_echo_assist_satellite`, pipeline
    Claude, wake word Okay Nabu (microWakeWord). Remote admin `http://192.168.1.133:2324`
    (password and API token in `~/.config/ks/`, never in this repo). Start page
    `master-bedroom-echo-show/controls`.
  - Idle is KS's screensaver: after 300 s, the hidden `echo-weather/weather` dashboard 6:30-8am
    (KS's Home Assistant Dashboard mode, same card as `kitchen-weather` but laid out for 960x480;
    `ks_bedroom_morning_widgets` turns the widgets off, glance row off in KS), Immich (Family album, no
    captions: they push the weather widget off this small screen) from 8am, the clock from 9pm,
    red under 5 lx.
    Same widgets as the kitchen. KS's full-screen Now Playing is OFF here: it has no night
    exception and would cover the night clock with Sleep Sounds all night.
  - Brightness is KS's adaptive brightness (5% at 5 lx or less, 80% from 300 lx); Android's
    own auto brightness is off and `automation.master_bedroom_echo_brightness` is turned off.
  - `binary_sensor.bedroom_dark` now reads `sensor.bedroom_echo_ambient_light` (Pip and the
    climate alert still use it). The dock lost `photos` and `night` (KS's now).
  - Timers are KS's own (`ks` variable: bedroom); alarms ring through KS's repeating announce
    and still turn Sleep Sounds off first. During Sleep Sounds the wake word drops to
    Slightly sensitive (`bedroom_echo_night_wake_threshold.json`).
  - A card change needs KS to reload (`restartApp` on the admin API).
- **Night mode (2026-11-05):** `automation.master_bedroom_sleep_sounds_overnight` (repo copy
  `ha_config/bedroom_night.json`) turns `input_boolean.bedroom_night_mode` on 9pm-7:30am while
  anyone (or guest mode) is home, including on arrival inside the window.
  - The card shows a red clock on black while the room is dark (`binary_sensor.bedroom_dark`).
    A tap wakes it on Controls, and it goes back to the clock after 30s.
  - Brightness: the old VACA brightness automation was deleted 2026-11-24; KS handles the screen.
  - Artwork: `TRACK_ART` in overlook-show.js maps the title `Stream Sounds` to
    `/config/www/sounds/stream.svg` (repo copy `www/sounds/stream.svg`, copied up by hand).
- **Echo as a speaker:** KS's built-in Sendspin player, `media_player.bedroom_echo` in Music
  Assistant (renamed from `_2` on 2026-11-21; the old SendSpin app's entity is now
  `media_player.bedroom_echo_sendspindroid`). The old bedroom HomePod moved to the guest
  bedroom on 2026-11-05: `media_player.guest_bedroom_homepod_mini` (AirPlay) and `_2` (MA).
- **En Suite HomePod:** the old kitchen HomePod moved to En Suite on 2026-11-13. Entity IDs stay
  `media_player.homepod_mini_kitchen` (AirPlay) and `_2` (MA); HA friendly names, device names and
  the area are **En Suite HomePod** / `en_suite`. The dashboards label it En Suite HomePod.
  Its readings arrive like the guest room's (see the HomePod webhook in `configuration.yaml`): the
  same webhook, with `"room": "En Suite"` in the body, sets `sensor.en_suite_temperature` and
  `sensor.en_suite_humidity`; a body without a room still goes to the guest room.

**Renamed 2026-11-14: the tablet is the Kitchen Display.** The Nest Hub is "Kitchen Nest Hub"
(`media_player.kitchen_display` is still the Hub). The old VACA entities (`*.kitchen_tablet_va_*`)
went unavailable when Kiosk Satellite took over on 2026-11-21; the automations and dashboards use
the KS ones (`*.kitchen_display_*`). The voice glow (`voice_satellite`) shows on the tablet and never on a Cast
receiver (`CrKey` in the user agent), so the Hub showing the same dashboard stays dark.

**Washing machine plug (2026-11-14).** Tapo P110M, in HA twice: the TP-Link integration (device
"Washing Machine", area Laundry: `sensor.washing_machine_power`, `switch.washing_machine`, ...) and
Matter ("Washing Machine (Matter)", only an on/off switch, `switch.washing_machine_matter`, hidden).
Power only comes through TP-Link. Its auto-update is OFF (firmware moved the P100 to TPAP and locked
HA out). The door sensor isn't bought yet.
First real cycles 2026-11-14: filling draws ~10 W and the idle machine ~2 W, so the start
threshold is **5 W** for 2 min (was 10, which missed the fill); finish is under 4 W for 2 min (5 until
2026-11-17, when a back-to-back load swapped in 4½ min merged into one); no pause inside a cycle has
lasted even 20 s. `script.washing_hung_out` (idle, alert off, phone notifications
cleared) is run by the **Hung it out** button on the phone notification (action `WASHING_HUNG_OUT`,
handled in automation `washing_machine`) and on the cards' built-in washer pop-up (0.33.1). Tapping
the washer bubble or status pill opens that pop-up (status, time, power graph) instead of HA's
input_select dialog, where someone on the Echo had set it back to running by mistake.
  - MA fetches local files from HA's **tailnet** address (`http://100.108.150.25:8123/local/...`).
    Keep a plain space in the URL: `%20` shows up in the title. Sol can't reach the VM's LAN IP.

**Phone Show** `ha-show-native` (`dashboards/ha-show-native.json`)
- Edited in HA only; patch it by key, then `python3 tools/live_sync.py pull` and commit.
- The Kitchen media tile is the Kitchen Display MA player, not the Nest Hub (live layout
  patched 2026-11-13).

**Computer Show** `ha-show-computer`
- Meridian cards edited in HA's own editor since 2026-11-10; deploy.py no longer writes it. Its
  heat pump and plant pop-ups were copied from the Phone Show, so a new room or light is added in
  HA by hand. The old full-screen Show config is in `~/.config/ha/ha-show-computer.before-native-2026-11-10.json`.

**Photos.** Each screen has its own `album_slideshow` camera of the Immich Family album
(`camera.album_slideshow_family`, no longer shown anywhere since the kitchen moved to KS's own Immich mode on 2026-11-21, and `camera.album_slideshow_family_bedroom`
for the Echo). One camera has one current photo, so sharing one made both screens show the same
picture. A new photo screen needs its own entry.

**Playlists.** The Media pages play Spotify through **Music Assistant** with the Soloist
provider; HA's own Spotify integration can't drive the Sonos Amp or the AirPlay-only HomePods.
MA players are the `_2` entities (`media_player.living_room_amp_2`, `homepod_mini_kitchen_2`
— now the En Suite HomePod — and `guest_bedroom_homepod_mini_2`), plus `bedroom_echo`.
- `sensor.tablet_playlists` (in `configuration.yaml`; repo copy `ha_config/configuration.yaml`) lists
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

## Inspection mode (2026-11-23)

For rental inspections. `automation.inspection_mode` (`ha_config/inspection_mode.json`) arms
`input_boolean.inspection_today` by voice ("Alexa, we have an inspection today", "inspection
mode"; "cancel the inspection" disarms) or from a `calendar.p_c` event with "inspection" in
its title. On that day, once Cameron and Paget are both away (2 min), or when the inspection
event starts while they are, `input_boolean.inspection_mode` goes on. On the Kitchen Display and
the Echo it then: switches KS's Immich screensaver to the **Inspection** album (six Unsplash
landscapes, captions off) through `rest_command.ks_*_settings`, turns the corner widgets and
cameras off, mutes the mics (`switch.*_vs_mute`), sets `number.*_volume` to 0 (saved first in
`input_number.inspection_*_volume`), starts the screensaver and turns Lockdown Mode on. KS's
`lockdown.allow_screensaver` is on for both (set in KS), otherwise a locked screen shows the
dashboard instead of the photos; taps do nothing, 7 fast taps unlock. The first of them home
turns it off and restores everything (Family album, captions, volumes). Cameron's iPhone gets
a notification both ways. The Inspection mode toggle works by hand too.
`ks_*_morning_widgets` and `washing_alert_wakes_displays` do nothing while it is on.
Album values must go to KS as a JSON *string*: HA turns template output that looks like a list
into a list, which KS ignores, so the automation builds the settings dict with `| to_json`.
KS keeps the photo list it loaded, so turning it off also restarts the screensaver
(`switch.*_screensaver_active` off, 3 s, on); without that the stock photos stayed up.

## Cameras and Frigate (2026-11-23)

The only cameras are the Kitchen Display's and the Echo's, served by Kiosk Satellite as RTSP
on port 8554, path `/camera`, with auth (Kitchen 1280x720, Echo 640x480, 10 fps, no audio, date
overlay). Frigate 0.18 runs on Sol (TrueNAS app `frigate`) and pulls both through go2rtc:
continuous recording kept 2 days, motion 4, detections 7, alerts and snapshots 30, on the
HDD dataset `HDDs/Frigate`, which has **no snapshot task on purpose** (deleted footage must free
space). Detection is OpenVINO on the CPU, people only. The Frigate config and every credential
live outside this repo, on luna. HA gets events over MQTT: the **Mosquitto broker add-on** (with a
`frigate` login) plus the Frigate custom component in `/config/custom_components/frigate`,
copied by hand like the other custom components. Frigate reaches the broker over the tailnet,
because Sol can't reach the VM's LAN address. Entities: `camera.kitchen_display` /
`camera.bedroom_echo` and their `switch.*_detect` / `*_recordings`, plus the person sensors.
Inspection mode turns the KS cameras off, so nothing records while the agent is in.
`automation.cameras_record_only_when_we_re_out` (`ha_config/frigate_presence_recording.json`,
2026-11-24) turns Frigate's recording and detection switches on only while Cameron and Paget are both
away and guest mode is off, and off otherwise. It re-checks when a Frigate restart turns them back on.
Footage runs about 29 GB a day while recording around the clock.

VACA was removed 2026-11-24: both config entries, `/config/custom_components/vaca` (backup in
`/backup/vaca-custom-component-2026-11-24.tgz`) and the companion app on both screens.
Kiosk Satellite does everything VACA did.

## Sleep Sounds (2026-11-07)

`input_boolean.bedroom_night_mode` is shown as **Sleep Sounds** and is the one switch for the
bedroom stream sounds. `automation.master_bedroom_sleep_sounds` (`ha_config/sleep_sounds.json`)
plays Stream Sounds on the Echo at 9%, looping, while it is on and stops when it goes off.
The 9pm-7:30am automation (`ha_config/bedroom_night.json`) only flips the switch now. Every
dashboard has a Sleep Sounds tile for it: the Bedroom room's scenes and the favourites in
`show.py` (and the tablet's quick actions), the Phone Show scenes and a Controls tile on the Echo. A manual "on" stops at the next 7:30am or
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
`input_select.<area>_ringing` (Off / Timer / Alarm). `bedroom` and `kitchen` have them; areas with a Kiosk Satellite (the `ks` variable: kitchen, bedroom) use the kiosk's own timers instead (`esphome.<node>_vs_*`, sensors `sensor.<node minus ks_>_vs_timers` / `_vs_next_timer`, empty `timer_id` = the only timer), and only alarms use the helpers; typed Assist with
no device uses the bedroom. `automation.voice_timers_and_alarms_ringing`
(`voice_clock_ring.json`) rings both kiosks with a repeating KS announce (room key `ks`),
turns Sleep Sounds off for a bedroom alarm, and stops after 10 minutes. Setting ringing back to Off silences it and puts the brightness back.
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
kitchen" / "on the kitchen display" / "in the en suite" / "on the amp" / "in the guest room" /
"in the bedroom" to pick a speaker; otherwise it plays in the room of the device you spoke to
(typed Assist: bedroom). One sentence trigger,
`automation.voice_music` (`ha_config/voice_music.json`), works out the kind from the words
("... playlist", "... by <artist>", "some <artist>") and asks Music Assistant: playlists
are matched loosely against the library (`get_library`, so spoken names need not be exact),
the rest with `music_assistant.search`; a bare name takes an exact artist, then song, then
album, then the top artist. Speakers are the MA players: bedroom `media_player.bedroom_echo`,
kitchen `media_player.kitchen_display_5` (the Kitchen
Display's KS Sendspin player), en suite `media_player.homepod_mini_kitchen_2`, amp `living_room_amp_2`, guest
`guest_bedroom_homepod_mini_2`. "In the kitchen" and "on the kitchen display" both pick the
tablet; "in the en suite" picks the moved HomePod.
Pause, skip and volume are HA's built-in media intents (bare "pause" goes through the timer
automation first).