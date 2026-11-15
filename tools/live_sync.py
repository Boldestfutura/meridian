#!/usr/bin/env python3
"""Keep this repo and the live Home Assistant in lock step.

    python3 tools/live_sync.py          check: print everything that differs, exit 1 if anything does
    python3 tools/live_sync.py pull     copy what was changed in HA into the repo, then check again

What it compares:
  - the dashboards edited in HA's own editor, saved here as dashboards/<url_path>.json (pulled)
  - the Kitchen Show (ha-show), built by show.py: compared only. Change show.py / showphone.py
    and ship it with ./deploy.py show
  - every automation and script in ha_config/ (*.json, scripts/, pip/), by id (pulled)
  - the helpers (ha_config/helpers.json) and the UI template helpers other than Pip's
    (ha_config/template_helpers.json) (pulled)
  - Pip's template helpers against ha_config/pip/templates.py: compared only
  - configuration.yaml against ha_config/configuration.yaml, webhook and config entry ids masked (pulled)
  - the themes (themes/ vs /config/themes/meridian) and tools/ha/*.py vs /config/scripts: compared only
  - the card files: the /local/overlook-show.js resource's ?v= against show.VERSION, and HACS's
    meridian.js against dist/meridian.js: compared only
A pulled file keeps its indentation and trailing newline, so the diff is only the real change.
"""
import glob, hashlib, json, os, re, subprocess, sys, tempfile, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import deploy, ha_ws  # noqa: E402

HOST = deploy.HOST
TOKEN = open(os.path.expanduser(deploy.TOKEN_FILE)).read().strip()
DASHBOARDS = ["ha-show-native", "ha-show-computer", "master-bedroom-echo-show", "ha-weather"]
SCRIPT_IDS = {"voice_weather_script.json": "voice_weather_forecast"}   # where the file name isn't the id
HELPER_DOMAINS = ["input_boolean", "input_select", "input_number", "input_datetime", "input_text",
                  "input_button", "timer", "counter", "schedule"]
CONF_HEADER = ("# Home Assistant's configuration.yaml, as live (LF here; HA's copy is CRLF).\n"
               "# The webhook and config entry ids are masked; tools/live_sync.py masks the live file the same way to compare.\n")


def mask(text):
    text = re.sub(r"(webhook_id: *)\S+", r'\1"<webhook id>"', text)
    return re.sub(r"(config_entry_id: *)\S+", r'\1"<config entry id>"', text)
SSH = ["-q", "-o", "BatchMode=yes", "-o", "UserKnownHostsFile=/tmp/claude-1000/ha_known",
       "-i", os.path.expanduser("~/.config/ha/vmkey")]


def rest(method, path, body=None):
    req = urllib.request.Request("http://%s:8123%s" % (HOST, path), method=method,
                                 data=json.dumps(body).encode() if body is not None else None,
                                 headers={"Authorization": "Bearer " + TOKEN, "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            t = r.read()
            return json.loads(t) if t else None
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        raise


def save(path, value):
    """Write JSON the way the file already is: same indent, same ASCII escaping, same final newline."""
    old = open(path).read() if os.path.exists(path) else "{\n  \"\n}\n"
    m = re.search(r'\n( +)"', old)
    text = json.dumps(value, indent=len(m.group(1)) if m else 2, ensure_ascii="\\u" in old)
    open(path, "w").write(text + ("\n" if old.endswith("\n") else ""))


def fetch(remote):
    with tempfile.NamedTemporaryFile(delete=False) as f:
        tmp = f.name
    subprocess.run(["scp", *SSH, "root@%s:%s" % (HOST, remote), tmp], check=True)
    data = open(tmp, "rb").read()
    os.unlink(tmp)
    return data


def run(pull):
    drift = []
    ws, ids = deploy.connect()

    for url in DASHBOARDS:
        path = os.path.join(ROOT, "dashboards", url + ".json")
        live = ha_ws.call(ws, next(ids), type="lovelace/config", url_path=url).get("result")
        mine = json.load(open(path)) if os.path.exists(path) else None
        if live != mine:
            if pull:
                os.makedirs(os.path.dirname(path), exist_ok=True)
                save(path, live)
                print("pulled   dashboards/%s.json" % url)
            else:
                drift.append("dashboard %s differs from dashboards/%s.json" % (url, url))

    live = ha_ws.call(ws, next(ids), type="lovelace/config", url_path="ha-show")["result"]
    n = len(list(deploy.diff(live, deploy.build("show"))))
    if n:
        drift.append("ha-show: %d values differ from show.py (put the live change in show.py/showphone.py)" % n)

    def pulled(rel, live, mine):
        path = os.path.join(ROOT, rel)
        if live == mine:
            return
        if pull:
            save(path, live)
            print("pulled   " + rel)
        else:
            drift.append("%s differs from HA" % rel)

    helpers = {}
    for d in HELPER_DOMAINS:
        r = ha_ws.call(ws, next(ids), type=d + "/list")
        if r.get("success") and r["result"]:
            helpers[d] = sorted(r["result"], key=lambda x: x["id"])
    pulled("ha_config/helpers.json", helpers, json.load(open(os.path.join(ROOT, "ha_config", "helpers.json"))))

    live_tm = {}
    for e in rest("GET", "/api/config/config_entries/entry?domain=template"):
        if e["title"].startswith("Pip "):
            continue
        flow = rest("POST", "/api/config/config_entries/options/flow", {"handler": e["entry_id"]})
        live_tm[e["title"]] = {f["name"]: (f.get("description") or {}).get("suggested_value") for f in flow.get("data_schema", [])
                               if (f.get("description") or {}).get("suggested_value") is not None}
        rest("DELETE", "/api/config/config_entries/options/flow/" + flow["flow_id"])     # read only: abort it
    pulled("ha_config/template_helpers.json", live_tm, json.load(open(os.path.join(ROOT, "ha_config", "template_helpers.json"))))

    conf = CONF_HEADER + mask(fetch("/config/configuration.yaml").decode().replace("\r\n", "\n"))
    cpath = os.path.join(ROOT, "ha_config", "configuration.yaml")
    if conf != open(cpath).read():
        if pull:
            open(cpath, "w").write(conf)
            print("pulled   ha_config/configuration.yaml")
        else:
            drift.append("ha_config/configuration.yaml differs from HA")

    for path in sorted(glob.glob(os.path.join(ROOT, "themes", "*.yaml"))):
        if fetch("/config/themes/meridian/" + os.path.basename(path)) != open(path, "rb").read():
            drift.append("themes/%s differs from HA's /config/themes/meridian" % os.path.basename(path))
    for path in sorted(glob.glob(os.path.join(ROOT, "tools", "ha", "*.py"))):
        if fetch("/config/scripts/" + os.path.basename(path)) != open(path, "rb").read():
            drift.append("tools/ha/%s differs from HA's /config/scripts (scp it over)" % os.path.basename(path))

    for path in sorted(glob.glob(os.path.join(ROOT, "ha_config", "*.json")) + glob.glob(os.path.join(ROOT, "ha_config", "scripts", "*.json"))
                       + glob.glob(os.path.join(ROOT, "ha_config", "pip", "*.json"))):
        if os.path.basename(path) in ("helpers.json", "template_helpers.json"):
            continue
        mine = json.load(open(path))
        name = os.path.relpath(path, ROOT)
        if "sequence" in mine and "triggers" not in mine and "trigger" not in mine:
            live = rest("GET", "/api/config/script/config/" + SCRIPT_IDS.get(os.path.basename(path), os.path.basename(path)[:-5]))
        else:
            live = rest("GET", "/api/config/automation/config/" + mine["id"])
        if live is None:
            drift.append("%s is not in HA" % name)
        elif live != mine:
            if pull:
                save(path, live)
                print("pulled   " + name)
            else:
                drift.append("%s differs from HA" % name)

    sys.path.insert(0, os.path.join(ROOT, "ha_config", "pip"))
    import templates
    entries = {e["title"]: e["entry_id"] for e in rest("GET", "/api/config/config_entries/entry?domain=template")}
    for title, (state, unit) in templates.SENSORS.items():
        if title not in entries:
            drift.append("template helper %r is not in HA" % title)
            continue
        flow = rest("POST", "/api/config/config_entries/options/flow", {"handler": entries[title]})
        seen = {f["name"]: (f.get("description") or {}).get("suggested_value") for f in flow.get("data_schema", [])}
        rest("DELETE", "/api/config/config_entries/options/flow/" + flow["flow_id"])    # read only: abort it
        if seen.get("state") != state or seen.get("unit_of_measurement") != unit:
            drift.append("template helper %r differs from ha_config/pip/templates.py" % title)

    import show
    res = [r["url"] for r in ha_ws.call(ws, next(ids), type="lovelace/resources")["result"] if "overlook-show.js" in r["url"]]
    if res != ["/local/overlook-show.js?v=" + show.VERSION]:
        drift.append("overlook-show.js resource is %s, show.py says %s (./deploy.py show)" % (res, show.VERSION))
    want = hashlib.sha256(open(os.path.join(ROOT, "dist", "meridian.js"), "rb").read()).hexdigest()
    have = hashlib.sha256(fetch("/config/www/community/meridian/meridian.js")).hexdigest()
    if want != have:
        drift.append("HACS meridian.js is not dist/meridian.js (update Meridian in HACS)")
    return drift


if __name__ == "__main__":
    pull = sys.argv[1:] == ["pull"]
    if pull:
        run(True)
    drift = run(False)
    for d in drift:
        print("DIFFERS  " + d)
    print("in lock step" if not drift else "%d differences" % len(drift))
    sys.exit(1 if drift else 0)
