#!/usr/bin/env python3
"""Fetch Plex's wide background and logo for what the Apple TV is playing (shell_command.plex_art).

    plex_art.py <base64 of media_title>

The title arrives base64-encoded so quotes and odd characters in it can't break the command line.
Infuse reports TV as "Show - S8 ∙ E2 - Episode", or "Show - E7 - Episode" for a one-season show;
anything else is looked up as a film.
Reads /config/.plex.json ({"url", "token"}, mode 600) and writes into /config/www/nowplaying:
<ratingKey>-bg.jpg, <ratingKey>-logo.png and index.json ({normalised name: {name, kind, bg, logo}}),
which the kitchen display's media card reads. A title already in the index is not fetched again.
"""
import base64, json, os, re, sys, urllib.parse, urllib.request

OUT = "/config/www/nowplaying"
INDEX = OUT + "/index.json"

title = base64.b64decode(sys.argv[1]).decode().strip()
if not title:
    sys.exit()
m = re.match(r"(.+?)\s+-\s+(?:S(\d+)\s*\W\s*)?E(\d+)\s+-\s+(.+)", title)
kind, name = ("show", m.group(1)) if m else ("movie", title)


def norm(s):
    return re.sub(r"[^a-z0-9]+", " ", s.lower()).strip()


os.makedirs(OUT, exist_ok=True)
idx = json.load(open(INDEX)) if os.path.exists(INDEX) else {}
if norm(name) in idx:
    print("cached", name); sys.exit()

conf = json.load(open("/config/.plex.json"))


def req(path, accept="application/json"):
    r = urllib.request.Request(conf["url"].rstrip("/") + path, headers={"X-Plex-Token": conf["token"], "Accept": accept})
    return urllib.request.urlopen(r, timeout=20)


hubs = json.load(req("/hubs/search?query=" + urllib.parse.quote(name) + "&limit=5"))["MediaContainer"].get("Hub", [])
cands = [x for h in hubs if h.get("type") == kind for x in h.get("Metadata", [])]
best = next((x for x in cands if norm(x["title"]) == norm(name)), None)
if not best:
    print("not in Plex:", name); sys.exit()
full = json.load(req("/library/metadata/%s" % best["ratingKey"]))["MediaContainer"]["Metadata"][0]
imgs = {i["type"]: i["url"] for i in full.get("Image", [])}
key, e = best["ratingKey"], {"name": best["title"], "kind": kind}
if "background" in imgs:      # sized for the tablet, not the 4K original
    q = urllib.parse.urlencode({"width": 1920, "height": 1080, "minSize": 1, "upscale": 0, "url": imgs["background"]})
    open("%s/%s-bg.jpg" % (OUT, key), "wb").write(req("/photo/:/transcode?" + q, "image/jpeg").read())
    e["bg"] = "/local/nowplaying/%s-bg.jpg" % key
if "clearLogo" in imgs:
    open("%s/%s-logo.png" % (OUT, key), "wb").write(req(imgs["clearLogo"], "image/png").read())
    e["logo"] = "/local/nowplaying/%s-logo.png" % key
idx[norm(best["title"])] = e
with open(INDEX + ".tmp", "w") as f:
    json.dump(idx, f, indent=1)
os.replace(INDEX + ".tmp", INDEX)
print(json.dumps(e))
