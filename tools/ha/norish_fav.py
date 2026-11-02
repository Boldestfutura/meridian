#!/usr/bin/env python3
"""Heart or un-heart a Norish recipe from Home Assistant (shell_command.norish_favourite).

    norish_fav.py <recipe-id> <true|false>

Runs inside the HA container. Norish only takes favourite changes from a
signed-in session, so this signs in with /config/.norish.json
({"url", "origin", "email", "password"}, mode 600), toggles, then rewrites the
favourites in /config/www/norish/index.json so the kitchen screen's
Favourites row is right at once instead of after the next sync.
"""
import json, os, re, sys, urllib.request
from http.cookiejar import CookieJar

INDEX = "/config/www/norish/index.json"

rid, want = sys.argv[1], sys.argv[2].lower() in ("true", "1", "on", "yes")
if not re.fullmatch(r"[0-9a-f-]{36}", rid):
    sys.exit("not a recipe id")
conf = json.load(open("/config/.norish.json"))
base = conf["url"].rstrip("/")
# Norish only accepts sign-ins from its own address; HA reaches it over the tailnet,
# so the request names the LAN address it expects
origin = conf.get("origin", base)
op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(CookieJar()))
op.open(urllib.request.Request(base + "/api/auth/sign-in/email",
        data=json.dumps({"email": conf["email"], "password": conf["password"]}).encode(),
        headers={"content-type": "application/json", "origin": origin}), timeout=20)


def get(path):
    return json.load(op.open(base + "/api/trpc/" + path, timeout=20))["result"]["data"]["json"]


fav = get("favorites.list")
inp = {"recipeId": rid, "isFavorite": want}
if fav["favoriteVersions"].get(rid) is not None:
    inp["version"] = fav["favoriteVersions"][rid]
if (rid in fav["favoriteIds"]) != want:
    op.open(urllib.request.Request(base + "/api/trpc/favorites.toggle",
            data=json.dumps({"json": inp}).encode(),
            headers={"content-type": "application/json", "origin": origin}), timeout=20)
ids = get("favorites.list")["favoriteIds"]

if os.path.exists(INDEX):
    idx = json.load(open(INDEX))
    idx["favorites"] = ids
    tmp = INDEX + ".tmp"
    with open(tmp, "w") as f:
        json.dump(idx, f, separators=(",", ":"), ensure_ascii=False)
    os.replace(tmp, INDEX)
print("favourite" if rid in ids else "not favourite")
