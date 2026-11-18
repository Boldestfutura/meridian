// Weather home-screen widget for Scriptable (iOS), in the Apple Weather widget's layout.
// Small: place, temperature, condition, high and low. Medium (and large): the same, plus the
// next six hours. The background follows the sky: clear, cloud, rain or storm, day or night.
// Tapping it opens the Weather dashboard (ha-weather) in the Home Assistant app.
//
// Set it up: Scriptable > + > paste this > name it "Weather". Run it once in the app: it asks for
// a Home Assistant long-lived token (HA > your profile > Security) and keeps it in the iOS
// Keychain, never in this file. Then home screen > add a Scriptable widget (small or medium) >
// Edit Widget > Script: Weather, When Interacting: Run Script.
//
// iOS decides when widgets refresh. The script asks for every 15 minutes; in practice it is
// every 15 to 30. The last good reading is kept on the phone, so the widget still draws off the
// tailnet, with the time it was taken.

const HA = "http://homeassistant.taild8548.ts.net:8123";
const PLACE = "South Melbourne";
const DAILY = "weather.outdoor_south_melbourne";
const HOURLY = "weather.outdoor_south_melbourne_hourly";
const OPEN = "homeassistant://navigate/ha-weather/weather";
const KEY = "ha-weather-widget-token";
const CACHE = "weather-widget.json";

const LABEL = {
  "sunny": "Sunny", "clear-night": "Clear", "partlycloudy": "Partly Cloudy", "cloudy": "Cloudy", "fog": "Fog",
  "rainy": "Showers", "pouring": "Heavy Rain", "lightning": "Thunderstorms", "lightning-rainy": "Storms",
  "snowy": "Snow", "snowy-rainy": "Sleet", "hail": "Hail", "windy": "Windy", "windy-variant": "Windy",
  "exceptional": "Severe Weather",
};

function symbol(cond, night) {
  const s = {
    "sunny": night ? "moon.stars.fill" : "sun.max.fill", "clear-night": "moon.stars.fill",
    "partlycloudy": night ? "cloud.moon.fill" : "cloud.sun.fill", "cloudy": "cloud.fill", "fog": "cloud.fog.fill",
    "rainy": "cloud.drizzle.fill", "pouring": "cloud.heavyrain.fill", "lightning": "cloud.bolt.fill",
    "lightning-rainy": "cloud.bolt.rain.fill", "snowy": "cloud.snow.fill", "snowy-rainy": "cloud.sleet.fill",
    "hail": "cloud.hail.fill", "windy": "wind", "windy-variant": "wind", "exceptional": "exclamationmark.triangle.fill",
  }[cond] || "cloud.fill";
  return s;
}
// sun and moon in their own colours, everything else white, as Apple draws them
const tint = (name) => name.startsWith("sun") ? new Color("#ffd23f") : Color.white();

function sky(cond, night) {
  const g = (a, b) => [new Color(a), new Color(b)];
  if (["lightning", "lightning-rainy", "exceptional", "hail"].includes(cond)) return g("#262a36", "#474b5b");
  if (["rainy", "pouring", "snowy", "snowy-rainy"].includes(cond)) return night ? g("#1d2433", "#353e50") : g("#4a5869", "#6f7e91");
  if (["cloudy", "fog", "windy", "windy-variant"].includes(cond)) return night ? g("#1f2633", "#3a4352") : g("#5f7590", "#8b9db3");
  return night ? g("#0a1430", "#22356a") : g("#2f7fd8", "#64aef0");
}

// ---- data -------------------------------------------------------------------------------------

async function token() {
  if (Keychain.contains(KEY)) return Keychain.get(KEY);
  if (config.runsInWidget) return null;
  const a = new Alert();
  a.title = "Home Assistant token";
  a.message = "Paste a long-lived access token. It stays in this phone's Keychain.";
  a.addSecureTextField("token");
  a.addAction("Save");
  a.addCancelAction("Cancel");
  if (await a.present() !== 0) return null;
  const t = a.textFieldValue(0).trim();
  if (t) Keychain.set(KEY, t);
  return t || null;
}

async function ha(t, path, body) {
  const r = new Request(HA + path);
  r.timeoutInterval = 12;
  r.headers = { "Authorization": "Bearer " + t, "Content-Type": "application/json" };
  if (body) { r.method = "POST"; r.body = JSON.stringify(body); }
  return r.loadJSON();
}

async function fetchWeather(t) {
  const [now, sun, fh, fd] = await Promise.all([
    ha(t, "/api/states/" + DAILY),
    ha(t, "/api/states/sun.sun"),
    ha(t, "/api/services/weather/get_forecasts?return_response", { entity_id: HOURLY, type: "hourly" }),
    ha(t, "/api/services/weather/get_forecasts?return_response", { entity_id: DAILY, type: "daily" }),
  ]);
  if (!now || !now.attributes) throw new Error("no weather entity");
  return {
    taken: Date.now(),
    temp: now.attributes.temperature,
    cond: now.state,
    rise: sun.attributes && sun.attributes.next_rising,
    set: sun.attributes && sun.attributes.next_setting,
    hourly: fh.service_response[HOURLY].forecast,
    daily: fd.service_response[DAILY].forecast,
  };
}

function cache(data) {
  const fm = FileManager.local(), path = fm.joinPath(fm.documentsDirectory(), CACHE);
  if (data) { fm.writeString(path, JSON.stringify(data)); return data; }
  return fm.fileExists(path) ? JSON.parse(fm.readString(path)) : null;
}

// BoM's forecast times have no zone; JavaScript reads them as local time, which they are
const at = (s) => new Date(s);
const sameDay = (a, b) => a.toDateString() === b.toDateString();

// night for a given time, from today's sunrise and sunset (sun.sun gives the next of each)
function isNight(w, when) {
  if (!w.rise || !w.set) return when.getHours() < 6 || when.getHours() >= 20;
  const rise = new Date(w.rise), set = new Date(w.set);
  const m = when.getHours() * 60 + when.getMinutes();
  return m < rise.getHours() * 60 + rise.getMinutes() || m >= set.getHours() * 60 + set.getMinutes();
}

// ---- drawing ----------------------------------------------------------------------------------

const deg = (v) => v == null || isNaN(v) ? "–" : Math.round(v) + "°";
const hourLabel = (d) => (d.getHours() % 12 || 12) + (d.getHours() < 12 ? "AM" : "PM");

function text(stack, s, font, opacity = 1) {
  const t = stack.addText(s);
  t.font = font;
  t.textColor = Color.white();
  t.textOpacity = opacity;
  t.lineLimit = 1;
  t.minimumScaleFactor = 0.6;
  return t;
}

function icon(stack, name, size) {
  const img = stack.addImage(SFSymbol.named(name).image);
  img.imageSize = new Size(size, size);
  img.tintColor = tint(name);
  img.resizable = true;
  return img;
}

function build(w, family) {
  const now = new Date();
  const night = isNight(w, now);
  // BoM's own condition is the whole day's outlook ("Showers" on a sunny morning); Apple shows
  // this hour's, so take it from the hourly forecast when there is one
  const hourNow = (w.hourly || []).find((h) => { const d = at(h.datetime); return d <= now && now - d < 60 * 60e3; });
  if (hourNow && hourNow.condition) w.cond = hourNow.condition;
  const today = (w.daily || []).find((d) => sameDay(at(d.datetime), now)) || (w.daily || [])[0] || {};
  const widget = new ListWidget();
  const g = new LinearGradient();
  g.colors = sky(w.cond, night);
  g.locations = [0, 1];
  widget.backgroundGradient = g;
  widget.url = OPEN;
  widget.refreshAfterDate = new Date(Date.now() + 15 * 60e3);
  widget.setPadding(14, 15, 13, 15);

  const top = widget.addStack();
  top.layoutHorizontally();
  const left = top.addStack();
  left.layoutVertically();
  const place = left.addStack();
  place.centerAlignContent();
  text(place, PLACE, Font.semiboldSystemFont(family === "small" ? 14 : 15));
  place.addSpacer(3);
  const arrow = place.addImage(SFSymbol.named("location.fill").image);
  arrow.imageSize = new Size(9, 9);
  arrow.tintColor = Color.white();
  text(left, deg(w.temp), Font.lightSystemFont(family === "small" ? 42 : 40));

  const stale = Date.now() - w.taken > 45 * 60e3;
  const highLow = `H:${deg(today.temperature)} L:${deg(today.templow)}`;

  if (family === "small") {
    widget.addSpacer();
    icon(widget, symbol(w.cond, night), 18);
    widget.addSpacer(3);
    text(widget, LABEL[w.cond] || "", Font.semiboldSystemFont(13));
    text(widget, stale ? "Updated " + hourLabel(new Date(w.taken)).toLowerCase() : highLow, Font.semiboldSystemFont(13));
    return widget;
  }

  top.addSpacer();
  const right = top.addStack();
  right.layoutVertically();
  const r1 = right.addStack(); r1.addSpacer(); icon(r1, symbol(w.cond, night), 18);
  right.addSpacer(4);
  const r2 = right.addStack(); r2.addSpacer(); text(r2, LABEL[w.cond] || "", Font.semiboldSystemFont(13));
  const r3 = right.addStack(); r3.addSpacer();
  text(r3, stale ? "Updated " + hourLabel(new Date(w.taken)).toLowerCase() : highLow, Font.semiboldSystemFont(13));

  widget.addSpacer();
  const row = widget.addStack();
  row.layoutHorizontally();
  const hours = (w.hourly || []).filter((h) => at(h.datetime) > new Date(now.getTime() - 60 * 60e3)).slice(0, 6);
  hours.forEach((h, i) => {
    const d = at(h.datetime);
    const col = row.addStack();
    col.layoutVertically();
    col.centerAlignContent();
    const c1 = col.addStack(); c1.addSpacer(); text(c1, i === 0 && d <= now ? "Now" : hourLabel(d), Font.semiboldSystemFont(11), 0.85); c1.addSpacer();
    col.addSpacer(5);
    const c2 = col.addStack(); c2.addSpacer(); icon(c2, symbol(h.condition, isNight(w, d)), 17); c2.addSpacer();
    col.addSpacer(5);
    const c3 = col.addStack(); c3.addSpacer(); text(c3, deg(i === 0 && d <= now ? w.temp : h.temperature), Font.semiboldSystemFont(14)); c3.addSpacer();
    if (i < hours.length - 1) row.addSpacer();
  });
  return widget;
}

function message(s) {
  const widget = new ListWidget();
  widget.backgroundColor = new Color("#2f3b52");
  widget.url = OPEN;
  text(widget, s, Font.semiboldSystemFont(13));
  return widget;
}

// ---- run --------------------------------------------------------------------------------------

const family = config.widgetFamily || "medium";
const t = await token();
let w = null;
if (t) { try { w = cache(await fetchWeather(t)); } catch (e) { w = cache(); } }
else w = cache();

const widget = w ? build(w, family === "small" ? "small" : "medium")
                 : message(t ? "Can't reach Home Assistant" : "Open Scriptable and run Weather once");
if (config.runsInWidget) Script.setWidget(widget);
else if (family === "small") await widget.presentSmall();
else await widget.presentMedium();
Script.complete();
