#!/usr/bin/env python3
"""Draw the Show card's weather icons into www/weather/<condition>.svg.

    python3 tools/weather_icons.py

The style copies a reference Cameron picked (a 512px "sun, clouds and rain" icon): clouds are a
few big overlapping puffs on a flat bottom. Puffs in front are pale and only turn blue near
their lower right edge; whatever sits behind them (the base, a back puff) is a deeper blue, and
that contrast is what draws the line between puffs. The sun is a warm radial ball with flat
yellow rounded rays, rain is flat blue slanted pills. Shapes and colours were measured off the
reference and scaled from 512 to 64 units.

Each file carries its own <defs>, so the card shows it with a plain <img>.
The conditions are Home Assistant's weather states.
"""
import math, os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "www", "weather")

# cloud palettes: front = a puff facing us (radial, light top left), back/deep = what sits behind
# a puff (deeper toward the right), body = the small cloud's base (left to right)
TINTS = {
    "cl": dict(front=["#eaf6ff", "#e8f5ff", "#e0f1fe", "#d2eafd", "#b6d8f8"],
               back=["#d6ebfe", "#c2e1fd"], deep=["#cbe6fe", "#b0d8fd"], body=["#e6f4fe", "#aed7fd"]),
    "rcl": dict(front=["#eef2f7", "#e8edf4", "#dde4ee", "#ccd6e4", "#b1c0d4"],
                back=["#d3dce8", "#b4c3d7"], deep=["#c8d3e2", "#a8b9d0"], body=["#e5ebf2", "#a9bad0"]),
    "scl": dict(front=["#e1e6ee", "#d9dfe9", "#cbd3e0", "#b7c2d4", "#97a7c0"],
                back=["#bcc6d6", "#8f9fb9"], deep=["#b0bbce", "#8696b2"], body=["#d2d9e4", "#8b9bb6"]),
}


def tint_defs(t):
    p = TINTS[t]
    lin = lambda name, a, b: ('<linearGradient id="%s-%s" x1="0" y1="0" x2="1" y2=".35">'
                              '<stop offset="0" stop-color="%s"/><stop offset="1" stop-color="%s"/></linearGradient>') % (t, name, a, b)
    return ('<radialGradient id="%s-front" cx=".28" cy=".22" r=".95">'
            '<stop offset="0" stop-color="%s"/><stop offset=".35" stop-color="%s"/><stop offset=".6" stop-color="%s"/>'
            '<stop offset=".8" stop-color="%s"/><stop offset="1" stop-color="%s"/></radialGradient>' % (t, *p["front"])
            + lin("back", *p["back"]) + lin("deep", *p["deep"]) + lin("body", *p["body"]))


SUN = ('<radialGradient id="sun" cx=".22" cy=".2" r="1.05"><stop offset="0" stop-color="#fdeca8"/>'
       '<stop offset=".35" stop-color="#fde48a"/><stop offset=".55" stop-color="#fdd965"/>'
       '<stop offset=".75" stop-color="#fcc443"/><stop offset=".9" stop-color="#fda535"/><stop offset="1" stop-color="#fb982c"/></radialGradient>')
OTHER = {
    "ray": '<linearGradient id="ray" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fde47e"/><stop offset="1" stop-color="#fbd75a"/></linearGradient>',
    "drop": '<linearGradient id="drop" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2aa2ff"/><stop offset="1" stop-color="#168ef8"/></linearGradient>',
    "bolt": '<linearGradient id="bolt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fde47e"/><stop offset="1" stop-color="#fcc443"/></linearGradient>',
    "ice": '<radialGradient id="ice" cx=".3" cy=".3" r=".9"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#b4d6f6"/></radialGradient>',
    "warn": '<linearGradient id="warn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdd965"/><stop offset="1" stop-color="#fda535"/></linearGradient>',
    "wind": '<linearGradient id="wind" x1="6" y1="0" x2="58" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#cfe8fc"/><stop offset="1" stop-color="#2aa2ff"/></linearGradient>',
}


def defs(used):
    out = [SUN]
    for k in used:
        out.append(tint_defs(k) if k in TINTS else OTHER[k])
    return "<defs>%s</defs>" % "".join(out)


def _c(x, y, r, fill):
    return '<circle cx="%g" cy="%g" r="%g" fill="url(#%s)"/>' % (x, y, r, fill)


def big_cloud(t="cl", tx=0, ty=0, s=1.0):
    """The reference's main cloud, 49 x 34 units: base and right puff behind, then the big top
    puff, then the left puff in front. Flat bottom at y 52.75."""
    body = ('<rect x="10.9" y="42" width="29.9" height="10.75" fill="url(#%s-back)"/>' % t
            + _c(40.75, 44.13, 8.62, t + "-deep")
            + _c(26.19, 31.88, 12.56, t + "-front")
            + _c(10.88, 41.88, 10.87, t + "-front"))
    return '<g transform="translate(%g %g) scale(%g)">%s</g>' % (tx, ty, s, body)


def small_cloud(t="cl", tx=0, ty=0, s=1.0):
    """The reference's small front cloud, 31 x 30 units, x 32.9-63, flat bottom at y 61.25:
    a long rounded base, the tall puff, then a low puff at the front left."""
    body = ('<rect x="32.9" y="51" width="30.1" height="10.25" rx="5.1" fill="url(#%s-body)"/>' % t
            + _c(49.4, 48.5, 8, t + "-front")
            + _c(39.6, 54.6, 6.8, t + "-front"))
    return '<g transform="translate(%g %g) scale(%g)">%s</g>' % (tx, ty, s, body)


def sun(cx, cy, r, ray_in, ray_len, ray_w, angles):
    rays = "".join(
        '<rect x="%.2f" y="%.2f" width="%.2f" height="%.2f" rx="%.2f" fill="url(#ray)" transform="rotate(%d %g %g)"/>'
        % (cx - ray_w / 2, cy - ray_in - ray_len, ray_w, ray_len, ray_w / 2, a, cx, cy) for a in angles)
    return rays + '<circle cx="%g" cy="%g" r="%g" fill="url(#sun)"/>' % (cx, cy, r)


def dash(x, y, l=7.4, w=3.4):
    """A rain stroke as in the reference: a flat blue pill leaning right at 45 degrees."""
    return '<rect x="%.2f" y="%.2f" width="%g" height="%g" rx="%g" fill="url(#drop)" transform="rotate(45 %g %g)"/>' % (
        x - w / 2, y - l / 2, w, l, w / 2, x, y)


def flake(cx, cy, r=3.6):
    arms = "".join('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f"/>' % (
        cx + r * math.cos(a), cy + r * math.sin(a), cx - r * math.cos(a), cy - r * math.sin(a))
        for a in (math.pi / 2, math.pi / 2 + math.pi / 3, math.pi / 2 - math.pi / 3))
    return '<g stroke="#2aa2ff" stroke-width="2.3" stroke-linecap="round">%s</g>' % arms


def ball(cx, cy, r=3.2):
    return '<circle cx="%g" cy="%g" r="%g" fill="url(#ice)"/>' % (cx, cy, r)


def star(x, y, r):
    return '<path fill="#fde47e" d="M{x} {a}Q{x} {y} {b} {y}Q{x} {y} {x} {c}Q{x} {y} {d} {y}Q{x} {y} {x} {a}Z"/>'.format(
        x=x, y=y, a=y - r, b=x + r, c=y + r, d=x - r)


BOLT = '<path fill="url(#bolt)" stroke="url(#bolt)" stroke-width="1.2" stroke-linejoin="round" d="M33 40 L26 51 H31.5 L28.5 61 L39 47.5 H33.5 L37 40Z"/>'
MOON = '<path fill="url(#sun)" d="M36 9A23 23 0 1 0 55 44A18 18 0 0 1 36 9Z"/>'
WINDS = ('<g fill="none" stroke="url(#wind)" stroke-width="4" stroke-linecap="round"%s>'
         '<path d="M8 26H38a7 7 0 1 0-7-7"/><path d="M8 37H48a7.5 7.5 0 1 1-7.5 7.5"/><path d="M8 48H28"/></g>')
FOG = ('<g stroke="#bcdffe" stroke-width="3.6" stroke-linecap="round">'
       '<line x1="10" y1="50" x2="50" y2="50"/><line x1="17" y1="57" x2="44" y2="57"/></g>')

# the main cloud on its own, centred, lifted to leave room for what falls from it
LIFT = dict(tx=7.5, ty=-9)
REF_SUN = sun(42.5, 24.4, 13.1, 15.6, 5.75, 3, (-45, 0, 45, 90, 135))   # where the reference puts it; 0 = straight up

ICONS = {
    "sunny": (["ray"], sun(32, 32, 15, 18.5, 6.5, 3.4, range(0, 360, 45))),
    "clear-night": ([], MOON + star(51, 12, 5) + star(57, 25, 3)),
    "partlycloudy": (["ray", "cl"], REF_SUN + big_cloud("cl", 0, 2) + small_cloud("cl", 0, 0)),
    "cloudy": (["cl"], big_cloud("cl", 0, -4) + small_cloud("cl", 0, -4)),
    "fog": (["cl"], big_cloud("cl", **LIFT) + FOG),
    "rainy": (["rcl", "drop"], big_cloud("rcl", **LIFT) + dash(20, 53) + dash(30.5, 53) + dash(41, 53)),
    "pouring": (["rcl", "drop"], big_cloud("rcl", **LIFT) + "".join(dash(x, y) for x, y in
                ((17, 50), (27.5, 50), (38, 50), (48.5, 50), (22, 59), (32.5, 59), (43, 59)))),
    "lightning": (["scl", "bolt"], big_cloud("scl", **LIFT) + BOLT),
    "lightning-rainy": (["scl", "bolt", "drop"], big_cloud("scl", **LIFT) + BOLT + dash(19, 53) + dash(45, 53)),
    "windy": (["wind"], WINDS % ""),
    "windy-variant": (["cl", "wind"], small_cloud("cl", -4, -36) + WINDS % ' transform="translate(0 9)"'),
    "snowy": (["rcl"], big_cloud("rcl", **LIFT) + flake(20, 51) + flake(31, 57) + flake(42, 51)),
    "snowy-rainy": (["rcl", "drop"], big_cloud("rcl", **LIFT) + flake(23, 53) + dash(39, 53)),
    "hail": (["rcl", "ice"], big_cloud("rcl", **LIFT) + ball(20, 50) + ball(31, 57) + ball(42, 50)),
    "exceptional": (["warn"], '<path fill="url(#warn)" stroke="url(#warn)" stroke-width="5" stroke-linejoin="round" d="M32 10 55 50H9Z"/>'
                    '<rect x="29.6" y="22" width="4.8" height="15" rx="2.4" fill="#fff"/><circle cx="32" cy="43.5" r="2.8" fill="#fff"/>'),
}


def build():
    os.makedirs(OUT, exist_ok=True)
    for name, (used, body) in ICONS.items():
        svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">%s%s</svg>\n' % (defs(used), body)
        open(os.path.join(OUT, name + ".svg"), "w").write(svg)
    return sorted(ICONS)


if __name__ == "__main__":
    print(" ".join(build()))
