# Overlook for Home Assistant

Four Home Assistant dashboards sharing one design language, generated from Python
and deployed over the websocket API.

| dashboard | shape | built for |
|---|---|---|
| `kitchen` | fixed panel, no scrolling | 1024x600 wall display (Nest Hub) |
| `phone` | single column, room sections | handheld |
| `tablet` | control centre, rail + room switcher | iPad, both orientations |
| `computer` | whole house at once, 4 columns | 1920x1080 and 1440x900 laptops |

Flat, borderless cards; tints derived from an accent with `color-mix()` so light and
dark both work from one definition; detail lives in pop-ups rather than dropdowns.

## Why it is generated rather than hand-written YAML

Each dashboard is ~60-280 KB of JSON. The cards are near-identical with different
entities, and a change to, say, the tile height has to land in ~90 places. `design.py`
holds the card builders; the dashboard modules are thin layouts over it.

## Requirements

- Home Assistant **2026.10** or similar
- [`custom:button-card`](https://github.com/custom-cards/button-card) — every card
- [`Bubble Card`](https://github.com/Clooos/Bubble-Card) — the pop-ups
- A theme named `Overlook` (any theme works; the dashboards only rely on standard
  HA CSS variables)
- A long-lived access token at `~/.config/ha/token`

**`card-mod` is deliberately not used.** On HA 2026.10 it loads, logs its banner and
injects no styles at all — see `design.py`. Everything here uses button-card's native
`styles`, which is why the code looks the way it does.

## Use

```sh
./deploy.py --list                 # what is on the box
./deploy.py kitchen computer       # rebuild those from the generators
./deploy.py --dry-run phone        # build and diff, write nothing
./deploy.py --patch phone          # patch the LIVE config, keep hand edits
```

`HA_HOST` and `HA_TOKEN_FILE` override the defaults.

### Deploy vs patch

Plain deploy **replaces** a dashboard. `--patch` reads what is live, swaps only the
cards it owns, and refuses to write if anything else moved. Use `--patch` for any
dashboard that has been edited in the HA UI — otherwise those edits are silently lost.

## Adapting it to another house

The entity ids are hard-coded to one install (89 of them). There is no mapping layer
yet, so adopting this today means editing the dashboard modules — `design.py` itself
is entity-agnostic and should need no changes.

Making that a `entities.yaml` of role -> entity is the obvious next step and is not
done.

## Layout

```
design.py      the design language: every card builder, the palette, the colour logic
patch3.py      status pills, the 17 pop-ups, and the in-place patcher
patch.py       older single-purpose patcher, kept for reference
kitchen.py     \
phone.py        | one module per dashboard, thin layouts over design.py
tablet.py       |
computer.py    /
deploy.py      CLI
ha_ws.py       minimal websocket client (no websocket library needed)
tools/cdp.py   headless-browser driver used to verify renders
```

`tools/cdp.py` drives a headless Chromium over the DevTools protocol to check a
dashboard actually rendered — measuring card sizes, catching clipped labels, clicking
things and reading back the result. Screenshots alone repeatedly failed to catch
broken cards here.
