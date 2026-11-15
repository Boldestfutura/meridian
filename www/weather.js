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
  .wp-hours { display: grid; grid-template-columns: repeat(8, minmax(40px, 1fr)); gap: 2px; padding: 10px 6px; border-radius: 18px;
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
`;
