#!/usr/bin/env python3
"""Copy Norish's recipes onto Home Assistant for the ha-show Recipes page.

Norish serves recipe photos only to a signed-in browser, and the tablet isn't
signed in, so the dashboard can't load them from Norish directly. This signs
in, builds a small static copy and puts it in HA's /config/www/norish, which
the dashboard reads as /local/norish/...

    index.json      favourites, recently added, cookbooks, and a name/photo per recipe
    r/<id>.json     one recipe: ingredients and steps (metric), times, servings
    img/<id>.jpg    the cover photo, 480px wide

Runs from a systemd user timer on the desktop, where the Norish login already
lives (~/.config/norish/{user,password}). Only changed files are sent.

    tools/norish_sync.py            sync now
    tools/norish_sync.py --no-push  build locally only
"""
import hashlib, io, json, os, subprocess, sys, tarfile, urllib.parse, urllib.request
from http.cookiejar import CookieJar

NORISH = os.environ.get("NORISH_URL", "http://192.168.1.243:30900")
HA = os.environ.get("HA_HOST", "192.168.1.117")
CONF = os.path.expanduser("~/.config/norish")
OUT = os.path.expanduser("~/.cache/norish-sync/out")
SENT = os.path.expanduser("~/.cache/norish-sync/sent.json")
RECENT = 15
FORMAT = 2        # bump when detail() or thumb() output changes
THUMB_W = 480


class Norish:
    def __init__(self):
        self.op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(CookieJar()))
        creds = {"email": open(CONF + "/user").read().strip(),
                 "password": open(CONF + "/password").read().strip()}
        self.op.open(urllib.request.Request(
            NORISH + "/api/auth/sign-in/email", data=json.dumps(creds).encode(),
            headers={"content-type": "application/json", "origin": NORISH}), timeout=30)

    def q(self, path, inp=None):
        url = NORISH + "/api/trpc/" + path
        if inp is not None:
            url += "?input=" + urllib.parse.quote(json.dumps({"json": inp}))
        return json.load(self.op.open(url, timeout=60))["result"]["data"]["json"]

    def raw(self, path):
        return self.op.open(NORISH + path, timeout=60).read()

    def paged(self, path, inp, key):
        out, cursor = [], None
        while True:
            page = self.q(path, dict(inp, **({"cursor": cursor} if cursor is not None else {})))
            out += page[key]
            cursor = page.get("nextCursor")
            if cursor is None or not page[key]:
                return out


def metric(rows):
    """Norish keeps metric and US versions of each line; this house is metric."""
    m = [r for r in rows if r.get("systemUsed") == "metric"]
    return sorted(m or rows, key=lambda r: r.get("order", 0))


UNITS = {"gram": "g", "grams": "g", "kilogram": "kg", "kilograms": "kg", "milliliter": "ml",
         "millilitre": "ml", "milliliters": "ml", "millilitres": "ml", "liter": "L", "litre": "L",
         "liters": "L", "litres": "L", "teaspoon": "tsp", "teaspoons": "tsp", "tablespoon": "tbsp",
         "tablespoons": "tbsp", "centimeter": "cm", "centimetre": "cm"}


def amount(x):
    if x is None:
        return ""
    return ("%g" % x) if x != int(x) else str(int(x))


def detail(d):
    ings = []
    for i in metric(d.get("recipeIngredients") or []):
        line = " ".join(p for p in (amount(i.get("amount")), UNITS.get(i.get("unit") or "", i.get("unit") or ""),
                                       i.get("ingredientName") or "") if p)
        ings.append(line)
    return {
        "id": d["id"], "name": d["name"], "description": d.get("description") or "",
        "servings": d.get("servings"), "prep": d.get("prepMinutes"), "cook": d.get("cookMinutes"),
        "total": d.get("totalMinutes"), "url": d.get("url"),
        "ingredients": ings,
        "steps": [s["step"] for s in metric(d.get("steps") or [])],
    }


def thumb(data):
    from PIL import Image
    im = Image.open(io.BytesIO(data)).convert("RGB")
    if im.width > THUMB_W:
        im = im.resize((THUMB_W, round(im.height * THUMB_W / im.width)), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=78, optimize=True, progressive=True)
    return buf.getvalue()


def write(rel, data):
    path = os.path.join(OUT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if isinstance(data, (dict, list)):
        data = json.dumps(data, separators=(",", ":"), ensure_ascii=False).encode()
    old = open(path, "rb").read() if os.path.exists(path) else None
    if old != data:
        open(path + ".tmp", "wb").write(data)
        os.replace(path + ".tmp", path)


def build():
    n = Norish()
    recipes = n.paged("recipes.list", {"limit": 100, "sortMode": "dateDesc"}, "recipes")
    fav = n.q("favorites.list")["favoriteIds"]
    books = n.paged("cookbooks.list", {"limit": 50}, "cookbooks")
    versions = {}
    vfile = os.path.join(OUT, "versions.json")
    if os.path.exists(vfile):
        versions = json.load(open(vfile))

    index = {"recipes": {}, "favorites": fav, "recent": [r["id"] for r in recipes[:RECENT]], "cookbooks": []}
    for r in recipes:
        mins = r.get("totalMinutes") or ((r.get("prepMinutes") or 0) + (r.get("cookMinutes") or 0)) or None
        # "v" busts the browser cache when a recipe or this script's output changes
        index["recipes"][r["id"]] = {"n": r["name"], "t": mins, "img": bool(r.get("image")),
                                     "v": "%s.%s" % (r.get("version"), FORMAT)}
        key = "%s:%s" % (r["id"], r.get("version"))
        if versions.get(r["id"]) == key and os.path.exists(os.path.join(OUT, "r", r["id"] + ".json")):
            continue
        write("r/%s.json" % r["id"], detail(n.q("recipes.get", {"id": r["id"]})))
        if r.get("image"):
            try:
                write("img/%s.jpg" % r["id"], thumb(n.raw(r["image"])))
            except Exception as e:
                print("photo failed for %s: %s" % (r["name"], e), file=sys.stderr)
                index["recipes"][r["id"]]["img"] = False
        versions[r["id"]] = key

    for b in books:
        members = [x["id"] for x in n.paged("cookbooks.recipes", {"cookbookId": b["id"], "limit": 100}, "recipes")]
        index["cookbooks"].append({"id": b["id"], "title": b["title"], "members": members})

    write("index.json", index)
    write("versions.json", versions)
    return index


def push():
    """Send files that changed since the last push, as one tar over ssh."""
    sent = json.load(open(SENT)) if os.path.exists(SENT) else {}
    now, changed = {}, []
    for root, _, files in os.walk(OUT):
        for f in files:
            if f == "versions.json" or f.endswith(".tmp"):
                continue
            rel = os.path.relpath(os.path.join(root, f), OUT)
            h = hashlib.sha1(open(os.path.join(root, f), "rb").read()).hexdigest()
            now[rel] = h
            if sent.get(rel) != h:
                changed.append(rel)
    # index.json last, so the page never points at a photo that isn't there yet
    changed.sort(key=lambda r: r == "index.json")
    if changed:
        buf = io.BytesIO()
        with tarfile.open(fileobj=buf, mode="w") as t:
            for rel in changed:
                t.add(os.path.join(OUT, rel), arcname=rel)
        subprocess.run(["ssh", "-o", "BatchMode=yes", "-o", "UserKnownHostsFile=/tmp/claude-1000/ha_known",
                        "-o", "StrictHostKeyChecking=accept-new",
                        "-i", os.path.expanduser("~/.config/ha/vmkey"), "root@" + HA,
                        "mkdir -p /config/www/norish && tar xf - -C /config/www/norish"],
                       input=buf.getvalue(), check=True)
    json.dump(now, open(SENT, "w"))
    return len(changed)


if __name__ == "__main__":
    idx = build()
    print("%d recipes, %d favourites, %d cookbooks" % (len(idx["recipes"]), len(idx["favorites"]), len(idx["cookbooks"])))
    if "--no-push" not in sys.argv:
        print("sent %d changed files" % push())
