// The kitchen tablet's pages (overlook-show with `tablet: true`, 1280x800).
//
// Home is quick actions: a dinner card, what's on the TV, the shopping list, a row of
// favourite actions and the week's calendar. Then Rooms (a room's lights, scenes and plugs as
// 2x squares), Climate (outside, the heat pump and each room's air), Media (what's playing,
// big, with its controls underneath) and Recipes (the week's dinners from Norish's planner
// over one shelf of favourites, recent recipes or cookbooks). Photos is the dock's last button.
//
// Each page is a function of the card `c`, so they can use its helpers (_lightTile, _popPlayer,
// _recipeCard ...). Page-local state lives on the card under `_t*` and is redrawn with
// c.requestUpdate(). Two files Home Assistant keeps current feed it: /local/norish/plan.json
// (tools/ha/norish_plan.py, which also writes the planner) and /local/nowplaying/index.json
// (tools/ha/plex_art.py: Plex's background and logo for what the Apple TV is playing).
import { html, css, nothing } from "./lit-all.min.js";

// The playback bar: what has played is a sine wave that drifts while the track plays and
// lies flat when paused; what is left is a plain line. CSS for .wv is in overlook-show.js.
export function wave(frac, playing, cls = "") {
  const pct = Math.max(0, Math.min(1, frac || 0)) * 100;
  return html`<div class="wv ${playing ? "on" : ""} ${cls}" style="--f:${pct}%"><i></i><b></b></div>`;
}

export const TABLET_PAGES = [
  ["home", "Home", "mdi:home-variant-outline"],
  ["rooms", "Rooms", "mdi:sofa-outline"],
  ["climate", "Climate", "mdi:thermometer"],
  ["media", "Media", "mdi:music"],
  ["recipes", "Recipes", "mdi:silverware-fork-knife"],
];

// the Echo's air tiles: short name, colour, icon, unit and a one-word verdict
const AIRC = {
  temperature: ["Temperature", "#e0a63c", "mdi:thermometer", "°", (v) => v < 17 ? "Cool" : v > 25 ? "Warm" : "Comfortable"],
  humidity: ["Humidity", "#5a7ea8", "mdi:water-percent", "%", (v) => v < 35 ? "Dry" : v > 60 ? "Humid" : "Comfortable"],
  pm2_5: ["PM2.5", "#3f8f63", "mdi:blur", "", (v) => v <= 12 ? "Good" : v <= 35 ? "Moderate" : "Poor"],
  voc: ["VOC", "#3f8f8a", "mdi:air-filter", "", (v) => v <= 150 ? "Good" : v <= 250 ? "Moderate" : "Poor"],
};
const EV_COLOURS = ["#9bd54a", "#2bb5e8", "#f08a3c", "#8e6cf0", "#e5484d"];
const TIMER_MINUTES = [1, 3, 5, 10, 15, 20, 30, 45, 60];

const cap = (s) => s ? s[0].toUpperCase() + s.slice(1) : "";
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const redraw = (c, patch) => { Object.assign(c, patch); c.requestUpdate(); };
const num = (c, id, attr) => {
  const e = c._st(id);
  if (!e) return null;
  const v = Number(attr ? e.attributes[attr] : e.state);
  return isNaN(v) || (!attr && e.state === "") ? null : v;
};

// the two files HA keeps current, polled once a minute
function ensureFeeds(c) {
  if (c._tFeeds) return;
  c._tFeeds = true;
  c._tPlan = {};
  c._tArt = {};
  const get = (path, key) => fetch(`${path}?t=${Date.now()}`).then((r) => r.ok ? r.json() : null)
    .then((j) => { if (j) redraw(c, { [key]: j }); }).catch(() => {});
  c._tLoadPlan = () => get("/local/norish/plan.json", "_tPlan");
  const all = () => { c._tLoadPlan(); get("/local/nowplaying/index.json", "_tArt"); };
  all();
  setInterval(all, 60 * 1000);
}

// a day's dinner: shown at once, written to Norish, then re-read so the row matches what Norish holds
function setDinner(c, day, id) {
  const p = Object.assign({}, c._tPlan);
  if (id) p[day] = id; else delete p[day];
  redraw(c, { _tPlan: p });
  c.hass.callService("shell_command", "norish_plan", { date: day, recipe: id || "clear" })
    .then(c._tLoadPlan, c._tLoadPlan);
}

// ---------------------------------------------------------------- shared pieces

function airTile(c, x) {
  const key = Object.keys(AIRC).find((k) => (x.attr || x.entity).includes(k)) || "temperature";
  const [name, colour, icon, unit, verdict] = AIRC[key];
  const v = num(c, x.entity, x.attr);
  return html`
    <button class="card air-tile" style="--c:${colour}" @click=${() => c._open(x.entity)}>
      <span class="air-ico"><ha-icon icon=${icon}></ha-icon></span>
      <span class="air-val">${v == null ? "–" : key === "temperature" ? Math.round(v * 10) / 10 : Math.round(v)}<small>${unit}</small></span>
      <span class="air-name">${name}<span class="air-q">${v == null ? "No reading" : verdict(v)}</span></span>
    </button>`;
}

// a room's air readings: its own sensors, or the heat pump's for a room that only has that
function roomAir(r) {
  if (r.sensors && r.sensors.length) return r.sensors.map((s) => ({ entity: s.entity }));
  if (r.climate) return [{ entity: r.climate, attr: "current_temperature" }, { entity: r.climate, attr: "current_humidity" }];
  return [];
}
const realRooms = (c) => (c._config.rooms || []).filter((r) => !r.music);

function players(c) { return (c._config.tablet_players || []).filter((p) => c._st(p.entity)); }
// volume of a player; the Apple TV's sound is the amp's
const volEntity = (c, id) => (players(c).find((p) => p.entity === id) || {}).volume || id;

// really playing something, not just "on": the amp on its TV input follows the Apple TV
function live(c, id) {
  const e = c._st(id);
  if (!e || e.state !== "playing") return false;
  const p = players(c).find((x) => x.entity === id) || {};
  if (p.follows && /tv/i.test(e.attributes.source || e.attributes.media_title || "")) return live(c, p.follows);
  return !!(e.attributes.media_title || e.attributes.media_artist);
}
const bars = () => html`<span class="eqb"><i></i><i></i><i></i></span>`;

// Plex art for what the Apple TV reports. Infuse names TV "Show - S8 ∙ E2 - Episode", or "Show - E7 - Episode"
// for a one-season show (a miniseries), with no season at all.
function video(c, a) {
  const t = a.media_title || "";
  const m = t.match(/^(.+?)\s+-\s+(?:S(\d+)\s*\W\s*)?E(\d+)\s+-\s+(.+)$/);
  const hit = (c._tArt || {})[norm(m ? m[1] : a.media_series_title || t)];
  return hit ? Object.assign({ ep: m ? { s: m[2] ? +m[2] : null, e: +m[3], t: m[4] } : null }, hit) : null;
}

function popPlayer(c) {
  if (!c._tPop) return nothing;
  return html`
    <div class="scrim" @click=${() => redraw(c, { _tPop: null })}>
      <div class="sheet card t-pop" @click=${(ev) => ev.stopPropagation()}>${c._popPlayer(c._tPop)}</div>
    </div>`;
}

// ---------------------------------------------------------------- Home

function dinnerCard(c) {
  c._loadLib();
  const L = c._lib, now = new Date(), h = now.getHours(), key = ymd(now);
  const greet = h < 5 ? "Good night" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  // one pick per day: the same date gives the same recipe, so it changes at midnight, not on every redraw
  const seed = (salt) => { let x = 2166136261; for (const ch of key + salt) x = Math.imul(x ^ ch.charCodeAt(0), 16777619); return x >>> 0; };
  const sug = [];
  if (L && L.recipes) {
    const planned = (c._tPlan || {})[key];
    const others = Object.keys(L.recipes).filter((id) => !L.favorites.includes(id) && L.recipes[id].img).sort();
    const favs = L.favorites.filter((id) => L.recipes[id]);
    if (planned && L.recipes[planned]) sug.push([planned, "Tonight"]);
    else if (others.length) sug.push([others[seed("try") % others.length], "Nothing planned · try"]);
    if (favs.length) sug.push([favs[seed("fav") % favs.length], "Favourite"]);
  }
  const open = (id) => { c._go("recipes"); c._openRecipe(id); };
  return html`
    <div class="card dinner">
      <div class="dn-hello">${greet},<br>what's for<br><b>dinner tonight?</b></div>
      <div class="dn-rule"></div>
      <div class="dn-stack">
        ${sug.map(([id, label], i) => { const r = L.recipes[id];
          return html`<button class="dn-card d${i}" @click=${() => open(id)}>
            <span class="dn-t"><small>${label}</small><b>${r.n}</b>${r.t ? html`<small>${r.t} min</small>` : nothing}</span>
            <span class="dn-img" style="background-image:url('${c._img(id)}')"></span></button>`; })}
        <button class="dn-plan" @click=${() => c._go("recipes")}><ha-icon icon="mdi:calendar-plus"></ha-icon>Plan the week</button>
      </div>
    </div>`;
}

// what's on: the TV with Plex's art and logo, or else whatever music is playing
function nowTile(c) {
  const tvId = c._config.tablet_tv, tv = tvId && c._st(tvId);
  const ta = tv ? tv.attributes : {};
  const open = (id) => () => redraw(c, { _tPop: id });
  if (tv && ta.media_title && !["off", "standby"].includes(tv.state)) {
    const v = video(c, ta);
    return html`
      <button class="card nowtile" @click=${open(tvId)}>
        <span class="now-lbl">TV &amp; Video${ta.app_name ? html` · ${ta.app_name}` : nothing}</span>
        <span class="now-art" style="background-image:url('${(v && v.bg) || ta.entity_picture}')">
          ${v && v.logo ? html`<img class="now-logo" src=${v.logo}>`
            : html`<span class="now-cap"><b>${v ? v.name : ta.media_title}</b></span>`}
        </span>
      </button>`;
  }
  const m = players(c).find((p) => p.entity !== tvId && live(c, p.entity));
  if (m) {
    const a = c._st(m.entity).attributes;
    return html`
      <button class="card nowtile mus" @click=${open(m.entity)}>
        <span class="now-lbl">Music · ${m.name}</span>
        <span class="now-music">${a.entity_picture ? html`<span class="now-cover" style="background-image:url('${a.entity_picture}')"></span>`
          : html`<span class="now-cover none"><ha-icon icon=${m.icon}></ha-icon></span>`}
          <span class="now-text"><b>${a.media_title}</b><span>${a.media_artist || ""}</span></span></span>
      </button>`;
  }
  return html`
    <button class="card nowtile idle" @click=${() => c._go("media")}>
      <span class="now-lbl">TV &amp; Video</span>
      <span class="now-empty"><ha-icon icon="mdi:television-play"></ha-icon>Nothing playing</span>
    </button>`;
}

function shoppingTile(c) {
  const items = c._todo || [];
  return html`
    <div class="card shop2"><div class="card-title">Shopping list</div>
      ${items.length ? html`<div class="sh2-list">${items.map((i) => c._tEdit === i.uid ? editRow(c, i) : html`
          <div class="sh2-i">
            <button class="box" title="Tick off" @click=${() => c._call("todo", "update_item", { entity_id: c._config.todo, item: i.uid, status: "completed" })}></button>
            <button class="sh2-name" @click=${() => editItem(c, i)}>${i.summary}</button></div>`)}</div>`
        : html`<div class="sh2-empty"><ha-icon icon="mdi:check-circle-outline"></ha-icon>All done</div>`}
      ${c._adding ? html`
        <form class="sh2-form" @submit=${(ev) => c._addItem(ev)}>
          <input id="add-item" placeholder="Add an item" autocomplete="off" enterkeyhint="done"
                 @blur=${(ev) => { if (!ev.target.value.trim()) c._adding = false; }}>
          <button class="add-go" type="submit">Add</button></form>`
        : html`<button class="sh2-add" @click=${() => c._startAdd()}><ha-icon icon="mdi:plus"></ha-icon>Add</button>`}
    </div>`;
}

// an item being edited: its text in a box, Save (Enter) and Delete
async function editItem(c, i) {
  redraw(c, { _tEdit: i.uid, _adding: false });
  await c.updateComplete;
  const f = c.shadowRoot.getElementById("edit-item");
  if (f) { f.focus(); f.select(); }
}
function editRow(c, i) {
  const todo = c._config.todo, done = () => redraw(c, { _tEdit: null });
  const save = (ev) => {
    ev.preventDefault();
    const v = c.shadowRoot.getElementById("edit-item").value.trim();
    if (!v) c._call("todo", "remove_item", { entity_id: todo, item: i.uid });
    else if (v !== i.summary) c._call("todo", "update_item", { entity_id: todo, item: i.uid, rename: v });
    done();
  };
  return html`
    <form class="sh2-edit" @submit=${save}>
      <input id="edit-item" .value=${i.summary} autocomplete="off" enterkeyhint="done">
      <button type="submit" class="add-go" title="Save"><ha-icon icon="mdi:check"></ha-icon></button>
      <button type="button" class="sh2-del" title="Delete" @click=${() => { c._call("todo", "remove_item", { entity_id: todo, item: i.uid }); done(); }}>
        <ha-icon icon="mdi:trash-can-outline"></ha-icon></button>
      <button type="button" class="sh2-x" title="Cancel" @click=${done}><ha-icon icon="mdi:close"></ha-icon></button>
    </form>`;
}

function quickRow(c) {
  const go = (id) => {
    const d = id.split(".")[0];
    c._call(d, ["script", "scene"].includes(d) ? "turn_on" : "toggle", { entity_id: id });
  };
  const timer = c._config.clock && c._st(`timer.${c._config.clock}_timer`);
  return html`
    <div class="h2-qa">
      ${(c._config.tablet_quick || []).map((q) => { if (q.timer) return timer ? html`<button class="qa2 ${timer.state !== "idle" ? "on" : ""}" @click=${() => redraw(c, { _tTimer: true })}>
          <span class="qa2-ico"><ha-icon icon="mdi:timer-outline"></ha-icon></span><span>Timer</span></button>` : nothing;
        const e = c._st(q.entity), on = e && e.state === "on";
        return e ? html`<button class="qa2 ${on ? "on" : ""}" @click=${() => go(q.entity)}>
          <span class="qa2-ico"><ha-icon icon=${q.icon}></ha-icon></span><span>${q.name}</span></button>` : nothing; })}
    </div>`;
}

function timerSheet(c) {
  if (!c._tTimer) return nothing;
  const id = `timer.${c._config.clock}_timer`;
  const start = (m) => {
    c._call("timer", "start", { entity_id: id, duration: `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}:00` });
    redraw(c, { _tTimer: false });
  };
  return html`
    <div class="scrim" @click=${() => redraw(c, { _tTimer: false })}>
      <div class="sheet card t-timer" @click=${(ev) => ev.stopPropagation()}>
        <div class="card-title">Kitchen timer</div>
        <div class="tm-grid">${TIMER_MINUTES.map((m) => html`
          <button class="tm-btn" @click=${() => start(m)}><b>${m < 60 ? m : 1}</b><span>${m < 60 ? "min" : "hour"}</span></button>`)}</div>
      </div>
    </div>`;
}

// the next week, grouped by day, two columns
function calendar(c) {
  const n = new Date(), DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const MON = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const tom = new Date(n); tom.setDate(n.getDate() + 1);
  const dayName = (d) => d.toDateString() === n.toDateString() ? "Today" : d.toDateString() === tom.toDateString() ? "Tomorrow"
    : d.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "short" });
  const out = [];
  let last = null, k = 0;
  for (const e of (c._events || []).filter((x) => c._d(x.end) > n).slice(0, 9)) {
    const s = c._d(e.start), dn = dayName(s < n ? n : s);
    if (dn !== last) { out.push(html`<div class="cl-day">${dn}</div>`); last = dn; }
    const time = e.start.dateTime ? `${c._ampm(s)} – ${c._ampm(c._d(e.end))}` : "All day";
    out.push(html`<div class="td-ev" style="--c:${e.colour || EV_COLOURS[k++ % EV_COLOURS.length]}"><small>${time}</small><b>${e.summary}</b></div>`);
  }
  return html`
    <div class="card today2">
      <div class="td-date"><div class="td-dm">${DAYS[n.getDay()]} <span>${MON[n.getMonth()]}</span></div><div class="td-n">${n.getDate()}</div></div>
      <div class="cl-list">${out.length ? out : html`<div class="muted">Nothing in the next week.</div>`}</div>
    </div>`;
}

function homePage(c) {
  return html`
    <div class="m-home2">
      ${dinnerCard(c)}
      <div class="h2-right">
        <div class="h2-top">${nowTile(c)}${shoppingTile(c)}</div>
        ${quickRow(c)}
        ${calendar(c)}
      </div>
    </div>
    ${popPlayer(c)}${timerSheet(c)}`;
}

// ---------------------------------------------------------------- Rooms

const x2 = (t) => html`<div class="piece rt"><div class="ph-grid one x2">${t}</div></div>`;

function roomHeatPump(c, id) {
  const e = c._st(id);
  if (!e) return nothing;
  const a = e.attributes;
  const setT = (d) => c._call("climate", "set_temperature", { entity_id: id,
    temperature: Math.min(a.max_temp || 30, Math.max(a.min_temp || 16, (Number(a.temperature) || 21) + d)) });
  return html`
    <div class="rm-hp"><div><b>Heat pump</b><span>${cap(e.state)} · ${a.current_temperature}° now</span></div>
      <button class="round small" @click=${() => setT(-0.5)}><ha-icon icon="mdi:minus"></ha-icon></button>
      <b class="rm-hp-t">${a.temperature}°</b>
      <button class="round small" @click=${() => setT(0.5)}><ha-icon icon="mdi:plus"></ha-icon></button></div>`;
}

function roomMedia(c, m) {
  const e = c._st(m.entity);
  if (!e) return nothing;
  const a = e.attributes, pic = a.entity_picture;
  return html`
    <div class="rm-pl ${e.state === "playing" ? "on" : ""}">
      ${pic ? html`<span class="spk-art" style="background-image:url('${pic}')"></span>`
        : html`<span class="spk-ico"><ha-icon icon=${m.icon || "mdi:speaker"}></ha-icon></span>`}
      <span class="spk-t"><b>${m.name}</b><span>${c._title(a) || cap(e.state)}</span></span>
      <button class="round small" @click=${() => c._call("media_player", "media_play_pause", { entity_id: m.entity })}>
        <ha-icon icon=${e.state === "playing" ? "mdi:pause" : "mdi:play"}></ha-icon></button>
    </div>`;
}

function roomsPage(c) {
  const rooms = realRooms(c);
  const r = rooms.find((x) => x.name === c._tRoom) || rooms[0];
  if (!r) return nothing;
  const lights = (r.group ? [{ entity: r.group, name: `All ${r.name}`, icon: "mdi:lightbulb-group" }] : []).concat(r.lights || []);
  const on = (r.lights || []).filter((l) => (c._st(l.entity) || {}).state === "on").length;
  const sec = (title, extra, tiles) => tiles.length ? html`
    <div class="rm-sec"><div class="rm-h">${title}${extra}</div><div class="rm-grid">${tiles}</div></div>` : nothing;
  const air = roomAir(r);
  return html`
    <div class="m-rooms">
      <div class="rm-chips">${rooms.map((x) => html`
        <button class="tab ${x === r ? "on" : ""}" @click=${() => redraw(c, { _tRoom: x.name })}>
          <ha-icon icon=${x.icon}></ha-icon><span>${x.name}</span></button>`)}</div>
      <div class="rm-body">
        <div class="rm-main">
          ${sec("Lights", html`<span class="rm-count">${on} on</span>
              <button class="rm-off" @click=${() => c._call("light", "turn_off", { entity_id: lights.map((l) => l.entity) })}>All off</button>`,
            lights.map((l) => x2(c._lightTile(l))))}
          ${sec("Scenes", nothing, (r.scenes || []).map((s) => x2(c._sceneBtn(s, true))))}
          ${sec("Plugs & plants", nothing, [...(r.switches || []).map((s) => x2(c._switchTile(s))),
            ...(r.plants || []).map((p) => x2(c._plantTile(p)))])}
        </div>
        <div class="rm-side">
          ${r.climate || air.length ? html`<div class="card rm-card"><div class="card-title">Climate</div>
            ${r.climate ? roomHeatPump(c, r.climate) : nothing}
            <div class="rm-air n${air.length}">${air.map((x) => airTile(c, x))}</div></div>` : nothing}
          ${(r.media || []).length ? html`<div class="card rm-card"><div class="card-title">Media</div>
            ${r.media.map((m) => roomMedia(c, m))}</div>` : nothing}
        </div>
      </div>
    </div>`;
}

// ---------------------------------------------------------------- Climate

function outside(c) {
  const w = c._st(c._config.weather);
  if (!w) return nothing;
  const a = w.attributes, cond = c._cond(w), f = c._forecast;
  const inside = (attr) => {
    const vals = realRooms(c).flatMap((r) => roomAir(r)).filter((x) => (x.attr || x.entity).includes(attr))
      .map((x) => num(c, x.entity, x.attr)).filter((v) => v != null);
    return vals.length ? `${Math.round(Math.min(...vals))}–${Math.round(Math.max(...vals))}` : "–";
  };
  return html`
    <div class="card out2" @click=${() => c._open(c._config.weather)}>
      <div class="out2-top"><div class="out2-ico">${c._wxIcon(w.state)}</div>
        <div><div class="out2-t">${c._deg(a.temperature)}</div><div class="out2-c">${cond[1]}</div></div></div>
      <div class="out2-chips">
        ${f ? html`<span><ha-icon icon="mdi:arrow-up"></ha-icon>${Math.round(f.temperature)}°</span>
          <span><ha-icon icon="mdi:arrow-down"></ha-icon>${Math.round(f.templow)}°</span>` : nothing}
        ${a.humidity != null ? html`<span><ha-icon icon="mdi:water-percent"></ha-icon>${a.humidity}%</span>` : nothing}
        ${a.wind_speed != null ? html`<span><ha-icon icon="mdi:weather-windy"></ha-icon>${Math.round(a.wind_speed)} km/h</span>` : nothing}
      </div>
      <div class="out2-fc">${(c._daily || []).slice(1, 6).map((d) => html`
        <div><span>${new Date(d.datetime).toLocaleDateString("en-AU", { weekday: "short" })}</span>
          <div class="fc-ico">${c._wxIcon(d.condition)}</div><b>${Math.round(d.temperature)}°</b><small>${Math.round(d.templow)}°</small></div>`)}</div>
      <div class="out2-in"><span>Inside</span><b>${inside("temperature")}°</b><span>Humidity</span><b>${inside("humidity")}%</b></div>
    </div>`;
}

function heatPump(c) {
  const id = c._config.climate, e = id && c._st(id);
  if (!e) return nothing;
  const a = e.attributes;
  const setT = (d) => c._call("climate", "set_temperature", { entity_id: id,
    temperature: Math.min(a.max_temp || 30, Math.max(a.min_temp || 16, (Number(a.temperature) || 21) + d)) });
  const room = (realRooms(c).find((r) => r.climate === id) || {}).name || "";
  const modes = [["heat", "mdi:fire", "Heat"], ["cool", "mdi:snowflake", "Cool"], ["off", "mdi:power", "Off"]];
  return html`
    <div class="card hp2">
      <div class="hp2-top"><div><div class="hp2-lbl">Heat pump</div>
          <div class="hp2-sub">${room ? `${room} · ` : ""}Target <b class="hp2-tgt">${a.temperature}°</b></div></div>
        <span class="hp2-now">${a.current_temperature}°</span></div>
      <div class="hp2-set">
        <button class="sq" @click=${() => setT(-0.5)}><ha-icon icon="mdi:minus"></ha-icon></button>
        <button class="sq" @click=${() => setT(0.5)}><ha-icon icon="mdi:plus"></ha-icon></button></div>
      <div class="hp2-modes">${modes.map(([m, i, n]) => html`
        <button class="chip ${e.state === m ? "on" : ""}" @click=${() => c._call("climate", "set_hvac_mode", { entity_id: id, hvac_mode: m })}>
          <ha-icon icon=${i}></ha-icon>${n}</button>`)}</div>
    </div>`;
}

function climatePage(c) {
  return html`
    <div class="m-cl2">
      <div class="m-col">${outside(c)}${heatPump(c)}</div>
      <div class="rooms2">${realRooms(c).slice(0, 4).map((r) => { const air = roomAir(r);
        return html`<div class="card rc2"><div class="rc2-head"><ha-icon icon=${r.icon}></ha-icon><span>${r.name}</span></div>
          <div class="rc2-grid n${air.length}">${air.map((x) => airTile(c, x))}</div></div>`; })}</div>
    </div>`;
}

// ---------------------------------------------------------------- Media

function hero(c, p) {
  const e = c._st(p.entity), a = e.attributes, pic = a.entity_picture;
  const v = p.entity === c._config.tablet_tv ? video(c, a) : null;
  const app = a.app_name || a.source || "";
  const top = html`
    <div class="hero-top"><span class="hero-tag"><ha-icon icon=${p.icon}></ha-icon>${p.name}${app ? ` · ${app}` : ""}</span>
      <span class="hero-state">${e.state === "playing" ? html`<ha-icon icon="mdi:equalizer"></ha-icon>Playing` : cap(e.state)}</span></div>`;
  // TV and films: Plex's background with its logo bottom left, as on the Echo Hub
  if (v) {
    return html`
      <div class="card hero vid"><div class="hero-bg" style="background-image:url('${v.bg || pic}')"></div>${top}
        <div class="hero-text">
          ${v.logo ? html`<img class="hero-logo" src=${v.logo}>` : nothing}
          ${v.ep || !v.logo ? html`<div class="hero-title">${v.ep ? v.ep.t : v.name}</div>` : nothing}
          ${v.ep ? html`<div class="hero-sub">${v.name} · ${v.ep.s ? `Season ${v.ep.s}, ` : ""}Episode ${v.ep.e}</div>` : nothing}
        </div></div>`;
  }
  // music: the album cover beside the song and artist, over a blur of the cover
  if (pic && (a.media_artist || a.media_album_name)) {
    return html`
      <div class="card hero mus"><div class="hero-bg" style="background-image:url('${pic}')"></div>${top}
        <div class="mus-row"><span class="mus-cover" style="background-image:url('${pic}')"></span>
          <div class="hero-text"><div class="hero-title">${a.media_title}</div><div class="hero-sub">${a.media_artist || ""}</div></div></div></div>`;
  }
  return html`
    <div class="card hero ${pic ? "" : "noart"}"><div class="hero-bg" style=${pic ? `background-image:url('${pic}')` : ""}></div>${top}
      <div class="hero-text"><div class="hero-title">${c._title(a) || (["off", "standby"].includes(e.state) ? "Off" : "Nothing playing")}</div>
        ${c._artist(a) ? html`<div class="hero-sub">${c._artist(a)}</div>` : nothing}</div></div>`;
}

function controls(c, p) {
  const e = c._st(p.entity), a = e.attributes, vid = volEntity(c, p.entity), va = (c._st(vid) || e).attributes;
  const mp = (svc) => c._call("media_player", svc, { entity_id: p.entity });
  const step = (d) => c._call("media_player", "volume_set", { entity_id: vid,
    volume_level: Math.min(1, Math.max(0, Math.round(((va.volume_level || 0) + d) * 100) / 100)) });
  const dur = a.media_duration || 0;
  let pos = a.media_position || 0;
  if (e.state === "playing" && a.media_position_updated_at) pos += (Date.now() - new Date(a.media_position_updated_at).getTime()) / 1000;
  pos = Math.max(0, dur ? Math.min(dur, pos) : pos);
  const t = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  return html`
    <div class="card ctl2">
      ${dur ? html`<div class="ctl2-prog"><span>${t(pos)}</span>${wave(pos / dur, e.state === "playing", "ctl2-track")}<span>${t(dur)}</span></div>` : nothing}
      <div class="ctl2-row">
        <button class="sp-pill" @click=${() => redraw(c, { _tPick: true })}><ha-icon icon=${p.icon}></ha-icon><span>${p.name}</span><ha-icon icon="mdi:chevron-down"></ha-icon></button>
        <div class="pp-ctrl ctl2-mid">
          <button class="round small" @click=${() => mp("media_previous_track")}><ha-icon icon="mdi:skip-previous"></ha-icon></button>
          <button class="round play" @click=${() => mp("media_play_pause")}><ha-icon icon=${e.state === "playing" ? "mdi:pause" : "mdi:play"}></ha-icon></button>
          <button class="round small" @click=${() => mp("media_next_track")}><ha-icon icon="mdi:skip-next"></ha-icon></button></div>
        ${va.volume_level != null ? html`<div class="ctl2-vol">
          <button class="round small" @click=${() => step(-0.02)}><ha-icon icon="mdi:minus"></ha-icon></button>
          <b>${Math.round(va.volume_level * 100)}%</b>
          <button class="round small" @click=${() => step(0.02)}><ha-icon icon="mdi:plus"></ha-icon></button></div>` : html`<span></span>`}
      </div>
    </div>`;
}

function mediaPage(c) {
  const ps = players(c);
  if (!ps.length) return nothing;
  const act = ps.find((p) => p.entity === c._tAct) || ps.find((p) => live(c, p.entity)) || ps[0];
  const pick = (id) => redraw(c, { _tAct: id, _tPick: false });
  const what = (e) => { const v = e.entity_id === c._config.tablet_tv && video(c, e.attributes);
    return v && v.ep ? `${v.ep.t} · ${v.name}` : v ? v.name : what0(e); };
  const what0 = (e) => c._title(e.attributes) ? c._title(e.attributes) + (c._artist(e.attributes) ? ` · ${c._artist(e.attributes)}` : "") : cap(e.state);
  const pl = c._playlists();
  return html`
    <div class="m-media2">
      <div class="m-col">${hero(c, act)}${controls(c, act)}</div>
      <div class="m-col">
        <div class="card spk-card"><div class="card-title">Playing around the house</div>
          ${ps.map((p) => { const e = c._st(p.entity), a = e.attributes, vol = (c._st(volEntity(c, p.entity)) || e).attributes.volume_level;
            return html`<button class="spk ${p === act ? "on" : ""}" @click=${() => pick(p.entity)}>
              ${a.entity_picture ? html`<span class="spk-art" style="background-image:url('${a.entity_picture}')"></span>`
                : html`<span class="spk-ico"><ha-icon icon=${p.icon}></ha-icon></span>`}
              <span class="spk-t"><b>${p.name}</b><span>${what(e)}</span></span>
              <span class="spk-v">${vol != null ? `${Math.round(vol * 100)}%` : ""}</span>
              <span class="spk-eqc">${live(c, p.entity) ? bars() : nothing}</span></button>`; })}
        </div>
        ${pl === nothing ? nothing : html`<div class="card bed-card bed-pl m-pl">${pl}</div>`}
      </div>
    </div>
    ${c._tPick ? html`
      <div class="scrim" @click=${() => redraw(c, { _tPick: false })}>
        <div class="sheet card" @click=${(ev) => ev.stopPropagation()}>
          <div class="card-title">Control</div>
          ${ps.map((p) => { const e = c._st(p.entity);
            return html`<button class="sheet-row ${p === act ? "on" : ""}" @click=${() => pick(p.entity)}><ha-icon icon=${p.icon}></ha-icon>
              <div class="sheet-text"><div class="sheet-name">${p.name}</div><div class="muted">${what(e)}</div></div>
              ${p === act ? html`<ha-icon class="tick" icon="mdi:check"></ha-icon>` : nothing}</button>`; })}
        </div>
      </div>` : nothing}`;
}

// ---------------------------------------------------------------- Recipes

// Norish imports some methods as "**Heading:** the same text again"; keep just the text
const cleanStep = (s) => {
  const m = String(s).match(/^\*\*(.+?):?\*\*\s*(.*)$/s);
  if (!m) return s;
  const head = m[1].replace(/[:.]+$/, "").trim(), rest = m[2].trim();
  return rest.toLowerCase().startsWith(head.toLowerCase()) ? rest : `${head}. ${rest}`;
};

function recipeSheet(c) {
  const d = c._recipe, L = c._lib, id = d.id, plan = c._tPlan || {}, r = L.recipes[id] || {};
  const meta = [];
  if (d.total || d.prep || d.cook) meta.push(`${d.total || (d.prep || 0) + (d.cook || 0)} min`);
  if (d.servings) meta.push(`Serves ${d.servings}`);
  const today = ymd(new Date());
  const planned = Object.keys(plan).filter((k) => plan[k] === id && k >= today).sort();
  const t0 = new Date(); t0.setHours(12, 0, 0, 0);
  const days = [];
  for (let i = 0; i < 14; i++) { const x = new Date(t0); x.setDate(t0.getDate() + i); days.push(x); }
  const sunday = (7 - t0.getDay()) % 7;   // the rest of this week, Mon-Sun like the planner row
  const row = (x, i) => { const k = ymd(x), cur = plan[k] && L.recipes[plan[k]], mine = plan[k] === id;
    return html`<button class="sheet-row ${mine ? "on" : ""}" @click=${() => { setDinner(c, k, mine ? null : id); redraw(c, { _tAddDay: false }); }}>
      <ha-icon icon=${mine ? "mdi:check-circle" : cur ? "mdi:swap-horizontal" : "mdi:plus-circle-outline"}></ha-icon>
      <div class="sheet-text"><div class="sheet-name">${i === 0 ? "Tonight" : i === 1 ? "Tomorrow" : x.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "short" })}</div>
        <div class="muted">${mine ? "Planned · tap to remove" : cur ? `Replaces ${cur.n}` : "Nothing planned"}</div></div></button>`; };
  return html`
    <div class="recipe">
      <div class="recipe-side">
        <button class="back" @click=${() => redraw(c, { _recipe: null, _tAddDay: false })}><ha-icon icon="mdi:close"></ha-icon></button>
        <button class="heart plan-btn ${planned.length ? "on" : ""}" title="Add to a day" @click=${() => redraw(c, { _tAddDay: true })}>
          <ha-icon icon=${planned.length ? "mdi:calendar-check" : "mdi:plus"}></ha-icon></button>
        <button class="heart ${c._isFav(id) ? "on" : ""}" title="Favourite" @click=${() => c._toggleFav(id)}>
          <ha-icon icon=${c._isFav(id) ? "mdi:heart" : "mdi:heart-outline"}></ha-icon></button>
        <div class="recipe-photo" style=${r.img ? `background-image:url('${c._img(id)}')` : ""}></div>
        <h2>${d.name || r.n}</h2>
        ${meta.length || planned.length ? html`<div class="muted">${[...meta, ...planned.map((k) => `Planned ${new Date(`${k}T12:00`).toLocaleDateString("en-AU", { weekday: "short" })}`)].join(" · ")}</div>` : nothing}
        ${d.ingredients ? html`<div class="card-title">Ingredients</div><ul class="ings">${d.ingredients.map((i) => html`<li>${i}</li>`)}</ul>` : nothing}
      </div>
      <div class="recipe-main">
        ${d.loading ? html`<div class="muted">Loading…</div>` : d.error ? html`<div class="muted">Couldn't load this recipe.</div>` : html`
          <div class="card-title">Method</div><ol class="steps">${d.steps.map((s) => html`<li><span>${cleanStep(s)}</span></li>`)}</ol>`}
      </div>
    </div>
    ${c._tAddDay ? html`
      <div class="scrim" @click=${() => redraw(c, { _tAddDay: false })}>
        <div class="sheet card addday" @click=${(ev) => ev.stopPropagation()}>
          <div class="card-title">Add to dinner</div>
          <div class="addday-body"><div class="pk-h">This week</div>${days.slice(0, sunday + 1).map((x, i) => row(x, i))}
            <div class="pk-h">Next week</div>${days.slice(sunday + 1, sunday + 8).map((x, i) => row(x, i + sunday + 1))}</div>
        </div>
      </div>` : nothing}`;
}

// choose a day's dinner: favourites first, then everything A-Z, with a search
function dayPicker(c, L) {
  const k = c._tDay, d = new Date(`${k}T12:00`), q = (c._tQ || "").toLowerCase(), plan = c._tPlan || {};
  const close = () => redraw(c, { _tDay: null, _tQ: "" });
  const choose = (id) => { setDinner(c, k, id); close(); };
  const all = Object.keys(L.recipes).filter((id) => !L.favorites.includes(id)).sort((a, b) => L.recipes[a].n.localeCompare(L.recipes[b].n));
  const card = (id) => { const r = L.recipes[id];
    return r && (!q || r.n.toLowerCase().includes(q)) ? html`<button class="pk-card ${plan[k] === id ? "on" : ""}" @click=${() => choose(id)}>
      <span class="pk-img" style="background-image:url('${c._img(id)}')"></span><b>${r.n}</b><small>${r.t ? `${r.t} min` : ""}</small></button>` : nothing; };
  return html`
    <div class="scrim" @click=${close}>
      <div class="sheet card pk" @click=${(ev) => ev.stopPropagation()}>
        <div class="pk-head"><div class="card-title">Dinner · ${d.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}</div>
          <input class="pk-q" placeholder="Search recipes" .value=${c._tQ || ""} @input=${(ev) => redraw(c, { _tQ: ev.target.value })}>
          ${plan[k] ? html`<button class="pk-clear" @click=${() => { setDinner(c, k, null); close(); }}>Clear</button>` : nothing}</div>
        <div class="pk-body">${q ? nothing : html`<div class="pk-h">Favourites</div>`}<div class="pk-grid">${L.favorites.map(card)}</div>
          ${q ? nothing : html`<div class="pk-h">All recipes</div>`}<div class="pk-grid">${all.map(card)}</div></div>
      </div>
    </div>`;
}

function recipesPage(c) {
  c._loadLib();
  const L = c._lib;
  if (!L) return html`<div class="soon card"><div class="muted">Loading recipes…</div></div>`;
  if (L.error) return html`<div class="soon card"><ha-icon icon="mdi:cloud-off-outline"></ha-icon><div class="muted">Recipes haven't synced to Home Assistant yet.</div></div>`;
  if (c._recipe) return recipeSheet(c);
  const book = c._book && L.cookbooks.find((b) => b.id === c._book);
  if (book) {
    return html`<div class="m-rec"><div class="lib-head">
        <button class="back" @click=${() => { c._book = null; }}><ha-icon icon="mdi:chevron-left"></ha-icon></button>
        <h1>${book.title}</h1><span class="muted">${book.members.length} recipes</span></div>
      <div class="book-grid">${book.members.map((id) => c._recipeCard(id))}</div></div>`;
  }
  const plan = c._tPlan || {}, t0 = new Date(), today = ymd(t0);
  const mon = new Date(t0); mon.setDate(t0.getDate() - ((t0.getDay() + 6) % 7));
  const days = [];
  for (let i = 0; i < 7; i++) { const d = new Date(mon); d.setDate(mon.getDate() + i); days.push(d); }
  const day = (d) => { const k = ymd(d), id = plan[k], r = id && L.recipes[id], isT = k === today;
    return html`<button class="mp-day ${isT ? "today" : ""} ${c._tDay === k ? "sel" : ""} ${k < today ? "past" : ""}" @click=${() => redraw(c, { _tDay: k })}>
      <span class="mp-d">${isT ? "Tonight" : d.toLocaleDateString("en-AU", { weekday: "short" })}<small>${d.getDate()}</small></span>
      ${r ? html`<span class="mp-img" style="background-image:url('${c._img(id)}')"></span><span class="mp-n">${r.n}</span><span class="mp-m">Dinner${r.t ? ` · ${r.t} min` : ""}</span>`
        : html`<span class="mp-empty"><ha-icon icon="mdi:plus"></ha-icon><span>${isT ? "Pick dinner" : "Nothing planned"}</span></span>`}
    </button>`; };
  const tab = c._tShelf || "fav";
  const tabs = [["fav", "Favourites", "mdi:heart-outline", L.favorites.length], ["new", "Recently added", "mdi:clock-outline", L.recent.length],
                ["books", "Cookbooks", "mdi:book-open-variant", L.cookbooks.length]];
  const items = tab === "books" ? L.cookbooks.map((b) => c._bookCard(b)) : (tab === "new" ? L.recent : L.favorites).map((id) => c._recipeCard(id));
  const setTab = (id) => { redraw(c, { _tShelf: id }); const row = c.shadowRoot.querySelector(".rec-tabs .shelf-row"); if (row) row.scrollLeft = 0; };
  return html`
    <div class="m-rec">
      <div class="lib-head"><h1>Recipes</h1></div>
      <section class="shelf"><div class="card-title">This week's dinners <span class="muted mp-src">synced with Norish</span></div>
        <div class="mp-row">${days.map(day)}</div></section>
      <section class="shelf rec-tabs">
        <div class="rt-chips">${tabs.map(([id, name, icon, n]) => html`
          <button class="tab ${tab === id ? "on" : ""}" @click=${() => setTab(id)}><ha-icon icon=${icon}></ha-icon><span>${name}</span><small>${n}</small></button>`)}</div>
        <div class="shelf-row">${items}</div>
      </section>
      ${c._tDay ? dayPicker(c, L) : nothing}
    </div>`;
}

// ---------------------------------------------------------------- entry

export function tabletPage(c) {
  ensureFeeds(c);
  switch (c._page) {
    case "rooms": return roomsPage(c);
    case "climate": return climatePage(c);
    case "media": return mediaPage(c);
    case "recipes": return recipesPage(c);
    default: return homePage(c);
  }
}

// everything under .tablet, so the other screens built from this card are untouched
export const TABLET_CSS = css`
  /* home */
  .tablet .m-home2 { display:grid; grid-template-columns:360px minmax(0,1fr); gap:18px; height:100%; min-height:0; }
  .tablet .m-col { display:flex; flex-direction:column; gap:18px; min-height:0; min-width:0; }
  .tablet .dinner { padding:30px 26px 22px; display:flex; flex-direction:column; min-height:0; }
  .tablet .dn-hello { font-size:30px; line-height:1.2; letter-spacing:-0.01em; } .tablet .dn-hello b { color:var(--accent); font-weight:700; }
  .tablet .dn-rule { height:1px; background:var(--track); margin:22px 10px; }
  .tablet .dn-stack { flex:1; display:flex; flex-direction:column; gap:12px; min-height:0; }
  .tablet .dn-card { border:0; font:inherit; text-align:left; color:#fff; border-radius:24px; padding:16px; display:grid; grid-template-columns:1fr 120px;
    gap:12px; align-items:center; overflow:hidden; min-height:0; }
  .tablet .dn-card.d0 { background:#1f6b5c; flex:1.3; } .tablet .dn-card.d1 { background:#284a7a; flex:1; }
  .tablet .dn-img { align-self:stretch; border-radius:18px; background-size:cover; background-position:center; min-height:90px; }
  .tablet .dn-t small { display:block; font-size:12px; opacity:0.8; }
  .tablet .dn-t b { font-size:19px; line-height:1.15; margin:4px 0; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
  .tablet .dn-plan { border:0; font:inherit; font-weight:700; color:var(--accent); background:var(--inset); border-radius:16px; height:48px;
    display:flex; align-items:center; justify-content:center; gap:8px; flex:none; }
  .tablet .h2-right { display:grid; grid-template-rows:1fr auto 1fr; gap:18px; min-height:0; min-width:0; }
  .tablet .h2-top { display:grid; grid-template-columns:1.7fr 1fr; gap:18px; min-height:0; }
  /* what's on: label over the art, the logo sitting bottom left on it (as the Echo Hub's TV & Video) */
  .tablet .nowtile { border:0; font:inherit; color:var(--ink); text-align:left; padding:14px 16px 16px; display:flex; flex-direction:column; gap:10px; min-height:0; overflow:hidden; }
  .tablet .now-lbl { font-size:13px; color:var(--muted); font-weight:700; }
  .tablet .now-art { position:relative; flex:1; min-height:0; border-radius:18px; overflow:hidden; background-size:cover; background-position:center top; display:flex; align-items:flex-end; }
  .tablet .now-art::after { content:""; position:absolute; inset:0; background:linear-gradient(200deg, transparent 45%, rgba(0,0,0,0.55)); }
  .tablet .now-logo { position:relative; z-index:1; max-width:52%; max-height:46%; object-fit:contain; object-position:left bottom; margin:0 0 16px 18px;
    filter:drop-shadow(0 2px 10px rgba(0,0,0,0.55)); }
  .tablet .now-cap { position:relative; z-index:1; margin:0 0 16px 18px; color:#fff; text-shadow:0 2px 12px rgba(0,0,0,0.6); }
  .tablet .now-cap b { font-family:var(--display); font-size:30px; letter-spacing:-0.02em; line-height:1.1; }
  .tablet .now-music { flex:1; min-height:0; display:flex; align-items:center; gap:18px; }
  .tablet .now-cover { height:100%; max-height:200px; aspect-ratio:1; border-radius:16px; background-size:cover; background-position:center; flex:none; box-shadow:var(--shadow); }
  .tablet .now-cover.none { display:grid; place-items:center; background:var(--inset); color:var(--muted); box-shadow:none; } .tablet .now-cover.none ha-icon { --mdc-icon-size:64px; }
  .tablet .now-text { min-width:0; } .tablet .now-text b { display:block; font-family:var(--display); font-size:28px; line-height:1.1; letter-spacing:-0.02em; }
  .tablet .now-text span { display:block; color:var(--muted); font-size:17px; margin-top:6px; }
  .tablet .now-empty { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; color:var(--muted); font-weight:700; }
  .tablet .now-empty ha-icon { --mdc-icon-size:40px; }
  .tablet .shop2 { padding:16px 18px; display:flex; flex-direction:column; gap:6px; min-height:0; overflow:hidden; }
  .tablet .sh2-list { flex:1; min-height:0; overflow-y:auto; scrollbar-width:none; display:flex; flex-direction:column; }
  .tablet .sh2-i { display:flex; align-items:center; gap:4px; font-size:18px; }
  .tablet .sh2-i .box { width:22px; height:22px; border-radius:7px; border:2px solid var(--muted); background:none; flex:none; padding:0; margin:5px 8px 5px 0; }
  .tablet .sh2-name { flex:1; min-width:0; border:0; background:none; font:inherit; color:var(--ink); text-align:left; padding:4px 0;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .tablet .sh2-edit { display:flex; gap:6px; padding:3px 0; }
  .tablet .sh2-edit input { flex:1; min-width:0; height:40px; border-radius:12px; border:2px solid var(--accent); background:var(--inset); color:var(--ink); font:inherit; padding:0 10px; }
  .tablet .sh2-edit button { border:0; border-radius:12px; width:40px; height:40px; display:grid; place-items:center; flex:none; padding:0; }
  .tablet .sh2-edit .add-go { color:#fff; background:var(--accent); } .tablet .sh2-del { color:#e5484d; background:var(--inset); }
  .tablet .sh2-x { color:var(--muted); background:var(--inset); }
  .tablet .sh2-empty { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; color:var(--muted); font-weight:700; }
  .tablet .sh2-empty ha-icon { --mdc-icon-size:34px; color:#3f8f63; }
  .tablet .sh2-add { border:0; font:inherit; font-weight:700; color:var(--accent); background:var(--inset); border-radius:14px; height:40px;
    display:flex; align-items:center; justify-content:center; gap:6px; flex:none; }
  .tablet .sh2-form { display:flex; gap:8px; flex:none; }
  .tablet .sh2-form input { flex:1; min-width:0; height:40px; border-radius:12px; border:0; background:var(--inset); color:var(--ink); font:inherit; padding:0 12px; }
  .tablet .sh2-form .add-go { border:0; border-radius:12px; padding:0 14px; font:inherit; font-weight:700; color:#fff; background:var(--accent); }
  .tablet .h2-qa { display:grid; grid-auto-flow:column; grid-auto-columns:calc((100% - 72px) / 7); gap:12px; overflow-x:auto; scrollbar-width:none;
    overscroll-behavior-x:contain; scroll-snap-type:x mandatory; padding:14px 6px; margin:-14px -6px; }
  .tablet .h2-qa::-webkit-scrollbar { display:none; } .tablet .qa2 { scroll-snap-align:start; }
  .tablet .qa2 { border:0; font:inherit; font-weight:700; font-size:13px; color:var(--ink); background:var(--card); box-shadow:var(--shadow); border-radius:20px;
    height:92px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; }
  .tablet .qa2-ico { width:40px; height:40px; border-radius:50%; display:grid; place-items:center; background:var(--inset); color:var(--muted); }
  .tablet .qa2.on .qa2-ico { background:#f39a43; color:#fff; } .tablet .qa2.on { color:#f39a43; }
  .tablet .today2 { display:grid; grid-template-columns:180px minmax(0,1fr); gap:10px; padding:18px 24px; min-height:0; overflow:hidden; align-items:center; }
  .tablet .td-date { text-align:center; } .tablet .td-dm { font-weight:800; font-size:20px; letter-spacing:0.04em; } .tablet .td-dm span { color:var(--accent); }
  .tablet .td-n { font-family:var(--display); font-weight:800; font-size:96px; line-height:0.95; letter-spacing:-0.04em; }
  .tablet .cl-list { display:grid; grid-template-columns:1fr 1fr; column-gap:28px; row-gap:8px; align-content:center; min-width:0; }
  .tablet .cl-day { grid-column:1 / -1; font-size:13px; font-weight:800; color:var(--muted); text-transform:uppercase; letter-spacing:0.06em; margin-top:4px; }
  .tablet .td-ev { border-left:4px solid var(--c); padding-left:12px; min-width:0; }
  .tablet .td-ev small { display:block; font-size:12px; color:var(--c); font-weight:700; }
  .tablet .td-ev b { display:block; font-size:18px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .tablet .sheet.t-pop { width:min(560px, 90vw); }
  .tablet .sheet.t-timer { width:min(520px, 90vw); }
  .tablet .tm-grid { display:grid; grid-template-columns:repeat(3, 1fr); gap:12px; margin-top:12px; }
  .tablet .tm-btn { border:0; font:inherit; color:var(--ink); background:var(--inset); border-radius:20px; height:84px; display:flex; flex-direction:column; align-items:center; justify-content:center; }
  .tablet .tm-btn b { font-family:var(--display); font-size:30px; line-height:1; } .tablet .tm-btn span { color:var(--muted); font-size:13px; font-weight:700; }

  /* rooms: the chips sit up beside the clock */
  .tablet .m-rooms { height:100%; display:flex; flex-direction:column; gap:16px; min-height:0; margin-top:-58px; }
  .tablet .rm-chips { display:flex; gap:10px; }
  .tablet .rm-body { flex:1; min-height:0; display:grid; grid-template-columns:minmax(0,1fr) 350px; gap:18px; }
  .tablet .rm-main { min-height:0; overflow-y:auto; scrollbar-width:none; display:flex; flex-direction:column; gap:14px; }
  .tablet .rm-h { display:flex; align-items:center; gap:10px; font-weight:700; font-size:17px; margin:0 2px 8px; }
  .tablet .rm-count { background:color-mix(in srgb, var(--accent) 14%, transparent); color:var(--accent); font-size:13px; padding:3px 9px; border-radius:999px; }
  .tablet .rm-off { margin-left:auto; border:0; font:inherit; font-weight:700; font-size:14px; color:var(--ink); background:var(--card); box-shadow:var(--shadow); padding:8px 16px; border-radius:999px; }
  .tablet .rm-grid { display:grid; grid-template-columns:repeat(5, minmax(0,1fr)); gap:12px; }
  .tablet .rt { aspect-ratio:1; min-width:0; } .tablet .rt .ph-grid { height:100%; } .tablet .rt .ph-grid > .tile { height:100%; box-sizing:border-box; }
  .tablet .rm-side { display:flex; flex-direction:column; gap:18px; min-height:0; }
  .tablet .rm-card { padding:16px 18px; display:flex; flex-direction:column; gap:10px; }
  .tablet .rm-card:first-child { flex:1; min-height:0; }
  .tablet .rm-air { flex:1; display:grid; grid-template-columns:1fr 1fr; gap:10px; min-height:0; }
  .tablet .rm-air.n4 { grid-template-rows:1fr 1fr; }
  .tablet .rm-air .air-tile { padding:12px 14px; border-radius:18px; box-shadow:none; }
  .tablet .rm-air .air-ico { width:34px; height:34px; } .tablet .rm-air .air-ico ha-icon { --mdc-icon-size:18px; }
  .tablet .rm-air .air-val { font-size:32px; } .tablet .rm-air .air-name { font-size:14px; } .tablet .rm-air .air-q { font-size:13px; }
  .tablet .rm-hp { display:grid; grid-template-columns:1fr auto auto auto; align-items:center; gap:10px; background:var(--inset); border-radius:18px; padding:10px 12px; }
  .tablet .rm-hp div b { display:block; } .tablet .rm-hp div span { font-size:13px; color:var(--muted); }
  .tablet .rm-hp-t { font-size:22px; min-width:40px; text-align:center; }
  .tablet .rm-pl { display:flex; align-items:center; gap:12px; padding:6px 0; } .tablet .rm-pl .round.small { width:44px; height:44px; flex:none; }

  /* climate */
  .tablet .m-cl2 { display:grid; grid-template-columns:340px minmax(0,1fr); gap:18px; height:100%; min-height:0; }
  .tablet .rooms2 { display:grid; grid-template-columns:1fr 1fr; grid-template-rows:1fr 1fr; gap:18px; min-height:0; }
  .tablet .rc2 { padding:16px; display:flex; flex-direction:column; gap:12px; min-height:0; }
  .tablet .rc2-head { display:flex; align-items:center; gap:10px; font-weight:700; font-size:18px; } .tablet .rc2-head ha-icon { color:var(--muted); --mdc-icon-size:22px; }
  .tablet .rc2-grid { flex:1; display:grid; grid-template-columns:1fr 1fr; gap:10px; min-height:0; }
  .tablet .rc2-grid.n4 { grid-template-rows:1fr 1fr; } .tablet .rc2-grid.n2 { grid-template-rows:1fr; }
  .tablet .rc2 .air-tile { padding:12px 14px; border-radius:18px; box-shadow:none; }
  .tablet .rc2 .air-ico { width:34px; height:34px; } .tablet .rc2 .air-ico ha-icon { --mdc-icon-size:18px; }
  .tablet .rc2 .air-val { font-size:34px; } .tablet .rc2 .air-val small { font-size:13px; }
  .tablet .rc2 .air-name { font-size:14px; } .tablet .rc2 .air-q { font-size:13px; }
  .tablet .rc2-grid.n2 .air-val { font-size:40px; align-self:start; } .tablet .rc2-grid.n2 .air-ico { width:44px; height:44px; }
  .tablet .rc2-grid.n2 .air-name { font-size:17px; } .tablet .rc2-grid.n2 .air-q { font-size:15px; }
  .tablet .out2 { padding:20px 22px; display:flex; flex-direction:column; gap:14px; flex:1; min-height:0; }
  .tablet .out2-top { display:flex; align-items:center; gap:16px; } .tablet .out2-ico { width:72px; height:72px; }
  .tablet .out2-ico *, .tablet .fc-ico * { width:100% !important; height:100% !important; }
  .tablet .out2-t { font-family:var(--display); font-weight:700; font-size:56px; line-height:1; letter-spacing:-0.03em; }
  .tablet .out2-c { font-weight:700; color:var(--muted); margin-top:4px; }
  .tablet .out2-chips { display:flex; flex-wrap:wrap; gap:8px; }
  .tablet .out2-chips span { display:flex; align-items:center; gap:4px; background:var(--inset); border-radius:12px; padding:6px 10px; font-weight:700; font-size:14px; }
  .tablet .out2-chips ha-icon { --mdc-icon-size:16px; color:var(--muted); }
  .tablet .out2-fc { display:grid; grid-template-columns:repeat(5,1fr); gap:6px; text-align:center; font-size:13px; }
  .tablet .out2-fc span { color:var(--muted); font-weight:700; } .tablet .fc-ico { width:36px; height:36px; margin:6px auto; }
  .tablet .out2-fc b { display:block; font-size:16px; } .tablet .out2-fc small { color:var(--muted); }
  .tablet .out2-in { margin-top:auto; display:grid; grid-template-columns:auto 1fr; gap:4px 12px; padding-top:12px; border-top:1px solid var(--track); font-size:15px; }
  .tablet .out2-in span { color:var(--muted); } .tablet .out2-in b { text-align:right; }
  .tablet .hp2 { padding:18px 20px; display:flex; flex-direction:column; gap:14px; }
  .tablet .hp2-top { display:flex; align-items:flex-start; justify-content:space-between; } .tablet .hp2-lbl { font-weight:700; font-size:17px; }
  .tablet .hp2-sub { color:var(--muted); font-size:17px; margin-top:4px; } .tablet .hp2-tgt { color:var(--ink); }
  .tablet .hp2-now { font-family:var(--display); font-weight:700; font-size:40px; line-height:1; letter-spacing:-0.02em; }
  .tablet .hp2-set { display:flex; gap:12px; }
  .tablet .hp2-set .sq { flex:1; height:60px; border:0; border-radius:20px; background:var(--inset); color:var(--ink); display:grid; place-items:center; font:inherit; }
  .tablet .hp2-set .sq ha-icon { --mdc-icon-size:28px; } .tablet .hp2-set .sq:active { background:var(--track); }
  .tablet .hp2-modes { display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; }
  .tablet .chip { border:0; font:inherit; font-weight:700; font-size:13px; display:flex; align-items:center; justify-content:center; gap:6px; padding:0 6px; height:48px;
    border-radius:14px; background:var(--inset); color:var(--ink); } .tablet .chip ha-icon { --mdc-icon-size:18px; }
  .tablet .chip.on { background:var(--accent); color:#fff; }
  /* pop-ups open in the middle of the screen, not as a bottom sheet */
  .tablet .pop-scrim { display:grid !important; place-items:center !important; }
  .tablet .pop-scrim .sheet.pop { position:relative !important; inset:auto !important; transform:none !important; width:760px !important; max-width:none !important;
    max-height:620px; border-radius:30px !important; margin:0 !important; }
  .tablet .pop-scrim .grabber { display:none; }

  /* media */
  .tablet .m-media2 { display:grid; grid-template-columns:1.45fr 1fr; gap:18px; height:100%; min-height:0; }
  .tablet .hero { position:relative; overflow:hidden; flex:1; min-height:0; padding:22px 24px; display:flex; flex-direction:column; justify-content:space-between; color:#fff; border:0; background:#111; }
  .tablet .hero-bg { position:absolute; inset:0; background-size:cover; background-position:center; background-repeat:no-repeat; }
  .tablet .hero-bg::after { content:""; position:absolute; inset:0; background:linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.78) 100%); }
  .tablet .hero.noart .hero-bg { background:linear-gradient(140deg, #1f5eff, #8e5cf0); }
  .tablet .hero.vid .hero-bg { background-position:center top; }
  .tablet .hero.vid .hero-bg::after { background:linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 28%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%),
    linear-gradient(90deg, rgba(0,0,0,0.45), rgba(0,0,0,0) 60%); }
  .tablet .hero.mus .hero-bg { filter:blur(48px) saturate(1.4) brightness(0.65); transform:scale(1.3); }
  .tablet .hero.mus .hero-bg::after { background:linear-gradient(180deg, rgba(0,0,0,0.2), rgba(0,0,0,0.45)); }
  .tablet .hero-top, .tablet .hero-text, .tablet .mus-row { position:relative; z-index:1; }
  .tablet .hero-top { display:flex; justify-content:space-between; align-items:center; }
  .tablet .hero-tag, .tablet .hero-state { display:flex; align-items:center; gap:6px; font-weight:700; font-size:14px; background:rgba(0,0,0,0.35);
    backdrop-filter:blur(12px); padding:7px 12px; border-radius:999px; }
  .tablet .hero-tag ha-icon, .tablet .hero-state ha-icon { --mdc-icon-size:16px; }
  .tablet .hero-title { font-family:var(--display); font-weight:700; font-size:44px; line-height:1.05; letter-spacing:-0.02em; text-shadow:0 2px 18px rgba(0,0,0,0.4); }
  .tablet .hero-sub { font-size:18px; opacity:0.85; margin-top:6px; }
  .tablet .hero-logo { display:block; max-width:55%; max-height:150px; object-fit:contain; object-position:left bottom; margin-bottom:14px;
    filter:drop-shadow(0 2px 12px rgba(0,0,0,0.55)); }
  .tablet .mus-row { flex:1; display:flex; align-items:center; gap:32px; min-height:0; padding-top:16px; }
  .tablet .mus-cover { flex:none; height:min(100%, 420px); aspect-ratio:1; border-radius:20px; background-size:cover; background-position:center; box-shadow:0 18px 48px rgba(0,0,0,0.45); }
  .tablet .mus-row .hero-text { min-width:0; }
  .tablet .ctl2 { padding:16px 20px; display:flex; flex-direction:column; gap:12px; }
  .tablet .ctl2-prog { display:flex; align-items:center; gap:12px; font-size:13px; color:var(--muted); font-variant-numeric:tabular-nums; }
  .tablet .ctl2-track { flex:1; }
  .tablet .ctl2-row { display:grid; grid-template-columns:minmax(0,1fr) auto minmax(0,1fr); align-items:center; gap:14px; }
  .tablet .sp-pill { justify-self:start; border:0; font:inherit; font-weight:700; color:var(--accent); background:color-mix(in srgb, var(--accent) 12%, transparent);
    height:52px; padding:0 14px; border-radius:999px; display:flex; align-items:center; gap:6px; max-width:100%; white-space:nowrap; }
  .tablet .sp-pill span { overflow:hidden; text-overflow:ellipsis; }
  .tablet .ctl2-mid { gap:18px !important; } .tablet .ctl2-mid .round.play { width:72px; height:72px; }
  .tablet .ctl2-mid .round.play ha-icon { --mdc-icon-size:34px; } .tablet .ctl2-mid .round.small { width:52px; height:52px; }
  .tablet .ctl2-vol { justify-self:end; display:flex; align-items:center; gap:10px; }
  .tablet .ctl2-vol b { min-width:44px; text-align:center; color:var(--accent); } .tablet .ctl2-vol .round.small { width:52px; height:52px; }
  .tablet .spk-card { padding:18px 18px 10px; }
  .tablet .spk { width:100%; border:0; font:inherit; color:var(--ink); background:transparent; display:grid; grid-template-columns:40px minmax(0,1fr) 48px 26px;
    align-items:center; gap:12px; padding:9px 8px; border-radius:16px; text-align:left; }
  .tablet .spk.on { background:color-mix(in srgb, var(--accent) 12%, transparent); }
  .tablet .spk-ico { width:40px; height:40px; border-radius:50%; display:grid; place-items:center; background:var(--inset); color:var(--muted); flex:none; }
  .tablet .spk.on .spk-ico { background:var(--accent); color:#fff; }
  .tablet .spk-art { width:40px; height:40px; border-radius:10px; background-size:cover; background-position:center; flex:none; }
  .tablet .spk-t { min-width:0; flex:1; } .tablet .spk-t b { display:block; font-size:15px; }
  .tablet .spk-t span { display:block; color:var(--muted); font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .tablet .spk-v { font-weight:700; color:var(--accent); text-align:right; font-variant-numeric:tabular-nums; }
  .tablet .spk-eqc { display:flex; justify-content:center; }
  .tablet .eqb { display:flex; align-items:flex-end; gap:3px; height:18px; }
  .tablet .eqb i { width:4px; border-radius:2px; background:var(--accent); height:40%; animation:eqb 1.6s ease-in-out infinite alternate; }
  .tablet .eqb i:nth-child(1) { animation-duration:1.5s; } .tablet .eqb i:nth-child(2) { animation-duration:1.15s; animation-delay:-0.6s; }
  .tablet .eqb i:nth-child(3) { animation-duration:1.8s; animation-delay:-1.1s; }
  @keyframes eqb { 0% { height:20%; } 35% { height:90%; } 60% { height:45%; } 100% { height:75%; } }
  .tablet .m-pl { flex:1; min-height:0; overflow:hidden; }

  /* recipes: one screen, no page scroll; the shelf below the planner swipes sideways */
  .tablet .m-rec { width:calc(100vw - 134px); min-width:0; height:100%; overflow:hidden; display:flex; flex-direction:column; gap:6px; padding-right:4px; }
  .tablet .m-rec > .shelf, .tablet .m-rec > .lib-head { flex:none; min-width:0; }
  .tablet .m-rec .lib-head h1 { margin:0 0 6px; }
  .tablet .mp-src { font-weight:400; font-size:13px; margin-left:8px; }
  .tablet .mp-row { width:100%; display:grid; grid-template-columns:repeat(7, minmax(0,1fr)); gap:12px; margin-top:10px; }
  .tablet .mp-day { border:0; font:inherit; color:var(--ink); background:var(--card); box-shadow:var(--shadow); border-radius:20px; padding:10px; text-align:left;
    display:flex; flex-direction:column; gap:6px; height:200px; min-width:0; cursor:pointer; }
  .tablet .mp-day.past { opacity:0.55; } .tablet .mp-day:focus { outline:none; } .tablet .mp-day.sel, .tablet .mp-day.sel:focus { outline:3px solid var(--accent); }
  .tablet .mp-d { font-weight:700; font-size:14px; display:flex; justify-content:space-between; padding:2px 4px 0; } .tablet .mp-d small { color:var(--muted); font-size:13px; }
  .tablet .mp-day.today .mp-d { color:var(--accent); }
  .tablet .mp-img { height:80px; border-radius:14px; background-size:cover; background-position:center; flex:none; }
  .tablet .mp-n { font-weight:700; font-size:13px; line-height:1.25; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; padding:0 4px; }
  .tablet .mp-m { color:var(--muted); font-size:12px; padding:0 4px; }
  .tablet .mp-empty { flex:1; border:2px dashed var(--track); border-radius:14px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px;
    color:var(--muted); font-size:13px; text-align:center; }
  .tablet .mp-day.today .mp-empty { border-color:var(--accent); color:var(--accent); font-weight:700; }
  .tablet .m-rec > .shelf.rec-tabs { flex:1; min-height:0; display:flex; flex-direction:column; gap:12px; margin-top:8px; }
  .tablet .rec-tabs .shelf-row { flex:1; height:auto; min-height:0; padding-bottom:4px; }
  .tablet .rt-chips { display:flex; gap:10px; } .tablet .rt-chips .tab small { color:var(--muted); font-weight:700; margin-left:2px; }
  .tablet .rt-chips .tab.on small { color:inherit; opacity:0.7; }
  .tablet .heart.plan-btn { right:84px; } .tablet .heart.plan-btn.on { color:var(--accent); }
  .tablet .sheet.addday { width:min(560px, 90vw); max-height:86vh; display:flex; flex-direction:column; }
  .tablet .addday-body { min-height:0; overflow-y:auto; scrollbar-width:none; overscroll-behavior:contain; }
  .tablet .addday .sheet-row.on ha-icon { color:var(--accent); }
  .tablet .sheet.pk { width:min(1000px, 92vw); height:min(680px, 86vh); display:flex; flex-direction:column; gap:12px; }
  .tablet .pk-head { display:flex; align-items:center; gap:12px; } .tablet .pk-head .card-title { margin:0; flex:1; }
  .tablet .pk-q { width:280px; height:44px; border:0; border-radius:14px; background:var(--inset); color:var(--ink); font:inherit; padding:0 14px; }
  .tablet .pk-clear { border:0; height:44px; border-radius:14px; padding:0 16px; font:inherit; font-weight:700; color:var(--accent); background:var(--inset); }
  .tablet .pk-body { flex:1; min-height:0; overflow-y:auto; scrollbar-width:none; overscroll-behavior:contain; }
  .tablet .pk-h { font-size:13px; font-weight:800; color:var(--muted); text-transform:uppercase; letter-spacing:0.06em; margin:8px 0; }
  .tablet .pk-grid { display:grid; grid-template-columns:repeat(5, minmax(0,1fr)); gap:12px; }
  .tablet .pk-card { border:0; font:inherit; color:var(--ink); background:var(--inset); border-radius:18px; padding:8px; text-align:left; display:flex; flex-direction:column; gap:6px; min-width:0; }
  .tablet .pk-card.on { outline:3px solid var(--accent); }
  .tablet .pk-img { height:100px; border-radius:12px; background-size:cover; background-position:center; }
  .tablet .pk-card b { font-size:13px; line-height:1.25; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
  .tablet .pk-card small { color:var(--muted); font-size:12px; }

  /* the Nest Hub (1024x600, cast): the same pages, tighter */
  @media (max-height: 680px) {
    .tablet .m-home2, .tablet .m-cl2 { gap:12px; } .tablet .m-col, .tablet .h2-right, .tablet .h2-top, .tablet .rooms2 { gap:12px; }
    .tablet .m-home2 { grid-template-columns:300px minmax(0,1fr); }
    .tablet .dinner { padding:18px 16px 14px; } .tablet .dn-hello { font-size:22px; } .tablet .dn-rule { margin:12px 6px; }
    .tablet .dn-stack { gap:8px; } .tablet .dn-card { padding:10px 12px; grid-template-columns:1fr 96px; border-radius:18px; }
    .tablet .dn-t b { font-size:15px; } .tablet .dn-plan { height:40px; }
    .tablet .h2-right { grid-template-rows:minmax(0,1fr) auto minmax(0,1fr); }
    .tablet .nowtile { padding:10px 12px 12px; gap:6px; } .tablet .now-cap b, .tablet .now-text b { font-size:22px; }
    .tablet .shop2 { padding:12px 14px; } .tablet .sh2-i { font-size:15px; padding:4px 0; }
    .tablet .h2-qa { gap:8px; grid-auto-columns:calc((100% - 48px) / 7); } .tablet .qa2 { height:76px; font-size:11px; gap:5px; border-radius:16px; } .tablet .qa2-ico { width:34px; height:34px; }
    .tablet .today2 { grid-template-columns:110px minmax(0,1fr); padding:12px 16px; align-items:start; }
    .tablet .td-dm { font-size:14px; } .tablet .td-n { font-size:56px; }
    .tablet .cl-list { align-content:start; row-gap:4px; column-gap:16px; } .tablet .cl-day { font-size:11px; margin-top:0; }
    .tablet .td-ev small { font-size:11px; } .tablet .td-ev b { font-size:14px; }
    .tablet .m-rooms { gap:10px; } .tablet .rm-body { grid-template-columns:minmax(0,1fr) 300px; gap:12px; }
    .tablet .rm-grid { grid-template-columns:repeat(4, minmax(0,1fr)); gap:10px; }
    .tablet .out2 { padding:14px 16px; gap:8px; } .tablet .out2-ico { width:52px; height:52px; } .tablet .out2-t { font-size:40px; }
    .tablet .out2-chips span { padding:4px 8px; font-size:12px; } .tablet .fc-ico { width:26px; height:26px; margin:3px auto; }
    .tablet .out2-fc b { font-size:14px; } .tablet .out2-in { padding-top:8px; font-size:13px; }
    .tablet .hp2 { padding:12px 14px; gap:10px; } .tablet .hp2-sub { font-size:15px; } .tablet .hp2-now { font-size:32px; }
    .tablet .hp2-set .sq { height:48px; } .tablet .chip { height:40px; }
    .tablet .rc2 { padding:12px; gap:8px; } .tablet .rc2-head { font-size:16px; }
    .tablet .rc2 .air-tile, .tablet .rm-air .air-tile { padding:8px 10px; border-radius:14px; }
    .tablet .rc2 .air-ico, .tablet .rm-air .air-ico, .tablet .rc2-grid.n2 .air-ico { width:26px; height:26px; }
    .tablet .rc2 .air-val, .tablet .rm-air .air-val { font-size:24px; } .tablet .rc2-grid.n2 .air-val { font-size:30px; }
    .tablet .rc2 .air-name, .tablet .rm-air .air-name, .tablet .rc2-grid.n2 .air-name { font-size:12px; }
    .tablet .rc2 .air-q, .tablet .rm-air .air-q, .tablet .rc2-grid.n2 .air-q { font-size:11px; }
  }
`;
