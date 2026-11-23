#!/usr/bin/env python3
"""List Echo Show 8 1st and 2nd gen units for sale at Cash Converters (Australia), as JSON.

    python3 /config/scripts/cashconverters_echo.py

For the "Echo Show 8 on Cash Converters" command_line sensor (configuration.yaml); an
automation sends a phone alert when a listing code appears that wasn't there last time.
Uses the site's own search API (/c3api/search/results, the one its search page calls; 24
results a page). A listing counts if its title says Show 8 and is not a later model or an
accessory:
  1st gen (2019) C7H6N3, 2nd gen (2021) A8H3N2; 3rd gen (2023) R85SD6 and the 2025 model
  MD6NE4 are left out. Store titles often skip the generation, so a Show 8 with neither a
  model number nor a generation is kept as "unknown" (it could be either; check the photos).
Prints {"count": n, "listings": [{code, title, gen, price, condition, store, postage, url}]}.
Standard library only, so it runs in HA's own Python.
"""
import json, re, sys, urllib.parse, urllib.request

SITE = "https://www.cashconverters.com.au"
QUERIES = ["echo show 8", "echo show", "amazon show 8"]
LATER = re.compile(r"r85sd6|md6ne4|3rd|4th|third|fourth|2023|2025", re.I)
FIRST = re.compile(r"c7h6n3|1st|first gen|2019", re.I)
SECOND = re.compile(r"a8h3n2|2nd|second gen|2021", re.I)
ACCESSORY = re.compile(r"\b(stand|mount|case|cover|cable|charger|adapter|adaptor|bracket|skin|protector)\b", re.I)
SHOW8 = re.compile(r"show\s*8\b", re.I)


def search(query):
    url = "%s/c3api/search/results?%s" % (SITE, urllib.parse.urlencode({"query": query, "NumberOfResults": 24}))
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (home-assistant listing check)"})
    with urllib.request.urlopen(req, timeout=25) as r:
        d = json.load(r)
    if not d.get("WasSuccessful"):
        raise SystemExit("search failed: %s" % d.get("Message"))
    return (d["Value"].get("ProductList") or {}).get("ProductListItems") or []


def gen(title):
    if FIRST.search(title):
        return "1st"
    if SECOND.search(title):
        return "2nd"
    return "unknown"


def main():
    seen = {}
    for q in QUERIES:
        for p in search(q):
            t = p.get("Title") or ""
            if not SHOW8.search(t) or LATER.search(t) or ACCESSORY.search(t) or p.get("Code") in seen:
                continue
            seen[p["Code"]] = {
                "code": p["Code"], "title": t, "gen": gen(t),
                "price": float(p.get("Sp") or p.get("Rrp") or 0),
                "condition": p.get("Condition"), "store": p.get("StoreNameWithState"),
                "postage": p.get("ShippingCost") if p.get("ShippingLabel") == "Postage" else None,
                "url": SITE + (p.get("Url") or ""),
            }
    listings = sorted(seen.values(), key=lambda x: x["price"])
    json.dump({"count": len(listings), "listings": listings}, sys.stdout)
    print()


if __name__ == "__main__":
    main()
