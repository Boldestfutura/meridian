# Adapting these dashboards to a different home

> **Working on Cameron's own install (192.168.1.117)?** Read `docs/LIVE.md` first. This file
> is the general guide; that one is the live house, what is deployed, and how to change it safely.

You are an LLM pointed at this repo by someone who wants these dashboards on *their*
Home Assistant. This file is what you need to do that without rediscovering the
things that already went wrong once.

Read `README.md` first for what the four dashboards are.

## What you are changing, and what you are not

| file | entity-specific? | touch it? |
|---|---|---|
| `design.py` | **No** — pure card builders, palette, colour logic | Only to add a new *kind* of card |
| `patch3.py` | Yes — status pills, 17 pop-ups | Yes, heavily |
| `kitchen.py` `phone.py` `tablet.py` `computer.py` | Yes — layouts | Yes |
| `deploy.py` `ha_ws.py` | No | No |

`design.py` is the design language. If you find yourself editing it to make one
house work, you are probably doing something the wrong way round.

## Procedure

**1. Inventory the target install.** Do not guess entity ids from names — they lie.
In this house `light.bedside_lamp_paget` was not Paget's lamp, and
`switch.master_bedroom_smart_plug` lived in the living room.

```python
import ha_ws, itertools
ws = ha_ws.connect("<ha-host>", open("~/.config/ha/token").read().strip())
ids = itertools.count(1)
for s in ha_ws.call(ws, next(ids), type="get_states")["result"]:
    print(s["entity_id"], s["attributes"].get("friendly_name"))
```

Pay attention to **light groups** (`attributes.entity_id` is a list) — the room
toggles in the headers need them.

**2. Ask the owner what things actually are.** Which room each device is in, which
lamps matter, what they call them. Friendly names are often stale; the person is the
source of truth. Expect at least one entity whose id contradicts reality.

**3. Rewrite the layout modules.** Keep the shape: a status strip, then one section
per room, each opening with `design.room_header(title, icon, light_group)`. Swap the
entities and labels. Delete rooms they do not have; add ones they do.

**4. Rewrite `patch3.py`'s pop-ups** for their sensors and media players. The pattern
is `design.info_popup(hash, title, icon, rows, extra)` plus a tile whose `tap_action`
navigates to `#<hash>`.

**5. Deploy and verify.** `./deploy.py --dry-run <name>` first.

## Verify by driving it, not by looking at it

`tools/cdp.py` drives headless Chromium over the DevTools protocol. Use it. A
screenshot repeatedly showed a dashboard as fine while cards were broken.

```python
import tools.cdp as cdp
b = cdp.Browser(9222)
b.call("Emulation.setDeviceMetricsOverride", width=402, height=900,
       deviceScaleFactor=1, mobile=True)
b.goto("http://<ha-host>:8123/<dash>/home")
```

Checks worth running every time:

- **Clipping:** walk shadow roots for `#name` where `scrollWidth > offsetWidth + 1`.
- **Overflow:** `document.documentElement.scrollHeight > window.innerHeight`.
- **Card sizes:** `getBoundingClientRect()` on `BUTTON-CARD` elements.
- **Did it actually fire?** Subscribe to `call_service` on the websocket and click
  the thing.

**`document.body.innerText` does not see shadow DOM.** Any text check must recurse
through `shadowRoot`, or it will report content missing that is rendering fine.

**One websocket cannot both listen and act.** If you subscribe to events and call a
service on the same connection, the reader eats the frames and you conclude the
button is dead. Use two connections, and fire a known-good control call through the
listener first to prove it can see anything.

**A pop-up existing is not the same as something linking to it.** The hashes and the
`navigation_path`s are independent halves. Walk the config twice — once collecting
`custom:bubble-card` `hash` values, once collecting every `tap_action.navigation_path`
— and diff the two sets in both directions. On this install the phone dashboard
carried all three plant pop-ups while both plant tiles were still on `more-info`, so
grepping for `ov-plant` found matches on every dashboard and the feature was dead on
one of them. Also exclude anything nested inside a pop-up when you rewrite tap
actions, or a reading inside a pop-up gets a link back to the pop-up it is already in.

**A dashboard can disagree with the generator that made it.** Before changing a
generator because a feature is missing, diff the live config against it per
dashboard. The generator was right in the case above; only the saved config was
stale. Changing `phone.py` would have fixed nothing.

## Card heights line up with `grid_options.rows`

The sections view is a 12-column grid of **56px rows, 8px gap**, and `grid_options`
takes `rows` as well as `columns`. A row is as tall as its tallest card, so a 56px
tile next to the 124px `media_card` strands itself at the top of the row with ~68px
of nothing beneath it.

`{"columns": 6, "rows": 2}` on the media card spans it over two rows (56 + 8 + 56 =
120px) and the tiles flow around it. Each tile remains its own card, so the user can
still drag them anywhere and the grid re-packs — which is the whole point.

**Every media card spans two rows, on every sections dashboard, paired or not.** A pair
of media cards side by side looks fine without it, right up until someone drags a tile
next to one. The span is what keeps any arrangement made in the UI gap-free.

**Never wrap a group of cards in a `conditional` or a `grid` to switch them as a unit.**
The tablet's room panels were built that way and none of their tiles could be dragged.
Give each card its own `visibility` rule instead (the tablet uses a state condition on
`input_select.tablet_room`): it switches the same way and every card stays movable.

A `design.stack()` helper was built for this first, putting two cards inside one
button-card's `custom_fields`. It worked and was still wrong: it welded the pair
together so they could not be separated in the UI. It has been deleted. **Do not
rebuild it.** Check whether HA has the feature before writing a container for it.

## Hard constraints

**`card-mod` does not work on HA 2026.10.** It loads, logs `CARD-MOD IS INSTALLED`,
and injects no styles at all. Everything here is `custom:button-card`'s native
`styles` because of that. Before assuming card-mod is fixed on a newer HA, test it:
put `background: rgb(255,0,0) !important` on a plain built-in `tile` and read the
computed background. If it is still white, card-mod is not running.

**button-card cannot draw a dropdown, a slider or a stepper.** That is why detail
lives in Bubble Card pop-ups — a tile shows the current value and taps through to a
grid of option tiles that call the service. See the fan-mode and source pickers.
Where a native control is unavoidable (update Install buttons, weather forecast),
a native `tile` is used inside the pop-up and that is fine.

**You can tint the surface behind a native card, but not the controls inside it.**
Wrapping a native tile in a button-card `custom_field` and setting
`--ha-card-background: transparent` makes it sit flush on your tint, because CSS
custom properties inherit into shadow DOM. The same trick fails for
`--control-button-background-color` and `--control-slider-color`: HA sets those on a
closer ancestor, so inheritance loses. Read the computed value off the inner element
before trying.

**A `horizontal-stack` does not stretch button-card's grid.** Without
`{"width": "100%"}` in `styles.grid`, a `36px 1fr` column collapses and labels
ellipsise to nothing. Symptom looks like "my labels are too long".

**`column_span: 2` makes a section's grid 24 columns, not 12.** Spans written for a
normal section come out half width. Use `columns: "full"` there.

**A `panel` view renders only its first card**, and Bubble Card pop-ups do not open
from one at all — tried as sibling cards, nested, and as stack children. The kitchen
panel falls back to `more-info` on its pills. A `sections` view caps each column near
500px, so it cannot span a wide screen; that is the trade.

**Fixed card height plus `grid-template-rows: auto auto` silently shrinks rows below
their content**, and children overlap. Give the card room or lay things side by side.

**button-card's `styles` cannot express a pseudo-class.** There is no `:active` or
`:hover` in it — `styles.card` is a flat list of declarations written as an *inline*
style on `#card`. For a press or hover state use `extra_styles`, a raw CSS string
injected into the card's own shadow root, and qualify every rule with `!important`
or the inline style wins. The useful ids inside that root are `#card`, `#container`,
`#img-cell`, `#icon`, `#name`, `#state`, `#label`. `tile_scene` uses this.

**A momentary entity cannot carry a visual state.** A `script.*` is `on` only while
it runs, which is milliseconds — a `[[[ ... ]]]` template keyed on `state === 'on'`
fires and clears before a frame is drawn, so the tint never appears and the template
looks broken when it is correct. Either key the colour on something durable
(`scene.*` keeps the timestamp it was last activated; `last_triggered` is readable
but only updates on a state change, so it latches on), or stop trying to show it as
state and give the tile a CSS press state instead. That is what scenes do here.

## Colour

Never hardcode a surface or text colour. Surfaces are
`var(--ha-card-background, var(--card-background-color))`, text is
`var(--primary-text-color)` / `var(--secondary-text-color)`, and every tint is
`design.mix(accent, pct)` which is `color-mix()` against the current surface. That is
the whole of dark-mode support — one definition, both themes. Verify by emulating
`prefers-color-scheme: dark` and checking a card background actually flips.

## Sizing

Taken from the owner's existing dashboard rather than invented: **56px rows with 36px
icon circles, two per row**. Media cards 124px. Measure the person's current
dashboard before choosing sizes; do not copy these numbers blindly if their screen or
taste differs.

## Do not regenerate over someone's edits

People rearrange dashboards in the HA UI. `./deploy.py --patch` reads the live config,
swaps only the cards it owns, and refuses to write if anything else moved. Plain
deploy replaces everything. Default to `--patch` for anything already in use, back up
first, and **check the backup contains what you would restore from** — the config
entries REST endpoint, for instance, returns no `options`, so a "backup" from it is
useless for restoring a group's members.

## The scene strip lives in `scenes.py`

It used to be copy-pasted into all four layout modules, each with its own
order and its own subset. Cameron reordered it in the UI and added two dims;
nothing propagated back, and every generator would have reverted him on the
next plain deploy. Four dashboards disagreeing with their own generators is
how that looks from the outside.

One ordered list, four layouts. Add or reorder a scene there and all four
follow.

**Every tile renders identically.** `toggle` in the list changes only the tap
action - a scene fires a script, guest mode flips a boolean - and nothing
about how the tile looks. There was briefly a `compact` flag and a two-row
variant for guest mode, on the reasoning that a mode gating the away
automations deserves to spell out On/Off. It was the wrong call and Cameron
pulled it up: `design.tile` only tints when the entity is on, so guest mode
sat grey in a row where every other tile wears its accent, at double width,
reading as a broken tile rather than a considered one. Its state is legible
from the accent fill exactly as every scene's is. Do not reintroduce a
per-tile rendering variant without a reason that survives looking at the row.

Accents must stay distinct *within a row*. Guest Mode is green because mauve
is Bedroom Dim's, and the two now sit two tiles apart on every dashboard.

The kitchen and bedroom screens (`roomscreen.py`) show only their own room's
scenes, two per row, so they never hit the width problem the old seven-across
kitchen strip had.
