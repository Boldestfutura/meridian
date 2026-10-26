# Task: Paget's Spotify + a swipeable Playlists section on ha-tablet

Self-contained brief for an AI agent. Read `AGENTS.md` and `README.md` first, then this.
Written 2026-10-27, when Cameron's half of this was finished and verified.

## Goal

On the **ha-tablet** dashboard, the **Media** tab's "Playlists" section becomes a
sideways swipe of two pages:

- page 1: Cameron's playlists (exactly what is there today)
- page 2: Paget's playlists

It should swipe like the **Scenes** strip on the same dashboard, and its header gets the
same bouncing chevron (`d.room_header(..., swipe=True)`). Tapping a playlist plays it on
the selected speaker, the same as now. Nothing else on any dashboard changes.

## What exists today (do not rebuild it)

- **Music Assistant (MA)** 2.10.8 runs on the NAS. Home Assistant reaches it at
  `http://100.84.24.51:30278`. Spotify is in MA through the **Soloist** provider, and
  only Cameron's account is set up so far.
- MA's players in HA are the `_2` entities: `media_player.living_room_amp_2`,
  `media_player.homepod_mini_kitchen_2`, `media_player.homepod_mini_master_bedroom_2`.
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
- `tablet.py`: `playlist_slot(i)` and `media_panel()` build the 8 slots. Each slot is
  its own grid card. It hides with `numeric_state above i` and taps
  `music_assistant.play_media`.
- `design.py`: `pill_strip(items, rows=, col_w=)` is the horizontal scroller the Scenes
  strip uses.

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

## Step 4: the swipe UI (tablet.py)

- Today the slots are 8 separate grid cards, two per row at 6 columns each. Replace them
  with **one** full-width card (12 columns) that scrolls sideways one page at a time.
  - Use `d.pill_strip`, or a button-card in its style, holding two pages.
  - Each page is a 2-column x 4-row block of slots, exactly as wide as the strip.
  - Add `scroll-snap-type: x mandatory` on the scroller and `scroll-snap-align: start`
    on each page, so a swipe lands on a page and doesn't stop halfway.
- Reuse `playlist_slot(i)` so the look and tap action stay the same. Parameterise it by
  attribute (`items` / `items_paget`) and by the count used to hide empty slots. Inside
  a nested card, hide an empty slot with a conditional card or by returning nothing.
  Section `visibility` only works on top-level cards.
- Add a small label above each page, or a header that changes: "Cameron" / "Paget".
  Cameron should be able to tell which page he's on. Keep it in the existing style
  (`d.INK` / `d.MUTED`, the Figtree `d.FONT`).
- Change the header to `d.room_header("Playlists", "mdi:playlist-music", swipe=True)`.
  That gives the same bouncing chevron the Scenes header has.
- **button-card swallows clicks on nested cards' custom_fields** in some setups. After
  deploying, tap a slot on page 2 for real and confirm it plays (see Verify).

## Step 5: deploy (Cameron hand-edits these dashboards)

- **Never regenerate a live dashboard.** Read the live config (`lovelace/config`,
  url_path `ha-tablet`) and save a backup copy. Then replace **only** the Playlists
  header and the 8 slot cards. Assert everything else is byte-identical before
  `lovelace/config/save`. `./deploy.py --patch tablet` is the pattern, and `deploy.py`'s
  docstring explains it.
- Find the cards by full equality with what the generator built before your change,
  not by title. There is a second "Scenes" header on the tablet, for example.
- Keep `tablet.py` in step with what is now live, so a rebuild wouldn't undo it.

## Verify by using it, not by screenshot

- Drive the page over CDP with `tools/cdp.py`. Launch headless Helium on port 9233 at
  1280x800. Kill it by the PID from `ss -ltnp 'sport = :9233'`, **never `pkill -f`**:
  that kills its own shell.
- Swipe the strip (set `scrollLeft` on the scroller) and check it snaps to page 2.
- Tap one of Paget's playlists and check the selected MA player starts playing. **Only
  play audio when nobody is home** (`person.cameron` and `person.paget` both
  `not_home`), and pause afterwards.
- Also check 800x1280 (the tablet in portrait).

## Commit

- Before every push, check the repo is **private**: an unauthenticated
  `curl https://api.github.com/repos/Boldestfutura/overlook-ha` must return 404.
  Pushing over SSH works while it's private; never ask for it to be made public.
- Scan the diff for IPs, tokens and the real MA config entry id before committing.
- End commit messages with a `Co-Authored-By:` line for whichever agent did the work.

## Never

- Echo or commit the HA token (`~/.config/ha/token`), MA's token, or Spotify client
  secrets.
- Recreate HA's Spotify integration as the player. Playback stays on Music Assistant.
