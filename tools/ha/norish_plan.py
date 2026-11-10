#!/usr/bin/env python3
"""Set a day's dinner in Norish's planner from Home Assistant (shell_command.norish_plan).

    norish_plan.py <YYYY-MM-DD> <recipe-id|clear>   set (or clear) that day's dinner
    norish_plan.py refresh                          only rewrite plan.json

Runs inside the HA container with the same sign-in as norish_fav.py (/config/.norish.json).
Afterwards it writes /config/www/norish/plan.json, {"YYYY-MM-DD": "<recipe-id>"} for last week
through three weeks ahead, which is what the kitchen tablet's planner row reads.
"""
import datetime, json, os, re, sys, urllib.parse, urllib.request
from http.cookiejar import CookieJar

PLAN = "/config/www/norish/plan.json"

args = sys.argv[1:]
if args == ["refresh"]:
    day = rid = None
elif len(args) == 2 and re.fullmatch(r"\d{4}-\d\d-\d\d", args[0]) \
        and (args[1] == "clear" or re.fullmatch(r"[0-9a-f-]{36}", args[1])):
    day, rid = args[0], (None if args[1] == "clear" else args[1])
else:
    sys.exit("usage: norish_plan.py <YYYY-MM-DD> <recipe-id|clear> | refresh")

conf = json.load(open("/config/.norish.json"))
base = conf["url"].rstrip("/")
origin = conf.get("origin", base)   # Norish only takes sign-ins naming its LAN address
op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(CookieJar()))
H = {"content-type": "application/json", "origin": origin}
op.open(urllib.request.Request(base + "/api/auth/sign-in/email",
        data=json.dumps({"email": conf["email"], "password": conf["password"]}).encode(), headers=H), timeout=20)


def query(path, inp):
    url = base + "/api/trpc/" + path + "?input=" + urllib.parse.quote(json.dumps({"json": inp}))
    return json.load(op.open(url, timeout=20))["result"]["data"]["json"]


def mutate(path, inp):
    op.open(urllib.request.Request(base + "/api/trpc/" + path, data=json.dumps({"json": inp}).encode(),
            headers=H), timeout=20)


if day:
    # one dinner per day: drop whatever is there, then add the new one
    for it in query("calendar.listItems", {"startISO": day, "endISO": day}):
        if it["date"] == day and it["slot"] == "Dinner":
            mutate("calendar.deleteItem", {"itemId": it["id"], "version": it["version"]})
    if rid:
        mutate("calendar.createItem", {"date": day, "slot": "Dinner", "itemType": "recipe", "recipeId": rid})

today = datetime.date.today()
start, end = today - datetime.timedelta(days=today.weekday() + 7), today + datetime.timedelta(days=21)
plan = {}
for it in query("calendar.listItems", {"startISO": start.isoformat(), "endISO": end.isoformat()}):
    if it["slot"] == "Dinner" and it.get("recipeId"):
        plan[it["date"]] = it["recipeId"]
os.makedirs(os.path.dirname(PLAN), exist_ok=True)
with open(PLAN + ".tmp", "w") as f:
    json.dump(plan, f, separators=(",", ":"))
os.replace(PLAN + ".tmp", PLAN)
print(json.dumps(plan))
