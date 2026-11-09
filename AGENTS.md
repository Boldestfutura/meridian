# Adapting these dashboards to a different home

> **Working on Cameron's own install (192.168.1.117)?** Read `docs/LIVE.md` first. This file
> is the general guide; that one is the live house, what is deployed, and how to change it safely.

You are an LLM pointed at this repo by someone who wants these dashboards on *their*
Home Assistant. This file is what you need to do that without rediscovering the
things that already went wrong once.

Read `README.md` first for what the dashboards are, and `docs/DASHBOARDS.md` for how they
are built and deployed.

**Only want the phone cards?** Install Meridian cards from HACS (README, Install with HACS) and
build the dashboard in HA's own editor. Nothing below is needed for that.

## What you are changing, and what you are not

| file | house-specific? | touch it? |
|---|---|---|
| `show.py` | Yes: `CARD` holds every entity, room, scene, pill, calendar | Yes, heavily |
| `showphone.py` | Yes: the phone's rooms, scenes, pop-ups and links | Yes |
| `showhub.py` `showbedroom.py` `showcomputer.py` `shownative.py` | Yes, lightly: which room, which page | Yes |
| `www/overlook-show.js` | Mostly no: layouts and behaviour | Only for a new *kind* of thing |
| `deploy.py` `ha_ws.py` | No | `HOST` and the SSH key path |

The card reads everything from its config. If you find yourself writing an entity id into
`overlook-show.js` to make one house work, you are probably doing it the wrong way round.

## Procedure

**1. Inventory the target install.** Do not guess entity ids from names; they lie.
In this house `light.bedside_lamp_paget` was not Paget's lamp, and
`switch.master_bedroom_smart_plug` lived in the living room.

```python
import ha_ws, itertools
ws = ha_ws.connect("<ha-host>", open("~/.config/ha/token").read().strip())
ids = itertools.count(1)
for s in ha_ws.call(ws, next(ids), type="get_states")["result"]:
    print(s["entity_id"], s["attributes"].get("friendly_name"))
```

Pay attention to **light groups** (`attributes.entity_id` is a list): each room's
all-lights switch needs one.

**2. Ask the owner what things actually are.** Which room each device is in, which
lamps matter, what they call them. Friendly names are often stale; the person is the
source of truth. Expect at least one entity whose id contradicts reality.

**3. Rewrite `show.CARD`** (rooms, lights, scenes, status pills, climate, speakers,
calendars, todo, photos) and the phone's `ROOMS` / `SCENES` / `POPUPS` / `LINKS` in
`showphone.py`. Delete rooms they do not have; add ones they do. Leave out what they lack:
no `photos`, no `recipes`, no `voice` is fine.

**4. Point `deploy.py` at their box**, make sure SSH reaches `/config/www`, and deploy with
`./deploy.py --dry-run <name>` first.

## Verify by driving it, not by looking at it

`tools/cdp.py` drives a headless browser over the DevTools protocol. Use it. A
screenshot repeatedly showed a dashboard as fine while it was broken.

Checks worth running every time:

- **Every layout.** The tablet, hub, bedside, desk and phone layouts share one file; a
  change for one can break another. Load each at its own size.
- **Overflow and clipping:** walk shadow roots for elements where
  `scrollWidth > offsetWidth + 1`, and check `scrollHeight` against the window.
- **Did it actually fire?** Subscribe to `call_service` on the websocket and tap the
  thing. Or stub the card's `_call` when the owner is using the lights.

**`document.body.innerText` does not see shadow DOM.** Any text check must recurse
through `shadowRoot`, or it will report content missing that is rendering fine.

**One websocket cannot both listen and act.** If you subscribe to events and call a
service on the same connection, the reader eats the frames and you conclude the
button is dead. Use two connections.

**A device can keep running an old card.** Browsers cache the JS until `VERSION`
changes, and kiosk apps and casts keep the page open for days. Bump the version, then
reload the device itself, before concluding a change didn't work.

## Hard constraints

**A cast loads the page from cast.home-assistant.io.** Any `/local/...` or `/api/...` URL
must go through the card's `_u()`, or it points at Google's server and the image is blank.

**HA's history API returns one day** unless you pass `end_time`.

**A theme with only `modes.dark` forces dark mode on every device.** Declare both modes.
HA 2026 buttons and toggles read `--ha-color-primary-05..95`, not `primary-color`.

**`card-mod` does not work on HA 2026.10.** It loads, logs its banner and injects no styles.
The Show card styles itself, so it doesn't need it; don't add it for native cards either.

## Do not overwrite someone's edits

People rearrange dashboards in the HA UI. The single-card dashboards have nothing to
rearrange, so a plain deploy is safe for them. The Phone Show is ordinary HA sections:
`deploy.py` keeps a snapshot of what it last wrote and stops writing the layout once the
live one differs. For automations and helpers, read the live config, back it up, change only
your keys, and check the rest is unchanged before saving.
