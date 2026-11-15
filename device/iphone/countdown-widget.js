// Countdown home-screen widget for Scriptable (iOS). Big days left over artwork, with the
// hours, minutes and seconds ticking live (iOS draws the timer, so it moves between refreshes).
// Set it up: Scriptable > + > paste this > name it; home screen > add a Scriptable widget
// (small, medium or large) > Edit Widget > Script: this one.
// The artwork is fetched once from Home Assistant over Tailscale and kept on the phone, so the
// widget still draws when the phone is off the tailnet. Change ART to a new file name to refetch.
// The lettering is Pricedown (Typodermic), installed on the phone as a font profile; without it
// iOS falls back to the system font. The font is not in this repo: its licence forbids sharing it.

const TARGET = new Date("2026-11-19T00:00:00+11:00");   // GTA VI, midnight in Melbourne
const ART = "http://homeassistant.taild8548.ts.net:8123/local/gta6/gta6-clean.jpg";
const WHEN = "Thursday 19 November · 12:00 am";
const DONE = "Out now";
const HOT = new Color("#ffb35c"), WHITE = Color.white(), SHADE = "#1b0f30";
const GTA = (size) => new Font("Pricedown-Black", size);

async function artwork() {
  const fm = FileManager.local();
  const path = fm.joinPath(fm.documentsDirectory(), "countdown-" + ART.split("/").pop());
  if (!fm.fileExists(path)) {
    try { fm.writeImage(path, await new Request(ART).loadImage()); } catch (e) { return null; }
  }
  return fm.readImage(path);
}

// The art cropped to fill the widget at the screen's real pixel size, fading into purple at the
// bottom where the numbers go. The fade is drawn one pixel row at a time so it has no seams.
function background(img, wPt, hPt) {
  const s = Device.screenScale();
  const w = Math.round(wPt * s), h = Math.round(hPt * s);
  const dc = new DrawContext();
  dc.size = new Size(w, h);
  dc.opaque = true;
  dc.respectScreenScale = false;
  dc.setFillColor(new Color(SHADE));
  dc.fillRect(new Rect(0, 0, w, h));
  if (img) {
    const k = Math.max(w / img.size.width, h / img.size.height);
    const iw = img.size.width * k, ih = img.size.height * k;
    dc.drawImageInRect(img, new Rect((w - iw) / 2, (h - ih) * 0.2, iw, ih));
  }
  const top = Math.round(h * 0.42);
  for (let y = top; y < h; y++) {
    const t = (y - top) / (h - top);
    dc.setFillColor(new Color(SHADE, Math.min(0.9, Math.pow(t, 1.4) * 0.95)));
    dc.fillRect(new Rect(0, y, w, 1));
  }
  return dc.getImage();
}

function style(t, font, color) {
  t.font = font;
  t.textColor = color;
  t.shadowColor = new Color("#000000", 0.6);
  t.shadowRadius = 5;
  t.shadowOffset = new Point(0, 1);
  t.minimumScaleFactor = 0.6;
  t.lineLimit = 1;
  return t;
}

async function build() {
  const family = config.widgetFamily || "medium";
  const size = { small: [170, 170], medium: [364, 170], large: [364, 382] }[family] || [364, 170];
  const big = family === "small" ? 50 : family === "large" ? 84 : 60;

  const w = new ListWidget();
  w.backgroundImage = background(await artwork(), size[0], size[1]);
  w.setPadding(10, 14, 12, 14);
  w.url = "homeassistant://navigate/ha-show-native/home";
  style(w.addText("GTA VI"), GTA(big * 0.32), WHITE);
  w.addSpacer();

  const now = new Date();
  if (now >= TARGET) {
    style(w.addText(DONE), GTA(big * 0.7), HOT);
    return w;
  }
  const days = Math.floor((TARGET - now) / 864e5);
  const dayEnds = new Date(TARGET.getTime() - days * 864e5);          // when the day count drops

  if (days > 0) {
    const row = w.addStack();
    row.bottomAlignContent();
    style(row.addText(String(days)), GTA(big), HOT);
    row.addSpacer(4);
    const unit = row.addStack();
    unit.layoutVertically();
    style(unit.addText(days === 1 ? "DAY" : "DAYS"), GTA(big * 0.38), HOT);
    unit.addSpacer(big * 0.13);
  }
  const tick = w.addDate(dayEnds);
  tick.applyTimerStyle();
  style(tick, GTA(days > 0 ? big * 0.48 : big * 0.8), days > 0 ? WHITE : HOT);

  if (family !== "small") {
    w.addSpacer(3);
    style(w.addText(WHEN), GTA(13), new Color("#ffffff", 0.8));
  }
  w.refreshAfterDate = dayEnds;                                        // redraw as the day count drops
  return w;
}

const widget = await build();
if (config.runsInWidget) Script.setWidget(widget);
else await widget.presentSmall();
Script.complete();
