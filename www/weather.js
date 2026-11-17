// The weather pop-up: tap the weather anywhere (the Kitchen Show's Outside tile, an Echo screen's
// weather, the Phone Show's weather pill) and this sheet opens. Kept short, top to bottom:
//   wx-now       temperature, condition, high and low, feels like
//   wx-warnings  Bureau of Meteorology warnings (tap one for the BoM page)
//   wx-rain      one line from Pirate Weather (sensor.rain_next_hour), only when rain is due
//   wx-hours     the next 8 hours: time, icon, temperature
//   wx-week      the coming days: icon, chance of rain, low and high
//   wx-details   wind, UV, humidity, sunset
// Data: the BoM integration (bremor/bureau_of_meteorology). Class names are wp-*: the Kitchen
// Show's own weather already uses wx-*.
import { html, css, nothing } from "./lit-all.min.js";

export const WX = {
  weather: "weather.outdoor_south_melbourne",
  hourly: "weather.outdoor_south_melbourne_hourly",
  forecast: "bom_south_melbourne",         // sensor.<forecast>_<kind>_0
  observations: "bom_olympic_park",        // sensor.<observations>_<kind>
  warnings: "sensor.bom_south_melbourne_warnings",
  rain: "sensor.rain_next_hour",
};

export const weatherPopup = () => ({ title: "Weather", icon: "mdi:weather-partly-cloudy", weather: true,
  sections: ["now", "warnings", "rain", "hours", "week", "details"].map((k) => ({ type: `wx-${k}` })) });

const LABEL = {
  "sunny": "Sunny", "clear-night": "Clear", "partlycloudy": "Partly cloudy", "cloudy": "Cloudy", "fog": "Fog",
  "rainy": "Showers", "pouring": "Heavy rain", "lightning": "Thunderstorms", "lightning-rainy": "Storms",
  "snowy": "Snow", "snowy-rainy": "Sleet", "hail": "Hail", "windy": "Windy", "windy-variant": "Windy", "exceptional": "Severe weather",
};
export const wxLabel = (cond) => LABEL[cond] || "";
const DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const hourLabel = (d) => `${d.getHours() % 12 || 12}${d.getHours() < 12 ? "am" : "pm"}`;
const clock = (d) => `${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")}${d.getHours() < 12 ? "am" : "pm"}`;
const num = (v) => { const n = parseFloat(v); return isFinite(n) ? n : null; };
const round = (v) => v == null || !isFinite(v) ? "–" : Math.round(v);
const icon = (cond, night) => {
  let c = LABEL[cond] ? cond : "cloudy";
  if (night && c === "sunny") c = "clear-night";
  return `/local/weather/${c}.svg`;
};

// the two forecast subscriptions, held while the sheet is open and dropped two minutes after
class WeatherFeed {
  constructor(host) { this.host = host; this.daily = null; this.hourly = null; }
  touch(hass) {
    this.seen = Date.now();
    if (this.subs || !hass) return;
    const sub = (type, entity, key) => hass.connection.subscribeMessage((m) => { this[key] = m.forecast || []; this.host.requestUpdate(); },
      { type: "weather/subscribe_forecast", forecast_type: type, entity_id: entity }).catch(() => null);
    this.subs = [sub("daily", WX.weather, "daily"), sub("hourly", WX.hourly, "hourly")];
    this.watch = setInterval(() => {
      if (Date.now() - this.seen < 120e3) return;
      for (const s of this.subs) s.then((f) => f && f()).catch(() => {});
      this.subs = null;
      clearInterval(this.watch);
    }, 30e3);
  }
}

// The weather warning alert, full screen on the room screens (the Kitchen Display, the Echo), like
// the washing alert. Option `warnings: true` (or {alert, entity} to override): the automation
// weather_warning_notify switches input_boolean.weather_warning_alert on for a new Bureau warning
// and off once none is left; Got it on any screen turns it off everywhere. It shows the live
// warnings, major first, sheep graziers aside. Over the washing alert, under a timer or alarm,
// and never in a dark room.
export const WARN = { alert: "input_boolean.weather_warning_alert", entity: WX.warnings };
export const liveWarnings = (hass, entity = WX.warnings) =>
  (((hass && hass.states[entity]) || { attributes: {} }).attributes.warnings || [])
    .filter((w) => w.type !== "sheep_graziers_warning" && (!w.expiry_time || new Date(w.expiry_time) > new Date()))
    .sort((a, b) => (b.warning_group_type === "major") - (a.warning_group_type === "major"));
const WARN_ICON = [["thunderstorm", "mdi:weather-lightning-rainy"], ["wind", "mdi:weather-windy"], ["gale", "mdi:weather-windy"],
  ["flood", "mdi:home-flood"], ["fire", "mdi:fire-alert"], ["heat", "mdi:thermometer-alert"], ["frost", "mdi:snowflake-alert"],
  ["snow", "mdi:snowflake-alert"], ["surf", "mdi:waves"], ["marine", "mdi:waves"], ["rain", "mdi:weather-pouring"]];
const warnIcon = (type) => (WARN_ICON.find(([k]) => String(type).includes(k)) || [0, "mdi:alert"])[1];

export function wxAlert(c, opt) {
  if (!opt || !c.hass) return nothing;
  const o = Object.assign({}, WARN, typeof opt === "object" ? opt : {});
  const a = c.hass.states[o.alert];
  if (!a || a.state !== "on" || c._night()) return nothing;
  const list = liveWarnings(c.hass, o.entity);
  if (!list.length) return nothing;
  const w = list[0], major = w.warning_group_type === "major";
  const until = w.expiry_time ? new Date(w.expiry_time) : null;
  const sub = [until ? `Until ${DAY[until.getDay()]} ${clock(until)}` : "", list.length > 1 ? `+ ${list.length - 1} more` : ""].filter(Boolean).join(" · ");
  const dismiss = (ev) => { ev.stopPropagation(); c._call("input_boolean", "turn_off", { entity_id: o.alert }); };
  return html`
    <div class="screen ww ${major ? "ww-major" : ""}" @pointerdown=${(ev) => ev.stopPropagation()}>
      <div class="ww-top">
        <div class="ww-label"><ha-icon icon="mdi:alert"></ha-icon>${major ? "Severe weather" : "Weather warning"}</div>
        <ha-icon class="ww-ico ${String(w.type).includes("thunderstorm") ? "ww-flash" : ""}" icon=${warnIcon(w.type)}></ha-icon>
      </div>
      <div class="ww-text">
        <div class="ww-title">${(w.short_title || w.title || "").replace(/ Warning$/, "")}</div>
        ${sub ? html`<div class="ww-sub">${sub}</div>` : nothing}
      </div>
      <button class="ww-btn" @click=${dismiss}><ha-icon icon="mdi:check"></ha-icon>Got it</button>
    </div>`;
}

// The morning forecast, full screen on the room screens before we head out. Option `morning: true`
// (or {alert}): automation weather_morning_forecast turns input_boolean.morning_forecast on at 6 am
// when someone's home and off at 10 am or when the house empties; Close on any screen turns it
// off everywhere. Today's high and low, rain chance and amount, UV and cover-up times, wind, and
// the day's temperatures at 9, 12, 3, 6 and 9. Under the washing and warning alerts and the
// clocks, and never in a dark room, so it waits for the lights.
export const MORNING = { alert: "input_boolean.morning_forecast" };
const COND_OF = { sunny: "sunny", clear: "sunny", mostly_sunny: "partlycloudy", partly_cloudy: "partlycloudy", cloudy: "cloudy",
  hazy: "fog", haze: "fog", fog: "fog", light_rain: "rainy", rain: "pouring", shower: "rainy", light_shower: "rainy",
  heavy_shower: "pouring", storm: "lightning-rainy", windy: "windy", dusty: "windy", frost: "snowy", snow: "snowy", cyclone: "exceptional" };

export function wxMorning(c, opt) {
  if (!opt || !c.hass) return nothing;
  const o = Object.assign({}, MORNING, typeof opt === "object" ? opt : {});
  const a = c.hass.states[o.alert];
  if (!a || a.state !== "on" || c._night()) return nothing;
  const feed = c.__wxFeed || (c.__wxFeed = new WeatherFeed(c));
  feed.touch(c.hass);
  const st = (id) => c.hass.states[id];
  const obs = (k) => { const e = st(`sensor.${WX.observations}_${k}`); return e ? num(e.state) : null; };
  const fc = (k) => { const e = st(`sensor.${WX.forecast}_${k}_0`); return e && !["unknown", "unavailable"].includes(e.state) ? e.state : null; };
  const today = (feed.daily || [])[0];
  const hi = num(fc("temp_max")) ?? (today && today.temperature);
  const lo = num(fc("temp_min")) ?? obs("min_temp") ?? (today && today.templow);
  const cond = COND_OF[fc("icon_descriptor")] || (today && today.condition) || ((st(WX.weather) || {}).state) || "cloudy";
  const short = (fc("short_text") || wxLabel(cond) || "").replace(/\.$/, "");
  const rain = num(fc("rain_chance")), mm = fc("rain_amount_range");
  const uv = fc("uv_max_index"), uvS = fc("uv_start_time"), uvE = fc("uv_end_time");
  const dir = (st(`sensor.${WX.observations}_wind_direction`) || {}).state || "", gust = obs("gust_speed_kilometre");
  const now = new Date();
  const slots = (feed.hourly || []).filter((f) => { const d = new Date(f.datetime); return d > now && d.getDate() === now.getDate() && [9, 12, 15, 18, 21].includes(d.getHours()); }).slice(0, 5);
  const dismiss = (ev) => { ev.stopPropagation(); c._call("input_boolean", "turn_off", { entity_id: o.alert }); };
  const tile = (ic, label, big, note) => html`<div class="mf-tile"><span class="mf-k"><ha-icon icon=${ic}></ha-icon>${label}</span><b>${big}</b><small>${note}</small></div>`;
  return html`
    <div class="screen mf" @pointerdown=${(ev) => ev.stopPropagation()}>
      <div class="mf-top">
        <div class="mf-label">${DAY_LONG[now.getDay()]}'s forecast</div>
        <div class="mf-side">
          <div class="mf-time">${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, "0")}</div>
          <button class="mf-btn" @click=${dismiss}>Close</button>
        </div>
      </div>
      <div class="mf-main">
        <img src=${icon(cond, false)} alt="">
        <div class="mf-temps"><b>${round(hi)}°</b><span>High${lo != null ? ` · low ${round(lo)}°` : ""}</span></div>
        <div class="mf-what">${short}</div>
      </div>
      <div class="mf-tiles">
        ${tile("mdi:umbrella", "Rain", rain != null ? `${rain}%` : "–", mm && mm !== "0" ? `${mm} mm` : rain != null && rain < 20 ? "Unlikely" : "")}
        ${tile("mdi:weather-sunny-alert", "UV", uv ? `${uv}` : "–", [fc("uv_category"), uvS && uvE ? `${clock(new Date(uvS))}–${clock(new Date(uvE))}` : ""].filter(Boolean).join(" · "))}
        ${tile("mdi:weather-windy", "Wind", `${round(obs("wind_speed_kilometre"))} km/h`, [dir && `From the ${dir}`, gust != null && `gusts ${round(gust)}`].filter(Boolean).join(", "))}
      </div>
      ${slots.length ? html`<div class="mf-hours">${slots.map((f) => {
        const d = new Date(f.datetime), p = f.precipitation_probability || 0;
        return html`<div><span>${hourLabel(d)}</span><img src=${icon(f.condition, d.getHours() >= 20)} alt=""><b>${round(f.temperature)}°</b><small>${p >= 20 ? `${p}%` : ""}</small></div>`;
      })}</div>` : nothing}
    </div>`;
}
const DAY_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// one section of the sheet; `c` is the card (hass, requestUpdate)
export function wxSection(c, s) {
  const feed = c.__wxFeed || (c.__wxFeed = new WeatherFeed(c));
  feed.touch(c.hass);
  const st = (id) => c.hass && c.hass.states[id];
  const obs = (k) => { const e = st(`sensor.${WX.observations}_${k}`); return e ? num(e.state) : null; };
  const fc = (k) => { const e = st(`sensor.${WX.forecast}_${k}_0`); return e && !["unknown", "unavailable"].includes(e.state) ? e.state : null; };
  const sunT = (k) => { const x = fc(`astronomical_${k}_time`); return x ? new Date(x) : null; };
  const rise = sunT("sunrise"), set = sunT("sunset");
  const night = (d = new Date()) => {
    if (!rise || !set) return (st("sun.sun") || {}).state === "below_horizon";
    const m = d.getHours() * 60 + d.getMinutes();
    return m < rise.getHours() * 60 + rise.getMinutes() || m > set.getHours() * 60 + set.getMinutes();
  };
  const today = (feed.daily || [])[0];
  // the forecast's low for today is often tonight's, so fold in what's been observed
  const todayLo = Math.min(...[today && (today.templow ?? today.temperature), obs("min_temp")].filter((x) => x != null));
  const todayHi = Math.max(...[today && today.temperature, obs("max_temp")].filter((x) => x != null));

  switch (s.type) {
    case "wx-now": {
      const w = st(WX.weather), short = fc("short_text");
      return html`<div class="wp-now">
        <img src=${icon(w ? w.state : "cloudy", night())} alt="">
        <div class="wp-big">${round(obs("temp") ?? (w && w.attributes.temperature))}°</div>
        <div class="wp-what"><b>${short ? short.replace(/\.$/, "") : wxLabel(w && w.state)}</b>
          <span class="muted">H ${round(todayHi)}° · L ${round(todayLo)}° · Feels ${round(obs("temp_feels_like"))}°</span></div></div>`;
    }
    case "wx-warnings":
      return ((st(WX.warnings) || { attributes: {} }).attributes.warnings || []).map((w) => {
        const until = w.expiry_time ? new Date(w.expiry_time) : null;
        return html`<a class="wp-row wp-warn ${w.warning_group_type === "major" ? "major" : ""}" target="_blank" rel="noreferrer"
            href="https://www.bom.gov.au/products/${String(w.id || "").split("_").pop()}.shtml">
          <ha-icon icon="mdi:alert"></ha-icon><span><b>${w.short_title || w.title}</b>
            <span class="muted">${until ? `Until ${DAY[until.getDay()]} ${clock(until)}` : "Bureau of Meteorology"}</span></span></a>`;
      });
    case "wx-rain": {
      const e = st(WX.rain), pts = ((e && e.attributes.data) || []).slice(0, 60);
      if (!pts.some((p) => p.precipProbability >= 0.15 && p.precipIntensity >= 0.05)) return nothing;
      return html`<div class="wp-row"><ha-icon icon="mdi:umbrella"></ha-icon><span><b>${(e.state || "Rain soon").replace(/\.$/, "")}</b>
        <span class="muted">Next hour, up to ${Math.round(Math.max(...pts.map((p) => p.precipProbability)) * 100)}% chance</span></span></div>`;
    }
    case "wx-hours": {
      const now = Date.now(), list = (feed.hourly || []).filter((f) => Date.parse(f.datetime) > now - 3600e3).slice(0, 8);
      if (!list.length) return nothing;
      return html`<div class="wp-hours">${list.map((f, i) => {
        const d = new Date(f.datetime), p = f.precipitation_probability || 0;
        return html`<div><span class="muted">${i ? hourLabel(d) : "Now"}</span><img src=${icon(f.condition, night(d))} alt="">
          <b>${round(i === 0 && obs("temp") != null ? obs("temp") : f.temperature)}°</b><small>${p >= 20 ? `${p}%` : ""}</small></div>`;
      })}</div>`;
    }
    case "wx-week": {
      const list = (feed.daily || []).slice(0, 7);
      if (!list.length) return nothing;
      return html`<div class="wp-week">${list.map((f, i) => {
        const p = f.precipitation_probability || 0;
        return html`<div><span>${i ? DAY[new Date(f.datetime).getDay()] : "Today"}</span><img src=${icon(f.condition, false)} alt="">
          <small>${p >= 20 ? `${p}%` : ""}</small>
          <span class="muted wp-n">${round(i ? f.templow ?? f.temperature : todayLo)}°</span><b class="wp-n">${round(i ? f.temperature : todayHi)}°</b></div>`;
      })}</div>`;
    }
    case "wx-details": {
      const dir = (st(`sensor.${WX.observations}_wind_direction`) || {}).state || "", gust = obs("gust_speed_kilometre");
      const uv = fc("uv_max_index"), uvS = fc("uv_start_time"), uvE = fc("uv_end_time"), dew = obs("dew_point");
      const now = new Date(), setNext = set && set > now, next = setNext ? set : rise ? new Date(rise.getTime() + (rise < now ? 864e5 : 0)) : null;
      const tile = (ic, label, big, note) => html`<div class="wp-tile"><span class="muted"><ha-icon icon=${ic}></ha-icon>${label}</span><b>${big}</b><small class="muted">${note}</small></div>`;
      return html`<div class="wp-tiles">
        ${tile("mdi:weather-windy", "Wind", `${round(obs("wind_speed_kilometre"))} km/h`, [dir && `From the ${dir}`, gust != null && `gusts ${round(gust)}`].filter(Boolean).join(", "))}
        ${tile("mdi:weather-sunny-alert", "UV today", uv ? `${uv} ${fc("uv_category") || ""}` : "–", uvS && uvE ? `Cover up ${clock(new Date(uvS))}–${clock(new Date(uvE))}` : "")}
        ${tile("mdi:water-percent", "Humidity", `${round(obs("humidity"))}%`, dew != null ? `Dew point ${round(dew)}°` : "")}
        ${tile(setNext ? "mdi:weather-sunset-down" : "mdi:weather-sunset-up", setNext ? "Sunset" : "Sunrise", next ? clock(next) : "–",
          setNext ? (rise ? `Sunrise ${clock(rise)}` : "") : (set ? `Sunset ${clock(set)}` : ""))}
      </div>`;
    }
  }
  return nothing;
}

// the phone's weather pill: always shown, the warning's name while one is out (sheep graziers aside)
export function wxPill(c, x) {
  const w = c.hass && c.hass.states[x.entity || WX.weather];
  if (!w) return nothing;
  const o = c.hass.states[`sensor.${WX.observations}_temp`], t = o && isFinite(parseFloat(o.state)) ? parseFloat(o.state) : w.attributes.temperature;
  const warns = ((c.hass.states[WX.warnings] || { attributes: {} }).attributes.warnings || []).filter((v) => v.type !== "sheep_graziers_warning");
  const ic = { "sunny": "mdi:weather-sunny", "clear-night": "mdi:weather-night", "partlycloudy": "mdi:weather-partly-cloudy",
    "rainy": "mdi:weather-rainy", "pouring": "mdi:weather-pouring", "lightning": "mdi:weather-lightning", "lightning-rainy": "mdi:weather-lightning-rainy",
    "fog": "mdi:weather-fog", "windy": "mdi:weather-windy" }[w.state] || "mdi:weather-cloudy";
  return html`<button class="tab st reading wp-pill ${warns.length ? "warned" : ""}" @click=${() => c._open(x.entity || WX.weather)}>
    <ha-icon icon=${warns.length ? "mdi:alert" : ic}></ha-icon><span>${round(t)}°</span>
    <small>${warns.length ? warns[0].short_title : wxLabel(w.state) || x.name || "Weather"}</small></button>`;
}

// Meridian's own tokens, so it follows light and dark
export const WX_CSS = css`
  .wp-now { display: grid; grid-template-columns: 56px auto 1fr; align-items: center; gap: 12px; padding: 0 4px 4px; }
  .wp-now img { width: 56px; height: 56px; }
  .wp-big { font-family: var(--display); font-size: 44px; font-weight: 400; line-height: 1; letter-spacing: -0.03em; }
  .wp-what { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .wp-what b { font-size: 16px; }
  .wp-what .muted, .wp-row .muted { font-size: 13px; }
  .wp-row { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 18px; background: var(--inset);
            color: inherit; text-decoration: none; }
  .wp-row > span { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
  .wp-row ha-icon { --mdc-icon-size: 22px; color: var(--cool); flex: none; }
  .wp-warn ha-icon { color: var(--warm); }
  .wp-warn.major ha-icon { color: #e5484d; }
  .wp-hours { flex: none; display: grid; grid-template-columns: repeat(8, minmax(40px, 1fr)); gap: 2px; padding: 10px 6px; border-radius: 18px;
              background: var(--inset); overflow-x: auto; scrollbar-width: none; }
  .wp-hours > div { display: flex; flex-direction: column; align-items: center; gap: 2px; }
  .wp-hours span { font-size: 12px; font-weight: 700; white-space: nowrap; }
  .wp-hours img { width: 28px; height: 28px; }
  .wp-hours b { font-size: 15px; }
  .wp-hours small, .wp-week small { font-size: 11px; font-weight: 700; color: var(--cool); min-height: 13px; }
  .wp-week { padding: 4px 14px; border-radius: 18px; background: var(--inset); }
  .wp-week > div { display: grid; grid-template-columns: 1fr 30px 40px 36px 36px; align-items: center; gap: 6px; padding: 6px 0;
                   font-size: 15px; font-weight: 700; border-top: 1px solid var(--grid-line); }
  .wp-week > div:first-child { border-top: 0; }
  .wp-week img { width: 26px; height: 26px; }
  .wp-n { text-align: right; }
  .wp-tiles { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .wp-tile { display: flex; flex-direction: column; gap: 3px; padding: 12px 14px; border-radius: 18px; background: var(--inset); min-width: 0; }
  .wp-tile > span { display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 700; }
  .wp-tile ha-icon { --mdc-icon-size: 15px; }
  .wp-tile b { font-family: var(--display); font-size: 20px; font-weight: 700; }
  .wp-tile small { font-size: 12px; }
  .wp-pill ha-icon { color: var(--warm); }
  .wp-pill.warned ha-icon { color: #e5484d; }
  /* the weather warning alert: a storm-dark screen with an amber edge breathing in (red when major) */
  .screen.ww { z-index: 885; grid-template-columns: minmax(0, 1fr); grid-template-rows: 1fr auto auto; gap: 3.5vh;
        padding: 6vh 5.5vw 6vh; color: #f3efe6; background: #0e1424; isolation: isolate; --ww-edge: 232, 150, 40; }
  .screen.ww.ww-major { --ww-edge: 222, 40, 40; }
  .ww::before { content: ""; position: absolute; inset: -20%; z-index: -1;
        background: radial-gradient(ellipse at 70% 30%, #2c3a5c 0%, #172038 45%, #0b0f1c 100%); animation: ww-drift 7s ease-in-out infinite; }
  .ww::after { content: ""; position: absolute; inset: 0; z-index: -1; pointer-events: none;
        box-shadow: inset 0 0 6vh 1vh rgba(var(--ww-edge), 0.7); animation: ww-edge 2.6s ease-in-out infinite; }
  @keyframes ww-drift { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(-4%, 3%) scale(1.06); } }
  @keyframes ww-edge { 0%, 100% { box-shadow: inset 0 0 4vh 0.5vh rgba(var(--ww-edge), 0.45); }
        50% { box-shadow: inset 0 0 14vh 4vh rgba(var(--ww-edge), 0.9); } }
  .ww-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 3vw; min-height: 0; }
  .ww-label { display: flex; align-items: center; gap: 1.4vw; font-family: var(--display); font-weight: 700;
        font-size: 6.5vh; white-space: nowrap; padding-top: 1vh; color: rgb(var(--ww-edge)); }
  .ww-label ha-icon { --mdc-icon-size: 7.5vh; }
  .ww-ico { --mdc-icon-size: 34vh; flex: none; color: #dfe6f5; }
  .ww-flash { animation: ww-flash 5s linear infinite; }
  @keyframes ww-flash { 0%, 80%, 86%, 100% { color: #dfe6f5; filter: none; } 82%, 88% { color: #fff6c8; filter: drop-shadow(0 0 4vh #ffe27a); } }
  .ww-text { min-width: 0; }
  .ww-title { font-family: var(--display); font-weight: 800; font-size: min(15vh, 8.2vw); line-height: 0.95;
        letter-spacing: -0.02em; text-wrap: balance; }
  .ww-sub { margin-top: 1.6vh; font-family: var(--display); font-weight: 700; font-size: 6vh; opacity: 0.75; }
  .ww-btn { height: 20vh; border: 0; border-radius: 7vh; background: rgb(var(--ww-edge)); color: #10131c;
        display: flex; align-items: center; justify-content: center; gap: 1.6vw; font-family: var(--display);
        font-weight: 700; font-size: 7vh; transition: transform 0.12s; }
  .ww-btn ha-icon { --mdc-icon-size: 8vh; }
  .ww-btn:active { transform: scale(0.97); }
  @media (prefers-reduced-motion: reduce) { .ww::before, .ww::after, .ww-flash { animation: none; } }
  /* the morning forecast: a pale dawn sky, calm (no pulsing), dark ink */
  .screen.mf { z-index: 870; grid-template-columns: minmax(0, 1fr); grid-template-rows: auto 1fr auto auto; gap: 2.6vh;
        padding: 4.5vh 4.5vw 5vh; color: #14213a; isolation: isolate;
        background: linear-gradient(165deg, #bcd8f2 0%, #dfe9f1 45%, #f7ecdc 80%, #fbdcb8 100%); }
  .mf-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 3vw; }
  .mf-label { font-family: var(--display); font-weight: 800; font-size: 6.4vh; letter-spacing: -0.01em; white-space: nowrap; }
  .mf-time { font-family: var(--display); font-weight: 800; font-size: 9vh; line-height: 1; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; flex: none; }
  /* top right: the time, Close under it, as wide as the time */
  .mf-side { display: flex; flex-direction: column; align-items: stretch; gap: 1.6vh; flex: none; }
  .mf-side .mf-btn { justify-content: center; padding: 0 2.4vh; }
  .mf-btn { height: 9.5vh; padding: 0 3.4vh; border: 0; border-radius: 5vh; background: #14213a; color: #f7ecdc;
        display: flex; align-items: center; gap: 1.2vh; font-family: var(--display); font-weight: 700; font-size: 4.2vh; flex: none; }
  .mf-btn ha-icon { --mdc-icon-size: 4.6vh; }
  .mf-btn:active { transform: scale(0.96); }
  .mf-main { display: grid; grid-template-columns: auto auto minmax(0, 1fr); align-items: center; gap: 3vw; min-height: 0; }
  .mf-main img { height: min(30vh, 22vw); width: auto; filter: drop-shadow(0 1vh 2vh rgba(20, 33, 58, 0.18)); }
  .mf-temps { display: flex; flex-direction: column; line-height: 0.9; }
  .mf-temps b { font-family: var(--display); font-weight: 800; font-size: min(24vh, 15vw); letter-spacing: -0.04em; }
  .mf-temps span { font-family: var(--display); font-weight: 700; font-size: 5.4vh; opacity: 0.6; margin-top: 1vh; }
  .mf-what { font-family: var(--display); font-weight: 700; font-size: min(8vh, 4.6vw); line-height: 1.05; text-wrap: balance; min-width: 0; }
  .mf-tiles { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 2vw; }
  .mf-tile { display: flex; flex-direction: column; gap: 0.4vh; padding: 2vh 2.2vw; border-radius: 3.6vh; background: rgba(255, 255, 255, 0.55); min-width: 0; }
  .mf-k { display: flex; align-items: center; gap: 1vh; font-weight: 700; font-size: min(3.4vh, 1.7vw); opacity: 0.65; }
  .mf-k ha-icon { --mdc-icon-size: 3.8vh; }
  .mf-tile b { font-family: var(--display); font-weight: 800; font-size: 7.6vh; line-height: 1; }
  .mf-tile small { font-weight: 600; font-size: min(3.2vh, 1.6vw); opacity: 0.7; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .mf-hours { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); gap: 1vw; padding: 1.4vh 1.6vw;
        border-radius: 3.6vh; background: rgba(255, 255, 255, 0.4); }
  .mf-hours > div { display: grid; grid-template-columns: auto auto auto auto; justify-content: center; align-items: center; gap: min(1vh, 0.5vw); min-width: 0; }
  .mf-hours span { font-weight: 700; font-size: min(3.4vh, 1.7vw); opacity: 0.65; }
  .mf-hours img { height: min(5.4vh, 2.7vw); width: auto; }
  .mf-hours b { font-family: var(--display); font-weight: 800; font-size: min(4.4vh, 2.2vw); }
  .mf-hours small { font-weight: 700; font-size: min(3vh, 1.5vw); color: #2f6fd0; min-width: 0; }
`;
