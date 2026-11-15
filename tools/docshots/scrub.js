// Runs in the screenshot browser before Home Assistant's frontend loads (a WebDriver BiDi
// preload script; shoot.py passes DEMO, the address of its demo-file server, and OPTS, JSON
// with `dark`). It rewrites what
// HA sends the page, so the README screenshots show a made-up house: people's names, what's
// playing and its artwork, the photo album, calendars, the shopping list, playlists and the
// Norish recipe library are all replaced. HA itself is never written to.
(DEMO, OPTS) => {
  const { dark, names = [] } = JSON.parse(OPTS || "{}");
  const svg = (s) => "data:image/svg+xml;base64," + btoa(s);
  const hue = (t) => [...String(t)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) % 360;
  // square cover art: a gradient, a sun and a hill, coloured from the title
  const cover = (t) => {
    const h = hue(t);
    return svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="hsl(${h},70%,60%)"/><stop offset="1" stop-color="hsl(${(h + 50) % 360},60%,30%)"/></linearGradient></defs>
<rect width="600" height="600" fill="url(#g)"/><circle cx="410" cy="200" r="110" fill="hsl(${(h + 30) % 360},90%,82%)" opacity=".6"/>
<path d="M0 460 Q160 370 310 440 T600 410 V600 H0Z" fill="hsl(${(h + 200) % 360},45%,16%)" opacity=".55"/></svg>`);
  };
  // a made-up landscape stands in for the family album, and a wider one for a TV show's art
  const PHOTO = svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000"><defs>
<linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b5d8f"/><stop offset=".55" stop-color="#e9a77c"/><stop offset="1" stop-color="#f6d6a8"/></linearGradient>
<linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c98e72"/><stop offset="1" stop-color="#3d4f6e"/></linearGradient></defs>
<rect width="1600" height="1000" fill="url(#s)"/><circle cx="1050" cy="560" r="70" fill="#fde7b8"/>
<path d="M0 620 L260 420 L470 560 L700 360 L960 600 L1180 470 L1400 590 L1600 480 V1000 H0Z" fill="#5a6488"/>
<path d="M0 700 L320 560 L560 680 L840 540 L1120 690 L1360 600 L1600 680 V1000 H0Z" fill="#34405f"/>
<rect y="760" width="1600" height="240" fill="url(#w)"/>
<path d="M0 820 L400 780 L760 830 L1200 790 L1600 830 V1000 H0Z" fill="#26304a"/></svg>`);
  const POSTER = svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900"><defs>
<linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f2a3f"/><stop offset=".6" stop-color="#2f6f8f"/><stop offset="1" stop-color="#9fd0d8"/></linearGradient></defs>
<rect width="1600" height="900" fill="url(#s)"/><circle cx="1180" cy="300" r="90" fill="#f7e6b5" opacity=".9"/>
<path d="M0 640 C300 560 520 700 820 610 S1350 560 1600 620 V900 H0Z" fill="#163447"/>
<path d="M0 720 C360 680 700 780 1000 720 S1400 690 1600 730 V900 H0Z" fill="#0b1c28"/>
<path d="M260 640 l40 -180 l40 180z M330 650 l30 -120 l30 120z" fill="#0b1c28"/></svg>`);

  // the household's first names (shoot.py reads them from HA's person entities) become these
  const STAND_INS = ["Alex", "Sam", "Jo", "Kit", "Robin", "Max"];
  const NAMES = names.map((n, i) => [new RegExp(n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), STAND_INS[i % STAND_INS.length]]);
  const TRACK = { media_title: "Morning Light", media_artist: "Placeholder Band", media_album_name: "Field Notes" };
  const SHOW = { media_title: "The Long Coast", media_series_title: "The Long Coast", media_artist: "", app_name: "Infuse",
    media_content_type: "tvshow", media_duration: 3120, media_position: 1210 };
  const SOURCES = ["Morning Radio", "Rain", "Jazz Classics", "Road Trip", "Kitchen Disco", "Focus"];
  const KEEP_SOURCES = new Set(["TV", "Line-in", "Music Assistant Queue"]);
  const PLAYLISTS = ["Sunday Morning", "Dinner Party", "Focus", "Road Trip", "Rainy Day", "Kitchen Disco"]
    .map((name, i) => ({ name, uri: `demo://playlist/${i}`, image: cover(name + "pl") }));
  const TODO = ["Milk", "Sourdough", "Lemons", "Coffee beans"].map((summary, i) => ({ uid: `demo${i}`, summary, status: "needs_action" }));

  const now = () => new Date().toISOString();
  const srcMap = (s) => (KEEP_SOURCES.has(s) ? s : SOURCES[hue(s) % SOURCES.length]);

  // one entity's state and attributes. `full` is a whole state; otherwise only the keys an
  // update carries are touched, so a partial update never gains keys it didn't have
  function fix(id, st, a, full) {
    const d = id.split(".")[0];
    const set = (k, v) => { if (a && (full || k in a)) a[k] = v; };
    if (a) {
      for (const k of ["entity_picture_local", "access_token", "latitude", "longitude", "gps_accuracy", "user_id"]) delete a[k];
    }
    // light or dark by the screenshot's choice, and never the night clock
    if (id === "sun.sun" && st !== undefined) st = dark ? "below_horizon" : "above_horizon";
    if (/^(binary_sensor\.kitchen_dark|input_boolean\.bedroom_night_mode)$/.test(id) && st !== undefined) st = "off";
    if (d === "person") { if (st !== undefined) st = "home"; if (a) delete a.entity_picture; }
    if (d === "camera" || d === "image") set("entity_picture", PHOTO);
    if (d === "calendar" && a) { if ("message" in a) a.message = "Book club"; set("location", ""); set("description", ""); }
    if (id === "sensor.tablet_playlists" && a && "items" in a) { a.items = PLAYLISTS; if (st !== undefined) st = String(PLAYLISTS.length); }
    if (id === "sensor.spotify_recent_playlists") { if (st !== undefined) st = "Road Trip"; set("names", PLAYLISTS.map((p) => p.name).join(" | ")); }
    if (d === "media_player") {
      if (a && Array.isArray(a.source_list)) a.source_list = [...new Set(a.source_list.map(srcMap))];
      if (a && typeof a.source === "string") a.source = srcMap(a.source);
      if (id === "media_player.living_room") {                       // the Apple TV: a made-up show
        if (st !== undefined) st = "playing";
        if (a) { Object.assign(a, SHOW, { entity_picture: POSTER, media_position_updated_at: now() }); }
      } else if (/^media_player\.living_room_amp(_2)?$/.test(id)) {   // the amp: on the TV input
        if (st !== undefined) st = "playing";
        if (a) { for (const k of Object.keys(TRACK)) delete a[k]; delete a.entity_picture; set("source", "TV"); }
      } else if (/^media_player\.(homepod_mini_kitchen(_2)?|bedroom_echo)$/.test(id)) {
        if (st !== undefined) st = "playing";
        if (a) Object.assign(a, TRACK, { entity_picture: cover(TRACK.media_title), media_duration: 214, media_position: 66, media_position_updated_at: now() });
      } else if (a && ("media_title" in a || "entity_picture" in a)) {
        Object.assign(a, TRACK);
        if ("entity_picture" in a) a.entity_picture = cover(TRACK.media_title);
      }
    }
    return [st, a];
  }

  // the amp's favourites, as named in the dashboards
  const LABELS = { "Check This Radio": "Morning Radio", "Taylor Swift": "Jazz Classics", "The Era's Tour": "Road Trip" };
  // the dashboard itself: recipes come from the demo server, and the countdown's artwork is
  // someone else's, so that card goes
  function fixConfig(c) {
    const walk = (o) => {
      if (typeof o === "string") return (LABELS[o] || o).replace(/^\/local\/norish/, DEMO + "/norish");
      if (Array.isArray(o)) return o.filter((x) => !(x && x.type === "custom:meridian-countdown")).map(walk);
      if (o && typeof o === "object") for (const k of Object.keys(o)) o[k] = walk(o[k]);
      return o;
    };
    return walk(c);
  }

  const sent = new Map();   // message id -> type, so a result can be matched to its request
  function fixMsg(m) {
    const type = sent.get(m.id);
    if (m.type === "result" && Array.isArray(m.result) && type === "get_states") {
      m.result.forEach((s) => { [s.state] = fix(s.entity_id, s.state, s.attributes, true); });
    }
    if (m.type === "result" && type === "auth/current_user" && m.result) m.result.name = "Alex";
    if (m.type === "result" && type === "lovelace/config" && m.result) m.result = fixConfig(m.result);
    if (m.type === "result" && type === "todo/item/list" && m.result) m.result.items = TODO;
    const ev = m.type === "event" && m.event;
    if (ev && type === "subscribe_entities") {
      for (const [id, s] of Object.entries(ev.a || {})) { s.a = s.a || {}; [s.s] = fix(id, s.s, s.a, true); }
      for (const [id, c] of Object.entries(ev.c || {})) if (c["+"]) { const p = c["+"]; [p.s] = fix(id, p.s, p.a, false); }
    }
    if (ev && type === "todo/item/subscribe") ev.items = TODO;
    return m;
  }
  function fixText(t) {
    if (typeof t !== "string") return t;
    for (const [re, to] of NAMES) t = t.replace(re, to);
    try {
      const j = JSON.parse(t);
      return JSON.stringify(Array.isArray(j) ? j.map(fixMsg) : fixMsg(j));
    } catch (e) { return t; }
  }

  const Native = window.WebSocket;
  function Demo(url, protocols) {
    const ws = protocols === undefined ? new Native(url) : new Native(url, protocols);
    const add = ws.addEventListener.bind(ws), send = ws.send.bind(ws);
    const wrap = (cb) => (e) => cb.call(ws, new MessageEvent("message", { data: fixText(e.data) }));
    ws.addEventListener = (t, cb, o) => add(t, t === "message" && typeof cb === "function" ? wrap(cb) : cb, o);
    Object.defineProperty(ws, "onmessage", { set(cb) { add("message", wrap(cb)); }, configurable: true });
    ws.send = (d) => {
      try { const j = JSON.parse(d); for (const m of [].concat(j)) if (m && m.id) sent.set(m.id, m.type); } catch (e) {}
      return send(d);
    };
    return ws;
  }
  Demo.prototype = Native.prototype;
  for (const k of ["CONNECTING", "OPEN", "CLOSING", "CLOSED"]) Demo[k] = Native[k];
  window.WebSocket = Demo;

  // REST: calendars answer with made-up events (all on the first calendar asked for, so they
  // don't repeat), Plex's now-playing art is left empty, and Norish files come from the demo server
  const day = (n, h = 0, m = 0) => { const d = new Date(); d.setDate(d.getDate() + n); d.setHours(h, m, 0, 0); return d; };
  const ev = (summary, s, e, allDay) => (allDay
    ? { summary, start: { date: s.toISOString().slice(0, 10) }, end: { date: e.toISOString().slice(0, 10) } }
    : { summary, start: { dateTime: s.toISOString() }, end: { dateTime: e.toISOString() } });
  const EVENTS = [ev("Swimming lessons", day(0, 16, 30), day(0, 17, 15)), ev("Bin night", day(1), day(2), true),
    ev("Dinner with friends", day(1, 18, 30), day(1, 21)), ev("Farmers market", day(3, 9), day(3, 11)),
    ev("Book club", day(6, 19), day(6, 21))];
  let mainCal = null;
  const realFetch = window.fetch.bind(window);
  const json = (o) => new Response(JSON.stringify(o), { headers: { "Content-Type": "application/json" } });
  window.fetch = (input, init) => {
    const url = typeof input === "string" ? input : (input && input.url) || "";
    const cal = url.match(/\/api\/calendars\/([^?]+)\?(.*)$/);
    if (cal) {
      if (!mainCal) mainCal = cal[1];
      if (cal[1] !== mainCal) return Promise.resolve(json([]));
      const q = new URLSearchParams(cal[2]), s = new Date(q.get("start")), e = new Date(q.get("end"));
      const end = (x) => new Date(x.end.dateTime || x.end.date), start = (x) => new Date(x.start.dateTime || x.start.date);
      return Promise.resolve(json(EVENTS.filter((x) => end(x) > s && start(x) < e)));
    }
    if (/\/local\/nowplaying\//.test(url)) return Promise.resolve(json({}));
    if (/\/local\/norish\//.test(url)) return realFetch(DEMO + "/norish/" + url.split("/local/norish/")[1], init);
    return realFetch(input, init);
  };
}
