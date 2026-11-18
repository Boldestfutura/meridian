// meridian-weather: a full weather page in the iOS Weather layout, drawn in Meridian's glass panels.
//
// Top to bottom: place, big temperature and condition; Bureau of Meteorology warnings; next-hour
// rain (Pirate Weather minutely, sensor.rain_next_hour); the next 24 hours with Conditions / Rain /
// Wind tabs and sunrise and sunset dropped in; the coming days with temperature range bars; an
// animated rain radar (RainViewer radar on Esri's dark grey map, its labels on top); and tiles for UV, sunrise and sunset,
// feels like, wind, rain, humidity, pressure and the moon.
//
// Data: the BoM integration (bremor/bureau_of_meteorology) for the forecast, observations, UV and
// warnings, met.no's weather.forecast_home for pressure. Every entity can be changed in the config.
//
// Away from home: when the person signed in to HA is more than AWAY_KM from zone.home (their
// phone's GPS, from the companion app), the page shows Open-Meteo's forecast for where they are
// instead, named from the phone's geocoded-location sensor. No warnings or next-hour rain there
// (those are BoM and Pirate Weather, fixed on home).
import { LitElement, html, css, svg, nothing } from "./lit-all.min.js";

const DEFAULTS = {
  name: "South Melbourne",
  weather: "weather.outdoor_south_melbourne",             // daily forecast + current condition
  hourly: "weather.outdoor_south_melbourne_hourly",
  detail: "weather.forecast_home",                        // pressure (met.no)
  forecast: "bom_south_melbourne",                        // sensor.<forecast>_<kind>_0
  observations: "bom_olympic_park",                       // sensor.<observations>_<kind>
  warnings: "sensor.bom_south_melbourne_warnings",
  rain: "sensor.rain_next_hour",
  latitude: -37.83, longitude: 144.953,
};

const AWAY_KM = 50;

// Open-Meteo's WMO weather codes as HA conditions
const WMO = (c) => c === 0 ? "sunny" : c <= 2 ? "partlycloudy" : c === 3 ? "cloudy" : c <= 48 ? "fog"
  : [65, 82].includes(c) ? "pouring" : [66, 67].includes(c) ? "snowy-rainy" : (c >= 71 && c <= 77) || c === 85 || c === 86 ? "snowy"
  : c >= 95 ? "lightning-rainy" : c >= 51 ? "rainy" : "cloudy";
const kmBetween = (a, b, c, d) => {
  const r = Math.PI / 180, x = Math.sin((c - a) * r / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin((d - b) * r / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(x));
};
const uvWord = (u) => u == null ? "" : u < 3 ? "Low" : u < 6 ? "Moderate" : u < 8 ? "High" : u < 11 ? "Very High" : "Extreme";

const LABEL = {
  "sunny": "Sunny", "clear-night": "Clear", "partlycloudy": "Partly cloudy", "cloudy": "Cloudy", "fog": "Fog",
  "rainy": "Showers", "pouring": "Heavy rain", "lightning": "Thunderstorms", "lightning-rainy": "Storms",
  "snowy": "Snow", "snowy-rainy": "Sleet", "hail": "Hail", "windy": "Windy", "windy-variant": "Windy", "exceptional": "Severe weather",
};
const ICONS = new Set(Object.keys(LABEL));
const POINTS = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
const bearing = (b) => typeof b === "number" ? b : POINTS.indexOf(String(b || "").toUpperCase()) * 22.5;
const DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const LONG_DAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const hourLabel = (d) => `${d.getHours() % 12 || 12}${d.getHours() < 12 ? "am" : "pm"}`;
const clock = (d) => `${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")} ${d.getHours() < 12 ? "am" : "pm"}`;
const num = (v) => { const n = parseFloat(v); return isFinite(n) ? n : null; };
const round = (v) => v == null ? "–" : Math.round(v);

// temperature to colour for the range bars, cold blue through to hot red
function tempColour(t) {
  const stops = [[0, [94, 148, 255]], [10, [92, 200, 235]], [17, [120, 214, 160]], [23, [250, 210, 90]], [30, [255, 150, 60]], [38, [240, 70, 60]]];
  if (t <= stops[0][0]) return `rgb(${stops[0][1]})`;
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const [a, ca] = stops[i - 1], [b, cb] = stops[i], k = (t - a) / (b - a);
      return `rgb(${ca.map((c, j) => Math.round(c + (cb[j] - c) * k))})`;
    }
  }
  return `rgb(${stops[stops.length - 1][1]})`;
}

// the moon: phase 0..1 from a known new moon, and its name
function moon(d = new Date()) {
  const p = (((d.getTime() / 864e5 + 2440587.5 - 2451550.1) / 29.530588853) % 1 + 1) % 1;
  // the quarters and new/full are moments, so they only get a day either side
  const name = p < 0.034 || p > 0.966 ? "New moon" : p < 0.216 ? "Waxing crescent" : p < 0.284 ? "First quarter" : p < 0.466 ? "Waxing gibbous"
    : p < 0.534 ? "Full moon" : p < 0.716 ? "Waning gibbous" : p < 0.784 ? "Last quarter" : "Waning crescent";
  return { phase: p, name, lit: Math.round((1 - Math.cos(p * 2 * Math.PI)) / 2 * 100) };
}

// Web Mercator: world pixel position at zoom z
const worldPx = (lat, lon, z) => {
  const n = 256 * 2 ** z, s = Math.sin(lat * Math.PI / 180);
  return [(lon + 180) / 360 * n, (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n];
};

export class MeridianWeather extends LitElement {
  static get properties() {
    return { hass: { attribute: false }, _homeD: { state: true }, _homeH: { state: true }, _tab: { state: true },
             _frames: { state: true }, _frame: { state: true }, _away: { state: true } };
  }
  static getStubConfig() { return {}; }
  setConfig(c) { this._config = Object.assign({}, DEFAULTS, c || {}); this._tab = this._tab || "conditions"; }
  getCardSize() { return 30; }
  getGridOptions() { return { columns: "full", rows: "auto" }; }

  connectedCallback() {
    super.connectedCallback();
    this._radar();
    this._radarTimer = setInterval(() => this._radar(), 10 * 60e3);
    this._tick = setInterval(() => this.requestUpdate(), 60e3);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    for (const u of [this._unsubD, this._unsubH]) if (u) u.then((f) => f()).catch(() => {});
    this._unsubD = this._unsubH = null;
    clearInterval(this._radarTimer); clearInterval(this._tick); clearInterval(this._anim);
  }
  updated() {
    if (!this.hass || this._unsubD) return;
    const sub = (type, entity, set) => this.hass.connection.subscribeMessage((m) => set(m.forecast || []),
      { type: "weather/subscribe_forecast", forecast_type: type, entity_id: entity });
    this._unsubD = sub("daily", this._config.weather, (f) => { this._homeD = f; });
    this._unsubH = sub("hourly", this._config.hourly, (f) => { this._homeH = f; });
  }

  // ---- away from home: Open-Meteo for wherever the viewer's phone is --------------------------
  willUpdate(changed) {
    if (changed.has("hass") && this.hass) this._where();
  }
  _where() {
    const h = this.hass, me = h.user && Object.values(h.states).find((s) => s.entity_id.startsWith("person.") && s.attributes.user_id === h.user.id);
    const home = h.states["zone.home"], a = me && me.attributes, z = home && home.attributes;
    const far = a && z && a.latitude != null && z.latitude != null && kmBetween(a.latitude, a.longitude, z.latitude, z.longitude) > AWAY_KM;
    if (!far) { if (this._away) this._away = null; this._awayAt = null; return; }
    // refetch after 15 minutes, or once they've moved 10 km
    const last = this._awayAt;
    if (last && Date.now() - last.t < 15 * 60e3 && kmBetween(last.lat, last.lon, a.latitude, a.longitude) < 10) return;
    this._awayAt = { t: Date.now(), lat: a.latitude, lon: a.longitude };
    const geo = a.source && h.states[`sensor.${a.source.split(".")[1]}_geocoded_location`];
    const ga = geo ? geo.attributes : {};
    const name = ga.Locality || ga["Sub Administrative Area"] || ga["Administrative Area"] || ga.Country || "Current location";
    this._openMeteo(a.latitude, a.longitude, name).catch(() => { this._awayAt = null; });
  }
  async _openMeteo(lat, lon, name) {
    const q = new URLSearchParams({ latitude: lat.toFixed(3), longitude: lon.toFixed(3), timezone: "auto", forecast_days: 8, wind_speed_unit: "kmh",
      current: "temperature_2m,apparent_temperature,relative_humidity_2m,dew_point_2m,weather_code,wind_speed_10m,wind_gusts_10m,wind_direction_10m,surface_pressure,precipitation",
      hourly: "temperature_2m,weather_code,precipitation_probability,precipitation,wind_speed_10m,wind_gusts_10m,wind_direction_10m",
      daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,sunrise,sunset,uv_index_max" });
    const r = await (await fetch("https://api.open-meteo.com/v1/forecast?" + q)).json();
    const c = r.current, H = r.hourly, D = r.daily, cfg = this._config;
    const POINTS16 = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    const st = (state, attributes = {}) => ({ state: state == null ? "unknown" : String(state), attributes });
    const obs = (k, v) => [`sensor.${cfg.observations}_${k}`, st(v)];
    const fc = (k, v) => [`sensor.${cfg.forecast}_${k}_0`, st(v)];
    const uv = D.uv_index_max[0];
    const states = Object.fromEntries([
      [cfg.weather, st(WMO(c.weather_code), { temperature: c.temperature_2m })],
      [cfg.detail, st("", { pressure: c.surface_pressure })],
      obs("temp", c.temperature_2m), obs("temp_feels_like", c.apparent_temperature), obs("humidity", c.relative_humidity_2m),
      obs("dew_point", c.dew_point_2m), obs("wind_speed_kilometre", c.wind_speed_10m), obs("gust_speed_kilometre", c.wind_gusts_10m),
      [`sensor.${cfg.observations}_wind_direction`, st(POINTS16[Math.round(c.wind_direction_10m / 22.5) % 16])],
      fc("astronomical_sunrise_time", D.sunrise[0]), fc("astronomical_sunset_time", D.sunset[0]),
      fc("uv_max_index", uv == null ? null : Math.round(uv)), fc("uv_category", uvWord(uv)),
      fc("rain_chance", D.precipitation_probability_max[0]), obs("rain_since_9am", D.precipitation_sum[0]),
    ]);
    this._away = { name, lat, lon, states,
      hourly: H.time.map((t, i) => ({ datetime: t, condition: WMO(H.weather_code[i]), temperature: H.temperature_2m[i],
        precipitation_probability: H.precipitation_probability[i], precipitation: H.precipitation[i],
        wind_speed: H.wind_speed_10m[i], wind_gust_speed: H.wind_gusts_10m[i], wind_bearing: H.wind_direction_10m[i] })),
      daily: D.time.map((t, i) => ({ datetime: t + "T00:00", condition: WMO(D.weather_code[i]), temperature: D.temperature_2m_max[i],
        templow: D.temperature_2m_min[i], precipitation_probability: D.precipitation_probability_max[i], precipitation: D.precipitation_sum[i] })) };
  }
  get _daily() { return this._away ? this._away.daily : this._homeD; }
  get _hourly() { return this._away ? this._away.hourly : this._homeH; }
  _lat() { return this._away ? this._away.lat : this._config.latitude; }
  _lon() { return this._away ? this._away.lon : this._config.longitude; }

  // away, only Open-Meteo's made-up states count: nothing of home's leaks in
  _st(id) { return this._away ? this._away.states[id] : this.hass && this.hass.states[id]; }
  _v(id) { const s = this._st(id); return s ? num(s.state) : null; }
  _obs(k) { return this._v(`sensor.${this._config.observations}_${k}`); }
  _fc(k) { const s = this._st(`sensor.${this._config.forecast}_${k}_0`); return s && !["unknown", "unavailable"].includes(s.state) ? s.state : null; }
  _sun() {
    const t = (k) => { const v = this._fc(`astronomical_${k}_time`); return v ? new Date(v) : null; };
    return { rise: t("sunrise"), set: t("sunset") };
  }
  _night(d = new Date()) {
    const { rise, set } = this._sun();
    if (!rise || !set) return (this._st("sun.sun") || {}).state === "below_horizon";
    const m = d.getHours() * 60 + d.getMinutes();
    return m < rise.getHours() * 60 + rise.getMinutes() || m > set.getHours() * 60 + set.getMinutes();
  }
  _icon(cond, night) {
    let c = ICONS.has(cond) ? cond : "cloudy";
    if (night && c === "sunny") c = "clear-night";
    return `/local/weather/${c}.svg`;
  }

  // ---- radar ---------------------------------------------------------------------------------
  async _radar() {
    try {
      const r = await (await fetch("https://api.rainviewer.com/public/weather-maps.json")).json();
      this._host = r.host;
      this._frames = (r.radar && r.radar.past || []).slice(-10);
      this._frame = this._frames.length - 1;
      clearInterval(this._anim);
      let hold = 0;
      this._anim = setInterval(() => {
        if (!this._frames || !this._frames.length) return;
        if (this._frame === this._frames.length - 1 && hold++ < 3) return;   // linger on the latest
        hold = 0;
        this._frame = (this._frame + 1) % this._frames.length;
      }, 600);
    } catch (e) { this._frames = []; }
  }

  // RainViewer's free tiles draw the faintest returns in beige; repaint those as Apple's pale blue.
  // Tiles come back as data URLs once recoloured (the original is shown until then).
  _tint(url) {
    this._tints = this._tints || new Map();
    const done = this._tints.get(url);
    if (done) return done === true ? url : done;
    this._tints.set(url, true);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const cv = document.createElement("canvas"); cv.width = img.width; cv.height = img.height;
        const cx = cv.getContext("2d"); cx.drawImage(img, 0, 0);
        const d = cx.getImageData(0, 0, cv.width, cv.height), px = d.data;
        for (let i = 0; i < px.length; i += 4) {
          const [r, g, b] = [px[i], px[i + 1], px[i + 2]];
          if (px[i + 3] && r > b + 20 && g > b + 8 && Math.abs(r - g) < 40) {
            px[i] = 150; px[i + 1] = 200; px[i + 2] = 255; px[i + 3] = Math.round(px[i + 3] * 0.55);
          }
        }
        cx.putImageData(d, 0, 0);
        this._tints.set(url, cv.toDataURL());
        if (this._tints.size > 400) this._tints.delete(this._tints.keys().next().value);
        this.requestUpdate();
      } catch (e) { /* leave the original */ }
    };
    img.src = url;
    return url;
  }

  _map() {
    const c = this._config, Z = 8;
    const [px, py] = worldPx(this._lat(), this._lon(), Z);
    const tx = Math.floor(px / 256), ty = Math.floor(py / 256), x0 = tx - 2, y0 = ty - 1;
    const base = [], labels = [], esri = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_";
    for (let x = x0; x <= tx + 2; x++) for (let y = y0; y <= ty + 1; y++) {
      const at = `left:${(x - x0) * 256}px;top:${(y - y0) * 256}px`;
      base.push(html`<img src="${esri}Base/MapServer/tile/${Z}/${y}/${x}" style=${at} alt="">`);
      labels.push(html`<img class="lbl" src="${esri}Reference/MapServer/tile/${Z}/${y}/${x}" style=${at} alt="">`);
    }
    const radar = [];
    if (this._frames && this._host) {
      // RainViewer serves zoom 7 at most: each of its tiles covers four of the map's
      const X0 = Math.floor(x0 / 2), Y0 = Math.floor(y0 / 2);
      this._frames.forEach((f, i) => {
        for (let X = X0; X <= Math.floor((tx + 2) / 2); X++) for (let Y = Y0; Y <= Math.floor((ty + 1) / 2); Y++)
          radar.push(html`<img class="rad ${i === this._frame ? "on" : ""}" src="${this._tint(`${this._host}${f.path}/256/7/${X}/${Y}/2/1_1.png`)}"
            style="left:${X * 512 - x0 * 256}px;top:${Y * 512 - y0 * 256}px" alt="">`);
      });
    }
    const f = this._frames && this._frames[this._frame];
    return html`<div class="panel map">
      <div class="lab"><ha-icon icon="mdi:radar"></ha-icon>Rain radar</div>
      <div class="mapbox">
        <div class="tiles" style="transform:translate(${-(px - x0 * 256)}px, ${-(py - y0 * 256)}px)">${base}${radar}${labels}</div>
        <div class="home"></div>
        ${f ? html`<div class="stamp">${clock(new Date(f.time * 1000))}</div>` : nothing}
        <div class="credit">Esri, HERE, Garmin · RainViewer</div>
      </div></div>`;
  }

  // ---- sections ------------------------------------------------------------------------------
  _hero(cond, night) {
    const temp = this._obs("temp") ?? (this._st(this._config.weather) || { attributes: {} }).attributes.temperature;
    const today = (this._daily || [])[0] || {};
    const hi = Math.max(...[today.temperature, this._obs("max_temp")].filter((v) => v != null));
    const lo = Math.min(...[today.templow, this._obs("min_temp")].filter((v) => v != null));
    const short = this._fc("short_text");
    return html`<header>
      <div class="here"><ha-icon icon="mdi:navigation-variant"></ha-icon>${this._away ? "My location" : "Home"}</div>
      <h1>${this._away ? this._away.name : this._config.name}</h1>
      <div class="big">${round(temp)}°</div>
      <div class="cond">${short ? short.replace(/\.$/, "") : LABEL[cond] || ""}</div>
      <div class="hl">H:${isFinite(hi) ? round(hi) : "–"}°  L:${isFinite(lo) ? round(lo) : "–"}°  ·  Feels like ${round(this._obs("temp_feels_like"))}°</div>
    </header>`;
  }

  _warnings() {
    const s = this._st(this._config.warnings), list = (s && s.attributes.warnings) || [];
    return list.map((w) => {
      const prod = String(w.id || "").split("_").pop();
      const until = w.expiry_time ? new Date(w.expiry_time) : null;
      const major = w.warning_group_type === "major";
      return html`<a class="panel warn ${major ? "major" : ""}" href="https://www.bom.gov.au/products/${prod}.shtml" target="_blank" rel="noreferrer">
        <div class="wt"><ha-icon icon="mdi:alert"></ha-icon>${w.short_title || w.title}</div>
        <div class="wd">${w.title}${until ? html` Until ${DAY[until.getDay()]} ${clock(until)}.` : nothing}</div>
        <div class="src">Bureau of Meteorology</div></a>`;
    });
  }

  _nextHour() {
    const s = this._st(this._config.rain);
    const pts = ((s && s.attributes.data) || []).slice(0, 60);
    if (!pts.length) return nothing;
    const wet = pts.some((p) => p.precipProbability >= 0.15 && p.precipIntensity >= 0.05);
    if (!wet) return html`<div class="panel slim"><ha-icon icon="mdi:weather-cloudy-clock"></ha-icon>No rain expected in the next hour</div>`;
    const h = (i) => i <= 0 ? 0 : i <= 0.5 ? i / 0.5 / 3 : i <= 4 ? 1 / 3 + (i - 0.5) / 3.5 / 3 : 2 / 3 + Math.min(1, (i - 4) / 12) / 3;
    const top = Math.max(...pts.map((p) => p.precipProbability));
    return html`<div class="panel">
      <div class="nh-title">${(s.state || "Rain").replace(/\.$/, "")}</div>
      <div class="nh-sub">Up to ${Math.round(top * 100)}% chance in the next hour</div>
      <div class="nh">
        <i class="g" style="bottom:33.3%"></i><i class="g" style="bottom:66.6%"></i>
        ${pts.map((p) => html`<b style="height:${Math.max(2, h(p.precipIntensity) * 100)}%;opacity:${0.35 + 0.65 * p.precipProbability}"></b>`)}
      </div>
      <div class="ticks">${["Now", "10m", "20m", "30m", "40m", "50m"].map((t) => html`<span>${t}</span>`)}</div>
    </div>`;
  }

  _hours() {
    const now = Date.now(), list = (this._hourly || []).filter((f) => Date.parse(f.datetime) > now - 3600e3).slice(0, 24);
    if (!list.length) return nothing;
    const { rise, set } = this._sun(), items = [];
    list.forEach((f, i) => {
      const d = new Date(f.datetime);
      items.push({ kind: "h", f, d, label: i === 0 ? "Now" : hourLabel(d) });
      for (const [t, what] of [[rise, "Sunrise"], [set, "Sunset"]])
        for (const x of t ? [t, new Date(t.getTime() + 864e5)] : [])
          if (x > d && x <= new Date(d.getTime() + 3600e3) && x > now) items.push({ kind: "s", d: x, what });
    });
    const tab = this._tab, nowT = this._obs("temp");
    const tabs = [["conditions", "mdi:weather-partly-cloudy", "Conditions"], ["rain", "mdi:water", "Rain"], ["wind", "mdi:weather-windy", "Wind"]];
    return html`<div class="panel">
      <div class="hrhead">
        <div><div class="lab big">${tabs.find((t) => t[0] === tab)[2]}</div>
          <div class="hint">${tab === "rain" ? "Chance and amount" : tab === "wind" ? "Speed and gusts (km/h)" : "Temperature (°C)"}</div></div>
        <div class="seg">${tabs.map(([k, ic]) => html`<button class=${tab === k ? "on" : ""} @click=${() => { this._tab = k; }}><ha-icon icon=${ic}></ha-icon></button>`)}</div>
      </div>
      <div class="hours">${items.map((it, i) => {
        if (it.kind === "s") return html`<div class="hr sun"><span>${clock(it.d).replace(" ", "")}</span>
          <img src=${it.what === "Sunset" ? "/local/weather/partlycloudy.svg" : "/local/weather/sunny.svg"} alt=""><b>${it.what}</b></div>`;
        const f = it.f, p = f.precipitation_probability || 0;
        if (tab === "rain") return html`<div class="hr"><span>${it.label}</span>
          <div class="rbar"><i style="height:${p}%"></i></div><b class="blue">${p}%</b><small>${f.precipitation || 0} mm</small></div>`;
        if (tab === "wind") return html`<div class="hr"><span>${it.label}</span>
          <ha-icon class="arrow" icon="mdi:navigation" style="transform:rotate(${bearing(f.wind_bearing) + 180}deg)"></ha-icon>
          <b>${round(f.wind_speed)}</b><small>${f.wind_gust_speed ? `gust ${round(f.wind_gust_speed)}` : ""}</small></div>`;
        return html`<div class="hr"><span>${it.label}</span>
          <img src=${this._icon(f.condition, this._night(it.d))} alt="">
          <small class="blue">${p >= 20 ? `${p}%` : ""}</small><b>${round(i === 0 && nowT != null ? nowT : f.temperature)}°</b></div>`;
      })}</div></div>`;
  }

  _days() {
    const list = (this._daily || []).slice(0, 8);
    if (!list.length) return nothing;
    const obs = [this._obs("min_temp"), this._obs("max_temp")].filter((v) => v != null);
    const lo = Math.min(...list.map((f) => f.templow ?? f.temperature), ...obs), hi = Math.max(...list.map((f) => f.temperature), ...obs);
    const span = Math.max(1, hi - lo), nowT = this._obs("temp");
    return html`<div class="panel">
      <div class="lab"><ha-icon icon="mdi:calendar-month"></ha-icon>${list.length}-day forecast</div>
      ${list.map((f, i) => {
        // today: the forecast's low is often tonight's, so take what's already been observed into account
        const d = new Date(f.datetime);
        const a = i === 0 ? Math.min(...[f.templow ?? f.temperature, this._obs("min_temp")].filter((v) => v != null)) : f.templow ?? f.temperature;
        const b = i === 0 ? Math.max(...[f.temperature, this._obs("max_temp")].filter((v) => v != null)) : f.temperature;
        const l = (a - lo) / span * 100, w = Math.max(4, (b - a) / span * 100), p = f.precipitation_probability || 0;
        const dot = i === 0 && nowT != null ? Math.min(100, Math.max(0, (nowT - lo) / span * 100)) : null;
        return html`<div class="day">
          <span class="dn">${i === 0 ? "Today" : DAY[d.getDay()]}</span>
          <span class="di"><img src=${this._icon(f.condition, false)} alt="">${p >= 20 ? html`<small class="blue">${p}%</small>` : nothing}</span>
          <span class="lo">${round(a)}°</span>
          <span class="range"><i style="left:${l}%;width:${w}%;background:linear-gradient(90deg, ${tempColour(a)}, ${tempColour(b)})"></i>
            ${dot != null ? html`<u style="left:${dot}%"></u>` : nothing}</span>
          <span class="hi">${round(b)}°</span></div>`;
      })}</div>`;
  }

  _tiles() {
    const uv = num(this._fc("uv_max_index")), uvCat = this._fc("uv_category");
    const uvS = this._fc("uv_start_time"), uvE = this._fc("uv_end_time");
    const { rise, set } = this._sun(), now = new Date();
    const nextSet = set && set > now, next = nextSet ? set : rise ? new Date(rise.getTime() + (rise < now ? 864e5 : 0)) : null;
    const feels = this._obs("temp_feels_like"), temp = this._obs("temp");
    const wind = this._obs("wind_speed_kilometre"), gust = this._obs("gust_speed_kilometre");
    const dirS = this._st(`sensor.${this._config.observations}_wind_direction`), dir = dirS ? dirS.state : "";
    const hum = this._obs("humidity"), dew = this._obs("dew_point");
    const det = (this._st(this._config.detail) || { attributes: {} }).attributes, pres = num(det.pressure);
    const rain9 = this._obs("rain_since_9am"), range = this._fc("rain_amount_range"), chance = this._fc("rain_chance");
    const m = moon(), fire = this._fc("fire_danger");
    // the sun's path through today, and where it is now
    const dayFrac = (d) => (d.getHours() * 60 + d.getMinutes()) / 1440;
    const r0 = rise ? dayFrac(rise) : 0.25, s0 = set ? dayFrac(set) : 0.83, nf = dayFrac(now);
    const curve = (x) => 30 - 22 * Math.sin(Math.PI * (x - r0) / (s0 - r0));
    const path = Array.from({ length: 49 }, (_, i) => { const x = i / 48; return `${i ? "L" : "M"}${x * 100},${x < r0 || x > s0 ? 30 + 6 * Math.sin(Math.PI * ((x < r0 ? x + 1 : x) - s0) / (1 + r0 - s0)) : curve(x)}`; }).join(" ");
    const sunY = nf < r0 || nf > s0 ? 30 + 6 * Math.sin(Math.PI * ((nf < r0 ? nf + 1 : nf) - s0) / (1 + r0 - s0)) : curve(nf);
    const tile = (icon, label, body) => html`<div class="panel tile"><div class="lab"><ha-icon icon=${icon}></ha-icon>${label}</div>${body}</div>`;
    return html`<div class="grid">
      ${tile("mdi:weather-sunny-alert", "UV index", html`
        <div class="tv">${uv ?? "–"}</div><div class="tw">${uvCat || ""}</div>
        <div class="uvbar"><u style="left:${Math.min(100, (uv || 0) / 11 * 100)}%"></u></div>
        <div class="tn">${uvS && uvE ? `Sun protection ${clock(new Date(uvS))} to ${clock(new Date(uvE))}.` : "Today's peak."}</div>`)}
      ${tile(nextSet ? "mdi:weather-sunset-down" : "mdi:weather-sunset-up", nextSet ? "Sunset" : "Sunrise", html`
        <div class="tv mid">${next ? clock(next) : "–"}</div>
        <svg class="sunarc" viewBox="0 0 100 40" preserveAspectRatio="none">
          <path d=${path} fill="none" stroke="currentColor" stroke-width="1.2" opacity=".55"></path>
          <line x1="0" x2="100" y1="30" y2="30" stroke="currentColor" stroke-width=".5" opacity=".35"></line>
          <circle cx=${nf * 100} cy=${sunY} r="2.6" fill="#fff"></circle></svg>
        <div class="tn">${nextSet ? (rise ? `Sunrise: ${clock(rise)}` : "") : (set ? `Sunset: ${clock(set)}` : "")}</div>`)}
      ${tile("mdi:thermometer", "Feels like", html`
        <div class="tv">${round(feels)}°</div><div class="tw">Actual: ${round(temp)}°</div>
        <div class="tn">${feels != null && temp != null ? (temp - feels >= 2 ? "Wind is making it feel cooler." : feels - temp >= 2 ? "Humidity is making it feel warmer." : "Similar to the actual temperature.") : ""}</div>`)}
      ${tile("mdi:weather-windy", "Wind", html`
        <div class="wind">
          <div class="wnum"><div class="tv">${round(wind)}</div><div class="tw">km/h</div>
            <div class="tn">${gust != null ? `Gusts ${round(gust)} km/h` : ""}</div></div>
          <svg class="compass" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" stroke-width="1" opacity=".3"></circle>
            ${Array.from({ length: 36 }, (_, i) => svg`<line x1="50" y1="8" x2="50" y2=${i % 9 ? 11 : 14} stroke="currentColor" stroke-width="1" opacity=".45" transform="rotate(${i * 10} 50 50)"></line>`)}
            ${["N", "E", "S", "W"].map((p, i) => svg`<text x=${50 + 32 * Math.sin(i * Math.PI / 2)} y=${53 - 32 * Math.cos(i * Math.PI / 2)} text-anchor="middle" font-size="9" fill="currentColor" opacity=".7">${p}</text>`)}
            <g transform="rotate(${bearing(dir) + 180} 50 50)">
              <line x1="50" y1="78" x2="50" y2="26" stroke="#fff" stroke-width="2.4" stroke-linecap="round"></line>
              <path d="M50 18 L56 30 L44 30 Z" fill="#fff"></path><circle cx="50" cy="80" r="3" fill="none" stroke="#fff" stroke-width="1.6"></circle></g>
          </svg></div>
        <div class="tn">${dir ? `From the ${dir}` : ""}</div>`)}
      ${tile("mdi:water", "Rain", html`
        <div class="tv">${rain9 ?? "–"} mm</div><div class="tw">${this._away ? "expected today" : "since 9 am"}</div>
        <div class="tn">${range ? `${range} mm expected today${chance ? `, ${chance}% chance` : ""}.` : ""}</div>`)}
      ${tile("mdi:water-percent", "Humidity", html`
        <div class="tv">${round(hum)}%</div>
        <div class="tn">${dew != null ? `The dew point is ${round(dew)}° right now.` : ""}</div>`)}
      ${tile("mdi:gauge", "Pressure", html`
        <svg class="gauge" viewBox="0 0 100 62">
          ${Array.from({ length: 41 }, (_, i) => { const a = -120 + i * 6; return svg`<line x1="50" y1="8" x2="50" y2="14" stroke="currentColor" stroke-width="1.2" opacity=".4" transform="rotate(${a} 50 54)"></line>`; })}
          ${pres != null ? svg`<line x1="50" y1="5" x2="50" y2="17" stroke="#fff" stroke-width="3" stroke-linecap="round" transform="rotate(${Math.max(-120, Math.min(120, (pres - 1013) * 4))} 50 54)"></line>` : nothing}
          <text x="50" y="50" text-anchor="middle" font-size="15" font-weight="700" fill="currentColor">${pres != null ? Math.round(pres) : "–"}</text>
          <text x="50" y="61" text-anchor="middle" font-size="7.5" fill="currentColor" opacity=".7">hPa</text></svg>`)}
      ${tile("mdi:moon-waxing-crescent", "Moon", html`
        <div class="moonrow"><svg class="moon" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="#2b3346"></circle>
          <path d=${(() => { const k = Math.cos(m.phase * 2 * Math.PI) * 40, waxing = m.phase < 0.5;
            return `M50 10 A40 40 0 0 ${waxing ? 1 : 0} 50 90 A${Math.abs(k)} 40 0 0 ${(k > 0) === waxing ? 0 : 1} 50 10 Z`; })()} fill="#e9ecf4"></path></svg>
          <div><div class="tw strong">${m.name}</div><div class="tn">${m.lit}% lit</div></div></div>`)}
      ${fire ? tile("mdi:fire", "Fire danger", html`<div class="tv mid">${fire}</div><div class="tn">CFA rating for the district.</div>`) : nothing}
    </div>`;
  }

  render() {
    if (!this.hass || !this._config) return nothing;
    const w = this._st(this._config.weather), cond = w ? w.state : "cloudy", night = this._night();
    const sky = night ? (["rainy", "pouring", "lightning", "lightning-rainy", "cloudy", "fog"].includes(cond) ? "night-grey" : "night")
      : ["rainy", "pouring", "lightning", "lightning-rainy"].includes(cond) ? "rain" : ["cloudy", "fog"].includes(cond) ? "grey" : "clear";
    return html`<div class="page sky-${sky}">
      ${this._hero(cond, night)}
      ${this._warnings()}
      ${this._nextHour()}
      ${this._hours()}
      ${this._days()}
      ${this._map()}
      ${this._tiles()}
      <div class="foot">${this._away ? "Open-Meteo" : "Bureau of Meteorology · Pirate Weather · met.no"}</div>
    </div>`;
  }

  static styles = css`
    :host { display: block; --display: "Amazon Ember Display", "Amazon Ember", system-ui, sans-serif;
            --body: "Amazon Ember", system-ui, sans-serif; --ink: #f4f7ff; --muted: rgba(235, 241, 255, 0.66);
            --panel: rgba(16, 22, 38, 0.34); --edge: rgba(255, 255, 255, 0.10); --blue: #7cc4ff; }
    * { box-sizing: border-box; }
    button { font: inherit; color: inherit; border: 0; background: none; padding: 0; cursor: pointer; -webkit-tap-highlight-color: transparent; }
    .page { min-height: 100vh; color: var(--ink); font-family: var(--body);
            padding: 18px 16px calc(env(safe-area-inset-bottom, 0px) + 40px);
            display: flex; flex-direction: column; gap: 12px; }
    :host { background: #3d4a63; }
    .sky-clear { background: linear-gradient(180deg, #2f6fd0 0%, #5b9ae6 45%, #8bbcef 100%); }
    .sky-grey { background: linear-gradient(180deg, #4d5b74 0%, #6b7a93 50%, #8693a8 100%); }
    .sky-rain { background: linear-gradient(180deg, #37455e 0%, #4f5d76 45%, #66748c 100%); }
    .sky-night { background: linear-gradient(180deg, #0a1230 0%, #18245a 55%, #27366e 100%); }
    .sky-night-grey { background: linear-gradient(180deg, #141a2a 0%, #222b40 55%, #2f3a52 100%); }
    .page > * { width: 100%; max-width: 640px; margin-left: auto; margin-right: auto; }
    header { text-align: center; padding: 18px 0 22px; text-shadow: 0 1px 6px rgba(0, 0, 0, 0.18); }
    .here { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
    .here ha-icon { --mdc-icon-size: 13px; transform: rotate(45deg); }
    h1 { margin: 2px 0 0; font-family: var(--display); font-size: 32px; font-weight: 500; letter-spacing: -0.01em; }
    .big { font-family: var(--display); font-size: 104px; font-weight: 200; line-height: 1; margin: 2px 0 2px 26px; letter-spacing: -0.04em; }
    .cond { font-size: 20px; font-weight: 600; }
    .hl { margin-top: 4px; font-size: 16px; font-weight: 500; color: var(--ink); white-space: pre; }
    .panel { display: block; background: var(--panel); border: 1px solid var(--edge); border-radius: 22px; padding: 12px 14px;
             backdrop-filter: blur(18px) saturate(140%); -webkit-backdrop-filter: blur(18px) saturate(140%); color: inherit; text-decoration: none; }
    .lab { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; color: var(--muted); }
    .lab ha-icon { --mdc-icon-size: 14px; }
    .lab.big { display: block; font-size: 15px; letter-spacing: 0; text-transform: none; color: var(--ink); }
    .hint { font-size: 12px; color: var(--muted); margin-top: 1px; }
    .warn .wt { display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 16px; color: #ffd37a; }
    .warn.major .wt { color: #ff8a7a; }
    .warn .wt ha-icon { --mdc-icon-size: 18px; }
    .warn .wd { font-size: 14px; margin-top: 4px; line-height: 1.35; }
    .warn .src { font-size: 11px; color: var(--muted); margin-top: 6px; }
    .slim { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; }
    .slim ha-icon { --mdc-icon-size: 18px; color: var(--muted); }
    .nh-title { font-family: var(--display); font-size: 18px; font-weight: 700; }
    .nh-sub { font-size: 13px; color: var(--muted); margin-top: 2px; }
    .nh { position: relative; height: 74px; margin-top: 12px; display: flex; align-items: flex-end; gap: 1.5px; }
    .nh .g { position: absolute; left: 0; right: 0; border-top: 1px dashed rgba(255, 255, 255, 0.16); }
    .nh b { flex: 1; background: var(--blue); border-radius: 2px 2px 0 0; min-width: 0; }
    .ticks { display: flex; justify-content: space-between; margin-top: 6px; font-size: 12px; color: var(--muted); }
    .ticks span:first-child { color: var(--ink); font-weight: 700; }
    .hrhead { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
    .hrhead > div:first-child { text-align: left; }
    .seg { display: flex; background: rgba(255, 255, 255, 0.10); border-radius: 999px; padding: 3px; gap: 2px; }
    .seg button { width: 38px; height: 28px; border-radius: 999px; display: grid; place-items: center; color: var(--muted); }
    .seg button.on { background: rgba(255, 255, 255, 0.92); color: #26324a; }
    .seg ha-icon { --mdc-icon-size: 17px; }
    .hours { display: flex; overflow-x: auto; gap: 4px; margin: 12px -14px 0; padding: 0 14px 4px; scrollbar-width: none; }
    .hours::-webkit-scrollbar { display: none; }
    .hr { flex: 0 0 auto; min-width: 50px; display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .hr span { font-size: 13px; font-weight: 600; white-space: nowrap; }
    .hr img { width: 30px; height: 30px; }
    .hr b { font-size: 17px; font-weight: 600; }
    .hr small { font-size: 11px; font-weight: 700; min-height: 13px; color: var(--muted); white-space: nowrap; }
    .hr.sun b { font-size: 12px; font-weight: 600; }
    .blue { color: var(--blue) !important; }
    .rbar { width: 20px; height: 44px; border-radius: 6px; background: rgba(255, 255, 255, 0.12); display: flex; align-items: flex-end; overflow: hidden; }
    .rbar i { display: block; width: 100%; background: var(--blue); }
    .arrow { --mdc-icon-size: 24px; height: 30px; display: grid; place-items: center; }
    .day { display: grid; grid-template-columns: 54px 46px 34px 1fr 34px; align-items: center; gap: 8px; padding: 9px 0;
           border-top: 1px solid rgba(255, 255, 255, 0.10); font-size: 17px; font-weight: 600; }
    .day:nth-of-type(1) { border-top: 0; }
    .lab + .day { border-top: 0; margin-top: 4px; }
    .di { display: flex; flex-direction: column; align-items: center; }
    .di img { width: 28px; height: 28px; }
    .di small { font-size: 11px; font-weight: 700; margin-top: -2px; }
    .lo { color: var(--muted); text-align: right; }
    .hi { text-align: right; }
    .range { position: relative; height: 6px; border-radius: 3px; background: rgba(0, 0, 0, 0.22); }
    .range i { position: absolute; top: 0; bottom: 0; border-radius: 3px; }
    .range u { position: absolute; top: 50%; width: 8px; height: 8px; margin: -4px 0 0 -4px; border-radius: 50%; background: #fff;
               box-shadow: 0 0 0 2px rgba(20, 28, 48, 0.6); }
    .mapbox { position: relative; height: 300px; margin-top: 10px; border-radius: 14px; overflow: hidden; background: #1a1d24; }
    .tiles { position: absolute; left: 50%; top: 50%; width: 0; height: 0; }
    .tiles img { position: absolute; width: 256px; height: 256px; max-width: none; user-select: none; pointer-events: none; }
    .tiles img.rad { width: 512px; height: 512px; opacity: 0; transition: opacity 0.25s; image-rendering: auto; }
    .tiles img.rad.on { opacity: 0.85; }
    .tiles img.lbl { opacity: 0.9; }
    .home { position: absolute; left: 50%; top: 50%; width: 14px; height: 14px; margin: -7px 0 0 -7px; border-radius: 50%;
            background: #3d8bff; border: 2.5px solid #fff; box-shadow: 0 1px 6px rgba(0, 0, 0, 0.5); }
    .stamp { position: absolute; left: 10px; top: 10px; padding: 3px 9px; border-radius: 999px; font-size: 12px; font-weight: 700;
             background: rgba(0, 0, 0, 0.5); }
    .credit { position: absolute; right: 8px; bottom: 6px; font-size: 9px; color: rgba(255, 255, 255, 0.55); }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .tile { min-height: 158px; display: flex; flex-direction: column; min-width: 0; }
    .tv { font-family: var(--display); font-size: 34px; font-weight: 500; margin-top: 6px; line-height: 1.05; }
    .tv.mid { font-size: 26px; }
    .tw { font-size: 16px; font-weight: 600; margin-top: 2px; }
    .tw.strong { font-size: 17px; }
    .tn { font-size: 13px; margin-top: auto; padding-top: 8px; line-height: 1.3; color: var(--ink); }
    .uvbar { position: relative; height: 5px; border-radius: 3px; margin-top: 10px;
             background: linear-gradient(90deg, #5ad06a, #f2d14a, #f39a43, #ef5a4a, #b05ad6); }
    .uvbar u { position: absolute; top: 50%; width: 9px; height: 9px; margin: -4.5px 0 0 -4.5px; border-radius: 50%; background: #fff;
               box-shadow: 0 0 0 2px rgba(20, 28, 48, 0.55); }
    .sunarc { width: 100%; height: 46px; margin-top: 6px; color: #fff; }
    .wind { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
    .wnum .tn { margin-top: 4px; padding-top: 0; }
    .compass { width: 82px; height: 82px; flex: 0 0 auto; color: #fff; }
    .gauge { width: 100%; max-width: 150px; margin: 8px auto 0; color: #fff; display: block; }
    .moonrow { display: flex; align-items: center; gap: 12px; margin-top: 10px; }
    .moon { width: 64px; height: 64px; flex: 0 0 auto; }
    .foot { text-align: center; font-size: 11px; color: var(--muted); padding-top: 4px; }
  `;
}
