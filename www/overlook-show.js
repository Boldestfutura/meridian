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

const VERSION = "0.22.16";
// artwork for local files that carry none, keyed by the title Music Assistant reports
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, c = max - min;
  if (!c) return [0, 0, l];
  const s = c / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / c + 6) % 6 : max === g ? (b - r) / c + 2 : (r - g) / c + 4;
  return [h * 60, s, l];
}
const TRACK_ART = { "Stream Sounds": "/local/sounds/stream.svg?v=2" };
// the amp's inputs get their own artwork and names in place of album art
const INPUTS = {
  "TV": { art: "/local/inputs/tv.svg?v=1", title: "TV", sub: "TV audio" },
  "Line-in": { art: "/local/inputs/phono.svg?v=1", title: "Phono", sub: "Turntable" },
};
// phone tiles with play/pause and power, always, instead of volume
const POWER_TILES = ["media_player.living_room"];
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

// the bedside screen (Echo Show 5): photos are home (the dock's photo button), then the bedroom's things
const BEDSIDE_PAGES = [
  ["controls", "Controls", "mdi:tune-variant"],
  ["media", "Media", "mdi:music"],
  ["climate", "Climate", "mdi:thermometer"],
  ["calendar", "Calendar", "mdi:calendar-month-outline"],
];

// the Nest Hub in the kitchen (7", 1024x600): photos are home, then the kitchen and living room
const HUB_PAGES = [
  ["controls", "Controls", "mdi:tune-variant"],
  ["media", "Media", "mdi:music"],
  ["climate", "Climate", "mdi:thermometer"],
  ["calendar", "Calendar", "mdi:calendar-month-outline"],
  ["recipes", "Recipes", "mdi:silverware-fork-knife"],
];

// the air monitor's readings: long name, colour and a one-word verdict (as on the old room screens)
const AIR = {
  temperature: ["Temperature", "#e0a63c", (v) => v < 17 ? "Cool" : v > 25 ? "Warm" : "Comfortable"],
  humidity: ["Humidity", "#5a7ea8", (v) => v < 35 ? "Dry" : v > 60 ? "Humid" : "Comfortable"],
  pm2_5: ["Fine dust (PM2.5)", "#3f8f63", (v) => v <= 12 ? "Good" : v <= 35 ? "Moderate" : "Poor"],
  voc: ["Air quality (VOC)", "#3f8f8a", (v) => v <= 150 ? "Good" : v <= 250 ? "Moderate" : "Poor"],
};

// the phone's tab bar: one Home page laid out like ha-phone, plus the calendar and recipes
const PHONE_PAGES = [
  ["kitchen", "Home", "mdi:home-variant-outline"],
  ["calendar", "Calendar", "mdi:calendar-month-outline"],
  ["recipes", "Recipes", "mdi:silverware-fork-knife"],
];

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
// every volume -/+ button moves this much
const VOL_STEP = 0.03;
// HA's companion app turns a window "haptic" event into a real tap on the phone (iPhones
// have no navigator.vibrate); this is the same event button-card fires
// colour presets for the light sheet: hue, saturation, name
const SWATCHES = [[0, 90, "Red"], [25, 95, "Orange"], [45, 90, "Yellow"], [120, 70, "Green"],
  [180, 70, "Cyan"], [220, 85, "Blue"], [270, 75, "Purple"], [320, 70, "Pink"]];

// the Overlook tile card: what an entity becomes, and the icons it falls back to
const DOMAIN_TYPE = {
  light: "light", media_player: "media", climate: "climate", switch: "switch", input_boolean: "switch",
  fan: "switch", cover: "switch", sensor: "sensor", binary_sensor: "sensor", lock: "sensor",
  scene: "scene", script: "scene",
};
const DOMAIN_ICON = {
  light: "mdi:lightbulb", media_player: "mdi:speaker", climate: "mdi:thermostat", switch: "mdi:toggle-switch-outline",
  input_boolean: "mdi:toggle-switch-outline", fan: "mdi:fan", cover: "mdi:window-shutter", sensor: "mdi:eye-outline",
  binary_sensor: "mdi:checkbox-blank-circle-outline", lock: "mdi:lock", scene: "mdi:palette", script: "mdi:script-text-outline",
};
const CLASS_ICON = {
  temperature: "mdi:thermometer", humidity: "mdi:water-percent", moisture: "mdi:water", battery: "mdi:battery",
  power: "mdi:flash", energy: "mdi:lightning-bolt", illuminance: "mdi:brightness-5", pm25: "mdi:blur",
  door: "mdi:door", window: "mdi:window-closed-variant", motion: "mdi:motion-sensor", occupancy: "mdi:home-account",
  carbon_dioxide: "mdi:molecule-co2", volatile_organic_compounds_parts: "mdi:air-filter", aqi: "mdi:air-filter",
};
const TYPE_ICON = { light: "mdi:lightbulb", media: "mdi:speaker", climate: "mdi:thermostat", plant: "mdi:sprout",
                    switch: "mdi:toggle-switch-outline", sensor: "mdi:eye-outline", scene: "mdi:palette" };

const loadFonts = () => {
  if (document.getElementById("overlook-show-fonts")) return;
  const l = document.createElement("link");
  l.id = "overlook-show-fonts";
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Unbounded:wght@500;700;800&family=Figtree:wght@400;500;600;700&display=swap";
  document.head.appendChild(l);
};

const fireHaptic = (type = "light") => {
  window.dispatchEvent(new CustomEvent("haptic", { detail: type, bubbles: true, composed: true }));
};

class OverlookShow extends LitElement {
  static properties = {
    hass: { attribute: false },
    _page: { state: true },
    _drag: { state: true },
    _picker: { state: true },
    _scenes: { state: true },
    _todo: { state: true },
    _events: { state: true },
    _cal: { state: true },
    _month: { state: true },
    _sel: { state: true },
    _dayOpen: { state: true },
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
    _pop: { state: true },
    _light: { state: true },
    _ct: { state: true },
    _hist: { state: true },
    _wx: { state: true },
    _daily: { state: true },
    _hourly: { state: true },
    _chance: { state: true },
    _ckNow: { state: true },
    _ckShow: { state: true },
    _npHidden: { state: true },
    _npNow: { state: true },
  };

  setConfig(config) {
    this._config = Object.assign({
      idle: 300, photos: null, weather: "weather.forecast_home",
      lights: [], climate: null, speakers: [], calendars: [], todo: null, sensors: [], rooms: [], scenes: [],
      phone: false, status: [], status_air: [], phone_rooms: [], popups: {}, links: {},
    }, config);
    if (this._config.phone) this._config.photos = null;
    this._page = this._config.desk ? "desk" : this._config.bedside ? "photos"
      : this._config.page || (this._config.photos ? "photos" : "kitchen");
    if (this._page === "calendar") { this._page = null; this._go("calendar"); }
    this._drag = null;
    this._picker = false;
    this._todo = [];
    this._events = null;
    this._forecast = null;
    this._now = new Date();
    this._uncovered = false;
    try { this._speaker = localStorage.getItem(this._spKey()); } catch (e) {}
  }

  getCardSize() { return 12; }
  // the picked speaker is remembered per screen kind, so the bedside doesn't inherit the kitchen's
  _spKey() { return this._config && this._config.bedside ? "overlook-show-speaker-bed" : "overlook-show-speaker"; }

  connectedCallback() {
    super.connectedCallback();
    this._clock = setInterval(() => { this._now = new Date(); }, 15000);
    this._touch = () => { this._touchedAt = Date.now(); this._poke(); };
    window.addEventListener("pointerdown", this._touch, true);
    window.addEventListener("keydown", this._touch, true);
    this._poke();
    // windowed (the computer): sit beside HA's sidebar with HA's header hidden,
    // rather than over the whole window as on the kitchen tablet
    if (this._config && this._config.windowed) {
      const hide = () => {
        const r = findHuiRoot();
        if (r !== this._root) { styleHuiRoot(this._root, ""); this._root = r; }
        styleHuiRoot(r, r && r.lovelace && r.lovelace.editMode ? "" : HIDE_HEADER);
      };
      this._hdr = setInterval(hide, 400);
      hide();
    }
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
    clearTimeout(this._wxTimer);
    clearInterval(this._ckTick); this._ckTick = null;
    clearTimeout(this._ckShowTimer);
    clearInterval(this._npTick); this._npTick = null;
    clearTimeout(this._npPause);
    window.removeEventListener("pointerdown", this._touch, true);
    window.removeEventListener("keydown", this._touch, true);
    if (this._hdr) { clearInterval(this._hdr); this._hdr = null; styleHuiRoot(this._root, ""); }
    this._unsub();
  }

  // bedside night mode: `night` is an input_boolean the bedroom automation turns on 9pm-7:30am
  _night() { const e = this._st(this._config && this._config.night); return !!e && e.state === "on"; }

  _poke() {
    clearTimeout(this._idleTimer);
    if (!this._config || !this._config.photos) return;
    // at night a woken screen goes back to the red clock after 30s, not five minutes
    this._idleTimer = setTimeout(() => {
      if (this._recipe) { this._poke(); return; }    // never leave a recipe mid-cook
      this._picker = false;
      this._scenes = false;
      this._pop = null;
      this._light = null;
      this._page = "photos";
      this._npHidden = false;   // music still on: back to the now-playing screen
    }, (this._night() ? 30 : this._config.idle) * 1000);
  }

  // --- subscriptions: shopping list, forecast, calendar --------------------
  updated(changed) {
    if (changed.has("hass") && this._drag) this._settle();
    // night mode switching on sends the screen home, where it shows the red clock
    if (changed.has("hass") && this._config.night) {
      const n = this._night();
      if (n && this._wasNight === false) { this._go("photos"); this._poke(); }
      this._wasNight = n;
    }
    // voice: the Assist weather automations write {area, action, range, dates} to
    // input_text.overlook_voice (a state, so non-admin screen users can see it; custom
    // events need admin); only the screen whose `voice` is that area reacts
    if (changed.has("hass") && this._config.voice) {
      const v = this._st("input_text.overlook_voice");
      if (v && v.last_changed !== this._voiceSeen) {
        const first = this._voiceSeen === undefined;
        this._voiceSeen = v.last_changed;
        if (!first) { try { this._onVoice(JSON.parse(v.state)); } catch (e) {} }
      }
    }
    if (changed.has("hass") && this._config.scheme) {
      const e = this._st(this._config.scheme);
      const dark = e ? ["below_horizon", "on", "dark"].includes(e.state) : null;
      if (dark === null) this.removeAttribute("scheme");
      else this.setAttribute("scheme", dark ? "dark" : "light");
    }
    if (changed.has("hass") && this._config.clock) this._ckWatch();
    if (changed.has("hass") && this._config.nowplaying) this._npWatch();
    if (this._config.nowplaying) this._marquee();
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
          (m) => { this._daily = m.forecast || []; this._forecast = this._daily[0] || null; },
          { type: "weather/subscribe_forecast", entity_id: c.weather, forecast_type: "daily" }));
      } catch (e) { console.warn("overlook-show: forecast", e); }
    }
    // voice: the hourly forecast, for the weather page a voice question opens
    if (c.voice) {
      if (c.weather) {
        try {
          this._subs.push(await conn.subscribeMessage(
            (m) => { this._hourly = m.forecast || []; },
            { type: "weather/subscribe_forecast", entity_id: c.weather, forecast_type: "hourly" }));
        } catch (e) { console.warn("overlook-show: hourly", e); }
      }
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

  _onVoice(d) {
    if (d.area !== this._config.voice) return;
    clearTimeout(this._wxTimer);
    // "what's the temp in here" or a climate alert: the Climate page for a minute, then home
    // unless someone has touched the screen since
    if (d.action === "climate") {
      this._wx = null;
      const at = Date.now();
      this._go("climate");
      this._poke();
      this._wxTimer = setTimeout(() => {
        if (this._page === "climate" && !(this._touchedAt > at)) this._go("photos");
      }, 60 * 1000);
      return;
    }
    if (d.action !== "weather") { this._wx = null; return; }
    const week = d.range === "week";
    this._wx = { week, dates: d.dates || [] };
    this._loadChance();
    this._poke();
    this._wxTimer = setTimeout(() => { this._wx = null; }, (week ? 60 : 40) * 1000);
  }

  // chance of rain: met.no gives millimetres only, so ask Open-Meteo (free, no key, CORS)
  // for the percentages at HA's home location; kept for 30 minutes
  async _loadChance() {
    if (this._chance && Date.now() - this._chance.at < 30 * 60 * 1000) return;
    const { latitude, longitude } = this.hass.config;
    try {
      const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}`
        + "&daily=precipitation_probability_max&hourly=precipitation_probability&timezone=auto&forecast_days=7");
      const j = await r.json(), daily = {}, hourly = {};
      j.daily.time.forEach((t, i) => { daily[t] = j.daily.precipitation_probability_max[i]; });
      j.hourly.time.forEach((t, i) => { hourly[t.slice(0, 13)] = j.hourly.precipitation_probability[i]; });
      this._chance = { at: Date.now(), daily, hourly };
    } catch (e) { console.warn("overlook-show: rain chance", e); }
  }

  // --- helpers --------------------------------------------------------------
  _st(id) { return id && this.hass ? this.hass.states[id] : undefined; }
  // weather: met.no goes unavailable for hours at a time; say so instead of "NaN°" and a guessed "Cloudy"
  _cond(w) {
    if (!w || w.state === "unavailable" || w.state === "unknown") return ["mdi:cloud-off-outline", "No forecast", "var(--muted)"];
    return WEATHER[w.state] || WEATHER.cloudy;
  }
  _deg(t) { return typeof t === "number" && isFinite(t) ? `${Math.round(t)}°` : "–"; }
  _links() { return this._config.links || {}; }
  _call(domain, service, data) {
    fireHaptic();
    return this.hass.callService(domain, service, data);
  }
  _go(page) {
    this._picker = false;
    this._scenes = false;
    this._pop = null;
    this._light = null;
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
  // the voice glow sits over whatever screen is showing
  render() {
    return html`${this._screen()}${this._npLayer()}${this._clockLayer()}${this._glow()}`;
  }

  // --- voice clock: timer and alarm screens --------------------------------
  // option `clock`: an area id whose helpers the "Voice Timers and Alarms" automations drive:
  // timer.<a>_timer, input_number.<a>_timer_length (seconds, for Reset), input_datetime.<a>_alarm_time,
  // input_boolean.<a>_alarm (set) and input_select.<a>_ringing (Off / Timer / Alarm).
  // A running or ringing timer and a ringing alarm take the whole screen until they're done;
  // a newly set alarm shows for 8 seconds and goes.
  _ck() {
    const a = this._config && this._config.clock;
    if (!a) return null;
    const s = (d, n) => this._st(`${d}.${a}_${n}`);
    const ring = s("input_select", "ringing");
    return { a, timer: s("timer", "timer"), len: s("input_number", "timer_length"), at: s("input_datetime", "alarm_time"),
             armed: s("input_boolean", "alarm"), ring: ring ? ring.state : "Off" };
  }

  _ckWatch() {
    const c = this._ck();
    if (!c) return;
    const t = c.timer && c.timer.state;
    const live = t === "active" || c.ring !== "Off";
    if (live && !this._ckTick) { this._ckNow = Date.now(); this._ckTick = setInterval(() => { this._ckNow = Date.now(); }, 1000); }
    if (!live && this._ckTick) { clearInterval(this._ckTick); this._ckTick = null; }
    if (c.ring === "Alarm") this._ckRangAt = Date.now();
    // an alarm being set (or moved) while this screen is up shows it for 8 seconds
    const key = c.armed && c.armed.state === "on" && c.at ? `${c.at.state}|${c.armed.last_changed}` : null;
    if (key !== this._ckSeen) {
      const first = this._ckSeen === undefined;
      this._ckSeen = key;
      if (!first && key && c.ring === "Off") {
        this._ckShow = { snoozed: Date.now() - (this._ckRangAt || 0) < 5000 };
        clearTimeout(this._ckShowTimer);
        this._ckShowTimer = setTimeout(() => { this._ckShow = null; }, 8000);
      } else if (!key) { this._ckShow = null; }
    }
  }

  _ckDur(s) {
    s = Math.max(0, Math.round(s));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    return h ? `${h}:${String(m).padStart(2, "0")}:${String(x).padStart(2, "0")}` : `${m}:${String(x).padStart(2, "0")}`;
  }
  // digits as big as the screen allows: Unbounded 800 digits are about 0.8em wide, colons 0.4em
  _ckFit(text, extra = 0) {
    const s = String(text);
    const em = [...s].reduce((w, ch) => w + (ch === ":" ? 0.4 : 0.8), 0) + extra;
    return `font-size:min(44vh, ${(58 / em).toFixed(2)}vw)`;
  }
  _ckSecs(hms) {
    const p = String(hms || "0:0:0").split(":").map(Number);
    return (p[0] || 0) * 3600 + (p[1] || 0) * 60 + (p[2] || 0);
  }

  _clockLayer() {
    const c = this._ck();
    if (!c || !this.hass) return nothing;
    const tm = c.timer, ts = tm ? tm.state : "idle";
    const length = c.len ? Number(c.len.state) || 0 : 0;
    const total = length || (tm ? this._ckSecs(tm.attributes.duration) : 0);
    const ringing = c.ring !== "Off";
    // a dark bedroom keeps the night clock's red; a ringing screen is bright to wake you
    const dark = this._night() && !ringing;
    const cls = `screen ck ${dark ? "ck-night" : ""}`;
    const now = this._ckNow || Date.now();
    const stop = (e) => {
      e.stopPropagation();
      if (ringing) this._call("input_select", "select_option", { entity_id: `input_select.${c.a}_ringing`, option: "Off" });
      else this._call("timer", "cancel", { entity_id: `timer.${c.a}_timer` });
    };
    const reset = (e) => {
      e.stopPropagation();
      if (!total) return;
      if (ringing) this._call("input_select", "select_option", { entity_id: `input_select.${c.a}_ringing`, option: "Off" });
      this._call("timer", "start", { entity_id: `timer.${c.a}_timer`, duration: total });
    };
    const btn = (label, icon, fn, main) => html`
      <button class="ck-btn ${main ? "main" : ""}" @click=${fn}><ha-icon icon=${icon}></ha-icon>${label}</button>`;

    if (c.ring === "Alarm") {
      const d = new Date(now);
      const [h, mm] = this._time(d).split(":");
      return html`
        <div class=${cls}>
          <div class="ck-top">
            <div class="ck-label"><ha-icon icon="mdi:alarm"></ha-icon>Alarm</div>
            <div class="ck-digits ring" style=${this._ckFit(h + ":" + mm)}>${h}<span class="ck-colon">:</span>${mm}</div>
          </div>
          <div class="ck-btns">
            ${btn("Stop", "mdi:stop", stop)}
            ${btn("Snooze", "mdi:alarm-snooze", (e) => { e.stopPropagation();
              this._call("script", "voice_clock_snooze", { area: c.a }); }, true)}
          </div>
        </div>`;
    }

    if (c.ring === "Timer" || ts === "active" || ts === "paused") {
      const left = c.ring === "Timer" ? 0
        : ts === "paused" ? this._ckSecs(tm.attributes.remaining)
        : (new Date(tm.attributes.finishes_at).getTime() - now) / 1000;
      const txt = this._ckDur(Math.ceil(left - 0.05));
      const pct = total ? Math.max(0, Math.min(100, (left / total) * 100)) : 0;
      const label = c.ring === "Timer" ? "Time's up" : ts === "paused" ? "Paused" : "Timer";
      const toggle = (e) => {
        e.stopPropagation();
        if (ts === "active") this._call("timer", "pause", { entity_id: `timer.${c.a}_timer` });
        else if (ts === "paused") this._call("timer", "start", { entity_id: `timer.${c.a}_timer` });
      };
      return html`
        <div class=${cls}>
          <div class="ck-top">
            <div class="ck-label"><ha-icon icon=${c.ring === "Timer" ? "mdi:bell-ring" : "mdi:timer-outline"}></ha-icon>${label}
              ${total && c.ring !== "Timer" ? html`<span class="ck-of">of ${this._ckDur(total)}</span>` : nothing}</div>
            <div class="ck-digits ${c.ring === "Timer" ? "ring" : ""} ${ts === "paused" ? "paused" : ""}"
                 style=${this._ckFit(txt)} @click=${toggle}>${txt}</div>
          </div>
          <div class="ck-track"><div style="width:${pct}%"></div></div>
          <div class="ck-btns">
            ${btn("Reset", "mdi:restore", reset)}
            ${btn("Stop", "mdi:stop", stop, true)}
          </div>
        </div>`;
    }

    if (this._ckShow && c.at && c.armed && c.armed.state === "on") {
      const at = new Date(c.at.state.replace(" ", "T"));
      const [h, mm] = this._time(at).split(":");
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const days = Math.round((new Date(at.getFullYear(), at.getMonth(), at.getDate()) - today) / 864e5);
      const day = days === 0 ? "Today" : days === 1 ? "Tomorrow" : at.toLocaleDateString("en-AU", { weekday: "long" });
      const mins = Math.max(0, Math.round((at - Date.now()) / 6e4));
      const inTxt = mins < 60 ? `in ${mins} min` : `in ${Math.floor(mins / 60)} h${mins % 60 ? ` ${mins % 60} min` : ""}`;
      return html`
        <div class=${cls} @click=${() => { clearTimeout(this._ckShowTimer); this._ckShow = null; }}>
          <div class="ck-top">
            <div class="ck-label"><ha-icon icon=${this._ckShow.snoozed ? "mdi:alarm-snooze" : "mdi:alarm-check"}></ha-icon>
              ${this._ckShow.snoozed ? "Snoozed" : "Alarm set"}</div>
            <div class="ck-digits" style=${this._ckFit(h + ":" + mm, 0.5)}>${h}<span class="ck-colon">:</span>${mm}<span class="ck-ampm">${at.getHours() < 12 ? "am" : "pm"}</span></div>
          </div>
          <div class="ck-when">${day}<span>${inTxt}</span></div>
        </div>`;
    }
    return nothing;
  }

  // option `nowplaying`: the screen's own speaker. Music on it (cast from Spotify or started
  // anywhere) takes the whole screen like the timer, and stays until it stops or is closed
  // with the chevron; the idle return brings it back while it's still playing, and a pause
  // lets it go after `idle`. Sleep Sounds and a dark room never show it.
  _npEnt() {
    const id = this._config && this._config.nowplaying;
    const e = id && this._st(id);
    if (!e || !["playing", "paused"].includes(e.state)) return null;
    const a = e.attributes;
    if (!a.media_title || TRACK_ART[a.media_title] || String(a.media_content_id || "").includes("/local/sounds/")) return null;
    return e;
  }

  _npWatch() {
    const e = this._npEnt(), st = e ? e.state : "off";
    if (st === "playing" && this._npWas !== "playing") this._npHidden = false;
    if (st === "paused" && this._npWas === "playing") {
      clearTimeout(this._npPause);
      this._npPause = setTimeout(() => {
        const x = this._npEnt();
        if (!x || x.state !== "playing") this._npHidden = true;
      }, this._config.idle * 1000);
    }
    this._npWas = st;
    const live = st === "playing" && !this._npHidden;
    if (live && !this._npTick) { this._npNow = Date.now(); this._npTick = setInterval(() => { this._npNow = Date.now(); }, 1000); }
    if (!live && this._npTick) { clearInterval(this._npTick); this._npTick = null; }
  }

  // .mq text wider than its box scrolls to the end and back, at about 40px a second
  _marquee() {
    const els = this.renderRoot && this.renderRoot.querySelectorAll(".mq");
    if (!els || !els.length) return;
    requestAnimationFrame(() => els.forEach((el) => {
      const dx = Math.max(0, el.firstElementChild.scrollWidth - el.clientWidth);
      const key = dx > 2 ? String(Math.round(dx)) : "";
      if (el.dataset.dx === key) return;
      el.dataset.dx = key;
      el.classList.toggle("run", !!key);
      el.style.setProperty("--dx", `-${Math.round(dx)}px`);
      el.style.setProperty("--t", `${Math.max(6, dx / 40 / 0.64 + 2).toFixed(1)}s`);
    }));
  }

  // the music screen's accent: the album art's strongest colour, lifted to read on the dark
  // ground (orange until it loads, and for grey or unreadable art)
  _npAccent(pic) {
    if (!pic) return null;
    if (this._npPic === pic) return this._npCol;
    this._npPic = pic;
    this._npCol = null;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (this._npPic !== pic) return;
      try {
        // 64px with no smoothing: a scaled-down cover blends thin colour (lines, type) into the ground
        const n = 64, cv = document.createElement("canvas");
        cv.width = cv.height = n;
        const cx = cv.getContext("2d");
        cx.imageSmoothingEnabled = false;
        cx.drawImage(img, 0, 0, n, n);
        const d = cx.getImageData(0, 0, n, n).data, bins = {};
        for (let i = 0; i < d.length; i += 4) {
          const [h, sat, l] = rgbToHsl(d[i], d[i + 1], d[i + 2]);
          if (l < 0.12 || l > 0.92 || sat < 0.25) continue;
          const k = Math.round(h / 20) % 18, w = sat * sat * (1 - Math.abs(l - 0.5));
          const b = bins[k] || (bins[k] = { w: 0, x: 0, y: 0, s: 0 });
          const rad = h * Math.PI / 180;   // hue is circular: average it as a vector so 355 and 5 make 0
          b.w += w; b.x += Math.cos(rad) * w; b.y += Math.sin(rad) * w; b.s += sat * w;
        }
        const best = Object.values(bins).sort((x, y) => y.w - x.w)[0];
        if (!best || best.w < n * n * 0.01) return;
        const h = (Math.atan2(best.y, best.x) * 180 / Math.PI + 360) % 360, sat = Math.max(0.55, best.s / best.w);
        this._npCol = { hot: `hsl(${h.toFixed(0)} ${(sat * 100).toFixed(0)}% 64%)`, on: "#120d08" };
        this.requestUpdate();
      } catch (e) { /* cross-origin art: keep orange */ }
    };
    img.src = pic;
    return null;
  }

  _npLayer() {
    if (this._npHidden || this._wx || !this.hass || this._night()) return nothing;
    const e = this._npEnt();
    if (!e) return nothing;
    const a = e.attributes, id = e.entity_id, playing = e.state === "playing";
    const pic = this._pic(a);
    const col = this._npAccent(pic);
    const dur = a.media_duration || 0;
    let pos = a.media_position || 0;
    if (playing && a.media_position_updated_at) pos += ((this._npNow || Date.now()) - new Date(a.media_position_updated_at).getTime()) / 1000;
    pos = Math.max(0, dur ? Math.min(dur, pos) : pos);
    const src = String(a.app_name || a.source || "").replace(/\s*\(.*\)$/, "").replace(/ Connect$/, "");
    const call = (svc, d = {}) => (ev) => { ev.stopPropagation(); this._call("media_player", svc, Object.assign({ entity_id: id }, d)); };
    const b = (icon, fn, cls = "") => html`<button class="np-btn ${cls}" @click=${fn}><ha-icon icon=${icon}></ha-icon></button>`;
    return html`
      <div class="screen np" style=${col ? `--np-hot:${col.hot};--np-on:${col.on}` : ""}>
        ${pic ? html`<div class="np-blur" style="background-image:url('${pic}')"></div>` : nothing}
        <div class="np-art" style=${pic ? `background-image:url('${pic}')` : ""}>
          ${pic ? nothing : html`<ha-icon icon="mdi:music-note"></ha-icon>`}</div>
        <div class="np-side">
          <div class="np-head">
            <div class="np-src"><ha-icon icon=${playing ? "mdi:music" : "mdi:pause"}></ha-icon>${playing ? (src || "Now playing") : "Paused"}</div>
            ${b("mdi:chevron-down", (ev) => { ev.stopPropagation(); this._npHidden = true; }, "x")}
          </div>
          <div class="np-title mq"><span>${a.media_title}</span></div>
          <div class="np-artist mq"><span>${a.media_artist || ""}</span></div>
          ${dur ? html`
            <div class="np-track"><div style="width:${(pos / dur) * 100}%"></div></div>
            <div class="np-times"><span>${this._ckDur(pos)}</span><span>-${this._ckDur(dur - pos)}</span></div>` : nothing}
          <div class="np-ctl">
            ${b("mdi:skip-previous", call("media_previous_track"))}
            ${b(playing ? "mdi:pause" : "mdi:play", call("media_play_pause"), "main")}
            ${b("mdi:skip-next", call("media_next_track"))}
          </div>
        </div>
      </div>`;
  }

  // voice: a blue glow round the screen edge while the Assist satellite (`voice_satellite`)
  // is listening, processing or answering, like the light ring on an Echo
  _glow() {
    const id = this._config && this._config.voice_satellite;
    const e = id && this._st(id);
    const st = e && ["listening", "processing", "responding"].includes(e.state) ? e.state : null;
    return st ? html`<div class="va-glow ${st}"></div>` : nothing;
  }

  _screen() {
    if (!this.hass || !this._config) return nothing;
    if (this._uncovered) {
      return html`<button class="restore" @click=${() => { this._uncovered = false; }}>
        <ha-icon icon="mdi:fullscreen"></ha-icon></button>`;
    }
    if (this._config.phone) {
      return html`
        <div class="screen phone">
          <main class="page" @scroll=${() => { this._scrolledAt = performance.now(); }}>${this._pageBody()}</main>
          ${this._tabBar()}
          ${this._picker ? this._speakerSheet() : nothing}
          ${this._pop ? this._popSheet() : nothing}
          ${this._light ? this._lightSheet() : nothing}
        </div>`;
    }
    if (this._wx) return this._wxPage();
    const photos = this._page === "photos", bed = this._config.bedside;
    if (bed && photos && this._night()) return this._nightClock();
    return html`
      <div class="screen ${this._config.windowed ? "windowed" : ""} ${this._config.desk ? "desk-screen" : ""}
                  ${bed ? "bedside" : ""} ${this._config.hub ? "hub" : ""} ${photos ? "on-photo" : ""}">
        ${photos ? this._photos() : nothing}
        ${this._config.desk ? nothing : this._dock()}
        ${photos ? nothing : html`<main class="page">${this._pageBody()}</main>`}
        ${this._page === "kitchen" || this._page === "desk" ? this._status() : nothing}
        ${this._config.desk || (bed && !photos) ? nothing : this._topRight(photos)}
        ${this._picker ? this._speakerSheet() : nothing}
        ${this._scenes ? this._scenesSheet() : nothing}
        ${this._pop ? this._popSheet() : nothing}
        ${this._light ? this._lightSheet() : nothing}
        ${this._dayOpen && this._page === "calendar" ? this._daySheet() : nothing}
      </div>`;
  }

  // the bedside at night: a big red clock on black, nothing else; a tap wakes the dock on Lights.
  // It drifts a few pixels each minute so nothing sits on the same pixels all night.
  _nightClock() {
    const d = this._now, m = d.getMinutes();
    const [h, mm] = this._time(d).split(":");
    const date = d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" }).replace(",", "");
    return html`
      <div class="screen night" @click=${() => this._go("controls")}>
        <div class="night-face" style="transform:translate(${(m * 7) % 25 - 12}px, ${(m * 5) % 17 - 8}px)">
          <div class="night-time">${h}<span class="night-colon">:</span>${mm}</div>
          <div class="night-date">${date}</div>
        </div>
      </div>`;
  }

  // the full-screen forecast a voice question opens: one day (with its hours when the
  // hourly forecast reaches it) or the days asked for side by side. A tap closes it.
  _wxPage() {
    const ymd = (x) => this._ymd(new Date(x.datetime));
    const today = this._ymd(new Date()), tmrw = this._ymd(new Date(Date.now() + 864e5));
    const daily = this._daily || [];
    const want = this._wx.dates.length ? this._wx.dates : [today];
    const days = daily.filter((f) => want.includes(ymd(f)));
    const label = (f, short) => {
      const k = ymd(f), d = new Date(f.datetime);
      if (k === today) return "Today";
      if (k === tmrw && !short) return "Tomorrow";
      return d.toLocaleDateString("en-AU", short ? { weekday: "short" } : { weekday: "long", day: "numeric", month: "short" });
    };
    const icon = (c) => (WEATHER[c] || WEATHER.cloudy);
    const rain = (f) => (f.precipitation >= 0.2 ? `${f.precipitation < 1 ? "<1" : Math.round(f.precipitation)} mm` : "");
    const close = () => { clearTimeout(this._wxTimer); this._wx = null; };
    let body;
    if (!days.length) {
      body = html`<div class="wx-none">No forecast</div>`;
    } else if (!this._wx.week || days.length === 1) {
      const f = days[0], k = ymd(f), [ic, name, col] = icon(f.condition);
      const now = Date.now() - 36e5;
      const hours = (this._hourly || []).filter((h) => ymd(h) === k && new Date(h.datetime) >= now)
        .filter((h, i) => i % 3 === 0).slice(0, 6);
      const ch = this._chance, pct = ch && ch.daily[k];
      const hpct = (h) => { const d = new Date(h.datetime); return ch && ch.hourly[`${this._ymd(d)}T${String(d.getHours()).padStart(2, "0")}`]; };
      body = html`
        <div class="wx-day">
          <div class="wx-main">
            <div class="wx-label">${label(f)}</div>
            <ha-icon class="wx-big" icon=${ic} style="color:${col}"></ha-icon>
            <div class="wx-name">${name}</div>
          </div>
          <div class="wx-side">
            <div class="wx-temps"><span class="wx-hi">${this._deg(f.temperature)}</span>
              <span class="wx-lo">${this._deg(f.templow)}</span></div>
            <div class="wx-facts">
              ${typeof pct === "number" ? html`<span><ha-icon icon="mdi:umbrella"></ha-icon>${pct}% chance</span>` : nothing}
              ${rain(f) ? html`<span><ha-icon icon="mdi:water"></ha-icon>${rain(f)}</span>` : html`<span><ha-icon icon="mdi:water-off"></ha-icon>Dry</span>`}
              ${typeof f.wind_speed === "number" ? html`<span><ha-icon icon="mdi:weather-windy"></ha-icon>${Math.round(f.wind_speed)} km/h</span>` : nothing}
              ${typeof f.uv_index === "number" ? html`<span><ha-icon icon="mdi:sun-wireless"></ha-icon>UV ${Math.round(f.uv_index)}</span>` : nothing}
            </div>
            ${hours.length > 1 ? html`
              <div class="wx-hours">${hours.map((h) => html`
                <div class="wx-hour">
                  <span>${this._ampm(new Date(h.datetime))}</span>
                  <ha-icon icon=${icon(h.condition)[0]} style="color:${icon(h.condition)[2]}"></ha-icon>
                  <b>${this._deg(h.temperature)}</b>
                  ${typeof hpct(h) === "number" ? html`<i class="wx-pct">${hpct(h)}%</i>` : nothing}
                </div>`)}</div>` : nothing}
          </div>
        </div>`;
    } else {
      body = html`
        <div class="wx-week" style="grid-template-columns:repeat(${days.length}, minmax(0, 1fr))">
          ${days.map((f) => { const [ic, name, col] = icon(f.condition); return html`
            <div class="wx-col">
              <span class="wx-dow">${label(f, true)}</span>
              <ha-icon icon=${ic} style="color:${col}"></ha-icon>
              <span class="wx-cname">${name}</span>
              <b class="wx-chi">${this._deg(f.temperature)}</b>
              <span class="wx-clo">${this._deg(f.templow)}</span>
              <span class="wx-crain">${rain(f) || "\u00a0"}</span>
            </div>`; })}
        </div>`;
    }
    return html`<div class="screen wx-screen ${this._night() ? "wx-night" : ""}" @click=${close}>${body}</div>`;
  }

  _topRight(onPhoto) {
    const w = this._st(this._config.weather);
    const cond = w ? this._cond(w) : null;
    const t = w && w.attributes.temperature;
    const [down, up] = this._holdToUncover();
    return html`
      <div class="topright ${onPhoto ? "on-photo" : ""}"
           @pointerdown=${down} @pointerup=${up} @pointerleave=${up}>
        ${cond ? html`<ha-icon class="wx" icon=${cond[0]}
            style="color:${onPhoto ? "#fff" : cond[2]}"></ha-icon>
          <span class="temp">${this._deg(t)}</span>` : nothing}
        <span class="clock">${this._time(this._now)}</span>
      </div>
      ${onPhoto ? this._npLine() : nothing}`;
  }

  // under the clock on photos: what the `nowplaying` speaker is playing; a tap opens it full screen
  _npLine() {
    const e = this._npEnt();
    if (!e) return nothing;
    const a = e.attributes;
    return html`
      <button class="np-line" @click=${(ev) => { ev.stopPropagation(); this._npHidden = false; }}>
        <ha-icon icon=${e.state === "playing" ? "mdi:music" : "mdi:pause"}></ha-icon>
        <span class="np-line-text"><b class="mq"><span>${a.media_title}</span></b>${a.media_artist ? html`<span class="mq"><span>${a.media_artist}</span></span>` : nothing}</span>
      </button>`;
  }

  // holding for 1.5s uncovers HA underneath, for edit mode
  _holdToUncover() {
    let hold;
    return [() => { hold = setTimeout(() => { fireHaptic("medium"); this._uncovered = true; }, 1500); }, () => clearTimeout(hold)];
  }

  // holding the Home tab uncovers HA (the phone has no clock to hold)
  _tabBar() {
    const [down, up] = this._holdToUncover();
    return html`
      <nav class="tabbar">
        ${PHONE_PAGES.map(([id, name, icon]) => html`
          <button class="dock-btn ${this._page === id ? "on" : ""}" @click=${() => { fireHaptic("selection"); this._go(id); this._top(); }}
                  @pointerdown=${id === "kitchen" ? down : null} @pointerup=${up} @pointerleave=${up}>
            <ha-icon icon=${icon}></ha-icon><span>${name}</span>
          </button>`)}
      </nav>`;
  }

  _top() {
    const p = this.shadowRoot && this.shadowRoot.querySelector(".page");
    if (p) p.scrollTop = 0;
  }

  // --- status pills: who's home, then anything that needs a look ---------------
  // People are always shown; the rest appear only while their entity is in `when` (default "on").
  _status() {
    const pills = (this._config.status || []).map((x) => {
      const e = this._st(x.entity);
      if (!e) return nothing;
      if (x.person) {
        const home = e.state === "home";
        return html`
          <button class="tab st ${home ? "st-home" : "st-away"}" @click=${() => this._open(x.entity)}>
            <ha-icon icon=${home ? "mdi:home-account" : "mdi:account-arrow-right-outline"}></ha-icon>
            <span>${home ? x.name : `${x.name} away`}</span></button>`;
      }
      if (e.state !== (x.when || "on")) return nothing;
      const tap = x.toggle ? () => this._call("homeassistant", "toggle", { entity_id: x.entity })
        : () => this._open(x.entity);
      return html`
        <button class="tab st ${x.tone || "warn"}" @click=${tap}>
          <ha-icon icon=${x.icon}></ha-icon><span>${x.name}</span></button>`;
    });
    // each reading covers the whole house: every room's sensor, shown low–high like Apple Home
    const air = (this._config.status_air || []).map((x) => {
      const e = this._st(x.entity);
      if (!e) return nothing;
      const vals = (x.sources || [{ entity: x.entity }]).map((src) => {
        const s = this._st(src.entity);
        return s ? Number(src.attr ? s.attributes[src.attr] : s.state) : NaN;
      }).filter((v) => isFinite(v)).map((v) => Math.round(v));
      if (!vals.length) return nothing;
      const lo = Math.min(...vals), hi = Math.max(...vals);
      return html`
        <button class="tab st reading" @click=${() => this._open(x.entity)}>
          <ha-icon icon=${x.icon} style="color:${x.color || "var(--accent)"}"></ha-icon>
          <span>${lo === hi ? lo : `${lo}–${hi}`}${x.unit != null ? x.unit : (e.attributes.unit_of_measurement || "")}</span>
          <small>${x.name}</small></button>`;
    });
    return html`<div class="status">${pills}${air}</div>`;
  }

  // --- phone home: ha-phone's order (status, scenes, each room) in this look ----
  _phoneHome() {
    return html`
      <div class="ph">
        ${this._status()}
        ${this._config.scenes.length ? html`
          <section>
            <div class="ph-sec"><ha-icon icon="mdi:creation"></ha-icon><span>Scenes</span></div>
            <div class="fav-scenes">${this._config.scenes.map((x) => this._miniScene(x))}</div>
          </section>` : nothing}
        ${this._config.phone_rooms.map((r) => this._phoneRoom(r))}
      </div>`;
  }

  _phoneRoom(r) {
    const g = this._st(r.group);
    const lit = g && g.state === "on";
    return html`
      <section>
        <div class="ph-sec"><ha-icon icon=${r.icon}></ha-icon><span>${r.name}</span>
          ${g ? html`<button class="ph-group ${lit ? "on" : ""}" title="All lights"
              @click=${() => this._call("light", lit ? "turn_off" : "turn_on", { entity_id: r.group })}>
              <ha-icon icon="mdi:lightbulb-group"></ha-icon></button>` : nothing}
        </div>
        <div class="ph-grid">
          ${r.items.map((x) => {
            const e = this._st(x.entity);
            if (!e) return nothing;
            switch (x.type) {
              case "climate": return html`<div class="card ph-hp">${this._thermostat(x.entity)}</div>`;
              case "media": return e.state === "unavailable" ? nothing : this._player(x);
              case "plant": return this._plantTile(x);
              case "switch": return this._switchTile(x);
              default: return this._lightTile(x);
            }
          })}
        </div>
      </section>`;
  }

  // tap does onTap, a still 500ms hold does onHold (see _lightTile for why it's this careful)
  _tapHold(key, onTap, onHold) {
    const P = () => this._press || {};
    const up = () => clearTimeout(P().timer);
    const down = (ev) => {
      up();
      // a touch that stops a scroll is just stopping it: no sheet, no toggle
      const scrolling = performance.now() - (this._scrolledAt || 0) < 250;
      const p = this._press = { id: key, held: scrolling, x0: ev.clientX, y0: ev.clientY };
      if (scrolling) return;
      p.timer = setTimeout(() => {
        if (performance.now() - (this._scrolledAt || 0) < 500) return;
        p.held = true; fireHaptic("medium"); onHold();
      }, 500);
    };
    const move = (ev) => { const p = P(); if (Math.abs(ev.clientX - p.x0) > 8 || Math.abs(ev.clientY - p.y0) > 8) up(); };
    const click = () => { const p = P(); if (p.id === key && p.held) return; onTap(); };
    return { down, move, up, click };
  }

  // a small light tile: tap toggles, hold for the full controls
  _lightTile(l) {
    const e = this._st(l.entity);
    if (!e) return nothing;
    const on = e.state === "on";
    const pct = on ? Math.round((e.attributes.brightness || 255) / 2.55) : 0;
    const toggle = () => this._call("light", "toggle", { entity_id: l.entity });
    const label = html`<span class="tile-text"><span class="tile-name">${l.name || e.attributes.friendly_name}</span>
          <span class="muted">${on ? (pct >= 100 ? "On" : `On · ${pct}%`) : e.state === "unavailable" ? "Unavailable" : "Off"}</span></span>`;
    // the phone's native tiles work like HA's own tile card: the icon toggles, the rest opens the sheet
    if (this._iconToggles) {
      return html`
        <button class="card tile light-tile ${on ? "on" : ""}" @click=${() => this._openLight(l.entity)}>
          <span class="tile-ico tap" role="button" title=${on ? "Turn off" : "Turn on"}
                @click=${(ev) => { ev.stopPropagation(); fireHaptic("light"); toggle(); }}><ha-icon icon=${l.icon || "mdi:lightbulb"}></ha-icon></span>
          ${label}
        </button>`;
    }
    // Everywhere else: tap toggles, hold opens the sheet. A hold only counts if the finger stays put. Scrolling over a tile used to
    // open its sheet: iOS doesn't always send pointercancel when a scroll takes
    // over, and a finger that stops momentum scrolling lands as a fresh press.
    // Press state lives on the card, not in this render: HA re-renders on every
    // state change, and a fresh closure mid-press forgot the hold and toggled anyway.
    const { down, move, up, click } = this._tapHold(l.entity, toggle, () => this._openLight(l.entity));
    return html`
      <button class="card tile light-tile ${on ? "on" : ""}" @pointerdown=${down} @pointermove=${move}
              @pointerup=${up} @pointerleave=${up} @pointercancel=${up}
              @click=${click}>
        <span class="tile-ico"><ha-icon icon=${l.icon || "mdi:lightbulb"}></ha-icon></span>
        ${label}
      </button>`;
  }

  // --- pop-ups: ha-phone's Bubble Card pop-ups as sheets in this look ------------
  // config.popups[id] = {title, icon, sections}; config.links[entity] = id says which
  // tap opens which sheet. Anything without a link falls back to HA's more-info.
  _open(entityId) {
    const id = this._links()[entityId];
    if (!id || !this._config.popups[id]) { this._moreInfo(entityId); return; }
    fireHaptic("light");
    this._pop = id;
    this._loadHistory(this._config.popups[id]);
  }

  async _loadHistory(p) {
    const ids = p.sections.filter((s) => s.type === "graph").map((s) => s.entity);
    if (!ids.length) return;
    const hours = Math.max(...p.sections.filter((s) => s.type === "graph").map((s) => s.hours || 168));
    const start = new Date(Date.now() - hours * 3600 * 1000);
    try {
      // without end_time HA returns only the first day after start
      const r = await this.hass.callApi("GET", `history/period/${start.toISOString()}?filter_entity_id=${ids.join(",")}`
        + `&end_time=${new Date().toISOString()}&minimal_response&no_attributes`);
      const hist = Object.assign({}, this._hist);
      r.forEach((list) => {
        if (!list.length) return;
        hist[list[0].entity_id] = list.map((x) => [new Date(x.last_changed).getTime(), Number(x.state)])
          .filter((x) => !isNaN(x[1]));
      });
      this._hist = hist;
    } catch (e) { console.warn("overlook-show: history", e); }
  }

  _popSheet() {
    const p = this._config.popups[this._pop];
    if (!p) return nothing;
    const close = () => { this._pop = null; };
    return html`
      <div class="scrim pop-scrim" @click=${close} @touchmove=${(ev) => { if (ev.target === ev.currentTarget) ev.preventDefault(); }}>
        <div class="sheet pop" @click=${(ev) => ev.stopPropagation()}
             @touchstart=${(ev) => this._swStart(ev, close)} @touchmove=${(ev) => this._swMove(ev)} @touchend=${() => this._swEnd()} @touchcancel=${() => this._swEnd(true)}>
          <div class="grabber"></div>
          <div class="pop-head">
            <span class="pop-ico"><ha-icon icon=${p.icon}></ha-icon></span>
            <span class="pop-title">${p.title}</span>
            <button class="round small" title="Close" @click=${close}><ha-icon icon="mdi:close"></ha-icon></button>
          </div>
          <div class="pop-body">${p.sections.map((s) => this._popSection(s))}</div>
        </div>
      </div>`;
  }

  // --- swipe a sheet down to close it ----------------------------------------
  // Any vertical drag on a sheet that isn't on a control moves the sheet with the finger;
  // let go past 90px (or flick) and it slides away. preventDefault on touchmove is what
  // stops the HA app's pull-to-refresh, which used to reload the dashboard behind the sheet.
  // The scrolling body still scrolls: a drag only becomes a dismiss when it starts with
  // the body at the top and moves down.
  _swStart(ev, close) {
    const t = ev.touches[0];
    if (ev.touches.length > 1 || (ev.target.closest && ev.target.closest(".split, .ctbar, .pl-row, input"))) {
      this._sw = null;
      return;
    }
    const sheet = ev.currentTarget;
    const body = ev.target.closest && ev.target.closest(".pop-body");
    this._sw = { sheet, close, body, y0: t.clientY, x0: t.clientX, y: t.clientY, t: performance.now(), v: 0, mode: null };
  }

  _swMove(ev) {
    const w = this._sw;
    if (!w) return;
    const t = ev.touches[0], dy = t.clientY - w.y0;
    if (!w.mode) {
      if (Math.abs(dy) < 6 && Math.abs(t.clientX - w.x0) < 6) return;
      // down with nothing scrolled = dismiss; anything else is the body's own scroll
      w.mode = dy > 0 && Math.abs(dy) > Math.abs(t.clientX - w.x0) && (!w.body || w.body.scrollTop <= 0) ? "drag" : "pass";
      if (w.mode === "drag") w.sheet.style.transition = "none";
    }
    if (w.mode !== "drag") return;
    ev.preventDefault();
    const now = performance.now();
    w.v = (t.clientY - w.y) / Math.max(1, now - w.t);
    w.y = t.clientY;
    w.t = now;
    w.sheet.style.transform = `translateY(${Math.max(0, dy)}px)`;
  }

  _swEnd(cancel = false) {
    const w = this._sw;
    this._sw = null;
    if (!w || w.mode !== "drag") return;
    const dy = w.y - w.y0;
    w.sheet.style.transition = "transform 0.22s ease-out";
    if (!cancel && (dy > 90 || (dy > 30 && w.v > 0.6))) {
      w.sheet.style.transform = "translateY(110%)";
      const scrim = w.sheet.parentElement;
      if (scrim) { scrim.style.transition = "opacity 0.22s"; scrim.style.opacity = "0"; }
      setTimeout(() => w.close(), 200);
    } else {
      w.sheet.style.transform = "";
    }
  }

  _popSection(s) {
    if (s.when) {
      const w = this._st(s.when.entity);
      if (!w || w.state !== s.when.state) return nothing;
    }
    const head = s.title ? html`<div class="pop-sub">${s.title}</div>` : nothing;
    switch (s.type) {
      case "player": return html`${head}${this._popPlayer(s.entity)}`;
      case "graph": return html`${head}${this._popGraph(s)}`;
      case "choices": return html`${head}${this._popChoices(s)}`;
      default: return html`${head}<div class="pop-grid">${s.items.map((x) => this._popTile(x))}</div>`;
    }
  }

  // a value the way ha-phone words it: Open/Closed, Home/Away, Low/OK, 90%, 4:30pm
  _fmt(e, x = {}) {
    if (!e) return "–";
    const a = e.attributes, dc = a.device_class || "", dom = e.entity_id.split(".")[0];
    if (x.attr) {
      const v = a[x.attr];
      return v == null ? "–" : `${typeof v === "number" ? Math.round(v * 10) / 10 : v}${x.unit || ""}`;
    }
    const s = e.state;
    if (s === "unavailable") return "Unavailable";
    if (s === "unknown") return dom === "button" ? "Press" : "–";
    if (dom === "person" || dom === "device_tracker") return s === "home" ? "Home" : s === "not_home" ? "Away" : s;
    if (dom === "update") return s === "on" ? `${a.latest_version} available` : `Up to date · ${a.installed_version}`;
    if (dom === "binary_sensor") {
      if (["opening", "door", "window", "garage_door"].includes(dc)) return s === "on" ? "Open" : "Closed";
      if (dc === "battery") return s === "on" ? "Low" : "OK";
      if (dc === "problem") return s === "on" ? "Needs attention" : "OK";
      if (dc === "moisture") return s === "on" ? "Wet" : "Dry";
      return s === "on" ? "Yes" : "No";
    }
    if (dc === "timestamp") {
      const d = new Date(s);
      if (isNaN(d)) return s;
      const day = d.toDateString() === new Date().toDateString() ? "" : `${DAYS[d.getDay()][0]}${DAYS[d.getDay()].slice(1).toLowerCase()} `;
      return day + this._ampm(d);
    }
    if (dom === "climate") return s === "off" ? "Off" : s;
    if (["switch", "automation", "input_boolean", "light", "fan"].includes(dom)) return s === "on" ? "On" : "Off";
    const n = Number(s), u = a.unit_of_measurement;
    if (!isNaN(n) && s !== "") {
      const v = Math.round(n * 10) / 10;
      return u ? `${v}${u === "%" || u === "°C" ? (u === "°C" ? "°" : "%") : " " + u}` : `${v}`;
    }
    return s[0].toUpperCase() + s.slice(1);
  }

  // one tile in a sheet: switches toggle, buttons press, numbers step, the rest open more-info
  _popTile(x) {
    if (x.when) {
      const w = this._st(x.when.entity);
      if (!w || w.state !== x.when.state) return nothing;
    }
    const e = this._st(x.entity);
    if (!e) return nothing;
    const dom = x.entity.split(".")[0];
    const val = this._fmt(e, x);
    if (dom === "number" && !x.attr) {
      const a = e.attributes, v = Number(e.state), step = a.step || 1;
      const set = (d) => this._call("number", "set_value", { entity_id: x.entity, value: clamp(v + d, a.min, a.max) });
      return html`
        <div class="ptile stepper">
          <span class="tile-ico"><ha-icon icon=${x.icon}></ha-icon></span>
          <span class="tile-text"><span class="tile-name">${x.name}</span><span class="muted">${val}</span></span>
          <span class="steps-btns">
            <button class="round small" @click=${() => set(-step)}><ha-icon icon="mdi:minus"></ha-icon></button>
            <button class="round small" @click=${() => set(step)}><ha-icon icon="mdi:plus"></ha-icon></button>
          </span>
        </div>`;
    }
    const toggles = ["switch", "automation", "input_boolean", "light", "fan"].includes(dom) && !x.attr;
    const on = toggles && e.state === "on";
    const alert = (dom === "binary_sensor" && e.state === "on" && !x.attr)
      || (dom === "update" && e.state === "on")
      || (e.attributes.device_class === "battery" && Number(e.state) <= 20);
    const tap = toggles ? () => this._call("homeassistant", "toggle", { entity_id: x.entity })
      : dom === "button" ? () => this._call("button", "press", { entity_id: x.entity })
      : () => this._moreInfo(x.entity);
    return html`
      <button class="ptile ${on ? "on" : ""} ${alert ? "alert" : ""} ${x.wide ? "wide" : ""}" @click=${tap}>
        <span class="tile-ico"><ha-icon icon=${x.icon || e.attributes.icon || "mdi:information-outline"}></ha-icon></span>
        <span class="tile-text"><span class="tile-name">${x.name}</span><span class="muted">${val}</span></span>
      </button>`;
  }

  // a row of options for one attribute: fan speed, swing, a source, an Apple TV app
  _popChoices(s) {
    const e = this._st(s.entity);
    if (!e) return nothing;
    const now = e.attributes[s.attr];
    const [dom, svc] = s.service.split(".");
    return html`
      <div class="choices ${s.compact ? "compact" : ""}">
        ${s.options.map(([v, name, icon]) => html`
          <button class="choice ${now === v ? "on" : ""}"
                  @click=${() => this._call(dom, svc, { entity_id: s.entity, [s.field]: v })}>
            <ha-icon icon=${icon}></ha-icon><span>${name}</span></button>`)}
      </div>`;
  }

  _popPlayer(id) {
    const e = this._st(id);
    if (!e) return nothing;
    const a = e.attributes, playing = e.state === "playing", off = ["off", "standby"].includes(e.state);
    const vol = a.volume_level, muted = a.is_volume_muted;
    const mp = (svc, data = {}) => this._call("media_player", svc, Object.assign({ entity_id: id }, data));
    return html`
      <div class="pplayer ${muted ? "muted-vol" : ""}">
        <div class="pp-top">
          <div class="art" style=${this._pic(a) ? `background-image:url('${this._pic(a)}')` : ""}>
            ${this._pic(a) ? nothing : html`<ha-icon icon="mdi:music-note"></ha-icon>`}</div>
          <div class="media-text">
            ${this._src(a) ? html`<div class="media-src">${this._src(a)}</div>` : nothing}
            <div class="media-title">${this._title(a) || (off ? "Off" : "Nothing playing")}</div>
            ${this._artist(a) ? html`<div class="media-artist">${this._artist(a)}</div>` : nothing}
          </div>
          ${e.attributes.supported_features & 128 ? html`
            <button class="round small ${off ? "" : "power-on"}" title="Power" @click=${() => mp(off ? "turn_on" : "turn_off")}>
              <ha-icon icon="mdi:power"></ha-icon></button>` : nothing}
        </div>
        <div class="pp-ctrl">
          <button class="round small" @click=${() => mp("media_previous_track")}><ha-icon icon="mdi:skip-previous"></ha-icon></button>
          <button class="round play" @click=${() => mp("media_play_pause")}>
            <ha-icon icon=${playing ? "mdi:pause" : "mdi:play"}></ha-icon></button>
          <button class="round small" @click=${() => mp("media_next_track")}><ha-icon icon="mdi:skip-next"></ha-icon></button>
        </div>
        ${vol != null ? html`
          <div class="vol">
            <button class="round small" @click=${() => mp("volume_set", { volume_level: clamp(Math.round((vol - VOL_STEP) * 100) / 100, 0, 1) })}>
              <ha-icon icon="mdi:minus"></ha-icon></button>
            <div class="vol-bar"><div style="width:${Math.round(vol * 100)}%"></div></div>
            <button class="round small" @click=${() => mp("volume_set", { volume_level: clamp(Math.round((vol + VOL_STEP) * 100) / 100, 0, 1) })}>
              <ha-icon icon="mdi:plus"></ha-icon></button>
            <button class="round small ${muted ? "is-muted" : ""}" title="Mute" @click=${() => mp("volume_mute", { is_volume_muted: !muted })}>
              <ha-icon icon=${muted ? "mdi:volume-off" : "mdi:volume-high"}></ha-icon></button>
          </div>` : nothing}
      </div>`;
  }

  // a week of one sensor as a filled line, like the mini-graph-card on ha-phone
  _popGraph(s) {
    const e = this._st(s.entity);
    let pts = (this._hist || {})[s.entity];
    // history only records changes, so the line is finished off with the value right now
    if (pts && e && !isNaN(Number(e.state))) pts = [...pts, [Date.now(), Number(e.state)]];
    const now = e ? this._fmt(e) : "–";
    if (!pts || pts.length < 2) {
      return html`<div class="graph"><div class="graph-head"><span>${s.name}</span><b>${now}</b></div>
        <div class="graph-empty muted">${pts ? "Not enough history yet" : "Loading…"}</div></div>`;
    }
    const W = 320, H = 90;
    const t0 = pts[0][0], t1 = Date.now();
    let lo = Math.min(...pts.map((p) => p[1])), hi = Math.max(...pts.map((p) => p[1]));
    if (hi - lo < 1) { hi += 0.5; lo -= 0.5; }
    const X = (t) => ((t - t0) / (t1 - t0)) * W, Y = (v) => H - 6 - ((v - lo) / (hi - lo)) * (H - 12);
    // steps, not slopes: a reading holds until the next one arrives
    let d = `M0 ${Y(pts[0][1]).toFixed(1)}`;
    pts.forEach((p, i) => {
      if (i) d += ` L${X(p[0]).toFixed(1)} ${Y(pts[i - 1][1]).toFixed(1)}`;
      d += ` L${X(p[0]).toFixed(1)} ${Y(p[1]).toFixed(1)}`;
    });
    const c = s.color || "var(--accent)";
    return html`
      <div class="graph">
        <div class="graph-head"><span>${s.name}</span><b>${now}</b></div>
        <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
          ${svg`<path d="${d} L${W} ${H} L0 ${H} Z" fill=${c} opacity="0.14"></path>
                <path d=${d} fill="none" stroke=${c} stroke-width="2" vector-effect="non-scaling-stroke"
                      stroke-linejoin="round" stroke-linecap="round"></path>`}
        </svg>
        <div class="graph-foot muted"><span>${Math.round(lo)}–${Math.round(hi)}${e && e.attributes.unit_of_measurement === "%" ? "%" : "°"} ${(s.hours || 168) >= 168 ? "this week" : "today"}</span>
          <span>${(s.hours || 168) >= 48 ? `${(s.hours || 168) / 24} days` : `${s.hours} hours`}</span></div>
      </div>`;
  }

  _dock() {
    return html`
      <nav class="dock">
        <div class="dock-pill">
          ${(this._config.hub ? HUB_PAGES : this._config.bedside ? BEDSIDE_PAGES : PAGES).map(([id, name, icon]) => html`
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
      case "desk": return this._desk();
      case "controls": return this._config.hub ? this._hubControls() : this._bedControls();
      case "media": return this._config.hub ? this._hubMedia() : this._bedMedia();
      case "climate": return this._config.hub ? this._hubClimate() : this._bedClimate();
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

  // --- bedside (the Echo Show 5 by the bed) ------------------------------------
  // config.room is the bedroom from show.CARD.rooms; the pages only show what it has
  _bedControls() {
    const r = this._config.room || {};
    const group = r.group && this._st(r.group);
    const groupOn = !!group && group.state === "on";
    return html`
      <div class="bed-controls">
        ${group ? this._controlTile("All Lights", "mdi:lightbulb-group", "var(--warm)", group,
          () => this._call("light", groupOn ? "turn_off" : "turn_on", { entity_id: r.group })) : nothing}
        ${(r.switches || []).map((x) => {
          const e = this._st(x.entity);
          return e ? this._controlTile(x.name, x.icon, "#3f86f2", e,
            () => this._call("homeassistant", "toggle", { entity_id: x.entity })) : nothing;
        })}
      </div>`;
  }

  // the climate tile's layout for something you switch: tinted only while it's on
  _controlTile(name, icon, colour, e, tap) {
    const on = e.state === "on";
    return html`
      <button class="card air-tile control-tile ${on ? "on" : ""}" style="--c:${colour}" @click=${tap}>
        <span class="air-ico"><ha-icon icon=${icon}></ha-icon></span>
        <span class="air-name">${name}<span class="air-q">${on ? "On" : e.state === "unavailable" ? "Unavailable" : "Off"}</span></span>
      </button>`;
  }

  _bedMedia() {
    const pl = this._playlists();
    return html`
      <div class="bed-two">
        ${this._mediaCard()}
        ${pl === nothing ? nothing : html`<div class="card bed-card bed-pl">${pl}</div>`}
      </div>`;
  }

  // a big reading: its number, its name and a one-word verdict, tinted in its colour
  _airTile(x) {
    const e = this._st(x.entity);
    if (!e) return nothing;
    const k = Object.keys(AIR).find((n) => x.entity.includes(n));
    const [label, colour, verdict] = AIR[k] || [x.name, x.color || "var(--accent)", () => ""];
    const v = Number(e.state), ok = !isNaN(v) && e.state !== "";
    return html`
      <button class="card air-tile" style="--c:${colour}" @click=${() => this._open(x.entity)}>
        <span class="air-ico"><ha-icon icon=${x.icon}></ha-icon></span>
        <span class="air-val">${ok ? Math.round(v) : "–"}<small>${x.unit != null ? x.unit : (e.attributes.unit_of_measurement || "")}</small></span>
        <span class="air-name">${label}<span class="air-q">${ok ? verdict(v) : "No reading"}</span></span>
      </button>`;
  }

  _bedClimate() {
    const r = this._config.room || {};
    return html`
      <div class="bed-air">
        ${(r.sensors || []).map((x) => this._airTile(x))}
      </div>`;
  }

  // --- hub (the Nest Hub in the kitchen) ------------------------------------------
  // config.hub_rooms: the rooms whose lights get a tile; config.tv: the TV's power tile
  _hubControls() {
    const tv = this._config.tv && this._st(this._config.tv.entity);
    const tvOn = !!tv && !["off", "standby", "unavailable"].includes(tv.state);
    return html`
      <div class="bed-two hub-sq-left">
        <div class="bed-controls hub-controls">
          ${(this._config.hub_rooms || []).map((r) => {
            const g = this._st(r.group), on = !!g && g.state === "on";
            return g ? this._controlTile(r.name, r.icon, "var(--warm)", g,
              () => this._call("light", on ? "turn_off" : "turn_on", { entity_id: r.group })) : nothing;
          })}
          <button class="card air-tile control-tile" style="--c:var(--accent)" @click=${() => { this._scenes = true; }}>
            <span class="air-ico"><ha-icon icon="mdi:creation"></ha-icon></span>
            <span class="air-name">Scenes<span class="air-q">Tap for more</span></span>
          </button>
          ${tv ? this._controlTile(this._config.tv.name, this._config.tv.icon, "#8e5cf0", { state: tvOn ? "on" : tv.state },
            () => this._call("media_player", tvOn ? "turn_off" : "turn_on", { entity_id: this._config.tv.entity })) : nothing}
        </div>
        <div class="hub-stack">${this._mediaCard()}${this._shopping()}</div>
      </div>`;
  }

  _scenesSheet() {
    const close = () => { this._scenes = false; };
    return html`
      <div class="scrim" @click=${close}>
        <div class="sheet card scenes-sheet" @click=${(ev) => ev.stopPropagation()}>
          <div class="card-title">Scenes</div>
          <div class="hub-scenes">${(this._config.hub_scenes || []).map((x) => this._miniScene(x))}</div>
        </div>
      </div>`;
  }

  // everything playing or paused anywhere, then the playlists
  _hubMedia() {
    const all = (this._config.rooms || []).flatMap((r) => r.media || []);
    const live = all.filter((m) => { const e = this._st(m.entity); return e && ["playing", "paused"].includes(e.state); });
    const pl = this._playlists();
    return html`
      <div class="bed-two">
        <div class="hub-players">
          ${live.length ? live.map((m) => this._player(m)) : html`
            <div class="card soon"><ha-icon icon="mdi:music-off"></ha-icon><div class="muted">Nothing playing</div></div>`}
        </div>
        ${pl === nothing ? nothing : html`<div class="card bed-card bed-pl">${pl}</div>`}
      </div>`;
  }

  // outside over the heat pump, beside the kitchen's air readings
  _hubClimate() {
    const r = this._config.room || {};
    const w = this._st(this._config.weather), f = this._forecast;
    const cond = w ? this._cond(w) : null;
    return html`
      <div class="bed-two hub-sq-right">
        <div class="hub-stack">
          ${w ? html`
            <button class="card hub-out" @click=${() => this._open(this._config.weather)}>
              <div class="card-title">Outside</div>
              <div class="hub-out-row">
                <ha-icon icon=${cond[0]} style="color:${cond[2]}"></ha-icon>
                <span class="hub-out-temp">${this._deg(w.attributes.temperature)}</span>
                <div class="wx-side">
                  <div class="wx-cond">${cond[1]}</div>
                  ${f && w.state !== "unavailable" ? html`<div class="wx-hl">H ${Math.round(f.temperature)}°&nbsp;&nbsp;L ${Math.round(f.templow)}°</div>` : nothing}
                </div>
              </div>
            </button>` : nothing}
          ${this._config.climate ? html`<div class="card desk-hp hub-hp">${this._thermostat()}</div>` : nothing}
        </div>
        <div class="bed-air">${(r.sensors || []).map((x) => this._airTile(x))}</div>
      </div>`;
  }

  // --- desk (the computer): the whole house on one page, laid out like ha-computer:
  // outside, heat pump and scenes, then a column per room; the bedrooms share the last
  _desk() {
    const rooms = (this._config.rooms || []).filter((r) => !r.music);
    const w = this._st(this._config.weather), f = this._forecast;
    const cond = w ? this._cond(w) : null;
    const [down, up] = this._holdToUncover();  // the clock that did this is not on the desk
    const head = (name) => html`<div class="desk-title" @pointerdown=${down} @pointerup=${up} @pointerleave=${up}>${name}</div>`;
    // one kind of thing across the house, a sub-heading per room that has some
    const byRoom = (key, tile) => rooms.filter((r) => (r[key] || []).length).map((r) => html`
      <div class="desk-sub"><ha-icon class="desk-ico" icon=${r.icon}></ha-icon>${r.name}</div>
      ${r[key].map((x) => tile(x))}`);
    const lit = rooms.filter((r) => (r.lights || []).length);
    const plugs = byRoom("switches", (x) => this._switchTile(x));
    const plants = byRoom("plants", (x) => this._plantTile(x));
    return html`
      <div class="desk">
        <div class="desk-col">
          ${w || this._config.climate ? head("Climate") : nothing}
          ${w ? html`
            <div class="card desk-card">
              <div class="card-title">Outside</div>
              <div class="wx-card" @click=${() => this._open(this._config.weather)}>
                <ha-icon icon=${cond[0]} style="color:${cond[2]}"></ha-icon>
                <span class="wx-temp">${this._deg(w.attributes.temperature)}</span>
                <div class="wx-side">
                  <div class="wx-cond">${cond[1]}</div>
                  ${f && w.state !== "unavailable" ? html`<div class="wx-hl">H ${Math.round(f.temperature)}°&nbsp;&nbsp;L ${Math.round(f.templow)}°</div>` : nothing}
                </div>
              </div>
            </div>` : nothing}
          ${this._config.climate ? html`
            <div class="card desk-card desk-hp">${this._thermostat()}</div>` : nothing}
          ${this._config.scenes.length ? html`${head("Scenes")}
            <div class="card desk-card">
              <div class="fav-scenes desk-scenes">${this._config.scenes.map((x) => this._miniScene(x))}</div></div>` : nothing}
        </div>
        <div class="desk-col desk-mid">
          ${lit.length ? html`${head("Lights")}<div class="desk-pair">${lit.map((r) => this._deskLights(r))}</div>` : nothing}
          ${plugs.length || plants.length ? html`
            <div class="desk-pair">
              ${plugs.length ? html`<div class="desk-stack">${head("Plugs")}${plugs}</div>` : nothing}
              ${plants.length ? html`<div class="desk-stack">${head("Plants")}${plants}</div>` : nothing}
            </div>` : nothing}
        </div>
        <div class="desk-col">${head("Media")}${byRoom("media", (m) => this._player(m))}</div>
      </div>`;
  }

  // a room's lights on the desk: its name and All on/off, then its pills
  _deskLights(r) {
    const lights = r.lights;
    const lit = lights.filter((l) => { const e = this._st(l.entity); return e && e.state === "on"; }).length;
    return html`
      <div class="card desk-card">
        <div class="card-title"><ha-icon class="desk-ico" icon=${r.icon}></ha-icon>${r.name}
          ${lit ? html`<span class="count">${lit} on</span>` : nothing}
          ${r.group && this._st(r.group) ? html`
            <button class="all-btn" @click=${() => this._call("light", lit ? "turn_off" : "turn_on", { entity_id: r.group })}>
              ${lit ? "All off" : "All on"}</button>` : nothing}
        </div>
        <div class="desk-favs" style="--n:${Math.max(3, lights.length)}">${lights.map((l) => this._pill(l))}</div>
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
    // the phone keeps the icon and puts the artwork behind the whole tile
    const phone = this._config.phone;
    const pic = active ? this._pic(a) : null;
    const powerTile = phone && POWER_TILES.includes(id);
    // volume: no bar anywhere. The phone puts - and + side by side (as the Apple TV tile's
    // play and power) with the % in the tile's top right; the big screens put the % pill
    // between - and +, since their play button sits top right
    const showVol = !powerTile && vol != null && e.state !== "off";
    const pct = showVol ? Math.round(vol * 100) : null;
    const step = (d) => () => this._call("media_player", "volume_set", { entity_id: id, volume_level: clamp(Math.round((vol + d) * 100) / 100, 0, 1) });
    return html`
      <div class="card player ${phone && pic ? "has-art" : ""} ${phone && showVol ? "has-vol" : ""}" style=${phone && pic ? `--art:url('${pic}')` : ""}>
        ${phone && showVol ? html`<span class="ph-vol">${pct}%</span>` : nothing}
        <div class="player-row" @click=${() => { if (this._links()[id]) this._open(id); }}>
          <div class="art small" style=${!phone && pic ? `background-image:url('${pic}')` : ""}>
            ${!phone && pic ? nothing : html`<ha-icon icon=${m.icon || "mdi:speaker"}></ha-icon>`}
          </div>
          <div class="media-text">
            <div class="media-src">${m.name || a.friendly_name}</div>
            <div class="player-title">${active ? this._title(a) : state}</div>
            ${active && (this._artist(a) || a.app_name) ? html`<div class="media-artist">${this._artist(a) || a.app_name}</div>` : nothing}
          </div>
          ${active ? html`
            <button class="round play" @click=${() => this._call("media_player", "media_play_pause", { entity_id: id })}>
              <ha-icon icon=${e.state === "playing" ? "mdi:pause" : "mdi:play"}></ha-icon></button>` : nothing}
        </div>
        ${showVol && phone ? html`
          <div class="transport power-pair">
            <button class="round small" title="Volume down" @click=${step(-VOL_STEP)}><ha-icon icon="mdi:minus"></ha-icon></button>
            <button class="round small" title="Volume up" @click=${step(VOL_STEP)}><ha-icon icon="mdi:plus"></ha-icon></button>
          </div>` : nothing}
        ${showVol && !phone ? html`
          <div class="vol vol-pair vol-pct">
            <button class="round small" @click=${step(-VOL_STEP)}><ha-icon icon="mdi:minus"></ha-icon></button>
            <span class="where-vol">${pct}%</span>
            <button class="round small" @click=${step(VOL_STEP)}><ha-icon icon="mdi:plus"></ha-icon></button>
          </div>` : nothing}
        ${powerTile ? html`
          <div class="transport power-pair">
            <button class="round small" title="Play/pause" @click=${() => this._call("media_player", "media_play_pause", { entity_id: id })}>
              <ha-icon icon=${e.state === "playing" ? "mdi:pause" : "mdi:play"}></ha-icon></button>
            <button class="round small" title="Power" @click=${() => this._call("media_player", e.state === "off" ? "turn_on" : "turn_off", { entity_id: id })}>
              <ha-icon icon="mdi:power"></ha-icon></button>
          </div>` : nothing}
        ${phone && !powerTile && vol == null && ["playing", "paused"].includes(e.state) ? html`
          <div class="transport">
            <button class="round small" @click=${() => this._call("media_player", "media_play_pause", { entity_id: id })}>
              <ha-icon icon=${e.state === "playing" ? "mdi:pause" : "mdi:play"}></ha-icon></button>
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

  // any other reading: its state as HA formats it; tap for the pop-up or HA's dialog
  _sensorTile(x) {
    const e = this._st(x.entity);
    if (!e) return nothing;
    const val = this.hass.formatEntityState ? this.hass.formatEntityState(e)
      : `${e.state}${e.attributes.unit_of_measurement ? " " + e.attributes.unit_of_measurement : ""}`;
    return html`
      <button class="card tile" @click=${() => this._open(x.entity)}>
        <span class="tile-ico"><ha-icon icon=${x.icon || e.attributes.icon || "mdi:eye-outline"}></ha-icon></span>
        <span class="tile-text"><span class="tile-name">${x.name || e.attributes.friendly_name}</span>
          <span class="muted">${val}</span></span>
      </button>`;
  }

  _plantTile(x) {
    const e = this._st(x.entity);
    if (!e) return nothing;
    const v = Number(e.state);
    return html`
      <button class="card tile plant" @click=${() => this._open(x.entity)}>
        <span class="tile-ico"><ha-icon icon="mdi:sprout"></ha-icon></span>
        <span class="tile-text"><span class="tile-name">${x.name}</span>
          <span class="muted">Soil moisture</span></span>
        <span class="tile-val">${isNaN(v) ? "–" : Math.round(v)}<small>%</small></span>
      </button>`;
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
    if (!this._config.phone) this._dayOpen = ymd;
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
    // the bedside: today's date on its own, beside the agenda
    if (this._config.bedside) {
      return html`<div class="bed-two bed-cal">${this._dateCard(false)}${this._whatsOn(byDay, today)}</div>`;
    }
    if (!this._config.phone) {
      return html`
        <div class="calendar big">
          <div class="month">
            <div class="month-head">
              <button class="nav-btn" title="Previous month" @click=${() => this._shiftMonth(-1)}>
                <ha-icon icon="mdi:chevron-left"></ha-icon></button>
              <button class="nav-btn" title="Next month" @click=${() => this._shiftMonth(1)}>
                <ha-icon icon="mdi:chevron-right"></ha-icon></button>
              <h1><span class="mon">${MONTHS[m.getMonth()]}</span> <span class="yr">${m.getFullYear()}</span></h1>
              <button class="today-btn" ?disabled=${thisMonth} @click=${() => this._toToday()}>Today</button>
            </div>
            <div class="dow">${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => html`<span>${d}</span>`)}</div>
            <div class="mgrid" style="--weeks:${weeks}">
              ${cells.map((d) => {
                const k = this._ymd(d), ev = byDay[k] || [];
                const fit = this._fit || 2;
                const shown = ev.length <= fit ? ev : ev.slice(0, fit - 1);
                return html`
                  <button class="day ${d.getMonth() !== m.getMonth() ? "out" : ""} ${k === today ? "today" : ""}"
                          @click=${() => this._pick(k)}>
                    <span class="dnum">${d.getDate()}</span>
                    ${shown.map((e) => html`<span class="chip" style="--c:${e.colour}"><i></i>
                      <b>${this._when(e, d) === "Ongoing" ? "" : this._when(e, d)}</b><span>${e.summary}</span></span>`)}
                    ${ev.length > shown.length ? html`<span class="more">+${ev.length - shown.length} more</span>` : nothing}
                  </button>`;
              })}
            </div>
          </div>
        </div>`;
    }
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

  _when(e, d) {
    if (!e.start.dateTime) return "All day";
    const s = this._d(e.start);
    return s.toDateString() === d.toDateString() ? this._ampm(s) : "Ongoing";
  }

  // the big screen's day sheet: everything on the tapped day, with times and places
  _daySheet() {
    const k = this._dayOpen, d = this._day(k), ev = this._byDay(this._cal || [])[k] || [];
    const close = () => { this._dayOpen = null; };
    return html`
      <div class="scrim" @click=${close}>
        <div class="sheet card day-sheet" @click=${(ev) => ev.stopPropagation()}>
          <div class="card-title">${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d.getDay()]}
            ${d.getDate()} ${LONG_MONTHS[d.getMonth()]}</div>
          ${ev.length ? ev.map((e) => html`
            <div class="wo-ev">
              <span class="wo-time">${this._when(e, d)}</span>
              <span class="bar" style="background:${e.colour}"></span>
              <div class="wo-text">
                <div class="ev-name">${e.summary}</div>
                ${e.location ? html`<div class="wo-loc muted">${e.location.split(",")[0]}</div>` : nothing}
              </div>
            </div>`) : html`<div class="empty muted">Nothing on.</div>`}
        </div>
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
    const when = (e, d) => this._when(e, d);
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
      const r = await fetch(this._u(`${this._config.recipes}/index.json?t=${Date.now()}`), { cache: "no-store" });
      if (!r.ok) throw new Error(r.status);
      this._lib = await r.json();
      this._libAt = Date.now();
    } catch (e) {
      console.warn("overlook-show: recipes", e);
      if (!this._lib) this._lib = { error: true };
    }
  }

  _img(id) { return this._u(`${this._config.recipes}/img/${id}.jpg?v=${(this._lib.recipes[id] || {}).v || 0}`); }

  // A cast runs the dashboard from cast.home-assistant.io, so a bare "/local/..." or
  // "/api/..." path would point at Google's server. hassUrl() makes it absolute.
  _input(a) { return INPUTS[a.source] || null; }
  _pic(a) { const i = this._input(a); return this._u((i && i.art) || a.entity_picture || TRACK_ART[a.media_title]); }
  _title(a) { const i = this._input(a); return i ? i.title : a.media_title; }
  _artist(a) { const i = this._input(a); return i ? i.sub : (a.media_artist || ""); }
  _src(a) { return this._input(a) ? "Input" : (a.app_name || a.source); }
  _u(p) { return p && p[0] === "/" && p[1] !== "/" && this.hass && this.hass.hassUrl ? this.hass.hassUrl(p) : p; }

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
      const r = await fetch(this._u(`${this._config.recipes}/r/${id}.json?v=${(this._lib.recipes[id] || {}).v || 0}`));
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
      <div class="photo" @click=${() => { if (!this._config.bedside) this._go(this._config.hub ? "controls" : "kitchen"); }}>
        ${pic ? html`<img src=${this._u(pic)} alt="">` : nothing}
        <div class="photo-shade"></div>
        <div class="photo-cap">
          ${album ? html`<div class="cap-small">${album}</div>` : nothing}
          ${d ? html`<div class="cap-big">${d.getDate()} ${LONG_MONTHS[d.getMonth()]} ${d.getFullYear()}</div>` : nothing}
          ${cam && cam.attributes.entry_id ? html`
            <div class="photo-nav" @click=${(ev) => ev.stopPropagation()}>
              <button title="Previous photo" @click=${() => this._slide(cam, "previous_slide")}>
                <ha-icon icon="mdi:chevron-left"></ha-icon></button>
              <button title="Next photo" @click=${() => this._slide(cam, "next_slide")}>
                <ha-icon icon="mdi:chevron-right"></ha-icon></button>
            </div>` : nothing}
        </div>
      </div>`;
  }

  // step the slideshow; it stays on photos, and the idle timer restarts with the tap
  _slide(cam, service) {
    fireHaptic("selection");
    this._call("album_slideshow", service, { entry_id: cam.attributes.entry_id });
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

  _dateCard(weather = true) {
    const n = this._now;
    const w = weather && this._st(this._config.weather);
    const cond = w ? this._cond(w) : null;
    const f = this._forecast;
    return html`
      <div class="card date-card">
        <div class="date-top">${DAYS[n.getDay()]} ${MONTHS[n.getMonth()]}</div>
        <div class="date-num">${n.getDate()}</div>
        ${w ? html`
          <div class="wx-card">
            <ha-icon icon=${cond[0]} style="color:${cond[2]}"></ha-icon>
            <span class="wx-temp">${this._deg(w.attributes.temperature)}</span>
            <div class="wx-side">
              <div class="wx-cond">${cond[1]}</div>
              ${f && w.state !== "unavailable" ? html`<div class="wx-hl">H ${Math.round(f.temperature)}°&nbsp;&nbsp;L ${Math.round(f.templow)}°</div>` : nothing}
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
    const title = this._title(a) || "Nothing playing";
    const sub = this._artist(a) || (a.media_title ? "" : "Pick a speaker or start something in Spotify");
    // every big screen: the % pill already shows the level, so no bar,
    // just - and + sharing the row as squircles
    const pair = !this._config.phone;
    return html`
      <div class="card media-card">
        <div class="card-title">Active Media</div>
        <div class="media-row">
          <div class="art" style=${this._pic(a) ? `background-image:url('${this._pic(a)}')` : ""}>
            ${this._pic(a) ? nothing : html`<ha-icon icon="mdi:music-note"></ha-icon>`}
          </div>
          <div class="media-text">
            ${this._src(a) ? html`<div class="media-src">${this._src(a)}</div>` : nothing}
            <div class="media-title">${title}</div>
            <div class="media-artist">${sub}</div>
          </div>
          ${a.media_title ? html`
            <button class="round play" @click=${() => this._call("media_player", "media_play_pause", { entity_id: e.entity_id })}>
              <ha-icon icon=${playing ? "mdi:pause" : "mdi:play"}></ha-icon>
            </button>` : nothing}
        </div>
        <div class="where-row">
          <button class="where" @click=${() => { this._picker = true; }}>
            <ha-icon icon=${sp.icon || "mdi:speaker"}></ha-icon>
            <span>${sp.name}</span>
            <ha-icon class="chev" icon="mdi:chevron-down"></ha-icon>
          </button>
          ${vol != null ? html`<span class="where-vol">${Math.round(vol * 100)}%</span>` : nothing}
        </div>
        ${vol != null ? html`
          <div class="vol ${pair ? "vol-pair" : ""}">
            <button class="round small" @click=${() => this._call("media_player", "volume_set", { entity_id: e.entity_id, volume_level: clamp(Math.round((vol - VOL_STEP) * 100) / 100, 0, 1) })}>
              <ha-icon icon="mdi:minus"></ha-icon></button>
            ${pair ? nothing : html`<div class="vol-bar"><div style="width:${Math.round(vol * 100)}%"></div></div>`}
            <button class="round small" @click=${() => this._call("media_player", "volume_set", { entity_id: e.entity_id, volume_level: clamp(Math.round((vol + VOL_STEP) * 100) / 100, 0, 1) })}>
              <ha-icon icon="mdi:plus"></ha-icon></button>
          </div>` : nothing}
      </div>`;
  }

  _speakerSheet() {
    const active = this._activeSpeaker();
    return html`
      <div class="scrim" @click=${() => { this._picker = false; }} @touchmove=${(ev) => { if (ev.target === ev.currentTarget) ev.preventDefault(); }}>
        <div class="sheet card" @click=${(ev) => ev.stopPropagation()}
             @touchstart=${(ev) => this._swStart(ev, () => { this._picker = false; })} @touchmove=${(ev) => this._swMove(ev)} @touchend=${() => this._swEnd()} @touchcancel=${() => this._swEnd(true)}>
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
    try { localStorage.setItem(this._spKey(), target.name); } catch (e) {}
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
    const drag = this._dragPct(l.entity);
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
            <div class="pill-state ${lit ? "lit" : ""}"><span class="txt">${lit ? (pct >= 100 ? "On" : `On · ${pct}%`) : "Off"}</span><span class="livetxt"></span></div>
          </div>
          <button class="dots" @click=${() => this._openLight(l.entity)}>
            <ha-icon icon="mdi:dots-vertical"></ha-icon></button>
        </div>
        ${this._split(l.entity, l.icon, lit, pct, at)}
        ${lit && rgb ? html`<button class="swatch" style="background:rgb(${rgb.join(",")})"
            @click=${() => this._openLight(l.entity)}></button>` : nothing}
      </div>`;
  }

  _moreInfo(entityId) {
    this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }));
  }

  // the split pill itself: drag to dim, tap = that brightness, tap the bulb = on/off
  _split(id, icon, lit, pct, at, cls = "", style = "") {
    return html`
      <div class="split ${lit ? "lit" : ""} ${cls} ${this._press && this._press.id === id && this._press.moved ? "dragging" : ""}"
           style="--ov-at:${at};${style}" data-lo=${cls === "big" ? 8 : 22} data-hi=${cls === "big" ? 96 : 88}
           @pointerdown=${(ev) => this._pillDown(ev, id, pct)}
           @pointermove=${(ev) => this._pillMove(ev)}
           @pointerup=${(ev) => this._pillUp(ev)}
           @pointercancel=${() => this._pillCancel()}
           @touchmove=${(ev) => ev.preventDefault()}>
        <div class="seg seg-top"></div>
        <div class="seg seg-bot">
          <span class="seg-ico"><ha-icon icon=${icon || "mdi:lightbulb-outline"}></ha-icon></span>
        </div>
      </div>`;
  }

  // --- light sheet: HA's light dialog laid out the same way, in this look --------
  // brightness pill, power, warm/cool white, colour swatches, then the group's bulbs.
  // The corner button still opens HA's own dialog for settings, history and effects.
  _openLight(id) {
    if (!this._st(id)) return;
    fireHaptic("light");
    this._pop = null;
    this._light = id;
    this._lightAt = performance.now();
  }

  _lightSheet() {
    const id = this._light, e = this._st(id);
    if (!e) return nothing;
    const a = e.attributes, on = e.state === "on";
    const modes = a.supported_color_modes || [];
    const dims = modes.some((m) => m !== "onoff");
    const hasCt = modes.includes("color_temp");
    const hasCol = modes.some((m) => ["hs", "xy", "rgb", "rgbw", "rgbww"].includes(m));
    const real = on ? Math.round((a.brightness || 255) / 2.55) : 0;
    const drag = this._dragPct(id);
    const pct = drag != null ? drag : real;
    const lit = drag != null ? drag > 0 : on;
    this._last = this._last || {};
    if (on) this._last[id] = real;
    const at = clamp(lit ? pct : (this._last[id] || 50), 8, 96);
    const rgb = a.rgb_color;
    const members = Array.isArray(a.entity_id) ? a.entity_id.filter((m) => this._st(m)) : [];
    const close = () => { this._light = null; };
    // the lift that ends the hold arrives as a click on the scrim: don't let it close the sheet it opened
    const scrimClose = () => { if (performance.now() - (this._lightAt || 0) > 700) close(); };
    const full = () => { this._light = null; this._moreInfo(id); };
    const room = !!this._lightRoom;   // a room heading's hold: just the one slider and power
    const state = e.state === "unavailable" ? "Unavailable" : lit ? (dims ? `${pct}%` : "On") : "Off";
    return html`
      <div class="scrim pop-scrim" @click=${scrimClose} @touchmove=${(ev) => { if (ev.target === ev.currentTarget) ev.preventDefault(); }}>
        <div class="sheet pop lsheet ${this._config.phone || room ? "" : "two"} ${room ? "room" : ""}" @click=${(ev) => ev.stopPropagation()}
             @touchstart=${(ev) => this._swStart(ev, close)} @touchmove=${(ev) => this._swMove(ev)} @touchend=${() => this._swEnd()} @touchcancel=${() => this._swEnd(true)}>
          <div class="grabber"></div>
          <div class="pop-head">
            <span class="pop-ico ${lit ? "lit" : ""}"><ha-icon icon=${a.icon || "mdi:lightbulb"}></ha-icon></span>
            <span class="pop-title">${this._lightName(id)}<span class="lsheet-state ${lit ? "lit" : ""}"><span class="txt">${state}</span><span class="livetxt"></span></span></span>
            ${room ? nothing : html`<button class="round small" title="More settings" @click=${full}><ha-icon icon="mdi:dots-horizontal"></ha-icon></button>`}
            <button class="round small" title="Close" @click=${close}><ha-icon icon="mdi:close"></ha-icon></button>
          </div>
          <div class="pop-body lsheet-body">
            <div class="lsheet-main">
              ${dims ? this._split(id, a.icon, lit, pct, at, "big", rgb && lit ? `--lit-c:rgb(${rgb.join(",")})` : "")
                : html`<button class="lsheet-onoff ${lit ? "lit" : ""}" @click=${() => this._call("light", "toggle", { entity_id: id })}>
                    <ha-icon icon=${a.icon || "mdi:lightbulb"}></ha-icon></button>`}
              <button class="lsheet-power ${on ? "on" : ""}" title=${on ? "Turn off" : "Turn on"}
                      @click=${() => this._call("light", "toggle", { entity_id: id })}>
                <ha-icon icon="mdi:power"></ha-icon></button>
            </div>
            ${room ? nothing : html`<div class="lsheet-side">
              ${hasCt ? this._ctBar(id, a) : nothing}
              ${hasCol ? this._swatches(id, a) : nothing}
              ${members.length ? html`
                <div class="pop-sub">Lights in this group</div>
                <div class="pop-grid">${members.map((m) => this._memberTile(m))}</div>` : nothing}
            </div>`}
          </div>
        </div>
      </div>`;
  }

  _lightName(id) {
    const l = [...(this._config.lights || []), ...(this._config.phone_rooms || []).flatMap((r) => r.items || [])]
      .find((x) => x.entity === id && x.name) || { name: (this._names || {})[id] };
    const e = this._st(id);
    return (l && l.name) || (e && e.attributes.friendly_name) || id;
  }

  // warm on the left, cool on the right, like HA's own slider
  _ctBar(id, a) {
    const lo = a.min_color_temp_kelvin || 2000, hi = a.max_color_temp_kelvin || 6500;
    const pend = this._ct && this._ct.id === id ? this._ct.k : null;
    const cur = pend != null ? pend : (a.color_mode === "color_temp" && a.color_temp_kelvin) || null;
    const pos = cur != null ? clamp((cur - lo) / (hi - lo) * 100, 0, 100) : null;
    const k = (ev, r) => Math.round(lo + clamp((ev.clientX - r.left) / r.width, 0, 1) * (hi - lo));
    const down = (ev) => {
      ev.currentTarget.setPointerCapture(ev.pointerId);
      const r = ev.currentTarget.getBoundingClientRect();
      this._ctPress = r;
      this._ct = { id, k: k(ev, r) };
    };
    const move = (ev) => { if (this._ctPress) this._ct = { id, k: k(ev, this._ctPress) }; };
    const up = () => {
      if (!this._ctPress || !this._ct) return;
      this._ctPress = null;
      const val = this._ct.k;
      this._call("light", "turn_on", { entity_id: id, color_temp_kelvin: val });
      setTimeout(() => { if (this._ct && this._ct.k === val) this._ct = null; }, 1500);
    };
    return html`
      <div class="pop-sub">White</div>
      <div class="ctbar" @pointerdown=${down} @pointermove=${move} @pointerup=${up} @touchmove=${(ev) => ev.preventDefault()}
           @pointercancel=${() => { this._ctPress = null; this._ct = null; }}>
        <span class="ct-end"><ha-icon icon="mdi:weather-sunset"></ha-icon></span>
        <span class="ct-end cool"><ha-icon icon="mdi:snowflake-variant"></ha-icon></span>
        ${pos != null ? html`<span class="ct-thumb" style="left:${pos}%"></span>` : nothing}
      </div>`;
  }

  _swatches(id, a) {
    const hs = a.color_mode !== "color_temp" && a.hs_color;
    return html`
      <div class="pop-sub">Colour</div>
      <div class="swatches">
        ${SWATCHES.map(([h, sat, label]) => {
          const near = hs && hs[1] > 40 && Math.min(Math.abs(hs[0] - h), 360 - Math.abs(hs[0] - h)) < 16;
          return html`<button class="sw ${near ? "on" : ""}" title=${label} style="--c:hsl(${h} ${sat}% 58%)"
            @click=${() => this._call("light", "turn_on", { entity_id: id, hs_color: [h, sat] })}></button>`;
        })}
      </div>`;
  }

  _memberTile(m) {
    const e = this._st(m), on = e.state === "on";
    const pct = on && e.attributes.brightness ? Math.round(e.attributes.brightness / 2.55) : null;
    return html`
      <button class="ptile ${on ? "on" : ""}" @click=${() => this._call("light", "toggle", { entity_id: m })}>
        <span class="tile-ico"><ha-icon icon=${e.attributes.icon || "mdi:lightbulb"}></ha-icon></span>
        <span class="tile-text"><span class="tile-name">${this._lightName(m)}</span>
          <span class="muted">${e.state === "unavailable" ? "Unavailable" : on ? (pct != null && pct < 100 ? `On · ${pct}%` : "On") : "Off"}</span></span>
      </button>`;
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
          <button class="pl" style=${p.image ? `background-image:url('${this._u(p.image)}')` : ""}
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
    try { localStorage.setItem(this._spKey(), sp.name); } catch (e) {}
    this._call("music_assistant", "play_media",
      { entity_id: sp.ma, media_id: p.uri, media_type: "playlist", enqueue: "replace" });
  }

  _pillDown(ev, id, pct) {
    const el = ev.currentTarget;
    el.setPointerCapture(ev.pointerId);
    // a tap on the bulb icon toggles; a tap anywhere else on the pill means "this bright"
    const box = el.closest(".pill-wrap, .lsheet");
    this._press = { id, el, box, labels: box ? [...box.querySelectorAll(".pill-state, .lsheet-state")] : [], y: ev.clientY, rect: el.getBoundingClientRect(),
                    moved: false, start: pct, pct, lo: Number(el.dataset.lo) || 22, hi: Number(el.dataset.hi) || 88,
                    icon: !!(ev.target.closest && ev.target.closest(".seg-ico")) };
  }

  // While a finger is down nothing re-renders. Once per animation frame the pill gets one
  // CSS variable (--ov-at, read by the two clip-paths) and the label's plain-text twin is
  // rewritten. Clip-path changes repaint the pill only: no layout, no Lit, so it keeps up
  // with the display (60/120 Hz) even on the Nest Hub.
  _pillMove(ev) {
    const p = this._press;
    if (!p) return;
    if (!p.moved && Math.abs(ev.clientY - p.y) < 4) return;
    if (!p.moved) {
      p.moved = true;
      p.el.classList.add("dragging");
      if (p.box) p.box.classList.add("live");
    }
    p.pct = clamp(Math.round((p.rect.bottom - ev.clientY) / p.rect.height * 100), 0, 100);
    if (!p.raf) p.raf = requestAnimationFrame(() => this._paint(p));
  }

  _paint(p) {
    p.raf = 0;
    p.el.style.setProperty("--ov-at", clamp(p.pct, p.lo, p.hi));
    p.el.classList.toggle("lit", p.pct > 0);
    // the text changes width, which costs a layout, so it updates at ~20 Hz; the fill every frame
    const now = performance.now();
    if (now - (p.textAt || 0) >= 50 || p.pct === 0) {
      p.textAt = now;
      // .livetxt has no Lit bindings inside it, so writing its text directly is safe
      for (const l of p.labels) {
        l.lastElementChild.textContent = p.pct === 0 ? "Off"
          : l.classList.contains("pill-state") ? `On · ${p.pct}%` : `${p.pct}%`;
        l.classList.toggle("zero", p.pct === 0);
      }
    }
  }

  _endLive(p) {
    if (p.raf) cancelAnimationFrame(p.raf);
    p.el.classList.remove("dragging");
    // keep the CSS text up until Lit has drawn the real one, so it never flashes stale
    if (p.box) this.updateComplete.then(() => {
      p.box.classList.remove("live");
      for (const l of p.labels) l.classList.remove("zero");
    });
  }

  _pillCancel() {
    if (this._press) this._endLive(this._press);
    this._press = null;
    this._drag = null;
  }

  // the value to draw for a light: the finger while dragging, then what was sent until HA agrees
  _dragPct(id) {
    const p = this._press;
    if (p && p.id === id && p.moved) return p.pct;
    return this._drag && this._drag.id === id && "pct" in this._drag ? this._drag.pct : null;
  }

  _pillUp() {
    const p = this._press;
    this._press = null;
    if (!p) return;
    this._endLive(p);
    if (!p.moved && p.icon) {
      this._call("light", "toggle", { entity_id: p.id });
      return;
    }
    const pct = p.moved ? p.pct : clamp(Math.round((p.rect.bottom - p.y) / p.rect.height * 100), 1, 100);
    // hold what was sent until HA reports it (see updated()), so the fill never jumps back
    this._drag = { id: p.id, pct, until: Date.now() + 6000 };
    setTimeout(() => this._settle(true), 6100);
    if (pct <= 1) this._call("light", "turn_off", { entity_id: p.id });
    else this._call("light", "turn_on", { entity_id: p.id, brightness_pct: pct });
  }

  // drop the held brightness once HA's state matches it (or after 6 s, whatever HA says)
  _settle(timeout = false) {
    const d = this._drag;
    if (!d || !("pct" in d)) return;
    const e = this._st(d.id);
    const real = e && e.state === "on" ? Math.round((e.attributes.brightness || 255) / 2.55) : 0;
    const done = d.pct <= 1 ? real === 0 : Math.abs(real - d.pct) <= 2;
    if (done || (timeout && Date.now() >= d.until)) this._drag = null;
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
        <div class="hp-now ${this._links()[id] ? "linked" : ""}" @click=${() => { if (this._links()[id]) this._open(id); }}>
          <span class="hp-temp">${a.current_temperature != null ? `${Math.round(a.current_temperature * 10) / 10}°` : "–"}</span>
          <span class="hp-mode ${mode}">${label}</span>
          ${this._links()[id] ? html`<ha-icon class="hp-more" icon="mdi:chevron-right"></ha-icon>` : nothing}
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
      --bar: rgba(255, 255, 255, 0.55);
      --card-edge: rgba(255, 255, 255, 0.95);
      --inset: #eef3fb;
      --sheet: rgba(255, 255, 255, 0.96);
      --pop: rgba(255, 255, 255, 0.94);
      --grid-line: rgba(22, 42, 84, 0.08);
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
      :host(:not([scheme="light"])) {
        --bg: linear-gradient(165deg, #0b0f18 0%, #121827 100%);
        --card: rgba(29, 35, 50, 0.82);
        --bar: rgba(29, 35, 50, 0.55);
        --card-edge: rgba(255, 255, 255, 0.05);
        --inset: rgba(255, 255, 255, 0.05);
        --sheet: rgba(29, 35, 50, 0.82);
        --pop: rgba(29, 35, 50, 0.82);
        --grid-line: rgba(255, 255, 255, 0.07);
        --ink: #eef2fb;
        --muted: #8e99b0;
        --accent: #6b9bff;
        --accent-soft: rgba(107, 155, 255, 0.16);
        --track: rgba(255, 255, 255, 0.1);
        --track-strong: rgba(255, 255, 255, 0.22);
        --shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
      }
    }
    /* option scheme: an entity that picks the look instead of the device (sun.sun: dark below the horizon) */
    :host([scheme="dark"]) {
        --bg: linear-gradient(165deg, #0b0f18 0%, #121827 100%);
        --card: rgba(29, 35, 50, 0.82);
        --bar: rgba(29, 35, 50, 0.55);
        --card-edge: rgba(255, 255, 255, 0.05);
        --inset: rgba(255, 255, 255, 0.05);
        --sheet: rgba(29, 35, 50, 0.82);
        --pop: rgba(29, 35, 50, 0.82);
        --grid-line: rgba(255, 255, 255, 0.07);
        --ink: #eef2fb;
        --muted: #8e99b0;
        --accent: #6b9bff;
        --accent-soft: rgba(107, 155, 255, 0.16);
        --track: rgba(255, 255, 255, 0.1);
        --track-strong: rgba(255, 255, 255, 0.22);
        --shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
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
    .screen.windowed { position: relative; inset: auto; z-index: auto; height: 100vh; height: 100dvh; }
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
    .topright.on-photo .clock { font-size: 52px; }
    .topright.on-photo .temp { font-size: 30px; }
    .np-line { position: absolute; top: calc(env(safe-area-inset-top, 0px) + 100px); right: 30px; z-index: 3;
               max-width: 46%; display: flex; align-items: center; gap: 10px; padding: 8px 16px 8px 12px;
               border-radius: 999px; background: rgba(0, 0, 0, 0.32); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
               color: #fff; font-family: var(--body); text-align: left; }
    .np-line ha-icon { --mdc-icon-size: 22px; color: var(--warm); flex: none; }
    .np-line-text { display: flex; flex-direction: column; min-width: 0; line-height: 1.2; }
    .np-line-text b { font-size: 18px; font-weight: 700; }
    .np-line-text > span { font-size: 15px; font-weight: 500; opacity: 0.8; }

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
    /* desk: no dock; four columns that each scroll on their own if they run long */
    .screen.desk-screen { grid-template-columns: 1fr; }
    .screen.desk-screen > .status { left: 20px; right: 20px; }
    .desk-screen .page { padding-left: 28px; }
    .desk { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 18px; height: 100%; min-height: 0; }
    .desk-col { display: flex; flex-direction: column; gap: 14px; min-height: 0; overflow-y: auto; scrollbar-width: none;
                margin: -10px -12px; padding: 10px 12px 24px; }
    .desk-col::-webkit-scrollbar { display: none; }
    .desk-card { padding: 18px 18px 18px; flex: none; }
    .desk-card .card-title { display: flex; align-items: center; gap: 8px; }
    .desk-ico { --mdc-icon-size: 20px; color: var(--muted); }
    .desk-title { padding: 2px 4px 0; font-family: var(--display); font-size: 20px; font-weight: 700;
                  letter-spacing: -0.01em; user-select: none; }
    .desk-sub { display: flex; align-items: center; gap: 6px; padding: 4px 4px 0; margin-bottom: -6px;
                font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); }
    .desk-sub .desk-ico { --mdc-icon-size: 16px; }
    /* lights, plugs and plants share the two middle columns */
    .desk-mid { grid-column: span 2; }
    .desk-pair { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; align-items: start; }
    .desk-pair + .desk-pair { margin-top: 6px; }
    .desk-stack { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
    .desk-card .wx-card { margin-top: 10px; padding: 0; background: none; border-radius: 0; cursor: pointer; }
    .desk-card .wx-card ha-icon { --mdc-icon-size: 40px; }
    .desk-card .wx-temp { font-family: var(--display); font-size: 40px; font-weight: 700; letter-spacing: -0.02em; }
    .desk-hp { padding: 0; }
    .desk-hp .thermo { background: none; padding: 18px; }
    /* computer: the heat pump's buttons sit on the card itself, so give them the phone's light grey */
    .desk-screen .desk-hp .hp-step, .desk-screen .desk-hp .mode:not(.on) { background: var(--inset); }
    .desk-favs { display: grid; grid-template-columns: repeat(var(--n, 1), minmax(0, 1fr)); gap: 10px;
                 height: 250px; margin-top: 12px; }
    .desk .pill-wrap { min-width: 0; overflow: hidden; container-type: inline-size; }
    .desk .split { --w: min(72px, 100cqw); }
    .desk .pill-head > div { min-width: 0; }
    /* narrow pills (a laptop with the sidebar open): the dots go above the name, which
       then gets the pill's whole width and only breaks a word with a hyphen */
    .desk-favs { container: favs / inline-size; }
    @container favs (max-width: 320px) {
      .desk .pill-wrap { padding: 10px 9px 12px; }
      .desk .pill-head { position: relative; padding-top: 20px; }
      .desk .pill-head .dots { position: absolute; top: -4px; right: -5px; width: 26px; height: 26px; margin: 0; }
      .desk .pill-name { font-size: 13px; hyphens: auto; -webkit-hyphens: auto; }
    }
    .desk-scenes { flex-wrap: wrap; margin-top: 0; }
    .desk-scenes .mini-scene { flex: 0 0 calc((100% - 20px) / 3); height: 88px; }
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
    .where-row { display: flex; gap: 6px; }
    .where-row .where { flex: 1; min-width: 0; }
    .where-row .where span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .where-vol { flex: none; min-width: 66px; height: 44px; padding: 0 14px; border-radius: 999px; display: grid; place-items: center;
                 background: var(--accent-soft); color: var(--accent); font-weight: 600; font-size: 15px; font-variant-numeric: tabular-nums; }
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
    /* two full-size layers, each cut by a clip-path at --ov-at (0-100), 3px apart. Moving the split
       is a repaint of this one element: no layout. --ov-at is registered (see the bottom of the
       file) so it can transition when HA changes the light; the transition is off while dragging. */
    .split { --w: 72px; --r: calc(var(--w) / 2); flex: 1; min-height: 0; width: var(--w); margin: 12px auto 4px;
             position: relative; touch-action: none; cursor: pointer; contain: strict; will-change: transform;
             transition: --ov-at 0.18s ease-out; }
    .split.dragging { transition: none; }
    .seg { position: absolute; inset: 0; background: var(--track); transition: background 0.2s; }
    .seg-top { clip-path: inset(0 0 calc(var(--ov-at) * 1% + 1.5px) 0 round var(--r) var(--r) 6px 6px); }
    .seg-bot { clip-path: inset(calc((100 - var(--ov-at)) * 1% + 1.5px) 0 0 0 round 6px 6px var(--r) var(--r));
               display: flex; align-items: flex-end; justify-content: center; padding-bottom: 6px; color: var(--muted); }
    .livetxt, .live .txt { display: none; }
    .live .livetxt { display: inline; }
    .live .pill-state, .live .lsheet-state { color: var(--warm); }
    /* fixed height + strict containment: a changing % re-lays out the label only, not the page */
    .pill-state, .lsheet-state { height: 18px; line-height: 18px; contain: strict; white-space: nowrap; }
    .live .pill-state { font-weight: 600; }
    .live .pill-state.zero, .live .lsheet-state.zero { color: var(--muted); }
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
    /* status pills: the room-tab shape; people always, alerts only while on */
    .status { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; }
    .status::-webkit-scrollbar { display: none; }
    .screen > .status { position: absolute; z-index: 2; top: calc(env(safe-area-inset-top, 0px) + 10px); left: 98px;
                        right: 250px; padding: 8px 8px 24px; pointer-events: none; }
    .screen > .status .tab { pointer-events: auto; }
    .st { color: var(--ink); }
    .st-home ha-icon { color: #3f8f63; }
    .st-away { color: var(--muted); }
    .st-away ha-icon { color: #7b63b8; }
    .st.warn { background: color-mix(in srgb, var(--warm) 18%, var(--card)); color: color-mix(in srgb, var(--warm) 75%, var(--ink)); }
    .st.bad { background: color-mix(in srgb, #e5484d 16%, var(--card)); color: color-mix(in srgb, #e5484d 80%, var(--ink)); }
    .st.cool { background: color-mix(in srgb, var(--cool) 16%, var(--card)); color: color-mix(in srgb, var(--cool) 80%, var(--ink)); }
    .st.accent { background: var(--accent-soft); color: var(--accent); }
    .st.reading small { font-size: 12px; font-weight: 500; color: var(--muted); }
    /* the Nest Hub and the tablet: people, alerts and the four readings fit beside the clock without labels */
    @media (max-width: 1400px) {
      .screen:not(.desk-screen) > .status { right: 180px; gap: 6px; }
      .screen:not(.desk-screen) > .status .tab { padding: 0 13px; gap: 6px; }
      .screen:not(.desk-screen) > .status .reading small { display: none; }
    }
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
    /* the big screen's month: a full-width grid of lines, chips with a colour bar and the time */
    .calendar.big { display: flex; flex-direction: column; }
    .big .month { flex: 1; padding: 0; background: none; box-shadow: none; border: 0; }
    .big .month-head { gap: 8px; padding: 2px 0 16px; }
    .big .month-head h1 { font-size: 30px; margin: 0 auto 0 8px; }
    .big .month-head .mon { color: var(--accent); font-weight: 800; text-transform: uppercase; }
    .big .month-head .yr { color: var(--accent); opacity: 0.55; font-weight: 500; }
    .big .nav-btn { width: 40px; height: 40px; background: var(--card); box-shadow: var(--shadow); }
    .big .today-btn { height: 40px; background: var(--card); color: var(--ink); box-shadow: var(--shadow); font-size: 14px; }
    .big .today-btn:disabled { opacity: 0.45; box-shadow: none; }
    .big .dow { gap: 0; padding: 0 0 8px; }
    .big .dow span { text-align: center; padding: 0; font-size: 15px; font-weight: 700; color: var(--ink);
                     text-transform: none; letter-spacing: 0; }
    .big .mgrid { gap: 0; border-top: 1px solid var(--grid-line); border-left: 1px solid var(--grid-line); }
    .big .day { border-radius: 0; background: none; border-right: 1px solid var(--grid-line);
                border-bottom: 1px solid var(--grid-line); padding: 6px 6px 6px; gap: 4px; }
    .big .day.out > * { opacity: 0.4; }
    .big .day.today { box-shadow: inset 0 0 0 2px var(--accent); border-radius: 14px; }
    .big .dnum { align-self: center; width: auto; height: 22px; font-size: 14px; font-weight: 600; }
    .big .day.today .dnum { background: none; color: var(--accent); font-weight: 800; }
    .big .chip { display: flex; align-items: center; gap: 5px; border: 0; border-radius: 7px; padding: 3px 6px;
                 background: var(--card); box-shadow: 0 1px 2px rgba(22, 42, 84, 0.06); font-weight: 500; }
    .big .chip i { flex: none; width: 4px; height: 13px; border-radius: 2px; background: var(--c); }
    .big .chip b { flex: none; font-weight: 700; }
    .big .chip b:empty { display: none; }
    .big .chip span { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
    .big .more { align-self: stretch; text-align: center; padding: 2px 0; border-radius: 7px; background: var(--card); }
    .day-sheet { max-height: 80%; overflow-y: auto; }
    .day-sheet .empty { padding: 8px 0 4px; }
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
    .sheet { width: min(440px, 90vw); padding: 20px; display: flex; flex-direction: column; gap: 6px; background: var(--sheet);
             backdrop-filter: blur(30px); }
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
    .cap-small { font-size: 16px; font-weight: 500; opacity: 0.9; }
    .cap-big { font-size: 28px; font-weight: 600; letter-spacing: -0.01em; margin-top: 2px; }
    .photo-nav { display: flex; gap: 8px; margin-top: 14px; }
    .photo-nav button { width: 40px; height: 40px; border-radius: 50%; border: 0; display: grid; place-items: center;
                        background: rgba(20, 32, 56, 0.55); color: #fff; cursor: pointer; text-shadow: none;
                        -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); }
    .photo-nav button:active { transform: scale(0.94); background: rgba(20, 32, 56, 0.75); }
    .photo-nav ha-icon { --mdc-icon-size: 24px; }

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
      .where, .where-vol { height: 36px; font-size: 14px; }
      .col-b { padding: 14px 16px 16px; }
      .favs { margin-top: 10px; gap: 10px; grid-template-columns: minmax(88px, 0.6fr) minmax(0, 1.4fr); }
      .pill-wrap, .thermo { padding: 10px 12px; border-radius: 18px; }
      .pill-head { min-height: 34px; }
      .pill-name { font-size: 14px; }
      .pill-state { font-size: 12px; }
      .split { --w: 56px; margin-top: 8px; }
      .seg-bot { padding-bottom: 4px; }
      .seg-ico { width: 44px; height: 44px; }
      .seg-bot ha-icon { --mdc-icon-size: 24px; }
      .swatch { right: 10px; bottom: 10px; width: 16px; height: 16px; }
      .thermo { gap: 5px; }
      .hp-step { width: 42px; height: 40px; border-radius: 13px; }
      .hp-set { font-size: 21px; }
      .modes { height: 42px; gap: 6px; grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .fav-scenes { margin-top: 8px; gap: 8px; }
      .mini-scene { height: 68px; padding: 7px 4px; gap: 4px; border-radius: 14px; }
      .mini-scene ha-icon { width: 28px; height: 28px; --mdc-icon-size: 18px; }
      .ms-name { font-size: 11px; }
      .hp-target { margin-top: 14px; }
      .hp-now { gap: 6px; }
      .hp-temp { font-size: 32px; }
      .mode { border-radius: 14px; font-size: 12px; gap: 3px; padding: 0 4px; min-width: 0; }
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
              display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; padding: 7px; border-radius: 28px;
              background: var(--bar); border: 1px solid var(--card-edge); box-shadow: 0 10px 40px rgba(22, 42, 84, 0.18);
              backdrop-filter: blur(22px) saturate(1.6); -webkit-backdrop-filter: blur(22px) saturate(1.6); }
    .screen.phone::after { content: ""; position: absolute; z-index: 3; left: 0; right: 0; bottom: 0; pointer-events: none;
                           height: calc(env(safe-area-inset-bottom, 0px) + 120px);
                           backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
                           -webkit-mask-image: linear-gradient(to bottom, transparent, #000 55%);
                           mask-image: linear-gradient(to bottom, transparent, #000 55%); }
    .tabbar .dock-btn { width: auto; height: 54px; display: flex; flex-direction: column; justify-content: center; gap: 2px; }
    .tabbar .dock-btn ha-icon { --mdc-icon-size: 24px; }
    .tabbar .dock-btn span { font-size: 11px; font-weight: 600; }

    /* phone home: ha-phone's order */
    .ph { display: flex; flex-direction: column; gap: 18px; }
    .ph section { display: flex; flex-direction: column; gap: 10px; }
    .ph-sec { display: flex; align-items: center; gap: 9px; padding: 0 4px; min-height: 40px; font-size: 17px; font-weight: 700;
              letter-spacing: -0.01em; }
    .ph-sec ha-icon { --mdc-icon-size: 20px; color: var(--muted); }
    .ph-group { margin-left: auto; width: 40px; height: 40px; border-radius: 50%; background: var(--card);
                box-shadow: var(--shadow); display: grid; place-items: center; color: var(--muted); }
    .ph-group ha-icon { --mdc-icon-size: 20px; color: inherit; }
    .ph-group.on { background: var(--warm); color: #fff; }
    /* players take two rows with the small tiles stacked beside them, as on ha-phone */
    .ph-grid { display: grid; grid-template-columns: 1fr 1fr; grid-auto-rows: minmax(62px, auto); grid-auto-flow: dense; gap: 10px; }
    .ph-grid .player { grid-row: span 2; justify-content: space-between; }
    .ph-grid .plant .tile-text .muted { display: none; }
    .ph-grid .player, .ph-grid .tile { min-width: 0; }
    .ph-grid .tile { grid-template-columns: 38px 1fr auto; gap: 10px; padding: 10px 12px; border-radius: 20px; min-height: 62px; }
    .ph-grid .tile-ico { width: 38px; height: 38px; }
    .ph-grid .tile-ico ha-icon { --mdc-icon-size: 20px; }
    .ph-grid .tile-name { font-size: 14px; line-height: 1.2; display: -webkit-box; -webkit-line-clamp: 2;
                          -webkit-box-orient: vertical; overflow: hidden; }
    .ph-grid .tile-text .muted { font-size: 12px; }
    .ph-grid .tile-val { font-size: 18px; }
    .tile-ico.tap { cursor: pointer; transition: transform 0.12s; }
    .tile-ico.tap:active { transform: scale(0.9); }
    .light-tile.on { background: color-mix(in srgb, var(--warm) 14%, var(--card)); }
    .ph-grid .player { padding: 12px; gap: 10px; border-radius: 20px; }
    .ph-grid .player-row { grid-template-columns: 40px 1fr; gap: 10px; }
    .ph-grid .player-row .round.play { position: absolute; width: 0; height: 0; overflow: hidden; }
    .ph-grid .art.small { width: 40px; height: 40px; border-radius: 10px; }
    .ph-grid .player-title { font-size: 14px; }
    .ph-grid .media-artist { font-size: 12px; }
    .ph-grid .vol { gap: 6px; }
    .ph-grid .player .round.small { border-radius: 13px; }
    .ph-grid .transport { display: flex; justify-content: center; }
    .ph-grid .transport.power-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
    .ph-grid .power-pair .round.small { width: 100%; }
    .ph-grid .player { position: relative; }
    .ph-vol { position: absolute; top: 12px; right: 12px; font-size: 13px; font-weight: 700;
              font-variant-numeric: tabular-nums; color: var(--muted); }
    .ph-grid .has-vol .media-text { padding-right: 34px; }
    .ph-grid .has-art .ph-vol { color: rgba(255, 255, 255, 0.85); }
    .ph-grid .player.has-art { color: #fff; position: relative; isolation: isolate; overflow: hidden; background: #171b27; }
    .ph-grid .player.has-art::before { content: ""; position: absolute; inset: 0; z-index: -1;
      background: linear-gradient(rgba(14, 18, 30, 0.55), rgba(14, 18, 30, 0.72)), var(--art) center / cover;
      filter: saturate(0.5); }
    .ph-grid .has-art .media-src, .ph-grid .has-art .media-artist { color: rgba(255, 255, 255, 0.82); }
    .ph-grid .has-art .art.small { background: rgba(255, 255, 255, 0.2); color: #fff; }
    .ph-grid .has-art .round.small { background: rgba(255, 255, 255, 0.22); color: #fff; }
    .ph-grid .has-art .vol-bar { background: rgba(255, 255, 255, 0.28); }
    .ph-grid .has-art .vol-bar div { background: #fff; }
    .ph-hp { grid-column: 1 / -1; padding: 14px; border-radius: 22px; }
    .ph-hp .thermo { background: none; padding: 0; display: grid; gap: 12px 10px; grid-template-columns: 1fr auto;
                     grid-template-areas: "now target" "modes modes"; }
    .ph-hp .pill-head { display: none; }
    .ph-hp .hp-now { grid-area: now; align-self: center; }
    .ph-hp .hp-temp { font-size: 30px; }
    .ph-hp .hp-mode { font-size: 14px; }
    .ph-hp .hp-target { grid-area: target; margin: 0; }
    .ph-hp .hp-step { width: 42px; height: 42px; border-radius: 14px; background: var(--inset); }
    .ph-hp .hp-set { font-size: 20px; min-width: 52px; }
    .ph-hp .modes { grid-area: modes; height: 46px; margin: 0; gap: 8px; }
    .ph-hp .mode { background: var(--inset); border-radius: 14px; font-size: 13px; }
    .ph-hp .mode ha-icon { --mdc-icon-size: 19px; }
    .phone .fav-scenes { margin: -10px -16px -18px; padding: 10px 16px 22px; overflow-x: auto; scrollbar-width: none;
                         scroll-snap-type: x proximity; scroll-padding: 0 16px; }
    .phone .fav-scenes::-webkit-scrollbar { display: none; }
    .phone .mini-scene { flex: none; width: 84px; height: 84px; padding: 9px 4px; scroll-snap-align: start;
                         background: var(--card); box-shadow: var(--shadow); }
    .phone .mini-scene ha-icon { background: var(--accent-soft); }
    .phone .mini-scene.on { background: var(--accent); }
    .phone .mini-scene.on ha-icon { background: rgba(255, 255, 255, 0.2); }
    .phone .status { margin: -10px -16px -22px; padding: 10px 16px 24px; }
    .phone .tab { height: 40px; padding: 0 14px; font-size: 14px; gap: 6px; }

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
    /* pop-up sheets */
    .pop-scrim { position: fixed; z-index: 6; display: flex; align-items: flex-end; justify-content: center;
                 padding: 0 8px calc(env(safe-area-inset-bottom, 0px) + 8px); }
    .pop { width: min(560px, 100%); max-height: 86vh; display: flex; flex-direction: column; gap: 0; padding: 8px 16px 16px;
           border-radius: 30px; background: var(--pop); backdrop-filter: blur(30px) saturate(1.4);
           -webkit-backdrop-filter: blur(30px) saturate(1.4); animation: pop-up 0.22s ease-out; }
    @keyframes pop-up { from { transform: translateY(40px); opacity: 0; } to { transform: none; opacity: 1; } }
    /* bedside night clock: fixed dark red on black in either theme, dim enough for a dark room */
    /* now playing: the speaker's music over the whole screen, same dark ground as the timer */
    .np { --np-hot: var(--warm); --np-on: #1d1206; z-index: 800; background: linear-gradient(165deg, #0b0f18 0%, #121827 100%); color: #f4f6fb;
          display: grid; grid-template-columns: auto minmax(0, 1fr); grid-template-rows: minmax(0, 1fr);
          align-items: center; gap: 4vw; padding: 6vh 5vw; overflow: hidden; }
    .np-blur { position: absolute; inset: -15%; background: center / cover; filter: blur(60px) saturate(1.4) brightness(0.5); opacity: 0.45; }
    .np-art { position: relative; height: 84vh; aspect-ratio: 1; max-width: 44vw; border-radius: 5vh;
              background: rgba(255, 255, 255, 0.08) center / cover; box-shadow: 0 2vh 6vh rgba(0, 0, 0, 0.45);
              display: grid; place-items: center; }
    .np-art ha-icon { --mdc-icon-size: 20vh; color: #8e99b0; }
    .np-side { position: relative; height: 84vh; min-width: 0; display: flex; flex-direction: column; }
    .np-head { display: flex; justify-content: space-between; align-items: center; gap: 2vw; }
    .np-src { display: flex; align-items: center; gap: 1.2vw; font-family: var(--display); font-weight: 700;
              font-size: 5vh; color: var(--np-hot); white-space: nowrap; overflow: hidden; transition: color 0.6s; }
    .np-src ha-icon { --mdc-icon-size: 6vh; flex: none; }
    .np-title { margin-top: auto; font-family: var(--display); font-weight: 700; font-size: 11vh; line-height: 1.2; }
    .np-artist { margin-top: 1.5vh; font-family: var(--body); font-weight: 600; font-size: 7.5vh; color: #b4bdd0; }
    .np-track { margin-top: 3.5vh; height: 1.6vh; min-height: 6px; border-radius: 999px; background: rgba(255, 255, 255, 0.14); overflow: hidden; flex: none; }
    .np-track div { height: 100%; border-radius: 999px; background: var(--np-hot); transition: width 1s linear, background 0.6s; }
    .np-times { display: flex; justify-content: space-between; margin-top: 1.4vh; font-family: var(--body); font-weight: 600;
                font-size: 5.5vh; color: #8e99b0; font-variant-numeric: tabular-nums; }
    /* the timer's squircle buttons: three across, play/pause in the warm accent */
    .np-ctl { margin-top: auto; flex: none; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 2vw; }
    .np-btn { height: 22vh; border-radius: 7vh; background: rgba(255, 255, 255, 0.1); color: #f4f6fb;
              display: grid; place-items: center; transition: transform 0.12s; }
    .np-btn ha-icon { --mdc-icon-size: 11vh; }
    .np-btn.main { background: var(--np-hot); color: var(--np-on); transition: transform 0.12s, background 0.6s; }
    .np-btn.x { width: 11vh; height: 11vh; border-radius: 50%; }
    .np-btn.x ha-icon { --mdc-icon-size: 6.5vh; }
    .np-btn:active { transform: scale(0.97); }
    /* text that doesn't fit scrolls to its end and back (_marquee sets --dx and --t) */
    .mq { display: block; white-space: nowrap; overflow: hidden; min-width: 0; }
    .mq > span { display: inline-block; width: max-content; }
    .mq.run > span { animation: mq var(--t, 8s) ease-in-out infinite alternate; }
    @keyframes mq { 0%, 18% { transform: translateX(0); } 82%, 100% { transform: translateX(var(--dx)); } }
    /* voice clock: timer and alarm screens, always dark like the night clock (StandBy-style) */
    .ck { --ck-bg: linear-gradient(165deg, #0b0f18 0%, #121827 100%); --ck-ink: #f4f6fb; --ck-dim: #8e99b0;
          --ck-hot: var(--warm); --ck-on-hot: #1d1206; --ck-btn: rgba(255, 255, 255, 0.1);
          z-index: 900; background: var(--ck-bg); color: var(--ck-ink); grid-template-columns: minmax(0, 1fr);
          grid-template-rows: 1fr auto auto; padding: 6vh 5.5vw 6vh; gap: 4.5vh; }
    .ck-night { --ck-bg: #000; --ck-ink: #a8231b; --ck-dim: #6e1812; --ck-hot: #a8231b; --ck-on-hot: #000; --ck-btn: #160403; }
    .ck-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 3vw; min-height: 0; min-width: 0; }
    .ck-label { display: flex; align-items: center; gap: 1.4vw; font-family: var(--display); font-weight: 700;
                font-size: 7.5vh; color: var(--ck-hot); white-space: nowrap; padding-top: 2vh; }
    .ck-label ha-icon { --mdc-icon-size: 8.5vh; }
    .ck-of { font-family: var(--body); font-weight: 600; font-size: 5vh; color: var(--ck-dim); margin-left: 0.6vw; }
    .ck-digits { font-family: var(--display); font-weight: 800; font-size: min(44vh, 21vw); line-height: 0.86;
                 letter-spacing: -0.03em; font-variant-numeric: tabular-nums; text-align: right; cursor: pointer; }
    .ck-digits.paused { opacity: 0.45; }
    .ck-digits.ring { animation: ck-blink 1s steps(1) infinite; }
    @keyframes ck-blink { 50% { opacity: 0.35; } }
    .ck-colon { opacity: 0.5; margin: 0 0.02em; position: relative; top: -0.05em; }
    .ck-ampm { font-size: 0.24em; font-weight: 700; margin-left: 0.12em; color: var(--ck-dim); letter-spacing: 0; }
    .ck-track { height: 1.6vh; min-height: 6px; border-radius: 999px; background: var(--ck-btn); overflow: hidden; }
    .ck-track div { height: 100%; border-radius: 999px; background: var(--ck-hot); transition: width 1s linear; }
    .ck-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 2.4vw; }
    .ck-btn { height: 24vh; border-radius: 7vh; background: var(--ck-btn); color: var(--ck-ink); display: flex;
              align-items: center; justify-content: center; gap: 1.6vw; font-family: var(--display); font-weight: 700;
              font-size: 7.5vh; transition: transform 0.12s; }
    .ck-btn ha-icon { --mdc-icon-size: 8.5vh; }
    .ck-btn.main { background: var(--ck-hot); color: var(--ck-on-hot); }
    .ck-btn:active { transform: scale(0.97); }
    .ck-when { display: flex; align-items: baseline; gap: 2vw; font-family: var(--display); font-weight: 700;
               font-size: 9vh; grid-row: 3; }
    .ck-when span { font-family: var(--body); font-weight: 600; font-size: 6vh; color: var(--ck-dim); }
    .va-glow { position: fixed; inset: 0; z-index: 1000; pointer-events: none; border-radius: 0;
               box-shadow: inset 0 0 0 6px rgba(110, 190, 255, 1), inset 0 0 26px 14px rgba(30, 140, 255, 0.95),
                           inset 0 0 80px 34px rgba(30, 140, 255, 0.5);
               animation: va-in 0.25s ease-out, va-pulse 1.6s ease-in-out 0.25s infinite; }
    .va-glow.processing { animation: va-in 0.25s ease-out, va-pulse 0.7s ease-in-out infinite; }
    .va-glow.responding { opacity: 0.7; animation: va-pulse-soft 2.4s ease-in-out infinite; }
    @keyframes va-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes va-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
    @keyframes va-pulse-soft { 0%, 100% { opacity: 0.75; } 50% { opacity: 0.45; } }
    .wx-screen { grid-template-columns: 1fr; place-items: center; padding: 4vh 5vw; cursor: pointer; }
    .wx-none { font-family: var(--display); font-size: 6vh; color: var(--muted); }
    .wx-day { display: grid; grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr); gap: 5vw; align-items: center; width: 100%; }
    .wx-main { display: grid; justify-items: center; gap: 1vh; text-align: center; }
    .wx-label { font-family: var(--display); font-weight: 700; font-size: 6.5vh; }
    .wx-big { --mdc-icon-size: 27vh; width: 27vh; height: 27vh; }
    .wx-name { font-weight: 600; font-size: 6vh; color: var(--ink); opacity: 0.8; }
    .wx-side { display: grid; gap: 3vh; }
    .wx-temps { display: flex; align-items: baseline; gap: 2vw; font-family: var(--display); }
    .wx-hi { font-weight: 800; font-size: 17vh; line-height: 0.9; }
    .wx-lo { font-weight: 600; font-size: 9vh; color: var(--ink); opacity: 0.7; }
    .wx-facts { display: grid; grid-template-columns: auto auto; justify-content: start; gap: 1.4vh 3vw;
                font-weight: 600; font-size: 5vh; }
    .wx-facts span { display: inline-flex; align-items: center; gap: 0.8vw; white-space: nowrap; }
    .wx-facts ha-icon { --mdc-icon-size: 5.4vh; color: var(--ink); opacity: 0.75; }
    .wx-hours { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); gap: 1vw;
                background: var(--card); border-radius: 3vh; padding: 2vh 1vw; }
    .wx-hour { display: grid; justify-items: center; gap: 0.6vh; font-size: 4.6vh; font-weight: 600; color: var(--ink); }
    .wx-hour > span { opacity: 0.75; }
    .wx-hour ha-icon { --mdc-icon-size: 6.5vh; }
    .wx-hour b { font-size: 5.4vh; }
    .wx-pct { font-style: normal; font-weight: 700; font-size: 4.4vh; color: var(--cool); }
    .wx-week { display: grid; gap: 1.4vw; width: 100%; }
    .wx-col { display: grid; justify-items: center; gap: 1.2vh; background: var(--card); border-radius: 3vh;
              padding: 3.5vh 0.6vw; text-align: center; min-width: 0; }
    .wx-dow { font-family: var(--display); font-weight: 700; font-size: 5.4vh; }
    .wx-col ha-icon { --mdc-icon-size: 12vh; width: 12vh; height: 12vh; }
    .wx-cname { font-size: 4.2vh; font-weight: 600; line-height: 1.1; color: var(--ink); opacity: 0.8; min-height: 2.2em;
                display: flex; align-items: center; }
    .wx-chi { font-family: var(--display); font-weight: 800; font-size: 8.5vh; line-height: 1; }
    .wx-clo { font-family: var(--display); font-weight: 600; font-size: 6vh; color: var(--ink); opacity: 0.7; }
    .wx-crain { font-weight: 700; font-size: 4.6vh; color: var(--cool); }
    .wx-night { background: #000; color: #a8231b; --muted: #8a1d16; --ink: #a8231b; --card: #0d0303; --cool: #a8231b; }
    .wx-night ha-icon { color: #a8231b !important; }
    .night { background: #000; color: #a8231b; grid-template-columns: 1fr; place-items: center; cursor: pointer; }
    .night-face { display: flex; flex-direction: column; align-items: center; gap: 2vh; transition: transform 1s ease; }
    .night-time { font-family: var(--display); font-weight: 800; font-size: min(54vh, 26vw); line-height: 0.9;
                  letter-spacing: -0.03em; font-variant-numeric: tabular-nums; opacity: 0.8; }
    .night-colon { opacity: 0.45; margin: 0 0.02em; position: relative; top: -0.06em; }
    .night-date { font-family: var(--body); font-weight: 600; font-size: min(5.5vh, 26px); letter-spacing: 0.14em;
                  text-transform: uppercase; opacity: 0.5; }
    /* bedside (Echo Show 5, 960x480): the kitchen's dock on the left; photos are home, with the dock over them */
    .bedside .dock { position: relative; padding: 12px 0 12px 12px; gap: 10px; z-index: 1; }
    .bedside .dock-pill { gap: 4px; padding: 6px; border-radius: 24px; }
    .bedside .dock-btn { width: min(58px, 14.5vh); height: min(58px, 14.5vh); border-radius: 18px; }
    .bedside .dock-btn ha-icon { --mdc-icon-size: 30px; }
    .bedside .page { padding: 14px; min-width: 0; }
    .on-photo .dock-pill, .on-photo .photo-btn { background: rgba(14, 18, 28, 0.5); border-color: rgba(255, 255, 255, 0.08);
                                                 backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
    .on-photo .dock-btn { color: rgba(255, 255, 255, 0.78); }
    .on-photo .dock-btn.on { background: rgba(255, 255, 255, 0.18); color: #fff; }
    /* photos keep the dock over them on every screen; the caption sits bottom right */
    .on-photo .dock { position: relative; z-index: 1; }
    .on-photo .photo-cap { left: auto; right: 40px; text-align: right; }
    .on-photo .photo-nav { justify-content: flex-end; }
    .bedside .photo-cap { left: auto; right: 22px; bottom: 20px; text-align: right; }
    .bedside .cap-big { font-size: 22px; }
    .bedside .photo-nav { justify-content: flex-end; }
    .bedside .topright { right: 22px; }
    .bedside .topright.on-photo .clock { font-size: 68px; }
    .bedside .topright.on-photo .temp { font-size: 34px; }
    .bedside .topright.on-photo .wx { --mdc-icon-size: 32px; }
    .bed-card { padding: 16px 18px; min-height: 0; }
    .bed-card .card-title { display: flex; align-items: center; gap: 8px; }
    .bed-two { height: 100%; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; min-height: 0; }
    .bedside .media-card, .hub .media-card { flex: none; height: 100%; }
    /* the bedside and Hub media card: no bar, just - and + sharing the row as squircles,
       and a bigger speaker pill and % so they read from across the room */
    .vol.vol-pair { grid-template-columns: 1fr 1fr; gap: 12px; }
    .screen:not(.phone) .where-row .where { height: 52px; font-size: 18px; gap: 10px; }
    .screen:not(.phone) .where-row .where ha-icon { --mdc-icon-size: 24px; }
    .screen:not(.phone) .where-row .where .chev { --mdc-icon-size: 22px; }
    .screen:not(.phone) .where-vol { height: 52px; min-width: 84px; font-size: 19px; }
    .screen:not(.phone) .where-row { gap: 8px; }
    /* speaker tiles on the big screens: - [ % ] + */
    .vol.vol-pair.vol-pct { grid-template-columns: 1fr auto 1fr; gap: 8px; }
    .player .vol-pair .round.small { height: 46px; border-radius: 15px; }
    .player .vol-pair .round.small ha-icon { --mdc-icon-size: 24px; }
    .screen:not(.phone) .player .vol-pct .where-vol { height: 46px; min-width: 76px; font-size: 18px; }
    .vol-pair .round.small { width: 100%; height: 56px; border-radius: 18px; }
    .vol-pair .round.small ha-icon { --mdc-icon-size: 28px; }
    .hub-controls { grid-template-rows: 1fr 1fr; }
    .hub-players { display: flex; flex-direction: column; gap: 14px; min-height: 0; overflow-y: auto; }
    .hub-hp { display: flex; flex-direction: column; min-height: 0; }
    /* the Hub's dock: bigger targets than the tablet's compact one */
    .screen.hub { grid-template-columns: 94px 1fr; }
    .hub .dock-pill { gap: 6px; padding: 7px; border-radius: 26px; }
    .hub .dock-btn { width: 62px; height: 62px; border-radius: 20px; }
    .hub .dock-btn ha-icon { --mdc-icon-size: 30px; }
    /* the 2x2 tiles stay square (two rows of the page's height); the wide cards take what's left */
    .hub .hub-sq-left { grid-template-columns: calc(100vh - 76px) minmax(0, 1fr); }
    .hub .hub-sq-right { grid-template-columns: minmax(0, 1fr) calc(100vh - 76px); }
    .hub-stack { display: grid; grid-template-rows: minmax(0, 1fr) minmax(0, 1fr); gap: 14px; min-height: 0; }
    .hub-stack > .card { min-height: 0; overflow: hidden; }
    .hub-out { display: flex; flex-direction: column; justify-content: space-between; padding: 18px 20px; text-align: left; color: var(--ink); }
    .hub-out-row { display: flex; align-items: center; gap: 16px; }
    .hub-out-row ha-icon { --mdc-icon-size: 52px; }
    .hub-out-temp { font-family: var(--display); font-weight: 700; font-size: 58px; line-height: 1; letter-spacing: -0.02em; }
    .hub .hub-out .wx-side { margin-left: auto; }
    .hub .hub-out .wx-cond { font-size: 19px; white-space: nowrap; }
    .hub .hub-out .wx-hl { font-size: 17px; }
    .hub-hp .thermo { flex: 1; padding: 16px 18px; gap: 0; }
    .hub .hub-hp .hp-temp { font-size: 52px; }
    .hub .hub-hp .hp-mode { font-size: 17px; }
    .hub .hub-hp .hp-target { margin-top: auto; }
    .hub .hub-hp .hp-step { width: 64px; height: 52px; border-radius: 16px; }
    .hub .hub-hp .hp-set { font-size: 30px; }
    .hub .hub-hp .modes { height: 52px; gap: 10px; margin-top: 10px; }
    .hub .hub-hp .mode { font-size: 16px; border-radius: 18px; }
    .hub .hub-hp .mode ha-icon { --mdc-icon-size: 24px; }
    .scenes-sheet { width: min(560px, 90vw); }
    .hub-scenes { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
    .bed-pl { display: flex; flex-direction: column; overflow: hidden; }
    .bed-pl .pl-title { margin: 0; }
    .bed-pl .pl-row { flex: 1; height: auto; margin: 10px 0 0; padding: 0; display: grid; grid-template-columns: repeat(3, 1fr);
                      grid-auto-rows: min-content; gap: 10px; overflow-y: auto; }
    .bed-pl .pl { width: 100%; height: auto; border-radius: 16px; }
    .bed-air { height: 100%; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 14px; }
    .bed-controls { height: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .air-tile.control-tile { grid-template-columns: auto; background: var(--card); border-color: var(--card-edge); }
    .air-tile.control-tile.on { background: color-mix(in srgb, var(--c) 14%, var(--card)); border-color: transparent; }
    .air-tile.control-tile .air-ico { width: 76px; height: 76px; background: var(--inset); color: var(--muted); }
    .control-tile .air-ico ha-icon { --mdc-icon-size: 36px; }
    .air-tile.control-tile.on .air-ico { background: color-mix(in srgb, var(--c) 22%, transparent); color: var(--c); }
    .control-tile .air-q { color: var(--muted); }
    .control-tile.on .air-q { color: var(--c); }
    .air-tile { min-width: 0; min-height: 0; padding: 16px 18px; display: grid; grid-template-columns: auto 1fr;
                grid-template-rows: 1fr auto; text-align: left; color: var(--ink);
                background: color-mix(in srgb, var(--c) 14%, var(--card)); border-color: transparent; }
    .air-ico { width: 46px; height: 46px; border-radius: 50%; display: grid; place-items: center;
               background: color-mix(in srgb, var(--c) 22%, transparent); color: var(--c); }
    .air-ico ha-icon { --mdc-icon-size: 22px; }
    .air-val { justify-self: end; font-family: var(--display); font-weight: 700; font-size: min(58px, 12vh); line-height: 1;
               letter-spacing: -0.03em; }
    .air-val small { font-family: var(--body); font-size: 16px; font-weight: 600; color: var(--muted); margin-left: 2px; }
    .air-name { grid-column: 1 / -1; align-self: end; display: flex; flex-direction: column; gap: 2px; font-size: 20px; font-weight: 600; }
    .air-q { font-size: 18px; font-weight: 500; color: var(--c); }
    .bed-cal .date-card { padding: 22px; justify-content: center; }
    .bed-cal .date-top { font-size: 26px; }
    .bed-cal .date-num { flex: none; font-size: min(190px, 36vh); margin: 6px 0 0; }
    .bedside .whatson { padding: 14px 16px 4px; }
    .bedside .whatson .card-title { font-size: 20px; }
    .bedside .wo-day { font-size: 16px; }
    .bedside .wo-ev { grid-template-columns: 66px 4px 1fr; }
    .bedside .wo-time { font-size: 17px; }
    .bedside .wo-text .ev-name { font-size: 20px; }
    .bedside .wo-loc { font-size: 16px; }
    /* on the kitchen display and the computer a pop-up is a centred dialog, not a sheet from the bottom */
    .screen:not(.phone) .pop-scrim { align-items: center; padding: 24px; }
    .screen:not(.phone) .pop { padding-top: 18px; animation: pop-in 0.18s ease-out; }
    @keyframes pop-in { from { transform: scale(0.94); opacity: 0; } to { transform: none; opacity: 1; } }
    .screen:not(.phone) .grabber { display: none; }
    .grabber { width: 40px; height: 5px; border-radius: 3px; background: var(--track-strong); margin: 0 auto 8px; flex: none; }
    .pop-head { display: flex; align-items: center; gap: 12px; padding: 2px 2px 12px; flex: none; }
    .pop-ico { width: 40px; height: 40px; border-radius: 50%; background: var(--accent-soft); color: var(--accent);
               display: grid; place-items: center; }
    .pop-ico ha-icon { --mdc-icon-size: 22px; }
    .pop-title { flex: 1; min-width: 0; font-family: var(--display); font-weight: 700; font-size: 18px; letter-spacing: -0.01em;
                 white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .pop-body { overflow-y: auto; overscroll-behavior: contain; display: flex; flex-direction: column; gap: 10px;
                margin: 0 -16px; padding: 0 16px 4px; }
    .pop-sub { font-size: 13px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted);
               margin: 8px 4px 0; }
    .pop-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .ptile { display: grid; grid-template-columns: 38px 1fr; gap: 10px; align-items: center; padding: 10px 12px; min-height: 62px;
             border-radius: 20px; background: var(--inset); text-align: left; min-width: 0; }
    .ptile.wide { grid-column: 1 / -1; }
    .ptile .tile-ico { width: 38px; height: 38px; background: var(--card); }
    .ptile .tile-ico ha-icon { --mdc-icon-size: 20px; }
    .ptile .tile-name { font-size: 14px; line-height: 1.2; }
    .ptile .muted { font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ptile.on .tile-ico { background: var(--warm); color: #fff; }
    .ptile.alert { background: color-mix(in srgb, var(--warm) 16%, var(--inset)); }
    .ptile.alert .tile-ico { color: var(--warm); }
    .ptile:active { transform: scale(0.98); }
    .ptile.stepper { grid-column: 1 / -1; grid-template-columns: 38px 1fr auto; }
    /* light sheet */
    .lsheet-state { display: block; font-family: var(--body); font-size: 13px; font-weight: 600; color: var(--muted); letter-spacing: 0; }
    .lsheet-state.lit { color: var(--warm); }
    .pop-ico.lit { background: color-mix(in srgb, var(--warm) 20%, transparent); color: var(--warm); }
    .lsheet-body { gap: 4px; }
    .lsheet-main { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 4px 0 6px; }
    .split.big { --w: 104px; flex: none; height: min(250px, 31vh); margin: 0 auto; }
    .split.big .seg-ico { width: 64px; height: 64px; }
    .split.big .seg-bot ha-icon { --mdc-icon-size: 34px; }
    .split.big.lit .seg-bot { background: var(--lit-c, var(--warm)); }
    .lsheet-onoff { width: 112px; height: min(220px, 30vh); border-radius: 56px; background: var(--track); display: grid; place-items: center; }
    .lsheet-onoff ha-icon { --mdc-icon-size: 40px; opacity: 0.7; }
    .lsheet-onoff.lit { background: var(--warm); color: #fff; }
    .lsheet-onoff.lit ha-icon { opacity: 1; }
    .lsheet-power { width: 56px; height: 56px; border-radius: 50%; background: var(--inset); display: grid; place-items: center; flex: none; }
    .lsheet-power ha-icon { --mdc-icon-size: 26px; }
    .lsheet-power.on { background: var(--ink); color: var(--card); }
    .lsheet-power:active, .sw:active { transform: scale(0.94); }
    .ctbar { position: relative; height: 52px; border-radius: 18px; touch-action: none; cursor: pointer; flex: none;
             background: linear-gradient(90deg, #ffa95a, #ffd9a8 35%, #f4f1ea 60%, #cfe2ff); }
    .ct-end { position: absolute; top: 0; bottom: 0; left: 14px; display: grid; place-items: center; color: rgba(60, 40, 10, 0.55); pointer-events: none; }
    .ct-end.cool { left: auto; right: 14px; color: rgba(20, 50, 100, 0.5); }
    .ct-end ha-icon { --mdc-icon-size: 20px; }
    .ct-thumb { position: absolute; top: 6px; bottom: 6px; width: 8px; margin-left: -4px; border-radius: 4px; background: #fff;
                box-shadow: 0 0 0 2px rgba(16, 25, 46, 0.55), 0 2px 6px rgba(0, 0, 0, 0.2); pointer-events: none; }
    .swatches { display: grid; grid-template-columns: repeat(8, 1fr); gap: 8px; }
    .sw { aspect-ratio: 1; width: 100%; max-width: 52px; justify-self: center; border-radius: 50%; background: var(--c);
          box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08); }
    .sw.on { box-shadow: 0 0 0 3px var(--card), 0 0 0 5px var(--c); }
    .lsheet-side { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
    /* tablet: the pill on the left, everything else beside it */
    .lsheet.two { width: min(760px, 100%); }
    .lsheet.two .lsheet-body { display: grid; grid-template-columns: 200px 1fr; gap: 20px; align-items: start; }
    .lsheet.two .split.big { height: min(340px, 52vh); }
    .lsheet.two .lsheet-side .pop-sub:first-child { margin-top: 0; }
    .steps-btns { display: flex; gap: 8px; }
    .steps-btns .round.small { background: var(--card); }
    .choices { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .choices.compact { grid-template-columns: repeat(4, 1fr); }
    .choice { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; min-height: 66px;
              padding: 8px 4px; border-radius: 18px; background: var(--inset); font-size: 12px; font-weight: 600; text-align: center;
              line-height: 1.15; min-width: 0; }
    .choice ha-icon { --mdc-icon-size: 22px; color: var(--accent); }
    .choice.on { background: var(--accent); color: #fff; }
    .choice.on ha-icon { color: #fff; }
    .choice:active { transform: scale(0.96); }
    .pplayer { display: flex; flex-direction: column; gap: 14px; padding: 14px; border-radius: 22px; background: var(--inset); }
    .pplayer.muted-vol { background: color-mix(in srgb, #e5484d 12%, var(--inset)); }
    .pp-top { display: grid; grid-template-columns: 64px 1fr auto; gap: 12px; align-items: center; }
    .pp-top .art { width: 64px; height: 64px; background-color: var(--card); }
    .pp-ctrl { display: flex; justify-content: center; align-items: center; gap: 22px; }
    .pp-ctrl .round.play { width: 56px; height: 56px; background: var(--accent); color: #fff; }
    .pp-ctrl .round.small, .pplayer .vol .round.small, .pp-top .round.small { background: var(--card); }
    .pplayer .vol { grid-template-columns: auto 1fr auto auto; }
    .round.small.power-on { color: var(--accent); }
    .round.small.is-muted { color: #e5484d; }
    .graph { padding: 14px 14px 10px; border-radius: 22px; background: var(--inset); }
    .graph-head { display: flex; justify-content: space-between; font-size: 14px; font-weight: 600; }
    .graph-head b { font-size: 18px; }
    .graph svg { display: block; width: 100%; height: 90px; margin-top: 8px; }
    .graph-foot { display: flex; justify-content: space-between; font-size: 12px; margin-top: 6px; }
    .graph-empty { height: 90px; display: grid; place-items: center; font-size: 13px; }
    .hp-now.linked { cursor: pointer; }
    .hp-more { --mdc-icon-size: 20px; color: var(--muted); align-self: center; }
    .player-row { cursor: pointer; }

    /* native cards: each one draws a piece of the phone home in the same CSS as .ph */
    .piece { height: 100%; color: var(--ink); font-family: var(--body); user-select: none; -webkit-user-select: none; }
    .piece .ph-grid.one { display: block; height: 100%; }
    .piece .ph-grid.one > * { height: 100%; width: 100%; }
    .piece .ph-sec { height: 100%; }
    /* a card is exactly its grid cell: text stays on one line and fades out at the edge */
    .piece .tile { min-height: 0; overflow: hidden; }
    .piece .player { overflow: hidden; }
    .piece .tile-name, .piece .tile-text .muted, .piece .media-src, .piece .player-title, .piece .media-artist {
      display: block; white-space: nowrap; overflow: hidden; text-overflow: clip; }
    .piece .cut { -webkit-mask-image: linear-gradient(to right, #000 calc(100% - 18px), transparent);
                  mask-image: linear-gradient(to right, #000 calc(100% - 18px), transparent); }
    .piece .missing { display: flex; align-items: center; gap: 8px; height: 100%; min-height: 62px; padding: 0 14px;
                      font-size: 13px; color: var(--muted); }
    .screen.overlay { background: none; pointer-events: none; z-index: 20; }
    .screen.overlay::after { display: none; }
    .screen.overlay > * { pointer-events: auto; }
  `;
}

// a typed --ov-at can transition; an untyped custom property would jump
try { CSS.registerProperty({ name: "--ov-at", syntax: "<number>", inherits: true, initialValue: "50" }); } catch (e) {}
if (!customElements.get("overlook-show")) customElements.define("overlook-show", OverlookShow);

// --- native cards: the phone home as ordinary HA cards --------------------------------
// Each card draws one piece of the phone home with the same markup and CSS as the
// single-card version (.phone, .ph-grid, .ph-sec ...), so they look the same. HA's own
// editor arranges them: the edit-button card sets HA's grid to the design's sizes (62px
// rows, 10px gaps) and hides HA's header. Sheets open in one shared
// layer on <body>; pop-ups and their links come from /local/overlook-popups.json.

// last time anything on the page scrolled: a light under a scrolling finger is not a hold
let LAST_SCROLL = 0;
let PIECES = 0;   // native pieces on screen; the edit button sizes HA's grid while any are
let SCROLL_HOOKED = false;

// HA's view root (header, view container): the edit button styles it
function findHuiRoot() {
  const walk = (root, depth) => {
    if (!root || depth > 12) return null;
    const hit = root.querySelector("hui-root");
    if (hit) return hit;
    for (const el of root.querySelectorAll("*")) {
      if (el.shadowRoot) {
        const r = walk(el.shadowRoot, depth + 1);
        if (r) return r;
      }
    }
    return null;
  };
  const ha = document.querySelector("home-assistant");
  return ha ? walk(ha.shadowRoot, 0) : null;
}

let OVERLAY = null;
const overlay = (hass) => {
  if (!OVERLAY) {
    OVERLAY = document.createElement("overlook-overlay");
    document.body.appendChild(OVERLAY);
  }
  if (hass && OVERLAY.hass !== hass) OVERLAY.hass = hass;
  return OVERLAY;
};

class OverlookPiece extends OverlookShow {
  setConfig(config) {
    if (!config) throw new Error("No configuration");
    this._config = Object.assign({ phone: true, lights: [], popups: {}, links: {}, status: [], status_air: [],
                                   calendars: [], speakers: [], scenes: [], phone_rooms: [] }, config);
    this._drag = null;
  }

  get _scrolledAt() { return LAST_SCROLL; }
  get _iconToggles() { return true; }   // light tiles: icon toggles, body opens the sheet (HA's tile card)
  set _scrolledAt(v) { LAST_SCROLL = v; }

  connectedCallback() {
    LitElement.prototype.connectedCallback.call(this);
    loadFonts();
    this.style.height = "100%";   // fill the grid cell HA sizes for the card
    PIECES++;
    if (!SCROLL_HOOKED) {
      SCROLL_HOOKED = true;
      window.addEventListener("scroll", () => { LAST_SCROLL = performance.now(); }, { capture: true, passive: true });
    }
    this._relink = () => this.requestUpdate();
    window.addEventListener("overlook-popups", this._relink);
  }

  disconnectedCallback() {
    LitElement.prototype.disconnectedCallback.call(this);
    PIECES--;
    window.removeEventListener("overlook-popups", this._relink);
  }

  updated(changed) {
    this._markCut();
    if (!changed.has("hass") || !this.hass) return;
    if (this._drag) this._settle();
    overlay(this.hass);
  }

  // fade only the text that is actually cut off by the edge of its cell
  _markCut() {
    const r = this.shadowRoot;
    if (!r) return;
    for (const el of r.querySelectorAll(".tile-name, .tile-text .muted, .media-src, .player-title, .media-artist")) {
      el.classList.toggle("cut", el.scrollWidth > el.clientWidth + 1);
    }
  }

  firstUpdated() {
    // a cell changes width in edit mode or on rotating the phone
    this._ro = new ResizeObserver(() => this._markCut());
    this._ro.observe(this);
  }

  _openLight(id) { overlay(this.hass).openLight(id, this._config.name); }
  _open(id) { overlay(this.hass)._open(id); }
  _links() { return overlay()._links(); }
  getCardSize() { return 1; }
}

// the one layer every card's light sheet and pop-up opens in, above the whole app
class OverlookOverlay extends OverlookShow {
  constructor() {
    super();
    this.setConfig({ phone: true, weather: null });
    this._names = {};
    fetch(`/local/overlook-popups.json?v=${VERSION}`).then((r) => r.json()).then((j) => {
      this._config = Object.assign({}, this._config, { popups: j.popups || {}, links: j.links || {} });
      window.dispatchEvent(new Event("overlook-popups"));
    }).catch((e) => console.warn("overlook: pop-ups", e));
  }

  connectedCallback() {
    LitElement.prototype.connectedCallback.call(this);
    loadFonts();
  }

  updated(changed) {
    if (changed.has("hass") && this._drag) this._settle();
    this._lockPage(!!(this._pop || this._light));
  }

  // While a sheet is up the page behind it must not move. iOS hands any swipe the sheet
  // doesn't use to the document, so the dashboard scrolled under it. Pin the body where
  // it is (position: fixed at -scrollY) and put the scroll back when the sheet closes.
  _lockPage(on) {
    if (on === !!this._locked) return;
    const de = document.documentElement, b = document.body;
    if (on) {
      this._locked = { y: window.scrollY };
      de.style.overflow = "hidden";
      Object.assign(b.style, { position: "fixed", top: `-${this._locked.y}px`, left: "0", right: "0" });
    } else {
      const y = this._locked.y;
      this._locked = null;
      de.style.overflow = "";
      Object.assign(b.style, { position: "", top: "", left: "", right: "" });
      window.scrollTo(0, y);
    }
  }

  disconnectedCallback() { this._lockPage(false); LitElement.prototype.disconnectedCallback.call(this); }

  openLight(id, name, room = false) {
    if (name) this._names[id] = name;
    OverlookShow.prototype._openLight.call(this, id);
    this._lightRoom = room;
  }

  // HA listens for more-info on its own root, which this layer sits outside of
  _moreInfo(entityId) {
    const ha = document.querySelector("home-assistant");
    if (ha) ha.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }));
  }

  render() {
    if (!this.hass || !(this._pop || this._light)) return nothing;
    return html`
      <div class="screen phone overlay">
        ${this._pop ? this._popSheet() : nothing}
        ${this._light ? this._lightSheet() : nothing}
      </div>`;
  }
}
if (!customElements.get("overlook-overlay")) customElements.define("overlook-overlay", OverlookOverlay);

// --- HA's view root: grid sizes and the hidden header -------------------------------
// While any native piece is on screen HA's grid takes the design's sizes.
const NATIVE_GRID = `
  :host {
    --ha-section-grid-row-height: 62px;
    --ha-section-grid-row-gap: 10px;
    --ha-section-grid-column-gap: 10px;
    --ha-view-sections-row-gap: 18px;
    --ha-view-sections-narrow-column-gap: 16px;
    --lovelace-background: linear-gradient(165deg, #f4f7fd 0%, #e4ecf9 100%);
  }
  @media (prefers-color-scheme: dark) {
    :host { --lovelace-background: linear-gradient(165deg, #0b0f18 0%, #121827 100%); }
  }`;
// What shows when you scroll past the end: the gradient's last colour. The HA app paints
// that area itself from --primary-background-color, read when the frontend sends it
// "theme-update", so set the variable (and the page under it) and send one.
const PAGE_GROUND = `
  html { --primary-background-color: #e4ecf9 !important; background-color: #e4ecf9 !important; }
  @media (prefers-color-scheme: dark) {
    html { --primary-background-color: #121827 !important; background-color: #121827 !important; }
  }`;
function stylePage(css) {
  let s = document.getElementById("overlook-native-page");
  if (!css && !s) return;
  if (s && s.textContent === css) return;
  if (!css) s.remove();
  else {
    if (!s) {
      s = document.createElement("style");
      s.id = "overlook-native-page";
      document.head.appendChild(s);
    }
    s.textContent = css;
  }
  const ha = document.querySelector("home-assistant");
  const ext = ha && ha.hass && ha.hass.auth && ha.hass.auth.external;
  if (ext) ext.fireMessage({ type: "theme-update" });
}

const HIDE_HEADER = `
  .header { display: none !important; }
  hui-view-container { padding-top: var(--safe-area-inset-top, 0px) !important; }`;
// one style element in HA's view root; css "" removes it
function styleHuiRoot(r, css) {
  if (!r || !r.shadowRoot) return;
  let s = r.shadowRoot.getElementById("overlook-native");
  if (!css) { if (s) s.remove(); return; }
  if (!s) {
    s = document.createElement("style");
    s.id = "overlook-native";
    r.shadowRoot.appendChild(s);
  }
  if (s.textContent !== css) s.textContent = css;
}

// Hides HA's header, and puts an "Edit dashboard" button where the card sits (the bottom
// of the page). The header comes back while editing. On a dashboard of native pieces
// (ha-show-native) it also gives HA's grid the design's sizes.
class OverlookEditButton extends LitElement {
  static get properties() { return { hass: { attribute: false }, editMode: { type: Boolean } }; }
  static getConfigForm() { return { schema: [] }; }
  static getStubConfig() { return {}; }
  setConfig() {}
  getCardSize() { return 1; }
  getGridOptions() { return { columns: "full", rows: "auto" }; }

  connectedCallback() {
    super.connectedCallback();
    this._tick = setInterval(() => this._sync(), 400);
    this._sync();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this._tick);
    styleHuiRoot(this._root, "");
    stylePage("");
  }

  _sync() {
    const r = this._root && this._root.isConnected ? this._root : findHuiRoot();
    if (r !== this._root) { styleHuiRoot(this._root, ""); this._root = r; }
    const edit = !!(r && r.lovelace && r.lovelace.editMode);
    styleHuiRoot(r, (PIECES ? NATIVE_GRID : "") + (edit ? "" : HIDE_HEADER));
    stylePage(PIECES ? PAGE_GROUND : "");
  }

  _edit() {
    const lv = this._root && this._root.lovelace;
    if (!lv || !lv.setEditMode) return;
    fireHaptic("medium");
    lv.setEditMode(true);
  }

  render() {
    if (this.editMode) {
      return html`<div class="note"><ha-icon icon="mdi:pencil-off-outline"></ha-icon>
        Edit button: hides HA's header on this dashboard</div>`;
    }
    return html`<button @click=${() => this._edit()}><ha-icon icon="mdi:pencil-outline"></ha-icon>Edit dashboard</button>`;
  }

  static styles = css`
    :host { display: flex; justify-content: center; padding: 4px 0 calc(env(safe-area-inset-bottom, 0px) + 8px); }
    button { display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; border: 0; border-radius: 999px;
             font: inherit; font-size: 14px; font-weight: 500; cursor: pointer; color: var(--secondary-text-color);
             background: var(--ha-card-background, var(--card-background-color));
             box-shadow: var(--ha-card-box-shadow, none); -webkit-tap-highlight-color: transparent; }
    button:active { transform: scale(0.97); }
    ha-icon { --mdc-icon-size: 18px; }
    .note { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--secondary-text-color); padding: 10px; }
  `;
}
if (!customElements.get("overlook-edit-button")) customElements.define("overlook-edit-button", OverlookEditButton);

const TILE_KINDS = [["light", "Light"], ["switch", "Switch"], ["media", "Speaker / TV"], ["climate", "Heat pump"],
  ["plant", "Plant"], ["sensor", "Reading"], ["scene", "Scene / script"]];

// one entity, drawn the way its kind is drawn on the phone (picked from the domain)
class OverlookTile extends OverlookPiece {
  static getConfigForm() {
    return {
      schema: [
        { name: "entity", required: true, selector: { entity: {} } },
        { type: "grid", name: "", schema: [
          { name: "name", selector: { text: {} } },
          { name: "icon", selector: { icon: {} }, context: { icon_entity: "entity" } },
        ] },
        { name: "kind", selector: { select: { mode: "dropdown", options: TILE_KINDS.map(([value, label]) => ({ value, label })) } } },
      ],
      computeLabel: (s) => ({ entity: "Entity", name: "Name", icon: "Icon", kind: "Show as (blank = from the entity)" })[s.name],
    };
  }

  static getStubConfig(hass) {
    const id = Object.keys(hass.states).find((e) => e.startsWith("light.")) || Object.keys(hass.states)[0];
    return { entity: id };
  }

  _kind() {
    const c = this._config, e = this._st(c.entity);
    if (c.kind) return c.kind;
    const dom = (c.entity || "").split(".")[0];
    if (dom === "sensor" && e && e.attributes.device_class === "moisture") return "plant";
    return DOMAIN_TYPE[dom] || "sensor";
  }

  _item() {
    const c = this._config, e = this._st(c.entity);
    return { entity: c.entity, name: c.name || (e && e.attributes.friendly_name) || c.entity,
             icon: c.icon || (e && (e.attributes.icon || CLASS_ICON[e.attributes.device_class])) || TYPE_ICON[this._kind()] };
  }

  // the design's sizes: a tile is one 62px row, a player two, the heat pump the full width
  getGridOptions() {
    switch (this._kind()) {
      case "climate": return { columns: 12, rows: "auto", min_columns: 12 };
      case "media": return { columns: 6, rows: 2, min_columns: 6, min_rows: 2 };
      default: return { columns: 6, rows: 1, min_columns: 3, min_rows: 1 };
    }
  }

  render() {
    if (!this.hass || !this._config) return nothing;
    const x = this._item();
    if (!this._st(x.entity)) {
      return html`<div class="phone piece"><div class="card missing"><ha-icon icon="mdi:help-circle-outline"></ha-icon>
        ${x.entity || "Pick an entity"} isn't there</div></div>`;
    }
    let body;
    switch (this._kind()) {
      case "climate": body = html`<div class="card ph-hp">${this._thermostat(x.entity)}</div>`; break;
      case "media": body = this._player(x); break;
      case "plant": body = this._plantTile(x); break;
      case "switch": body = this._switchTile(x); break;
      case "sensor": body = this._sensorTile(x); break;
      case "scene": body = this._sceneBtn(x, true); break;
      default: body = this._lightTile(x);
    }
    return html`<div class="phone piece"><div class="ph-grid one">${body}</div></div>`;
  }
}
if (!customElements.get("overlook-tile")) customElements.define("overlook-tile", OverlookTile);

// a room's heading, with its all-lights button
class OverlookHeading extends OverlookPiece {
  static getConfigForm() {
    return {
      schema: [
        { type: "grid", name: "", schema: [
          { name: "name", required: true, selector: { text: {} } },
          { name: "icon", selector: { icon: {} } },
        ] },
        { name: "group", selector: { entity: { domain: "light" } } },
      ],
      computeLabel: (s) => ({ name: "Name", icon: "Icon", group: "All-lights button (a light group)" })[s.name],
    };
  }

  static getStubConfig() { return { name: "Room", icon: "mdi:sofa" }; }

  getGridOptions() { return { columns: "full", rows: "auto" }; }

  render() {
    if (!this.hass || !this._config) return nothing;
    const c = this._config, g = this._st(c.group), lit = g && g.state === "on";
    // tap: the room's lights on/off; hold: one brightness slider for the whole room
    const h = this._tapHold(`room:${c.group}`, () => this._call("light", lit ? "turn_off" : "turn_on", { entity_id: c.group }),
      () => overlay(this.hass).openLight(c.group, c.name, true));
    return html`
      <div class="phone piece"><div class="ph-sec">
        <ha-icon icon=${c.icon || "mdi:door"}></ha-icon><span>${c.name}</span>
        ${g ? html`<button class="ph-group ${lit ? "on" : ""}" title="All lights"
            @pointerdown=${h.down} @pointermove=${h.move} @pointerup=${h.up} @pointerleave=${h.up} @pointercancel=${h.up}
            @click=${h.click}>
            <ha-icon icon="mdi:lightbulb-group"></ha-icon></button>` : nothing}
      </div></div>`;
  }
}
if (!customElements.get("overlook-heading")) customElements.define("overlook-heading", OverlookHeading);

// the Scenes row: round-icon squares that scroll sideways
class OverlookScenes extends OverlookPiece {
  static getConfigForm() {
    return {
      schema: [{ name: "scenes", selector: { object: {} } }],
      computeLabel: () => "Scenes (entity, and optionally name and icon, for each)",
    };
  }

  static getStubConfig(hass) {
    return { scenes: Object.keys(hass.states).filter((e) => e.startsWith("scene.")).slice(0, 4).map((entity) => ({ entity })) };
  }

  getGridOptions() { return { columns: "full", rows: "auto" }; }

  render() {
    if (!this.hass || !this._config) return nothing;
    const items = (this._config.scenes || []).map((x) => {
      const c = typeof x === "string" ? { entity: x } : x, e = this._st(c.entity);
      return { ...c, name: c.name || (e && e.attributes.friendly_name) || c.entity,
               icon: c.icon || (e && e.attributes.icon) || DOMAIN_ICON[(c.entity || "").split(".")[0]] || "mdi:palette" };
    });
    return html`<div class="phone piece"><div class="fav-scenes">${items.map((x) => this._miniScene(x))}</div></div>`;
  }
}
if (!customElements.get("overlook-scenes")) customElements.define("overlook-scenes", OverlookScenes);

// who's home, what needs a look, and the house's readings (low-high across the rooms)
class OverlookStatus extends OverlookPiece {
  static getConfigForm() {
    return {
      schema: [
        { name: "status", selector: { object: {} } },
        { name: "status_air", selector: { object: {} } },
      ],
      computeLabel: (s) => ({ status: "Pills (people always; the rest only while on)",
                              status_air: "Readings (each with its sources)" })[s.name],
    };
  }

  static getStubConfig() { return { status: [], status_air: [] }; }

  getGridOptions() { return { columns: "full", rows: "auto" }; }

  render() {
    if (!this.hass || !this._config) return nothing;
    return html`<div class="phone piece">${this._status()}</div>`;
  }
}
if (!customElements.get("overlook-status")) customElements.define("overlook-status", OverlookStatus);

window.customCards = window.customCards || [];
window.customCards.push(
  { type: "overlook-tile", name: "Overlook tile", description: "One light, switch, speaker, heat pump, plant, reading or scene", preview: true },
  { type: "overlook-heading", name: "Overlook room heading", description: "A room's name with its all-lights button", preview: true },
  { type: "overlook-scenes", name: "Overlook scenes", description: "The row of scene buttons" },
  { type: "overlook-status", name: "Overlook status", description: "People, alerts and the house readings" },
  { type: "overlook-edit-button", name: "Overlook edit button", description: "Hides HA's header; an Edit dashboard button at the bottom" },
);

window.customCards = window.customCards || [];
window.customCards.push({ type: "overlook-show", name: "Overlook Show", description: "Full-screen kitchen display" });
console.info(`%c overlook-show ${VERSION} `, "background:#1d5cf0;color:#fff;border-radius:4px");
