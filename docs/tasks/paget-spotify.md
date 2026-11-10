# Task: Paget's Spotify playlists on the Show dashboards

Self-contained brief for an AI agent. Read `AGENTS.md`, `README.md` and `docs/DASHBOARDS.md`
first, then this. Written 2026-10-27 for the old ha-tablet dashboard; Steps 4 and 5 were
rewritten for the Show card on 2026-11-08, when the classic dashboards were retired.

## Goal

The Show card's playlist row (`_playlists()` in `www/overlook-show.js`, on Kitchen Show's
kitchen page, the Hub's Media page and Computer Show) gains Paget's playlists next to
Cameron's:

- Cameron's playlists, exactly what is there today
- Paget's playlists, from her own Spotify account through Music Assistant

Cameron should be able to tell whose playlist he is looking at. Tapping one plays it on the
selected speaker, the same as now. Nothing else on any dashboard changes.

## What exists today (do not rebuild it)

- **Music Assistant (MA)** 2.10.8 runs on the NAS. Home Assistant reaches it at
  `http://100.84.24.51:30278`. Spotify is in MA through the **Soloist** provider, and
  only Cameron's account is set up so far.
- MA's players in HA are the `_2` entities: `media_player.living_room_amp_2`,
  `media_player.homepod_mini_kitchen_2`, `media_player.bedroom_echo`, `media_player.guest_bedroom_homepod_mini_2`.
  `input_select.tablet_speaker` picks one of them.
- HA's own **Spotify integration** has one entry, for Cameron (title "Cameron"):
  `media_player.spotify_cameron`. It is **only watched, never used to play**: it can't
  drive the Sonos Amp or the AirPlay-only HomePods. Its `media_playlist` attribute names
  the playlist he's playing on any device.
- `configuration.yaml` on HA holds two trigger-based template sensors. The repo copy is
  `ha_config/tablet_playlists.yaml`, with a placeholder where the real
  `config_entry_id` goes.
  - `sensor.spotify_recent_playlists`: attribute `names` holds the last 30 playlist
    names Cameron started, newest first.
  - `sensor.tablet_playlists`: state is a count, attribute `items` is
    `[{name, uri, image}]`, up to 8. It lists Cameron's recent names first, then MA's
    `last_played_desc`. MA's generated mixes and the Plex playlists are filtered out
    **by name**.
- `www/overlook-show.js`: `_playlists()` draws `sensor.tablet_playlists`' `items` as cover
  tiles in a sideways scroller; a tap calls `music_assistant.play_media` on the Active
  Media speaker. The sensor is set by `playlists:` in `show.CARD`.

## Step 1: the human part (Cameron and Paget, at home)

An agent cannot do these. Wait until Cameron says all three are done.

1. **MA → Settings → Providers → add Spotify (Soloist)**. Use Paget's own Soloist API key
   from developer.spotify.com/dashboard/soloist, logged in as her. Pair it from *her*
   Spotify app while she's on home Wi-Fi (the "Music Assistant Pairing" device). Then
   turn on **Sync Library Playlists** in that provider's settings and save.
2. **developer.spotify.com/dashboard** → Cameron's app (the one with redirect
   `https://my.home-assistant.io/redirect/oauth`) → **User Management** → add Paget's
   Spotify email. Apps in development mode only let listed users sign in.
3. **HA → Settings → Devices & services → Spotify → Add entry**, logged in as Paget.
   This should create `media_player.spotify_paget`. Check the real entity id; don't
   assume it.

## Step 2: verify before building

- `media_player.spotify_paget` exists. While Paget plays one of **her own** playlists,
  its `media_playlist` attribute is set. It is `None` for albums, Liked Songs, search,
  and Spotify-made playlists (Daily Mix, Discover Weekly, "This Is…"), because Spotify's
  API won't return those. DJ is special-cased and does show.
- MA's playlist count went up after her sync: `music_assistant.get_library`,
  `media_type: playlist`. Cameron alone gave 80 Spotify + 8 built-in + 6 Plex. Raise
  `limit` above 100 if the total now exceeds it.

## Step 3: sensors (configuration.yaml on HA)

- Add `sensor.spotify_recent_playlists_paget`. Copy the existing recent sensor, swap
  `media_player.spotify_cameron` for Paget's player, and use a new `unique_id`.
- Extend `sensor.tablet_playlists`:
  - Keep `items` exactly as it is; Cameron's page and the existing slots read it.
  - Add a second attribute `items_paget`, built the same way from Paget's recent names.
  - Add a state trigger on the new Paget sensor.
- Known limit: MA merges both accounts into one library, and `get_library` gives **no
  owner or provider field**. Paget's page can therefore only be "playlists she has
  started recently". It starts empty and fills as she plays.
  - Optional: check whether some other MA call exposes `provider_mappings` per
    playlist, which would give her page a proper fallback. Only do this if it's real.
    Don't invent a field.
  - Playlists they both follow appear on both pages. That is fine.
- The state is a count that the slot visibility uses. Either make Paget's count a second
  attribute, or add a small template sensor for it. Visibility conditions can't read
  attributes, so a separate count sensor is the easy route.

### Editing configuration.yaml (gotchas that have already bitten)

- It has **CRLF** line endings. Keep them.
- The HA SSH add-on has **no python3**. Copy the file down, edit it locally, and copy it
  back:
  `scp -i ~/.config/ha/vmkey root@192.168.1.117:/config/configuration.yaml .`
  If known_hosts complains, add `-o UserKnownHostsFile=<scratch file>`.
- Back it up first on the box, e.g. `configuration.yaml.bak-<date>`.
- Check the config with REST `POST /api/config/core/check_config`. Then call
  `template.reload`, and fire event `tablet_playlists_refresh` to repopulate.
- Mirror every change into `ha_config/tablet_playlists.yaml`, with the placeholder
  config entry id, never the real one.

## Step 4: the UI (www/overlook-show.js)

- Ask Cameron how to show the two accounts before building: a second row, a
  Cameron / Paget switch above the row, or one row with a small name on each cover.
- Read the second list from a new attribute (`items_paget`) on the same sensor, so
  `show.CARD["playlists"]` stays one entity.
- Keep the cover tiles and the tap action as they are.

## Step 5: deploy

- Bump `VERSION` in `show.py` and `www/overlook-show.js`, then
  `./deploy.py show showhub shownative` (see `docs/DASHBOARDS.md`).
- Reload the Nest Hub's cast so it picks up the new card.

## Verify by using it, not by screenshot

- Drive the page in a headless browser with `tools/cdp.py`. Kill the browser by PID,
  **never `pkill -f`**: that kills its own shell.
- Check Kitchen Show at 1280x800 and the Hub's Media page at 1024x600.
- Tap one of Paget's playlists and check the selected MA player starts playing. **Only
  play audio when nobody is home** (`person.cameron` and `person.paget` both
  `not_home`), and pause afterwards.

## Commit

- The repo is **public** (Cameron's choice, 2026-11-03). Everything pushed is world-readable.
- Scan the diff for IPs, tokens and the real MA config entry id before committing.
- End commit messages with a `Co-Authored-By:` line for whichever agent did the work.

## Never

- Echo or commit the HA token (`~/.config/ha/token`), MA's token, or Spotify client
  secrets.
- Recreate HA's Spotify integration as the player. Playback stays on Music Assistant.
