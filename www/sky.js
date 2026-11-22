// <meridian-sky>: an animated sky behind the morning forecast, in the spirit of Kiosk Satellite's
// Weather Mood (drawn from scratch here; KS's code is not open). Set `.mode` to one of the keys of
// SKY below and `.night` to true after dark. The sky is a WebGL shader drawn at a third of the
// screen and softened, which is what keeps it cheap on the Kitchen Display and the Echo Show 5;
// rain, drops on the glass, gusts, frost, mist, ash and lightning go on a 2D canvas over it.
// It runs at up to 30 fps, stops while the page is hidden, and eases between skies when the
// mode changes.

const SKY = {   // [day, night] colours top and bottom, then cloud cover and the effects
  sunny:  { top: [[.16, .45, .90], [.03, .06, .16]], bot: [[.66, .84, .99], [.10, .14, .28]], cover: .2, dark: 0, speed: .03, sun: 1 },
  partly: { top: [[.30, .56, .90], [.03, .06, .16]], bot: [[.78, .87, .96], [.10, .14, .28]], cover: .45, dark: .05, speed: .01, sun: .75 },
  cloudy: { top: [[.30, .48, .78], [.05, .07, .13]], bot: [[.74, .83, .94], [.12, .14, .20]], cover: .74, dark: .12, speed: .008, sun: .15 },
  rain:   { top: [[.22, .30, .42], [.04, .05, .10]], bot: [[.45, .53, .64], [.09, .11, .16]], cover: .9, dark: .4, speed: .014, fog: .1, rain: 1, wind: .25 },
  storm:  { top: [[.07, .08, .13], [.02, .03, .07]], bot: [[.20, .22, .30], [.06, .07, .11]], cover: .97, dark: .75, speed: .02, rain: 1.5, storm: 1, wind: .35 },
  fog:    { top: [[.78, .81, .85], [.10, .11, .15]], bot: [[.90, .91, .92], [.16, .17, .21]], cover: .35, dark: 0, speed: .004, sun: .35, fog: 1 },
  windy:  { top: [[.28, .52, .86], [.03, .06, .16]], bot: [[.74, .84, .95], [.10, .14, .28]], cover: .5, dark: .06, speed: .05, sun: .6, wind: 1 },
  cold:   { top: [[.50, .64, .84], [.03, .06, .14]], bot: [[.84, .89, .95], [.10, .13, .24]], cover: .4, dark: .08, speed: .01, sun: .45, cold: 1 },
  frost:  { top: [[.40, .60, .88], [.03, .06, .14]], bot: [[.86, .92, .98], [.10, .13, .24]], cover: .08, dark: 0, speed: .01, sun: .7, fog: .15, cold: .6, frost: 1 },
  heat:   { top: [[.30, .52, .86], [.05, .06, .16]], bot: [[1, .84, .62], [.30, .18, .16]], cover: .06, dark: 0, speed: .012, sun: 1, wind: .2, heat: 1 },
  smoke:  { top: [[.50, .40, .32], [.08, .05, .04]], bot: [[.88, .62, .38], [.22, .12, .07]], cover: .3, dark: .15, speed: .008, smoke: 1 },
};
const KEYS = ["cover", "dark", "speed", "sun", "fog", "rain", "storm", "wind", "cold", "frost", "heat", "smoke"];
// skies dark enough that the forecast switches to white text
export const skyIsDark = (mode, night) => !!night || ["rain", "storm", "smoke"].includes(mode);

const VS = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
// highp where the GPU has it: at mediump the noise hash collapses and the clouds vanish (seen on the Echo)
const FS = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 R;uniform float t,cover,dark,speed,sun,fog,night,flash,wind,heat,smoke;uniform vec3 top,bot;
float h(vec2 p){p=fract(p*vec2(.1031,.1030));p+=dot(p,p.yx+33.33);return fract((p.x+p.y)*p.x);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<6;i++){v+=a*n(p);p=m*p;a*=.5;}return v;}
void main(){vec2 uv=gl_FragCoord.xy/R;uv.x+=heat*sin(uv.y*38.+t*3.2)*.005*smoothstep(.55,0.,uv.y);float A=R.x/R.y;vec2 q=vec2(uv.x*A,uv.y);
 vec3 col=mix(bot,top,smoothstep(0.,1.,uv.y));
 vec2 sp=vec2(A*.64,.86);float sd=length(q-sp);
 if(night>.5){vec2 g=floor(q*140.);float s=h(g);float tw=.6+.4*sin(t*2.+s*40.);col+=vec3(1.)*step(.996,s)*tw*(1.-cover*.9);
  col+=vec3(.95,.93,.85)*smoothstep(.075,.07,sd)*(1.-cover*.7)+vec3(.25,.28,.4)*exp(-sd*7.)*(1.-cover*.6);}
 float pulse=1.+.1*sin(t*1.1)+.05*sin(t*2.7);
 if(night<.5)col+=sun*(vec3(1.,.95,.8)*smoothstep(.07,.05,sd)*.9+vec3(1.,.86,.6)*exp(-sd*4.5)*.4*pulse);
 float dr=t*speed*(1.+wind*2.);
 vec2 cp=q*vec2(1.05,1.6)+vec2(dr,0.);vec2 wp=cp+fbm(cp*.5+t*.01)*.6;float c1=fbm(wp);
 float cl=fbm(wp+vec2(.04,.09));float hl=clamp((c1-cl)*10.,-1.,1.);
 float c2=fbm(q*vec2(2.2,3.)+vec2(dr*1.7,.3));
 float th=1.-cover;float d1=smoothstep(th-.06,th+.2,c1);float d2=smoothstep(th,th+.3,c2)*.6;
 float dens=clamp(d1+d2*(1.-d1),0.,1.);
 vec3 lit=night>.5?vec3(.24,.27,.36):vec3(1.,1.,.99);vec3 shade=night>.5?vec3(.07,.08,.12):vec3(.46,.5,.6);
 float L=clamp(.58-dark*.9+hl*1.05*(1.-dark*.85)-(c1-th)*.6,0.,1.);
 vec3 cc=mix(shade,lit,L);
 cc+=lit*smoothstep(.25,.9,hl)*.22*(1.-dark);
 if(night<.5)cc+=sun*vec3(1.,.9,.7)*exp(-sd*2.5)*.3*(1.-dark);
 col=mix(col,cc,dens*.95);
 if(night<.5)col+=sun*vec3(1.,.9,.7)*exp(-sd*2.2)*.12*(1.-dens*.7)*(.8+.2*sin(t*.6));
 col+=heat*(vec3(1.,.82,.55)*exp(-sd*1.8)*.28+vec3(1.,.75,.45)*smoothstep(.45,0.,uv.y)*.12);
 float sh=fbm(vec2(q.x*.9+t*.015,q.y*2.2-t*.006));
 col=mix(col,night>.5?vec3(.2,.11,.06):vec3(.80,.55,.33),smoke*clamp(.45+sh*.55,0.,1.));
 col+=smoke*(1.-night)*vec3(1.,.32,.08)*smoothstep(.06,.045,sd)*.85;
 float fb=fbm(vec2(q.x*1.2+t*.02,q.y*5.));col=mix(col,night>.5?vec3(.2,.21,.26):vec3(.93,.93,.94),fog*clamp(.35+fb*.7-uv.y*.35,0.,1.));
 col+=flash*vec3(.55,.6,.75)*(.4+dens);
 gl_FragColor=vec4(col,1.);}`;

const lerp = (a, b, k) => a + (b - a) * k;
const R = Math.random;

function makeBolt() {
  const out = [];
  function seg(x, y, len, ang, depth, w) {
    const pts = [[x, y]]; let cx = x, cy = y; const steps = 10 + Math.floor(R() * 6);
    for (let i = 0; i < steps; i++) {
      ang += (R() - .5) * .9; cx += Math.sin(ang) * len / steps * .6; cy += Math.cos(ang) * len / steps; pts.push([cx, cy]);
      if (depth < 2 && R() < .18) out.push(...seg(cx, cy, len * .45, ang + (R() < .5 ? -.7 : .7), depth + 1, w * .55));
    }
    return [{ pts, w }];
  }
  out.unshift(...seg(.15 + R() * .7, -.02, .62 + R() * .25, (R() - .5) * .4, 0, 1));
  return { paths: out, a: 1 };
}

class MeridianSky extends HTMLElement {
  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = `<style>:host{position:absolute;inset:0;display:block;overflow:hidden;z-index:-1;pointer-events:none}
      canvas{position:absolute;inset:0;width:100%;height:100%;display:block}.sky{filter:blur(2px);transform:scale(1.02)}
      .flash{position:absolute;inset:0;background:#eef3ff;opacity:0}</style>
      <canvas class="sky"></canvas><canvas class="fx"></canvas><div class="flash"></div>`;
    this._sky = root.querySelector(".sky"); this._fx = root.querySelector(".fx"); this._flash = root.querySelector(".flash");
    this._mode = "cloudy"; this._night = false; this._cur = null;
    this._flashV = 0; this._nextBolt = 2; this._bolt = null;
  }
  set mode(m) { this._mode = SKY[m] ? m : "cloudy"; }
  get mode() { return this._mode; }
  set night(v) { this._night = !!v; }
  get night() { return this._night; }

  connectedCallback() {
    this._ro = new ResizeObserver(() => this._size()); this._ro.observe(this);
    this._vis = () => { if (!document.hidden) this._loop(); };
    document.addEventListener("visibilitychange", this._vis);
    this._t0 = performance.now(); this._last = this._t0; this._loop();
  }
  disconnectedCallback() {
    cancelAnimationFrame(this._raf); this._raf = null;
    if (this._ro) this._ro.disconnect();
    document.removeEventListener("visibilitychange", this._vis);
  }

  _size() {
    const W = Math.round(this.clientWidth), H = Math.round(this.clientHeight);
    if (!W || !H || (W === this._W && H === this._H)) return;
    this._W = W; this._H = H; this._s = W / 1280;
    if (!this._gl) this._initGL();
    if (this._gl) { this._sky.width = Math.max(1, W / 3 | 0); this._sky.height = Math.max(1, H / 3 | 0); this._gl.viewport(0, 0, this._sky.width, this._sky.height); }
    this._fx.width = W; this._fx.height = H; this._g = this._fx.getContext("2d");
    this._particles();
  }

  _initGL() {
    const gl = this._sky.getContext("webgl", { antialias: false });
    if (!gl) return;   // no WebGL: the plain sky gradient from the card's CSS shows instead
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; };
    const pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
    gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this._U = {};
    for (const k of ["R", "t", "night", "flash", "top", "bot", ...KEYS]) this._U[k] = gl.getUniformLocation(pr, k);
    this._gl = gl;
  }

  // everything on the 2D canvas, sized to the screen; the mist and frost are painted once
  _particles() {
    const W = this._W, H = this._H, s = this._s;
    this._streaks = [...Array(Math.round(380 * s))].map(() => ({ x: R() * W * 1.15, y: R() * H, l: (14 + R() * 22) * s, v: (900 + R() * 700) * s, a: .12 + R() * .3 }));
    this._beads = [...Array(Math.round(150 * s))].map(() => ({ x: R() * W, y: R() * H, r: (1.5 + R() * R() * 5) * s, v: 0 }));
    this._gusts = [...Array(24)].map(() => ({ x: R() * W, y: R() * H, l: (120 + R() * 260) * s, v: (500 + R() * 500) * s, a: .1 + R() * .18 }));
    this._ash = [...Array(Math.round(70 * s + 10))].map(() => ({ x: R() * W, y: R() * H, r: (.8 + R() * 1.8) * s, vx: (8 + R() * 14) * s, vy: (4 + R() * 8) * s, p: R() * 6 }));
    this._mist = null; this._frost = null;   // painted the first time they're needed
  }
  _paintMist() {
    const W = this._W, H = this._H, s = this._s, c = document.createElement("canvas"); c.width = W; c.height = H; const m = c.getContext("2d");
    const gr = m.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .32, W / 2, H / 2, Math.hypot(W, H) * .55);
    gr.addColorStop(0, "rgba(235,242,250,0)"); gr.addColorStop(1, "rgba(235,242,250,.62)"); m.fillStyle = gr; m.fillRect(0, 0, W, H);
    for (let i = 0; i < 260; i++) {
      const x = R() * W, y = R() * H, e = Math.min(x, W - x, y, H - y) / Math.min(W, H); if (e > .22) continue;
      const r = (6 + R() * 26) * s, g2 = m.createRadialGradient(x, y, 0, x, y, r);
      g2.addColorStop(0, `rgba(245,249,255,${.25 * (1 - e / .22)})`); g2.addColorStop(1, "rgba(245,249,255,0)");
      m.fillStyle = g2; m.beginPath(); m.arc(x, y, r, 0, 7); m.fill();
    }
    return c;
  }
  _paintFrost() {
    const W = this._W, H = this._H, s = this._s, c = document.createElement("canvas"); c.width = W; c.height = H; const f = c.getContext("2d");
    f.lineCap = "round"; const sparks = [], B = [[], [], [], []];
    const fg = f.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .38, W / 2, H / 2, Math.hypot(W, H) * .55);
    fg.addColorStop(0, "rgba(240,247,255,0)"); fg.addColorStop(1, "rgba(240,247,255,.5)"); f.fillStyle = fg; f.fillRect(0, 0, W, H);
    function arm(x, y, a, len, w, d) {
      const n = 8 + Math.floor(R() * 6);
      for (let i = 0; i < n; i++) {
        const nx = x + Math.cos(a) * len / n, ny = y + Math.sin(a) * len / n; B[d].push(x, y, nx, ny);
        if (d < 2) for (const sgn of [-1, 1]) if (R() < .5) { const bl = len * (.2 + R() * .18) * (1 - i / n); if (bl > 4 * s) arm(nx, ny, a + sgn * (1.0 + R() * .25), bl, w * .7, d + 1); }
        if (d < 2 && R() < .05) sparks.push([nx, ny, R() * 6]);
        x = nx; y = ny; a += (R() - .5) * .25;
      }
    }
    for (const [cx, cy, ca] of [[0, 0, .8], [W, 0, Math.PI - .8], [0, H, -.8], [W, H, Math.PI + .8]])
      for (let i = 0; i < 9; i++) arm(cx + (R() - .5) * 60 * s, cy + (R() - .5) * 60 * s, ca + (R() - .5) * 1.4, (120 + R() * 170) * s, 1, 0);
    for (let i = 0; i < 26; i++) {
      const side = i % 4, u = R();
      const [x, y, a] = side === 0 ? [u * W, 0, Math.PI / 2] : side === 1 ? [u * W, H, -Math.PI / 2] : side === 2 ? [0, u * H, 0] : [W, u * H, Math.PI];
      arm(x, y, a + (R() - .5) * .9, (40 + R() * 90) * s, .8, 1);
    }
    B.forEach((L, d) => {
      f.strokeStyle = `rgba(250,253,255,${[.6, .45, .32, .25][d]})`; f.lineWidth = Math.max(.6, [1.8, 1.2, .8, .6][d] * s); f.beginPath();
      for (let i = 0; i < L.length; i += 4) { f.moveTo(L[i], L[i + 1]); f.lineTo(L[i + 2], L[i + 3]); }
      f.stroke();
    });
    this._sparks = sparks;
    return c;
  }

  _target() {
    const p = SKY[this._mode], n = this._night ? 1 : 0, o = { top: p.top[n], bot: p.bot[n], night: n };
    for (const k of KEYS) o[k] = p[k] || 0;
    if (n) { o.sun = 0; o.heat = 0; }
    return o;
  }

  _loop() {
    if (this._raf || !this.isConnected) return;
    const step = (now) => {
      this._raf = null;
      if (!this.isConnected || document.hidden) return;
      this._raf = requestAnimationFrame(step);
      if (now - this._last < 30) return;   // about 30 fps is plenty for a slow sky
      const dt = Math.min(.1, (now - this._last) / 1000); this._last = now;
      this._draw((now - this._t0) / 1000, dt);
    };
    this._raf = requestAnimationFrame(step);
  }

  _draw(t, dt) {
    if (!this._W) this._size();
    if (!this._W) return;
    const tg = this._target();
    if (!this._cur) this._cur = JSON.parse(JSON.stringify(tg));
    const cur = this._cur, k = 1 - Math.pow(.02, dt);
    for (const key of KEYS) cur[key] = lerp(cur[key], tg[key], k);
    for (const key of ["top", "bot"]) cur[key] = cur[key].map((v, i) => lerp(v, tg[key][i], k));
    cur.night = tg.night;
    // lightning: a bolt, a flicker, a second strike
    if (cur.storm > .5) {
      this._nextBolt -= dt;
      if (this._nextBolt <= 0) {
        this._bolt = makeBolt(); this._flashV = 1; this._nextBolt = 3.5 + R() * 6;
        setTimeout(() => { if (this._bolt) this._bolt.a = .25; }, 90);
        setTimeout(() => { if (this._bolt) this._bolt.a = 1; this._flashV = .8; }, 170);
      }
    }
    this._flashV *= Math.pow(.004, dt);
    if (this._bolt) { this._bolt.a *= Math.pow(.02, dt); if (this._bolt.a < .02) this._bolt = null; }

    const gl = this._gl, U = this._U;
    if (gl) {
      gl.uniform2f(U.R, this._sky.width, this._sky.height); gl.uniform1f(U.t, t);
      for (const key of KEYS) if (U[key]) gl.uniform1f(U[key], cur[key]);
      gl.uniform1f(U.night, cur.night); gl.uniform1f(U.flash, this._flashV);
      gl.uniform3fv(U.top, cur.top); gl.uniform3fv(U.bot, cur.bot); gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    this._flash.style.opacity = (this._flashV * .35).toFixed(3);
    this._fx2d(cur, t, dt);
  }

  _fx2d(cur, t, dt) {
    const g = this._g, W = this._W, H = this._H, s = this._s;
    g.clearRect(0, 0, W, H);
    if (cur.cold > .02) { this._mist = this._mist || this._paintMist(); g.globalAlpha = Math.min(1, cur.cold) * (.8 + .2 * Math.sin(t * .5)); g.drawImage(this._mist, 0, 0); g.globalAlpha = 1; }
    if (cur.frost > .02) {
      this._frost = this._frost || this._paintFrost();
      g.globalAlpha = Math.min(1, cur.frost); g.drawImage(this._frost, 0, 0); g.globalAlpha = 1;
      if (!cur.night) for (const [x, y, p] of this._sparks) {
        const a = Math.max(0, Math.sin(t * 1.7 + p * 5)) ** 8 * cur.frost; if (a < .05) continue;
        g.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`; g.beginPath(); g.arc(x, y, 2.2 * s, 0, 7); g.fill();
        g.fillRect(x - 7 * s * a, y - .5, 14 * s * a, 1); g.fillRect(x - .5, y - 7 * s * a, 1, 14 * s * a);
      }
    }
    if (cur.smoke > .2) for (const m of this._ash) {
      m.x += m.vx * dt; m.y += m.vy * dt + Math.sin(t + m.p) * 3 * dt * s;
      if (m.x > W + 5) { m.x = -5; m.y = R() * H; } if (m.y > H + 5) m.y = -5;
      g.fillStyle = `rgba(70,55,45,${(.35 * cur.smoke).toFixed(3)})`; g.beginPath(); g.arc(m.x, m.y, m.r, 0, 7); g.fill();
    }
    if (cur.rain > .02) {
      const n = Math.floor(this._streaks.length * Math.min(1, cur.rain / 1.5)), sl = .18 + cur.wind * .3;
      g.lineCap = "round"; g.lineWidth = 1.5 * s + .3;
      for (let i = 0; i < n; i++) {
        const d = this._streaks[i]; d.y += d.v * dt; d.x -= d.v * dt * sl;
        if (d.y > H + 20) { d.y = -30; d.x = R() * W * 1.15; } if (d.x < -40) d.x += W * 1.15;
        g.strokeStyle = `rgba(${cur.night ? "190,205,235" : "230,238,250"},${(d.a * Math.min(1, cur.rain)).toFixed(3)})`;
        g.beginPath(); g.moveTo(d.x, d.y); g.lineTo(d.x + d.l * sl, d.y - d.l); g.stroke();
      }
      // drops on the glass: they sit, and now and then a big one runs down
      const al = Math.min(1, cur.rain), nb = Math.floor(this._beads.length * al);
      for (let i = 0; i < nb; i++) {
        const b = this._beads[i];
        if (b.v === 0 && b.r > 4 * s && R() < dt * .08) b.v = (60 + R() * 120) * s;
        if (b.v > 0) { b.y += b.v * dt; g.strokeStyle = "rgba(220,230,245,.12)"; g.lineWidth = b.r * .8; g.beginPath(); g.moveTo(b.x, b.y - b.r * 6); g.lineTo(b.x, b.y); g.stroke(); }
        if (b.y > H + 10) { b.y = R() * H * .6; b.x = R() * W; b.v = 0; b.r = (1.5 + R() * R() * 5) * s; }
        const gr = g.createRadialGradient(b.x - b.r * .3, b.y - b.r * .3, 0, b.x, b.y, b.r);
        gr.addColorStop(0, `rgba(255,255,255,${.75 * al})`); gr.addColorStop(.45, `rgba(200,215,235,${.25 * al})`); gr.addColorStop(1, `rgba(20,30,50,${.35 * al})`);
        g.fillStyle = gr; g.beginPath(); g.arc(b.x, b.y, b.r, 0, 7); g.fill();
      }
    }
    if (cur.wind > .4) {
      g.lineWidth = 2 * s;
      for (const w of this._gusts) {
        w.x += w.v * dt * cur.wind; if (w.x > W + 200) { w.x = -w.l; w.y = R() * H; }
        const gr = g.createLinearGradient(w.x, 0, w.x + w.l, 0);
        gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(.5, `rgba(255,255,255,${(w.a * (cur.wind - .4)).toFixed(3)})`); gr.addColorStop(1, "rgba(255,255,255,0)");
        g.strokeStyle = gr; g.beginPath(); g.moveTo(w.x, w.y); g.quadraticCurveTo(w.x + w.l / 2, w.y - 10 * s, w.x + w.l, w.y); g.stroke();
      }
    }
    const bolt = this._bolt;
    if (bolt && bolt.a > 0) {
      g.save(); g.lineCap = "round"; g.lineJoin = "round";
      for (const [blur, lw, col] of [[28, 9, "rgba(170,185,255,"], [10, 4, "rgba(220,228,255,"], [0, 1.8, "rgba(255,255,255,"]]) {
        g.shadowBlur = blur * s; g.shadowColor = "rgba(180,195,255,.9)";
        for (const br of bolt.paths) {
          g.lineWidth = lw * s * br.w; g.strokeStyle = col + (bolt.a * br.w).toFixed(3) + ")"; g.beginPath();
          br.pts.forEach(([x, y], i) => i ? g.lineTo(x * W, y * H) : g.moveTo(x * W, y * H)); g.stroke();
        }
      }
      g.restore();
    }
  }
}
if (!customElements.get("meridian-sky")) customElements.define("meridian-sky", MeridianSky);
