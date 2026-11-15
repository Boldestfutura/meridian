// Countdown home-screen widget for Scriptable (iOS). Big days left over artwork, with the
// hours, minutes and seconds ticking live (iOS draws the timer, so it moves between refreshes).
// Set it up: Scriptable > + > paste this > name it; home screen > add a Scriptable widget
// (small, medium or large) > Edit Widget > Script: this one.
// The artwork is fetched once from Home Assistant over Tailscale and kept on the phone, so the
// widget still draws when the phone is off the tailnet.

const TARGET = new Date("2026-11-19T00:00:00+11:00");   // GTA VI, midnight in Melbourne
const ART = "http://homeassistant.taild8548.ts.net:8123/local/gta6/gta6.jpg";
const WHEN = "Thursday 19 November · 12:00 am";
const DONE = "Out now";
const HOT = new Color("#ffb35c"), PINK = new Color("#ff6fae"), WHITE = Color.white(), SHADE = new Color("#1b0f30");

async function artwork() {
  const fm = FileManager.local();
  const path = fm.joinPath(fm.documentsDirectory(), "countdown-art.jpg");
  if (!fm.fileExists(path)) {
    try { fm.writeImage(path, await new Request(ART).loadImage()); } catch (e) { return null; }
  }
  return fm.readImage(path);
}

// the art, cropped to fill the widget, darkening into purple at the bottom where the numbers go
function background(img, w, h) {
  const dc = new DrawContext();
  dc.size = new Size(w, h);
  dc.opaque = true;
  dc.respectScreenScale = true;
  dc.setFillColor(SHADE);
  dc.fillRect(new Rect(0, 0, w, h));
  if (img) {
    const k = Math.max(w / img.size.width, h / img.size.height);
    const iw = img.size.width * k, ih = img.size.height * k;
    dc.drawImageInRect(img, new Rect((w - iw) / 2, 0, iw, ih));      // keep the top (logo, faces)
  }
  const bands = 40;
  for (let i = 0; i < bands; i++) {                                    // a gradient, band by band
    const t = i / (bands - 1);
    dc.setFillColor(new Color("#1b0f30", Math.min(0.92, Math.pow(t, 1.6) * 1.05)));
    dc.fillRect(new Rect(0, h * (0.35 + 0.65 * t), w, h * 0.65 / bands + 1));
  }
  return dc.getImage();
}

function text(stack, s, font, color) {
  const t = stack.addText(s);
  t.font = font;
  t.textColor = color;
  t.shadowColor = new Color("#000000", 0.55);
  t.shadowRadius = 4;
  t.shadowOffset = new Point(0, 1);
  t.minimumScaleFactor = 0.6;
  t.lineLimit = 1;
  return t;
}

async function build() {
  const family = config.widgetFamily || "medium";
  const size = { small: [400, 400], medium: [800, 380], large: [800, 840] }[family] || [800, 380];
  const big = family === "small" ? 44 : family === "large" ? 84 : 58;

  const w = new ListWidget();
  w.backgroundImage = background(await artwork(), size[0], size[1]);
  w.setPadding(12, 16, 14, 16);
  w.url = "homeassistant://navigate/ha-show-native/home";
  w.addSpacer();

  const now = new Date();
  if (now >= TARGET) {
    text(w, DONE, Font.heavySystemFont(big * 0.8), HOT);
    return w;
  }
  const days = Math.floor((TARGET - now) / 864e5);
  const dayEnds = new Date(TARGET.getTime() - days * 864e5);          // when the day count drops

  const row = w.addStack();
  row.bottomAlignContent();
  if (days > 0) {
    text(row, String(days), Font.heavyRoundedSystemFont(big), HOT);
    row.addSpacer(6);
    const unit = row.addStack();
    unit.layoutVertically();
    text(unit, days === 1 ? "DAY" : "DAYS", Font.heavySystemFont(big * 0.3), PINK);
    unit.addSpacer(big * 0.14);
    row.addSpacer(12);
  }
  const tick = row.addDate(dayEnds);
  tick.applyTimerStyle();
  tick.font = Font.boldMonospacedSystemFont(days > 0 ? big * 0.42 : big * 0.8);
  tick.textColor = days > 0 ? WHITE : HOT;
  tick.shadowColor = new Color("#000000", 0.55);
  tick.shadowRadius = 4;
  tick.minimumScaleFactor = 0.6;
  tick.lineLimit = 1;

  if (family !== "small") {
    w.addSpacer(2);
    text(w, WHEN, Font.semiboldSystemFont(12), new Color("#ffffff", 0.8));
  }
  w.refreshAfterDate = dayEnds;                                        // redraw as the day count drops
  return w;
}

const widget = await build();
if (config.runsInWidget) Script.setWidget(widget);
else await widget.presentMedium();
Script.complete();
