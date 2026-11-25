// Detail pop-ups: what a tile inside a pop-up opens (the people, updates, batteries, plants,
// air readings, heat pump and doors and windows), in place of HA's more-info dialog. The pop-up
// morphs out of the tapped tile into the .dt-hero block (c._morph in overlook-show.js) and
// closes back into it. One pop-up, `__detail`, with one `detail` section whose look follows the
// entity: where (person, device_tracker), update, climate, contact (door/window), switch (plugs), battery, number,
// and a plain fallback. History comes from HA's history API into c._dhist["<id>|<hours>"].
import { html, svg, css, nothing } from "./lit-all.min.js";
import { count } from "./tablet.js";
import "./locationmap.js";

const AIR = {
  temperature: (v) => (v < 17 ? "Cool" : v > 25 ? "Warm" : "Comfortable"),
  humidity: (v) => (v < 35 ? "Dry" : v > 60 ? "Humid" : "Comfortable"),
  pm25: (v) => (v <= 12 ? "Good" : v <= 35 ? "Moderate" : "Poor"),
  voc: (v) => (v <= 150 ? "Good" : v <= 250 ? "Moderate" : "Poor"),
  moisture: (v) => (v < 30 ? "Needs water" : v > 75 ? "Very wet" : "Good"),
};

const kindOf = (e, x) => {
  const dom = e.entity_id.split(".")[0], dc = e.attributes.device_class || "";
  if (dom === "person" || dom === "device_tracker") return "where";
  if (dom === "update") return "update";
  if (dom === "climate") return "climate";
  if (dom === "switch" || dom === "input_boolean") return "switch";
  if (dom === "binary_sensor" && ["door", "window", "opening", "garage_door"].includes(dc)) return "contact";
  if (dc === "battery" && !x.attr) return "battery";
  if (!isNaN(Number(x.attr ? e.attributes[x.attr] : e.state))) return "number";
  return "plain";
};

export function detailPopup(c, x) {
  const e = c._st(x.entity);
  const name = x.name || (e && e.attributes.friendly_name) || x.entity;
  return { title: name, icon: x.icon || (e && e.attributes.icon) || "mdi:information-outline",
    sections: [{ type: "detail", entity: x.entity, attr: x.attr, name, icon: x.icon }] };
}

// --- small helpers -----------------------------------------------------------------
const ago = (t) => {
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  const d = Math.round(s / 86400);
  return d === 1 ? "yesterday" : `${d} days ago`;
};
const clock = (c, t) => {
  const d = new Date(t), today = new Date(); today.setHours(0, 0, 0, 0);
  const days = Math.round((today - new Date(t).setHours(0, 0, 0, 0)) / 86400000);
  const day = days === 0 ? "" : days === 1 ? "Yesterday " : `${d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}, `;
  return day + c._ampm(d);
};
const since = (c, t) => {
  const m = Math.max(0, Math.round((Date.now() - t) / 60000));
  const dur = m < 60 ? `${m} min` : m < 1440 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ""}` : `${Math.round(m / 1440)} days`;
  return `since ${clock(c, t)} · ${dur}`;
};
const km = (a, b) => {
  const R = 6371, r = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * r, dLon = (b.longitude - a.longitude) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.latitude * r) * Math.cos(b.latitude * r) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
// the device's other entities (HA's entity registry, which the frontend keeps in hass.entities)
const sameDevice = (c, id) => {
  const reg = c.hass.entities || {}, dev = reg[id] && reg[id].device_id;
  return dev ? Object.keys(reg).filter((k) => k !== id && reg[k].device_id === dev && c._st(k)) : [];
};
const batteryOf = (c, id) => sameDevice(c, id).find((k) => {
  const e = c._st(k);
  return e.attributes.device_class === "battery" && e.attributes.unit_of_measurement === "%";
});
const chargingOf = (c, id) => sameDevice(c, id).find((k) => /_battery_state$/.test(k));
const geocodeOf = (c, id) => sameDevice(c, id).find((k) => /_geocoded_location$/.test(k));

// history, loaded once per entity and range while the pop-up is open
function hist(c, id, hours, attr) {
  const key = `${id}|${hours}|${attr || ""}`;
  c._dhist = c._dhist || {};
  c._dreq = c._dreq || {};
  if (!c._dreq[key]) {
    c._dreq[key] = true;
    const start = new Date(Date.now() - hours * 3600e3).toISOString();
    const q = `history/period/${start}?filter_entity_id=${id}&end_time=${new Date().toISOString()}`
      + (attr ? "&significant_changes_only=0" : "&minimal_response&no_attributes");
    c.hass.callApi("GET", q).then((r) => {
      const list = (r[0] || []).map((h) => ({ t: new Date(h.last_updated || h.last_changed).getTime(),
        s: attr ? (h.attributes || {})[attr] : h.state }));
      c._dhist = Object.assign({}, c._dhist, { [key]: list });
      c.requestUpdate();
    }).catch(() => { c._dhist = Object.assign({}, c._dhist, { [key]: [] }); c.requestUpdate(); });
  }
  return c._dhist[key];
}
const range = (c) => c._dRange || 24;
const rangeTabs = (c) => html`
  <div class="dt-tabs">${[[24, "24 hours"], [168, "7 days"]].map(([h, t]) => html`
    <button class=${range(c) === h ? "on" : ""} @click=${() => { if (range(c) !== h) c._dZoom = { from: range(c), to: h }; c._dRange = h; c.requestUpdate(); }}>${t}</button>`)}</div>`;

// a line graph of a number over the chosen range, with low, average and high under it
function graph(c, id, attr, unit, color, hours = range(c)) {
  const e = c._st(id);
  const list = hist(c, id, hours, attr);
  if (!list) return html`<div class="dt-graph dt-empty">Loading…</div>`;
  const now = Number(attr ? e.attributes[attr] : e.state);
  let pts = list.map((p) => [p.t, Number(p.s)]).filter((p) => isFinite(p[1]));
  if (isFinite(now)) pts.push([Date.now(), now]);
  if (pts.length < 2) return html`<div class="dt-graph dt-empty">Not enough history yet</div>`;
  const W = 340, H = 120, t0 = Date.now() - hours * 3600e3, t1 = Date.now();
  const vals = pts.map((p) => p[1]);
  let lo = Math.min(...vals), hi = Math.max(...vals);
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  const pad = Math.max((hi - lo) * 0.15, unit === "%" ? 2 : 0.5);
  const yl = lo - pad, yh = hi + pad;
  const X = (t) => ((Math.max(t, t0) - t0) / (t1 - t0)) * W, Y = (v) => H - ((v - yl) / (yh - yl)) * H;
  let d = `M${X(pts[0][0]).toFixed(1)} ${Y(pts[0][1]).toFixed(1)}`;
  pts.forEach((p, i) => { if (i) d += ` L${X(p[0]).toFixed(1)} ${Y(pts[i - 1][1]).toFixed(1)} L${X(p[0]).toFixed(1)} ${Y(p[1]).toFixed(1)}`; });
  const f = (v) => `${Math.round(v * 10) / 10}${unit}`;
  const ticks = hours <= 24 ? [0, 6, 12, 18, 24].map((h) => [t1 - h * 3600e3, h === 0 ? "Now" : `${h}h`])
    : [0, 2, 4, 6].map((dd) => [t1 - dd * 86400e3, dd === 0 ? "Today" : new Date(t1 - dd * 86400e3).toLocaleDateString(undefined, { weekday: "short" })]);
  return html`
    <div class="dt-graph" style="--dc:${color || "var(--accent)"}">
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" data-h=${hours}>${svg`
        <path d="${d} L${W} ${H} L${X(pts[0][0]).toFixed(1)} ${H} Z" fill="var(--dc)" opacity="0.13"></path>
        <path d=${d} fill="none" stroke="var(--dc)" stroke-width="2.2" vector-effect="non-scaling-stroke" stroke-linejoin="round"></path>`}</svg>
      <div class="dt-ticks">${ticks.reverse().map(([t, l]) => html`<span style="left:${(X(t) / W) * 100}%">${l}</span>`)}</div>
    </div>
    <div class="dt-stats">
      <div><small>Low</small><b>${f(lo)}</b></div><div><small>Average</small><b>${f(avg)}</b></div><div><small>High</small><b>${f(hi)}</b></div>
    </div>`;
}

const moreLink = (c, id) => html`
  <button class="dt-more" @click=${() => { c._popBack = c._popReturn = null; c._closeSheet(() => { c._pop = null; }); c._moreInfo(id); }}><ha-icon icon="mdi:tune-variant"></ha-icon><span>More in Home Assistant</span>
    <ha-icon icon="mdi:chevron-right"></ha-icon></button>`;

const rows = (list) => html`<div class="dt-rows">${list.filter(Boolean).map(([icon, k, v]) => html`
  <div class="dt-row"><ha-icon icon=${icon}></ha-icon><span>${k}</span><b>${v}</b></div>`)}</div>`;

// --- the kinds ------------------------------------------------------------------------
// a map of where someone is, built from Esri's plain grey canvas tiles around the point (light or
// dark grey with the theme; no labels or shop icons, which the standard OSM style was too busy
// with), with home marked when it's in view
const ESRI = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas";
// A location detail's map: the spot as a blue dot with its GPS accuracy around it, home when it
// is in view. The Meridian-coloured vector map (www/locationmap.js) draws it; the grey Esri tiles
// here are its fallback, kept hidden unless that can't load. Positions are pixel offsets from the
// centre, so the fallback fills whatever width the pop-up has.
const mx = (lon, n) => ((lon + 180) / 360) * n;
const my = (lat, n) => { const r = (lat * Math.PI) / 180; return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n; };
function locMap(c, lat, lon, acc) {
  const z = 15, H = 210, W = 900, T = 256, n = 2 ** z, cx = mx(lon, n), cy = my(lat, n);
  const tiles = [];
  for (let i = Math.floor(cx - W / 2 / T); i <= Math.floor(cx + W / 2 / T); i++)
    for (let j = Math.floor(cy - H / 2 / T); j <= Math.floor(cy + H / 2 / T); j++)
      tiles.push([i, j, (i - cx) * T, (j - cy) * T]);
  const mpp = (156543.03 * Math.cos((lat * Math.PI) / 180)) / n;   // metres per pixel
  const r = Math.max(10, (acc || 0) / mpp);
  const home = c._st("zone.home"), ha = home && home.attributes;
  const hm = ha && ha.latitude != null ? [(mx(ha.longitude, n) - cx) * T, (my(ha.latitude, n) - cy) * T] : null;
  const showHome = hm && Math.abs(hm[1]) < H / 2 - 12 && Math.hypot(hm[0], hm[1]) > 18;
  // the card's own scheme (it can follow sun.sun rather than the device), else the device's
  const sch = c.getAttribute("scheme");
  const dark = sch ? sch === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  const base = dark ? "World_Dark_Gray_Base" : "World_Light_Gray_Base";
  const pos = ([x, y]) => `left:calc(50% + ${x}px);top:calc(50% + ${y}px)`;
  const data = { dark, lat, lon, acc: acc || 0, home: ha && ha.latitude != null ? [ha.latitude, ha.longitude] : null };
  return html`<meridian-location-map style="height:${H}px" .data=${data}>
    <div class="dt-map" style="height:${H}px">
      <div class="dt-tiles">${tiles.map(([i, j, l, t]) => html`<img style="${pos([l, t])}"
        src="${ESRI}/${base}/MapServer/tile/${z}/${j}/${((i % n) + n) % n}" alt="" draggable="false">`)}</div>
      <i class="dt-acc" style="width:${r * 2}px;height:${r * 2}px"></i><i class="dt-pin"></i>
      ${showHome ? html`<span class="dt-home" style="${pos(hm)}"><ha-icon icon="mdi:home"></ha-icon></span>` : nothing}
      <small class="dt-osm">Esri, OpenStreetMap</small>
    </div></meridian-location-map>`;
}

function where(c, e) {
  const a = e.attributes, dom = e.entity_id.split(".")[0];
  const dev = dom === "person" ? a.source : e.entity_id;
  const de = c._st(dev) || e;
  const lat = a.latitude ?? de.attributes.latitude, lon = a.longitude ?? de.attributes.longitude;
  const home = c._st("zone.home");
  const st = e.state;
  const geo = dev && geocodeOf(c, dev) && c._st(geocodeOf(c, dev));
  const addr = geo && !["unknown", "unavailable"].includes(geo.state) ? geo.state.split(",").slice(0, 2).join(",") : null;
  const place = st === "home" ? "Home" : st === "not_home" ? addr || "Away" : st === "unknown" ? "Unknown" : st;
  const dist = lat != null && home && st !== "home" ? km({ latitude: lat, longitude: lon }, home.attributes) : null;
  const bat = dev && batteryOf(c, dev), batE = bat && c._st(bat), chg = dev && chargingOf(c, dev) && c._st(chargingOf(c, dev));
  const lvl = batE ? Number(batE.state) : de.attributes.battery_level;
  return html`
    <div class="dt-hero dt-where">
      ${lat != null ? locMap(c, lat, lon, a.gps_accuracy ?? de.attributes.gps_accuracy)
        : html`<div class="dt-nomap"><ha-icon icon="mdi:map-marker-off-outline"></ha-icon>No location reported</div>`}
      <div class="dt-place"><b>${place}</b><span>${since(c, new Date(e.last_changed).getTime())}</span></div>
    </div>
    ${rows([
      dist != null && ["mdi:home-import-outline", "From home", dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`],
      addr && st !== "not_home" && ["mdi:map-marker-outline", "Address", addr],
      lvl != null && isFinite(lvl) && ["mdi:battery-outline", "Battery", `${Math.round(lvl)}%${chg && chg.state !== "unknown" ? ` · ${chg.state.replace("Not Charging", "not charging").toLowerCase()}` : ""}`],
      (a.gps_accuracy ?? de.attributes.gps_accuracy) != null && ["mdi:crosshairs-gps", "Accuracy", `±${Math.round(a.gps_accuracy ?? de.attributes.gps_accuracy)} m`],
      ["mdi:update", "Last update", ago(new Date(de.last_updated).getTime())],
    ])}`;
}

function update(c, e) {
  const a = e.attributes, avail = e.state === "on", busy = a.in_progress;
  const holding = c._dHold === e.entity_id;
  const start = (ev) => {
    ev.preventDefault();
    c._dHold = e.entity_id; c.requestUpdate();
    clearTimeout(c._dHoldT);
    c._dHoldT = setTimeout(() => {
      if (c._dHold !== e.entity_id) return;
      c._dHold = null;
      c._call("update", "install", { entity_id: e.entity_id });
      c.requestUpdate();
    }, 1200);
  };
  const stop = () => { if (c._dHold) { c._dHold = null; clearTimeout(c._dHoldT); c.requestUpdate(); } };
  const summary = (a.release_summary || "").replace(/<[^>]+>/g, "").trim();
  return html`
    <div class="dt-hero dt-upd ${avail ? "avail" : ""}">
      <span class="dt-chip">${busy ? "Installing…" : avail ? "Update available" : "Up to date"}</span>
      <div class="dt-vers"><span>${a.installed_version || "–"}</span>${avail ? html`<ha-icon icon="mdi:arrow-right"></ha-icon><b>${a.latest_version}</b>` : nothing}</div>
      <small>${a.title || ""}</small>
      ${busy && a.update_percentage != null ? html`<div class="dt-bar"><i style="width:${a.update_percentage}%"></i></div>` : nothing}
    </div>
    ${summary ? html`<div class="pop-sub">What's new</div><div class="dt-notes">${summary}</div>` : nothing}
    ${a.release_url ? html`<a class="dt-more" href=${a.release_url} target="_blank" rel="noreferrer"><ha-icon icon="mdi:text-box-outline"></ha-icon>
      <span>Release notes</span><ha-icon icon="mdi:open-in-new"></ha-icon></a>` : nothing}
    ${avail && !busy ? html`
      <button class="dt-install ${holding ? "holding" : ""}" @pointerdown=${start} @pointerup=${stop} @pointerleave=${stop} @pointercancel=${stop}
        @contextmenu=${(ev) => ev.preventDefault()}>
        <i></i><span>${holding ? "Keep holding…" : `Hold to install ${a.latest_version}`}</span></button>
      <div class="dt-hint">Home Assistant restarts while it installs.</div>` : nothing}`;
}

// the last 24 hours of an on/off entity: the "on" stretches, how often it came on, the time on,
// and the last few changes
function onOff(c, e) {
  const list = hist(c, e.entity_id, 24);
  const t1 = Date.now(), t0 = t1 - 24 * 3600e3;
  const segs = [];
  let count = 0;
  if (list) {
    const ch = [...list, { t: t1, s: e.state }];
    ch.forEach((p, i) => {
      if (p.s === "on" && i < ch.length - 1) segs.push([Math.max(p.t, t0), ch[i + 1].t]);
      if (p.s === "on" && i > 0 && ch[i - 1].s !== "on") count++;
    });
  }
  const recent = (list || []).filter((p, i, a) => i > 0 && p.s !== a[i - 1].s && ["on", "off"].includes(p.s)).slice(-5).reverse();
  return { list, segs, count, recent, total: segs.reduce((n, [a, b]) => n + (b - a), 0),
    line: html`
      <div class="dt-line">${segs.map(([a, b]) => html`<i style="left:${((a - t0) / (t1 - t0)) * 100}%;width:${Math.max(0.8, ((b - a) / (t1 - t0)) * 100)}%"></i>`)}</div>
      <div class="dt-ticks static"><span>24h ago</span><span>12h</span><span>Now</span></div>` };
}
const dur = (ms) => {
  const m = Math.round(ms / 60000);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ""}`;
};

function contact(c, e) {
  const open = e.state === "on", dc = e.attributes.device_class;
  const door = dc === "door" || dc === "garage_door";
  const { list, count: opens, recent, line } = onOff(c, e);
  const bat = batteryOf(c, e.entity_id), batE = bat && c._st(bat);
  return html`
    <div class="dt-hero dt-contact ${open ? "open" : ""}">
      <ha-icon icon=${door ? (open ? "mdi:door-open" : "mdi:door-closed") : (open ? "mdi:window-open-variant" : "mdi:window-closed-variant")}></ha-icon>
      <div><b>${open ? "Open" : "Shut"}</b><span>${since(c, new Date(e.last_changed).getTime())}</span></div>
    </div>
    <div class="pop-sub">Last 24 hours${list ? ` · opened ${opens} time${opens === 1 ? "" : "s"}` : ""}</div>
    ${line}
    ${recent.length ? rows(recent.map((p) => [p.s === "on" ? "mdi:arrow-up-bold-outline" : "mdi:arrow-down-bold-outline", p.s === "on" ? "Opened" : "Shut", clock(c, p.t)])) : nothing}
    ${batE ? rows([["mdi:battery-outline", "Sensor battery", `${Math.round(Number(batE.state))}%`]]) : nothing}`;
}

// a plug or switch: the big block is its on/off button; then its day, and power if it measures it
function toggle(c, e, s) {
  const on = e.state === "on", dead = ["unavailable", "unknown"].includes(e.state);
  const { list, count, recent, total, line } = onOff(c, e);
  const sib = sameDevice(c, e.entity_id).map((k) => c._st(k));
  const pw = sib.find((x) => x.attributes.device_class === "power");
  const en = sib.find((x) => x.attributes.device_class === "energy");
  const icon = s.icon || e.attributes.icon || "mdi:power-plug";
  return html`
    <button class="dt-hero dt-switch ${on ? "on" : ""}" ?disabled=${dead}
            @click=${() => c._call("homeassistant", "toggle", { entity_id: e.entity_id })}>
      <span class="dt-knob"><ha-icon icon=${icon}></ha-icon></span>
      <div><b>${dead ? "Unavailable" : on ? "On" : "Off"}</b><span>${since(c, new Date(e.last_changed).getTime())}</span></div>
      <i class="dt-sw"><u></u></i>
    </button>
    <div class="pop-sub">Last 24 hours${list ? ` · on for ${dur(total)}${count ? `, switched on ${count} time${count === 1 ? "" : "s"}` : ""}` : ""}</div>
    ${line}
    ${pw || en ? rows([
      pw && ["mdi:flash-outline", "Using now", c._fmt(pw)],
      en && ["mdi:lightning-bolt-outline", "Energy", c._fmt(en)],
    ]) : nothing}
    ${pw ? graph(c, pw.entity_id, null, " W", "#f39a43", 24) : nothing}
    ${recent.length ? rows(recent.map((p) => [p.s === "on" ? "mdi:power" : "mdi:power-off", p.s === "on" ? "Turned on" : "Turned off", clock(c, p.t)])) : nothing}`;
}

function battery(c, e) {
  const v = Number(e.state), a = e.attributes;
  const chg = chargingOf(c, e.entity_id) && c._st(chargingOf(c, e.entity_id));
  const col = v < 10 ? "#e5484d" : v <= 25 ? "#f39a43" : "#3f8f63";   // red at the 10% alert
  // non-rechargeable sensors: how fast it's falling over the week, so roughly how long is left
  const week = !chg ? hist(c, e.entity_id, 168) : null;
  let left = null;
  if (week && week.length > 1) {
    const first = week.find((p) => isFinite(Number(p.s)));
    if (first) {
      const days = (Date.now() - first.t) / 86400e3, drop = Number(first.s) - v;
      if (days > 2 && drop > 0.5) left = (v / (drop / days));
    }
  }
  const leftTxt = left == null ? null : left > 120 ? "Months" : left > 21 ? `About ${Math.round(left / 7)} weeks` : `About ${Math.round(left)} days`;
  return html`
    <div class="dt-hero dt-bat" style="--bc:${col}">
      <div class="dt-cell"><i style="width:${Math.max(3, Math.min(100, v))}%"></i></div>
      <div><b>${isFinite(v) ? `${Math.round(v)}%` : "–"}</b><span>${chg && !["unknown", "unavailable"].includes(chg.state) ? chg.state : v < 10 ? "Low, replace soon" : "Battery"}</span></div>
    </div>
    ${rangeTabs(c)}
    ${graph(c, e.entity_id, null, "%", col)}
    ${rows([
      leftTxt && ["mdi:timer-sand", "Lasts", `${leftTxt} at this rate`],
      a.battery_size && ["mdi:battery-unknown", "Takes", `${a.battery_quantity ? `${a.battery_quantity} × ` : ""}${a.battery_size}`],
      ["mdi:update", "Last report", ago(new Date(e.last_updated).getTime())],
    ])}`;
}

function number(c, e, s) {
  const a = e.attributes, attr = s.attr;
  const v = Number(attr ? a[attr] : e.state);
  const unit = attr ? (/temp/.test(attr) ? "°" : /humid/.test(attr) ? "%" : "") : a.unit_of_measurement === "°C" ? "°" : a.unit_of_measurement === "%" ? "%" : a.unit_of_measurement ? ` ${a.unit_of_measurement}` : "";
  const id = e.entity_id, dc = a.device_class || "";
  const which = /pm2_5|pm25/.test(id) ? "pm25" : /voc/.test(id) ? "voc" : /moisture|soil.*humid/.test(id) || dc === "moisture" ? "moisture"
    : dc === "temperature" || attr === "current_temperature" ? "temperature" : dc === "humidity" || attr === "current_humidity" ? "humidity" : null;
  const verdict = which && isFinite(v) ? AIR[which](v) : null;
  const col = which === "temperature" ? "#f39a43" : which === "humidity" || which === "moisture" ? "#3f86f2" : which === "pm25" ? "#3f8f63" : which === "voc" ? "#1fb39b" : "var(--accent)";
  return html`
    <div class="dt-hero dt-num" style="--dc:${col}">
      <b>${count(v, 1)}<em>${unit.trim()}</em></b>
      <span>${verdict || ""}</span><small>Updated ${ago(new Date(e.last_updated).getTime())}</small>
    </div>
    ${rangeTabs(c)}
    ${graph(c, id, attr, unit.trim() === "%" ? "%" : unit.trim() === "°" ? "°" : "", col)}`;
}

function climate(c, e, s) {
  const a = e.attributes;
  // the heat pump's own controls are the top block; humidity sits under them
  return html`
    <div class="dt-hero dt-thermo">${c._thermostat(e.entity_id)}</div>
    ${a.current_humidity != null ? rows([["mdi:water-percent", "Humidity", `${Math.round(a.current_humidity)}%`]]) : nothing}
    ${rangeTabs(c)}
    ${graph(c, e.entity_id, s.attr || "current_temperature", s.attr === "current_humidity" ? "%" : "°", s.attr === "current_humidity" ? "#3f86f2" : "#f39a43")}`;
}

function plain(c, e) {
  return html`
    <div class="dt-hero dt-num"><b class="txt">${c._fmt(e)}</b><small>Changed ${ago(new Date(e.last_changed).getTime())}</small></div>`;
}

export function detailSection(c, s) {
  const e = c._st(s.entity);
  if (!e) return html`<div class="dt-hero dt-num"><b class="txt">Not available</b></div>`;
  const k = kindOf(e, s);
  const body = k === "where" ? where(c, e) : k === "update" ? update(c, e) : k === "climate" ? climate(c, e, s)
    : k === "contact" ? contact(c, e) : k === "switch" ? toggle(c, e, s) : k === "battery" ? battery(c, e) : k === "number" ? number(c, e, s) : plain(c, e);
  return html`<div class="dt">${body}${moreLink(c, s.entity)}</div>`;
}

export const DETAIL_CSS = css`
  .dt { display: flex; flex-direction: column; gap: 12px; padding-bottom: 4px; }
  .dt-hero { border-radius: 22px; background: var(--card); overflow: hidden; }
  .dt-where { display: flex; flex-direction: column; }
  .dt-map { position: relative; height: 190px; overflow: hidden; background: #dde3ea; }
  .dt-tiles { position: absolute; inset: 0; }
  .dt-acc { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); border-radius: 50%;
            background: color-mix(in srgb, var(--accent) 18%, transparent); border: 1px solid color-mix(in srgb, var(--accent) 45%, transparent); }
  .dt-pin { position: absolute; left: 50%; top: 50%; width: 16px; height: 16px; transform: translate(-50%, -50%); border-radius: 50%;
            background: var(--accent); border: 3px solid #fff; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35); }
  .dt-tiles img { position: absolute; display: block; width: 256px; height: 256px; max-width: none; user-select: none; }
  .dt-home { position: absolute; z-index: 1; transform: translate(-50%, -50%); width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center;
             background: #fff; color: #3f8f63; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3); --mdc-icon-size: 16px; }
  .dt-osm { position: absolute; right: 6px; bottom: 4px; font-size: 9px; color: #333; background: rgba(255, 255, 255, 0.7); padding: 1px 4px; border-radius: 4px; }
  .dt-nomap { height: 110px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; color: var(--muted); font-weight: 600; }
  .dt-place { display: flex; flex-direction: column; padding: 12px 16px 14px; }
  .dt-place b { font-size: 22px; font-weight: 700; line-height: 1.2; }
  .dt-place span, .dt-contact span, .dt-bat span { font-size: 13px; color: var(--muted); margin-top: 2px; }
  .dt-rows { display: flex; flex-direction: column; border-radius: 18px; background: var(--card); padding: 4px 14px; }
  .dt-row { display: grid; grid-template-columns: 22px 1fr auto; gap: 10px; align-items: center; padding: 10px 0; font-size: 15px; }
  .dt-row + .dt-row { border-top: 1px solid var(--track); }
  .dt-row ha-icon { --mdc-icon-size: 20px; color: var(--muted); }
  .dt-row b { font-weight: 600; text-align: right; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 190px; }
  .dt-more { display: grid; grid-template-columns: 22px 1fr auto; gap: 10px; align-items: center; padding: 12px 14px; border-radius: 18px;
             background: var(--card); color: var(--ink); font: inherit; font-size: 15px; font-weight: 600; text-decoration: none; text-align: left; }
  .dt-more ha-icon { --mdc-icon-size: 20px; color: var(--muted); }
  .dt-upd { padding: 16px; display: flex; flex-direction: column; gap: 6px; }
  .dt-upd.avail { background: color-mix(in srgb, #e5484d 12%, var(--card)); }
  .dt-chip { align-self: flex-start; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 999px; background: var(--accent-soft); color: var(--accent); }
  .dt-upd.avail .dt-chip { background: color-mix(in srgb, #e5484d 18%, var(--card)); color: #e5484d; }
  .dt-vers { display: flex; align-items: center; gap: 8px; font-size: 26px; font-weight: 700; }
  .dt-vers span { color: var(--muted); font-weight: 600; } .dt-vers ha-icon { color: var(--muted); }
  .dt-upd small { font-size: 13px; color: var(--muted); }
  .dt-bar, .dt-cell { height: 10px; border-radius: 999px; background: var(--track); overflow: hidden; }
  .dt-bar i { display: block; height: 100%; background: var(--accent); }
  .dt-notes { font-size: 14px; line-height: 1.45; padding: 12px 14px; border-radius: 18px; background: var(--card); white-space: pre-line;
              max-height: 180px; overflow: auto; }
  .dt-install { position: relative; overflow: hidden; height: 54px; border-radius: 18px; border: 0; font: inherit; font-size: 16px; font-weight: 700;
                color: #fff; background: #e5484d; touch-action: none; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; }
  .dt-install i { position: absolute; inset: 0; width: 0; background: rgba(255, 255, 255, 0.28); }
  .dt-install.holding i { width: 100%; transition: width 1.2s linear; }
  .dt-install span { position: relative; }
  .dt-hint { font-size: 12px; color: var(--muted); text-align: center; margin-top: -4px; }
  .dt-contact { display: flex; align-items: center; gap: 14px; padding: 16px; }
  .dt-contact ha-icon { --mdc-icon-size: 40px; color: #3f8f63; }
  .dt-contact.open { background: color-mix(in srgb, var(--warm) 16%, var(--card)); }
  .dt-contact.open ha-icon, .dt-contact.open b { color: color-mix(in srgb, var(--warm) 85%, var(--ink)); }
  .dt-contact div, .dt-bat > div:last-child { display: flex; flex-direction: column; }
  .dt-contact b, .dt-bat b { font-size: 28px; font-weight: 700; line-height: 1.1; }
  .dt-switch { display: flex; align-items: center; gap: 14px; padding: 16px; border: 0; width: 100%; text-align: left;
    font: inherit; color: var(--ink); cursor: pointer; transition: background 0.25s; }
  .dt-switch:disabled { cursor: default; opacity: 0.6; }
  .dt-switch > div { display: flex; flex-direction: column; flex: 1; min-width: 0; }
  .dt-switch b { font-size: 28px; font-weight: 700; line-height: 1.1; }
  .dt-switch span { font-size: 13px; color: var(--muted); margin-top: 2px; }
  .dt-knob { display: grid; place-items: center; width: 52px; height: 52px; border-radius: 50%; margin: 0 !important;
    background: color-mix(in srgb, var(--muted) 14%, transparent); transition: background 0.25s, color 0.25s; }
  .dt-knob ha-icon { --mdc-icon-size: 28px; color: var(--muted); }
  .dt-switch.on { background: color-mix(in srgb, var(--warm) 16%, var(--card)); }
  .dt-switch.on .dt-knob { background: var(--warm); }
  .dt-switch.on .dt-knob ha-icon { color: #fff; }
  .dt-sw { position: relative; flex: none; width: 52px; height: 30px; border-radius: 15px;
    background: color-mix(in srgb, var(--muted) 30%, transparent); transition: background 0.25s; }
  .dt-sw u { position: absolute; top: 3px; left: 3px; width: 24px; height: 24px; border-radius: 50%; background: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25); transition: transform 0.25s cubic-bezier(0.32, 0.72, 0, 1); }
  .dt-switch.on .dt-sw { background: var(--warm); }
  .dt-switch.on .dt-sw u { transform: translateX(22px); }
  .dt-line { position: relative; height: 26px; border-radius: 10px; background: var(--card); overflow: hidden; }
  .dt-line i { position: absolute; top: 4px; bottom: 4px; border-radius: 6px; background: var(--warm); }
  .dt-bat { display: flex; align-items: center; gap: 16px; padding: 16px; }
  .dt-cell { width: 92px; height: 40px; border-radius: 10px; padding: 4px; position: relative; flex: none; background: var(--track); overflow: visible; }
  .dt-cell::after { content: ""; position: absolute; right: -6px; top: 13px; width: 4px; height: 14px; border-radius: 0 3px 3px 0; background: var(--track); }
  .dt-cell i { display: block; height: 100%; border-radius: 6px; background: var(--bc); }
  .dt-num { display: flex; flex-direction: column; padding: 16px; }
  .dt-num b { font-size: 46px; font-weight: 700; line-height: 1; color: color-mix(in srgb, var(--dc, var(--accent)) 80%, var(--ink)); }
  .dt-num b.txt { font-size: 28px; color: var(--ink); }
  .dt-num em { font-style: normal; font-size: 24px; margin-left: 2px; }
  .dt-num span { font-size: 16px; font-weight: 600; margin-top: 6px; }
  .dt-num small { font-size: 13px; color: var(--muted); margin-top: 2px; }
  .dt-tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; padding: 4px; border-radius: 14px; background: var(--card); }
  .dt-tabs button { border: 0; font: inherit; font-size: 14px; font-weight: 600; padding: 8px; border-radius: 10px; background: none; color: var(--muted); }
  .dt-tabs button.on { background: var(--accent-soft); color: var(--accent); }
  .dt-graph { position: relative; padding: 12px 12px 22px; border-radius: 18px; background: var(--card); overflow: hidden; }
  .dt-graph svg { display: block; width: 100%; height: 120px; }
  .dt-empty { height: 120px; display: grid; place-items: center; color: var(--muted); font-size: 14px; padding: 12px; }
  .dt-ticks { position: absolute; left: 12px; right: 12px; bottom: 4px; height: 14px; }
  .dt-ticks span { position: absolute; transform: translateX(-50%); font-size: 11px; color: var(--muted); white-space: nowrap; }
  .dt-ticks span:first-child { transform: none; } .dt-ticks span:last-child { transform: translateX(-100%); }
  .dt-ticks.static { position: static; display: flex; justify-content: space-between; height: auto; margin-top: -6px; }
  .dt-ticks.static span { position: static; transform: none; }
  .dt-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .dt-stats div { display: flex; flex-direction: column; padding: 10px 12px; border-radius: 16px; background: var(--card); }
  .dt-stats small { font-size: 11px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted); }
  .dt-stats b { font-size: 18px; font-weight: 700; }
  .dt-thermo { padding: 14px; }
  .dt-thermo .thermo { padding: 0; background: none; box-shadow: none; }
`;
