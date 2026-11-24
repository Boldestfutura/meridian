#!/usr/bin/env python3
"""Print one game's PlayStation play time as JSON, for a command_line sensor.

    python3 /config/scripts/psn_playtime.py "Grand Theft Auto VI"

Reads the NPSSO cookie the PlayStation Network integration already stores in
/config/.storage/core.config_entries (so a re-auth there fixes this too), swaps it for an
access token, and looks the title up in Sony's played-games list (/gamelist/v2), which is
where the console's own "time played" comes from. Sony updates it after a session ends,
not live. Prints {"hours": 12.5, "last_played": "...", "title": "...", "image": url,
"trophies": {"progress": 10, "earned": {...}, "defined": {...}}}; hours is 0 if the game
hasn't been played, trophies null if Sony's trophy list can't be read. Standard library
only, so it runs in HA's own Python.
"""
import base64, json, re, sys, urllib.parse, urllib.request

ENTRIES = "/config/.storage/core.config_entries"
AUTH = "https://ca.account.sony.com/api/authz/v3/oauth"
# the PlayStation app's public client, as used by every PSN library
CLIENT_ID = "09515159-7237-4370-9b40-3806e67c0891"
CLIENT_SECRET = "ucPjka5tntB2KqsP"
REDIRECT = "com.scee.psxandroid.scecompcall://redirect"


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k):
        return None


def npsso(path=ENTRIES):
    for e in json.load(open(path))["data"]["entries"]:
        if e["domain"] == "playstation_network":
            return e["data"]["npsso"]
    raise SystemExit("no PlayStation Network config entry")


def token(cookie):
    q = urllib.parse.urlencode({"access_type": "offline", "client_id": CLIENT_ID, "redirect_uri": REDIRECT,
                                "response_type": "code", "scope": "psn:mobile.v2.core psn:clientapp"})
    req = urllib.request.Request("%s/authorize?%s" % (AUTH, q), headers={"Cookie": "npsso=" + cookie})
    try:
        urllib.request.build_opener(NoRedirect).open(req, timeout=20)
        raise SystemExit("PSN sign-in did not redirect (NPSSO expired?)")
    except urllib.error.HTTPError as e:
        loc = e.headers.get("Location", "")
    code = urllib.parse.parse_qs(urllib.parse.urlparse(loc).query).get("code")
    if not code:
        raise SystemExit("PSN sign-in gave no code (NPSSO expired?)")
    body = urllib.parse.urlencode({"code": code[0], "redirect_uri": REDIRECT, "grant_type": "authorization_code",
                                   "token_format": "jwt"}).encode()
    basic = base64.b64encode(("%s:%s" % (CLIENT_ID, CLIENT_SECRET)).encode()).decode()
    req = urllib.request.Request(AUTH + "/token", data=body, headers={
        "Authorization": "Basic " + basic, "Content-Type": "application/x-www-form-urlencoded"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.load(r)["access_token"]


def hours(iso):
    # Sony writes durations like PT12H34M56S
    m = re.fullmatch(r"P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", iso or "")
    if not m:
        return 0.0
    d, h, mi, s = (int(x or 0) for x in m.groups())
    return round(d * 24 + h + mi / 60 + s / 3600, 3)


def main():
    want = re.sub(r"[^a-z0-9]", "", (sys.argv[1] if len(sys.argv) > 1 else "Grand Theft Auto VI").lower())
    tok = token(npsso())
    found = None
    for offset in range(0, 1000, 200):
        url = ("https://m.np.playstation.com/api/gamelist/v2/users/me/titles"
               "?categories=ps4_game,ps5_native_game&limit=200&offset=%d" % offset)
        with urllib.request.urlopen(urllib.request.Request(url, headers={"Authorization": "Bearer " + tok}),
                                    timeout=20) as r:
            page = json.load(r)
        for t in page.get("titles", []):
            name = re.sub(r"[^a-z0-9]", "", (t.get("name") or "").lower())
            if want in name and (not found or hours(t.get("playDuration")) > hours(found.get("playDuration"))):
                found = t
        if not page.get("nextOffset"):
            break
    print(json.dumps({"hours": hours(found.get("playDuration")) if found else 0,
                      "last_played": (found or {}).get("lastPlayedDateTime"),
                      "title": (found or {}).get("name"),
                      "image": (found or {}).get("imageUrl"),
                      "trophies": trophies(tok, want)}))


def trophies(tok, want):
    # the game's own trophy list: earned and defined per grade, and Sony's progress percentage
    try:
        url = "https://m.np.playstation.com/api/trophy/v1/users/me/trophyTitles?limit=800"
        with urllib.request.urlopen(urllib.request.Request(url, headers={"Authorization": "Bearer " + tok}),
                                    timeout=20) as r:
            titles = json.load(r).get("trophyTitles", [])
    except Exception:
        return None
    for t in titles:
        if want in re.sub(r"[^a-z0-9]", "", (t.get("trophyTitleName") or "").lower()):
            return {"progress": t.get("progress"), "earned": t.get("earnedTrophies"),
                    "defined": t.get("definedTrophies")}
    return None


if __name__ == "__main__":
    main()
