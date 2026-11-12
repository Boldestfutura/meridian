// Pip, the tamagotchi sprout: the drawing engine shared by the Meridian Pip card and the
// mock-up page. A 64 x 64 palette grid, procedurally drawn about 20 times a second; nothing
// is copied from Muse's Jollybot avatar, whose code and art aren't open-licensed.
// createPip() returns one independent Pip; pipFrame() paints it into a canvas.

export function createPip() {
  // ---- states --------------------------------------------------------------
  const STATES = {
    idle:      { name: "Idle", group: "voice", hue: "#8fdc8a", what: "Blinks, breathes, leaves sway, pollen drifts up. Hands float beside it, bobbing out of step.", src: "Nothing else going on.", status: "" },
    listening: { name: "Listening", group: "voice", hue: "#5aa0ff", what: "Wide eyes, leaves perk up, sound rings pulse in from both sides. One hand cupped to its ear.", src: "Wake word heard (voice assistant: listening).", status: "LISTENING" },
    thinking:  { name: "Thinking", group: "voice", hue: "#b48cff", what: "Leaves spin like a propeller, eyes glance up, three motes orbit its head. One hand taps its chin.", src: "Speech sent, Claude is working on the reply.", status: "THINKING" },
    speaking:  { name: "Speaking", group: "voice", hue: "#ffc861", what: "Mouth moves with the reply, glow pulses with it. Hands gesture as it talks.", src: "Kokoro reply playing on the speaker.", status: "" },
    happy:     { name: "Happy", group: "mood", hue: "#ff8fb8", what: "Bounces with squash and stretch, petals and sparkles fly. Both hands up, wiggling.", src: "You pet it, you got home, or every stat is above 70%.", status: "YAY" },
    hungry:    { name: "Hungry", group: "mood", hue: "#f0a35a", what: "Tummy rumbles and shakes it, mouth open, eyes fixed on a bobbing apple. Rubs its tummy.", src: "Food below 30%. Just for fun: it drains over a day. Tap the apple, or tick things off the shopping list.", status: "HUNGRY" },
    thirsty:   { name: "Thirsty", group: "mood", hue: "#52d1d9", what: "Leaves droop, heavy eyelids, a water drop bobs over its head. Hands hang limp.", src: "A real plant is dry: soil moisture sensor 1 or 2 under 25%. Water the plant and Pip perks up.", status: "THIRSTY" },
    sleepy:    { name: "Sleepy", group: "mood", hue: "#6a6ff0", what: "Eyes shut, slow breathing, Zs drift up, the screen dims. Hands hang low and cover a yawn now and then.", src: "Late evening, from 9:30 pm until you go to bed, or whenever its rest stat runs low.", status: "SLEEPY" },
    asleep:    { name: "Asleep", group: "mood", hue: "#4b4fc4", what: "Tucked up on its side: head on a pillow, a quilt over it that rises and falls with its breathing, a nightcap with a pom-pom. Zs drift up and the screen dims further.", src: "You've gone to bed: Sleep Sounds on, or the bedroom dark after 10 pm. It stays in bed until morning or the lights come on.", status: "ZZZ" },
    sad:       { name: "Sad", group: "mood", hue: "#6f9bd8", what: "Big wet eyes and worried brows, a tear rolls down, one hand rubs its eye, leaves droop. Every tap sends up a heart, and three quick taps cheer it up.", src: "Nobody has petted it for 12 hours. Three quick taps on the screen (or Pet on your phone) bring it back.", status: "SAD" },
    angry:     { name: "Angry", group: "mood", hue: "#ff4d3a", what: "Arms crossed, brows down, cheeks puffed red, steam puffs out of its head and it stamps its feet. An anger mark throbs above it.", src: "Neglected: its fun stat under 15%, or nobody has talked to it or petted it for 2 days. A pet or a chat calms it down.", status: "GRR" },
    hot:       { name: "Hot", group: "home", hue: "#ff5a3c", what: "Flushed red, panting with its tongue out, sweat drop, heat shimmer above. Fans its face.", src: "Kitchen over 28 °C (Air Quality Monitor temperature).", status: "TOO HOT" },
    cold:      { name: "Cold", group: "home", hue: "#bfeaff", what: "Tinted blue, shivers in bursts, teeth chatter, wears a scarf, snow falls. Hugs itself.", src: "Kitchen under 17 °C.", status: "BRRR" },
    stuffy:    { name: "Stuffy air", group: "home", hue: "#b5c26a", what: "Murky haze drifts past, squinting eyes, little coughs. Waves the air away and covers its coughs.", src: "Kitchen VOC index over 250 or PM2.5 over 35, usually cooking. Open a window.", status: "STUFFY" },
    rain:      { name: "Raining", group: "home", hue: "#7aa3c9", what: "Shelters under a tiny umbrella while rain falls round it. Holds the umbrella.", src: "The home forecast says rainy or pouring.", status: "RAINING" },
    music:     { name: "Music", group: "home", hue: "#ff6fd8", what: "Dances side to side on the beat, eyes closed, notes float up. Pumps its hands to the beat.", src: "Music Assistant is playing in the room.", status: "DANCING" },
    guests:    { name: "Guests", group: "home", hue: "#ffe680", what: "Waves a leaf, big eyes, grin, confetti. Waves a hand and a leaf.", src: "Guest mode is on.", status: "HI!" },
    error:     { name: "Can't connect", group: "home", hue: "#ff6b6b", what: "Greyed out and wilted under a little rain cloud. Hands flopped on the floor.", src: "Home Assistant or the Claude pipeline can't be reached.", status: "NO SIGNAL" },
  };
  const STAGES = ["Seed", "Sprout", "Sapling", "Bloom"];
  const STATS = { // water, food, fun, rest
    idle: [.72, .8, .7, .75], listening: [.72, .8, .78, .75], thinking: [.72, .8, .78, .75], speaking: [.72, .8, .82, .75],
    happy: [.9, .9, 1, .85], thirsty: [.15, .62, .45, .6], sleepy: [.66, .7, .64, .18], error: [.6, .6, .5, .6],
    hungry: [.7, .12, .5, .6], asleep: [.66, .7, .64, .4], sad: [.7, .75, .25, .6], angry: [.5, .45, .06, .5], hot: [.4, .7, .5, .5], cold: [.7, .7, .5, .6], stuffy: [.7, .7, .45, .6],
    rain: [.75, .8, .7, .75], music: [.72, .8, 1, .7], guests: [.72, .8, .95, .7],
  };
  const STAT_COL = ["#59b8ff", "#ffb547", "#ff7fb0", "#9a8cff"];

  let state = "idle", stage = 2, petUntil = -1, hearts = [];

  // ---- palette ---------------------------------------------------------------
  const I = { BG: 0, OUT: 1, BD: 2, BM: 3, BL: 4, BH: 5, BEL: 6, BELD: 7, RIM: 8, EYE: 9, SHINE: 10, BLUSH: 11,
    MOUTH: 12, TONGUE: 13, STEM: 14, LD: 15, LM: 16, LL: 17, PET: 18, PETC: 19, G0: 20, G1: 21, G2: 22, G3: 23,
    SPK: 24, SHADOW: 25, DROP: 26, DROPL: 27, CLOUD: 28, ZZ: 29,
    SCARF: 30, SCARF2: 31, SNOW: 32, SWEAT: 33, HAZE: 34, FOOD: 35, FOODL: 36, UMB: 37, UMB2: 38, CONF: 39,
    PIL: 40, PILD: 41, BLK1: 42, BLK2: 43, BLKL: 44, CAP: 45, CAP2: 46, POM: 47 };
  const BASE = {
    BG: "#000000", OUT: "#16241a", BD: "#4c7a3a", BM: "#6b9c4a", BL: "#90bf5e", BH: "#bfe085",
    BEL: "#eef3c9", BELD: "#cfdd9c", EYE: "#132018", SHINE: "#ffffff", BLUSH: "#f28b86", MOUTH: "#3b1d1f",
    TONGUE: "#e7686d", STEM: "#58883a", LD: "#2f6a33", LM: "#4f9c45", LL: "#86cf63", PET: "#f7b9d6", PETC: "#f8d462",
    SHADOW: "#141c15", DROP: "#4aa5ff", DROPL: "#bfe3ff", CLOUD: "#7d8590", ZZ: "#b9bcff",
    SCARF: "#d6453d", SCARF2: "#f3e7cf", SNOW: "#eef8ff", SWEAT: "#9fd8ff", HAZE: "#5d6640", FOOD: "#e2453c",
    FOODL: "#7ccf5a", UMB: "#e8554e", UMB2: "#f7c948", CONF: "#7fe0ff",
    PIL: "#ece8f4", PILD: "#b4adc9", BLK1: "#4a5fc4", BLK2: "#6f86e2", BLKL: "#e6eafb", CAP: "#7a58d4", CAP2: "#a88df2", POM: "#f6f3ff",
  };
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  function palette(st) {
    const hue = hex(STATES[st].hue), black = [0, 0, 0];
    const p = new Array(48);
    for (const [k, v] of Object.entries(BASE)) p[I[k]] = hex(v);
    p[I.RIM] = mix(hex(BASE.BL), hue, .7);
    p[I.G0] = hue; p[I.G1] = mix(hue, black, .5); p[I.G2] = mix(hue, black, .72); p[I.G3] = mix(hue, black, .86);
    p[I.SPK] = mix(hue, [255, 255, 255], .45);
    if (st === "error") for (const k of ["BD", "BM", "BL", "BH", "BEL", "BELD", "STEM", "LD", "LM", "LL", "BLUSH", "RIM"]) {
      const c = p[I[k]], g = c[0] * .3 + c[1] * .59 + c[2] * .11; p[I[k]] = mix(c, [g, g, g], .7);
    }
    const tint = { cold: [[150, 205, 255], .3], hot: [[255, 110, 70], .24], angry: [[255, 80, 55], .2], sad: [[110, 140, 230], .16], stuffy: [[140, 150, 80], .22] }[st];
    if (tint) for (const k of ["BD", "BM", "BL", "BH", "BEL", "BELD", "STEM", "LD", "LM", "LL", "RIM"]) p[I[k]] = mix(p[I[k]], tint[0], tint[1]);
    const dim = st === "asleep" ? .45 : st === "sleepy" ? .6 : 1;
    return p.map(c => c.map(v => Math.round(v * dim)));
  }

  // ---- the 64 x 64 frame -------------------------------------------------------
  const N = 64, pix = new Uint8Array(N * N), solid = new Uint8Array(N * N);
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + .5) / 16);
  const bay = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];
  const inb = (x, y) => x >= 0 && y >= 0 && x < N && y < N;
  function put(x, y, c) { x = Math.floor(x); y = Math.floor(y); if (inb(x, y)) pix[y * N + x] = c; }
  function putS(x, y, c) { x = Math.floor(x); y = Math.floor(y); if (inb(x, y)) { pix[y * N + x] = c; solid[y * N + x] = 1; } }
  function putBg(x, y, c) { x = Math.floor(x); y = Math.floor(y); if (inb(x, y) && !solid[y * N + x]) pix[y * N + x] = c; }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function leaf(ax, ay, dx, dy, len, wid, light) {
    // a leaf from (ax, ay) along unit (dx, dy): pointed at both ends, midrib dark, lit half light
    if (len < .6) return;
    const px = -dy, py = dx;
    const x0 = Math.floor(Math.min(ax, ax + dx * len) - wid - 1), x1 = Math.ceil(Math.max(ax, ax + dx * len) + wid + 1);
    const y0 = Math.floor(Math.min(ay, ay + dy * len) - wid - 1), y1 = Math.ceil(Math.max(ay, ay + dy * len) + wid + 1);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const rx = x + .5 - ax, ry = y + .5 - ay;
      const u = (rx * dx + ry * dy) / len, v = rx * px + ry * py;
      if (u < 0 || u > 1) continue;
      const hw = wid * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.08)), .75);
      if (Math.abs(v) > hw) continue;
      let c = Math.abs(v) < .55 && u < .85 ? I.LD : (v * light > 0 ? I.LL : I.LM);
      putS(x, y, c);
    }
  }

  function zGlyph(x, y, s) {
    for (let i = 0; i < s; i++) { put(x + i, y, I.ZZ); put(x + i, y + s - 1, I.ZZ); put(x + s - 1 - i, y + i, I.ZZ); }
  }

  // asleep: lying on its side in bed, so it gets its own drawing instead of the standing one
  function drawSleep(t) {
    const breathe = Math.sin(t * 1.2);
    const ground = 49, cx = 36, rx = 11.5, ry = 9.2 * (1 + breathe * .035), cy = ground - ry;
    const topAt = (x) => { const u = (x + .5 - cx) / rx; return Math.abs(u) < 1 ? cy - ry * Math.sqrt(1 - u * u) : ground; };

    // a faint glow, and the shadow under the bed
    const A = .3 + .05 * breathe;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const d = Math.hypot((x + .5 - (cx - 3)) / (rx + 8), (y + .5 - (cy - 1)) / (ry + 6));
      if (d < 1) continue;
      const g = A * Math.exp(-(d - 1) * 2.6), b = bay(x, y);
      if (g > .34 + b * .25) put(x, y, I.G2); else if (g > .13 + b * .15) put(x, y, I.G3);
    }
    for (let x = cx - rx - 6; x <= cx + rx + 2; x++) { put(x, ground + 1, I.SHADOW); if (x > cx - rx - 4 && x < cx + rx) put(x, ground + 2, I.SHADOW); }

    // pillow under the head, at the left
    const p0 = cx - rx - 6, p1 = cx - rx + 7, q0 = ground - 6;
    for (let y = q0; y <= ground; y++) for (let x = p0; x <= p1; x++) {
      const cxn = Math.min(x - p0, p1 - x), cyn = Math.min(y - q0, ground - y);
      if (cxn + cyn < 2) continue;                                   // rounded corners
      putS(x, y, y > ground - 2 || x < p0 + 2 || (y - q0 + x) % 7 === 0 ? I.PILD : I.PIL);
    }

    // the body: the same lit, dithered egg, lying down with its head end at the left
    for (let y = Math.floor(cy - ry - 1); y <= ground; y++) for (let x = cx - rx - 1; x <= cx + rx + 1; x++) {
      const nx0 = (x + .5 - cx) / rx, ny = (y + .5 - cy) / ry;
      const nx = nx0 < 0 ? nx0 * .97 : nx0 * 1.05;
      const d = nx * nx + ny * ny; if (d > 1) continue;
      const nz = Math.sqrt(1 - d), L = clamp(-.42 * nx - .55 * ny + .72 * nz, 0, 1);
      putS(x, y, [I.BD, I.BM, I.BL, I.BH][clamp(Math.round(L * 3.2 + (bay(x, y) - .5) * .95), 0, 3)]);
    }

    // the quilt: over everything right of the face, draped to the floor, folded sheet along its edge
    const hem = cx + 2;
    for (let y = Math.floor(cy - ry - 2); y <= ground; y++) for (let x = hem - 3; x <= cx + rx + 4; x++) {
      const nx = (x + .5 - cx) / (rx + 1.6), ny = (y + .5 - cy) / (ry + 1.6);
      const inBody = nx * nx + Math.min(0, ny) ** 2 <= 1 || (y > cy && x < cx + rx + 3);
      const edge = hem + Math.round((y - cy) * .35);                 // tucked in at a slant
      if (!inBody || x < edge) continue;
      if (x > cx + rx + 1 && y < cy + (x - cx - rx) * 2.4) continue; // drape falls away at the foot
      let c;
      if (x <= edge + 1) c = I.BLKL;
      else c = ((x + y) >> 2) & 1 ? I.BLK1 : I.BLK2;
      if (c !== I.BLKL && y > ground - 3 && bay(x, y) < .5) c = I.BLK1;
      putS(x, y, c);
    }

    // nightcap on the head: a white brim, then a striped cone that curls back with a pom-pom
    const hx = Math.round(cx - rx + 6.5);                                          // middle of the head
    for (let x = hx - 6; x <= hx + 4; x++) { const yt = Math.round(topAt(x)); putS(x, yt, I.POM); putS(x, yt + 1, I.POM); }
    const sw = Math.sin(t * 1.2) * .6;
    let tipX = 0, tipY = 0;
    for (let k = 0; k <= 30; k++) {
      const u = k / 30;
      const x = hx - 1 - u * 7 - u * u * 3, y = topAt(hx - 1) - 1 - u * 7 + u * u * 6 + sw * u * u;
      const r = 3.2 * (1 - u) + .6;
      for (let dy = -r; dy <= r; dy += .5) for (let dx = -r; dx <= r; dx += .5)
        if (dx * dx + dy * dy <= r * r && y + dy < topAt(x + dx) - .5) putS(x + dx, y + dy, Math.floor(u * 6) % 2 ? I.CAP2 : I.CAP);
      tipX = x; tipY = y;
    }
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx * dx + dy * dy <= 2) putS(tipX + dx - 1, tipY + dy + 1, I.POM);
    leaf(hx + 4, topAt(hx + 4) - .5, .75, -.66, 4.5, 1.7, 1);         // a leaf pokes out under the brim

    // outline round every solid shape
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (solid[y * N + x]) continue;
      if ((x > 0 && solid[y * N + x - 1]) || (x < N - 1 && solid[y * N + x + 1]) || (y > 0 && solid[(y - 1) * N + x]) || (y < N - 1 && solid[(y + 1) * N + x]))
        pix[y * N + x] = I.OUT;
    }

    // face on the pillow: closed eyes, blush, a mouth that opens on each breath
    const ey = Math.round(cy - 1);
    for (const ex of [hx - 5, hx]) { put(ex - 1, ey, I.EYE); put(ex, ey + 1, I.EYE); put(ex + 1, ey + 1, I.EYE); put(ex + 2, ey, I.EYE); }
    for (const bx of [hx - 7, hx + 2]) { put(bx, ey + 3, I.BLUSH); put(bx + 1, ey + 3, I.BLUSH); }
    put(hx - 3, ey + 3, I.MOUTH); put(hx - 2, ey + 3, I.MOUTH);
    if (breathe > .2) { put(hx - 3, ey + 4, I.MOUTH); put(hx - 2, ey + 4, I.MOUTH); }

    // Zs drifting up from the pillow
    for (let i = 0; i < 3; i++) {
      const ph = (t * .28 + i / 3) % 1;
      if (ph > .8 && bay(i, Math.floor(ph * 40)) > .5) continue;
      zGlyph(Math.floor(hx + 6 + ph * 12), Math.floor(cy - ry - 5 - ph * 16), i % 2 ? 4 : 5);
    }
  }

  function draw(t) {
    pix.fill(0); solid.fill(0);
    const pet = t < petUntil;
    const st = pet ? "happy" : state;
    if (st === "asleep") return drawSleep(t);
    const breathe = Math.sin(t * (st === "sleepy" ? 1.2 : 2.2));
    const talk = st === "speaking" ? Math.abs(Math.sin(t * 9.3) * .6 + Math.sin(t * 5.1) * .4) : 0;

    let cx = 32;
    const rx0 = [12.5, 14, 14.5, 14.5][stage], ry0 = rx0 - 1.2;
    if (st === "cold" && (t % 2.4) < 1.3) cx += Math.floor(t * 16) & 1;
    const rumble = st === "hungry" && (t % 3.2) < .5;
    if (rumble) cx += (Math.floor(t * 14) & 1) ? 1 : -1;
    if (st === "music") cx += Math.round(Math.sin(t * Math.PI * 1.8) * 2);
    const stomp = st === "angry" ? (t % 2.2) : 9;
    if (stomp < .5) cx += (Math.floor(t * 18) & 1) ? 1 : -1;
    const ground = 52;
    let rx = rx0, ry = ry0, lift = 0;
    if (st === "happy") {
      const ph = (t * 2.2) % 1, h = Math.sin(ph * Math.PI);
      lift = h * 5;
      const sq = ph < .1 || ph > .92 ? .14 : -.05 * h;
      rx *= 1 + sq; ry *= 1 - sq;
    } else if (st === "music") {
      const ph = (t * 1.8) % 1, b = Math.max(0, 1 - ph * 4);
      rx *= 1 + b * .09; ry *= 1 - b * .09; lift = Math.sin(ph * Math.PI) * 1.5;
    } else {
      const s = breathe * (st === "sleepy" ? .035 : .02) + talk * .03;
      rx *= 1 - s * .5; ry *= 1 + s;
    }
    if (st === "thirsty" || st === "error") { ry *= .96; rx *= 1.02; }
    if (stomp < .5) lift = Math.sin(stomp / .5 * Math.PI) * 2.5;
    if (st === "angry") { rx *= 1.04 + Math.sin(t * 9) * .01; ry *= .97; }   // puffed up
    const cy = ground - ry - lift;

    // aura: dithered glow round the body, on the black
    const A = { idle: .5 + .08 * breathe, listening: .8 + .15 * Math.sin(t * 6), thinking: .65 + .1 * Math.sin(t * 3),
      speaking: .5 + .45 * talk, happy: .8, thirsty: .45, sleepy: .3 + .05 * breathe, error: .4, hungry: .5 + (rumble ? .25 : 0),
      hot: .75 + .1 * Math.sin(t * 4), cold: .55, stuffy: .4, rain: .45, music: .55 + .4 * Math.max(0, 1 - ((t * 1.8) % 1) * 3), guests: .75, sad: .35, angry: .7 + .2 * Math.abs(Math.sin(t * 4)) }[st];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const dx = (x + .5 - cx) / (rx + 2), dy = (y + .5 - (cy - 3)) / (ry + 5);
      const d = Math.hypot(dx, dy);
      if (d < 1) continue;
      const g = A * Math.exp(-(d - 1) * 2.6), b = bay(x, y);
      if (g > .62 + b * .3) put(x, y, I.G1);
      else if (g > .34 + b * .25) put(x, y, I.G2);
      else if (g > .13 + b * .15) put(x, y, I.G3);
    }

    // shadow on the floor, smaller when it jumps
    const sr = rx0 * .85 * (1 - lift / 14);
    for (let x = Math.floor(cx - sr); x <= Math.ceil(cx + sr); x++) {
      const u = (x + .5 - cx) / sr; if (Math.abs(u) > 1) continue;
      put(x, ground + 1, I.SHADOW); if (Math.abs(u) < .7) put(x, ground + 2, I.SHADOW);
    }

    // feet: two root nubs
    for (const f of [-1, 1]) for (let y = 0; y < 2; y++) for (let x = 0; x < 3; x++)
      if (!(y === 1 && (x === 0 && f < 0 || x === 2 && f > 0))) putS(cx + f * 6 - 1.5 + x, ground - 2 + y - lift, I.BD);

    // body: a lit, dithered egg with a pale belly and a state-tinted rim on the right
    const rimOn = !["idle", "sleepy", "rain"].includes(st);
    for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
      const nx = (x + .5 - cx) / rx, ny0 = (y + .5 - cy) / ry;
      const ny = ny0 < 0 ? ny0 * 1.06 : ny0;          // a little narrower on top: an egg
      const d = nx * nx + ny * ny; if (d > 1) continue;
      const nz = Math.sqrt(1 - d);
      const L = clamp(-.42 * nx - .55 * ny + .72 * nz, 0, 1);
      const v = L * 3.2 + (bay(x, y) - .5) * .95;
      const bx = (x + .5 - cx) / (rx * .5), by = (y + .5 - (cy + ry * .62)) / (ry * .36);
      let c;
      if (bx * bx + by * by <= 1) c = v > 1.7 ? I.BEL : I.BELD;
      else c = [I.BD, I.BM, I.BL, I.BH][clamp(Math.round(v), 0, 3)];
      if (rimOn && d > .84 && nx > .62 && ny > -.45 && ny < .7) c = I.RIM;
      putS(x, y, c);
    }

    // stem and leaves
    const top = cy - ry + .8;
    const droop = { thirsty: .78, error: 1, sleepy: .45, listening: -.25, happy: -.1, hot: .55, hungry: .3, cold: .15, stuffy: .3, guests: -.15, angry: -.2, sad: .6 }[st] || 0;
    const L = [1.5, 5, 8, 10][stage];
    const sway = Math.sin(t * 1.4) * .1 + (st === "happy" ? Math.sin(t * 13.8) * .12 : 0) + (st === "music" ? Math.sin(t * Math.PI * 1.8) * .2 : 0);
    const tipAt = f => [cx + Math.sin(sway) * L * f, top - Math.cos(sway) * L * f];
    for (let k = 0; k <= L * 2; k++) {
      const [sx, sy] = tipAt(k / (L * 2));
      putS(sx - .5, sy, I.STEM); putS(sx + .5, sy, I.STEM);
    }
    const pair = (f, len, wid, ang, topPair) => {
      const [ax, ay] = tipAt(f);
      if (st === "thinking") {
        for (const ph of [0, Math.PI]) {
          const c = Math.cos(t * 7 + ph);
          leaf(ax, ay - .5, Math.sign(c) || 1, -.22, len * (.35 + .65 * Math.abs(c)), wid * (.7 + .3 * Math.abs(c)), Math.sin(t * 7 + ph) > 0 ? 1 : -1);
        }
        return;
      }
      for (const s of [-1, 1]) {
        let a = clamp(ang + droop * (1.95 - ang), .2, 2.3) + sway * s * -1;
        if (st === "guests" && topPair && s === 1) a = .2 + (Math.sin(t * 7) * .5 + .5) * .95;   // waving
        leaf(ax, ay, s * Math.sin(a), -Math.cos(a), len, wid, -s);
      }
    };
    if (stage === 0) { putS(cx, top - 2, I.LM); putS(cx + 1, top - 3, I.LL); }
    if (stage === 1) pair(1, 8.5, 3, .95, true);
    if (stage >= 2) { pair(stage === 3 ? .8 : 1, 10.5, 3.6, 1.0, true); pair(.4, 6, 2.4, 1.3); }
    if (stage === 3) {
      const [fx, fy] = tipAt(1);
      const wilt = st === "error" || st === "thirsty" ? 1.2 : 0;
      for (let i = 0; i < 5; i++) {
        const a = t * .5 + i * Math.PI * 2 / 5;
        const px = fx + Math.cos(a) * 2.7, py = fy - 1 + Math.sin(a) * 2.4 + wilt;
        for (let y = -1; y <= 1; y++) for (let x = -1; x <= 1; x++) if (x * x + y * y <= 1.5) putS(px + x, py + y, I.PET);
      }
      for (let y = -1; y <= 0; y++) for (let x = -1; x <= 0; x++) putS(fx + x + .5, fy - 1 + y + .5, I.PETC);
    }

    // rain: a tiny umbrella hat over the leaves
    const umbY = Math.round(top - L - 4), umbR = 12;
    if (st === "rain") {
      for (let dx = -umbR; dx <= umbR; dx++) {
        const h = Math.round(Math.sqrt(umbR * umbR - dx * dx) * .42);
        for (let dy = 0; dy <= h; dy++) putS(cx + dx - .5, umbY - dy, Math.floor((dx + umbR) / 6) % 2 ? I.UMB2 : I.UMB);
      }
      putS(cx - .5, umbY - 6, I.UMB); putS(cx - .5, umbY + 1, I.STEM); putS(cx - .5, umbY + 2, I.STEM);
    }

    // floating hands: two little mittens with no arms, posed for each face. A hand beside the body
    // is drawn now and gets the shared outline; one in front of the body (on the tummy, at the mouth,
    // hugging) is drawn after the face with its own outline.
    const eyY = Math.round(cy - ry * .12), mY = eyY + 5, side = rx + 5;
    const rest = (s, ph = 0) => [cx + s * side, cy + 2 + Math.sin(t * 2.2 + ph) * .8, 0];
    let H;
    if (st === "listening") H = [rest(-1), [cx + rx + 2, eyY - 2 + Math.sin(t * 6) * .5, 1]];             // cupped to its ear
    else if (st === "thinking") H = [rest(-1), [cx + 5, mY + 3 - ((Math.floor(t * 2.5) & 1) ? .6 : 0), 1]];  // tapping its chin
    else if (st === "speaking") H = [[cx - side, cy + 1 - talk * 3, 0], [cx + side, cy + 2 - Math.max(0, Math.sin(t * 3.1)) * 4, 0]];
    else if (st === "happy") H = [-1, 1].map(s => [cx + s * (rx + 3), cy - ry + 1 + Math.sin(t * 14 + s) * 1.2, 0]);  // both up
    else if (st === "hungry") H = [-1, 1].map(s => [cx + s * 5 + Math.cos(t * 5) * 1.5, cy + ry * .55 + Math.sin(t * 5) * s, 1]);  // rubbing its tummy
    else if (st === "thirsty") H = [-1, 1].map(s => [cx + s * (rx + 3), cy + ry - 3 + Math.sin(t * 1.4 + s) * .4, 0]);  // hanging limp
    else if (st === "sleepy") H = [[cx - side + 1, cy + ry - 3, 0], (t % 6.5) < 1.6 ? [cx + 1, mY + 1, 1] : [cx + side - 1, cy + ry - 3, 0]];  // covers a yawn
    else if (st === "hot") H = [rest(-1), [cx + rx + 3, eyY + 1 + Math.sin(t * 14) * 2.5, 0]];               // fanning its face
    else if (st === "cold") { const j = (t % 2.4) < 1.3 ? (Math.floor(t * 16) & 1) : 0; H = [-1, 1].map(s => [cx + s * (rx - 1) + j, cy + ry * .3, 1]); }  // hugging itself
    else if (st === "stuffy") H = [[cx - side - 1 + Math.sin(t * 8) * 1.5, eyY, 0], (t % 2.6) / 2.6 < .45 ? [cx + 1, mY + 1, 1] : rest(1)];  // waving the air, covering a cough
    else if (st === "rain") H = [rest(-1), [cx - .5, Math.round(top - L - 4) + 3, 1]];                       // holding the umbrella
    else if (st === "music") H = [-1, 1].map(s => [cx + s * side, cy - 2 - Math.max(0, Math.sin(t * Math.PI * 1.8 + (s > 0 ? Math.PI : 0))) * 4, 0]);
    else if (st === "guests") H = [rest(-1), [cx + rx + 4 + Math.sin(t * 7) * 1.5, cy - ry + 1, 0]];          // waving hello
    else if (st === "error") H = [-1, 1].map(s => [cx + s * (rx + 2), ground - 3, 0]);
    else if (st === "sad") H = [[cx - side + 1, cy + ry - 3, 0], (t % 4) < 1.8 ? [cx + 6 + Math.sin(t * 9) * .7, eyY + 1, 1] : [cx + side - 1, cy + ry - 3, 0]];  // rubbing an eye
    else if (st === "angry") H = [[cx - 3, cy + ry * .8, 1], [cx + 3, cy + ry * .8 + 1, 1]];                // arms crossed                       // flopped on the floor
    else H = [rest(-1), rest(1, 1.3)];
    const HAND = [".###.", "#####", "#####", "#####", ".###."];
    const handPx = ([hx, hy]) => {
      const out = [];
      HAND.forEach((row, j) => [...row].forEach((ch, i) => {
        if (ch === "#") out.push([Math.round(hx) - 2 + i, Math.round(hy) - 2 + j, j === 0 || (j === 1 && i <= 1) ? I.BH : j === 4 || (j === 3 && i === 4) ? I.BM : I.BL]);
      }));
      return out;
    };
    for (const h of H) if (!h[2]) for (const [x, y, c] of handPx(h)) putS(x, y, c);

    // outline round every solid shape
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (solid[y * N + x]) continue;
      if ((x > 0 && solid[y * N + x - 1]) || (x < N - 1 && solid[y * N + x + 1]) || (y > 0 && solid[(y - 1) * N + x]) || (y < N - 1 && solid[(y + 1) * N + x]))
        pix[y * N + x] = I.OUT;
    }

    // face
    const ey = Math.round(cy - ry * .12);
    let gx = 0, gy = 0;
    if (st === "thinking") { gx = Math.round(Math.sin(t * 1.7)); gy = -1; }
    if (st === "listening") gy = -1;
    if (st === "thirsty") gy = -1;
    if (st === "hungry") { gx = 1; gy = -1; }
    const blink = (t % 4.1) < .12 || ((t % 9.7) > 9.45 && (t % 9.7) < 9.57);
    const eyes = (fn) => { fn(cx - 7 + gx, ey + gy, -1); fn(cx + 5 + gx, ey + gy, 1); };
    const blush = () => { for (const [x, s] of [[cx - 9, 0], [cx + 6, 0]]) { put(x, ey + 3, I.BLUSH); put(x + 1, ey + 3, I.BLUSH); put(x + 2, ey + 3, I.BLUSH); } };
    const my = ey + 5;
    if (st === "happy" || st === "music") {
      eyes((x, y) => { put(x - 1, y + 1, I.EYE); put(x, y, I.EYE); put(x + 1, y, I.EYE); put(x + 2, y + 1, I.EYE); });
      blush();
      for (let x = -3; x <= 2; x++) put(cx + x, my, I.MOUTH);
      for (let x = -2; x <= 1; x++) put(cx + x, my + 1, x === -1 || x === 0 ? I.TONGUE : I.MOUTH);
      put(cx - 1, my + 2, I.MOUTH); put(cx, my + 2, I.MOUTH);
    } else if (st === "sleepy") {
      eyes((x, y) => { put(x - 1, y + 1, I.EYE); put(x, y + 2, I.EYE); put(x + 1, y + 2, I.EYE); put(x + 2, y + 1, I.EYE); });
      const o = breathe > 0 ? 1 : 0;
      put(cx - 1, my, I.MOUTH); put(cx, my, I.MOUTH); if (o) { put(cx - 1, my + 1, I.MOUTH); put(cx, my + 1, I.MOUTH); }
    } else if (st === "stuffy") {
      eyes((x, y, s) => { const a = s < 0 ? 0 : 1, b = 1 - a; put(x + a, y, I.EYE); put(x + b, y + 1, I.EYE); put(x + a, y + 2, I.EYE); });
      for (let x = -2; x <= 1; x++) put(cx + x, my + (x & 1), I.MOUTH);
    } else if (st === "sad") {
      // big wet eyes under worried brows, a tear rolling down, a wobbly frown
      eyes((x, y, s) => {
        for (let j = 0; j < 3; j++) for (let i = 0; i < 2; i++) put(x + i, y + j, I.EYE);
        put(x, y, I.SHINE); put(x + 1, y + 2, I.DROPL);
        const B = s < 0 ? [[-1, -1], [0, -1], [1, -2], [2, -2]] : [[-1, -2], [0, -2], [1, -1], [2, -1]];
        for (const [a, b] of B) put(x + a, y + b, I.EYE);
      });
      const ph = (t % 2.6) / 2.6;
      if (ph < .75) { put(cx - 7, ey + 3 + ph * 7, I.DROP); put(cx - 7, ey + 2 + ph * 7, I.DROPL); }
      const w = (t % 1.3) < .65 ? 0 : 1;
      put(cx - 2, my + 1, I.MOUTH); put(cx - 1, my + w * 0, I.MOUTH); put(cx, my, I.MOUTH); put(cx + 1, my + 1, I.MOUTH);
      if (w) { put(cx - 3, my + 2, I.MOUTH); put(cx + 2, my + 2, I.MOUTH); }
    } else if (st === "angry") {
      // brows slanting down to the middle, small glaring eyes, puffed red cheeks, a wobbly frown
      eyes((x, y, s) => {
        for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) put(x + i, y + 1 + j, I.EYE);
        const B = s < 0 ? [[-1, -2], [0, -2], [1, -1], [2, 0]] : [[-1, 0], [0, -1], [1, -2], [2, -2]];
        for (const [a, b] of B) { put(x + a, y + b, I.EYE); put(x + a, y + b - 1, I.OUT); }
      });
      for (const x0 of [cx - 10, cx + 6]) for (let i = 0; i < 4; i++) { put(x0 + i, ey + 3, I.BLUSH); if (i && i < 3) put(x0 + i, ey + 4, I.BLUSH); }
      const w = Math.floor(t * 8) & 1;
      put(cx - 3, my + 2, I.MOUTH); put(cx - 2, my + 1, I.MOUTH); put(cx - 1, my + w, I.MOUTH); put(cx, my + 1 - w, I.MOUTH); put(cx + 1, my + 1, I.MOUTH); put(cx + 2, my + 2, I.MOUTH);
    } else if (st === "error") {
      eyes((x, y) => { put(x - 1, y, I.EYE); put(x + 1, y + 2, I.EYE); put(x, y + 1, I.EYE); put(x + 1, y, I.EYE); put(x - 1, y + 2, I.EYE); });
      for (let x = -3; x <= 2; x++) put(cx + x, my + (x & 1), I.MOUTH);
    } else {
      const big = st === "listening" || st === "guests";
      eyes((x, y) => {
        if (blink && st !== "listening") { put(x, y + 2, I.EYE); put(x + 1, y + 2, I.EYE); return; }
        const h = big ? 4 : 3, w = big ? 3 : 2, ox = big ? -1 + (x > cx ? 1 : 0) : 0;
        for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(x + ox + i, y + j - (big ? 1 : 0), I.EYE);
        put(x + ox, y - (big ? 1 : 0), I.SHINE);
        if (big) put(x + ox + 1, y + 1, I.SHINE);
        if (st === "thirsty" || st === "hot") for (let i = -1; i <= w; i++) { put(x + ox + i, y, I.BD); put(x + ox + i, y + 1, I.OUT); }
      });
      if (st !== "thirsty") blush();
      if (st === "cold") for (const x of [cx - 9, cx + 7]) put(x, ey + 3, I.SCARF);
      if (st === "speaking") {
        const h = Math.round(talk * 3);
        if (h === 0) for (let x = -2; x <= 1; x++) put(cx + x, my + 1, I.MOUTH);
        else for (let j = 0; j <= h; j++) for (let x = -2; x <= 1; x++) {
          if ((j === 0 || j === h) && (x === -2 || x === 1)) continue;
          put(cx + x, my + j, j === h && h >= 2 && (x === -1 || x === 0) ? I.TONGUE : I.MOUTH);
        }
      } else if (st === "listening") {
        put(cx - 1, my, I.MOUTH); put(cx, my, I.MOUTH); put(cx - 1, my + 1, I.MOUTH); put(cx, my + 1, I.MOUTH);
      } else if (st === "thinking") {
        put(cx, my, I.MOUTH); put(cx + 1, my, I.MOUTH); put(cx + 2, my - 1, I.MOUTH);
      } else if (st === "hot") {
        const pant = Math.sin(t * 10) > 0 ? 1 : 0;
        for (let x = -2; x <= 1; x++) put(cx + x, my, I.MOUTH);
        put(cx - 2, my + 1, I.MOUTH); put(cx + 1, my + 1, I.MOUTH); put(cx - 1, my + 1, I.TONGUE); put(cx, my + 1, I.TONGUE);
        put(cx - 1, my + 2, I.TONGUE); put(cx, my + 2, I.TONGUE); if (pant) { put(cx - 1, my + 3, I.TONGUE); put(cx, my + 3, I.TONGUE); }
      } else if (st === "cold") {
        const ph = Math.floor(t * 12) & 1;
        for (let x = -3; x <= 2; x++) put(cx + x, my + ((x + ph) & 1), I.MOUTH);
      } else if (st === "hungry") {
        for (let j = 0; j <= 2; j++) for (let x = -1; x <= 0; x++) put(cx + x, my + j, I.MOUTH);
        put(cx - 2, my + 1, I.MOUTH); put(cx + 1, my + 1, I.MOUTH);
        if ((t % 2) < 1.3) put(cx + 1, my + 3, I.DROPL);
      } else if (st === "guests") {
        for (let x = -3; x <= 2; x++) put(cx + x, my, I.MOUTH);
        for (let x = -2; x <= 1; x++) put(cx + x, my + 1, x === -1 || x === 0 ? I.TONGUE : I.MOUTH);
      } else if (st === "thirsty") {
        put(cx - 2, my + 1, I.MOUTH); put(cx - 1, my, I.MOUTH); put(cx, my, I.MOUTH); put(cx + 1, my + 1, I.MOUTH);
      } else {
        put(cx - 2, my, I.MOUTH); put(cx - 1, my + 1, I.MOUTH); put(cx, my + 1, I.MOUTH); put(cx + 1, my, I.MOUTH);
      }
    }

    if (st === "cold") {
      const y0 = Math.round(cy + ry * .5);
      for (let y = y0; y <= y0 + 2; y++) for (let x = 0; x < N; x++)
        if (solid[y * N + x]) put(x, y, Math.floor((x + (y - y0)) / 3) % 2 ? I.SCARF2 : I.SCARF);
      for (let y = y0 + 3; y <= y0 + 7; y++) for (let x = cx + 3; x <= cx + 5; x++) put(x, y, (y + x) % 3 ? I.SCARF : I.SCARF2);
    }

    for (const h of H) if (h[2]) {
      const px = handPx(h), key = new Set(px.map(([x, y]) => x + "," + y));
      for (const [x, y] of px) for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]])
        if (!key.has((x + ox) + "," + (y + oy))) putS(x + ox, y + oy, I.OUT);
      for (const [x, y, c] of px) putS(x, y, c);
    }

    // hearts from taps, floating up
    for (const h of hearts) {
      const age = t - h.t; if (age < 0 || age > 1.3) continue;
      const hx = cx + h.dx + Math.sin(age * 6 + h.dx) * 1.5, hy = cy - ry - 2 - age * 16;
      [".#.#.", "#####", "#####", ".###.", "..#.."].forEach((row, j) => [...row].forEach((ch, i) => { if (ch === "#") put(hx - 2 + i, hy + j, age > 1 && bay(i, j) > (1.3 - age) * 3 ? I.G2 : I.PET); }));
    }

    // particles, behind nothing solid
    const tipY = top - L - 3;
    if (st === "idle" || st === "speaking") {
      for (let i = 0; i < 4; i++) {
        const life = (t * .16 + i / 4) % 1;
        const x = cx + Math.sin(i * 2.3 + t * .6) * (17 + i * 2), y = ground - 4 - life * 44;
        if (life > .85 && bay(i, Math.floor(t * 8)) > .5) continue;
        putBg(x, y, I.SPK);
        if (((t * 2 + i) % 2) < .35) { putBg(x - 1, y, I.G1); putBg(x + 1, y, I.G1); putBg(x, y - 1, I.G1); putBg(x, y + 1, I.G1); }
      }
    }
    if (st === "listening") {
      for (let k = 0; k < 3; k++) {
        const r = 30 - ((t * 13 + k * 6) % 18), fade = (30 - r) / 18;
        for (let a = -.55; a <= .55; a += .05) for (const s of [-1, 1]) {
          const x = cx + s * Math.cos(a) * r, y = cy - 2 + Math.sin(a) * r * .9;
          putBg(x, y, fade > bay(Math.floor(x), Math.floor(y)) ? I.G0 : I.G2);
        }
      }
    }
    if (st === "thinking") {
      for (let i = 0; i < 3; i++) {
        const a = t * 2.6 + i * Math.PI * 2 / 3, x = cx + Math.cos(a) * 13, y = tipY + Math.sin(a) * 3.2;
        if (Math.sin(a) > 0) { putBg(x, y, I.SPK); putBg(x + 1, y, I.SPK); putBg(x, y + 1, I.SPK); putBg(x + 1, y + 1, I.SPK); }
        else putBg(x, y, I.G1);
      }
    }
    if (st === "happy") {
      for (let i = 0; i < 8; i++) {
        const ph = (t * .7 + i / 8) % 1, a = i * 2.4 + 1;
        const x = cx + Math.cos(a) * (12 + ph * 18), y = cy - 8 - ph * 22 + Math.sin(a) * 4;
        if (ph > .75 && bay(i, i * 3) > (1 - ph) * 4) continue;
        const c = i % 3 === 0 ? I.SPK : I.PET;
        putBg(x, y, c); putBg(x + 1, y, c); if (i % 3) { putBg(x, y + 1, c); putBg(x + 1, y + 1, c); }
      }
    }
    if (st === "thirsty") {
      const dx = cx + 13, dy = tipY - 1 + Math.round(Math.sin(t * 2.5) * 1.2);
      const D = ["..#..", ".###.", "#####", "#####", ".###."];
      if ((t % 1.6) < 1.25) D.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === "#") putBg(dx + i, dy + j, I.DROP); }));
      if ((t % 1.6) < 1.25) putBg(dx + 1, dy + 2, I.DROPL);
    }
    if (st === "sleepy") {
      for (let i = 0; i < 3; i++) {
        const ph = (t * .28 + i / 3) % 1;
        if (ph > .8 && bay(i, Math.floor(ph * 40)) > .5) continue;
        zGlyph(Math.floor(cx + 8 + ph * 14), Math.floor(tipY + 6 - ph * 16), i % 2 ? 4 : 5);
      }
    }
    if (st === "hungry") {
      const ax = cx + 13, ay = tipY + 1 + Math.round(Math.sin(t * 2.2) * 1.3);
      const A = ["..g..", ".rrr.", "rrrrr", "rrrrr", ".rrr."];
      A.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== ".") putBg(ax + i, ay + j, ch === "g" ? I.FOODL : I.FOOD); }));
      putBg(ax + 1, ay + 2, I.SNOW);
      if (rumble) for (const s of [-1, 1]) { putBg(cx + s * (rx + 3), cy + 3, I.G0); putBg(cx + s * (rx + 4), cy + 4, I.G0); putBg(cx + s * (rx + 3), cy + 5, I.G0); }
    }
    if (st === "cold") {
      for (let i = 0; i < 9; i++) {
        const x = (i * 7.3 + Math.sin(t * .9 + i) * 2.5 + 64) % 64, y = (t * 7 + i * 11.7) % 64;
        putBg(x, y, I.SNOW);
        if (i % 3 === 0) { putBg(x - 1, y, I.G1); putBg(x + 1, y, I.G1); putBg(x, y - 1, I.G1); putBg(x, y + 1, I.G1); }
      }
    }
    if (st === "hot") {
      const sy = Math.round(cy - 5 + ((t * 4) % 6));
      putBg(cx - rx + 1, sy, I.SWEAT); put(cx - Math.round(rx) + 3, sy, I.SWEAT); put(cx - Math.round(rx) + 3, sy + 1, I.SWEAT); put(cx - Math.round(rx) + 2, sy + 1, I.SWEAT);
      for (let i = 0; i < 3; i++) for (let k = 0; k < 9; k++) {
        const y = tipY + 2 - k - ((t * 6) % 3), x = cx - 12 + i * 12 + Math.sin(y * .6 + t * 5 + i) * 1.2;
        if (k / 9 < bay(Math.floor(x), Math.floor(y)) + .3) putBg(x, y, k < 4 ? I.G1 : I.G2);
      }
    }
    if (st === "stuffy") {
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        // thin wisps drifting sideways: a few wavy bands, broken up by dither
        const band = Math.sin(y * .55 + Math.sin(x * .12 - t * .9) * 2.2 + t * .3);
        const gap = Math.sin(x * .09 + t * 1.3 + y * .3);
        if (band > .86 && gap > -.2 && bay(x, y) < .55) putBg(x, y, I.HAZE);
      }
      const c = (t % 2.6) / 2.6;
      if (c < .4) { const px = cx - 4 - c * 22, py = my + 1 - c * 6; for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1], [2, 0], [-1, 1]]) putBg(px + a, py + b, I.CLOUD); }
    }
    if (st === "music") {
      const NOTE = [".##", ".#.", ".#.", "##.", "##."];
      for (let i = 0; i < 3; i++) {
        const ph = (t * .35 + i / 3) % 1;
        if (ph > .8 && bay(i, Math.floor(ph * 30)) > .5) continue;
        const nx = cx + (i - 1) * 15 + Math.sin(t * 2 + i) * 3, ny = tipY + 6 - ph * 18;
        NOTE.forEach((row, j) => [...row].forEach((ch, k) => { if (ch === "#") putBg(nx + k, ny + j, i === 1 ? I.G0 : I.SPK); }));
      }
    }
    if (st === "rain") {
      for (let i = 0; i < 16; i++) {
        const x = (i * 4.1 + 2) % 64, y = (t * 34 + i * 17.3) % 70 - 6;
        if (Math.abs(x - cx) < umbR + 1 && y > umbY - 7) continue;
        putBg(x, y, I.DROP); putBg(x, y + 1, I.DROPL);
      }
    }
    if (st === "guests") {
      const cols = [I.PET, I.CONF, I.UMB2, I.FOODL, I.SPK];
      for (let i = 0; i < 12; i++) {
        const x = (i * 5.7 + Math.sin(t * 1.5 + i) * 3 + 64) % 64, y = (t * 9 + i * 9.1) % 64;
        putBg(x, y, cols[i % 5]); if (i % 2) putBg(x + 1, y, cols[i % 5]);
      }
    }
    if (st === "angry") {
      for (const s of [-1, 1]) {                                     // steam out of both sides of its head
        const ph = (t * .9 + (s > 0 ? .5 : 0)) % 1;
        if (ph < .7) {
          const r = 1.6 + ph * 2.4, px = cx + s * (rx - 1 + ph * 9), py = cy - ry + 2 - ph * 9;
          for (const [ox, oy, k] of [[0, 0, 1], [s * r * .9, -r * .5, .7], [-s * r * .7, -r * .6, .6]]) {   // a three-lobed puff
            const rr = r * k;
            for (let dy = -rr; dy <= rr; dy++) for (let dx = -rr; dx <= rr; dx++) {
              const q = (dx * dx + dy * dy) / (rr * rr), x = px + ox + dx, y = py + oy + dy;
              if (q <= 1 && (ph < .45 || bay(Math.floor(x), Math.floor(y)) > (ph - .45) * 3)) putBg(x, y, q < .4 ? I.SNOW : I.CLOUD);
            }
          }
        }
      }
      const big = (t % .8) < .4;                                     // the throbbing anger mark
      const V = big ? ["..#.#..", "..#.#..", "###.###", ".......", "###.###", "..#.#..", "..#.#.."] : [".#.#.", "##.##", ".....", "##.##", ".#.#."];
      const vx = cx + 9 + (big ? 0 : 1), vy = tipY - 3 + (big ? 0 : 1);
      V.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === "#") putBg(vx + i, vy + j, I.FOOD); }));
    }
    if (st === "error") {
      const C = [".####......", "######.###.", "###########", ".#########."];
      const ox = cx - 5 + Math.round(Math.sin(t * .8) * 1.5), oy = tipY - 4;
      C.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === "#") putBg(ox + i, oy + j, I.CLOUD); }));
      const r = (t * 1.6) % 1;
      putBg(ox + 3, oy + 5 + r * 9, I.DROP); putBg(ox + 7, oy + 5 + ((r + .5) % 1) * 9, I.DROP);
    }
  }


  const small = document.createElement("canvas"); small.width = small.height = N;
  const sctx = small.getContext("2d"), img = sctx.createImageData(N, N);

  // paint frame t (seconds) into ctx at (x, y, size); `ring` adds the stat ring, clock and label
  // as on the round screen. `stats` is [water, food, fun, rest], 0 to 1.
  function frame(ctx, x, y, size, t, { ring = false, stats = null } = {}) {
    draw(t);
    const st = t < petUntil ? "happy" : state;
    const pal = palette(st);
    for (let i = 0; i < N * N; i++) { const c = pal[pix[i]]; img.data[i * 4] = c[0]; img.data[i * 4 + 1] = c[1]; img.data[i * 4 + 2] = c[2]; img.data[i * 4 + 3] = 255; }
    sctx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = false;
    if (!ring) { ctx.drawImage(small, x, y, size, size); return; }
    const k = size / 466;
    ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2); ctx.fill();
    ctx.drawImage(small, x + 9 * k, y + 9 * k, 448 * k, 448 * k);
    const dim = st === "asleep" ? .45 : st === "sleepy" ? .6 : 1, vals = stats || STATS[st];
    const R = 219 * k, cxp = x + 233 * k, cyp = y + 233 * k;
    [225, 315, 45, 135].forEach((mid, si) => {
      for (let s = 0; s < 10; s++) {
        const a0 = (mid - 30 + s * 6 + .9) * Math.PI / 180, a1 = (mid - 30 + (s + 1) * 6 - .9) * Math.PI / 180;
        const filled = (mid === 45 || mid === 135) ? 9 - s < Math.round(vals[si] * 10) : s < Math.round(vals[si] * 10);
        ctx.beginPath(); ctx.arc(cxp, cyp, R, a0, a1);
        ctx.strokeStyle = STAT_COL[si]; ctx.globalAlpha = (filled ? 1 : .16) * dim; ctx.lineWidth = 7 * k; ctx.stroke();
      }
    });
    ctx.globalAlpha = dim;
    ctx.fillStyle = "#cfe6c2"; ctx.textAlign = "center";
    ctx.font = `${20 * k}px Silkscreen, ui-monospace, monospace`;
    const now = new Date(); ctx.fillText(`${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, "0")}`, cxp, y + 48 * k);
    const label = t < petUntil ? "\u2665" : STATES[state].status;
    if (label) { ctx.font = `${13 * k}px Silkscreen, ui-monospace, monospace`; ctx.fillStyle = STATES[st].hue; ctx.fillText(label, cxp, y + 436 * k); }
    ctx.globalAlpha = 1;
  }

  return {
    STATES, STAT_COL, frame,
    get state() { return state; },
    set state(v) { if (STATES[v] && v !== state) { state = v; petUntil = -1; } },
    set stage(v) { stage = Math.max(0, Math.min(3, v | 0)); },
    // a tap: a heart floats up; `pet` also shows the happy face for a moment
    heart(t) { hearts = hearts.filter((h) => t - h.t < 1.5); hearts.push({ t, dx: Math.round((Math.random() - .5) * 16) }); },
    pet(t) { petUntil = t + 2.4; },
  };
}
