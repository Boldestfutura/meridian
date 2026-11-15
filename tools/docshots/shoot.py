"""Take the README screenshots from the live dashboards, with a made-up house in them.

    HA_HOST=192.168.1.117 python3 tools/docshots/shoot.py [name ...]

Headless Firefox opens each dashboard signed in with the long-lived token in
~/.config/ha/token. Before HA's frontend loads, scrub.js swaps people's names, what's
playing, photos, calendars, the shopping list, playlists and the Norish library for made-up
ones; the recipes and their pictures come from a small server here. Nothing in HA changes.
Pass names (kitchen, echo, computer, phone) to take only those. Writes docs/images/.
"""
import base64, colorsys, math, shutil, http.server, itertools, json, os, random, subprocess, sys, tempfile, threading, time, datetime, urllib.request
from io import BytesIO

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
import cdp  # noqa: E402

HA = "http://%s:8123" % os.environ.get("HA_HOST", "homeassistant.local")
TOKEN = open(os.path.expanduser(os.environ.get("HA_TOKEN_FILE", "~/.config/ha/token"))).read().strip()
OUT = os.environ.get("OUT") or os.path.join(os.path.dirname(os.path.dirname(HERE)), "docs", "images")
DEMO = None  # the demo server's address, set once it is listening

# ---- a made-up recipe library, served the way tools/norish_sync.py lays it out ----------------
DISHES = [("Lemon Herb Roast Chicken", 75), ("Miso Glazed Salmon", 25), ("Mushroom Ragu Pappardelle", 45),
          ("Crispy Chickpea Salad", 20), ("Slow Cooked Beef Chilli", 180), ("Green Curry with Greens", 35),
          ("Sticky Pork Bao", 60), ("Roast Pumpkin Risotto", 50), ("Lamb Kofta Wraps", 30), ("Prawn Fried Rice", 20),
          ("Spinach and Ricotta Cannelloni", 70), ("Chicken Satay Skewers", 40), ("Smoky Bean Tacos", 25),
          ("Baked Eggs in Tomato", 30), ("Garlic Butter Gnocchi", 25), ("Banana Bread", 70)]


def hsl(h, s, l):
    r, g, b = colorsys.hls_to_rgb(h / 360, l, s)
    return "#%02x%02x%02x" % (int(r * 255), int(g * 255), int(b * 255))


CLOTHS = ["#e8e2d6", "#d3dbe2", "#d8dfcd", "#ecdcd4", "#e3dcec"]
BASES = ["#efe3c2", "#c8553d", "#e0a458", "#8fae5d", "#9a6440", "#f2c46d"]      # rice, tomato, curry, greens, stew, pasta
PIECES = ["#4f8a3c", "#6aa84f", "#a0522d", "#c97c4a", "#e4572e", "#f3c13a", "#f7efe0"]


def plate(seed):
    """A top-down plate of food, drawn: a striped cloth, a plate, a base and pieces on it."""
    rnd = random.Random(seed)
    cloth = rnd.choice(CLOTHS)
    out = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">', '<rect width="800" height="600" fill="%s"/>' % cloth,
           '<g opacity=".35" fill="#ffffff">']
    out += ['<rect x="%d" y="0" width="22" height="600"/>' % x for x in range(40, 800, 110)]
    out += ['</g><circle cx="408" cy="312" r="250" fill="#000" opacity=".08"/>',
            '<circle cx="400" cy="300" r="250" fill="#f6f3ec"/><circle cx="400" cy="300" r="212" fill="#fdfcf8"/>',
            '<circle cx="400" cy="300" r="170" fill="%s"/>' % rnd.choice(BASES)]
    for _ in range(14):
        a, d = rnd.uniform(0, 6.283), rnd.uniform(0, 120)
        x, y = 400 + d * math.cos(a), 300 + d * math.sin(a)
        out.append('<ellipse cx="%d" cy="%d" rx="%d" ry="%d" transform="rotate(%d %d %d)" fill="%s"/>'
                   % (x, y, rnd.randint(22, 42), rnd.randint(14, 24), rnd.randint(0, 180), x, y, rnd.choice(PIECES[2:6])))
    for _ in range(30):
        a, d = rnd.uniform(0, 6.283), rnd.uniform(0, 150)
        x, y = 400 + d * math.cos(a), 300 + d * math.sin(a)
        out.append('<ellipse cx="%d" cy="%d" rx="%d" ry="%d" transform="rotate(%d %d %d)" fill="%s"/>'
                   % (x, y, rnd.randint(5, 10), rnd.randint(3, 5), rnd.randint(0, 180), x, y, rnd.choice(PIECES[:2])))
    out.append('</svg>')
    return "".join(out).encode()


def library():
    ids = ["demo-%02d" % i for i in range(len(DISHES))]
    files = {}
    recipes = {}
    for rid, (name, mins) in zip(ids, DISHES):
        recipes[rid] = {"n": name, "t": mins, "img": True, "v": "1"}
        files["r/%s.json" % rid] = json.dumps({
            "id": rid, "name": name, "description": "A made-up recipe for the screenshots.", "servings": 4,
            "prep": 15, "cook": mins - 15, "total": mins, "url": None,
            "ingredients": ["500 g of the main thing", "2 tbsp olive oil", "1 onion", "2 cloves garlic", "Salt and pepper"],
            "steps": ["Get everything ready.", "Cook it until it's done.", "Season, then serve."]}).encode()
        files["img/%s.jpg" % rid] = plate(rid)
    files["index.json"] = json.dumps({
        "recipes": recipes, "favorites": ids[0:12:2], "recent": ids[1:13:2],
        "cookbooks": [{"id": "demo-weeknight", "title": "Weeknight", "members": ids[:8]},
                      {"id": "demo-baking", "title": "Baking", "members": ids[-1:]}]}).encode()
    today = datetime.date.today()
    monday = today - datetime.timedelta(days=today.weekday())
    plan = {str(monday): ids[3], str(today): ids[1], str(today + datetime.timedelta(days=2)): ids[2]}
    files["plan.json"] = json.dumps(plan).encode()
    return files


FILES = library()


class Demo(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        path = self.path.split("?")[0].lstrip("/")
        body = FILES.get(path[len("norish/"):]) if path.startswith("norish/") else None
        self.send_response(200 if body else 404)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Type", "image/svg+xml" if path.endswith(".jpg") else "application/json")
        self.end_headers()
        self.wfile.write(body or b"{}")

    def log_message(self, *a):
        pass


def plain(v):
    """A BiDi remote value as a Python value (arrays and numbers are all the shots need)."""
    if v.get("type") == "array":
        return [plain(x) for x in v.get("value", [])]
    return v.get("value")


# ---- headless Firefox over WebDriver BiDi --------------------------------------------------
class Firefox:
    def __init__(self, w, h, dark, scale, port):
        self.prof = tempfile.mkdtemp(prefix="docshots-")
        with open(self.prof + "/user.js", "w") as f:
            f.write('user_pref("layout.css.prefers-color-scheme.content-override", %d);\n' % (0 if dark else 1))
            f.write('user_pref("layout.css.devPixelsPerPx", "%s");\n' % scale)
        self.p = subprocess.Popen(["firefox", "--headless", "--no-remote", "--profile", self.prof,
                                   "--remote-debugging-port", str(port), "--window-size=%d,%d" % (w, h)],
                                  stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        for _ in range(60):
            try:
                b = cdp.Browser.__new__(cdp.Browser)
                b.ws_url = "ws://127.0.0.1:%d/session" % port
                b.ids = itertools.count(1)
                b._connect()
                break
            except Exception:
                time.sleep(0.5)
        self.b = b
        self.cmd("session.new", capabilities={})
        self.ctx = self.cmd("browsingContext.getTree")["contexts"][0]["context"]
        self.cmd("browsingContext.setViewport", context=self.ctx, viewport={"width": w, "height": h})

    def cmd(self, method, **params):
        mid = next(self.b.ids)
        self.b._send({"id": mid, "method": method, "params": params})
        while True:
            m = self.b._recv()
            if m.get("id") == mid:
                if m.get("type") == "error":
                    raise RuntimeError("%s: %s %s" % (method, m.get("error"), m.get("message")))
                return m.get("result", {})

    def go(self, url, wait=2.5):
        self.cmd("browsingContext.navigate", context=self.ctx, url=url, wait="none")
        time.sleep(wait)

    def js(self, expr):
        r = self.cmd("script.evaluate", expression=expr, target={"context": self.ctx}, awaitPromise=True, userActivation=True)
        if r.get("type") == "exception":
            raise RuntimeError(json.dumps(r.get("exceptionDetails"))[:400])
        return plain(r.get("result", {}))

    def shot(self, path, clip=None):
        png = base64.b64decode(self.cmd("browsingContext.captureScreenshot", context=self.ctx)["data"])
        if clip:
            from PIL import Image
            im = Image.open(BytesIO(png))
            k = im.width / self.js("innerWidth")
            im.crop(tuple(int(v * k) for v in clip)).save(path)
        else:
            open(path, "wb").write(png)
        print("  ", os.path.relpath(path), flush=True)

    def close(self):
        try:
            self.cmd("session.end")
        except Exception:
            pass
        self.p.terminate()
        self.p.wait()
        shutil.rmtree(self.prof, ignore_errors=True)


SCRUB = open(os.path.join(HERE, "scrub.js")).read()
# finds elements through shadow roots
DEEP = """window.__deep = (pred) => { const out = []; const walk = (r) => { for (const e of r.querySelectorAll('*')) {
  if (pred(e)) out.push(e); if (e.shadowRoot) walk(e.shadowRoot); } }; walk(document); return out; };
window.__tag = (t) => __deep((e) => e.tagName.toLowerCase() === t);"""
# the dashboard view, below HA's toolbar and right of its sidebar
VIEW = """(() => { const v = __tag('hui-view')[0] || __tag('hui-sections-view')[0] || __tag('hui-panel-view')[0];
  const r = v.getBoundingClientRect(); return [r.left, r.top, Math.min(innerWidth, r.right), innerHeight]; })()"""
port = itertools.count(9480)


def people():
    """First names of HA's people with a phone (screen 'people' have none), longest first."""
    req = urllib.request.Request(HA + "/api/states", headers={"Authorization": "Bearer " + TOKEN})
    states = json.load(urllib.request.urlopen(req, timeout=15))
    names = {s["attributes"].get("friendly_name", "").split()[0] for s in states
             if s["entity_id"].startswith("person.") and s["attributes"].get("device_trackers")
             and "display" not in s["entity_id"]}
    return sorted((n for n in names if n), key=len, reverse=True)


def screen(path, w, h, dark=False, scale=1, extra=None):
    """Open a dashboard and return the browser. `extra` adds JSON settings for scrub.js."""
    f = Firefox(w, h, dark, scale, next(port))
    try:
        return _open(f, path, dark, extra)
    except Exception:
        f.close()
        raise


def _open(f, path, dark, extra):
    f.cmd("script.addPreloadScript", functionDeclaration="() => (%s\n)(%s, %s)"
          % (SCRUB, json.dumps(DEMO), json.dumps(json.dumps(dict(extra or {}, dark=dark, names=people())))))
    f.go(HA + "/auth/authorize", 1)
    tok = {"access_token": TOKEN, "token_type": "Bearer", "expires_in": 1800, "hassUrl": HA, "clientId": HA + "/",
           "expires": int(time.time() * 1000) + 10 ** 10, "refresh_token": ""}
    f.js("localStorage.setItem('hassTokens', %s)" % json.dumps(json.dumps(tok)))
    f.go(HA + path, 9)
    f.js(DEEP)
    return f


def out(name):
    return os.path.join(OUT, name + ".png")


def kitchen():
    show = "(() => { const c = __tag('overlook-show')[0]; c._go('%s'); c.requestUpdate(); })()"
    for dark, pages in ((False, ["home", "rooms", "climate", "recipes"]), (True, ["home", "media"])):
        f = screen("/ha-show/show", 1280, 800, dark)
        try:
            for p in pages:
                f.js(show % p)
                time.sleep(3)
                f.shot(out("tablet-%s%s" % (p, "-dark" if dark else "")))
        finally:
            f.close()


def echo():
    for v in ("controls", "media", "climate", "calendar"):
        f = screen("/master-bedroom-echo-show/" + v, 788, 394, True)
        try:
            f.shot(out("bedroom-" + v), f.js(VIEW))
        finally:
            f.close()


def computer():
    for dark in (False, True):
        f = screen("/ha-show-computer/home", 1440, 900, dark)
        try:
            f.shot(out("computer-show" + ("-dark" if dark else "")), f.js(VIEW))
        finally:
            f.close()


def phone():
    tile = """(() => { const t = __tag('meridian-tile').find((e) => e._config && e._config.entity === '%s');
      t.scrollIntoView({ block: 'center' }); t._open('%s'); })()"""
    for name, dark, entity in (("phone-show", False, None), ("phone-show-dark", True, None),
                               ("phone-show-amp", False, "media_player.living_room_amp"),
                               ("phone-show-heatpump", False, "climate.living_room")):
        f = screen("/ha-show-native/home", 390, 900, dark, 2)
        try:
            top = f.js(VIEW)[1]
            if entity:
                f.js(tile % (entity, entity))
                time.sleep(2)
                f.js("scrollTo(0, 0)")
                time.sleep(1)
            f.shot(out(name), [0, top, 390, top + 844])
        finally:
            f.close()


if __name__ == "__main__":
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Demo)
    DEMO = "http://127.0.0.1:%d" % srv.server_address[1]
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    jobs = {"kitchen": kitchen, "echo": echo, "computer": computer, "phone": phone}
    for name in sys.argv[1:] or jobs:
        print(name, flush=True)
        jobs[name]()
