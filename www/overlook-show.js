// overlook-show: a full-screen kitchen display in the Echo Show 16 layout.
//
// One custom card that owns the whole screen: a dock of pages on the left, the
// weather and clock top right, and the pages themselves. It starts on the photo
// slideshow and drifts back to it after `idle` seconds without a touch.
//
// `phone: true` lays the same pieces out for a phone: one scrolling column, a
// floating tab bar along the bottom, and no photos.
//
// Why a card and not button-card: the vertical light slider, the
// speaker picker and the idle return all need pointer handling and
// local state, which button-card templates can't hold.
import { LitElement, html, css, svg, nothing } from "./lit-all.min.js";

const VERSION = "0.7.1";
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

// the phone's tab bar: the same pages, with Kitchen as the overview and Home as the rooms
const PHONE_PAGES = [
  ["kitchen", "Home", "mdi:home-variant-outline"],
  ["home", "Rooms", "mdi:sofa-outline"],
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
    _cal: { state: true },
    _month: { state: true },
    _sel: { state: true },
    _fit: { state: true },
    _room: { state: true },
    _forecast: { state: true },
    _now: { state: true },
    _uncovered: { state: true },
    _adding: { state: true },
    _speaker: { state: true },
    _lib: { state: true },
    _book: { state: true },
    _recipe: { state: true },
  };

  setConfig(config) {
    this._config = Object.assign({
      idle: 300, photos: null, weather: "weather.forecast_home",
      lights: [], climate: null, speakers: [], calendars: [], todo: null, sensors: [], rooms: [], scenes: [],
      phone: false,
    }, config);
    if (this._config.phone) this._config.photos = null;
    this._page = this._config.photos ? "photos" : "kitchen";
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
    window.addEventListener("keydown", this._touch, true);
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
    window.removeEventListener("keydown", this._touch, true);
    this._unsub();
  }

  _poke() {
    clearTimeout(this._idleTimer);
    if (!this._config || !this._config.photos) return;
    this._idleTimer = setTimeout(() => {
      if (this._recipe) { this._poke(); return; }    // never leave a recipe mid-cook
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
    if (this._page === "calendar" && !this._config.phone) this._fitChips();
  }

  // how many event chips fit in a day cell at this screen size
  _fitChips() {
    const d = this.shadowRoot.querySelector(".day");
    if (!d) return;
    const cs = getComputedStyle(d);
    const room = d.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)
      - d.querySelector(".dnum").offsetHeight;
    const chip = d.querySelector(".chip");
    const each = (chip ? chip.offsetHeight : 19) + 3;
    const n = Math.max(1, Math.floor(room / each));
    if (n !== this._fit) this._fit = n;
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

  async _fetchEvents(start, end) {
    const all = [];
    for (const cal of this._config.calendars || []) {
      const id = typeof cal === "string" ? cal : cal.entity;
      const colour = (typeof cal === "object" && cal.color) || "var(--accent)";
      try {
        const r = await this.hass.callApi("GET",
          `calendars/${id}?start=${start.toISOString()}&end=${end.toISOString()}`);
        r.forEach((e) => all.push(Object.assign(e, { colour })));
      } catch (e) { console.warn("overlook-show: calendar", id, e); }
    }
    return all.sort((a, b) => this._d(a.start) - this._d(b.start));
  }

  async _loadEvents() {
    if (!(this._config.calendars || []).length) { this._events = null; return; }
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(end.getDate() + 2);
    this._events = await this._fetchEvents(start, end);
    if (this._page === "calendar") this._loadMonth();
  }

  // the month grid plus the 8 days from the selected one, in one fetch
  async _loadMonth() {
    if (!(this._config.calendars || []).length) return;
    const gs = this._gridStart(this._month);
    const ge = new Date(gs); ge.setDate(ge.getDate() + 42);
    const sel = this._day(this._sel);
    const le = new Date(sel); le.setDate(le.getDate() + 8);
    const start = sel < gs ? sel : gs, end = le > ge ? le : ge;
    const key = this._ymd(start) + this._ymd(end);
    this._calKey = key;
    const ev = await this._fetchEvents(start, end);
    if (this._calKey === key) this._cal = ev;
  }

  // --- helpers --------------------------------------------------------------
  _st(id) { return id && this.hass ? this.hass.states[id] : undefined; }
  _call(domain, service, data) {
    fireHaptic();
    return this.hass.callService(domain, service, data);
  }
  _go(page) {
    this._picker = false;
    this._recipe = null;
    if (page !== this._page) this._book = null;
    if (page === "calendar" && page !== this._page) this._toToday();
    this._page = page;
  }
  // an event's start/end -> Date; all-day dates are local midnight, not UTC
  _d(x) {
    if (x.dateTime) return new Date(x.dateTime);
    return this._day(x.date);
  }
  _day(ymd) { const [y, m, d] = ymd.split("-").map(Number); return new Date(y, m - 1, d); }
  _ymd(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  _ampm(d) {
    const m = d.getMinutes();
    return `${d.getHours() % 12 || 12}${m ? ":" + String(m).padStart(2, "0") : ""}${d.getHours() < 12 ? "am" : "pm"}`;
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
    if (this._config.phone) {
      return html`
        <div class="screen phone">
          <main class="page">${this._pageBody()}</main>
          ${this._tabBar()}
          ${this._picker ? this._speakerSheet() : nothing}
        </div>`;
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
    const [down, up] = this._holdToUncover();
    return html`
      <div class="topright ${onPhoto ? "on-photo" : ""}"
           @pointerdown=${down} @pointerup=${up} @pointerleave=${up}>
        ${cond ? html`<ha-icon class="wx" icon=${cond[0]}
            style="color:${onPhoto ? "#fff" : cond[2]}"></ha-icon>
          <span class="temp">${Math.round(t)}°</span>` : nothing}
        <span class="clock">${this._time(this._now)}</span>
      </div>`;
  }

  // holding for 1.5s uncovers HA underneath, for edit mode
  _holdToUncover() {
    let hold;
    return [() => { hold = setTimeout(() => { this._uncovered = true; }, 1500); }, () => clearTimeout(hold)];
  }

  _tabBar() {
    return html`
      <nav class="tabbar">
        ${PHONE_PAGES.map(([id, name, icon]) => html`
          <button class="dock-btn ${this._page === id ? "on" : ""}" @click=${() => { this._go(id); this._top(); }}>
            <ha-icon icon=${icon}></ha-icon><span>${name}</span>
          </button>`)}
      </nav>`;
  }

  _top() {
    const p = this.shadowRoot && this.shadowRoot.querySelector(".page");
    if (p) p.scrollTop = 0;
  }

  // --- phone home: everything from the kitchen page, one column ----------------
  _phoneHome() {
    const n = this._now, h = n.getHours();
    const w = this._st(this._config.weather);
    const cond = w ? (WEATHER[w.state] || WEATHER.cloudy) : null;
    const f = this._forecast;
    const [down, up] = this._holdToUncover();
    return html`
      <div class="ph">
        <header class="ph-head" @pointerdown=${down} @pointerup=${up} @pointerleave=${up}>
          <div>
            <div class="date-top">${DAYS[n.getDay()]} ${n.getDate()} ${MONTHS[n.getMonth()]}</div>
            <h1>${h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"}</h1>
          </div>
          ${cond ? html`
            <div class="ph-wx">
              <div class="ph-wx-now"><ha-icon icon=${cond[0]} style="color:${cond[2]}"></ha-icon>
                <span>${Math.round(w.attributes.temperature)}°</span></div>
              ${f ? html`<div class="wx-hl">H ${Math.round(f.temperature)}°&nbsp;&nbsp;L ${Math.round(f.templow)}°</div>` : nothing}
            </div>` : nothing}
        </header>
        ${this._mediaCard()}
        <div class="card ph-favs">
          <div class="card-title">Favourites</div>
          <div class="favs" style="--n:${this._config.lights.length}">
            ${this._config.lights.map((l) => this._pill(l))}
            ${this._config.climate ? this._thermostat() : nothing}
          </div>
          ${this._config.scenes.length ? html`
            <div class="fav-scenes">${this._config.scenes.map((x) => this._miniScene(x))}</div>` : nothing}
        </div>
        ${this._st(this._config.playlists) ? html`<div class="card ph-pl">${this._playlists()}</div>` : nothing}
        ${this._agenda()}
        ${this._shopping()}
        ${this._sensors()}
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
      case "kitchen": return this._config.phone ? this._phoneHome() : this._kitchen();
      case "recipes": return this._recipes();
      case "calendar": return this._calendar();
      case "home": return this._home();
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

  // --- home: a tab per room ----------------------------------------------------
  _home() {
    const rooms = this._config.rooms || [];
    if (!rooms.length) return nothing;
    const r = rooms.find((x) => x.name === this._room) || rooms[0];
    return html`
      <div class="home">
        <div class="tabs">
          ${rooms.map((x) => html`
            <button class="tab ${x === r ? "on" : ""}" @click=${() => { this._room = x.name; }}>
              <ha-icon icon=${x.icon}></ha-icon><span>${x.name}</span></button>`)}
        </div>
        ${r.music ? this._musicRoom() : this._room_(r)}
      </div>`;
  }

  _room_(r) {
    const lights = r.lights || [];
    const lit = lights.filter((l) => { const e = this._st(l.entity); return e && e.state === "on"; }).length;
    let side = [...(r.media || []).map((m) => this._player(m)),
                ...(r.switches || []).map((x) => this._switchTile(x)),
                ...(r.plants || []).map((x) => this._plantTile(x)),
                ...((r.sensors || []).length ? [html`<div class="room-env">${this._sensors(r.sensors)}</div>`] : [])];
    // a room with nothing else puts its scenes in the side column instead of along the bottom
    const scenesAside = !side.length;
    if (scenesAside) side = (r.scenes || []).map((x) => this._sceneBtn(x, true));
    return html`
      <div class="room ${r.climate ? "has-hp" : ""}">
        <div class="card room-lights">
          <div class="card-title">Lights <span class="count">${lit ? `${lit} on` : ""}</span>
            ${r.group && this._st(r.group) ? html`
              <button class="all-btn" @click=${() => this._call("light", lit ? "turn_off" : "turn_on", { entity_id: r.group })}>
                ${lit ? "All off" : "All on"}</button>` : nothing}
          </div>
          <div class="favs room-favs ${r.climate ? "" : "no-hp"}" style="--n:${lights.length}">
            ${lights.map((l) => this._pill(l))}
            ${r.climate ? this._thermostat(r.climate) : nothing}
          </div>
        </div>
        ${side.length ? html`<div class="room-side">${side}</div>` : nothing}
        ${!scenesAside && (r.scenes || []).length ? html`
          <div class="scenes">
            ${r.scenes.map((x) => this._sceneBtn(x))}
          </div>` : nothing}
      </div>`;
  }

  _player(m) {
    const id = m.entity;
    const e = this._st(id);
    if (!e) return nothing;
    const a = e.attributes;
    const active = ["playing", "paused"].includes(e.state) && a.media_title;
    const state = e.state === "playing" ? "Playing" : e.state === "paused" ? "Paused"
      : e.state === "unavailable" ? "Unavailable" : e.state[0].toUpperCase() + e.state.slice(1);
    const vol = a.volume_level;
    return html`
      <div class="card player">
        <div class="player-row">
          <div class="art small" style=${active && a.entity_picture ? `background-image:url('${a.entity_picture}')` : ""}>
            ${active && a.entity_picture ? nothing : html`<ha-icon icon=${m.icon || "mdi:speaker"}></ha-icon>`}
          </div>
          <div class="media-text">
            <div class="media-src">${m.name || a.friendly_name}</div>
            <div class="player-title">${active ? a.media_title : state}</div>
            ${active && (a.media_artist || a.app_name) ? html`<div class="media-artist">${a.media_artist || a.app_name}</div>` : nothing}
          </div>
          ${active ? html`
            <button class="round play" @click=${() => this._call("media_player", "media_play_pause", { entity_id: id })}>
              <ha-icon icon=${e.state === "playing" ? "mdi:pause" : "mdi:play"}></ha-icon></button>` : nothing}
        </div>
        ${vol != null && e.state !== "off" ? html`
          <div class="vol">
            <button class="round small" @click=${() => this._call("media_player", "volume_set", { entity_id: id, volume_level: clamp(Math.round((vol - 0.05) * 100) / 100, 0, 1) })}>
              <ha-icon icon="mdi:minus"></ha-icon></button>
            <div class="vol-bar"><div style="width:${Math.round(vol * 100)}%"></div></div>
            <button class="round small" @click=${() => this._call("media_player", "volume_set", { entity_id: id, volume_level: clamp(Math.round((vol + 0.05) * 100) / 100, 0, 1) })}>
              <ha-icon icon="mdi:plus"></ha-icon></button>
          </div>` : nothing}
      </div>`;
  }

  _switchTile(x) {
    const e = this._st(x.entity);
    if (!e) return nothing;
    const on = e.state === "on";
    return html`
      <button class="card tile ${on ? "on" : ""}" @click=${() => this._call("homeassistant", "toggle", { entity_id: x.entity })}>
        <span class="tile-ico"><ha-icon icon=${x.icon}></ha-icon></span>
        <span class="tile-text"><span class="tile-name">${x.name}</span>
          <span class="muted">${on ? "On" : e.state === "unavailable" ? "Unavailable" : "Off"}</span></span>
      </button>`;
  }

  _plantTile(x) {
    const e = this._st(x.entity);
    if (!e) return nothing;
    const v = Number(e.state);
    return html`
      <div class="card tile plant">
        <span class="tile-ico"><ha-icon icon="mdi:sprout"></ha-icon></span>
        <span class="tile-text"><span class="tile-name">${x.name}</span>
          <span class="muted">Soil moisture</span></span>
        <span class="tile-val">${isNaN(v) ? "–" : Math.round(v)}<small>%</small></span>
      </div>`;
  }

  _sceneBtn(x, tile = false) {
    const [domain] = x.entity.split(".");
    const e = this._st(x.entity);
    const on = domain === "input_boolean" && e && e.state === "on";
    const go = () => domain === "input_boolean" ? this._call("input_boolean", "toggle", { entity_id: x.entity })
      : this._call(domain, "turn_on", { entity_id: x.entity });
    if (tile) {
      return html`
        <button class="card tile ${on ? "on" : ""}" @click=${go}>
          <span class="tile-ico"><ha-icon icon=${x.icon}></ha-icon></span>
          <span class="tile-text"><span class="tile-name">${x.name}</span>
            <span class="muted">${domain === "input_boolean" ? (on ? "On" : "Off") : "Tap to run"}</span></span>
        </button>`;
    }
    return html`
      <button class="card scene ${on ? "on" : ""}" @click=${go}>
        <ha-icon icon=${x.icon}></ha-icon><span>${x.name}</span></button>`;
  }

  _miniScene(x) {
    const [domain] = x.entity.split(".");
    const e = this._st(x.entity);
    const on = domain === "input_boolean" && e && e.state === "on";
    const go = () => domain === "input_boolean" ? this._call("input_boolean", "toggle", { entity_id: x.entity })
      : this._call(domain, "turn_on", { entity_id: x.entity });
    return html`
      <button class="mini-scene ${on ? "on" : ""}" @click=${go}>
        <ha-icon icon=${x.icon}></ha-icon>
        <span class="ms-name">${x.name}</span></button>`;
  }

  _musicRoom() {
    return html`
      <div class="music">
        ${this._mediaCard()}
        <div class="card music-pl">${this._playlists()}</div>
      </div>`;
  }

  // --- calendar: month grid + what's on --------------------------------------
  _gridStart(first) {
    const d = new Date(first);
    d.setDate(d.getDate() - (d.getDay() + 6) % 7);      // back to Monday
    return d;
  }
  _toToday() {
    const t = new Date();
    this._month = new Date(t.getFullYear(), t.getMonth(), 1);
    this._sel = this._ymd(t);
    this._loadMonth();
  }
  _shiftMonth(n) {
    const m = new Date(this._month.getFullYear(), this._month.getMonth() + n, 1);
    this._month = m;
    this._sel = this._ymd(m.getMonth() === new Date().getMonth() && m.getFullYear() === new Date().getFullYear() ? new Date() : m);
    this._loadMonth();
  }
  _pick(ymd) {
    this._sel = ymd;
    const d = this._day(ymd);
    if (d.getMonth() !== this._month.getMonth()) this._month = new Date(d.getFullYear(), d.getMonth(), 1);
    this._loadMonth();
  }
  // each event listed under every day it covers (all-day ends are exclusive)
  _byDay(events) {
    const out = {};
    for (const e of events) {
      const s = this._d(e.start), end = this._d(e.end);
      const d = new Date(s); d.setHours(0, 0, 0, 0);
      for (let i = 0; i < 62 && (i === 0 || d < end); i++) {
        (out[this._ymd(d)] = out[this._ymd(d)] || []).push(e);
        d.setDate(d.getDate() + 1);
      }
    }
    return out;
  }

  _calendar() {
    if (!(this._config.calendars || []).length) {
      return html`<div class="soon card"><ha-icon icon="mdi:calendar-month-outline"></ha-icon>
        <div class="soon-title">Calendar</div><div class="muted">No calendars set up.</div></div>`;
    }
    const m = this._month, today = this._ymd(new Date());
    const gs = this._gridStart(m);
    const days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
    const weeks = Math.ceil(((m.getDay() + 6) % 7 + days) / 7);
    const byDay = this._byDay(this._cal || []);
    const cells = Array.from({ length: weeks * 7 }, (_, i) => {
      const d = new Date(gs); d.setDate(d.getDate() + i); return d;
    });
    const thisMonth = m.getMonth() === new Date().getMonth() && m.getFullYear() === new Date().getFullYear();
    return html`
      <div class="calendar">
        <div class="card month">
          <div class="month-head">
            <h1>${LONG_MONTHS[m.getMonth()]} <span class="muted">${m.getFullYear()}</span></h1>
            ${thisMonth && this._sel === today ? nothing
              : html`<button class="today-btn" @click=${() => this._toToday()}>Today</button>`}
            <button class="nav-btn" title="Previous month" @click=${() => this._shiftMonth(-1)}>
              <ha-icon icon="mdi:chevron-left"></ha-icon></button>
            <button class="nav-btn" title="Next month" @click=${() => this._shiftMonth(1)}>
              <ha-icon icon="mdi:chevron-right"></ha-icon></button>
          </div>
          <div class="dow">${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => html`<span>${d}</span>`)}</div>
          <div class="mgrid" style="--weeks:${weeks}">
            ${cells.map((d) => {
              const k = this._ymd(d), ev = byDay[k] || [];
              const fit = this._fit || 2;
              const shown = ev.length <= fit ? ev : ev.slice(0, fit - 1);
              return html`
                <button class="day ${d.getMonth() !== m.getMonth() ? "out" : ""} ${k === today ? "today" : ""} ${k === this._sel ? "sel" : ""}"
                        @click=${() => this._pick(k)}>
                  <span class="dnum">${d.getDate()}</span>
                  ${this._config.phone ? html`<span class="ev-dots">${ev.slice(0, 3).map((e) => html`<i style="background:${e.colour}"></i>`)}</span>` : html`
                    ${shown.map((e) => html`<span class="chip" style="--c:${e.colour}">${e.summary}</span>`)}
                    ${ev.length > shown.length ? html`<span class="more">+${ev.length - shown.length} more</span>` : nothing}`}
                </button>`;
            })}
          </div>
        </div>
        ${this._whatsOn(byDay, today)}
      </div>`;
  }

  _whatsOn(byDay, today) {
    const sel = this._day(this._sel);
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const groups = [];
    for (let i = 0; i < 8; i++) {
      const d = new Date(sel); d.setDate(d.getDate() + i);
      const k = this._ymd(d), ev = byDay[k] || [];
      if (!ev.length && i > 0) continue;
      const label = k === today ? "Today" : k === this._ymd(tomorrow) ? "Tomorrow"
        : `${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d.getDay()]} ${d.getDate()} ${LONG_MONTHS[d.getMonth()]}`;
      groups.push({ k, d, label, ev });
    }
    const when = (e, d) => {
      if (!e.start.dateTime) return "All day";
      const s = this._d(e.start);
      return s.toDateString() === d.toDateString() ? this._ampm(s) : "Ongoing";
    };
    return html`
      <div class="card whatson">
        <div class="card-title">What's on</div>
        <div class="wo-list">
          ${this._cal == null ? html`<div class="empty muted">Loading…</div>` : groups.map((g) => html`
            <div class="wo-day ${g.k === today ? "is-today" : ""}">${g.label}</div>
            ${g.ev.length ? g.ev.map((e) => html`
              <div class="wo-ev">
                <span class="wo-time">${when(e, g.d)}</span>
                <span class="bar" style="background:${e.colour}"></span>
                <div class="wo-text">
                  <div class="ev-name">${e.summary}</div>
                  ${e.location ? html`<div class="wo-loc muted">${e.location.split(",")[0]}</div>` : nothing}
                </div>
              </div>`) : html`<div class="empty muted">Nothing on.</div>`}`)}
          ${this._cal != null && groups.length === 1 && !groups[0].ev.length
            ? html`<div class="empty muted">Nothing in the week after, either.</div>` : nothing}
        </div>
      </div>`;
  }

  // --- recipes: a static copy of Norish, synced to /local/norish ---------------
  async _loadLib() {
    if (this._lib && Date.now() - this._libAt < 10 * 60 * 1000) return;
    try {
      const r = await fetch(`${this._config.recipes}/index.json?t=${Date.now()}`, { cache: "no-store" });
      if (!r.ok) throw new Error(r.status);
      this._lib = await r.json();
      this._libAt = Date.now();
    } catch (e) {
      console.warn("overlook-show: recipes", e);
      if (!this._lib) this._lib = { error: true };
    }
  }

  _img(id) { return `${this._config.recipes}/img/${id}.jpg?v=${(this._lib.recipes[id] || {}).v || 0}`; }

  _recipeCard(id) {
    const r = this._lib.recipes[id];
    if (!r) return nothing;
    return html`
      <button class="rc" @click=${() => this._openRecipe(id)}>
        <span class="rc-img" style=${r.img ? `background-image:url('${this._img(id)}')` : ""}>
          ${r.img ? nothing : html`<ha-icon icon="mdi:silverware-fork-knife"></ha-icon>`}</span>
        <span class="rc-name">${r.n}</span>
        ${r.t ? html`<span class="rc-meta muted">${r.t} min</span>` : nothing}
      </button>`;
  }

  _bookCard(b) {
    const covers = b.members.filter((id) => (this._lib.recipes[id] || {}).img).slice(0, 4);
    return html`
      <button class="bk" @click=${() => { this._book = b.id; }}>
        <span class="bk-cover n${covers.length}">
          ${covers.map((id) => html`<span style="background-image:url('${this._img(id)}')"></span>`)}
        </span>
        <span class="rc-name">${b.title}</span>
        <span class="rc-meta muted">${b.members.length} recipes</span>
      </button>`;
  }

  _recipes() {
    this._loadLib();
    const L = this._lib;
    if (!L) return html`<div class="soon card"><div class="muted">Loading recipes…</div></div>`;
    if (L.error) return html`<div class="soon card"><ha-icon icon="mdi:cloud-off-outline"></ha-icon>
      <div class="muted">Recipes haven't synced to Home Assistant yet.</div></div>`;
    const book = this._book && L.cookbooks.find((b) => b.id === this._book);
    return html`
      ${this._recipe ? this._recipeSheet() : html`
      <div class="recipes">
        ${book ? html`
          <div class="lib-head">
            <button class="back" @click=${() => { this._book = null; }}><ha-icon icon="mdi:chevron-left"></ha-icon></button>
            <h1>${book.title}</h1><span class="muted">${book.members.length} recipes</span>
          </div>
          <div class="book-grid">${book.members.map((id) => this._recipeCard(id))}</div>` : html`
          <div class="lib-head"><h1>Recipes</h1></div>
          <section class="shelf">
            <div class="card-title">Favourites</div>
            <div class="shelf-row">
              ${L.favorites.length ? L.favorites.map((id) => this._recipeCard(id))
                : html`<div class="empty muted">Heart a recipe in Norish and it shows here.</div>`}
            </div>
          </section>
          <section class="shelf">
            <div class="card-title">Recently added</div>
            <div class="shelf-row">${L.recent.map((id) => this._recipeCard(id))}</div>
          </section>
          <section class="shelf">
            <div class="card-title">Cookbooks</div>
            <div class="shelf-row">${L.cookbooks.map((b) => this._bookCard(b))}</div>
          </section>`}
      </div>`}`;
  }

  _isFav(id) { return !!(this._lib && this._lib.favorites && this._lib.favorites.includes(id)); }

  // HA signs in to Norish and toggles it (shell_command.norish_favourite); the heart
  // changes at once and the index is re-read once HA is done
  async _toggleFav(id) {
    const want = !this._isFav(id);
    const before = this._lib.favorites;
    this._lib = Object.assign({}, this._lib, {
      favorites: want ? [id, ...before] : before.filter((x) => x !== id) });
    try {
      await this._call("shell_command", "norish_favourite", { recipe: id, favourite: want ? "true" : "false" });
      this._libAt = 0;
      this._loadLib();
    } catch (e) {
      console.warn("overlook-show: favourite", e);
      this._lib = Object.assign({}, this._lib, { favorites: before });
    }
  }

  async _openRecipe(id) {
    this._recipe = { id, loading: true };
    try {
      const r = await fetch(`${this._config.recipes}/r/${id}.json?v=${(this._lib.recipes[id] || {}).v || 0}`);
      const d = await r.json();
      if (this._recipe && this._recipe.id === id) this._recipe = d;
    } catch (e) {
      this._recipe = { id, error: true };
    }
  }

  _recipeSheet() {
    const d = this._recipe;
    const meta = [];
    if (d.total || d.prep || d.cook) meta.push(`${d.total || (d.prep || 0) + (d.cook || 0)} min`);
    if (d.servings) meta.push(`Serves ${d.servings}`);
    return html`
      <div class="recipe">
        <div class="recipe-side">
          <button class="back" @click=${() => { this._recipe = null; }}><ha-icon icon="mdi:close"></ha-icon></button>
          <button class="heart ${this._isFav(d.id) ? "on" : ""}" title="Favourite" @click=${() => this._toggleFav(d.id)}>
            <ha-icon icon=${this._isFav(d.id) ? "mdi:heart" : "mdi:heart-outline"}></ha-icon></button>
          <div class="recipe-photo" style=${(this._lib.recipes[d.id] || {}).img ? `background-image:url('${this._img(d.id)}')` : ""}></div>
          <h2>${d.name || (this._lib.recipes[d.id] || {}).n}</h2>
          ${meta.length ? html`<div class="muted">${meta.join(" · ")}</div>` : nothing}
          ${d.ingredients ? html`
            <div class="card-title">Ingredients</div>
            <ul class="ings">${d.ingredients.map((i) => html`<li>${i}</li>`)}</ul>` : nothing}
        </div>
        <div class="recipe-main">
          ${d.loading ? html`<div class="muted">Loading…</div>` : d.error ? html`<div class="muted">Couldn't load this recipe.</div>` : html`
            <div class="card-title">Method</div>
            <ol class="steps">${d.steps.map((s) => html`<li><span>${s}</span></li>`)}</ol>`}
        </div>
      </div>`;
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
          <div class="card-title">Favourites</div>
          <div class="favs" style="--n:${this._config.lights.length}">
            ${this._config.lights.map((l) => this._pill(l))}
            ${this._config.climate ? this._thermostat() : nothing}
          </div>
          ${this._config.scenes.length ? html`
            <div class="fav-scenes" title="Scenes">${this._config.scenes.map((x) => this._miniScene(x))}</div>` : nothing}
          ${this._playlists()}
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
    this._last = this._last || {};
    if (on) this._last[l.entity] = real;
    const pct = drag != null ? drag : real;
    const lit = drag != null ? drag > 0 : on;
    // the split sits at the brightness; an off light keeps it where it was last
    const at = clamp(lit ? pct : (this._last[l.entity] || 50), 22, 88);
    const rgb = e.attributes.rgb_color;
    return html`
      <div class="pill-wrap">
        <div class="pill-head">
          <div>
            <div class="pill-name">${l.name || e.attributes.friendly_name}</div>
            <div class="pill-state ${lit ? "lit" : ""}">${lit ? (pct >= 100 ? "On" : `On · ${pct}%`) : "Off"}</div>
          </div>
          <button class="dots" @click=${() => this._moreInfo(l.entity)}>
            <ha-icon icon="mdi:dots-vertical"></ha-icon></button>
        </div>
        <div class="split ${lit ? "lit" : ""}"
             @pointerdown=${(ev) => this._pillDown(ev, l.entity, pct)}
             @pointermove=${(ev) => this._pillMove(ev)}
             @pointerup=${(ev) => this._pillUp(ev)}
             @pointercancel=${() => { this._drag = null; this._press = null; }}>
          <div class="seg seg-top" style="flex-grow:${100 - at}"></div>
          <div class="seg seg-bot" style="flex-grow:${at}">
            <span class="seg-ico"><ha-icon icon=${l.icon || "mdi:lightbulb-outline"}></ha-icon></span>
          </div>
        </div>
        ${lit && rgb ? html`<button class="swatch" style="background:rgb(${rgb.join(",")})"
            @click=${() => this._moreInfo(l.entity)}></button>` : nothing}
      </div>`;
  }

  _moreInfo(entityId) {
    this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }));
  }

  // --- playlists: cover tiles, tap plays on the Active Media speaker ---------
  _playlists() {
    const e = this._st(this._config.playlists);
    const items = (e && e.attributes.items) || [];
    if (!items.length) return nothing;
    return html`
      <div class="card-title pl-title">Playlists</div>
      <div class="pl-row">
        ${items.map((p) => html`
          <button class="pl" style=${p.image ? `background-image:url('${p.image}')` : ""}
                  @click=${() => this._playList(p)}>
            <span class="pl-shade"></span>
            <span class="pl-name">${p.name}</span>
          </button>`)}
      </div>`;
  }

  _playList(p) {
    const sp = this._activeSpeaker();
    if (!sp || !sp.ma) return;
    this._speaker = sp.name;
    try { localStorage.setItem("overlook-show-speaker", sp.name); } catch (e) {}
    this._call("music_assistant", "play_media",
      { entity_id: sp.ma, media_id: p.uri, media_type: "playlist", enqueue: "replace" });
  }

  _pillDown(ev, id, pct) {
    ev.currentTarget.setPointerCapture(ev.pointerId);
    const r = ev.currentTarget.getBoundingClientRect();
    // a tap on the bulb icon toggles; a tap anywhere else on the pill means "this bright"
    this._press = { id, y: ev.clientY, rect: r, moved: false, start: pct,
                    icon: !!(ev.target.closest && ev.target.closest(".seg-ico")) };
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
    if (!p.moved && p.icon) {
      this._call("light", "toggle", { entity_id: p.id });
      return;
    }
    const at = clamp(Math.round((p.rect.bottom - p.y) / p.rect.height * 100), 1, 100);
    const pct = p.moved ? (this._drag ? this._drag.pct : p.start) : at;
    if (!p.moved) this._drag = { id: p.id, pct };
    if (pct <= 1) this._call("light", "turn_off", { entity_id: p.id });
    else this._call("light", "turn_on", { entity_id: p.id, brightness_pct: pct });
    // hold the dragged value until HA reports back, so the fill doesn't jump
    setTimeout(() => { if (this._drag && this._drag.id === p.id) this._drag = null; }, 1500);
  }

  // --- heat pump: actual temperature, -/+ for the target, a button per mode ----
  _thermostat(id = this._config.climate) {
    const e = this._st(id);
    if (!e) return nothing;
    const a = e.attributes, mode = e.state, step = a.target_temp_step || 0.5;
    const pending = this._drag && this._drag.id === e.entity_id ? this._drag.temp : null;
    const target = pending != null ? pending : a.temperature;
    const label = mode === "off" ? "Off" : mode === "heat_cool" ? "Auto"
      : mode[0].toUpperCase() + mode.slice(1).replace("_", " ");
    const fmt = (t) => (t == null ? "–" : `${Math.round(t / step) * step}°`);
    const modes = [["heat", "Heat", "mdi:fire"], ["cool", "Cool", "mdi:snowflake"], ["off", "Off", "mdi:power"]]
      .filter(([m]) => (a.hvac_modes || []).includes(m));
    return html`
      <div class="thermo">
        <div class="pill-head"><div class="pill-name">Heat pump</div></div>
        <div class="hp-now">
          <span class="hp-temp">${a.current_temperature != null ? `${Math.round(a.current_temperature * 10) / 10}°` : "–"}</span>
          <span class="hp-mode ${mode}">${label}</span>
        </div>
        <div class="hp-target">
          <button class="hp-step" title="Cooler" @click=${() => this._nudge(e, -step)}>
            <ha-icon icon="mdi:minus"></ha-icon></button>
          <div class="hp-set">${fmt(target)}</div>
          <button class="hp-step" title="Warmer" @click=${() => this._nudge(e, step)}>
            <ha-icon icon="mdi:plus"></ha-icon></button>
        </div>
        <div class="modes">
          ${modes.map(([m, name, icon]) => html`
            <button class="mode ${mode === m ? "on " + m : ""}"
                    @click=${() => this._call("climate", "set_hvac_mode", { entity_id: e.entity_id, hvac_mode: m })}>
              <ha-icon icon=${icon}></ha-icon><span>${name}</span></button>`)}
        </div>
      </div>`;
  }

  // taps add up locally and go to HA once they stop, so three quick taps are one call
  _nudge(e, delta) {
    const a = e.attributes;
    const from = this._drag && this._drag.id === e.entity_id ? this._drag.temp : a.temperature;
    const temp = clamp(from + delta, a.min_temp, a.max_temp);
    this._drag = { id: e.entity_id, temp };
    fireHaptic();
    clearTimeout(this._nudgeTimer);
    this._nudgeTimer = setTimeout(() => {
      this._call("climate", "set_temperature", { entity_id: e.entity_id, temperature: temp });
      setTimeout(() => { if (this._drag && this._drag.id === e.entity_id && this._drag.temp === temp) this._drag = null; }, 2500);
    }, 700);
  }

  // --- right column ---------------------------------------------------------
  _agenda() {
    const ev = this._events;
    const now = new Date();
    const today = now.toDateString();
    const rows = (ev || []).filter((e) => {
      return this._d(e.end) > now;
    }).slice(0, 4);
    const fmt = (e) => {
      const s = this._d(e.start);
      const day = s.toDateString() === today || s < now ? "" : `${DAYS[s.getDay()][0]}${DAYS[s.getDay()].slice(1).toLowerCase()} `;
      return e.start.dateTime ? day + this._ampm(s) : (day ? day + "· All day" : "All day");
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
        <div class="card-title">Shopping list <span class="count">${items.length || ""}</span>
          <button class="add" title="Add an item" @click=${() => this._startAdd()}>
            <ha-icon icon="mdi:plus"></ha-icon></button></div>
        ${this._adding ? html`
          <form class="add-row" @submit=${(ev) => this._addItem(ev)}>
            <input id="add-item" placeholder="Add an item" autocomplete="off" enterkeyhint="done"
                   @blur=${(ev) => { if (!ev.target.value.trim()) this._adding = false; }}>
            <button class="add-go" type="submit">Add</button>
          </form>` : nothing}
        <div class="items">
          ${items.length ? items.map((i) => html`
            <button class="item" @click=${() => this._call("todo", "update_item",
              { entity_id: this._config.todo, item: i.uid, status: "completed" })}>
              <span class="box"></span><span>${i.summary}</span>
            </button>`) : html`<div class="empty muted">All done.</div>`}
        </div>
      </div>`;
  }

  async _startAdd() {
    this._adding = true;
    await this.updateComplete;
    const i = this.shadowRoot.getElementById("add-item");
    if (i) i.focus();
  }

  _addItem(ev) {
    ev.preventDefault();
    const input = this.shadowRoot.getElementById("add-item");
    const text = input.value.trim();
    if (!text) { this._adding = false; return; }
    this._call("todo", "add_item", { entity_id: this._config.todo, item: text });
    input.value = "";          // stays open for the next item; tap away to close
    input.focus();
  }

  _sensors(s = this._config.sensors || []) {
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
    .wx-hl { font-size: 13px; color: var(--muted); margin-top: 2px; white-space: nowrap; }

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
    .col-b { display: flex; flex-direction: column; overflow: hidden; }
    .favs { flex: 1; display: grid; grid-template-columns: repeat(var(--n, 1), minmax(150px, 0.8fr)) 1.4fr;
            gap: 14px; min-height: 0; margin-top: 14px; }
    .fav-scenes { flex: none; display: flex; gap: 10px; margin-top: 12px; }
    .mini-scene { flex: 1 1 0; min-width: 0; height: 96px; padding: 10px 6px; border-radius: 18px; background: var(--inset);
                  display: flex; flex-direction: column; justify-content: flex-start; align-items: center; gap: 6px;
                  text-align: center; }
    .mini-scene ha-icon { flex: none; width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center;
                          background: var(--card); }
    .mini-scene.on { background: var(--accent); color: #fff; }
    .mini-scene.on ha-icon { background: rgba(255, 255, 255, 0.2); color: #fff; }
    .ms-name { font-weight: 600; font-size: 12px; line-height: 1.15; text-wrap: balance; max-width: 100%; }
    .mini-scene ha-icon { color: var(--accent); }
    .mini-scene:active { transform: scale(0.97); }
    .pill-wrap, .thermo { background: var(--inset); border-radius: 24px; padding: 14px; display: flex;
                          flex-direction: column; min-height: 0; }
    .pill-head { min-height: 40px; display: flex; justify-content: space-between; align-items: flex-start; gap: 6px; }
    .dots { width: 30px; height: 30px; margin: -4px -6px 0 0; border-radius: 50%; display: grid; place-items: center;
            color: var(--muted); }
    .dots ha-icon { --mdc-icon-size: 20px; }
    .split { --w: 72px; flex: 1; min-height: 0; width: var(--w); margin: 12px auto 4px; display: flex;
             flex-direction: column; gap: 3px; touch-action: none; cursor: pointer; }
    .seg { min-height: 0; background: var(--track); transition: flex-grow 0.18s ease-out, background 0.2s; }
    .seg-top { border-radius: calc(var(--w) / 2) calc(var(--w) / 2) 6px 6px; }
    .seg-bot { border-radius: 6px 6px calc(var(--w) / 2) calc(var(--w) / 2); display: flex; align-items: flex-end; justify-content: center;
               padding-bottom: 6px; color: var(--muted); }
    .seg-ico { display: grid; place-items: center; width: 52px; height: 52px; border-radius: 50%; }
    .seg-bot ha-icon { --mdc-icon-size: 30px; opacity: 0.7; }
    .split.lit .seg-bot { background: var(--warm); color: #fff; }
    .split.lit .seg-bot ha-icon { opacity: 1; }
    .swatch { position: absolute; right: 14px; bottom: 14px; width: 20px; height: 20px; border-radius: 50%;
              box-shadow: 0 0 0 3px var(--card), 0 1px 4px rgba(0, 0, 0, 0.25); }
    .pill-wrap { position: relative; }
    .pl-title { margin-top: 14px; }
    .col-b .hp-target { margin-top: 18px; }
    .pl-row { flex: none; height: clamp(100px, 13.5vh, 120px); margin: 12px -22px -22px; padding: 0 22px 22px; display: flex; gap: 12px;
              overflow-x: auto; scroll-snap-type: x mandatory; scroll-padding: 0 22px; scrollbar-width: none; }
    .pl-row::-webkit-scrollbar { display: none; }
    .pl { position: relative; flex: none; height: 100%; aspect-ratio: 1; border-radius: 20px; overflow: hidden;
          background: var(--inset) center / cover; scroll-snap-align: start; text-align: left; }
    .pl:active { transform: scale(0.97); }
    .pl-shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,.55) 0%, rgba(0,0,0,0) 55%); }
    .pl-name { position: absolute; left: 12px; right: 12px; top: 10px; color: #fff; font-weight: 600; font-size: 15px;
               line-height: 1.2; text-shadow: 0 1px 6px rgba(0,0,0,.35); display: -webkit-box; -webkit-line-clamp: 2;
               -webkit-box-orient: vertical; overflow: hidden; }
    .pill-name { font-size: 15px; font-weight: 600; line-height: 1.15; }
    .pill-state { font-size: 13px; color: var(--muted); margin-top: 2px; }
    .pill-state.lit { color: var(--warm); font-weight: 600; }

    /* heat pump: rows spread down the tile, the mode buttons take what is left */
    .thermo { gap: 12px; }
    .hp-now { display: flex; align-items: baseline; gap: 10px; }
    .hp-temp { font-family: var(--display); font-weight: 700; font-size: clamp(30px, 6vh, 48px); line-height: 1;
               letter-spacing: -0.02em; }
    .hp-mode { font-size: 16px; font-weight: 600; color: var(--muted); }
    .hp-mode.heat { color: var(--warm); }
    .hp-mode.cool { color: var(--cool); }
    .hp-target { margin-top: 32px; display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 8px; }
    .hp-step { width: 60px; height: 60px; border-radius: 18px; background: var(--card); display: grid; place-items: center; }
    .hp-step:active { transform: scale(0.94); }
    .hp-step ha-icon { --mdc-icon-size: 28px; }
    .hp-set { display: flex; flex-direction: column; align-items: center; font-size: 26px; font-weight: 700; line-height: 1.1; }
    /* short buttons sat at the foot of the tile, the free space opens above them */
    .modes { flex: none; height: 64px; margin-top: auto; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .mode { border-radius: 18px; background: var(--card); display: flex; align-items: center;
            justify-content: center; gap: 6px; font-weight: 600; font-size: 14px; color: var(--ink); }
    .mode ha-icon { --mdc-icon-size: 24px; color: var(--muted); }
    .mode:active { transform: scale(0.96); }
    .mode.on.heat { background: var(--warm); color: #fff; }
    .mode.on.cool { background: var(--cool); color: #fff; }
    .mode.on.off { background: var(--ink); color: var(--card); }
    .mode.on ha-icon { color: inherit; }

    /* right column */
    .agenda, .shopping { padding: 18px 20px; display: flex; flex-direction: column; gap: 10px; min-height: 0; }
    .agenda { flex: 1; }
    .shopping { flex: 1.1; }
    .empty { font-size: 14px; line-height: 1.4; }
    .event { display: grid; grid-template-columns: 4px 1fr; gap: 10px; align-items: stretch; }
    .event .bar { border-radius: 4px; }
    .ev-time { font-size: 12px; }
    .ev-name { font-size: 15px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .add { margin-left: auto; width: 34px; height: 34px; border-radius: 50%; background: var(--accent-soft);
           color: var(--accent); display: grid; place-items: center; }
    .add ha-icon { --mdc-icon-size: 20px; }
    .add-row { display: flex; gap: 8px; }
    .add-row input { flex: 1; min-width: 0; height: 40px; border-radius: 12px; border: 1.5px solid var(--track-strong);
                     background: var(--inset); color: var(--ink); font: inherit; font-size: 16px; padding: 0 12px;
                     outline: none; user-select: text; -webkit-user-select: text; }
    .add-row input:focus { border-color: var(--accent); }
    .add-go { height: 40px; padding: 0 16px; border-radius: 12px; background: var(--accent); color: #fff; font-weight: 600; }
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

    /* recipes */
    .recipes { height: 100%; display: flex; flex-direction: column; gap: 14px; min-height: 0; }
    .lib-head { display: flex; align-items: center; gap: 12px; min-height: 44px; }
    .lib-head h1 { font-family: var(--display); font-weight: 700; font-size: 28px; margin: 0; letter-spacing: -0.01em; }
    .back { width: 44px; height: 44px; border-radius: 50%; background: var(--card); box-shadow: var(--shadow);
            display: grid; place-items: center; flex: none; }
    .shelf { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 8px; }
    .shelf-row { flex: 1; min-height: 0; display: flex; gap: 14px; overflow-x: auto; scrollbar-width: none;
                 margin: 0 -28px 0 -4px; padding: 2px 28px 6px 4px; scroll-snap-type: x proximity; }
    .shelf-row::-webkit-scrollbar { display: none; }
    .shelf-row .empty { align-self: center; }
    .rc, .bk { flex: none; height: 100%; aspect-ratio: 0.92; display: flex; flex-direction: column; gap: 6px;
               padding: 8px 8px 10px; border-radius: 22px; background: var(--card); border: 1px solid var(--card-edge);
               box-shadow: var(--shadow); text-align: left; scroll-snap-align: start; min-height: 0; }
    .rc:active, .bk:active { transform: scale(0.97); }
    .rc-img, .bk-cover { flex: 1; min-height: 0; border-radius: 15px; background: var(--inset) center / cover;
                         display: grid; place-items: center; color: var(--muted); overflow: hidden; }
    .bk-cover { display: grid; gap: 2px; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; place-items: stretch; }
    .bk-cover span { background: var(--inset) center / cover; }
    .bk-cover.n1 span, .bk-cover.n2 span, .bk-cover.n3 span:first-child { grid-row: span 2; }
    .bk-cover.n1 span { grid-column: span 2; }
    .rc-name { font-size: 14px; font-weight: 600; line-height: 1.2; display: -webkit-box; -webkit-line-clamp: 2;
               -webkit-box-orient: vertical; overflow: hidden; flex: none; padding: 0 2px; }
    .rc-meta { font-size: 12px; flex: none; padding: 0 2px; margin-top: -3px; }
    .book-grid { flex: 1; min-height: 0; overflow-y: auto; display: grid; gap: 14px; align-content: start;
                 grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); padding: 2px 4px 20px; }
    .book-grid { grid-auto-rows: max-content; }
    .book-grid .rc { height: auto; aspect-ratio: auto; min-height: auto; }
    .book-grid .rc-img { flex: none; aspect-ratio: 4 / 3; }
    .book-grid .rc-name { min-height: 2.4em; }

    .recipe { height: 100%; min-height: 0;
              display: grid; grid-template-columns: minmax(260px, 0.8fr) 1.2fr; gap: 18px; }
    .recipe-side, .recipe-main { background: var(--card); border: 1px solid var(--card-edge); border-radius: 30px;
                                 box-shadow: var(--shadow); padding: 18px 20px; overflow-y: auto; min-height: 0;
                                 backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px); }
    .recipe-side { position: relative; display: flex; flex-direction: column; gap: 8px; }
    .recipe-side .back { position: absolute; top: 26px; left: 28px; z-index: 1; }
    .heart { position: absolute; top: 26px; right: 28px; z-index: 1; width: 44px; height: 44px; border-radius: 50%;
             background: var(--card); box-shadow: var(--shadow); display: grid; place-items: center; color: var(--muted); }
    .heart.on { color: #e5484d; }
    .heart:active { transform: scale(0.9); }
    .recipe-photo { flex: none; aspect-ratio: 4 / 3; border-radius: 20px; background: var(--inset) center / cover; }
    .recipe h2 { font-size: 20px; line-height: 1.2; margin: 6px 0 0; }
    .recipe .card-title { margin-top: 10px; }
    .ings { margin: 0; padding: 0; list-style: none; font-size: 15px; line-height: 1.35; }
    .ings li { padding: 7px 0; border-bottom: 1px solid var(--track); }
    .steps { margin: 10px 0 0; padding: 0; list-style: none; counter-reset: s; display: flex; flex-direction: column; gap: 14px; }
    .steps li { counter-increment: s; display: grid; grid-template-columns: 34px 1fr; gap: 12px; font-size: 17px; line-height: 1.45; }
    .steps li::before { content: counter(s); width: 30px; height: 30px; border-radius: 50%; background: var(--accent-soft);
                        color: var(--accent); font-weight: 700; font-size: 14px; display: grid; place-items: center; margin-top: 1px; }

    /* placeholder pages */
    /* home: room tabs */
    .home { height: 100%; display: flex; flex-direction: column; gap: 16px; min-height: 0; }
    .tabs { display: flex; gap: 8px; flex: none; margin: -66px -8px -8px; padding: 8px; box-sizing: content-box; max-width: calc(100% - 230px); overflow-x: auto; scrollbar-width: none; }
    .tabs::-webkit-scrollbar { display: none; }
    .tab { display: flex; align-items: center; gap: 8px; height: 46px; padding: 0 18px; border-radius: 999px; flex: none;
           background: var(--card); box-shadow: var(--shadow); font-weight: 600; font-size: 15px; color: var(--muted); }
    .tab ha-icon { --mdc-icon-size: 20px; }
    .tab.on { background: var(--accent); color: #fff; }
    .room { flex: 1; min-height: 0; display: grid; grid-template-columns: auto minmax(340px, 1fr); grid-template-rows: 1fr auto; gap: 16px; }
    .room.has-hp { grid-template-columns: 1fr 340px; }
    .room-lights { padding: 20px 22px 22px; display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
    .room-favs.no-hp { grid-template-columns: repeat(var(--n, 1), 190px); }
    .all-btn { margin-left: auto; height: 36px; padding: 0 16px; border-radius: 999px; background: var(--inset);
               font-size: 14px; font-weight: 600; }
    .room-side { display: flex; flex-direction: column; gap: 12px; min-height: 0; overflow-y: auto; scrollbar-width: none;
                 margin: -10px -12px; padding: 10px 12px 24px; }
    .room-side::-webkit-scrollbar { display: none; }
    .player { padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; flex: none; }
    .player-row { display: grid; grid-template-columns: 52px 1fr auto; gap: 12px; align-items: center; }
    .art.small { width: 52px; height: 52px; border-radius: 12px; }
    .player-title { font-size: 16px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .tile { display: grid; grid-template-columns: 44px 1fr auto; gap: 12px; align-items: center; padding: 12px 16px;
            text-align: left; flex: none; }
    .tile-ico { width: 44px; height: 44px; border-radius: 50%; background: var(--inset); display: grid; place-items: center; color: var(--muted); }
    .tile.on .tile-ico { background: var(--warm); color: #fff; }
    .plant .tile-ico { background: rgba(63, 143, 99, 0.14); color: #3f8f63; }
    .tile-text { display: flex; flex-direction: column; min-width: 0; }
    .tile-name { font-weight: 600; font-size: 15px; }
    .tile-text .muted { font-size: 13px; }
    .tile-val { font-size: 24px; font-weight: 600; font-variant-numeric: tabular-nums; }
    .tile-val small { font-size: 14px; color: var(--muted); margin-left: 1px; }
    .room-env { flex: none; }
    .room-env .sensors { grid-template-columns: repeat(auto-fit, minmax(96px, 1fr)); }
    .scenes { grid-column: 1 / -1; display: flex; gap: 12px; overflow-x: auto; scrollbar-width: none;
              margin: -10px -12px -24px; padding: 10px 12px 24px; }
    .scenes::-webkit-scrollbar { display: none; }
    .scene { display: flex; flex-direction: column; justify-content: space-between; align-items: flex-start;
             height: 120px; min-width: 150px; padding: 16px 18px; border-radius: 24px; text-align: left;
             font-weight: 600; font-size: 16px; flex: none; }
    .scene ha-icon { width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center;
                     background: var(--accent-soft); color: var(--accent); }
    .scene.on { background: var(--accent); color: #fff; }
    .scene.on ha-icon { background: rgba(255, 255, 255, 0.2); color: #fff; }
    .scene:active, .tile:active { transform: scale(0.98); }
    .music { flex: 1; min-height: 0; display: grid; grid-template-columns: 1fr 1.5fr; gap: 16px; }
    .music .media-card { justify-content: flex-start; gap: 18px; }
    .music .media-row { grid-template-columns: 1fr; justify-items: center; text-align: center; gap: 14px; flex: 1; align-content: center; }
    .music .art { width: min(240px, 100%); height: auto; aspect-ratio: 1; border-radius: 24px; }
    .music .art ha-icon { --mdc-icon-size: 64px; }
    .music .media-title { font-size: 22px; }
    .music-pl { padding: 20px 22px 22px; display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
    .music-pl .pl-title { margin-top: 0; }
    .music-pl .pl-row { flex: 1; height: auto; margin: 12px 0 0; padding: 0; display: grid; grid-template-columns: repeat(4, 1fr);
                        grid-auto-rows: max-content; overflow-y: auto; scroll-snap-type: none; }
    .music-pl .pl { height: auto; width: 100%; }

    /* calendar */
    .calendar { display: grid; grid-template-columns: 2.7fr 1fr; gap: 18px; height: 100%; min-height: 0; }
    .month { padding: 20px 20px 16px; display: flex; flex-direction: column; min-height: 0; }
    .month-head { display: flex; align-items: center; gap: 10px; padding: 0 4px 12px; }
    .month-head h1 { font-family: var(--display); font-weight: 700; font-size: 28px; margin: 0 auto 0 0;
                     letter-spacing: -0.01em; }
    .month-head h1 .muted { font-weight: 500; }
    .nav-btn { width: 44px; height: 44px; border-radius: 50%; background: var(--inset); display: grid; place-items: center; }
    .today-btn { height: 44px; padding: 0 18px; border-radius: 999px; background: var(--accent-soft);
                 color: var(--accent); font-weight: 600; font-size: 15px; }
    .dow { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; padding: 0 0 6px; }
    .dow span { font-size: 12px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
                color: var(--muted); padding-left: 10px; }
    .mgrid { flex: 1; min-height: 0; display: grid; grid-template-columns: repeat(7, 1fr);
             grid-template-rows: repeat(var(--weeks), 1fr); gap: 6px; }
    .day { min-width: 0; min-height: 0; overflow: hidden; border-radius: 16px; background: var(--inset);
           padding: 6px 6px 6px; display: flex; flex-direction: column; align-items: stretch; gap: 3px; text-align: left; }
    .day.out { background: transparent; }
    .day.out .dnum { color: var(--muted); opacity: 0.6; }
    .day.sel { box-shadow: inset 0 0 0 2px var(--accent); }
    .dnum { width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; flex: none;
            font-size: 15px; font-weight: 600; font-variant-numeric: tabular-nums; }
    .day.today .dnum { background: var(--accent); color: #fff; }
    .chip { font-size: 12px; font-weight: 600; line-height: 1.25; padding: 2px 6px; border-radius: 6px;
            background: color-mix(in srgb, var(--c) 16%, transparent); border-left: 3px solid var(--c);
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: none; }
    .more { font-size: 11px; font-weight: 600; line-height: 16px; color: var(--muted); padding-left: 6px; flex: none; }
    .whatson { padding: 20px 20px 8px; display: flex; flex-direction: column; min-height: 0; }
    .wo-list { flex: 1; min-height: 0; overflow-y: auto; scrollbar-width: none; margin-top: 4px; padding-bottom: 12px; }
    .wo-list::-webkit-scrollbar { display: none; }
    .wo-day { font-size: 13px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase;
              color: var(--muted); margin: 14px 0 8px; }
    .wo-day.is-today { color: var(--accent); }
    .wo-ev { display: grid; grid-template-columns: 56px 4px 1fr; gap: 10px; align-items: stretch;
             padding: 8px 0; }
    .wo-time { font-size: 14px; font-weight: 600; font-variant-numeric: tabular-nums; padding-top: 1px; }
    .wo-ev .bar { border-radius: 4px; }
    .wo-text { min-width: 0; }
    .wo-text .ev-name { font-size: 16px; white-space: normal; }
    .wo-loc { font-size: 13px; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
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

    /* compact: an 8-inch tablet may only be ~600px tall in CSS pixels */
    @media (max-height: 680px) {
      .screen { grid-template-columns: 76px 1fr; }
      .dock { padding: 60px 0 16px 12px; }
      .dock-btn { width: 46px; height: 46px; border-radius: 15px; }
      .dock-btn ha-icon { --mdc-icon-size: 23px; }
      .page { padding: 62px 18px 14px 12px; }
      .topright { top: calc(env(safe-area-inset-top, 0px) + 12px); right: 22px; }
      .topright .clock { font-size: 28px; }
      .topright .temp { font-size: 22px; }
      .kitchen, .col, .calendar { gap: 12px; }
      .month { padding: 14px 14px 12px; }
      .month-head { padding-bottom: 8px; }
      .month-head h1 { font-size: 22px; }
      .nav-btn, .today-btn { height: 38px; }
      .nav-btn { width: 38px; }
      .mgrid, .dow { gap: 4px; }
      .day { border-radius: 12px; padding: 4px; }
      .dnum { width: 24px; height: 24px; font-size: 13px; }
      .chip { font-size: 11px; }
      .whatson { padding: 14px 14px 6px; }
      .card { border-radius: 24px; }
      .card-title { font-size: 15px; }
      .date-card { padding: 14px 14px 12px; }
      .date-top { font-size: 17px; }
      .date-num { margin: 0 0 8px; }
      .wx-card { padding: 8px 12px; border-radius: 16px; gap: 6px; }
      .wx-card ha-icon { --mdc-icon-size: 24px; }
      .wx-temp { font-size: 22px; }
      .wx-cond { font-size: 12px; }
      .wx-hl { font-size: 11px; }
      .media-card { padding: 12px 14px; gap: 8px; }
      .media-row { grid-template-columns: 52px 1fr auto; gap: 10px; }
      .art { width: 52px; height: 52px; border-radius: 12px; }
      .media-title { font-size: 15px; }
      .media-artist { font-size: 13px; }
      .round { width: 40px; height: 40px; }
      .round.small { width: 32px; height: 32px; }
      .where { height: 36px; font-size: 14px; }
      .col-b { padding: 14px 16px 16px; }
      .favs { margin-top: 10px; gap: 10px; grid-template-columns: minmax(120px, 0.75fr) 1.4fr; }
      .pill-wrap, .thermo { padding: 10px 12px; border-radius: 18px; }
      .pill-head { min-height: 34px; }
      .pill-name { font-size: 14px; }
      .pill-state { font-size: 12px; }
      .split { --w: 56px; margin-top: 8px; }
      .seg-bot { padding-bottom: 4px; }
      .seg-ico { width: 44px; height: 44px; }
      .seg-bot ha-icon { --mdc-icon-size: 24px; }
      .swatch { right: 10px; bottom: 10px; width: 16px; height: 16px; }
      .thermo { gap: 8px; }
      .hp-step { width: 48px; height: 48px; border-radius: 14px; }
      .hp-set { font-size: 21px; }
      .modes { height: 52px; gap: 8px; }
      .fav-scenes { margin-top: 8px; gap: 8px; }
      .mini-scene { height: 68px; padding: 7px 4px; gap: 4px; border-radius: 14px; }
      .mini-scene ha-icon { width: 28px; height: 28px; --mdc-icon-size: 18px; }
      .ms-name { font-size: 11px; }
      .hp-target { margin-top: 14px; }
      .mode { border-radius: 14px; font-size: 12px; }
      .mode ha-icon { --mdc-icon-size: 20px; }
      .pl-title { margin-top: 12px; }
      .pl-row { height: 96px; margin: 8px -16px -16px; padding: 0 16px 16px; gap: 10px; scroll-padding: 0 16px; }
      .pl { border-radius: 16px; }
      .pl-name { font-size: 13px; left: 9px; top: 8px; }
      .agenda, .shopping { padding: 12px 14px; gap: 6px; }
      .item { font-size: 15px; padding: 5px 0; }
      .add { width: 30px; height: 30px; }
      .sensors { gap: 10px; }
      .sensor { border-radius: 18px; padding: 8px 10px; }
      .s-val { font-size: 17px; margin-top: 2px; }
      .recipe { gap: 12px; }
      .lib-head h1 { font-size: 22px; }
      .rc-name { font-size: 13px; }
    }

    /* phone: one scrolling column, a floating tab bar, every card at its natural height */
    .screen.phone { display: block; padding-top: 0; }
    .phone .page { height: 100%; overflow-y: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch;
                   padding: calc(env(safe-area-inset-top, 0px) + 14px) 16px calc(env(safe-area-inset-bottom, 0px) + 104px); }
    .phone .card { border-radius: 26px; }
    .tabbar { position: absolute; z-index: 4; left: 16px; right: 16px; bottom: calc(env(safe-area-inset-bottom, 0px) + 12px);
              display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; padding: 7px; border-radius: 28px;
              background: var(--card); border: 1px solid var(--card-edge); box-shadow: 0 10px 40px rgba(22, 42, 84, 0.18);
              backdrop-filter: blur(24px) saturate(1.4); -webkit-backdrop-filter: blur(24px) saturate(1.4); }
    .tabbar .dock-btn { width: auto; height: 54px; display: flex; flex-direction: column; justify-content: center; gap: 2px; }
    .tabbar .dock-btn ha-icon { --mdc-icon-size: 24px; }
    .tabbar .dock-btn span { font-size: 11px; font-weight: 600; }

    /* phone home */
    .ph { display: flex; flex-direction: column; gap: 14px; }
    .ph-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; padding: 6px 4px 4px; }
    .ph-head .date-top { font-size: 15px; margin: 0; }
    .ph-head h1 { font-family: var(--display); font-weight: 700; font-size: 26px; line-height: 1.15; margin: 4px 0 0;
                  letter-spacing: -0.01em; }
    .ph-wx { text-align: right; flex: none; }
    .ph-wx-now { display: flex; align-items: center; gap: 6px; justify-content: flex-end; font-size: 26px; font-weight: 600; }
    .ph-wx-now ha-icon { --mdc-icon-size: 28px; }
    .phone .media-card { flex: none; padding: 16px 18px; }
    .ph-favs { padding: 18px 18px 18px; }
    .ph-favs .favs { flex: none; height: 300px; grid-template-columns: 108px 1fr; gap: 10px; margin-top: 12px; }
    .ph-favs .thermo { padding: 14px 12px 12px; gap: 8px; }
    .ph-favs .hp-temp { font-size: 38px; }
    .ph-favs .hp-mode { font-size: 14px; }
    .ph-favs .hp-target { margin-top: 8px; gap: 6px; }
    .ph-favs .hp-step { width: 46px; height: 46px; border-radius: 15px; }
    .ph-favs .hp-set { font-size: 22px; }
    .ph-favs .modes { height: 58px; gap: 6px; }
    .ph-favs .mode { flex-direction: column; gap: 2px; font-size: 12px; border-radius: 15px; }
    .ph-favs .mode ha-icon { --mdc-icon-size: 20px; }
    .ph-favs .split { --w: 64px; }
    .phone .fav-scenes { margin: 12px -18px 0; padding: 0 18px; overflow-x: auto; scrollbar-width: none;
                         scroll-snap-type: x proximity; scroll-padding: 0 18px; }
    .phone .fav-scenes::-webkit-scrollbar { display: none; }
    .phone .mini-scene { flex: none; width: 84px; height: 84px; padding: 9px 4px; scroll-snap-align: start; }
    .ph-pl { padding: 18px 18px 18px; }
    .ph-pl .pl-title { margin-top: 0; }
    .phone .pl-row { height: 124px; margin: 12px -18px -18px; padding: 0 18px 18px; scroll-padding: 0 18px; }
    .phone .agenda, .phone .shopping { flex: none; padding: 18px; }
    .phone .items { overflow: visible; }

    /* phone rooms */
    .phone .home { height: auto; gap: 14px; }
    .phone .tabs { margin: 0 -16px; padding: 4px 16px 10px; max-width: none; box-sizing: border-box; }
    .phone .tab { height: 42px; padding: 0 16px; font-size: 14px; }
    .phone .room { display: flex; flex-direction: column; gap: 14px; }
    .phone .room-lights { padding: 18px; overflow: visible; }
    .phone .room-favs, .phone .room-favs.no-hp { flex: none; grid-template-columns: repeat(var(--n, 1), 1fr);
                                                 grid-template-rows: 280px; grid-auto-rows: auto; gap: 10px; }
    .phone .room-favs .thermo { grid-column: 1 / -1; }
    .phone .room-favs .hp-target { margin-top: 10px; }
    .phone .room-favs .modes { margin-top: 14px; }
    .phone .room-favs .pill-wrap { padding: 12px 10px; }
    .phone .room-favs .split { --w: 60px; }
    .phone .room-side { margin: 0; padding: 0; overflow: visible; }
    .phone .scenes { margin: 0; padding: 0; overflow: visible; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .phone .scene { min-width: 0; height: 100px; padding: 12px 14px; border-radius: 22px; font-size: 14px; }
    .phone .scene ha-icon { width: 38px; height: 38px; --mdc-icon-size: 20px; }
    .phone .music { display: flex; flex-direction: column; gap: 14px; }
    .phone .music .media-card { padding: 22px 18px 18px; }
    .phone .music-pl { padding: 18px; overflow: visible; }
    .phone .music-pl .pl-row { margin: 12px 0 0; padding: 0; grid-template-columns: repeat(3, 1fr); height: auto; overflow: visible; }

    /* phone calendar: dots in the grid, the list underneath does the talking */
    .phone .calendar { display: flex; flex-direction: column; gap: 14px; height: auto; }
    .phone .month { padding: 16px 12px 12px; }
    .phone .month-head { padding: 0 4px 10px; gap: 8px; }
    .phone .month-head h1 { font-size: 22px; }
    .phone .nav-btn { width: 40px; height: 40px; }
    .phone .today-btn { height: 40px; padding: 0 14px; font-size: 14px; }
    .phone .dow, .phone .mgrid { gap: 4px; }
    .phone .dow span { padding: 0; text-align: center; font-size: 11px; letter-spacing: 0.02em; }
    .phone .mgrid { flex: none; grid-template-rows: repeat(var(--weeks), 50px); }
    .phone .day { border-radius: 12px; padding: 4px 2px; align-items: center; gap: 4px; }
    .phone .dnum { width: 26px; height: 26px; font-size: 14px; }
    .ev-dots { display: flex; gap: 3px; }
    .ev-dots i { width: 6px; height: 6px; border-radius: 50%; }
    .phone .whatson { padding: 18px 18px 6px; }
    .phone .wo-list { overflow: visible; }

    /* phone recipes */
    .phone .recipes { height: auto; gap: 16px; }
    .phone .lib-head h1 { font-size: 24px; }
    .phone .shelf { flex: none; }
    .phone .shelf-row { flex: none; height: 200px; margin: 0 -16px; padding: 2px 16px 8px; scroll-padding: 0 16px; }
    .phone .book-grid { overflow: visible; grid-template-columns: repeat(2, 1fr); gap: 12px; padding: 2px 0 0; }
    .phone .recipe { display: flex; flex-direction: column; gap: 14px; height: auto; }
    .phone .recipe-side, .phone .recipe-main { overflow: visible; border-radius: 26px; padding: 14px 16px 18px; }
    .phone .recipe-side .back { top: 22px; left: 24px; }
    .phone .heart { top: 22px; right: 24px; }
    .phone .steps li { font-size: 16px; }

    /* phone speaker picker: a sheet from the bottom */
    .phone .scrim { position: fixed; place-items: end stretch; padding: 0 10px calc(env(safe-area-inset-bottom, 0px) + 10px); }
    .phone .sheet { width: 100%; border-radius: 28px; }
  `;
}

if (!customElements.get("overlook-show")) customElements.define("overlook-show", OverlookShow);
window.customCards = window.customCards || [];
window.customCards.push({ type: "overlook-show", name: "Overlook Show", description: "Full-screen kitchen display" });
console.info(`%c overlook-show ${VERSION} `, "background:#1d5cf0;color:#fff;border-radius:4px");
