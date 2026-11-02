// overlook-show: a full-screen kitchen display in the Echo Show 16 layout.
//
// One custom card that owns the whole screen: a dock of pages on the left, the
// weather and clock top right, and the pages themselves. It starts on the photo
// slideshow and drifts back to it after `idle` seconds without a touch.
//
// Why a card and not button-card: the vertical light slider, the thermostat
// dial, the speaker picker and the idle return all need pointer handling and
// local state, which button-card templates can't hold.
import { LitElement, html, css, svg, nothing } from "./lit-all.min.js";

const VERSION = "0.1.0";
const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const LONG_MONTHS = ["January", "February", "March", "April", "May", "June", "July",
  "August", "September", "October", "November", "December"];

const WEATHER = {
  "sunny": ["mdi:weather-sunny", "Sunny", "#f2a93b"],
  "clear-night": ["mdi:weather-night", "Clear", "#7c83d6"],
  "partlycloudy": ["mdi:weather-partly-cloudy", "Partly cloudy", "#f2a93b"],
  "cloudy": ["mdi:weather-cloudy", "Cloudy", "#8a97ad"],
  "fog": ["mdi:weather-fog", "Fog", "#8a97ad"],
  "rainy": ["mdi:weather-rainy", "Rain", "#4d8df0"],
  "pouring": ["mdi:weather-pouring", "Heavy rain", "#3a73d6"],
  "lightning": ["mdi:weather-lightning", "Storms", "#8f6ad8"],
  "lightning-rainy": ["mdi:weather-lightning-rainy", "Storms", "#8f6ad8"],
  "windy": ["mdi:weather-windy", "Windy", "#5aa7a0"],
  "windy-variant": ["mdi:weather-windy-variant", "Windy", "#5aa7a0"],
  "snowy": ["mdi:weather-snowy", "Snow", "#8fb6e8"],
  "snowy-rainy": ["mdi:weather-snowy-rainy", "Sleet", "#8fb6e8"],
  "hail": ["mdi:weather-hail", "Hail", "#8fb6e8"],
  "exceptional": ["mdi:alert-circle-outline", "Warning", "#e2574c"],
};

const PAGES = [
  ["kitchen", "Kitchen", "mdi:stove"],
  ["home", "Home", "mdi:home-outline"],
  ["calendar", "Calendar", "mdi:calendar-month-outline"],
  ["recipes", "Recipes", "mdi:silverware-fork-knife"],
];

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const fireHaptic = () => { try { navigator.vibrate && navigator.vibrate(8); } catch (e) {} };

class OverlookShow extends LitElement {
  static properties = {
    hass: { attribute: false },
    _page: { state: true },
    _drag: { state: true },
    _picker: { state: true },
    _todo: { state: true },
    _events: { state: true },
    _forecast: { state: true },
    _now: { state: true },
    _uncovered: { state: true },
    _speaker: { state: true },
  };

  setConfig(config) {
    this._config = Object.assign({
      idle: 300, photos: null, weather: "weather.forecast_home",
      lights: [], climate: null, speakers: [], calendars: [], todo: null, sensors: [],
    }, config);
    this._page = "photos";
    this._drag = null;
    this._picker = false;
    this._todo = [];
    this._events = null;
    this._forecast = null;
    this._now = new Date();
    this._uncovered = false;
    try { this._speaker = localStorage.getItem("overlook-show-speaker"); } catch (e) {}
  }

  getCardSize() { return 12; }

  connectedCallback() {
    super.connectedCallback();
    this._clock = setInterval(() => { this._now = new Date(); }, 15000);
    this._touch = () => this._poke();
    window.addEventListener("pointerdown", this._touch, true);
    this._poke();
    if (!document.getElementById("overlook-show-fonts")) {
      const l = document.createElement("link");
      l.id = "overlook-show-fonts";
      l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=Unbounded:wght@500;700;800&family=Figtree:wght@400;500;600;700&display=swap";
      document.head.appendChild(l);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this._clock);
    clearTimeout(this._idleTimer);
    window.removeEventListener("pointerdown", this._touch, true);
    this._unsub();
  }

  _poke() {
    clearTimeout(this._idleTimer);
    if (!this._config || !this._config.photos) return;
    this._idleTimer = setTimeout(() => {
      this._picker = false;
      this._page = "photos";
    }, this._config.idle * 1000);
  }

  // --- subscriptions: shopping list, forecast, calendar --------------------
  updated(changed) {
    if (changed.has("hass") && this.hass && !this._subscribed) {
      this._subscribed = true;
      this._subscribe();
    }
  }

  async _subscribe() {
    const c = this._config;
    this._subs = [];
    const conn = this.hass.connection;
    if (c.todo) {
      try {
        this._subs.push(await conn.subscribeMessage(
          (m) => { this._todo = (m.items || []).filter((i) => i.status === "needs_action"); },
          { type: "todo/item/subscribe", entity_id: c.todo }));
      } catch (e) { console.warn("overlook-show: todo", e); }
    }
    if (c.weather) {
      try {
        this._subs.push(await conn.subscribeMessage(
          (m) => { this._forecast = (m.forecast || [])[0] || null; },
          { type: "weather/subscribe_forecast", entity_id: c.weather, forecast_type: "daily" }));
      } catch (e) { console.warn("overlook-show: forecast", e); }
    }
    this._loadEvents();
    this._eventTimer = setInterval(() => this._loadEvents(), 10 * 60 * 1000);
  }

  _unsub() {
    (this._subs || []).forEach((u) => { try { u(); } catch (e) {} });
    this._subs = [];
    clearInterval(this._eventTimer);
    this._subscribed = false;
  }

  async _loadEvents() {
    const cals = this._config.calendars || [];
    if (!cals.length) { this._events = null; return; }
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(end.getDate() + 2);
    const all = [];
    for (const cal of cals) {
      const id = typeof cal === "string" ? cal : cal.entity;
      const colour = (typeof cal === "object" && cal.color) || "var(--accent)";
      try {
        const r = await this.hass.callApi("GET",
          `calendars/${id}?start=${start.toISOString()}&end=${end.toISOString()}`);
        r.forEach((e) => all.push(Object.assign(e, { colour })));
      } catch (e) { console.warn("overlook-show: calendar", id, e); }
    }
    const key = (e) => e.start.dateTime || e.start.date;
    this._events = all.sort((a, b) => key(a).localeCompare(key(b)));
  }

  // --- helpers --------------------------------------------------------------
  _st(id) { return id && this.hass ? this.hass.states[id] : undefined; }
  _call(domain, service, data) {
    fireHaptic();
    return this.hass.callService(domain, service, data);
  }
  _go(page) {
    this._picker = false;
    this._page = page;
  }
  _time(d) {
    const h = d.getHours() % 12 || 12;
    return `${h}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  // --- render -------------------------------------------------------------
  render() {
    if (!this.hass || !this._config) return nothing;
    if (this._uncovered) {
      return html`<button class="restore" @click=${() => { this._uncovered = false; }}>
        <ha-icon icon="mdi:fullscreen"></ha-icon></button>`;
    }
    const photos = this._page === "photos";
    return html`
      <div class="screen ${photos ? "is-photos" : ""}">
        ${photos ? this._photos() : html`
          ${this._dock()}
          <main class="page">${this._pageBody()}</main>`}
        ${this._topRight(photos)}
        ${this._picker ? this._speakerSheet() : nothing}
      </div>`;
  }

  _topRight(onPhoto) {
    const w = this._st(this._config.weather);
    const cond = w ? (WEATHER[w.state] || WEATHER.cloudy) : null;
    const t = w && w.attributes.temperature;
    let hold;
    const down = () => { hold = setTimeout(() => { this._uncovered = true; }, 1500); };
    const up = () => clearTimeout(hold);
    return html`
      <div class="topright ${onPhoto ? "on-photo" : ""}"
           @pointerdown=${down} @pointerup=${up} @pointerleave=${up}>
        ${cond ? html`<ha-icon class="wx" icon=${cond[0]}
            style="color:${onPhoto ? "#fff" : cond[2]}"></ha-icon>
          <span class="temp">${Math.round(t)}°</span>` : nothing}
        <span class="clock">${this._time(this._now)}</span>
      </div>`;
  }

  _dock() {
    return html`
      <nav class="dock">
        <div class="dock-pill">
          ${PAGES.map(([id, name, icon]) => html`
            <button class="dock-btn ${this._page === id ? "on" : ""}" title=${name}
                    @click=${() => this._go(id)}>
              <ha-icon icon=${icon}></ha-icon>
            </button>`)}
        </div>
        ${this._config.photos ? html`
          <button class="dock-btn photo-btn" title="Photos" @click=${() => this._go("photos")}>
            <ha-icon icon="mdi:image-multiple-outline"></ha-icon>
          </button>` : nothing}
      </nav>`;
  }

  _pageBody() {
    switch (this._page) {
      case "kitchen": return this._kitchen();
      default: {
        const p = PAGES.find((x) => x[0] === this._page);
        return html`<div class="soon card">
          <ha-icon icon=${p[2]}></ha-icon>
          <div class="soon-title">${p[1]}</div>
          <div class="muted">Coming in the next round.</div>
        </div>`;
      }
    }
  }

  // --- photos -------------------------------------------------------------
  _photos() {
    const cam = this._st(this._config.photos);
    const pic = cam && cam.attributes.entity_picture;
    const when = cam && cam.attributes.captured_at_primary;
    const d = when ? new Date(when) : null;
    const album = cam && cam.attributes.album_title;
    return html`
      <div class="photo" @click=${() => this._go("kitchen")}>
        ${pic ? html`<img src=${pic} alt="">` : nothing}
        <div class="photo-shade"></div>
        <div class="photo-cap">
          ${album ? html`<div class="cap-small">${album}</div>` : nothing}
          ${d ? html`<div class="cap-big">${d.getDate()} ${LONG_MONTHS[d.getMonth()]} ${d.getFullYear()}</div>` : nothing}
        </div>
      </div>`;
  }

  // --- kitchen ------------------------------------------------------------
  _kitchen() {
    return html`
      <div class="kitchen">
        <div class="col col-a">
          ${this._dateCard()}
          ${this._mediaCard()}
        </div>
        <div class="col col-b card">
          <div class="card-title">Kitchen</div>
          <div class="favs" style="--n:${this._config.lights.length}">
            ${this._config.lights.map((l) => this._pill(l))}
            ${this._config.climate ? this._thermostat() : nothing}
          </div>
        </div>
        <div class="col col-c">
          ${this._agenda()}
          ${this._shopping()}
          ${this._sensors()}
        </div>
      </div>`;
  }

  _dateCard() {
    const n = this._now;
    const w = this._st(this._config.weather);
    const cond = w ? (WEATHER[w.state] || WEATHER.cloudy) : null;
    const f = this._forecast;
    return html`
      <div class="card date-card">
        <div class="date-top">${DAYS[n.getDay()]} ${MONTHS[n.getMonth()]}</div>
        <div class="date-num">${n.getDate()}</div>
        ${w ? html`
          <div class="wx-card">
            <ha-icon icon=${cond[0]} style="color:${cond[2]}"></ha-icon>
            <span class="wx-temp">${Math.round(w.attributes.temperature)}°</span>
            <div class="wx-side">
              <div class="wx-cond">${cond[1]}</div>
              ${f ? html`<div class="wx-hl">H ${Math.round(f.temperature)}°&nbsp;&nbsp;L ${Math.round(f.templow)}°</div>` : nothing}
            </div>
          </div>` : nothing}
      </div>`;
  }

  // the speaker whose card is showing: whatever is playing, else the last one picked
  _speakers() {
    return this._config.speakers.map((s) => {
      const ents = s.entities.map((e) => this._st(e)).filter(Boolean);
      const playing = ents.find((e) => e.state === "playing");
      const paused = ents.find((e) => e.state === "paused" && e.attributes.media_title);
      const shown = playing || paused || ents.find((e) => e.attributes.media_title) || ents[0];
      return Object.assign({}, s, { shown, playing: !!playing });
    });
  }

  _activeSpeaker() {
    const all = this._speakers();
    return all.find((s) => s.name === this._speaker && s.playing)
      || all.find((s) => s.playing && s.auto !== false)
      || all.find((s) => s.name === this._speaker)
      || all[0];
  }

  _mediaCard() {
    const sp = this._activeSpeaker();
    if (!sp || !sp.shown) return nothing;
    const e = sp.shown, a = e.attributes;
    const playing = e.state === "playing";
    const vol = a.volume_level != null ? a.volume_level : null;
    const title = a.media_title || "Nothing playing";
    const sub = a.media_artist || (a.media_title ? "" : "Pick a speaker or start something in Spotify");
    return html`
      <div class="card media-card">
        <div class="card-title">Active Media</div>
        <div class="media-row">
          <div class="art" style=${a.entity_picture ? `background-image:url('${a.entity_picture}')` : ""}>
            ${a.entity_picture ? nothing : html`<ha-icon icon="mdi:music-note"></ha-icon>`}
          </div>
          <div class="media-text">
            ${a.app_name || a.source ? html`<div class="media-src">${a.app_name || a.source}</div>` : nothing}
            <div class="media-title">${title}</div>
            <div class="media-artist">${sub}</div>
          </div>
          ${a.media_title ? html`
            <button class="round play" @click=${() => this._call("media_player", "media_play_pause", { entity_id: e.entity_id })}>
              <ha-icon icon=${playing ? "mdi:pause" : "mdi:play"}></ha-icon>
            </button>` : nothing}
        </div>
        <button class="where" @click=${() => { this._picker = true; }}>
          <ha-icon icon=${sp.icon || "mdi:speaker"}></ha-icon>
          <span>${sp.name}</span>
          <ha-icon class="chev" icon="mdi:chevron-down"></ha-icon>
        </button>
        ${vol != null ? html`
          <div class="vol">
            <button class="round small" @click=${() => this._call("media_player", "volume_set", { entity_id: e.entity_id, volume_level: clamp(Math.round((vol - 0.05) * 100) / 100, 0, 1) })}>
              <ha-icon icon="mdi:minus"></ha-icon></button>
            <div class="vol-bar"><div style="width:${Math.round(vol * 100)}%"></div></div>
            <button class="round small" @click=${() => this._call("media_player", "volume_set", { entity_id: e.entity_id, volume_level: clamp(Math.round((vol + 0.05) * 100) / 100, 0, 1) })}>
              <ha-icon icon="mdi:plus"></ha-icon></button>
          </div>` : nothing}
      </div>`;
  }

  _speakerSheet() {
    const active = this._activeSpeaker();
    return html`
      <div class="scrim" @click=${() => { this._picker = false; }}>
        <div class="sheet card" @click=${(ev) => ev.stopPropagation()}>
          <div class="card-title">Play on</div>
          ${this._speakers().map((s) => {
            const a = s.shown ? s.shown.attributes : {};
            const on = active && s.name === active.name;
            return html`
              <button class="sheet-row ${on ? "on" : ""}" @click=${() => this._pickSpeaker(s, active)}>
                <ha-icon icon=${s.icon || "mdi:speaker"}></ha-icon>
                <div class="sheet-text">
                  <div class="sheet-name">${s.name}</div>
                  <div class="muted">${s.playing ? `Playing ${a.media_title || ""}` : (s.shown ? s.shown.state.replace("_", " ") : "unavailable")}</div>
                </div>
                ${on ? html`<ha-icon class="tick" icon="mdi:check"></ha-icon>` : nothing}
              </button>`;
          })}
          <div class="sheet-hint muted">Moving music works for Music Assistant playback. Spotify started from your phone stays where it is.</div>
        </div>
      </div>`;
  }

  async _pickSpeaker(target, active) {
    this._picker = false;
    this._speaker = target.name;
    try { localStorage.setItem("overlook-show-speaker", target.name); } catch (e) {}
    if (!active || active.name === target.name || !active.playing) return;
    if (!active.ma || !target.ma) return;
    const src = this._st(active.ma);
    if (!src || src.state !== "playing") return;
    try {
      await this._call("music_assistant", "transfer_queue",
        { entity_id: target.ma, source_player: active.ma, auto_play: true });
    } catch (e) { console.warn("overlook-show: transfer", e); }
  }

  // --- light pill: tap toggles, drag sets brightness -----------------------
  _pill(l) {
    const e = this._st(l.entity);
    if (!e) return nothing;
    const on = e.state === "on";
    const real = on ? Math.round((e.attributes.brightness || 255) / 2.55) : 0;
    const drag = this._drag && this._drag.id === l.entity ? this._drag.pct : null;
    const pct = drag != null ? drag : real;
    const lit = drag != null ? drag > 0 : on;
    return html`
      <div class="pill-wrap">
        <div class="pill-head">
          <div class="pill-name">${l.name || e.attributes.friendly_name}</div>
          <div class="pill-state ${lit ? "lit" : ""}">${lit ? `${pct}%` : "Off"}</div>
        </div>
        <div class="pill ${lit ? "lit" : ""}"
             @pointerdown=${(ev) => this._pillDown(ev, l.entity, pct)}
             @pointermove=${(ev) => this._pillMove(ev)}
             @pointerup=${(ev) => this._pillUp(ev)}
             @pointercancel=${() => { this._drag = null; }}>
          <div class="pill-fill" style="height:${lit ? Math.max(pct, 14) : 0}%"></div>
          <ha-icon class="pill-icon" icon=${l.icon || "mdi:lightbulb-outline"}></ha-icon>
        </div>
      </div>`;
  }

  _pillDown(ev, id, pct) {
    ev.currentTarget.setPointerCapture(ev.pointerId);
    const r = ev.currentTarget.getBoundingClientRect();
    this._press = { id, y: ev.clientY, rect: r, moved: false, start: pct };
  }

  _pillMove(ev) {
    const p = this._press;
    if (!p) return;
    if (!p.moved && Math.abs(ev.clientY - p.y) < 8) return;
    p.moved = true;
    const pct = clamp(Math.round((p.rect.bottom - ev.clientY) / p.rect.height * 100), 0, 100);
    this._drag = { id: p.id, pct };
  }

  _pillUp() {
    const p = this._press;
    this._press = null;
    if (!p) return;
    if (!p.moved) {
      this._call("light", "toggle", { entity_id: p.id });
      return;
    }
    const pct = this._drag ? this._drag.pct : p.start;
    if (pct <= 1) this._call("light", "turn_off", { entity_id: p.id });
    else this._call("light", "turn_on", { entity_id: p.id, brightness_pct: pct });
    // hold the dragged value until HA reports back, so the fill doesn't jump
    setTimeout(() => { if (this._drag && this._drag.id === p.id) this._drag = null; }, 1500);
  }

  // --- thermostat: drag the knob round the arc ------------------------------
  _thermostat() {
    const e = this._st(this._config.climate);
    if (!e) return nothing;
    const a = e.attributes;
    const min = a.min_temp, max = a.max_temp, step = a.target_temp_step || 0.5;
    const mode = e.state;
    const target = this._drag && this._drag.id === e.entity_id ? this._drag.temp : a.temperature;
    const colour = mode === "heat" ? "var(--warm)" : mode === "cool" ? "var(--cool)"
      : mode === "off" ? "var(--track-strong)" : "var(--accent)";
    // 270 degree arc with the gap at the bottom
    const R = 80, C = 100, START = 135, SWEEP = 270;
    const pt = (deg) => [C + R * Math.cos(deg * Math.PI / 180), C + R * Math.sin(deg * Math.PI / 180)];
    const arc = (from, to) => {
      const [x1, y1] = pt(from), [x2, y2] = pt(to);
      return `M ${x1} ${y1} A ${R} ${R} 0 ${to - from > 180 ? 1 : 0} 1 ${x2} ${y2}`;
    };
    const frac = clamp((target - min) / (max - min), 0, 1);
    const knob = START + SWEEP * frac;
    const [kx, ky] = pt(knob);
    const modes = [["heat", "Heat"], ["cool", "Cool"], ["off", "Off"]]
      .filter(([m]) => (a.hvac_modes || []).includes(m));
    return html`
      <div class="thermo">
        <div class="pill-head"><div class="pill-name">Heat pump</div>
          <div class="pill-state">${mode === "off" ? "Off" : `${mode === "heat_cool" ? "Auto" : mode[0].toUpperCase() + mode.slice(1).replace("_", " ")}`}</div></div>
        <div class="dial"
             @pointerdown=${(ev) => this._dialDown(ev, e)}
             @pointermove=${(ev) => this._dialMove(ev, e)}
             @pointerup=${() => this._dialUp(e)}
             @pointercancel=${() => { this._dialPress = null; this._drag = null; }}>
          <svg viewBox="0 0 200 200">
            <path d=${arc(START, START + SWEEP)} class="track"></path>
            ${frac > 0.001 ? svg`<path d=${arc(START, knob)} class="arc" style="stroke:${colour}"></path>` : nothing}
            <circle cx=${kx} cy=${ky} r="11" class="knob" style="stroke:${colour}"></circle>
          </svg>
          <div class="dial-mid">
            <ha-icon icon=${mode === "cool" ? "mdi:snowflake" : mode === "off" ? "mdi:power" : "mdi:fire"}
                     style="color:${colour}"></ha-icon>
            <div class="dial-num" style="color:${mode === "off" ? "var(--ink)" : colour}">${Math.round(target / step) * step}°</div>
            <div class="muted">Currently ${a.current_temperature != null ? Math.round(a.current_temperature * 10) / 10 : "–"}°</div>
          </div>
        </div>
        <div class="modes">
          ${modes.map(([m, label]) => html`
            <button class="mode ${mode === m ? "on " + m : ""}"
                    @click=${() => this._call("climate", "set_hvac_mode", { entity_id: e.entity_id, hvac_mode: m })}>${label}</button>`)}
        </div>
      </div>`;
  }

  _dialTemp(ev, e) {
    const r = this._dialPress.rect;
    const x = ev.clientX - (r.left + r.width / 2), y = ev.clientY - (r.top + r.height / 2);
    let deg = Math.atan2(y, x) * 180 / Math.PI;      // -180..180, 0 = right
    if (deg < 0) deg += 360;
    let rel = deg - 135;
    if (rel < 0) rel += 360;
    if (rel > 270) rel = rel > 315 ? 0 : 270;         // the gap snaps to the nearer end
    const a = e.attributes, step = a.target_temp_step || 0.5;
    return clamp(Math.round((a.min_temp + rel / 270 * (a.max_temp - a.min_temp)) / step) * step, a.min_temp, a.max_temp);
  }

  _dialDown(ev, e) {
    ev.currentTarget.setPointerCapture(ev.pointerId);
    this._dialPress = { rect: ev.currentTarget.getBoundingClientRect(), x: ev.clientX, y: ev.clientY, moved: false };
  }

  _dialMove(ev, e) {
    const p = this._dialPress;
    if (!p) return;
    if (!p.moved && Math.hypot(ev.clientX - p.x, ev.clientY - p.y) < 8) return;
    p.moved = true;
    this._drag = { id: e.entity_id, temp: this._dialTemp(ev, e) };
  }

  _dialUp(e) {
    const p = this._dialPress;
    this._dialPress = null;
    if (!p || !p.moved || !this._drag) return;
    const t = this._drag.temp;
    this._call("climate", "set_temperature", { entity_id: e.entity_id, temperature: t });
    setTimeout(() => { if (this._drag && this._drag.id === e.entity_id) this._drag = null; }, 2500);
  }

  // --- right column ---------------------------------------------------------
  _agenda() {
    const ev = this._events;
    const now = new Date();
    const today = now.toDateString();
    const rows = (ev || []).filter((e) => {
      const end = new Date(e.end.dateTime || e.end.date);
      return end > now;
    }).slice(0, 4);
    const fmt = (e) => {
      if (!e.start.dateTime) return "All day";
      const s = new Date(e.start.dateTime);
      const day = s.toDateString() === today ? "" : `${DAYS[s.getDay()][0]}${DAYS[s.getDay()].slice(1).toLowerCase()} `;
      return day + this._time(s) + (s.getHours() < 12 ? "am" : "pm");
    };
    return html`
      <div class="card agenda">
        <div class="card-title">Today</div>
        ${ev == null ? html`<div class="empty muted">Connect Google Calendar in Home Assistant and today's events show here.</div>`
          : rows.length ? rows.map((e) => html`
            <div class="event">
              <span class="bar" style="background:${e.colour}"></span>
              <div><div class="ev-time muted">${fmt(e)}</div><div class="ev-name">${e.summary}</div></div>
            </div>`)
          : html`<div class="empty muted">Nothing else today.</div>`}
      </div>`;
  }

  _shopping() {
    if (!this._config.todo) return nothing;
    const items = this._todo || [];
    return html`
      <div class="card shopping">
        <div class="card-title">Shopping list <span class="count">${items.length || ""}</span></div>
        <div class="items">
          ${items.length ? items.map((i) => html`
            <button class="item" @click=${() => this._call("todo", "update_item",
              { entity_id: this._config.todo, item: i.uid, status: "completed" })}>
              <span class="box"></span><span>${i.summary}</span>
            </button>`) : html`<div class="empty muted">All done.</div>`}
        </div>
      </div>`;
  }

  _sensors() {
    const s = this._config.sensors || [];
    if (!s.length) return nothing;
    return html`
      <div class="sensors">
        ${s.map((x) => {
          const e = this._st(x.entity);
          if (!e) return nothing;
          const v = Number(e.state);
          const shown = isNaN(v) ? e.state : (x.decimals != null ? v.toFixed(x.decimals) : Math.round(v));
          return html`
            <div class="sensor card">
              <ha-icon icon=${x.icon} style="color:${x.color || "var(--accent)"}"></ha-icon>
              <div class="s-val">${shown}<span>${x.unit != null ? x.unit : (e.attributes.unit_of_measurement || "")}</span></div>
              <div class="s-name muted">${x.name}</div>
            </div>`;
        })}
      </div>`;
  }

  static styles = css`
    :host {
      --bg: linear-gradient(165deg, #f4f7fd 0%, #e4ecf9 100%);
      --card: rgba(255, 255, 255, 0.78);
      --card-edge: rgba(255, 255, 255, 0.95);
      --inset: #eef3fb;
      --ink: #142038;
      --muted: #6c7891;
      --accent: #1d5cf0;
      --accent-soft: rgba(29, 92, 240, 0.12);
      --warm: #f39a43;
      --cool: #3f86f2;
      --track: #dbe5f5;
      --track-strong: #b9c6db;
      --shadow: 0 1px 2px rgba(22, 42, 84, 0.04), 0 10px 30px rgba(22, 42, 84, 0.07);
      --display: Unbounded, Figtree, system-ui, sans-serif;
      --body: Figtree, system-ui, sans-serif;
      display: block;
    }
    @media (prefers-color-scheme: dark) {
      :host {
        --bg: linear-gradient(165deg, #0b0f18 0%, #121827 100%);
        --card: rgba(29, 35, 50, 0.82);
        --card-edge: rgba(255, 255, 255, 0.05);
        --inset: rgba(255, 255, 255, 0.05);
        --ink: #eef2fb;
        --muted: #8e99b0;
        --accent: #6b9bff;
        --accent-soft: rgba(107, 155, 255, 0.16);
        --track: rgba(255, 255, 255, 0.1);
        --track-strong: rgba(255, 255, 255, 0.22);
        --shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
      }
    }
    * { box-sizing: border-box; }
    button { font: inherit; color: inherit; border: 0; background: none; padding: 0; cursor: pointer;
             -webkit-tap-highlight-color: transparent; }
    .screen {
      position: fixed; inset: 0; z-index: 10; overflow: hidden;
      background: var(--bg); color: var(--ink); font-family: var(--body);
      display: grid; grid-template-columns: 88px 1fr;
      padding-top: env(safe-area-inset-top, 0px);
      user-select: none; -webkit-user-select: none;
    }
    .screen.is-photos { display: block; background: #000; }
    .restore { position: fixed; right: 16px; bottom: 16px; z-index: 10; width: 48px; height: 48px;
               border-radius: 50%; background: #1d5cf0; color: #fff; display: grid; place-items: center; }
    .muted { color: var(--muted); }
    .card {
      background: var(--card); border: 1px solid var(--card-edge); border-radius: 30px;
      box-shadow: var(--shadow); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    }
    .card-title { font-size: 17px; font-weight: 600; letter-spacing: -0.01em; color: var(--ink);
                  display: flex; align-items: center; gap: 8px; }
    .count { font-size: 13px; font-weight: 700; color: var(--accent); background: var(--accent-soft);
             border-radius: 999px; padding: 1px 8px; }
    .count:empty { display: none; }

    /* top right: weather and clock, as on the Show */
    .topright { position: absolute; top: calc(env(safe-area-inset-top, 0px) + 18px); right: 30px;
                display: flex; align-items: center; gap: 10px; z-index: 3;
                font-family: var(--body); font-weight: 500; }
    .topright .wx { --mdc-icon-size: 26px; }
    .topright .temp { font-size: 26px; }
    .topright .clock { font-size: 34px; font-weight: 500; letter-spacing: -0.01em; margin-left: 8px;
                       font-variant-numeric: tabular-nums; }
    .topright.on-photo { color: #fff; text-shadow: 0 1px 12px rgba(0, 0, 0, 0.45); }
    .topright.on-photo .clock { font-size: 40px; }
    .topright.on-photo .temp { font-size: 30px; }

    /* dock */
    .dock { display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: 14px; padding: 76px 0 24px 16px; }
    .dock-pill { display: flex; flex-direction: column; gap: 6px; padding: 8px; border-radius: 28px;
                 background: var(--card); border: 1px solid var(--card-edge); box-shadow: var(--shadow); }
    .dock-btn { width: 52px; height: 52px; border-radius: 18px; display: grid; place-items: center;
                color: var(--muted); transition: background 0.2s, color 0.2s, transform 0.1s; }
    .dock-btn ha-icon { --mdc-icon-size: 26px; }
    .dock-btn.on { background: var(--accent-soft); color: var(--accent); }
    .dock-btn:active { transform: scale(0.94); }
    .photo-btn { background: var(--card); border: 1px solid var(--card-edge); box-shadow: var(--shadow);
                 border-radius: 20px; }

    .page { padding: 76px 28px 24px 18px; min-height: 0; height: 100%; }

    /* kitchen: three columns */
    .kitchen { display: grid; grid-template-columns: 0.95fr 1.45fr 1fr; gap: 18px; height: 100%; min-height: 0; }
    .col { display: flex; flex-direction: column; gap: 18px; min-height: 0; }

    .date-card { flex: 1.15; padding: 22px 22px 18px; display: flex; flex-direction: column;
                 align-items: center; min-height: 0; }
    .date-top { font-family: var(--display); font-weight: 700; font-size: 22px; letter-spacing: 0.02em;
                color: var(--accent); opacity: 0.75; margin-top: 4px; }
    .date-num { font-family: var(--display); font-weight: 800; font-size: clamp(90px, 19vh, 160px);
                line-height: 1; color: var(--accent); letter-spacing: -0.02em; margin: 2px 0 14px; flex: 1; display: flex; align-items: center; }
    .wx-card { margin-top: auto; width: 100%; background: var(--inset); border-radius: 22px;
               padding: 14px 16px; display: grid; grid-template-columns: auto auto 1fr; align-items: center; gap: 10px; }
    .wx-card ha-icon { --mdc-icon-size: 30px; }
    .wx-temp { font-size: 30px; font-weight: 600; }
    .wx-side { text-align: right; }
    .wx-cond { font-size: 14px; font-weight: 600; }
    .wx-hl { font-size: 13px; color: var(--muted); margin-top: 2px; }

    .media-card { flex: 1; padding: 18px 20px; display: flex; flex-direction: column; gap: 12px; justify-content: space-between; min-height: 0; }
    .media-row { display: grid; grid-template-columns: 76px 1fr auto; gap: 12px; align-items: center; }
    .art { width: 76px; height: 76px; border-radius: 16px; background: var(--inset) center / cover;
           display: grid; place-items: center; color: var(--muted); }
    .media-text { min-width: 0; }
    .media-src { font-size: 11px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted); }
    .media-title { font-size: 17px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .media-artist { font-size: 14px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .round { width: 46px; height: 46px; border-radius: 50%; background: var(--accent-soft); color: var(--accent);
             display: grid; place-items: center; transition: transform 0.1s; }
    .round:active { transform: scale(0.92); }
    .round.small { width: 38px; height: 38px; background: var(--inset); color: var(--ink); }
    .round.small ha-icon { --mdc-icon-size: 20px; }
    .where { display: flex; align-items: center; justify-content: center; gap: 8px; height: 44px; border-radius: 999px;
             background: var(--accent-soft); color: var(--accent); font-weight: 600; font-size: 15px; }
    .where ha-icon { --mdc-icon-size: 20px; }
    .where .chev { --mdc-icon-size: 18px; opacity: 0.7; }
    .vol { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 12px; }
    .vol-bar { height: 8px; border-radius: 999px; background: var(--track); overflow: hidden; }
    .vol-bar div { height: 100%; background: var(--accent); border-radius: 999px; transition: width 0.25s; }

    /* favourites */
    .col-b { padding: 20px 22px 22px; }
    .favs { flex: 1; display: grid; grid-template-columns: repeat(var(--n, 2), minmax(92px, 0.5fr)) 2fr;
            gap: 14px; min-height: 0; margin-top: 14px; }
    .pill-wrap, .thermo { background: var(--inset); border-radius: 24px; padding: 14px; display: flex;
                          flex-direction: column; min-height: 0; }
    .pill-head { min-height: 40px; }
    .pill-name { font-size: 15px; font-weight: 600; line-height: 1.15; }
    .pill-state { font-size: 13px; color: var(--muted); margin-top: 2px; }
    .pill-state.lit { color: var(--warm); font-weight: 600; }
    .pill { position: relative; flex: 1; margin: 10px auto 0; width: 100%; max-width: 92px; border-radius: 999px;
            background: var(--track); overflow: hidden; touch-action: none; cursor: pointer; }
    .pill-fill { position: absolute; left: 0; right: 0; bottom: 0; background: var(--warm);
                 border-radius: 0 0 999px 999px; transition: height 0.18s ease-out; }
    .pill.lit .pill-fill { border-radius: 26px 26px 999px 999px; }
    .pill-icon { position: absolute; left: 50%; bottom: 18px; transform: translateX(-50%); --mdc-icon-size: 28px;
                 color: var(--muted); }
    .pill.lit .pill-icon { color: #fff; }

    .thermo { align-items: stretch; }
    .dial { position: relative; flex: 1; min-height: 0; touch-action: none; display: grid; place-items: center; }
    .dial svg { width: 100%; height: 100%; max-height: 100%; overflow: visible; }
    .track, .arc { fill: none; stroke-width: 14; stroke-linecap: round; }
    .track { stroke: var(--track); }
    .knob { fill: var(--card); stroke-width: 5; filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.2)); }
    .dial-mid { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center;
                justify-content: center; pointer-events: none; }
    .dial-mid ha-icon { --mdc-icon-size: 22px; }
    .dial-num { font-family: var(--display); font-weight: 700; font-size: clamp(38px, 7vh, 58px); line-height: 1.05; }
    .dial-mid .muted { font-size: 13px; }
    .modes { display: flex; gap: 8px; justify-content: center; margin-top: 8px; }
    .mode { flex: 1; max-width: 96px; height: 38px; border-radius: 999px; background: var(--card); font-weight: 600;
            font-size: 14px; color: var(--muted); }
    .mode.on.heat { background: var(--warm); color: #fff; }
    .mode.on.cool { background: var(--cool); color: #fff; }
    .mode.on.off { background: var(--ink); color: var(--card); }

    /* right column */
    .agenda, .shopping { padding: 18px 20px; display: flex; flex-direction: column; gap: 10px; min-height: 0; }
    .agenda { flex: 1; }
    .shopping { flex: 1.1; }
    .empty { font-size: 14px; line-height: 1.4; }
    .event { display: grid; grid-template-columns: 4px 1fr; gap: 10px; align-items: stretch; }
    .event .bar { border-radius: 4px; }
    .ev-time { font-size: 12px; }
    .ev-name { font-size: 15px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .items { display: flex; flex-direction: column; gap: 2px; overflow: auto; min-height: 0; }
    .item { display: flex; align-items: center; gap: 12px; text-align: left; font-size: 16px; padding: 7px 0; }
    .box { width: 22px; height: 22px; border-radius: 7px; border: 2px solid var(--track-strong); flex: none; }
    .item:active .box { background: var(--accent); border-color: var(--accent); }
    .sensors { display: grid; grid-template-columns: repeat(auto-fit, minmax(0, 1fr)); gap: 12px; }
    .sensor { border-radius: 22px; padding: 12px 12px 10px; display: flex; flex-direction: column; gap: 2px; }
    .sensor ha-icon { --mdc-icon-size: 20px; }
    .s-val { font-size: 20px; font-weight: 700; margin-top: 4px; }
    .s-val span { font-size: 12px; font-weight: 600; color: var(--muted); margin-left: 1px; }
    .s-name { font-size: 12px; }

    /* placeholder pages */
    .soon { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; }
    .soon ha-icon { --mdc-icon-size: 48px; color: var(--accent); }
    .soon-title { font-family: var(--display); font-size: 28px; font-weight: 700; }

    /* speaker sheet */
    .scrim { position: absolute; inset: 0; background: rgba(8, 14, 28, 0.35); display: grid; place-items: center; z-index: 5; }
    .sheet { width: min(440px, 90vw); padding: 20px; display: flex; flex-direction: column; gap: 6px; background: var(--card);
             backdrop-filter: blur(30px); }
    @media (prefers-color-scheme: light) { .sheet { background: rgba(255, 255, 255, 0.96); } }
    .sheet .card-title { margin-bottom: 6px; }
    .sheet-row { display: grid; grid-template-columns: 28px 1fr auto; align-items: center; gap: 12px; text-align: left;
                 padding: 12px 14px; border-radius: 18px; }
    .sheet-row.on { background: var(--accent-soft); }
    .sheet-row .tick { color: var(--accent); }
    .sheet-name { font-weight: 600; font-size: 16px; }
    .sheet-row .muted { font-size: 13px; text-transform: none; }
    .sheet-hint { font-size: 12px; margin-top: 6px; line-height: 1.4; }

    /* photos */
    .photo { position: absolute; inset: 0; }
    .photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .photo-shade { position: absolute; inset: 0; pointer-events: none;
                   background: linear-gradient(180deg, rgba(0,0,0,.35) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 62%, rgba(0,0,0,.5) 100%); }
    .photo-cap { position: absolute; left: 40px; bottom: 36px; color: #fff; text-shadow: 0 1px 10px rgba(0,0,0,.4); }
    .cap-small { font-size: 18px; font-weight: 500; opacity: 0.9; }
    .cap-big { font-size: 34px; font-weight: 600; letter-spacing: -0.01em; margin-top: 2px; }
  `;
}

if (!customElements.get("overlook-show")) customElements.define("overlook-show", OverlookShow);
window.customCards = window.customCards || [];
window.customCards.push({ type: "overlook-show", name: "Overlook Show", description: "Full-screen kitchen display" });
console.info(`%c overlook-show ${VERSION} `, "background:#1d5cf0;color:#fff;border-radius:4px");
