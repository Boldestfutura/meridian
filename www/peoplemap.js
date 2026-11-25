// The person pop-ups' map in Meridian's own colours: MapLibre GL drawing OpenFreeMap's vector tiles
// (OpenMapTiles schema, free, no key) with the style below. MapLibre loads from unpkg the first time a
// map opens. The grey raster map peopleMap() (www/detail.js) puts inside the element shows until this
// one has drawn, and stays if WebGL or the network isn't there.
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
  :host { display: block; position: relative; border-radius: 22px; overflow: hidden; background: #eaf0f9; }
  :host([dark]) { background: #131a29; }
  #gl { position: absolute; inset: 0; z-index: 2; opacity: 0; transition: opacity 0.35s ease; }
  :host([ready]) #gl { opacity: 1; }
  /* the grey raster map inside is only the fallback: hidden unless the vector map can't draw */
  slot { visibility: hidden; }
  :host([fallback]) slot { visibility: visible; }
  :host([fallback]) #gl { display: none; }
  .maplibregl-canvas { position: absolute; left: 0; top: 0; }
  .maplibregl-marker { position: absolute; left: 0; top: 0; will-change: transform; }
  .pin { display: flex; flex-direction: column; align-items: center; gap: 3px; }
  .pin i { position: relative; width: 36px; height: 36px; border-radius: 50%; border: 3px solid #fff; background: var(--pin) center / cover;
           display: grid; place-items: center; color: #fff; font: 700 16px/1 var(--body, system-ui); font-style: normal;
           box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35); box-sizing: border-box; }
  .pin em { position: absolute; right: -7px; bottom: -5px; width: 18px; height: 18px; border-radius: 50%; display: grid; place-items: center;
            background: #fff; color: #3f8f63; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3); --mdc-icon-size: 12px; }
  .pin b { font: 700 11px/1.3 var(--body, system-ui); padding: 2px 7px; border-radius: 999px; background: var(--card); color: var(--ink);
           box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25); white-space: nowrap; backdrop-filter: blur(8px); }
  .home { width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; background: #fff; color: #3f8f63;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3); --mdc-icon-size: 16px; }
  .credit { position: absolute; right: 8px; bottom: 5px; font: 9px/1.4 var(--body, system-ui); color: var(--muted); opacity: 0.8; }
`;

// data: { dark, pins: [{ lat, lon, name, pic, colour, home, dx }], home: [lat, lon] | null, showHome }
class MeridianPeopleMap extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML =
      `<style>${CSS}</style><slot></slot><div id="gl"></div>`;
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
                                 attributionControl: false, fadeDuration: 0 });
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
    (this._marks || []).forEach((x) => x.remove());
    this._marks = d.pins.map((p) => {
      const el = document.createElement("span"), i = document.createElement("i"), b = document.createElement("b");
      el.className = "pin"; el.style.setProperty("--pin", p.colour);
      if (p.pic) i.style.backgroundImage = `url("${p.pic}")`; else i.textContent = p.name[0] || "";
      if (p.home) { const em = document.createElement("em"); em.innerHTML = `<ha-icon icon="mdi:home"></ha-icon>`; i.appendChild(em); }
      b.textContent = p.name; el.append(i, b);
      return new gl.Marker({ element: el, anchor: "top", offset: [p.dx || 0, -21] }).setLngLat([p.lon, p.lat]).addTo(m);
    });
    if (d.home && d.showHome) {
      const el = document.createElement("span");
      el.className = "home"; el.innerHTML = `<ha-icon icon="mdi:home"></ha-icon>`;
      this._marks.push(new gl.Marker({ element: el }).setLngLat([d.home[1], d.home[0]]).addTo(m));
    }
    const pts = d.pins.map((p) => [p.lon, p.lat]).concat(d.home ? [[d.home[1], d.home[0]]] : []);
    const lo = [Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1]))];
    const hi = [Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1]))];
    m.resize();
    m.fitBounds([lo, hi], { padding: { top: 36, bottom: 64, left: 70, right: 70 }, maxZoom: 15.5, animate: false });
  }
}
if (!customElements.get("meridian-people-map")) customElements.define("meridian-people-map", MeridianPeopleMap);
