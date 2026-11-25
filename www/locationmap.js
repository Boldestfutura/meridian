// The location detail's map in Meridian's own colours: MapLibre GL drawing OpenFreeMap's vector tiles
// (OpenMapTiles schema, free, no key) with the style below, the spot as a blue dot with its GPS
// accuracy around it. MapLibre loads from unpkg the first time a map opens. While it draws the box is
// plain Meridian ground; the grey raster map locMap() (www/detail.js) puts inside the element only
// shows if WebGL or the network isn't there.
const GL_JS = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js";
const TILES = "https://tiles.openfreemap.org";
let glLoad = null;
function loadGL() {
  if (window.maplibregl) return Promise.resolve(window.maplibregl);
  return glLoad || (glLoad = new Promise((ok, no) => {
    const s = document.createElement("script");
    s.src = GL_JS;
    s.onload = () => (window.maplibregl ? ok(window.maplibregl) : no(new Error("no maplibregl")));
    s.onerror = (e) => { glLoad = null; s.remove(); no(e); };
    document.head.appendChild(s);
  }));
}

export function meridianStyle(dark) {
  const P = dark ? {
    bg: "#131a29", res: "#151d2d", park: "#16271f", wood: "#172a22", water: "#1b2c52", building: "#1a2335",
    minor: "#222c40", major: "#2b3750", motor: "#34477a", rail: "#2a3346", label: "#8e99b0", halo: "#131a29", wlabel: "#6b9bff",
  } : {
    bg: "#eaf0f9", res: "#e4ebf6", park: "#d8ebdf", wood: "#d3e7da", water: "#b9cff5", building: "#dbe3f0",
    minor: "#ffffff", major: "#ffffff", motor: "#c9d8f8", rail: "#cfd8e8", label: "#6c7891", halo: "#eaf0f9", wlabel: "#1d5cf0",
  };
  const w = (a, b) => ["interpolate", ["exponential", 1.5], ["zoom"], 10, a, 18, b];
  const road = (id, classes, color, width, minz) => ({ id, type: "line", source: "omt", "source-layer": "transportation", minzoom: minz || 0,
    filter: ["in", ["get", "class"], ["literal", classes]], layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": color, "line-width": width } });
  return {
    version: 8, glyphs: TILES + "/fonts/{fontstack}/{range}.pbf",
    sources: { omt: { type: "vector", url: TILES + "/planet" } },
    layers: [
      { id: "bg", type: "background", paint: { "background-color": P.bg } },
      { id: "res", type: "fill", source: "omt", "source-layer": "landuse", filter: ["==", ["get", "class"], "residential"], paint: { "fill-color": P.res } },
      { id: "wood", type: "fill", source: "omt", "source-layer": "landcover", filter: ["in", ["get", "class"], ["literal", ["wood", "grass"]]], paint: { "fill-color": P.wood } },
      { id: "park", type: "fill", source: "omt", "source-layer": "park", paint: { "fill-color": P.park } },
      { id: "water", type: "fill", source: "omt", "source-layer": "water", paint: { "fill-color": P.water } },
      { id: "waterway", type: "line", source: "omt", "source-layer": "waterway", paint: { "line-color": P.water, "line-width": w(0.5, 4) } },
      { id: "building", type: "fill", source: "omt", "source-layer": "building", minzoom: 14, paint: { "fill-color": P.building } },
      { id: "rail", type: "line", source: "omt", "source-layer": "transportation", filter: ["==", ["get", "class"], "rail"], paint: { "line-color": P.rail, "line-width": w(0.5, 2) } },
      road("minor", ["minor", "service"], P.minor, w(0.4, 8), 12),
      road("major", ["secondary", "tertiary"], P.major, w(0.8, 12)),
      road("trunk", ["primary", "trunk"], P.major, w(1.2, 15)),
      road("motorway", ["motorway"], P.motor, w(1.5, 16)),
      { id: "water-name", type: "symbol", source: "omt", "source-layer": "water_name",
        layout: { "text-field": ["get", "name:latin"], "text-font": ["Noto Sans Italic"], "text-size": 11 },
        paint: { "text-color": P.wlabel, "text-halo-color": P.halo, "text-halo-width": 1.2, "text-opacity": 0.8 } },
      { id: "road-name", type: "symbol", source: "omt", "source-layer": "transportation_name", minzoom: 13,
        filter: ["in", ["get", "class"], ["literal", ["primary", "secondary", "trunk", "tertiary"]]],
        layout: { "symbol-placement": "line", "text-field": ["get", "name:latin"], "text-font": ["Noto Sans Regular"], "text-size": 10 },
        paint: { "text-color": P.label, "text-halo-color": P.halo, "text-halo-width": 1.2 } },
      { id: "place", type: "symbol", source: "omt", "source-layer": "place",
        filter: ["in", ["get", "class"], ["literal", ["suburb", "neighbourhood", "town", "village", "city"]]],
        layout: { "text-field": ["upcase", ["get", "name:latin"]], "text-font": ["Noto Sans Bold"], "text-size": 10, "text-letter-spacing": 0.08 },
        paint: { "text-color": P.label, "text-halo-color": P.halo, "text-halo-width": 1.5 } },
    ],
  };
}

const CSS = `
  :host { display: block; position: relative; overflow: hidden; background: #eaf0f9; }
  :host([dark]) { background: #131a29; }
  #gl { position: absolute; inset: 0; z-index: 2; opacity: 0; transition: opacity 0.35s ease; }
  :host([ready]) #gl { opacity: 1; }
  /* the grey raster map inside is only the fallback: hidden unless the vector map can't draw */
  slot { visibility: hidden; }
  :host([fallback]) slot { visibility: visible; }
  :host([fallback]) #gl { display: none; }
  .maplibregl-canvas { position: absolute; left: 0; top: 0; }
  .maplibregl-marker { position: absolute; left: 0; top: 0; will-change: transform; }
  .acc { border-radius: 50%; background: color-mix(in srgb, var(--accent) 18%, transparent);
         border: 1px solid color-mix(in srgb, var(--accent) 45%, transparent); box-sizing: border-box; }
  .dot { width: 16px; height: 16px; border-radius: 50%; background: var(--accent); border: 3px solid #fff;
         box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35); box-sizing: border-box; }
  .home { width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; background: #fff; color: #3f8f63;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3); --mdc-icon-size: 16px; }
  .credit { position: absolute; right: 8px; bottom: 5px; font: 9px/1.4 var(--body, system-ui); color: var(--muted); opacity: 0.8; }
`;

// data: { dark, lat, lon, acc (metres), home: [lat, lon] | null }
class MeridianLocationMap extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML = `<style>${CSS}</style><slot></slot><div id="gl"></div>`;
  }
  set data(d) { this._d = d; this.toggleAttribute("dark", !!d.dark); this._draw(); }
  connectedCallback() {
    this._draw();
    clearTimeout(this._late);
    this._late = setTimeout(() => { if (!this.hasAttribute("ready")) this.setAttribute("fallback", ""); }, 8000);
  }
  disconnectedCallback() {
    clearTimeout(this._late);
    if (this._map) { this._map.remove(); this._map = null; this._key = null; this.removeAttribute("ready"); }
  }
  async _draw() {
    if (!this._d || !this.isConnected) return;
    if (!this._map) {
      if (this._loading) return;
      this._loading = true;
      try {
        const gl = await loadGL();
        if (!this.isConnected || this._map) return;
        const box = this.shadowRoot.getElementById("gl");
        this._dark = this._d.dark;
        this._map = new gl.Map({ container: box, style: meridianStyle(this._dark), interactive: false,
                                 attributionControl: false, fadeDuration: 0, center: [this._d.lon, this._d.lat], zoom: 14 });
        this._map.once("idle", () => { this.removeAttribute("fallback"); this.setAttribute("ready", ""); });
        this._map.on("error", (e) => console.debug("meridian map:", e && e.error && e.error.message));
        const cr = document.createElement("small");
        cr.className = "credit"; cr.textContent = "OpenFreeMap © OpenMapTiles © OpenStreetMap";
        box.appendChild(cr);
      } catch (e) { console.warn("meridian map: no vector map, showing the raster one", e); this.setAttribute("fallback", ""); return; }
      finally { this._loading = false; }
    }
    const d = this._d, m = this._map, gl = window.maplibregl;
    const key = JSON.stringify(d);
    if (key === this._key) return;
    this._key = key;
    if (d.dark !== this._dark) { this._dark = d.dark; m.setStyle(meridianStyle(d.dark)); }
    m.resize();
    m.jumpTo({ center: [d.lon, d.lat], zoom: 14 });
    (this._marks || []).forEach((x) => x.remove());
    const mark = (cls, ll, size) => {
      const el = document.createElement("span");
      el.className = cls;
      if (size) { el.style.width = el.style.height = `${size}px`; }
      if (cls === "home") el.innerHTML = `<ha-icon icon="mdi:home"></ha-icon>`;
      return new gl.Marker({ element: el }).setLngLat(ll).addTo(m);
    };
    // MapLibre's world is 512 px wide at zoom 0, so its 14 frames like the raster tiles' 15
    const mpp = (40075016.686 * Math.cos((d.lat * Math.PI) / 180)) / (512 * 2 ** 14);
    this._marks = [];
    if (d.home) {   // not when it would sit under the dot (they're home)
      const a = m.project([d.lon, d.lat]), b = m.project([d.home[1], d.home[0]]);
      if (Math.hypot(a.x - b.x, a.y - b.y) > 18) this._marks.push(mark("home", [d.home[1], d.home[0]]));
    }
    this._marks.push(mark("acc", [d.lon, d.lat], 2 * Math.max(10, d.acc / mpp)), mark("dot", [d.lon, d.lat]));
  }
}
if (!customElements.get("meridian-location-map")) customElements.define("meridian-location-map", MeridianLocationMap);
