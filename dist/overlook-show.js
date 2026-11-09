// www/lit-all.min.js
var t = globalThis;
var s = t.ShadowRoot && (void 0 === t.ShadyCSS || t.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype;
var i = Symbol();
var e = /* @__PURE__ */ new WeakMap();
var n = class {
  constructor(t3, s2, e2) {
    if (this._$cssResult$ = true, e2 !== i) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t3, this.t = s2;
  }
  get styleSheet() {
    let t3 = this.i;
    const i2 = this.t;
    if (s && void 0 === t3) {
      const s2 = void 0 !== i2 && 1 === i2.length;
      s2 && (t3 = e.get(i2)), void 0 === t3 && ((this.i = t3 = new CSSStyleSheet()).replaceSync(this.cssText), s2 && e.set(i2, t3));
    }
    return t3;
  }
  toString() {
    return this.cssText;
  }
};
var r = (t3) => new n("string" == typeof t3 ? t3 : t3 + "", void 0, i);
var o = (t3, ...s2) => {
  const e2 = 1 === t3.length ? t3[0] : s2.reduce((s3, i2, e3) => s3 + ((t4) => {
    if (true === t4._$cssResult$) return t4.cssText;
    if ("number" == typeof t4) return t4;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + t4 + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(i2) + t3[e3 + 1], t3[0]);
  return new n(e2, t3, i);
};
var h = (i2, e2) => {
  if (s) i2.adoptedStyleSheets = e2.map((t3) => t3 instanceof CSSStyleSheet ? t3 : t3.styleSheet);
  else for (const s2 of e2) {
    const e3 = document.createElement("style"), n2 = t.litNonce;
    void 0 !== n2 && e3.setAttribute("nonce", n2), e3.textContent = s2.cssText, i2.appendChild(e3);
  }
};
var c = s ? (t3) => t3 : (t3) => t3 instanceof CSSStyleSheet ? ((t4) => {
  let s2 = "";
  for (const i2 of t4.cssRules) s2 += i2.cssText;
  return r(s2);
})(t3) : t3;
var { is: l, defineProperty: a, getOwnPropertyDescriptor: u, getOwnPropertyNames: d, getOwnPropertySymbols: f, getPrototypeOf: p } = Object;
var v = globalThis;
var y = v.trustedTypes;
var m = y ? y.emptyScript : "";
var b = v.reactiveElementPolyfillSupport;
var g = (t3, s2) => t3;
var w = { toAttribute(t3, s2) {
  switch (s2) {
    case Boolean:
      t3 = t3 ? m : null;
      break;
    case Object:
    case Array:
      t3 = null == t3 ? t3 : JSON.stringify(t3);
  }
  return t3;
}, fromAttribute(t3, s2) {
  let i2 = t3;
  switch (s2) {
    case Boolean:
      i2 = null !== t3;
      break;
    case Number:
      i2 = null === t3 ? null : Number(t3);
      break;
    case Object:
    case Array:
      try {
        i2 = JSON.parse(t3);
      } catch (t4) {
        i2 = null;
      }
  }
  return i2;
} };
var _ = (t3, s2) => !l(t3, s2);
var S = { attribute: true, type: String, converter: w, reflect: false, hasChanged: _ };
Symbol.metadata ??= Symbol("metadata"), v.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
var $ = class extends HTMLElement {
  static addInitializer(t3) {
    this.o(), (this.l ??= []).push(t3);
  }
  static get observedAttributes() {
    return this.finalize(), this.u && [...this.u.keys()];
  }
  static createProperty(t3, s2 = S) {
    if (s2.state && (s2.attribute = false), this.o(), this.elementProperties.set(t3, s2), !s2.noAccessor) {
      const i2 = Symbol(), e2 = this.getPropertyDescriptor(t3, i2, s2);
      void 0 !== e2 && a(this.prototype, t3, e2);
    }
  }
  static getPropertyDescriptor(t3, s2, i2) {
    const { get: e2, set: n2 } = u(this.prototype, t3) ?? { get() {
      return this[s2];
    }, set(t4) {
      this[s2] = t4;
    } };
    return { get() {
      return e2?.call(this);
    }, set(s3) {
      const r2 = e2?.call(this);
      n2.call(this, s3), this.requestUpdate(t3, r2, i2);
    }, configurable: true, enumerable: true };
  }
  static getPropertyOptions(t3) {
    return this.elementProperties.get(t3) ?? S;
  }
  static o() {
    if (this.hasOwnProperty(g("elementProperties"))) return;
    const t3 = p(this);
    t3.finalize(), void 0 !== t3.l && (this.l = [...t3.l]), this.elementProperties = new Map(t3.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(g("finalized"))) return;
    if (this.finalized = true, this.o(), this.hasOwnProperty(g("properties"))) {
      const t4 = this.properties, s2 = [...d(t4), ...f(t4)];
      for (const i2 of s2) this.createProperty(i2, t4[i2]);
    }
    const t3 = this[Symbol.metadata];
    if (null !== t3) {
      const s2 = litPropertyMetadata.get(t3);
      if (void 0 !== s2) for (const [t4, i2] of s2) this.elementProperties.set(t4, i2);
    }
    this.u = /* @__PURE__ */ new Map();
    for (const [t4, s2] of this.elementProperties) {
      const i2 = this.p(t4, s2);
      void 0 !== i2 && this.u.set(i2, t4);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(t3) {
    const s2 = [];
    if (Array.isArray(t3)) {
      const i2 = new Set(t3.flat(1 / 0).reverse());
      for (const t4 of i2) s2.unshift(c(t4));
    } else void 0 !== t3 && s2.push(c(t3));
    return s2;
  }
  static p(t3, s2) {
    const i2 = s2.attribute;
    return false === i2 ? void 0 : "string" == typeof i2 ? i2 : "string" == typeof t3 ? t3.toLowerCase() : void 0;
  }
  constructor() {
    super(), this.v = void 0, this.isUpdatePending = false, this.hasUpdated = false, this.m = null, this._();
  }
  _() {
    this.S = new Promise((t3) => this.enableUpdating = t3), this._$AL = /* @__PURE__ */ new Map(), this.$(), this.requestUpdate(), this.constructor.l?.forEach((t3) => t3(this));
  }
  addController(t3) {
    (this.P ??= /* @__PURE__ */ new Set()).add(t3), void 0 !== this.renderRoot && this.isConnected && t3.hostConnected?.();
  }
  removeController(t3) {
    this.P?.delete(t3);
  }
  $() {
    const t3 = /* @__PURE__ */ new Map(), s2 = this.constructor.elementProperties;
    for (const i2 of s2.keys()) this.hasOwnProperty(i2) && (t3.set(i2, this[i2]), delete this[i2]);
    t3.size > 0 && (this.v = t3);
  }
  createRenderRoot() {
    const t3 = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return h(t3, this.constructor.elementStyles), t3;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(true), this.P?.forEach((t3) => t3.hostConnected?.());
  }
  enableUpdating(t3) {
  }
  disconnectedCallback() {
    this.P?.forEach((t3) => t3.hostDisconnected?.());
  }
  attributeChangedCallback(t3, s2, i2) {
    this._$AK(t3, i2);
  }
  C(t3, s2) {
    const i2 = this.constructor.elementProperties.get(t3), e2 = this.constructor.p(t3, i2);
    if (void 0 !== e2 && true === i2.reflect) {
      const n2 = (void 0 !== i2.converter?.toAttribute ? i2.converter : w).toAttribute(s2, i2.type);
      this.m = t3, null == n2 ? this.removeAttribute(e2) : this.setAttribute(e2, n2), this.m = null;
    }
  }
  _$AK(t3, s2) {
    const i2 = this.constructor, e2 = i2.u.get(t3);
    if (void 0 !== e2 && this.m !== e2) {
      const t4 = i2.getPropertyOptions(e2), n2 = "function" == typeof t4.converter ? { fromAttribute: t4.converter } : void 0 !== t4.converter?.fromAttribute ? t4.converter : w;
      this.m = e2, this[e2] = n2.fromAttribute(s2, t4.type), this.m = null;
    }
  }
  requestUpdate(t3, s2, i2) {
    if (void 0 !== t3) {
      if (i2 ??= this.constructor.getPropertyOptions(t3), !(i2.hasChanged ?? _)(this[t3], s2)) return;
      this.T(t3, s2, i2);
    }
    false === this.isUpdatePending && (this.S = this.M());
  }
  T(t3, s2, i2) {
    this._$AL.has(t3) || this._$AL.set(t3, s2), true === i2.reflect && this.m !== t3 && (this.k ??= /* @__PURE__ */ new Set()).add(t3);
  }
  async M() {
    this.isUpdatePending = true;
    try {
      await this.S;
    } catch (t4) {
      Promise.reject(t4);
    }
    const t3 = this.scheduleUpdate();
    return null != t3 && await t3, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ??= this.createRenderRoot(), this.v) {
        for (const [t5, s3] of this.v) this[t5] = s3;
        this.v = void 0;
      }
      const t4 = this.constructor.elementProperties;
      if (t4.size > 0) for (const [s3, i2] of t4) true !== i2.wrapped || this._$AL.has(s3) || void 0 === this[s3] || this.T(s3, this[s3], i2);
    }
    let t3 = false;
    const s2 = this._$AL;
    try {
      t3 = this.shouldUpdate(s2), t3 ? (this.willUpdate(s2), this.P?.forEach((t4) => t4.hostUpdate?.()), this.update(s2)) : this.A();
    } catch (s3) {
      throw t3 = false, this.A(), s3;
    }
    t3 && this._$AE(s2);
  }
  willUpdate(t3) {
  }
  _$AE(t3) {
    this.P?.forEach((t4) => t4.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = true, this.firstUpdated(t3)), this.updated(t3);
  }
  A() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = false;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this.S;
  }
  shouldUpdate(t3) {
    return true;
  }
  update(t3) {
    this.k &&= this.k.forEach((t4) => this.C(t4, this[t4])), this.A();
  }
  updated(t3) {
  }
  firstUpdated(t3) {
  }
};
$.elementStyles = [], $.shadowRootOptions = { mode: "open" }, $[g("elementProperties")] = /* @__PURE__ */ new Map(), $[g("finalized")] = /* @__PURE__ */ new Map(), b?.({ ReactiveElement: $ }), (v.reactiveElementVersions ??= []).push("2.0.4");
var T = globalThis;
var x = T.trustedTypes;
var E = x ? x.createPolicy("lit-html", { createHTML: (t3) => t3 }) : void 0;
var C = "$lit$";
var P = `lit$${Math.random().toFixed(9).slice(2)}$`;
var A = "?" + P;
var M = `<${A}>`;
var k = document;
var U = () => k.createComment("");
var V = (t3) => null === t3 || "object" != typeof t3 && "function" != typeof t3;
var O = Array.isArray;
var R = (t3) => O(t3) || "function" == typeof t3?.[Symbol.iterator];
var N = "[ 	\n\f\r]";
var L = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g;
var z = /-->/g;
var j = />/g;
var H = RegExp(`>|${N}(?:([^\\s"'>=/]+)(${N}*=${N}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g");
var I = /'/g;
var D = /"/g;
var B = /^(?:script|style|textarea|title)$/i;
var W = (t3) => (s2, ...i2) => ({ _$litType$: t3, strings: s2, values: i2 });
var Z = W(1);
var q = W(2);
var F = W(3);
var G = Symbol.for("lit-noChange");
var J = Symbol.for("lit-nothing");
var K = /* @__PURE__ */ new WeakMap();
var Y = k.createTreeWalker(k, 129);
function Q(t3, s2) {
  if (!O(t3) || !t3.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return void 0 !== E ? E.createHTML(s2) : s2;
}
var X = (t3, s2) => {
  const i2 = t3.length - 1, e2 = [];
  let n2, r2 = 2 === s2 ? "<svg>" : 3 === s2 ? "<math>" : "", o2 = L;
  for (let s3 = 0; s3 < i2; s3++) {
    const i3 = t3[s3];
    let h2, c2, l2 = -1, a2 = 0;
    for (; a2 < i3.length && (o2.lastIndex = a2, c2 = o2.exec(i3), null !== c2); ) a2 = o2.lastIndex, o2 === L ? "!--" === c2[1] ? o2 = z : void 0 !== c2[1] ? o2 = j : void 0 !== c2[2] ? (B.test(c2[2]) && (n2 = RegExp("</" + c2[2], "g")), o2 = H) : void 0 !== c2[3] && (o2 = H) : o2 === H ? ">" === c2[0] ? (o2 = n2 ?? L, l2 = -1) : void 0 === c2[1] ? l2 = -2 : (l2 = o2.lastIndex - c2[2].length, h2 = c2[1], o2 = void 0 === c2[3] ? H : '"' === c2[3] ? D : I) : o2 === D || o2 === I ? o2 = H : o2 === z || o2 === j ? o2 = L : (o2 = H, n2 = void 0);
    const u2 = o2 === H && t3[s3 + 1].startsWith("/>") ? " " : "";
    r2 += o2 === L ? i3 + M : l2 >= 0 ? (e2.push(h2), i3.slice(0, l2) + C + i3.slice(l2) + P + u2) : i3 + P + (-2 === l2 ? s3 : u2);
  }
  return [Q(t3, r2 + (t3[i2] || "<?>") + (2 === s2 ? "</svg>" : 3 === s2 ? "</math>" : "")), e2];
};
var tt = class _tt {
  constructor({ strings: t3, _$litType$: s2 }, i2) {
    let e2;
    this.parts = [];
    let n2 = 0, r2 = 0;
    const o2 = t3.length - 1, h2 = this.parts, [c2, l2] = X(t3, s2);
    if (this.el = _tt.createElement(c2, i2), Y.currentNode = this.el.content, 2 === s2 || 3 === s2) {
      const t4 = this.el.content.firstChild;
      t4.replaceWith(...t4.childNodes);
    }
    for (; null !== (e2 = Y.nextNode()) && h2.length < o2; ) {
      if (1 === e2.nodeType) {
        if (e2.hasAttributes()) for (const t4 of e2.getAttributeNames()) if (t4.endsWith(C)) {
          const s3 = l2[r2++], i3 = e2.getAttribute(t4).split(P), o3 = /([.?@])?(.*)/.exec(s3);
          h2.push({ type: 1, index: n2, name: o3[2], strings: i3, ctor: "." === o3[1] ? rt : "?" === o3[1] ? ot : "@" === o3[1] ? ht : nt }), e2.removeAttribute(t4);
        } else t4.startsWith(P) && (h2.push({ type: 6, index: n2 }), e2.removeAttribute(t4));
        if (B.test(e2.tagName)) {
          const t4 = e2.textContent.split(P), s3 = t4.length - 1;
          if (s3 > 0) {
            e2.textContent = x ? x.emptyScript : "";
            for (let i3 = 0; i3 < s3; i3++) e2.append(t4[i3], U()), Y.nextNode(), h2.push({ type: 2, index: ++n2 });
            e2.append(t4[s3], U());
          }
        }
      } else if (8 === e2.nodeType) if (e2.data === A) h2.push({ type: 2, index: n2 });
      else {
        let t4 = -1;
        for (; -1 !== (t4 = e2.data.indexOf(P, t4 + 1)); ) h2.push({ type: 7, index: n2 }), t4 += P.length - 1;
      }
      n2++;
    }
  }
  static createElement(t3, s2) {
    const i2 = k.createElement("template");
    return i2.innerHTML = t3, i2;
  }
};
function st(t3, s2, i2 = t3, e2) {
  if (s2 === G) return s2;
  let n2 = void 0 !== e2 ? i2.U?.[e2] : i2.N;
  const r2 = V(s2) ? void 0 : s2._$litDirective$;
  return n2?.constructor !== r2 && (n2?._$AO?.(false), void 0 === r2 ? n2 = void 0 : (n2 = new r2(t3), n2._$AT(t3, i2, e2)), void 0 !== e2 ? (i2.U ??= [])[e2] = n2 : i2.N = n2), void 0 !== n2 && (s2 = st(t3, n2._$AS(t3, s2.values), n2, e2)), s2;
}
var it = class {
  constructor(t3, s2) {
    this._$AV = [], this._$AN = void 0, this._$AD = t3, this._$AM = s2;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  O(t3) {
    const { el: { content: s2 }, parts: i2 } = this._$AD, e2 = (t3?.creationScope ?? k).importNode(s2, true);
    Y.currentNode = e2;
    let n2 = Y.nextNode(), r2 = 0, o2 = 0, h2 = i2[0];
    for (; void 0 !== h2; ) {
      if (r2 === h2.index) {
        let s3;
        2 === h2.type ? s3 = new et(n2, n2.nextSibling, this, t3) : 1 === h2.type ? s3 = new h2.ctor(n2, h2.name, h2.strings, this, t3) : 6 === h2.type && (s3 = new ct(n2, this, t3)), this._$AV.push(s3), h2 = i2[++o2];
      }
      r2 !== h2?.index && (n2 = Y.nextNode(), r2++);
    }
    return Y.currentNode = k, e2;
  }
  R(t3) {
    let s2 = 0;
    for (const i2 of this._$AV) void 0 !== i2 && (void 0 !== i2.strings ? (i2._$AI(t3, i2, s2), s2 += i2.strings.length - 2) : i2._$AI(t3[s2])), s2++;
  }
};
var et = class t2 {
  get _$AU() {
    return this._$AM?._$AU ?? this.V;
  }
  constructor(t3, s2, i2, e2) {
    this.type = 2, this._$AH = J, this._$AN = void 0, this._$AA = t3, this._$AB = s2, this._$AM = i2, this.options = e2, this.V = e2?.isConnected ?? true;
  }
  get parentNode() {
    let t3 = this._$AA.parentNode;
    const s2 = this._$AM;
    return void 0 !== s2 && 11 === t3?.nodeType && (t3 = s2.parentNode), t3;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t3, s2 = this) {
    t3 = st(this, t3, s2), V(t3) ? t3 === J || null == t3 || "" === t3 ? (this._$AH !== J && this._$AR(), this._$AH = J) : t3 !== this._$AH && t3 !== G && this.L(t3) : void 0 !== t3._$litType$ ? this.I(t3) : void 0 !== t3.nodeType ? this.j(t3) : R(t3) ? this.D(t3) : this.L(t3);
  }
  H(t3) {
    return this._$AA.parentNode.insertBefore(t3, this._$AB);
  }
  j(t3) {
    this._$AH !== t3 && (this._$AR(), this._$AH = this.H(t3));
  }
  L(t3) {
    this._$AH !== J && V(this._$AH) ? this._$AA.nextSibling.data = t3 : this.j(k.createTextNode(t3)), this._$AH = t3;
  }
  I(t3) {
    const { values: s2, _$litType$: i2 } = t3, e2 = "number" == typeof i2 ? this._$AC(t3) : (void 0 === i2.el && (i2.el = tt.createElement(Q(i2.h, i2.h[0]), this.options)), i2);
    if (this._$AH?._$AD === e2) this._$AH.R(s2);
    else {
      const t4 = new it(e2, this), i3 = t4.O(this.options);
      t4.R(s2), this.j(i3), this._$AH = t4;
    }
  }
  _$AC(t3) {
    let s2 = K.get(t3.strings);
    return void 0 === s2 && K.set(t3.strings, s2 = new tt(t3)), s2;
  }
  D(s2) {
    O(this._$AH) || (this._$AH = [], this._$AR());
    const i2 = this._$AH;
    let e2, n2 = 0;
    for (const r2 of s2) n2 === i2.length ? i2.push(e2 = new t2(this.H(U()), this.H(U()), this, this.options)) : e2 = i2[n2], e2._$AI(r2), n2++;
    n2 < i2.length && (this._$AR(e2 && e2._$AB.nextSibling, n2), i2.length = n2);
  }
  _$AR(t3 = this._$AA.nextSibling, s2) {
    for (this._$AP?.(false, true, s2); t3 && t3 !== this._$AB; ) {
      const s3 = t3.nextSibling;
      t3.remove(), t3 = s3;
    }
  }
  setConnected(t3) {
    void 0 === this._$AM && (this.V = t3, this._$AP?.(t3));
  }
};
var nt = class {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t3, s2, i2, e2, n2) {
    this.type = 1, this._$AH = J, this._$AN = void 0, this.element = t3, this.name = s2, this._$AM = e2, this.options = n2, i2.length > 2 || "" !== i2[0] || "" !== i2[1] ? (this._$AH = Array(i2.length - 1).fill(new String()), this.strings = i2) : this._$AH = J;
  }
  _$AI(t3, s2 = this, i2, e2) {
    const n2 = this.strings;
    let r2 = false;
    if (void 0 === n2) t3 = st(this, t3, s2, 0), r2 = !V(t3) || t3 !== this._$AH && t3 !== G, r2 && (this._$AH = t3);
    else {
      const e3 = t3;
      let o2, h2;
      for (t3 = n2[0], o2 = 0; o2 < n2.length - 1; o2++) h2 = st(this, e3[i2 + o2], s2, o2), h2 === G && (h2 = this._$AH[o2]), r2 ||= !V(h2) || h2 !== this._$AH[o2], h2 === J ? t3 = J : t3 !== J && (t3 += (h2 ?? "") + n2[o2 + 1]), this._$AH[o2] = h2;
    }
    r2 && !e2 && this.B(t3);
  }
  B(t3) {
    t3 === J ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t3 ?? "");
  }
};
var rt = class extends nt {
  constructor() {
    super(...arguments), this.type = 3;
  }
  B(t3) {
    this.element[this.name] = t3 === J ? void 0 : t3;
  }
};
var ot = class extends nt {
  constructor() {
    super(...arguments), this.type = 4;
  }
  B(t3) {
    this.element.toggleAttribute(this.name, !!t3 && t3 !== J);
  }
};
var ht = class extends nt {
  constructor(t3, s2, i2, e2, n2) {
    super(t3, s2, i2, e2, n2), this.type = 5;
  }
  _$AI(t3, s2 = this) {
    if ((t3 = st(this, t3, s2, 0) ?? J) === G) return;
    const i2 = this._$AH, e2 = t3 === J && i2 !== J || t3.capture !== i2.capture || t3.once !== i2.once || t3.passive !== i2.passive, n2 = t3 !== J && (i2 === J || e2);
    e2 && this.element.removeEventListener(this.name, this, i2), n2 && this.element.addEventListener(this.name, this, t3), this._$AH = t3;
  }
  handleEvent(t3) {
    "function" == typeof this._$AH ? this._$AH.call(this.options?.host ?? this.element, t3) : this._$AH.handleEvent(t3);
  }
};
var ct = class {
  constructor(t3, s2, i2) {
    this.element = t3, this.type = 6, this._$AN = void 0, this._$AM = s2, this.options = i2;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t3) {
    st(this, t3);
  }
};
var lt = { W: C, q: P, J: A, Z: 1, F: X, G: it, K: R, X: st, Y: et, tt: nt, st: ot, it: ht, et: rt, ht: ct };
var at = T.litHtmlPolyfillSupport;
at?.(tt, et), (T.litHtmlVersions ??= []).push("3.2.1");
var ut = (t3, s2, i2) => {
  const e2 = i2?.renderBefore ?? s2;
  let n2 = e2._$litPart$;
  if (void 0 === n2) {
    const t4 = i2?.renderBefore ?? null;
    e2._$litPart$ = n2 = new et(s2.insertBefore(U(), t4), t4, void 0, i2 ?? {});
  }
  return n2._$AI(t3), n2;
};
var dt = class extends $ {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this.ot = void 0;
  }
  createRenderRoot() {
    const t3 = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= t3.firstChild, t3;
  }
  update(t3) {
    const s2 = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t3), this.ot = ut(s2, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this.ot?.setConnected(true);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this.ot?.setConnected(false);
  }
  render() {
    return G;
  }
};
dt._$litElement$ = true, dt["finalized"] = true, globalThis.litElementHydrateSupport?.({ LitElement: dt });
var ft = globalThis.litElementPolyfillSupport;
ft?.({ LitElement: dt });
(globalThis.litElementVersions ??= []).push("4.1.1");
var { Y: yt } = lt;
var mt = (t3) => null === t3 || "object" != typeof t3 && "function" != typeof t3;
var gt = (t3, s2) => void 0 === s2 ? void 0 !== t3?._$litType$ : t3?._$litType$ === s2;
var wt = (t3) => null != t3?._$litType$?.h;
var $t = (t3) => void 0 === t3.strings;
var Tt = () => document.createComment("");
var xt = (t3, s2, i2) => {
  const e2 = t3._$AA.parentNode, n2 = void 0 === s2 ? t3._$AB : s2._$AA;
  if (void 0 === i2) {
    const s3 = e2.insertBefore(Tt(), n2), r2 = e2.insertBefore(Tt(), n2);
    i2 = new yt(s3, r2, t3, t3.options);
  } else {
    const s3 = i2._$AB.nextSibling, r2 = i2._$AM, o2 = r2 !== t3;
    if (o2) {
      let s4;
      i2._$AQ?.(t3), i2._$AM = t3, void 0 !== i2._$AP && (s4 = t3._$AU) !== r2._$AU && i2._$AP(s4);
    }
    if (s3 !== n2 || o2) {
      let t4 = i2._$AA;
      for (; t4 !== s3; ) {
        const s4 = t4.nextSibling;
        e2.insertBefore(t4, n2), t4 = s4;
      }
    }
  }
  return i2;
};
var Et = (t3, s2, i2 = t3) => (t3._$AI(s2, i2), t3);
var Ct = {};
var Pt = (t3, s2 = Ct) => t3._$AH = s2;
var At = (t3) => t3._$AH;
var Mt = (t3) => {
  t3._$AP?.(false, true);
  let s2 = t3._$AA;
  const i2 = t3._$AB.nextSibling;
  for (; s2 !== i2; ) {
    const t4 = s2.nextSibling;
    s2.remove(), s2 = t4;
  }
};
var kt = (t3) => {
  t3._$AR();
};
var Vt = (t3) => (...s2) => ({ _$litDirective$: t3, values: s2 });
var Ot = class {
  constructor(t3) {
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AT(t3, s2, i2) {
    this.nt = t3, this._$AM = s2, this.rt = i2;
  }
  _$AS(t3, s2) {
    return this.update(t3, s2);
  }
  update(t3, s2) {
    return this.render(...s2);
  }
};
var Rt = (t3, s2) => {
  const i2 = t3._$AN;
  if (void 0 === i2) return false;
  for (const t4 of i2) t4._$AO?.(s2, false), Rt(t4, s2);
  return true;
};
var Nt = (t3) => {
  let s2, i2;
  do {
    if (void 0 === (s2 = t3._$AM)) break;
    i2 = s2._$AN, i2.delete(t3), t3 = s2;
  } while (0 === i2?.size);
};
var Lt = (t3) => {
  for (let s2; s2 = t3._$AM; t3 = s2) {
    let i2 = s2._$AN;
    if (void 0 === i2) s2._$AN = i2 = /* @__PURE__ */ new Set();
    else if (i2.has(t3)) break;
    i2.add(t3), Ht(s2);
  }
};
function zt(t3) {
  void 0 !== this._$AN ? (Nt(this), this._$AM = t3, Lt(this)) : this._$AM = t3;
}
function jt(t3, s2 = false, i2 = 0) {
  const e2 = this._$AH, n2 = this._$AN;
  if (void 0 !== n2 && 0 !== n2.size) if (s2) if (Array.isArray(e2)) for (let t4 = i2; t4 < e2.length; t4++) Rt(e2[t4], false), Nt(e2[t4]);
  else null != e2 && (Rt(e2, false), Nt(e2));
  else Rt(this, t3);
}
var Ht = (t3) => {
  2 == t3.type && (t3._$AP ??= jt, t3._$AQ ??= zt);
};
var It = class extends Ot {
  constructor() {
    super(...arguments), this._$AN = void 0;
  }
  _$AT(t3, s2, i2) {
    super._$AT(t3, s2, i2), Lt(this), this.isConnected = t3._$AU;
  }
  _$AO(t3, s2 = true) {
    t3 !== this.isConnected && (this.isConnected = t3, t3 ? this.reconnected?.() : this.disconnected?.()), s2 && (Rt(this, t3), Nt(this));
  }
  setValue(t3) {
    if ($t(this.nt)) this.nt._$AI(t3, this);
    else {
      const s2 = [...this.nt._$AH];
      s2[this.rt] = t3, this.nt._$AI(s2, this, 0);
    }
  }
  disconnected() {
  }
  reconnected() {
  }
};
var Dt = class {
  constructor(t3) {
    this.ct = t3;
  }
  disconnect() {
    this.ct = void 0;
  }
  reconnect(t3) {
    this.ct = t3;
  }
  deref() {
    return this.ct;
  }
};
var Bt = class {
  constructor() {
    this.lt = void 0, this.ut = void 0;
  }
  get() {
    return this.lt;
  }
  pause() {
    this.lt ??= new Promise((t3) => this.ut = t3);
  }
  resume() {
    this.ut?.(), this.lt = this.ut = void 0;
  }
};
var Wt = class extends It {
  constructor() {
    super(...arguments), this.dt = new Dt(this), this.ft = new Bt();
  }
  render(t3, s2) {
    return G;
  }
  update(t3, [s2, i2]) {
    if (this.isConnected || this.disconnected(), s2 === this.vt) return G;
    this.vt = s2;
    let e2 = 0;
    const { dt: n2, ft: r2 } = this;
    return (async (t4, s3) => {
      for await (const i3 of t4) if (false === await s3(i3)) return;
    })(s2, async (t4) => {
      for (; r2.get(); ) await r2.get();
      const o2 = n2.deref();
      if (void 0 !== o2) {
        if (o2.vt !== s2) return false;
        void 0 !== i2 && (t4 = i2(t4, e2)), o2.commitValue(t4, e2), e2++;
      }
      return true;
    }), G;
  }
  commitValue(t3, s2) {
    this.setValue(t3);
  }
  disconnected() {
    this.dt.disconnect(), this.ft.pause();
  }
  reconnected() {
    this.dt.reconnect(this), this.ft.resume();
  }
};
var Zt = Vt(Wt);
var qt = Vt(
  /**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */
  class extends Wt {
    constructor(t3) {
      if (super(t3), 2 !== t3.type) throw Error("asyncAppend can only be used in child expressions");
    }
    update(t3, s2) {
      return this.ot = t3, super.update(t3, s2);
    }
    commitValue(t3, s2) {
      0 === s2 && kt(this.ot);
      const i2 = xt(this.ot);
      Et(i2, t3);
    }
  }
);
var Ft = (t3) => wt(t3) ? t3._$litType$.h : t3.strings;
var Gt = Vt(class extends Ot {
  constructor(t3) {
    super(t3), this.yt = /* @__PURE__ */ new WeakMap();
  }
  render(t3) {
    return [t3];
  }
  update(t3, [s2]) {
    const i2 = gt(this.bt) ? Ft(this.bt) : null, e2 = gt(s2) ? Ft(s2) : null;
    if (null !== i2 && (null === e2 || i2 !== e2)) {
      const s3 = At(t3).pop();
      let e3 = this.yt.get(i2);
      if (void 0 === e3) {
        const t4 = document.createDocumentFragment();
        e3 = ut(J, t4), e3.setConnected(false), this.yt.set(i2, e3);
      }
      Pt(e3, [s3]), xt(e3, void 0, s3);
    }
    if (null !== e2) {
      if (null === i2 || i2 !== e2) {
        const s3 = this.yt.get(e2);
        if (void 0 !== s3) {
          const i3 = At(s3).pop();
          kt(t3), xt(t3, void 0, i3), Pt(t3, [i3]);
        }
      }
      this.bt = s2;
    } else this.bt = void 0;
    return this.render(s2);
  }
});
var Kt = Vt(
  /**
   * @license
   * Copyright 2018 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */
  class extends Ot {
    constructor(t3) {
      if (super(t3), 1 !== t3.type || "class" !== t3.name || t3.strings?.length > 2) throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.");
    }
    render(t3) {
      return " " + Object.keys(t3).filter((s2) => t3[s2]).join(" ") + " ";
    }
    update(t3, [s2]) {
      if (void 0 === this.gt) {
        this.gt = /* @__PURE__ */ new Set(), void 0 !== t3.strings && (this.wt = new Set(t3.strings.join(" ").split(/\s/).filter((t4) => "" !== t4)));
        for (const t4 in s2) s2[t4] && !this.wt?.has(t4) && this.gt.add(t4);
        return this.render(s2);
      }
      const i2 = t3.element.classList;
      for (const t4 of this.gt) t4 in s2 || (i2.remove(t4), this.gt.delete(t4));
      for (const t4 in s2) {
        const e2 = !!s2[t4];
        e2 === this.gt.has(t4) || this.wt?.has(t4) || (e2 ? (i2.add(t4), this.gt.add(t4)) : (i2.remove(t4), this.gt.delete(t4)));
      }
      return G;
    }
  }
);
var Yt = {};
var Qt = Vt(class extends Ot {
  constructor() {
    super(...arguments), this._t = Yt;
  }
  render(t3, s2) {
    return s2();
  }
  update(t3, [s2, i2]) {
    if (Array.isArray(s2)) {
      if (Array.isArray(this._t) && this._t.length === s2.length && s2.every((t4, s3) => t4 === this._t[s3])) return G;
    } else if (this._t === s2) return G;
    return this._t = Array.isArray(s2) ? Array.from(s2) : s2, this.render(s2, i2);
  }
});
var ss = Vt(class extends Ot {
  constructor() {
    super(...arguments), this.key = J;
  }
  render(t3, s2) {
    return this.key = t3, s2;
  }
  update(t3, [s2, i2]) {
    return s2 !== this.key && (Pt(t3), this.key = s2), i2;
  }
});
var is = Vt(
  /**
   * @license
   * Copyright 2020 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */
  class extends Ot {
    constructor(t3) {
      if (super(t3), 3 !== t3.type && 1 !== t3.type && 4 !== t3.type) throw Error("The `live` directive is not allowed on child or event bindings");
      if (!$t(t3)) throw Error("`live` bindings can only contain a single expression");
    }
    render(t3) {
      return t3;
    }
    update(t3, [s2]) {
      if (s2 === G || s2 === J) return s2;
      const i2 = t3.element, e2 = t3.name;
      if (3 === t3.type) {
        if (s2 === i2[e2]) return G;
      } else if (4 === t3.type) {
        if (!!s2 === i2.hasAttribute(e2)) return G;
      } else if (1 === t3.type && i2.getAttribute(e2) === s2 + "") return G;
      return Pt(t3), s2;
    }
  }
);
var hs = /* @__PURE__ */ new WeakMap();
var cs = Vt(class extends It {
  render(t3) {
    return J;
  }
  update(t3, [s2]) {
    const i2 = s2 !== this.ct;
    return i2 && void 0 !== this.ct && this.St(void 0), (i2 || this.$t !== this.Tt) && (this.ct = s2, this.xt = t3.options?.host, this.St(this.Tt = t3.element)), J;
  }
  St(t3) {
    if (this.isConnected || (t3 = void 0), "function" == typeof this.ct) {
      const s2 = this.xt ?? globalThis;
      let i2 = hs.get(s2);
      void 0 === i2 && (i2 = /* @__PURE__ */ new WeakMap(), hs.set(s2, i2)), void 0 !== i2.get(this.ct) && this.ct.call(this.xt, void 0), i2.set(this.ct, t3), void 0 !== t3 && this.ct.call(this.xt, t3);
    } else this.ct.value = t3;
  }
  get $t() {
    return "function" == typeof this.ct ? hs.get(this.xt ?? globalThis)?.get(this.ct) : this.ct?.value;
  }
  disconnected() {
    this.$t === this.Tt && this.St(void 0);
  }
  reconnected() {
    this.St(this.Tt);
  }
});
var ls = (t3, s2, i2) => {
  const e2 = /* @__PURE__ */ new Map();
  for (let n2 = s2; n2 <= i2; n2++) e2.set(t3[n2], n2);
  return e2;
};
var as = Vt(class extends Ot {
  constructor(t3) {
    if (super(t3), 2 !== t3.type) throw Error("repeat() can only be used in text expressions");
  }
  Et(t3, s2, i2) {
    let e2;
    void 0 === i2 ? i2 = s2 : void 0 !== s2 && (e2 = s2);
    const n2 = [], r2 = [];
    let o2 = 0;
    for (const s3 of t3) n2[o2] = e2 ? e2(s3, o2) : o2, r2[o2] = i2(s3, o2), o2++;
    return { values: r2, keys: n2 };
  }
  render(t3, s2, i2) {
    return this.Et(t3, s2, i2).values;
  }
  update(t3, [s2, i2, e2]) {
    const n2 = At(t3), { values: r2, keys: o2 } = this.Et(s2, i2, e2);
    if (!Array.isArray(n2)) return this.Ct = o2, r2;
    const h2 = this.Ct ??= [], c2 = [];
    let l2, a2, u2 = 0, d2 = n2.length - 1, f2 = 0, p2 = r2.length - 1;
    for (; u2 <= d2 && f2 <= p2; ) if (null === n2[u2]) u2++;
    else if (null === n2[d2]) d2--;
    else if (h2[u2] === o2[f2]) c2[f2] = Et(n2[u2], r2[f2]), u2++, f2++;
    else if (h2[d2] === o2[p2]) c2[p2] = Et(n2[d2], r2[p2]), d2--, p2--;
    else if (h2[u2] === o2[p2]) c2[p2] = Et(n2[u2], r2[p2]), xt(t3, c2[p2 + 1], n2[u2]), u2++, p2--;
    else if (h2[d2] === o2[f2]) c2[f2] = Et(n2[d2], r2[f2]), xt(t3, n2[u2], n2[d2]), d2--, f2++;
    else if (void 0 === l2 && (l2 = ls(o2, f2, p2), a2 = ls(h2, u2, d2)), l2.has(h2[u2])) if (l2.has(h2[d2])) {
      const s3 = a2.get(o2[f2]), i3 = void 0 !== s3 ? n2[s3] : null;
      if (null === i3) {
        const s4 = xt(t3, n2[u2]);
        Et(s4, r2[f2]), c2[f2] = s4;
      } else c2[f2] = Et(i3, r2[f2]), xt(t3, n2[u2], i3), n2[s3] = null;
      f2++;
    } else Mt(n2[d2]), d2--;
    else Mt(n2[u2]), u2++;
    for (; f2 <= p2; ) {
      const s3 = xt(t3, c2[p2 + 1]);
      Et(s3, r2[f2]), c2[f2++] = s3;
    }
    for (; u2 <= d2; ) {
      const t4 = n2[u2++];
      null !== t4 && Mt(t4);
    }
    return this.Ct = o2, Pt(t3, c2), G;
  }
});
var us = "important";
var ds = " !" + us;
var fs = Vt(class extends Ot {
  constructor(t3) {
    if (super(t3), 1 !== t3.type || "style" !== t3.name || t3.strings?.length > 2) throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.");
  }
  render(t3) {
    return Object.keys(t3).reduce((s2, i2) => {
      const e2 = t3[i2];
      return null == e2 ? s2 : s2 + `${i2 = i2.includes("-") ? i2 : i2.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g, "-$&").toLowerCase()}:${e2};`;
    }, "");
  }
  update(t3, [s2]) {
    const { style: i2 } = t3.element;
    if (void 0 === this.Pt) return this.Pt = new Set(Object.keys(s2)), this.render(s2);
    for (const t4 of this.Pt) null == s2[t4] && (this.Pt.delete(t4), t4.includes("-") ? i2.removeProperty(t4) : i2[t4] = null);
    for (const t4 in s2) {
      const e2 = s2[t4];
      if (null != e2) {
        this.Pt.add(t4);
        const s3 = "string" == typeof e2 && e2.endsWith(ds);
        t4.includes("-") || s3 ? i2.setProperty(t4, s3 ? e2.slice(0, -11) : e2, s3 ? us : "") : i2[t4] = e2;
      }
    }
    return G;
  }
});
var ps = Vt(
  /**
   * @license
   * Copyright 2020 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */
  class extends Ot {
    constructor(t3) {
      if (super(t3), 2 !== t3.type) throw Error("templateContent can only be used in child bindings");
    }
    render(t3) {
      return this.At === t3 ? G : (this.At = t3, document.importNode(t3.content, true));
    }
  }
);
var vs = class extends Ot {
  constructor(t3) {
    if (super(t3), this.bt = J, 2 !== t3.type) throw Error(this.constructor.directiveName + "() can only be used in child bindings");
  }
  render(t3) {
    if (t3 === J || null == t3) return this.Mt = void 0, this.bt = t3;
    if (t3 === G) return t3;
    if ("string" != typeof t3) throw Error(this.constructor.directiveName + "() called with a non-string value");
    if (t3 === this.bt) return this.Mt;
    this.bt = t3;
    const s2 = [t3];
    return s2.raw = s2, this.Mt = { _$litType$: this.constructor.resultType, strings: s2, values: [] };
  }
};
vs.directiveName = "unsafeHTML", vs.resultType = 1;
var ys = Vt(vs);
var ms = class extends vs {
};
ms.directiveName = "unsafeSVG", ms.resultType = 2;
var bs = Vt(ms);
var gs = (t3) => !mt(t3) && "function" == typeof t3.then;
var ws = 1073741823;
var _s = class extends It {
  constructor() {
    super(...arguments), this.kt = ws, this.Ut = [], this.dt = new Dt(this), this.ft = new Bt();
  }
  render(...t3) {
    return t3.find((t4) => !gs(t4)) ?? G;
  }
  update(t3, s2) {
    const i2 = this.Ut;
    let e2 = i2.length;
    this.Ut = s2;
    const n2 = this.dt, r2 = this.ft;
    this.isConnected || this.disconnected();
    for (let t4 = 0; t4 < s2.length && !(t4 > this.kt); t4++) {
      const o2 = s2[t4];
      if (!gs(o2)) return this.kt = t4, o2;
      t4 < e2 && o2 === i2[t4] || (this.kt = ws, e2 = 0, Promise.resolve(o2).then(async (t5) => {
        for (; r2.get(); ) await r2.get();
        const s3 = n2.deref();
        if (void 0 !== s3) {
          const i3 = s3.Ut.indexOf(o2);
          i3 > -1 && i3 < s3.kt && (s3.kt = i3, s3.setValue(t5));
        }
      }));
    }
    return G;
  }
  disconnected() {
    this.dt.disconnect(), this.ft.pause();
  }
  reconnected() {
    this.dt.reconnect(this), this.ft.resume();
  }
};
var Ss = Vt(_s);
var Ts = Symbol.for("");
var xs = (t3) => {
  if (t3?.r === Ts) return t3?._$litStatic$;
};
var Ps = /* @__PURE__ */ new Map();
var As = (t3) => (s2, ...i2) => {
  const e2 = i2.length;
  let n2, r2;
  const o2 = [], h2 = [];
  let c2, l2 = 0, a2 = false;
  for (; l2 < e2; ) {
    for (c2 = s2[l2]; l2 < e2 && void 0 !== (r2 = i2[l2], n2 = xs(r2)); ) c2 += n2 + s2[++l2], a2 = true;
    l2 !== e2 && h2.push(r2), o2.push(c2), l2++;
  }
  if (l2 === e2 && o2.push(s2[e2]), a2) {
    const t4 = o2.join("$$lit$$");
    void 0 === (s2 = Ps.get(t4)) && (o2.raw = o2, Ps.set(t4, s2 = o2)), i2 = h2;
  }
  return t3(s2, ...i2);
};
var Ms = As(Z);
var ks = As(q);
window.litDisableBundleWarning || console.warn("Lit has been loaded from a bundle that combines all core features into a single file. To reduce transfer size and parsing cost, consider using the `lit` npm package directly in your project.");

// www/overlook-show.js
var VERSION = "0.25.1";
function rgbToHsl(r2, g2, b2) {
  r2 /= 255;
  g2 /= 255;
  b2 /= 255;
  const max = Math.max(r2, g2, b2), min = Math.min(r2, g2, b2), l2 = (max + min) / 2, c2 = max - min;
  if (!c2) return [0, 0, l2];
  const s2 = c2 / (1 - Math.abs(2 * l2 - 1));
  const h2 = max === r2 ? ((g2 - b2) / c2 + 6) % 6 : max === g2 ? (b2 - r2) / c2 + 2 : (r2 - g2) / c2 + 4;
  return [h2 * 60, s2, l2];
}
var TRACK_ART = { "Stream Sounds": "/local/sounds/stream.svg?v=2" };
var INPUTS = {
  "TV": { icon: "mdi:television", title: "TV", sub: "TV audio" },
  "Line-in": { icon: "mdi:record-player", title: "Phono", sub: "Turntable" }
};
var POWER_TILES = ["media_player.living_room"];
var DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
var MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
var LONG_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];
var WEATHER = {
  "sunny": ["mdi:weather-sunny", "Sunny", "#f2a93b"],
  "clear-night": ["mdi:weather-night", "Clear", "#7c83d6"],
  "partlycloudy": ["mdi:weather-partly-cloudy", "Partly cloudy", "#f2a93b"],
  "cloudy": ["mdi:weather-cloudy", "Cloudy", "#8a97ad"],
  "fog": ["mdi:weather-fog", "Fog", "#8a97ad"],
  "rainy": ["mdi:weather-rainy", "Rain", "#4d8df0"],
  "pouring": ["mdi:weather-pouring", "Heavy rain", "#3a73d6"],
  "lightning": ["mdi:weather-lightning", "Storms", "#8f6ad8"],
  "lightning-rainy": ["mdi:weather-lightning-rainy", "Storms", "#8f6ad8"],
  "windy": ["mdi:weather-windy", "Windy", "#5aa7a0"],
  "windy-variant": ["mdi:weather-windy-variant", "Windy", "#5aa7a0"],
  "snowy": ["mdi:weather-snowy", "Snow", "#8fb6e8"],
  "snowy-rainy": ["mdi:weather-snowy-rainy", "Sleet", "#8fb6e8"],
  "hail": ["mdi:weather-hail", "Hail", "#8fb6e8"],
  "exceptional": ["mdi:alert-circle-outline", "Warning", "#e2574c"]
};
var PAGES = [
  ["kitchen", "Kitchen", "mdi:stove"],
  ["home", "Home", "mdi:home-outline"],
  ["calendar", "Calendar", "mdi:calendar-month-outline"],
  ["recipes", "Recipes", "mdi:silverware-fork-knife"]
];
var BEDSIDE_PAGES = [
  ["controls", "Controls", "mdi:tune-variant"],
  ["media", "Media", "mdi:music"],
  ["climate", "Climate", "mdi:thermometer"],
  ["calendar", "Calendar", "mdi:calendar-month-outline"]
];
var HUB_PAGES = [
  ["controls", "Controls", "mdi:tune-variant"],
  ["media", "Media", "mdi:music"],
  ["climate", "Climate", "mdi:thermometer"],
  ["calendar", "Calendar", "mdi:calendar-month-outline"],
  ["recipes", "Recipes", "mdi:silverware-fork-knife"]
];
var AIR = {
  temperature: ["Temperature", "#e0a63c", (v2) => v2 < 17 ? "Cool" : v2 > 25 ? "Warm" : "Comfortable"],
  humidity: ["Humidity", "#5a7ea8", (v2) => v2 < 35 ? "Dry" : v2 > 60 ? "Humid" : "Comfortable"],
  pm2_5: ["Fine dust (PM2.5)", "#3f8f63", (v2) => v2 <= 12 ? "Good" : v2 <= 35 ? "Moderate" : "Poor"],
  voc: ["Air quality (VOC)", "#3f8f8a", (v2) => v2 <= 150 ? "Good" : v2 <= 250 ? "Moderate" : "Poor"]
};
var PHONE_PAGES = [
  ["kitchen", "Home", "mdi:home-variant-outline"],
  ["calendar", "Calendar", "mdi:calendar-month-outline"],
  ["recipes", "Recipes", "mdi:silverware-fork-knife"]
];
var clamp = (v2, a2, b2) => Math.min(b2, Math.max(a2, v2));
var VOL_STEP = 0.03;
var SWATCHES = [
  [0, 90, "Red"],
  [25, 95, "Orange"],
  [45, 90, "Yellow"],
  [120, 70, "Green"],
  [180, 70, "Cyan"],
  [220, 85, "Blue"],
  [270, 75, "Purple"],
  [320, 70, "Pink"]
];
var DOMAIN_TYPE = {
  light: "light",
  media_player: "media",
  climate: "climate",
  switch: "switch",
  input_boolean: "switch",
  fan: "switch",
  cover: "switch",
  sensor: "sensor",
  binary_sensor: "sensor",
  lock: "sensor",
  scene: "scene",
  script: "scene"
};
var DOMAIN_ICON = {
  light: "mdi:lightbulb",
  media_player: "mdi:speaker",
  climate: "mdi:thermostat",
  switch: "mdi:toggle-switch-outline",
  input_boolean: "mdi:toggle-switch-outline",
  fan: "mdi:fan",
  cover: "mdi:window-shutter",
  sensor: "mdi:eye-outline",
  binary_sensor: "mdi:checkbox-blank-circle-outline",
  lock: "mdi:lock",
  scene: "mdi:palette",
  script: "mdi:script-text-outline"
};
var CLASS_ICON = {
  temperature: "mdi:thermometer",
  humidity: "mdi:water-percent",
  moisture: "mdi:water",
  battery: "mdi:battery",
  power: "mdi:flash",
  energy: "mdi:lightning-bolt",
  illuminance: "mdi:brightness-5",
  pm25: "mdi:blur",
  door: "mdi:door",
  window: "mdi:window-closed-variant",
  motion: "mdi:motion-sensor",
  occupancy: "mdi:home-account",
  carbon_dioxide: "mdi:molecule-co2",
  volatile_organic_compounds_parts: "mdi:air-filter",
  aqi: "mdi:air-filter"
};
var TYPE_ICON = {
  light: "mdi:lightbulb",
  media: "mdi:speaker",
  climate: "mdi:thermostat",
  plant: "mdi:sprout",
  switch: "mdi:toggle-switch-outline",
  sensor: "mdi:eye-outline",
  scene: "mdi:palette"
};
var FONT_DIR = "/local/fonts/amazon-ember/";
var FONT_FACES = [
  ["Amazon Ember", "AmazonEmber_W_Rg.woff2", 400],
  ["Amazon Ember", "AmazonEmber_Md.ttf", 500],
  ["Amazon Ember", "AmazonEmber_W_SBd.woff2", 600],
  ["Amazon Ember", "AmazonEmber_W_Bd.woff2", 700],
  ["Amazon Ember", "AmazonEmber_W_He.woff2", 800],
  ["Amazon Ember Display", "AmazonEmberDisplay_W_Rg.woff2", 400],
  ["Amazon Ember Display", "AmazonEmberDisplay_W_Md.woff2", 500],
  ["Amazon Ember Display", "AmazonEmberDisplay_W_Bd.woff2", 700],
  ["Amazon Ember Display", "AmazonEmberDisplay_W_He.woff2", 800]
];
var loadFonts = (hass) => {
  if (document.getElementById("overlook-show-fonts")) return;
  const base = hass && hass.hassUrl ? hass.hassUrl(FONT_DIR) : FONT_DIR;
  const st2 = document.createElement("style");
  st2.id = "overlook-show-fonts";
  st2.textContent = FONT_FACES.map(([fam, file, w2]) => `@font-face { font-family: "${fam}"; src: url("${base}${file}"); font-weight: ${w2}; font-display: swap; }`).join("\n");
  document.head.appendChild(st2);
};
var fireHaptic = (type = "light") => {
  window.dispatchEvent(new CustomEvent("haptic", { detail: type, bubbles: true, composed: true }));
};
var OverlookShow = class extends dt {
  static properties = {
    hass: { attribute: false },
    _page: { state: true },
    _drag: { state: true },
    _picker: { state: true },
    _scenes: { state: true },
    _todo: { state: true },
    _events: { state: true },
    _cal: { state: true },
    _month: { state: true },
    _sel: { state: true },
    _dayOpen: { state: true },
    _fit: { state: true },
    _room: { state: true },
    _forecast: { state: true },
    _now: { state: true },
    _uncovered: { state: true },
    _adding: { state: true },
    _speaker: { state: true },
    _lib: { state: true },
    _book: { state: true },
    _recipe: { state: true },
    _pop: { state: true },
    _light: { state: true },
    _ct: { state: true },
    _hist: { state: true },
    _wx: { state: true },
    _daily: { state: true },
    _hourly: { state: true },
    _chance: { state: true },
    _ckNow: { state: true },
    _ckShow: { state: true },
    _npHidden: { state: true },
    _npNow: { state: true }
  };
  setConfig(config) {
    this._config = Object.assign({
      idle: 300,
      photos: null,
      weather: "weather.forecast_home",
      lights: [],
      climate: null,
      speakers: [],
      calendars: [],
      todo: null,
      sensors: [],
      rooms: [],
      scenes: [],
      phone: false,
      status: [],
      status_air: [],
      phone_rooms: [],
      popups: {},
      links: {}
    }, config);
    if (this._config.phone) this._config.photos = null;
    this._page = this._config.desk ? "desk" : this._config.bedside ? "photos" : this._config.page || (this._config.photos ? "photos" : "kitchen");
    if (this._page === "calendar") {
      this._page = null;
      this._go("calendar");
    }
    this._drag = null;
    this._picker = false;
    this._todo = [];
    this._events = null;
    this._forecast = null;
    this._now = /* @__PURE__ */ new Date();
    this._uncovered = false;
    try {
      this._speaker = localStorage.getItem(this._spKey());
    } catch (e2) {
    }
  }
  getCardSize() {
    return 12;
  }
  // the picked speaker is remembered per screen kind, so the bedside doesn't inherit the kitchen's
  _spKey() {
    return this._config && this._config.bedside ? "overlook-show-speaker-bed" : "overlook-show-speaker";
  }
  connectedCallback() {
    super.connectedCallback();
    this._clock = setInterval(() => {
      this._now = /* @__PURE__ */ new Date();
    }, 15e3);
    this._touch = () => {
      this._touchedAt = Date.now();
      this._poke();
    };
    window.addEventListener("pointerdown", this._touch, true);
    window.addEventListener("keydown", this._touch, true);
    this._poke();
    if (this._config && this._config.windowed) {
      const hide = () => {
        const r2 = findHuiRoot();
        if (r2 !== this._root) {
          styleHuiRoot(this._root, "");
          this._root = r2;
        }
        styleHuiRoot(r2, r2 && r2.lovelace && r2.lovelace.editMode ? "" : HIDE_HEADER);
      };
      this._hdr = setInterval(hide, 400);
      hide();
    }
    if (this.hass) loadFonts(this.hass);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this._clock);
    clearTimeout(this._idleTimer);
    clearTimeout(this._wxTimer);
    clearInterval(this._ckTick);
    this._ckTick = null;
    clearTimeout(this._ckShowTimer);
    clearInterval(this._npTick);
    this._npTick = null;
    clearTimeout(this._npPause);
    window.removeEventListener("pointerdown", this._touch, true);
    window.removeEventListener("keydown", this._touch, true);
    if (this._hdr) {
      clearInterval(this._hdr);
      this._hdr = null;
      styleHuiRoot(this._root, "");
    }
    this._unsub();
  }
  // bedside night mode: `night` is an input_boolean the bedroom automation turns on 9pm-7:30am
  _night() {
    const e2 = this._st(this._config && this._config.night);
    return !!e2 && e2.state === "on";
  }
  _poke() {
    clearTimeout(this._idleTimer);
    if (!this._config || !this._config.photos) return;
    const e2 = this._npEnt(), npBack = this._npHidden && e2 && e2.state === "playing";
    const wait = this._night() ? 30 : npBack && this._config.nowplaying_return || this._config.idle;
    this._idleTimer = setTimeout(() => {
      if (this._recipe) {
        this._poke();
        return;
      }
      this._picker = false;
      this._scenes = false;
      this._pop = null;
      this._light = null;
      this._page = "photos";
      this._npHidden = false;
    }, wait * 1e3);
  }
  // --- subscriptions: shopping list, forecast, calendar --------------------
  updated(changed) {
    if (changed.has("hass") && this._drag) this._settle();
    if (changed.has("hass") && this._config.night) {
      const n2 = this._night();
      if (n2 && this._wasNight === false) {
        this._go("photos");
        this._poke();
      }
      this._wasNight = n2;
    }
    if (changed.has("hass") && this._config.voice) {
      const v2 = this._st("input_text.overlook_voice");
      if (v2 && v2.last_changed !== this._voiceSeen) {
        const first = this._voiceSeen === void 0;
        this._voiceSeen = v2.last_changed;
        if (!first) {
          try {
            this._onVoice(JSON.parse(v2.state));
          } catch (e2) {
          }
        }
      }
    }
    if (changed.has("hass") && this._config.scheme) {
      const e2 = this._st(this._config.scheme);
      const dark = e2 ? ["below_horizon", "on", "dark"].includes(e2.state) : null;
      if (dark === null) this.removeAttribute("scheme");
      else this.setAttribute("scheme", dark ? "dark" : "light");
    }
    if (changed.has("hass") && this._config.clock) this._ckWatch();
    if (changed.has("hass") && this._config.nowplaying) this._npWatch();
    if (this._config.nowplaying) this._marquee();
    if (changed.has("hass") && this.hass && !this._subscribed) {
      this._subscribed = true;
      loadFonts(this.hass);
      this._subscribe();
    }
    if (this._page === "calendar" && !this._config.phone) this._fitChips();
  }
  // how many event chips fit in a day cell at this screen size
  _fitChips() {
    const d2 = this.shadowRoot.querySelector(".day");
    if (!d2) return;
    const cs2 = getComputedStyle(d2);
    const room = d2.clientHeight - parseFloat(cs2.paddingTop) - parseFloat(cs2.paddingBottom) - d2.querySelector(".dnum").offsetHeight;
    const chip = d2.querySelector(".chip");
    const each = (chip ? chip.offsetHeight : 19) + 3;
    const n2 = Math.max(1, Math.floor(room / each));
    if (n2 !== this._fit) this._fit = n2;
  }
  async _subscribe() {
    const c2 = this._config;
    this._subs = [];
    const conn = this.hass.connection;
    if (c2.todo) {
      try {
        this._subs.push(await conn.subscribeMessage(
          (m2) => {
            this._todo = (m2.items || []).filter((i2) => i2.status === "needs_action");
          },
          { type: "todo/item/subscribe", entity_id: c2.todo }
        ));
      } catch (e2) {
        console.warn("overlook-show: todo", e2);
      }
    }
    if (c2.weather) {
      try {
        this._subs.push(await conn.subscribeMessage(
          (m2) => {
            this._daily = m2.forecast || [];
            this._forecast = this._daily[0] || null;
          },
          { type: "weather/subscribe_forecast", entity_id: c2.weather, forecast_type: "daily" }
        ));
      } catch (e2) {
        console.warn("overlook-show: forecast", e2);
      }
    }
    if (c2.voice) {
      if (c2.weather) {
        try {
          this._subs.push(await conn.subscribeMessage(
            (m2) => {
              this._hourly = m2.forecast || [];
            },
            { type: "weather/subscribe_forecast", entity_id: c2.weather, forecast_type: "hourly" }
          ));
        } catch (e2) {
          console.warn("overlook-show: hourly", e2);
        }
      }
    }
    this._loadEvents();
    this._eventTimer = setInterval(() => this._loadEvents(), 10 * 60 * 1e3);
  }
  _unsub() {
    (this._subs || []).forEach((u2) => {
      try {
        u2();
      } catch (e2) {
      }
    });
    this._subs = [];
    clearInterval(this._eventTimer);
    this._subscribed = false;
  }
  async _fetchEvents(start, end) {
    const all = [];
    for (const cal of this._config.calendars || []) {
      const id = typeof cal === "string" ? cal : cal.entity;
      const colour = typeof cal === "object" && cal.color || "var(--accent)";
      try {
        const r2 = await this.hass.callApi(
          "GET",
          `calendars/${id}?start=${start.toISOString()}&end=${end.toISOString()}`
        );
        r2.forEach((e2) => all.push(Object.assign(e2, { colour })));
      } catch (e2) {
        console.warn("overlook-show: calendar", id, e2);
      }
    }
    return all.sort((a2, b2) => this._d(a2.start) - this._d(b2.start));
  }
  async _loadEvents() {
    if (!(this._config.calendars || []).length) {
      this._events = null;
      return;
    }
    const start = /* @__PURE__ */ new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 2);
    this._events = await this._fetchEvents(start, end);
    if (this._page === "calendar") this._loadMonth();
  }
  // the month grid plus the 8 days from the selected one, in one fetch
  async _loadMonth() {
    if (!(this._config.calendars || []).length) return;
    const gs2 = this._gridStart(this._month);
    const ge = new Date(gs2);
    ge.setDate(ge.getDate() + 42);
    const sel = this._day(this._sel);
    const le = new Date(sel);
    le.setDate(le.getDate() + 8);
    const start = sel < gs2 ? sel : gs2, end = le > ge ? le : ge;
    const key = this._ymd(start) + this._ymd(end);
    this._calKey = key;
    const ev = await this._fetchEvents(start, end);
    if (this._calKey === key) this._cal = ev;
  }
  _onVoice(d2) {
    if (d2.area !== this._config.voice) return;
    clearTimeout(this._wxTimer);
    if (d2.action === "climate") {
      this._wx = null;
      const at2 = Date.now();
      this._go("climate");
      this._poke();
      this._wxTimer = setTimeout(() => {
        if (this._page === "climate" && !(this._touchedAt > at2)) this._go("photos");
      }, 60 * 1e3);
      return;
    }
    if (d2.action === "page" && d2.page) {
      this._wx = null;
      const at2 = Date.now(), page = d2.page;
      this._go(page);
      this._poke();
      if (page !== "photos") {
        this._wxTimer = setTimeout(() => {
          if (this._page === page && !(this._touchedAt > at2)) this._go("photos");
        }, 60 * 1e3);
      }
      return;
    }
    if (d2.action !== "weather") {
      this._wx = null;
      return;
    }
    const week = d2.range === "week";
    this._wx = { week, dates: d2.dates || [] };
    this._loadChance();
    this._poke();
    this._wxTimer = setTimeout(() => {
      this._wx = null;
    }, (week ? 60 : 40) * 1e3);
  }
  // chance of rain: met.no gives millimetres only, so ask Open-Meteo (free, no key, CORS)
  // for the percentages at HA's home location; kept for 30 minutes
  async _loadChance() {
    if (this._chance && Date.now() - this._chance.at < 30 * 60 * 1e3) return;
    const { latitude, longitude } = this.hass.config;
    try {
      const r2 = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=precipitation_probability_max&hourly=precipitation_probability&timezone=auto&forecast_days=7`);
      const j2 = await r2.json(), daily = {}, hourly = {};
      j2.daily.time.forEach((t3, i2) => {
        daily[t3] = j2.daily.precipitation_probability_max[i2];
      });
      j2.hourly.time.forEach((t3, i2) => {
        hourly[t3.slice(0, 13)] = j2.hourly.precipitation_probability[i2];
      });
      this._chance = { at: Date.now(), daily, hourly };
    } catch (e2) {
      console.warn("overlook-show: rain chance", e2);
    }
  }
  // --- helpers --------------------------------------------------------------
  _st(id) {
    return id && this.hass ? this.hass.states[id] : void 0;
  }
  // weather: met.no goes unavailable for hours at a time; say so instead of "NaN°" and a guessed "Cloudy"
  _cond(w2) {
    if (!w2 || w2.state === "unavailable" || w2.state === "unknown") return ["mdi:cloud-off-outline", "No forecast", "var(--muted)"];
    return WEATHER[w2.state] || WEATHER.cloudy;
  }
  // weather icon: our own artwork (www/weather, drawn by tools/weather_icons.py); the plain glyph
  // when there is no forecast, or in one colour (the red night page)
  _wxIcon(state, cls = "", mono = "") {
    const off = !state || state === "unavailable" || state === "unknown";
    const key = off ? null : WEATHER[state] ? state : "cloudy";
    if (!key || mono) {
      const c2 = key ? WEATHER[key] : ["mdi:cloud-off-outline", "", "var(--muted)"];
      return Z`<ha-icon class=${cls} icon=${c2[0]} style="color:${mono || c2[2]}"></ha-icon>`;
    }
    return Z`<img class="wxi ${cls}" src=${this._u(`/local/weather/${key}.svg?v=1`)} alt="" draggable="false">`;
  }
  _deg(t3) {
    return typeof t3 === "number" && isFinite(t3) ? `${Math.round(t3)}\xB0` : "\u2013";
  }
  _links() {
    return this._config.links || {};
  }
  _call(domain, service, data) {
    fireHaptic();
    return this.hass.callService(domain, service, data);
  }
  _go(page) {
    this._picker = false;
    this._scenes = false;
    this._pop = null;
    this._light = null;
    this._recipe = null;
    if (page !== this._page) this._book = null;
    if (page === "calendar" && page !== this._page) this._toToday();
    this._page = page;
  }
  // an event's start/end -> Date; all-day dates are local midnight, not UTC
  _d(x2) {
    if (x2.dateTime) return new Date(x2.dateTime);
    return this._day(x2.date);
  }
  _day(ymd) {
    const [y2, m2, d2] = ymd.split("-").map(Number);
    return new Date(y2, m2 - 1, d2);
  }
  _ymd(d2) {
    return `${d2.getFullYear()}-${String(d2.getMonth() + 1).padStart(2, "0")}-${String(d2.getDate()).padStart(2, "0")}`;
  }
  _ampm(d2) {
    const m2 = d2.getMinutes();
    return `${d2.getHours() % 12 || 12}${m2 ? ":" + String(m2).padStart(2, "0") : ""}${d2.getHours() < 12 ? "am" : "pm"}`;
  }
  _time(d2) {
    const h2 = d2.getHours() % 12 || 12;
    return `${h2}:${String(d2.getMinutes()).padStart(2, "0")}`;
  }
  // --- render -------------------------------------------------------------
  // the voice glow sits over whatever screen is showing
  render() {
    return Z`${this._screen()}${this._npLayer()}${this._clockLayer()}${this._glow()}`;
  }
  // --- voice clock: timer and alarm screens --------------------------------
  // option `clock`: an area id whose helpers the "Voice Timers and Alarms" automations drive:
  // timer.<a>_timer, input_number.<a>_timer_length (seconds, for Reset), input_datetime.<a>_alarm_time,
  // input_boolean.<a>_alarm (set) and input_select.<a>_ringing (Off / Timer / Alarm).
  // A running or ringing timer and a ringing alarm take the whole screen until they're done;
  // a newly set alarm shows for 8 seconds and goes.
  _ck() {
    const a2 = this._config && this._config.clock;
    if (!a2) return null;
    const s2 = (d2, n2) => this._st(`${d2}.${a2}_${n2}`);
    const ring = s2("input_select", "ringing");
    return {
      a: a2,
      timer: s2("timer", "timer"),
      len: s2("input_number", "timer_length"),
      at: s2("input_datetime", "alarm_time"),
      armed: s2("input_boolean", "alarm"),
      ring: ring ? ring.state : "Off"
    };
  }
  _ckWatch() {
    const c2 = this._ck();
    if (!c2) return;
    const t3 = c2.timer && c2.timer.state;
    const live = t3 === "active" || c2.ring !== "Off";
    if (live && !this._ckTick) {
      this._ckNow = Date.now();
      this._ckTick = setInterval(() => {
        this._ckNow = Date.now();
      }, 1e3);
    }
    if (!live && this._ckTick) {
      clearInterval(this._ckTick);
      this._ckTick = null;
    }
    if (c2.ring === "Alarm") this._ckRangAt = Date.now();
    const key = c2.armed && c2.armed.state === "on" && c2.at ? `${c2.at.state}|${c2.armed.last_changed}` : null;
    if (key !== this._ckSeen) {
      const first = this._ckSeen === void 0;
      this._ckSeen = key;
      if (!first && key && c2.ring === "Off") {
        this._ckShow = { snoozed: Date.now() - (this._ckRangAt || 0) < 5e3 };
        clearTimeout(this._ckShowTimer);
        this._ckShowTimer = setTimeout(() => {
          this._ckShow = null;
        }, 8e3);
      } else if (!key) {
        this._ckShow = null;
      }
    }
  }
  _ckDur(s2) {
    s2 = Math.max(0, Math.round(s2));
    const h2 = Math.floor(s2 / 3600), m2 = Math.floor(s2 % 3600 / 60), x2 = s2 % 60;
    return h2 ? `${h2}:${String(m2).padStart(2, "0")}:${String(x2).padStart(2, "0")}` : `${m2}:${String(x2).padStart(2, "0")}`;
  }
  // digits as big as the screen allows: Amazon Ember Display 800 digits are 0.6em wide, colons 0.31em
  _ckFit(text, extra = 0) {
    const s2 = String(text);
    const em = [...s2].reduce((w2, ch) => w2 + (ch === ":" ? 0.34 : 0.62), 0) + extra;
    return `font-size:min(44vh, ${(58 / em).toFixed(2)}vw)`;
  }
  _ckSecs(hms) {
    const p2 = String(hms || "0:0:0").split(":").map(Number);
    return (p2[0] || 0) * 3600 + (p2[1] || 0) * 60 + (p2[2] || 0);
  }
  _clockLayer() {
    const c2 = this._ck();
    if (!c2 || !this.hass) return J;
    const tm = c2.timer, ts = tm ? tm.state : "idle";
    const length = c2.len ? Number(c2.len.state) || 0 : 0;
    const total = length || (tm ? this._ckSecs(tm.attributes.duration) : 0);
    const ringing = c2.ring !== "Off";
    const dark = this._night() && !ringing;
    const cls = `screen ck ${dark ? "ck-night" : ""}`;
    const now = this._ckNow || Date.now();
    const stop = (e2) => {
      e2.stopPropagation();
      if (ringing) this._call("input_select", "select_option", { entity_id: `input_select.${c2.a}_ringing`, option: "Off" });
      else this._call("timer", "cancel", { entity_id: `timer.${c2.a}_timer` });
    };
    const reset = (e2) => {
      e2.stopPropagation();
      if (!total) return;
      if (ringing) this._call("input_select", "select_option", { entity_id: `input_select.${c2.a}_ringing`, option: "Off" });
      this._call("timer", "start", { entity_id: `timer.${c2.a}_timer`, duration: total });
    };
    const btn = (label, icon, fn, main) => Z`
      <button class="ck-btn ${main ? "main" : ""}" @click=${fn}><ha-icon icon=${icon}></ha-icon>${label}</button>`;
    if (c2.ring === "Alarm") {
      const d2 = new Date(now);
      const [h2, mm] = this._time(d2).split(":");
      return Z`
        <div class=${cls}>
          <div class="ck-top">
            <div class="ck-label"><ha-icon icon="mdi:alarm"></ha-icon>Alarm</div>
            <div class="ck-digits ring" style=${this._ckFit(h2 + ":" + mm)}>${h2}<span class="ck-colon">:</span>${mm}</div>
          </div>
          <div class="ck-btns">
            ${btn("Stop", "mdi:stop", stop)}
            ${btn("Snooze", "mdi:alarm-snooze", (e2) => {
        e2.stopPropagation();
        this._call("script", "voice_clock_snooze", { area: c2.a });
      }, true)}
          </div>
        </div>`;
    }
    if (c2.ring === "Timer" || ts === "active" || ts === "paused") {
      const left = c2.ring === "Timer" ? 0 : ts === "paused" ? this._ckSecs(tm.attributes.remaining) : (new Date(tm.attributes.finishes_at).getTime() - now) / 1e3;
      const txt = this._ckDur(Math.ceil(left - 0.05));
      const pct = total ? Math.max(0, Math.min(100, left / total * 100)) : 0;
      const label = c2.ring === "Timer" ? "Time's up" : ts === "paused" ? "Paused" : "Timer";
      const toggle = (e2) => {
        e2.stopPropagation();
        if (ts === "active") this._call("timer", "pause", { entity_id: `timer.${c2.a}_timer` });
        else if (ts === "paused") this._call("timer", "start", { entity_id: `timer.${c2.a}_timer` });
      };
      return Z`
        <div class=${cls}>
          <div class="ck-top">
            <div class="ck-label"><ha-icon icon=${c2.ring === "Timer" ? "mdi:bell-ring" : "mdi:timer-outline"}></ha-icon>${label}
              ${total && c2.ring !== "Timer" ? Z`<span class="ck-of">of ${this._ckDur(total)}</span>` : J}</div>
            <div class="ck-digits ${c2.ring === "Timer" ? "ring" : ""} ${ts === "paused" ? "paused" : ""}"
                 style=${this._ckFit(txt)} @click=${toggle}>${txt}</div>
          </div>
          <div class="ck-track"><div style="width:${pct}%"></div></div>
          <div class="ck-btns">
            ${btn("Reset", "mdi:restore", reset)}
            ${btn("Stop", "mdi:stop", stop, true)}
          </div>
        </div>`;
    }
    if (this._ckShow && c2.at && c2.armed && c2.armed.state === "on") {
      const at2 = new Date(c2.at.state.replace(" ", "T"));
      const [h2, mm] = this._time(at2).split(":");
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      const days = Math.round((new Date(at2.getFullYear(), at2.getMonth(), at2.getDate()) - today) / 864e5);
      const day = days === 0 ? "Today" : days === 1 ? "Tomorrow" : at2.toLocaleDateString("en-AU", { weekday: "long" });
      const mins = Math.max(0, Math.round((at2 - Date.now()) / 6e4));
      const inTxt = mins < 60 ? `in ${mins} min` : `in ${Math.floor(mins / 60)} h${mins % 60 ? ` ${mins % 60} min` : ""}`;
      return Z`
        <div class=${cls} @click=${() => {
        clearTimeout(this._ckShowTimer);
        this._ckShow = null;
      }}>
          <div class="ck-top">
            <div class="ck-label"><ha-icon icon=${this._ckShow.snoozed ? "mdi:alarm-snooze" : "mdi:alarm-check"}></ha-icon>
              ${this._ckShow.snoozed ? "Snoozed" : "Alarm set"}</div>
            <div class="ck-digits" style=${this._ckFit(h2 + ":" + mm, 0.5)}>${h2}<span class="ck-colon">:</span>${mm}<span class="ck-ampm">${at2.getHours() < 12 ? "am" : "pm"}</span></div>
          </div>
          <div class="ck-when">${day}<span>${inTxt}</span></div>
        </div>`;
    }
    return J;
  }
  // option `nowplaying`: the screen's own speaker. Music on it (cast from Spotify or started
  // anywhere) takes the whole screen like the timer, and stays until it stops or is closed
  // with the chevron; the idle return (`nowplaying_return` s, else `idle`) brings it back while it's still playing, and a pause
  // lets it go after `idle`. Sleep Sounds and a dark room never show it.
  _npEnt() {
    const id = this._config && this._config.nowplaying;
    const e2 = id && this._st(id);
    if (!e2 || !["playing", "paused"].includes(e2.state)) return null;
    const a2 = e2.attributes;
    if (!a2.media_title || TRACK_ART[a2.media_title] || String(a2.media_content_id || "").includes("/local/sounds/")) return null;
    return e2;
  }
  _npWatch() {
    const e2 = this._npEnt(), st2 = e2 ? e2.state : "off";
    if (st2 === "playing" && this._npWas !== "playing") this._npHidden = false;
    if (st2 === "paused" && this._npWas === "playing") {
      clearTimeout(this._npPause);
      this._npPause = setTimeout(() => {
        const x2 = this._npEnt();
        if (!x2 || x2.state !== "playing") this._npHidden = true;
      }, this._config.idle * 1e3);
    }
    this._npWas = st2;
    const live = st2 === "playing" && !this._npHidden;
    if (live && !this._npTick) {
      this._npNow = Date.now();
      this._npTick = setInterval(() => {
        this._npNow = Date.now();
      }, 1e3);
    }
    if (!live && this._npTick) {
      clearInterval(this._npTick);
      this._npTick = null;
    }
  }
  // .mq text wider than its box scrolls to the end and back, at about 40px a second
  _marquee() {
    const els = this.renderRoot && this.renderRoot.querySelectorAll(".mq");
    if (!els || !els.length) return;
    requestAnimationFrame(() => els.forEach((el) => {
      const dx = Math.max(0, el.firstElementChild.scrollWidth - el.clientWidth);
      const key = dx > 2 ? String(Math.round(dx)) : "";
      if (el.dataset.dx === key) return;
      el.dataset.dx = key;
      el.classList.toggle("run", !!key);
      el.style.setProperty("--dx", `-${Math.round(dx)}px`);
      el.style.setProperty("--t", `${Math.max(6, dx / 40 / 0.64 + 2).toFixed(1)}s`);
    }));
  }
  // the music screen's accent: the album art's strongest colour, lifted to read on the dark
  // ground (orange until it loads, and for grey or unreadable art)
  _npAccent(pic) {
    if (!pic) return null;
    if (this._npPic === pic) return this._npCol;
    this._npPic = pic;
    this._npCol = null;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (this._npPic !== pic) return;
      try {
        const n2 = 64, cv = document.createElement("canvas");
        cv.width = cv.height = n2;
        const cx = cv.getContext("2d");
        cx.imageSmoothingEnabled = false;
        cx.drawImage(img, 0, 0, n2, n2);
        const d2 = cx.getImageData(0, 0, n2, n2).data, bins = {};
        for (let i2 = 0; i2 < d2.length; i2 += 4) {
          const [h3, sat2, l2] = rgbToHsl(d2[i2], d2[i2 + 1], d2[i2 + 2]);
          if (l2 < 0.12 || l2 > 0.92 || sat2 < 0.25) continue;
          const k2 = Math.round(h3 / 20) % 18, w2 = sat2 * sat2 * (1 - Math.abs(l2 - 0.5));
          const b2 = bins[k2] || (bins[k2] = { w: 0, x: 0, y: 0, s: 0 });
          const rad = h3 * Math.PI / 180;
          b2.w += w2;
          b2.x += Math.cos(rad) * w2;
          b2.y += Math.sin(rad) * w2;
          b2.s += sat2 * w2;
        }
        const best = Object.values(bins).sort((x2, y2) => y2.w - x2.w)[0];
        if (!best || best.w < n2 * n2 * 0.01) return;
        const h2 = (Math.atan2(best.y, best.x) * 180 / Math.PI + 360) % 360, sat = Math.max(0.55, best.s / best.w);
        this._npCol = { hot: `hsl(${h2.toFixed(0)} ${(sat * 100).toFixed(0)}% 64%)`, on: "#120d08" };
        this.requestUpdate();
      } catch (e2) {
      }
    };
    img.src = pic;
    return null;
  }
  _npLayer() {
    if (this._npHidden || this._wx || !this.hass || this._night()) return J;
    const e2 = this._npEnt();
    if (!e2) return J;
    const a2 = e2.attributes, id = e2.entity_id, playing = e2.state === "playing";
    const pic = this._pic(a2);
    const col = this._npAccent(pic);
    const dur = a2.media_duration || 0;
    let pos = a2.media_position || 0;
    if (playing && a2.media_position_updated_at) pos += ((this._npNow || Date.now()) - new Date(a2.media_position_updated_at).getTime()) / 1e3;
    pos = Math.max(0, dur ? Math.min(dur, pos) : pos);
    const src = String(a2.app_name || a2.source || "").replace(/\s*\(.*\)$/, "").replace(/ Connect$/, "");
    const call = (svc, d2 = {}) => (ev) => {
      ev.stopPropagation();
      this._call("media_player", svc, Object.assign({ entity_id: id }, d2));
    };
    const b2 = (icon, fn, cls = "") => Z`<button class="np-btn ${cls}" @click=${fn}><ha-icon icon=${icon}></ha-icon></button>`;
    return Z`
      <div class="screen np" style=${col ? `--np-hot:${col.hot};--np-on:${col.on}` : ""}>
        ${pic ? Z`<div class="np-blur" style="background-image:url('${pic}')"></div>` : J}
        <div class="np-art" style=${pic ? `background-image:url('${pic}')` : ""}>
          ${pic ? J : Z`<ha-icon icon="mdi:music-note"></ha-icon>`}</div>
        <div class="np-side">
          <div class="np-head">
            <div class="np-src"><ha-icon icon=${playing ? "mdi:music" : "mdi:pause"}></ha-icon>${playing ? src || "Now playing" : "Paused"}</div>
            ${b2("mdi:chevron-down", (ev) => {
      ev.stopPropagation();
      this._npHidden = true;
      this._poke();
    }, "x")}
          </div>
          <div class="np-title mq"><span>${a2.media_title}</span></div>
          <div class="np-artist mq"><span>${a2.media_artist || ""}</span></div>
          ${dur ? Z`
            <div class="np-track"><div style="width:${pos / dur * 100}%"></div></div>
            <div class="np-times"><span>${this._ckDur(pos)}</span><span>-${this._ckDur(dur - pos)}</span></div>` : J}
          <div class="np-ctl">
            ${b2("mdi:skip-previous", call("media_previous_track"))}
            ${b2(playing ? "mdi:pause" : "mdi:play", call("media_play_pause"), "main")}
            ${b2("mdi:skip-next", call("media_next_track"))}
          </div>
        </div>
      </div>`;
  }
  // voice: a blue glow round the screen edge while the Assist satellite (`voice_satellite`)
  // is listening, processing or answering, like the light ring on an Echo
  _glow() {
    const id = this._config && this._config.voice_satellite;
    const e2 = id && this._st(id);
    const st2 = e2 && ["listening", "processing", "responding"].includes(e2.state) ? e2.state : null;
    return st2 ? Z`<div class="va-glow ${st2}"></div>` : J;
  }
  _screen() {
    if (!this.hass || !this._config) return J;
    if (this._uncovered) {
      return Z`<button class="restore" @click=${() => {
        this._uncovered = false;
      }}>
        <ha-icon icon="mdi:fullscreen"></ha-icon></button>`;
    }
    if (this._config.phone) {
      return Z`
        <div class="screen phone">
          <main class="page" @scroll=${() => {
        this._scrolledAt = performance.now();
      }}>${this._pageBody()}</main>
          ${this._tabBar()}
          ${this._picker ? this._speakerSheet() : J}
          ${this._pop ? this._popSheet() : J}
          ${this._light ? this._lightSheet() : J}
        </div>`;
    }
    if (this._wx) return this._wxPage();
    const photos = this._page === "photos", bed = this._config.bedside;
    if (bed && photos && this._night()) return this._nightClock();
    return Z`
      <div class="screen ${this._config.windowed ? "windowed" : ""} ${this._config.desk ? "desk-screen" : ""}
                  ${bed ? "bedside" : ""} ${this._config.hub ? "hub" : ""} ${photos ? "on-photo" : ""}">
        ${photos ? this._photos() : J}
        ${this._config.desk ? J : this._dock()}
        ${photos ? J : Z`<main class="page">${this._pageBody()}</main>`}
        ${this._page === "kitchen" || this._page === "desk" ? this._status() : J}
        ${this._config.desk || bed && !photos ? J : this._topRight(photos)}
        ${this._picker ? this._speakerSheet() : J}
        ${this._scenes ? this._scenesSheet() : J}
        ${this._pop ? this._popSheet() : J}
        ${this._light ? this._lightSheet() : J}
        ${this._dayOpen && this._page === "calendar" ? this._daySheet() : J}
      </div>`;
  }
  // the bedside at night: a big red clock on black, nothing else; a tap wakes the dock on Lights.
  // It drifts a few pixels each minute so nothing sits on the same pixels all night.
  _nightClock() {
    const d2 = this._now, m2 = d2.getMinutes();
    const [h2, mm] = this._time(d2).split(":");
    const date = d2.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" }).replace(",", "");
    return Z`
      <div class="screen night" @click=${() => this._go("controls")}>
        <div class="night-face" style="transform:translate(${m2 * 7 % 25 - 12}px, ${m2 * 5 % 17 - 8}px)">
          <div class="night-time">${h2}<span class="night-colon">:</span>${mm}</div>
          <div class="night-date">${date}</div>
        </div>
      </div>`;
  }
  // the full-screen forecast a voice question opens: one day (with its hours when the
  // hourly forecast reaches it) or the days asked for side by side. A tap closes it.
  _wxPage() {
    const ymd = (x2) => this._ymd(new Date(x2.datetime));
    const today = this._ymd(/* @__PURE__ */ new Date()), tmrw = this._ymd(new Date(Date.now() + 864e5));
    const daily = this._daily || [];
    const want = this._wx.dates.length ? this._wx.dates : [today];
    const days = daily.filter((f2) => want.includes(ymd(f2)));
    const label = (f2, short) => {
      const k2 = ymd(f2), d2 = new Date(f2.datetime);
      if (k2 === today) return "Today";
      if (k2 === tmrw && !short) return "Tomorrow";
      return d2.toLocaleDateString("en-AU", short ? { weekday: "short" } : { weekday: "long", day: "numeric", month: "short" });
    };
    const icon = (c2) => WEATHER[c2] || WEATHER.cloudy;
    const night = this._night() ? "#a8231b" : "";
    const rain = (f2) => f2.precipitation >= 0.2 ? `${f2.precipitation < 1 ? "<1" : Math.round(f2.precipitation)} mm` : "";
    const close = () => {
      clearTimeout(this._wxTimer);
      this._wx = null;
    };
    let body;
    if (!days.length) {
      body = Z`<div class="wx-none">No forecast</div>`;
    } else if (!this._wx.week || days.length === 1) {
      const f2 = days[0], k2 = ymd(f2), [ic, name, col] = icon(f2.condition);
      const now = Date.now() - 36e5;
      const hours = (this._hourly || []).filter((h2) => ymd(h2) === k2 && new Date(h2.datetime) >= now).filter((h2, i2) => i2 % 3 === 0).slice(0, 6);
      const ch = this._chance, pct = ch && ch.daily[k2];
      const hpct = (h2) => {
        const d2 = new Date(h2.datetime);
        return ch && ch.hourly[`${this._ymd(d2)}T${String(d2.getHours()).padStart(2, "0")}`];
      };
      body = Z`
        <div class="wx-day">
          <div class="wx-main">
            <div class="wx-label">${label(f2)}</div>
            ${this._wxIcon(f2.condition, "wx-big", night)}
            <div class="wx-name">${name}</div>
          </div>
          <div class="wx-side">
            <div class="wx-temps"><span class="wx-hi">${this._deg(f2.temperature)}</span>
              <span class="wx-lo">${this._deg(f2.templow)}</span></div>
            <div class="wx-facts">
              ${typeof pct === "number" ? Z`<span><ha-icon icon="mdi:umbrella"></ha-icon>${pct}% chance</span>` : J}
              ${rain(f2) ? Z`<span><ha-icon icon="mdi:water"></ha-icon>${rain(f2)}</span>` : Z`<span><ha-icon icon="mdi:water-off"></ha-icon>Dry</span>`}
              ${typeof f2.wind_speed === "number" ? Z`<span><ha-icon icon="mdi:weather-windy"></ha-icon>${Math.round(f2.wind_speed)} km/h</span>` : J}
              ${typeof f2.uv_index === "number" ? Z`<span><ha-icon icon="mdi:sun-wireless"></ha-icon>UV ${Math.round(f2.uv_index)}</span>` : J}
            </div>
            ${hours.length > 1 ? Z`
              <div class="wx-hours">${hours.map((h2) => Z`
                <div class="wx-hour">
                  <span>${this._ampm(new Date(h2.datetime))}</span>
                  ${this._wxIcon(h2.condition, "", night)}
                  <b>${this._deg(h2.temperature)}</b>
                  ${typeof hpct(h2) === "number" ? Z`<i class="wx-pct">${hpct(h2)}%</i>` : J}
                </div>`)}</div>` : J}
          </div>
        </div>`;
    } else {
      body = Z`
        <div class="wx-week" style="grid-template-columns:repeat(${days.length}, minmax(0, 1fr))">
          ${days.map((f2) => {
        const [ic, name, col] = icon(f2.condition);
        return Z`
            <div class="wx-col">
              <span class="wx-dow">${label(f2, true)}</span>
              ${this._wxIcon(f2.condition, "", night)}
              <span class="wx-cname">${name}</span>
              <b class="wx-chi">${this._deg(f2.temperature)}</b>
              <span class="wx-clo">${this._deg(f2.templow)}</span>
              <span class="wx-crain">${rain(f2) || "\xA0"}</span>
            </div>`;
      })}
        </div>`;
    }
    return Z`<div class="screen wx-screen ${this._night() ? "wx-night" : ""}" @click=${close}>${body}</div>`;
  }
  _topRight(onPhoto) {
    const w2 = this._st(this._config.weather);
    const cond = w2 ? this._cond(w2) : null;
    const t3 = w2 && w2.attributes.temperature;
    const [down, up] = this._holdToUncover();
    return Z`
      <div class="topright ${onPhoto ? "on-photo" : ""}"
           @pointerdown=${down} @pointerup=${up} @pointerleave=${up}>
        ${cond ? Z`${this._wxIcon(w2.state, "wx")}
          <span class="temp">${this._deg(t3)}</span>` : J}
        <span class="clock">${this._time(this._now)}</span>
      </div>
      ${onPhoto ? this._npLine() : J}`;
  }
  // under the clock on photos: what the `nowplaying` speaker is playing; a tap opens it full screen
  _npLine() {
    const e2 = this._npEnt();
    if (!e2) return J;
    const a2 = e2.attributes;
    return Z`
      <button class="np-line" @click=${(ev) => {
      ev.stopPropagation();
      this._npHidden = false;
    }}>
        <ha-icon icon=${e2.state === "playing" ? "mdi:music" : "mdi:pause"}></ha-icon>
        <span class="np-line-text"><b class="mq"><span>${a2.media_title}</span></b>${a2.media_artist ? Z`<span class="mq"><span>${a2.media_artist}</span></span>` : J}</span>
      </button>`;
  }
  // holding for 1.5s uncovers HA underneath, for edit mode
  _holdToUncover() {
    let hold;
    return [() => {
      hold = setTimeout(() => {
        fireHaptic("medium");
        this._uncovered = true;
      }, 1500);
    }, () => clearTimeout(hold)];
  }
  // holding the Home tab uncovers HA (the phone has no clock to hold)
  _tabBar() {
    const [down, up] = this._holdToUncover();
    return Z`
      <nav class="tabbar">
        ${PHONE_PAGES.map(([id, name, icon]) => Z`
          <button class="dock-btn ${this._page === id ? "on" : ""}" @click=${() => {
      fireHaptic("selection");
      this._go(id);
      this._top();
    }}
                  @pointerdown=${id === "kitchen" ? down : null} @pointerup=${up} @pointerleave=${up}>
            <ha-icon icon=${icon}></ha-icon><span>${name}</span>
          </button>`)}
      </nav>`;
  }
  _top() {
    const p2 = this.shadowRoot && this.shadowRoot.querySelector(".page");
    if (p2) p2.scrollTop = 0;
  }
  // --- status pills: who's home, then anything that needs a look ---------------
  // People are always shown; the rest appear only while their entity is in `when` (default "on").
  _status() {
    const pills = (this._config.status || []).map((x2) => {
      const e2 = this._st(x2.entity);
      if (!e2) return J;
      if (x2.person) {
        const home = e2.state === "home";
        return Z`
          <button class="tab st ${home ? "st-home" : "st-away"}" @click=${() => this._open(x2.entity)}>
            <ha-icon icon=${home ? "mdi:home-account" : "mdi:account-arrow-right-outline"}></ha-icon>
            <span>${home ? x2.name : `${x2.name} away`}</span></button>`;
      }
      if (e2.state !== (x2.when || "on")) return J;
      const tap = x2.toggle ? () => this._call("homeassistant", "toggle", { entity_id: x2.entity }) : () => this._open(x2.entity);
      return Z`
        <button class="tab st ${x2.tone || "warn"}" @click=${tap}>
          <ha-icon icon=${x2.icon}></ha-icon><span>${x2.name}</span></button>`;
    });
    const air = (this._config.status_air || []).map((x2) => {
      const e2 = this._st(x2.entity);
      if (!e2) return J;
      const vals = (x2.sources || [{ entity: x2.entity }]).map((src) => {
        const s2 = this._st(src.entity);
        return s2 ? Number(src.attr ? s2.attributes[src.attr] : s2.state) : NaN;
      }).filter((v2) => isFinite(v2)).map((v2) => Math.round(v2));
      if (!vals.length) return J;
      const lo = Math.min(...vals), hi = Math.max(...vals);
      return Z`
        <button class="tab st reading" @click=${() => this._open(x2.entity)}>
          <ha-icon icon=${x2.icon} style="color:${x2.color || "var(--accent)"}"></ha-icon>
          <span>${lo === hi ? lo : `${lo}\u2013${hi}`}${x2.unit != null ? x2.unit : e2.attributes.unit_of_measurement || ""}</span>
          <small>${x2.name}</small></button>`;
    });
    return Z`<div class="status">${pills}${air}</div>`;
  }
  // --- phone home: ha-phone's order (status, scenes, each room) in this look ----
  _phoneHome() {
    return Z`
      <div class="ph">
        ${this._status()}
        ${this._config.scenes.length ? Z`
          <section>
            <div class="ph-sec"><ha-icon icon="mdi:creation"></ha-icon><span>Scenes</span></div>
            <div class="fav-scenes">${this._config.scenes.map((x2) => this._miniScene(x2))}</div>
          </section>` : J}
        ${this._config.phone_rooms.map((r2) => this._phoneRoom(r2))}
      </div>`;
  }
  _phoneRoom(r2) {
    const g2 = this._st(r2.group);
    const lit = g2 && g2.state === "on";
    return Z`
      <section>
        <div class="ph-sec"><ha-icon icon=${r2.icon}></ha-icon><span>${r2.name}</span>
          ${g2 ? Z`<button class="ph-group ${lit ? "on" : ""}" title="All lights"
              @click=${() => this._call("light", lit ? "turn_off" : "turn_on", { entity_id: r2.group })}>
              <ha-icon icon="mdi:lightbulb-group"></ha-icon></button>` : J}
        </div>
        <div class="ph-grid">
          ${r2.items.map((x2) => {
      const e2 = this._st(x2.entity);
      if (!e2) return J;
      switch (x2.type) {
        case "climate":
          return Z`<div class="card ph-hp">${this._thermostat(x2.entity)}</div>`;
        case "media":
          return e2.state === "unavailable" ? J : this._player(x2);
        case "plant":
          return this._plantTile(x2);
        case "switch":
          return this._switchTile(x2);
        default:
          return this._lightTile(x2);
      }
    })}
        </div>
      </section>`;
  }
  // tap does onTap, a still 500ms hold does onHold (see _lightTile for why it's this careful)
  _tapHold(key, onTap, onHold) {
    const P2 = () => this._press || {};
    const up = () => clearTimeout(P2().timer);
    const down = (ev) => {
      up();
      const scrolling = performance.now() - (this._scrolledAt || 0) < 250;
      const p2 = this._press = { id: key, held: scrolling, x0: ev.clientX, y0: ev.clientY };
      if (scrolling) return;
      p2.timer = setTimeout(() => {
        if (performance.now() - (this._scrolledAt || 0) < 500) return;
        p2.held = true;
        fireHaptic("medium");
        onHold();
      }, 500);
    };
    const move = (ev) => {
      const p2 = P2();
      if (Math.abs(ev.clientX - p2.x0) > 8 || Math.abs(ev.clientY - p2.y0) > 8) up();
    };
    const click = () => {
      const p2 = P2();
      if (p2.id === key && p2.held) return;
      onTap();
    };
    return { down, move, up, click };
  }
  // a small light tile: tap toggles, hold for the full controls
  _lightTile(l2) {
    const e2 = this._st(l2.entity);
    if (!e2) return J;
    const on = e2.state === "on";
    const pct = on ? Math.round((e2.attributes.brightness || 255) / 2.55) : 0;
    const toggle = () => this._call("light", "toggle", { entity_id: l2.entity });
    const label = Z`<span class="tile-text"><span class="tile-name">${l2.name || e2.attributes.friendly_name}</span>
          <span class="muted">${on ? pct >= 100 ? "On" : `On \xB7 ${pct}%` : e2.state === "unavailable" ? "Unavailable" : "Off"}</span></span>`;
    if (this._iconToggles) {
      return Z`
        <button class="card tile light-tile ${on ? "on" : ""}" @click=${() => this._openLight(l2.entity)}>
          <span class="tile-ico tap" role="button" title=${on ? "Turn off" : "Turn on"}
                @click=${(ev) => {
        ev.stopPropagation();
        fireHaptic("light");
        toggle();
      }}><ha-icon icon=${l2.icon || "mdi:lightbulb"}></ha-icon></span>
          ${label}
        </button>`;
    }
    const { down, move, up, click } = this._tapHold(l2.entity, toggle, () => this._openLight(l2.entity));
    return Z`
      <button class="card tile light-tile ${on ? "on" : ""}" @pointerdown=${down} @pointermove=${move}
              @pointerup=${up} @pointerleave=${up} @pointercancel=${up}
              @click=${click}>
        <span class="tile-ico"><ha-icon icon=${l2.icon || "mdi:lightbulb"}></ha-icon></span>
        ${label}
      </button>`;
  }
  // --- pop-ups: ha-phone's Bubble Card pop-ups as sheets in this look ------------
  // config.popups[id] = {title, icon, sections}; config.links[entity] = id says which
  // tap opens which sheet. Anything without a link falls back to HA's more-info.
  _open(entityId) {
    const id = this._links()[entityId];
    if (!id || !this._config.popups[id]) {
      this._moreInfo(entityId);
      return;
    }
    fireHaptic("light");
    this._pop = id;
    this._loadHistory(this._config.popups[id]);
  }
  async _loadHistory(p2) {
    const graphs = p2.sections.filter((s2) => s2.type === "graph" || s2.type === "multigraph");
    if (!graphs.length) return;
    const series = graphs.flatMap((s2) => s2.series || [{ entity: s2.entity }]);
    const plain = [...new Set(series.filter((x2) => !x2.attr).map((x2) => x2.entity))];
    const withAttr = [...new Set(series.filter((x2) => x2.attr).map((x2) => x2.entity))];
    const hours = Math.max(...graphs.map((s2) => s2.hours || 168));
    const start = new Date(Date.now() - hours * 3600 * 1e3).toISOString();
    const q2 = (ids, extra) => this.hass.callApi("GET", `history/period/${start}?filter_entity_id=${ids.join(",")}&end_time=${(/* @__PURE__ */ new Date()).toISOString()}${extra}`);
    try {
      const [r1, r2] = await Promise.all([
        plain.length ? q2(plain, "&minimal_response&no_attributes") : [],
        withAttr.length ? q2(withAttr, "&significant_changes_only=0") : []
      ]);
      const hist = Object.assign({}, this._hist);
      r1.forEach((list) => {
        if (!list.length) return;
        hist[list[0].entity_id] = list.map((x2) => [new Date(x2.last_changed).getTime(), Number(x2.state)]).filter((x2) => !isNaN(x2[1]));
      });
      r2.forEach((list) => {
        if (!list.length) return;
        const id = list[0].entity_id;
        series.filter((x2) => x2.entity === id && x2.attr).forEach((x2) => {
          hist[`${id}|${x2.attr}`] = list.map((h2) => [
            new Date(h2.last_updated || h2.last_changed).getTime(),
            Number((h2.attributes || {})[x2.attr])
          ]).filter((h2) => !isNaN(h2[1]));
        });
      });
      this._hist = hist;
    } catch (e2) {
      console.warn("overlook-show: history", e2);
    }
  }
  _popSheet() {
    const p2 = this._config.popups[this._pop];
    if (!p2) return J;
    const close = () => {
      this._pop = null;
    };
    return Z`
      <div class="scrim pop-scrim" @click=${close} @touchmove=${(ev) => {
      if (ev.target === ev.currentTarget) ev.preventDefault();
    }}>
        <div class="sheet pop" @click=${(ev) => ev.stopPropagation()}
             @touchstart=${(ev) => this._swStart(ev, close)} @touchmove=${(ev) => this._swMove(ev)} @touchend=${() => this._swEnd()} @touchcancel=${() => this._swEnd(true)}>
          <div class="grabber"></div>
          <div class="pop-head">
            <span class="pop-ico"><ha-icon icon=${p2.icon}></ha-icon></span>
            <span class="pop-title">${p2.title}</span>
            <button class="round small" title="Close" @click=${close}><ha-icon icon="mdi:close"></ha-icon></button>
          </div>
          <div class="pop-body">${p2.sections.map((s2) => this._popSection(s2))}</div>
        </div>
      </div>`;
  }
  // --- swipe a sheet down to close it ----------------------------------------
  // Any vertical drag on a sheet that isn't on a control moves the sheet with the finger;
  // let go past 90px (or flick) and it slides away. preventDefault on touchmove is what
  // stops the HA app's pull-to-refresh, which used to reload the dashboard behind the sheet.
  // The scrolling body still scrolls: a drag only becomes a dismiss when it starts with
  // the body at the top and moves down.
  _swStart(ev, close) {
    const t3 = ev.touches[0];
    if (ev.touches.length > 1 || ev.target.closest && ev.target.closest(".split, .ctbar, .pl-row, input")) {
      this._sw = null;
      return;
    }
    const sheet = ev.currentTarget;
    const body = ev.target.closest && ev.target.closest(".pop-body");
    this._sw = { sheet, close, body, y0: t3.clientY, x0: t3.clientX, y: t3.clientY, t: performance.now(), v: 0, mode: null };
  }
  _swMove(ev) {
    const w2 = this._sw;
    if (!w2) return;
    const t3 = ev.touches[0], dy = t3.clientY - w2.y0;
    if (!w2.mode) {
      if (Math.abs(dy) < 6 && Math.abs(t3.clientX - w2.x0) < 6) return;
      w2.mode = dy > 0 && Math.abs(dy) > Math.abs(t3.clientX - w2.x0) && (!w2.body || w2.body.scrollTop <= 0) ? "drag" : "pass";
      if (w2.mode === "drag") w2.sheet.style.transition = "none";
    }
    if (w2.mode !== "drag") return;
    ev.preventDefault();
    const now = performance.now();
    w2.v = (t3.clientY - w2.y) / Math.max(1, now - w2.t);
    w2.y = t3.clientY;
    w2.t = now;
    w2.sheet.style.transform = `translateY(${Math.max(0, dy)}px)`;
  }
  _swEnd(cancel = false) {
    const w2 = this._sw;
    this._sw = null;
    if (!w2 || w2.mode !== "drag") return;
    const dy = w2.y - w2.y0;
    w2.sheet.style.transition = "transform 0.22s ease-out";
    if (!cancel && (dy > 90 || dy > 30 && w2.v > 0.6)) {
      w2.sheet.style.transform = "translateY(110%)";
      const scrim = w2.sheet.parentElement;
      if (scrim) {
        scrim.style.transition = "opacity 0.22s";
        scrim.style.opacity = "0";
      }
      setTimeout(() => w2.close(), 200);
    } else {
      w2.sheet.style.transform = "";
    }
  }
  _popSection(s2) {
    if (s2.when) {
      const w2 = this._st(s2.when.entity);
      if (!w2 || w2.state !== s2.when.state) return J;
    }
    const head = s2.title ? Z`<div class="pop-sub">${s2.title}</div>` : J;
    switch (s2.type) {
      case "player":
        return Z`${head}${this._popPlayer(s2.entity)}`;
      case "graph":
        return Z`${head}${this._popGraph(s2)}`;
      case "multigraph":
        return Z`${head}${this._popMultiGraph(s2)}`;
      case "choices":
        return Z`${head}${this._popChoices(s2)}`;
      default:
        return Z`${head}<div class="pop-grid">${(s2.items || []).map((x2) => this._popTile(x2))}</div>`;
    }
  }
  // a value the way ha-phone words it: Open/Closed, Home/Away, Low/OK, 90%, 4:30pm
  _fmt(e2, x2 = {}) {
    if (!e2) return "\u2013";
    const a2 = e2.attributes, dc = a2.device_class || "", dom = e2.entity_id.split(".")[0];
    if (x2.attr) {
      const v2 = a2[x2.attr];
      return v2 == null ? "\u2013" : `${typeof v2 === "number" ? Math.round(v2 * 10) / 10 : v2}${x2.unit || ""}`;
    }
    const s2 = e2.state;
    if (s2 === "unavailable") return "Unavailable";
    if (s2 === "unknown") return dom === "button" ? "Press" : "\u2013";
    if (dom === "person" || dom === "device_tracker") return s2 === "home" ? "Home" : s2 === "not_home" ? "Away" : s2;
    if (dom === "update") return s2 === "on" ? `${a2.latest_version} available` : `Up to date \xB7 ${a2.installed_version}`;
    if (dom === "binary_sensor") {
      if (["opening", "door", "window", "garage_door"].includes(dc)) return s2 === "on" ? "Open" : "Closed";
      if (dc === "battery") return s2 === "on" ? "Low" : "OK";
      if (dc === "problem") return s2 === "on" ? "Needs attention" : "OK";
      if (dc === "moisture") return s2 === "on" ? "Wet" : "Dry";
      return s2 === "on" ? "Yes" : "No";
    }
    if (dc === "timestamp") {
      const d2 = new Date(s2);
      if (isNaN(d2)) return s2;
      const day = d2.toDateString() === (/* @__PURE__ */ new Date()).toDateString() ? "" : `${DAYS[d2.getDay()][0]}${DAYS[d2.getDay()].slice(1).toLowerCase()} `;
      return day + this._ampm(d2);
    }
    if (dom === "climate") return s2 === "off" ? "Off" : s2;
    if (["switch", "automation", "input_boolean", "light", "fan"].includes(dom)) return s2 === "on" ? "On" : "Off";
    const n2 = Number(s2), u2 = a2.unit_of_measurement;
    if (!isNaN(n2) && s2 !== "") {
      const v2 = Math.round(n2 * 10) / 10;
      return u2 ? `${v2}${u2 === "%" || u2 === "\xB0C" ? u2 === "\xB0C" ? "\xB0" : "%" : " " + u2}` : `${v2}`;
    }
    return s2[0].toUpperCase() + s2.slice(1);
  }
  // one tile in a sheet: switches toggle, buttons press, numbers step, the rest open more-info
  _popTile(x2) {
    if (!x2.name) {
      const e0 = this._st(x2.entity);
      x2 = { ...x2, name: e0 && e0.attributes.friendly_name || x2.entity };
    }
    if (x2.when) {
      const w2 = this._st(x2.when.entity);
      if (!w2 || w2.state !== x2.when.state) return J;
    }
    const e2 = this._st(x2.entity);
    if (!e2) return J;
    const dom = x2.entity.split(".")[0];
    const val = this._fmt(e2, x2);
    if (dom === "number" && !x2.attr) {
      const a2 = e2.attributes, v2 = Number(e2.state), step = a2.step || 1;
      const set = (d2) => this._call("number", "set_value", { entity_id: x2.entity, value: clamp(v2 + d2, a2.min, a2.max) });
      return Z`
        <div class="ptile stepper">
          <span class="tile-ico"><ha-icon icon=${x2.icon}></ha-icon></span>
          <span class="tile-text"><span class="tile-name">${x2.name}</span><span class="muted">${val}</span></span>
          <span class="steps-btns">
            <button class="round small" @click=${() => set(-step)}><ha-icon icon="mdi:minus"></ha-icon></button>
            <button class="round small" @click=${() => set(step)}><ha-icon icon="mdi:plus"></ha-icon></button>
          </span>
        </div>`;
    }
    const toggles = ["switch", "automation", "input_boolean", "light", "fan"].includes(dom) && !x2.attr;
    const on = toggles && e2.state === "on";
    const alert = dom === "binary_sensor" && e2.state === "on" && !x2.attr || dom === "update" && e2.state === "on" || e2.attributes.device_class === "battery" && Number(e2.state) <= 20;
    const tap = toggles ? () => this._call("homeassistant", "toggle", { entity_id: x2.entity }) : dom === "button" ? () => this._call("button", "press", { entity_id: x2.entity }) : () => this._moreInfo(x2.entity);
    return Z`
      <button class="ptile ${on ? "on" : ""} ${alert ? "alert" : ""} ${x2.wide ? "wide" : ""}" @click=${tap}>
        <span class="tile-ico"><ha-icon icon=${x2.icon || e2.attributes.icon || "mdi:information-outline"}></ha-icon></span>
        <span class="tile-text"><span class="tile-name">${x2.name}</span><span class="muted">${val}</span></span>
      </button>`;
  }
  // a row of options for one attribute: fan speed, swing, a source, an Apple TV app
  _popChoices(s2) {
    const e2 = this._st(s2.entity);
    if (!e2) return J;
    const now = e2.attributes[s2.attr];
    const [dom, svc] = s2.service.split(".");
    return Z`
      <div class="choices ${s2.compact ? "compact" : ""}">
        ${(s2.options || []).map((o2) => Array.isArray(o2) ? o2 : [o2.value, o2.name || o2.value, o2.icon || "mdi:circle-medium"]).map(([v2, name, icon]) => Z`
          <button class="choice ${now === v2 ? "on" : ""}"
                  @click=${() => this._call(dom, svc, { entity_id: s2.entity, [s2.field]: v2 })}>
            <ha-icon icon=${icon}></ha-icon><span>${name}</span></button>`)}
      </div>`;
  }
  _popPlayer(id) {
    const e2 = this._st(id);
    if (!e2) return J;
    const a2 = e2.attributes, playing = e2.state === "playing", off = ["off", "standby"].includes(e2.state);
    const vol = a2.volume_level, muted = a2.is_volume_muted;
    const mp = (svc, data = {}) => this._call("media_player", svc, Object.assign({ entity_id: id }, data));
    const step = (d2) => () => mp("volume_set", { volume_level: clamp(Math.round((vol + d2) * 100) / 100, 0, 1) });
    const dur = a2.media_duration || 0;
    let pos = a2.media_position || 0;
    if (playing && a2.media_position_updated_at) pos += ((this._npNow || Date.now()) - new Date(a2.media_position_updated_at).getTime()) / 1e3;
    pos = Math.max(0, dur ? Math.min(dur, pos) : pos);
    if (playing && dur && !this._ppTick) {
      this._ppTick = setInterval(() => {
        if (!this._pop) {
          clearInterval(this._ppTick);
          this._ppTick = null;
          return;
        }
        this._npNow = Date.now();
        this.requestUpdate();
      }, 1e3);
    }
    return Z`
      <div class="pplayer ${muted ? "muted-vol" : ""}">
        <div class="pp-top">
          ${this._art(a2)}
          <div class="media-text">
            ${this._src(a2) ? Z`<div class="media-src">${this._src(a2)}</div>` : J}
            <div class="media-title">${this._title(a2) || (off ? "Off" : "Nothing playing")}</div>
            ${this._artist(a2) ? Z`<div class="media-artist">${this._artist(a2)}</div>` : J}
          </div>
          ${e2.attributes.supported_features & 128 ? Z`
            <button class="round small ${off ? "" : "power-on"}" title="Power" @click=${() => mp(off ? "turn_on" : "turn_off")}>
              <ha-icon icon="mdi:power"></ha-icon></button>` : J}
        </div>
        <div class="pp-ctrl">
          <button class="round small" @click=${() => mp("media_previous_track")}><ha-icon icon="mdi:skip-previous"></ha-icon></button>
          <button class="round play" @click=${() => mp("media_play_pause")}>
            <ha-icon icon=${playing ? "mdi:pause" : "mdi:play"}></ha-icon></button>
          <button class="round small" @click=${() => mp("media_next_track")}><ha-icon icon="mdi:skip-next"></ha-icon></button>
        </div>
        ${dur ? Z`
          <div class="pp-prog">
            <div class="pp-track"><div style="width:${pos / dur * 100}%"></div></div>
            <div class="pp-times"><span>${this._ckDur(pos)}</span><span>-${this._ckDur(dur - pos)}</span></div>
          </div>` : J}
        ${vol != null ? Z`
          <div class="pp-vol">
            <button class="round small" title="Volume down" @click=${step(-VOL_STEP)}><ha-icon icon="mdi:minus"></ha-icon></button>
            <button class="round small" title="Volume up" @click=${step(VOL_STEP)}><ha-icon icon="mdi:plus"></ha-icon></button>
            <button class="round small ${muted ? "is-muted" : ""}" title="Mute" @click=${() => mp("volume_mute", { is_volume_muted: !muted })}>
              <ha-icon icon=${muted ? "mdi:volume-off" : "mdi:volume-high"}></ha-icon></button>
          </div>` : J}
      </div>`;
  }
  // a week of one sensor as a filled line, like the mini-graph-card on ha-phone
  _popGraph(s2) {
    const e2 = this._st(s2.entity);
    let pts = (this._hist || {})[s2.entity];
    if (pts && e2 && !isNaN(Number(e2.state))) pts = [...pts, [Date.now(), Number(e2.state)]];
    const now = e2 ? this._fmt(e2) : "\u2013";
    if (!pts || pts.length < 2) {
      return Z`<div class="graph"><div class="graph-head"><span>${s2.name}</span><b>${now}</b></div>
        <div class="graph-empty muted">${pts ? "Not enough history yet" : "Loading\u2026"}</div></div>`;
    }
    const W2 = 320, H2 = 90;
    const t0 = pts[0][0], t1 = Date.now();
    let lo = Math.min(...pts.map((p2) => p2[1])), hi = Math.max(...pts.map((p2) => p2[1]));
    if (hi - lo < 1) {
      hi += 0.5;
      lo -= 0.5;
    }
    const X2 = (t3) => (t3 - t0) / (t1 - t0) * W2, Y2 = (v2) => H2 - 6 - (v2 - lo) / (hi - lo) * (H2 - 12);
    let d2 = `M0 ${Y2(pts[0][1]).toFixed(1)}`;
    pts.forEach((p2, i2) => {
      if (i2) d2 += ` L${X2(p2[0]).toFixed(1)} ${Y2(pts[i2 - 1][1]).toFixed(1)}`;
      d2 += ` L${X2(p2[0]).toFixed(1)} ${Y2(p2[1]).toFixed(1)}`;
    });
    const c2 = s2.color || "var(--accent)";
    return Z`
      <div class="graph">
        <div class="graph-head"><span>${s2.name}</span><b>${now}</b></div>
        <svg viewBox="0 0 ${W2} ${H2}" preserveAspectRatio="none">
          ${q`<path d="${d2} L${W2} ${H2} L0 ${H2} Z" fill=${c2} opacity="0.14"></path>
                <path d=${d2} fill="none" stroke=${c2} stroke-width="2" vector-effect="non-scaling-stroke"
                      stroke-linejoin="round" stroke-linecap="round"></path>`}
        </svg>
        <div class="graph-foot muted"><span>${Math.round(lo)}–${Math.round(hi)}${e2 && e2.attributes.unit_of_measurement === "%" ? "%" : "\xB0"} ${(s2.hours || 168) >= 168 ? "this week" : "today"}</span>
          <span>${(s2.hours || 168) >= 48 ? `${(s2.hours || 168) / 24} days` : `${s2.hours} hours`}</span></div>
      </div>`;
  }
  // one reading per room, each its own colour (or, with average: true, one line for their mean)
  _popMultiGraph(s2) {
    const hours = s2.hours || 24, t1 = Date.now(), t0 = t1 - hours * 3600 * 1e3;
    const cur = (x2) => {
      const e2 = this._st(x2.entity);
      const v2 = e2 ? Number(x2.attr ? e2.attributes[x2.attr] : e2.state) : NaN;
      return isNaN(v2) ? null : v2;
    };
    const lines = s2.series.map((x2) => {
      const ok = (v2) => !s2.valid || v2 >= s2.valid[0] && v2 <= s2.valid[1];
      let pts = ((this._hist || {})[x2.attr ? `${x2.entity}|${x2.attr}` : x2.entity] || []).filter((p2) => ok(p2[1]));
      let c2 = cur(x2);
      if (c2 !== null && !ok(c2)) c2 = null;
      if (c2 !== null) pts.push([t1, c2]);
      return { ...x2, pts, now: c2 };
    });
    const unit = s2.unit != null ? s2.unit : "\xB0";
    const fmtv = (v2) => v2 === null || v2 === void 0 ? "\u2013" : unit === "%" ? `${Math.round(v2)}%` : unit === "\xB0" ? `${v2.toFixed(1)}\xB0` : `${Math.round(v2)}${unit}`;
    const at2 = (pts, t3) => {
      let v2 = null;
      for (const p2 of pts) {
        if (p2[0] <= t3) v2 = p2[1];
        else break;
      }
      return v2;
    };
    const N2 = Math.round(hours * 4), grid = [];
    for (let i2 = 0; i2 <= N2; i2++) grid.push(t0 + (t1 - t0) * i2 / N2);
    const smooth = (vals) => vals.map((v2, i2) => {
      if (v2 === null) return null;
      const w2 = vals.slice(Math.max(0, i2 - 2), i2 + 3).filter((x2) => x2 !== null);
      return w2.reduce((a2, b2) => a2 + b2, 0) / w2.length;
    });
    const onGrid = (vals) => smooth(vals).map((v2, i2) => [grid[i2], v2]).filter((p2) => p2[1] !== null);
    let plot = lines.map((l2) => ({ ...l2, pts: onGrid(grid.map((t3) => at2(l2.pts, t3))) }));
    if (s2.average) {
      const mean = grid.map((t3) => {
        const vals = lines.map((l2) => at2(l2.pts, t3)).filter((v2) => v2 !== null);
        return vals.length ? vals.reduce((a2, b2) => a2 + b2, 0) / vals.length : null;
      });
      const nows = lines.map((l2) => l2.now).filter((v2) => v2 !== null);
      plot = [{
        name: s2.name,
        color: s2.color || "var(--accent)",
        pts: onGrid(mean),
        now: nows.length ? nows.reduce((a2, b2) => a2 + b2, 0) / nows.length : null
      }];
    }
    const all = plot.flatMap((l2) => l2.pts.filter((p2) => p2[0] >= t0).map((p2) => p2[1]));
    if (all.length < 2) {
      return Z`<div class="graph"><div class="graph-head"><span>${s2.name}</span></div>
        <div class="graph-empty muted">${this._hist ? "Not enough history yet" : "Loading\u2026"}</div></div>`;
    }
    let lo = Math.min(...all), hi = Math.max(...all);
    if (hi - lo < 2) {
      const m2 = (hi + lo) / 2;
      lo = m2 - 1;
      hi = m2 + 1;
    }
    const W2 = 320, H2 = 110;
    const X2 = (t3) => (Math.max(t3, t0) - t0) / (t1 - t0) * W2, Y2 = (v2) => H2 - 6 - (v2 - lo) / (hi - lo) * (H2 - 12);
    const path = (pts) => {
      const q2 = pts.map((p2) => [X2(p2[0]), Y2(p2[1])]);
      if (!q2.length) return "";
      const f2 = (n2) => n2.toFixed(1);
      let d2 = `M${f2(q2[0][0])} ${f2(q2[0][1])}`;
      for (let i2 = 1; i2 < q2.length - 1; i2++) {
        d2 += ` Q${f2(q2[i2][0])} ${f2(q2[i2][1])} ${f2((q2[i2][0] + q2[i2 + 1][0]) / 2)} ${f2((q2[i2][1] + q2[i2 + 1][1]) / 2)}`;
      }
      if (q2.length > 1) d2 += ` L${f2(q2[q2.length - 1][0])} ${f2(q2[q2.length - 1][1])}`;
      return d2;
    };
    const one = plot.length === 1;
    return Z`
      <div class="graph mgraph">
        <div class="graph-head"><span>${s2.name}</span>${one ? Z`<b>${fmtv(plot[0].now)}</b>` : J}</div>
        <svg viewBox="0 0 ${W2} ${H2}" preserveAspectRatio="none">
          ${plot.map((l2) => {
      const d2 = path(l2.pts);
      return q`${one ? q`<path d="${d2} L${W2} ${H2} L0 ${H2} Z" fill=${l2.color} opacity="0.14"></path>` : J}
              <path d=${d2} fill="none" stroke=${l2.color} stroke-width=${one ? 2.5 : 2} vector-effect="non-scaling-stroke"
                    stroke-linejoin="round" stroke-linecap="round"></path>`;
    })}
        </svg>
        ${one ? J : Z`<div class="mg-legend">${plot.map((l2) => Z`
          <span><i style="background:${l2.color}"></i>${l2.name}<b>${fmtv(l2.now)}</b></span>`)}</div>`}
        <div class="graph-foot muted"><span>${fmtv(lo)}–${fmtv(hi)}</span>
          <span>${hours >= 48 ? `${hours / 24} days` : `${hours} hours`}</span></div>
      </div>`;
  }
  _dock() {
    return Z`
      <nav class="dock">
        <div class="dock-pill">
          ${(this._config.hub ? HUB_PAGES : this._config.bedside ? BEDSIDE_PAGES : PAGES).map(([id, name, icon]) => Z`
            <button class="dock-btn ${this._page === id ? "on" : ""}" title=${name}
                    @click=${() => this._go(id)}>
              <ha-icon icon=${icon}></ha-icon>
            </button>`)}
        </div>
        ${this._config.photos ? Z`
          <button class="dock-btn photo-btn" title="Photos" @click=${() => this._go("photos")}>
            <ha-icon icon="mdi:image-multiple-outline"></ha-icon>
          </button>` : J}
      </nav>`;
  }
  _pageBody() {
    switch (this._page) {
      case "kitchen":
        return this._config.phone ? this._phoneHome() : this._kitchen();
      case "recipes":
        return this._recipes();
      case "calendar":
        return this._calendar();
      case "home":
        return this._home();
      case "desk":
        return this._desk();
      case "controls":
        return this._config.hub ? this._hubControls() : this._bedControls();
      case "media":
        return this._config.hub ? this._hubMedia() : this._bedMedia();
      case "climate":
        return this._config.hub ? this._hubClimate() : this._bedClimate();
      default: {
        const p2 = PAGES.find((x2) => x2[0] === this._page);
        return Z`<div class="soon card">
          <ha-icon icon=${p2[2]}></ha-icon>
          <div class="soon-title">${p2[1]}</div>
          <div class="muted">Coming in the next round.</div>
        </div>`;
      }
    }
  }
  // --- home: a tab per room ----------------------------------------------------
  _home() {
    const rooms = this._config.rooms || [];
    if (!rooms.length) return J;
    const r2 = rooms.find((x2) => x2.name === this._room) || rooms[0];
    return Z`
      <div class="home">
        <div class="tabs">
          ${rooms.map((x2) => Z`
            <button class="tab ${x2 === r2 ? "on" : ""}" @click=${() => {
      this._room = x2.name;
    }}>
              <ha-icon icon=${x2.icon}></ha-icon><span>${x2.name}</span></button>`)}
        </div>
        ${r2.music ? this._musicRoom() : this._room_(r2)}
      </div>`;
  }
  // --- bedside (the Echo Show 5 by the bed) ------------------------------------
  // config.room is the bedroom from show.CARD.rooms; the pages only show what it has
  _bedControls() {
    const r2 = this._config.room || {};
    const group = r2.group && this._st(r2.group);
    const groupOn = !!group && group.state === "on";
    return Z`
      <div class="bed-controls">
        ${group ? this._controlTile(
      "All Lights",
      "mdi:lightbulb-group",
      "var(--warm)",
      group,
      () => this._call("light", groupOn ? "turn_off" : "turn_on", { entity_id: r2.group })
    ) : J}
        ${(r2.switches || []).map((x2) => {
      const e2 = this._st(x2.entity);
      return e2 ? this._controlTile(
        x2.name,
        x2.icon,
        "#3f86f2",
        e2,
        () => this._call("homeassistant", "toggle", { entity_id: x2.entity })
      ) : J;
    })}
      </div>`;
  }
  // the climate tile's layout for something you switch: tinted only while it's on
  _controlTile(name, icon, colour, e2, tap) {
    const on = e2.state === "on";
    return Z`
      <button class="card air-tile control-tile ${on ? "on" : ""}" style="--c:${colour}" @click=${tap}>
        <span class="air-ico"><ha-icon icon=${icon}></ha-icon></span>
        <span class="air-name">${name}<span class="air-q">${on ? "On" : e2.state === "unavailable" ? "Unavailable" : "Off"}</span></span>
      </button>`;
  }
  _bedMedia() {
    const pl = this._playlists();
    return Z`
      <div class="bed-two">
        ${this._mediaCard()}
        ${pl === J ? J : Z`<div class="card bed-card bed-pl">${pl}</div>`}
      </div>`;
  }
  // a big reading: its number, its name and a one-word verdict, tinted in its colour
  _airTile(x2) {
    const e2 = this._st(x2.entity);
    if (!e2) return J;
    const k2 = Object.keys(AIR).find((n2) => x2.entity.includes(n2));
    const [label, colour, verdict] = AIR[k2] || [x2.name, x2.color || "var(--accent)", () => ""];
    const v2 = Number(e2.state), ok = !isNaN(v2) && e2.state !== "";
    return Z`
      <button class="card air-tile" style="--c:${colour}" @click=${() => this._open(x2.entity)}>
        <span class="air-ico"><ha-icon icon=${x2.icon}></ha-icon></span>
        <span class="air-val">${ok ? Math.round(v2) : "\u2013"}<small>${x2.unit != null ? x2.unit : e2.attributes.unit_of_measurement || ""}</small></span>
        <span class="air-name">${label}<span class="air-q">${ok ? verdict(v2) : "No reading"}</span></span>
      </button>`;
  }
  _bedClimate() {
    const r2 = this._config.room || {};
    return Z`
      <div class="bed-air">
        ${(r2.sensors || []).map((x2) => this._airTile(x2))}
      </div>`;
  }
  // --- hub (the Nest Hub in the kitchen) ------------------------------------------
  // config.hub_rooms: the rooms whose lights get a tile; config.tv: the TV's power tile
  _hubControls() {
    const tv = this._config.tv && this._st(this._config.tv.entity);
    const tvOn = !!tv && !["off", "standby", "unavailable"].includes(tv.state);
    return Z`
      <div class="bed-two hub-sq-left">
        <div class="bed-controls hub-controls">
          ${(this._config.hub_rooms || []).map((r2) => {
      const g2 = this._st(r2.group), on = !!g2 && g2.state === "on";
      return g2 ? this._controlTile(
        r2.name,
        r2.icon,
        "var(--warm)",
        g2,
        () => this._call("light", on ? "turn_off" : "turn_on", { entity_id: r2.group })
      ) : J;
    })}
          <button class="card air-tile control-tile" style="--c:var(--accent)" @click=${() => {
      this._scenes = true;
    }}>
            <span class="air-ico"><ha-icon icon="mdi:creation"></ha-icon></span>
            <span class="air-name">Scenes<span class="air-q">Tap for more</span></span>
          </button>
          ${tv ? this._controlTile(
      this._config.tv.name,
      this._config.tv.icon,
      "#8e5cf0",
      { state: tvOn ? "on" : tv.state },
      () => this._call("media_player", tvOn ? "turn_off" : "turn_on", { entity_id: this._config.tv.entity })
    ) : J}
        </div>
        <div class="hub-stack">${this._mediaCard()}${this._shopping()}</div>
      </div>`;
  }
  _scenesSheet() {
    const close = () => {
      this._scenes = false;
    };
    return Z`
      <div class="scrim" @click=${close}>
        <div class="sheet card scenes-sheet" @click=${(ev) => ev.stopPropagation()}>
          <div class="card-title">Scenes</div>
          <div class="hub-scenes">${(this._config.hub_scenes || []).map((x2) => this._miniScene(x2))}</div>
        </div>
      </div>`;
  }
  // everything playing or paused anywhere, then the playlists
  _hubMedia() {
    const all = (this._config.rooms || []).flatMap((r2) => r2.media || []);
    const live = all.filter((m2) => {
      const e2 = this._st(m2.entity);
      return e2 && ["playing", "paused"].includes(e2.state);
    });
    const pl = this._playlists();
    return Z`
      <div class="bed-two">
        <div class="hub-players">
          ${live.length ? live.map((m2) => this._player(m2)) : Z`
            <div class="card soon"><ha-icon icon="mdi:music-off"></ha-icon><div class="muted">Nothing playing</div></div>`}
        </div>
        ${pl === J ? J : Z`<div class="card bed-card bed-pl">${pl}</div>`}
      </div>`;
  }
  // outside over the heat pump, beside the kitchen's air readings
  _hubClimate() {
    const r2 = this._config.room || {};
    const w2 = this._st(this._config.weather), f2 = this._forecast;
    const cond = w2 ? this._cond(w2) : null;
    return Z`
      <div class="bed-two hub-sq-right">
        <div class="hub-stack">
          ${w2 ? Z`
            <button class="card hub-out" @click=${() => this._open(this._config.weather)}>
              <div class="card-title">Outside</div>
              <div class="hub-out-row">
                ${this._wxIcon(w2.state)}
                <span class="hub-out-temp">${this._deg(w2.attributes.temperature)}</span>
                <div class="wx-side">
                  <div class="wx-cond">${cond[1]}</div>
                  ${f2 && w2.state !== "unavailable" ? Z`<div class="wx-hl">H ${Math.round(f2.temperature)}°&nbsp;&nbsp;L ${Math.round(f2.templow)}°</div>` : J}
                </div>
              </div>
            </button>` : J}
          ${this._config.climate ? Z`<div class="card desk-hp hub-hp">${this._thermostat()}</div>` : J}
        </div>
        <div class="bed-air">${(r2.sensors || []).map((x2) => this._airTile(x2))}</div>
      </div>`;
  }
  // --- desk (the computer): the whole house on one page, laid out like ha-computer:
  // outside, heat pump and scenes, then a column per room; the bedrooms share the last
  _desk() {
    const rooms = (this._config.rooms || []).filter((r2) => !r2.music);
    const w2 = this._st(this._config.weather), f2 = this._forecast;
    const cond = w2 ? this._cond(w2) : null;
    const [down, up] = this._holdToUncover();
    const head = (name) => Z`<div class="desk-title" @pointerdown=${down} @pointerup=${up} @pointerleave=${up}>${name}</div>`;
    const byRoom = (key, tile) => rooms.filter((r2) => (r2[key] || []).length).map((r2) => Z`
      <div class="desk-sub"><ha-icon class="desk-ico" icon=${r2.icon}></ha-icon>${r2.name}</div>
      ${r2[key].map((x2) => tile(x2))}`);
    const lit = rooms.filter((r2) => (r2.lights || []).length);
    const plugs = byRoom("switches", (x2) => this._switchTile(x2));
    const plants = byRoom("plants", (x2) => this._plantTile(x2));
    return Z`
      <div class="desk">
        <div class="desk-col">
          ${w2 || this._config.climate ? head("Climate") : J}
          ${w2 ? Z`
            <div class="card desk-card">
              <div class="card-title">Outside</div>
              <div class="wx-card" @click=${() => this._open(this._config.weather)}>
                ${this._wxIcon(w2.state)}
                <span class="wx-temp">${this._deg(w2.attributes.temperature)}</span>
                <div class="wx-side">
                  <div class="wx-cond">${cond[1]}</div>
                  ${f2 && w2.state !== "unavailable" ? Z`<div class="wx-hl">H ${Math.round(f2.temperature)}°&nbsp;&nbsp;L ${Math.round(f2.templow)}°</div>` : J}
                </div>
              </div>
            </div>` : J}
          ${this._config.climate ? Z`
            <div class="card desk-card desk-hp">${this._thermostat()}</div>` : J}
          ${this._config.scenes.length ? Z`${head("Scenes")}
            <div class="card desk-card">
              <div class="fav-scenes desk-scenes">${this._config.scenes.map((x2) => this._miniScene(x2))}</div></div>` : J}
        </div>
        <div class="desk-col desk-mid">
          ${lit.length ? Z`${head("Lights")}<div class="desk-pair">${lit.map((r2) => this._deskLights(r2))}</div>` : J}
          ${plugs.length || plants.length ? Z`
            <div class="desk-pair">
              ${plugs.length ? Z`<div class="desk-stack">${head("Plugs")}${plugs}</div>` : J}
              ${plants.length ? Z`<div class="desk-stack">${head("Plants")}${plants}</div>` : J}
            </div>` : J}
        </div>
        <div class="desk-col">${head("Media")}${byRoom("media", (m2) => this._player(m2))}</div>
      </div>`;
  }
  // a room's lights on the desk: its name and All on/off, then its pills
  _deskLights(r2) {
    const lights = r2.lights;
    const lit = lights.filter((l2) => {
      const e2 = this._st(l2.entity);
      return e2 && e2.state === "on";
    }).length;
    return Z`
      <div class="card desk-card">
        <div class="card-title"><ha-icon class="desk-ico" icon=${r2.icon}></ha-icon>${r2.name}
          ${lit ? Z`<span class="count">${lit} on</span>` : J}
          ${r2.group && this._st(r2.group) ? Z`
            <button class="all-btn" @click=${() => this._call("light", lit ? "turn_off" : "turn_on", { entity_id: r2.group })}>
              ${lit ? "All off" : "All on"}</button>` : J}
        </div>
        <div class="desk-favs" style="--n:${Math.max(3, lights.length)}">${lights.map((l2) => this._pill(l2))}</div>
      </div>`;
  }
  _room_(r2) {
    const lights = r2.lights || [];
    const lit = lights.filter((l2) => {
      const e2 = this._st(l2.entity);
      return e2 && e2.state === "on";
    }).length;
    let side = [
      ...(r2.media || []).map((m2) => this._player(m2)),
      ...(r2.switches || []).map((x2) => this._switchTile(x2)),
      ...(r2.plants || []).map((x2) => this._plantTile(x2)),
      ...(r2.sensors || []).length ? [Z`<div class="room-env">${this._sensors(r2.sensors)}</div>`] : []
    ];
    const scenesAside = !side.length;
    if (scenesAside) side = (r2.scenes || []).map((x2) => this._sceneBtn(x2, true));
    return Z`
      <div class="room ${r2.climate ? "has-hp" : ""}">
        <div class="card room-lights">
          <div class="card-title">Lights <span class="count">${lit ? `${lit} on` : ""}</span>
            ${r2.group && this._st(r2.group) ? Z`
              <button class="all-btn" @click=${() => this._call("light", lit ? "turn_off" : "turn_on", { entity_id: r2.group })}>
                ${lit ? "All off" : "All on"}</button>` : J}
          </div>
          <div class="favs room-favs ${r2.climate ? "" : "no-hp"}" style="--n:${lights.length}">
            ${lights.map((l2) => this._pill(l2))}
            ${r2.climate ? this._thermostat(r2.climate) : J}
          </div>
        </div>
        ${side.length ? Z`<div class="room-side">${side}</div>` : J}
        ${!scenesAside && (r2.scenes || []).length ? Z`
          <div class="scenes">
            ${r2.scenes.map((x2) => this._sceneBtn(x2))}
          </div>` : J}
      </div>`;
  }
  _player(m2) {
    const id = m2.entity;
    const e2 = this._st(id);
    if (!e2) return J;
    const a2 = e2.attributes;
    const active = ["playing", "paused"].includes(e2.state) && a2.media_title;
    const state = e2.state === "playing" ? "Playing" : e2.state === "paused" ? "Paused" : e2.state === "unavailable" ? "Unavailable" : e2.state[0].toUpperCase() + e2.state.slice(1);
    const vol = a2.volume_level;
    const phone = this._config.phone;
    const pic = active ? this._pic(a2) : null;
    const powerTile = phone && POWER_TILES.includes(id);
    const showVol = !powerTile && vol != null && e2.state !== "off";
    const pct = showVol ? Math.round(vol * 100) : null;
    const step = (d2) => () => this._call("media_player", "volume_set", { entity_id: id, volume_level: clamp(Math.round((vol + d2) * 100) / 100, 0, 1) });
    return Z`
      <div class="card player ${phone && pic ? "has-art" : ""} ${phone && showVol ? "has-vol" : ""}" style=${phone && pic ? `--art:url('${pic}')` : ""}>
        ${phone && showVol ? Z`<span class="ph-vol">${pct}%</span>` : J}
        <div class="player-row" @click=${() => {
      if (this._links()[id]) this._open(id);
    }}>
          ${!phone && active && this._input(a2) ? this._art(a2, "small") : Z`
          <div class="art small" style=${!phone && pic ? `background-image:url('${pic}')` : ""}>
            ${!phone && pic ? J : Z`<ha-icon icon=${m2.icon || "mdi:speaker"}></ha-icon>`}
          </div>`}
          <div class="media-text">
            <div class="media-src">${m2.name || a2.friendly_name}</div>
            <div class="player-title">${active ? this._title(a2) : state}</div>
            ${active && (this._artist(a2) || a2.app_name) ? Z`<div class="media-artist">${this._artist(a2) || a2.app_name}</div>` : J}
          </div>
          ${active ? Z`
            <button class="round play" @click=${() => this._call("media_player", "media_play_pause", { entity_id: id })}>
              <ha-icon icon=${e2.state === "playing" ? "mdi:pause" : "mdi:play"}></ha-icon></button>` : J}
        </div>
        ${showVol && phone ? Z`
          <div class="transport power-pair">
            <button class="round small" title="Volume down" @click=${step(-VOL_STEP)}><ha-icon icon="mdi:minus"></ha-icon></button>
            <button class="round small" title="Volume up" @click=${step(VOL_STEP)}><ha-icon icon="mdi:plus"></ha-icon></button>
          </div>` : J}
        ${showVol && !phone ? Z`
          <div class="vol vol-pair vol-pct">
            <button class="round small" @click=${step(-VOL_STEP)}><ha-icon icon="mdi:minus"></ha-icon></button>
            <span class="where-vol">${pct}%</span>
            <button class="round small" @click=${step(VOL_STEP)}><ha-icon icon="mdi:plus"></ha-icon></button>
          </div>` : J}
        ${powerTile ? Z`
          <div class="transport power-pair">
            <button class="round small" title="Play/pause" @click=${() => this._call("media_player", "media_play_pause", { entity_id: id })}>
              <ha-icon icon=${e2.state === "playing" ? "mdi:pause" : "mdi:play"}></ha-icon></button>
            <button class="round small" title="Power" @click=${() => this._call("media_player", e2.state === "off" ? "turn_on" : "turn_off", { entity_id: id })}>
              <ha-icon icon="mdi:power"></ha-icon></button>
          </div>` : J}
        ${phone && !powerTile && vol == null && ["playing", "paused"].includes(e2.state) ? Z`
          <div class="transport">
            <button class="round small" @click=${() => this._call("media_player", "media_play_pause", { entity_id: id })}>
              <ha-icon icon=${e2.state === "playing" ? "mdi:pause" : "mdi:play"}></ha-icon></button>
          </div>` : J}
      </div>`;
  }
  _switchTile(x2) {
    const e2 = this._st(x2.entity);
    if (!e2) return J;
    const on = e2.state === "on";
    return Z`
      <button class="card tile ${on ? "on" : ""}" @click=${() => this._call("homeassistant", "toggle", { entity_id: x2.entity })}>
        <span class="tile-ico"><ha-icon icon=${x2.icon}></ha-icon></span>
        <span class="tile-text"><span class="tile-name">${x2.name}</span>
          <span class="muted">${on ? "On" : e2.state === "unavailable" ? "Unavailable" : "Off"}</span></span>
      </button>`;
  }
  // any other reading: its state as HA formats it; tap for the pop-up or HA's dialog
  _sensorTile(x2) {
    const e2 = this._st(x2.entity);
    if (!e2) return J;
    const val = this.hass.formatEntityState ? this.hass.formatEntityState(e2) : `${e2.state}${e2.attributes.unit_of_measurement ? " " + e2.attributes.unit_of_measurement : ""}`;
    return Z`
      <button class="card tile" @click=${() => this._open(x2.entity)}>
        <span class="tile-ico"><ha-icon icon=${x2.icon || e2.attributes.icon || "mdi:eye-outline"}></ha-icon></span>
        <span class="tile-text"><span class="tile-name">${x2.name || e2.attributes.friendly_name}</span>
          <span class="muted">${val}</span></span>
      </button>`;
  }
  _plantTile(x2) {
    const e2 = this._st(x2.entity);
    if (!e2) return J;
    const v2 = Number(e2.state);
    return Z`
      <button class="card tile plant" @click=${() => this._open(x2.entity)}>
        <span class="tile-ico"><ha-icon icon="mdi:sprout"></ha-icon></span>
        <span class="tile-text"><span class="tile-name">${x2.name}</span>
          <span class="muted">Soil moisture</span></span>
        <span class="tile-val">${isNaN(v2) ? "\u2013" : Math.round(v2)}<small>%</small></span>
      </button>`;
  }
  _sceneBtn(x2, tile = false) {
    const [domain] = x2.entity.split(".");
    const e2 = this._st(x2.entity);
    const on = domain === "input_boolean" && e2 && e2.state === "on";
    const go = () => domain === "input_boolean" ? this._call("input_boolean", "toggle", { entity_id: x2.entity }) : this._call(domain, "turn_on", { entity_id: x2.entity });
    if (tile) {
      return Z`
        <button class="card tile ${on ? "on" : ""}" @click=${go}>
          <span class="tile-ico"><ha-icon icon=${x2.icon}></ha-icon></span>
          <span class="tile-text"><span class="tile-name">${x2.name}</span>
            <span class="muted">${domain === "input_boolean" ? on ? "On" : "Off" : "Tap to run"}</span></span>
        </button>`;
    }
    return Z`
      <button class="card scene ${on ? "on" : ""}" @click=${go}>
        <ha-icon icon=${x2.icon}></ha-icon><span>${x2.name}</span></button>`;
  }
  _miniScene(x2) {
    const [domain] = x2.entity.split(".");
    const e2 = this._st(x2.entity);
    const on = domain === "input_boolean" && e2 && e2.state === "on";
    const go = () => domain === "input_boolean" ? this._call("input_boolean", "toggle", { entity_id: x2.entity }) : this._call(domain, "turn_on", { entity_id: x2.entity });
    return Z`
      <button class="mini-scene ${on ? "on" : ""}" @click=${go}>
        <ha-icon icon=${x2.icon}></ha-icon>
        <span class="ms-name">${x2.name}</span></button>`;
  }
  _musicRoom() {
    return Z`
      <div class="music">
        ${this._mediaCard()}
        <div class="card music-pl">${this._playlists()}</div>
      </div>`;
  }
  // --- calendar: month grid + what's on --------------------------------------
  _gridStart(first) {
    const d2 = new Date(first);
    d2.setDate(d2.getDate() - (d2.getDay() + 6) % 7);
    return d2;
  }
  _toToday() {
    const t3 = /* @__PURE__ */ new Date();
    this._month = new Date(t3.getFullYear(), t3.getMonth(), 1);
    this._sel = this._ymd(t3);
    this._loadMonth();
  }
  _shiftMonth(n2) {
    const m2 = new Date(this._month.getFullYear(), this._month.getMonth() + n2, 1);
    this._month = m2;
    this._sel = this._ymd(m2.getMonth() === (/* @__PURE__ */ new Date()).getMonth() && m2.getFullYear() === (/* @__PURE__ */ new Date()).getFullYear() ? /* @__PURE__ */ new Date() : m2);
    this._loadMonth();
  }
  _pick(ymd) {
    this._sel = ymd;
    if (!this._config.phone) this._dayOpen = ymd;
    const d2 = this._day(ymd);
    if (d2.getMonth() !== this._month.getMonth()) this._month = new Date(d2.getFullYear(), d2.getMonth(), 1);
    this._loadMonth();
  }
  // each event listed under every day it covers (all-day ends are exclusive)
  _byDay(events) {
    const out = {};
    for (const e2 of events) {
      const s2 = this._d(e2.start), end = this._d(e2.end);
      const d2 = new Date(s2);
      d2.setHours(0, 0, 0, 0);
      for (let i2 = 0; i2 < 62 && (i2 === 0 || d2 < end); i2++) {
        (out[this._ymd(d2)] = out[this._ymd(d2)] || []).push(e2);
        d2.setDate(d2.getDate() + 1);
      }
    }
    return out;
  }
  _calendar() {
    if (!(this._config.calendars || []).length) {
      return Z`<div class="soon card"><ha-icon icon="mdi:calendar-month-outline"></ha-icon>
        <div class="soon-title">Calendar</div><div class="muted">No calendars set up.</div></div>`;
    }
    const m2 = this._month, today = this._ymd(/* @__PURE__ */ new Date());
    const gs2 = this._gridStart(m2);
    const days = new Date(m2.getFullYear(), m2.getMonth() + 1, 0).getDate();
    const weeks = Math.ceil(((m2.getDay() + 6) % 7 + days) / 7);
    const byDay = this._byDay(this._cal || []);
    const cells = Array.from({ length: weeks * 7 }, (_2, i2) => {
      const d2 = new Date(gs2);
      d2.setDate(d2.getDate() + i2);
      return d2;
    });
    const thisMonth = m2.getMonth() === (/* @__PURE__ */ new Date()).getMonth() && m2.getFullYear() === (/* @__PURE__ */ new Date()).getFullYear();
    if (this._config.bedside) {
      return Z`<div class="bed-two bed-cal">${this._dateCard(false)}${this._whatsOn(byDay, today)}</div>`;
    }
    if (!this._config.phone) {
      return Z`
        <div class="calendar big">
          <div class="month">
            <div class="month-head">
              <button class="nav-btn" title="Previous month" @click=${() => this._shiftMonth(-1)}>
                <ha-icon icon="mdi:chevron-left"></ha-icon></button>
              <button class="nav-btn" title="Next month" @click=${() => this._shiftMonth(1)}>
                <ha-icon icon="mdi:chevron-right"></ha-icon></button>
              <h1><span class="mon">${MONTHS[m2.getMonth()]}</span> <span class="yr">${m2.getFullYear()}</span></h1>
              <button class="today-btn" ?disabled=${thisMonth} @click=${() => this._toToday()}>Today</button>
            </div>
            <div class="dow">${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d2) => Z`<span>${d2}</span>`)}</div>
            <div class="mgrid" style="--weeks:${weeks}">
              ${cells.map((d2) => {
        const k2 = this._ymd(d2), ev = byDay[k2] || [];
        const fit = this._fit || 2;
        const shown = ev.length <= fit ? ev : ev.slice(0, fit - 1);
        return Z`
                  <button class="day ${d2.getMonth() !== m2.getMonth() ? "out" : ""} ${k2 === today ? "today" : ""}"
                          @click=${() => this._pick(k2)}>
                    <span class="dnum">${d2.getDate()}</span>
                    ${shown.map((e2) => Z`<span class="chip" style="--c:${e2.colour}"><i></i>
                      <b>${this._when(e2, d2) === "Ongoing" ? "" : this._when(e2, d2)}</b><span>${e2.summary}</span></span>`)}
                    ${ev.length > shown.length ? Z`<span class="more">+${ev.length - shown.length} more</span>` : J}
                  </button>`;
      })}
            </div>
          </div>
        </div>`;
    }
    return Z`
      <div class="calendar">
        <div class="card month">
          <div class="month-head">
            <h1>${LONG_MONTHS[m2.getMonth()]} <span class="muted">${m2.getFullYear()}</span></h1>
            ${thisMonth && this._sel === today ? J : Z`<button class="today-btn" @click=${() => this._toToday()}>Today</button>`}
            <button class="nav-btn" title="Previous month" @click=${() => this._shiftMonth(-1)}>
              <ha-icon icon="mdi:chevron-left"></ha-icon></button>
            <button class="nav-btn" title="Next month" @click=${() => this._shiftMonth(1)}>
              <ha-icon icon="mdi:chevron-right"></ha-icon></button>
          </div>
          <div class="dow">${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d2) => Z`<span>${d2}</span>`)}</div>
          <div class="mgrid" style="--weeks:${weeks}">
            ${cells.map((d2) => {
      const k2 = this._ymd(d2), ev = byDay[k2] || [];
      const fit = this._fit || 2;
      const shown = ev.length <= fit ? ev : ev.slice(0, fit - 1);
      return Z`
                <button class="day ${d2.getMonth() !== m2.getMonth() ? "out" : ""} ${k2 === today ? "today" : ""} ${k2 === this._sel ? "sel" : ""}"
                        @click=${() => this._pick(k2)}>
                  <span class="dnum">${d2.getDate()}</span>
                  ${this._config.phone ? Z`<span class="ev-dots">${ev.slice(0, 3).map((e2) => Z`<i style="background:${e2.colour}"></i>`)}</span>` : Z`
                    ${shown.map((e2) => Z`<span class="chip" style="--c:${e2.colour}">${e2.summary}</span>`)}
                    ${ev.length > shown.length ? Z`<span class="more">+${ev.length - shown.length} more</span>` : J}`}
                </button>`;
    })}
          </div>
        </div>
        ${this._whatsOn(byDay, today)}
      </div>`;
  }
  _when(e2, d2) {
    if (!e2.start.dateTime) return "All day";
    const s2 = this._d(e2.start);
    return s2.toDateString() === d2.toDateString() ? this._ampm(s2) : "Ongoing";
  }
  // the big screen's day sheet: everything on the tapped day, with times and places
  _daySheet() {
    const k2 = this._dayOpen, d2 = this._day(k2), ev = this._byDay(this._cal || [])[k2] || [];
    const close = () => {
      this._dayOpen = null;
    };
    return Z`
      <div class="scrim" @click=${close}>
        <div class="sheet card day-sheet" @click=${(ev2) => ev2.stopPropagation()}>
          <div class="card-title">${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d2.getDay()]}
            ${d2.getDate()} ${LONG_MONTHS[d2.getMonth()]}</div>
          ${ev.length ? ev.map((e2) => Z`
            <div class="wo-ev">
              <span class="wo-time">${this._when(e2, d2)}</span>
              <span class="bar" style="background:${e2.colour}"></span>
              <div class="wo-text">
                <div class="ev-name">${e2.summary}</div>
                ${e2.location ? Z`<div class="wo-loc muted">${e2.location.split(",")[0]}</div>` : J}
              </div>
            </div>`) : Z`<div class="empty muted">Nothing on.</div>`}
        </div>
      </div>`;
  }
  _whatsOn(byDay, today) {
    const sel = this._day(this._sel);
    const tomorrow = /* @__PURE__ */ new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const groups = [];
    for (let i2 = 0; i2 < 8; i2++) {
      const d2 = new Date(sel);
      d2.setDate(d2.getDate() + i2);
      const k2 = this._ymd(d2), ev = byDay[k2] || [];
      if (!ev.length && i2 > 0) continue;
      const label = k2 === today ? "Today" : k2 === this._ymd(tomorrow) ? "Tomorrow" : `${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d2.getDay()]} ${d2.getDate()} ${LONG_MONTHS[d2.getMonth()]}`;
      groups.push({ k: k2, d: d2, label, ev });
    }
    const when = (e2, d2) => this._when(e2, d2);
    return Z`
      <div class="card whatson">
        <div class="card-title">What's on</div>
        <div class="wo-list">
          ${this._cal == null ? Z`<div class="empty muted">Loading…</div>` : groups.map((g2) => Z`
            <div class="wo-day ${g2.k === today ? "is-today" : ""}">${g2.label}</div>
            ${g2.ev.length ? g2.ev.map((e2) => Z`
              <div class="wo-ev">
                <span class="wo-time">${when(e2, g2.d)}</span>
                <span class="bar" style="background:${e2.colour}"></span>
                <div class="wo-text">
                  <div class="ev-name">${e2.summary}</div>
                  ${e2.location ? Z`<div class="wo-loc muted">${e2.location.split(",")[0]}</div>` : J}
                </div>
              </div>`) : Z`<div class="empty muted">Nothing on.</div>`}`)}
          ${this._cal != null && groups.length === 1 && !groups[0].ev.length ? Z`<div class="empty muted">Nothing in the week after, either.</div>` : J}
        </div>
      </div>`;
  }
  // --- recipes: a static copy of Norish, synced to /local/norish ---------------
  async _loadLib() {
    if (this._lib && Date.now() - this._libAt < 10 * 60 * 1e3) return;
    try {
      const r2 = await fetch(this._u(`${this._config.recipes}/index.json?t=${Date.now()}`), { cache: "no-store" });
      if (!r2.ok) throw new Error(r2.status);
      this._lib = await r2.json();
      this._libAt = Date.now();
    } catch (e2) {
      console.warn("overlook-show: recipes", e2);
      if (!this._lib) this._lib = { error: true };
    }
  }
  _img(id) {
    return this._u(`${this._config.recipes}/img/${id}.jpg?v=${(this._lib.recipes[id] || {}).v || 0}`);
  }
  // A cast runs the dashboard from cast.home-assistant.io, so a bare "/local/..." or
  // "/api/..." path would point at Google's server. hassUrl() makes it absolute.
  _input(a2) {
    return INPUTS[a2.source] || null;
  }
  _pic(a2) {
    return this._input(a2) ? null : this._u(a2.entity_picture || TRACK_ART[a2.media_title]);
  }
  // the square beside a title: the artwork, or the input's icon on a tint, or a music note
  _art(a2, cls = "") {
    const pic = this._pic(a2), i2 = this._input(a2);
    return Z`<div class="art ${cls} ${i2 ? "input-art" : ""}" style=${pic ? `background-image:url('${pic}')` : ""}>
      ${pic ? J : Z`<ha-icon icon=${i2 && i2.icon || "mdi:music-note"}></ha-icon>`}</div>`;
  }
  _title(a2) {
    const i2 = this._input(a2);
    return i2 ? i2.title : a2.media_title;
  }
  _artist(a2) {
    const i2 = this._input(a2);
    return i2 ? i2.sub : a2.media_artist || "";
  }
  _src(a2) {
    return this._input(a2) ? "Input" : a2.app_name || a2.source;
  }
  _u(p2) {
    return p2 && p2[0] === "/" && p2[1] !== "/" && this.hass && this.hass.hassUrl ? this.hass.hassUrl(p2) : p2;
  }
  _recipeCard(id) {
    const r2 = this._lib.recipes[id];
    if (!r2) return J;
    return Z`
      <button class="rc" @click=${() => this._openRecipe(id)}>
        <span class="rc-img" style=${r2.img ? `background-image:url('${this._img(id)}')` : ""}>
          ${r2.img ? J : Z`<ha-icon icon="mdi:silverware-fork-knife"></ha-icon>`}</span>
        <span class="rc-name">${r2.n}</span>
        ${r2.t ? Z`<span class="rc-meta muted">${r2.t} min</span>` : J}
      </button>`;
  }
  _bookCard(b2) {
    const covers = b2.members.filter((id) => (this._lib.recipes[id] || {}).img).slice(0, 4);
    return Z`
      <button class="bk" @click=${() => {
      this._book = b2.id;
    }}>
        <span class="bk-cover n${covers.length}">
          ${covers.map((id) => Z`<span style="background-image:url('${this._img(id)}')"></span>`)}
        </span>
        <span class="rc-name">${b2.title}</span>
        <span class="rc-meta muted">${b2.members.length} recipes</span>
      </button>`;
  }
  _recipes() {
    this._loadLib();
    const L2 = this._lib;
    if (!L2) return Z`<div class="soon card"><div class="muted">Loading recipes…</div></div>`;
    if (L2.error) return Z`<div class="soon card"><ha-icon icon="mdi:cloud-off-outline"></ha-icon>
      <div class="muted">Recipes haven't synced to Home Assistant yet.</div></div>`;
    const book = this._book && L2.cookbooks.find((b2) => b2.id === this._book);
    return Z`
      ${this._recipe ? this._recipeSheet() : Z`
      <div class="recipes">
        ${book ? Z`
          <div class="lib-head">
            <button class="back" @click=${() => {
      this._book = null;
    }}><ha-icon icon="mdi:chevron-left"></ha-icon></button>
            <h1>${book.title}</h1><span class="muted">${book.members.length} recipes</span>
          </div>
          <div class="book-grid">${book.members.map((id) => this._recipeCard(id))}</div>` : Z`
          <div class="lib-head"><h1>Recipes</h1></div>
          <section class="shelf">
            <div class="card-title">Favourites</div>
            <div class="shelf-row">
              ${L2.favorites.length ? L2.favorites.map((id) => this._recipeCard(id)) : Z`<div class="empty muted">Heart a recipe in Norish and it shows here.</div>`}
            </div>
          </section>
          <section class="shelf">
            <div class="card-title">Recently added</div>
            <div class="shelf-row">${L2.recent.map((id) => this._recipeCard(id))}</div>
          </section>
          <section class="shelf">
            <div class="card-title">Cookbooks</div>
            <div class="shelf-row">${L2.cookbooks.map((b2) => this._bookCard(b2))}</div>
          </section>`}
      </div>`}`;
  }
  _isFav(id) {
    return !!(this._lib && this._lib.favorites && this._lib.favorites.includes(id));
  }
  // HA signs in to Norish and toggles it (shell_command.norish_favourite); the heart
  // changes at once and the index is re-read once HA is done
  async _toggleFav(id) {
    const want = !this._isFav(id);
    const before = this._lib.favorites;
    this._lib = Object.assign({}, this._lib, {
      favorites: want ? [id, ...before] : before.filter((x2) => x2 !== id)
    });
    try {
      await this._call("shell_command", "norish_favourite", { recipe: id, favourite: want ? "true" : "false" });
      this._libAt = 0;
      this._loadLib();
    } catch (e2) {
      console.warn("overlook-show: favourite", e2);
      this._lib = Object.assign({}, this._lib, { favorites: before });
    }
  }
  async _openRecipe(id) {
    this._recipe = { id, loading: true };
    try {
      const r2 = await fetch(this._u(`${this._config.recipes}/r/${id}.json?v=${(this._lib.recipes[id] || {}).v || 0}`));
      const d2 = await r2.json();
      if (this._recipe && this._recipe.id === id) this._recipe = d2;
    } catch (e2) {
      this._recipe = { id, error: true };
    }
  }
  _recipeSheet() {
    const d2 = this._recipe;
    const meta = [];
    if (d2.total || d2.prep || d2.cook) meta.push(`${d2.total || (d2.prep || 0) + (d2.cook || 0)} min`);
    if (d2.servings) meta.push(`Serves ${d2.servings}`);
    return Z`
      <div class="recipe">
        <div class="recipe-side">
          <button class="back" @click=${() => {
      this._recipe = null;
    }}><ha-icon icon="mdi:close"></ha-icon></button>
          <button class="heart ${this._isFav(d2.id) ? "on" : ""}" title="Favourite" @click=${() => this._toggleFav(d2.id)}>
            <ha-icon icon=${this._isFav(d2.id) ? "mdi:heart" : "mdi:heart-outline"}></ha-icon></button>
          <div class="recipe-photo" style=${(this._lib.recipes[d2.id] || {}).img ? `background-image:url('${this._img(d2.id)}')` : ""}></div>
          <h2>${d2.name || (this._lib.recipes[d2.id] || {}).n}</h2>
          ${meta.length ? Z`<div class="muted">${meta.join(" \xB7 ")}</div>` : J}
          ${d2.ingredients ? Z`
            <div class="card-title">Ingredients</div>
            <ul class="ings">${d2.ingredients.map((i2) => Z`<li>${i2}</li>`)}</ul>` : J}
        </div>
        <div class="recipe-main">
          ${d2.loading ? Z`<div class="muted">Loading…</div>` : d2.error ? Z`<div class="muted">Couldn't load this recipe.</div>` : Z`
            <div class="card-title">Method</div>
            <ol class="steps">${d2.steps.map((s2) => Z`<li><span>${s2}</span></li>`)}</ol>`}
        </div>
      </div>`;
  }
  // --- photos -------------------------------------------------------------
  _photos() {
    const cam = this._st(this._config.photos);
    const pic = cam && cam.attributes.entity_picture;
    const when = cam && cam.attributes.captured_at_primary;
    const d2 = when ? new Date(when) : null;
    const album = cam && cam.attributes.album_title;
    return Z`
      <div class="photo" @click=${() => {
      if (!this._config.bedside) this._go(this._config.hub ? "controls" : "kitchen");
    }}>
        ${pic ? Z`<img src=${this._u(pic)} alt="">` : J}
        <div class="photo-shade"></div>
        <div class="photo-cap">
          ${album ? Z`<div class="cap-small">${album}</div>` : J}
          ${d2 ? Z`<div class="cap-big">${d2.getDate()} ${LONG_MONTHS[d2.getMonth()]} ${d2.getFullYear()}</div>` : J}
        </div>
      </div>`;
  }
  // --- kitchen ------------------------------------------------------------
  _kitchen() {
    return Z`
      <div class="kitchen">
        <div class="col col-a">
          ${this._dateCard()}
          ${this._mediaCard()}
        </div>
        <div class="col col-b card">
          <div class="card-title">Favourites</div>
          <div class="favs" style="--n:${this._config.lights.length}">
            ${this._config.lights.map((l2) => this._pill(l2))}
            ${this._config.climate ? this._thermostat() : J}
          </div>
          ${this._config.scenes.length ? Z`
            <div class="fav-scenes" title="Scenes">${this._config.scenes.map((x2) => this._miniScene(x2))}</div>` : J}
          ${this._playlists()}
        </div>
        <div class="col col-c">
          ${this._agenda()}
          ${this._shopping()}
          ${this._sensors()}
        </div>
      </div>`;
  }
  _dateCard(weather = true) {
    const n2 = this._now;
    const w2 = weather && this._st(this._config.weather);
    const cond = w2 ? this._cond(w2) : null;
    const f2 = this._forecast;
    return Z`
      <div class="card date-card">
        <div class="date-top">${DAYS[n2.getDay()]} ${MONTHS[n2.getMonth()]}</div>
        <div class="date-num">${n2.getDate()}</div>
        ${w2 ? Z`
          <div class="wx-card">
            ${this._wxIcon(w2.state)}
            <span class="wx-temp">${this._deg(w2.attributes.temperature)}</span>
            <div class="wx-side">
              <div class="wx-cond">${cond[1]}</div>
              ${f2 && w2.state !== "unavailable" ? Z`<div class="wx-hl">H ${Math.round(f2.temperature)}°&nbsp;&nbsp;L ${Math.round(f2.templow)}°</div>` : J}
            </div>
          </div>` : J}
      </div>`;
  }
  // the speaker whose card is showing: whatever is playing, else the last one picked
  _speakers() {
    return this._config.speakers.map((s2) => {
      const ents = s2.entities.map((e2) => this._st(e2)).filter(Boolean);
      const playing = ents.find((e2) => e2.state === "playing");
      const paused = ents.find((e2) => e2.state === "paused" && e2.attributes.media_title);
      const shown = playing || paused || ents.find((e2) => e2.attributes.media_title) || ents[0];
      return Object.assign({}, s2, { shown, playing: !!playing });
    });
  }
  _activeSpeaker() {
    const all = this._speakers();
    return all.find((s2) => s2.name === this._speaker && s2.playing) || all.find((s2) => s2.playing && s2.auto !== false) || all.find((s2) => s2.name === this._speaker) || all[0];
  }
  _mediaCard() {
    const sp = this._activeSpeaker();
    if (!sp || !sp.shown) return J;
    const e2 = sp.shown, a2 = e2.attributes;
    const playing = e2.state === "playing";
    const vol = a2.volume_level != null ? a2.volume_level : null;
    const title = this._title(a2) || "Nothing playing";
    const sub = this._artist(a2) || (a2.media_title ? "" : "Pick a speaker or start something in Spotify");
    const pair = !this._config.phone;
    return Z`
      <div class="card media-card">
        <div class="card-title">Active Media</div>
        <div class="media-row">
          ${this._art(a2)}
          <div class="media-text">
            ${this._src(a2) ? Z`<div class="media-src">${this._src(a2)}</div>` : J}
            <div class="media-title">${title}</div>
            <div class="media-artist">${sub}</div>
          </div>
          ${a2.media_title ? Z`
            <button class="round play" @click=${() => this._call("media_player", "media_play_pause", { entity_id: e2.entity_id })}>
              <ha-icon icon=${playing ? "mdi:pause" : "mdi:play"}></ha-icon>
            </button>` : J}
        </div>
        <div class="where-row">
          <button class="where" @click=${() => {
      this._picker = true;
    }}>
            <ha-icon icon=${sp.icon || "mdi:speaker"}></ha-icon>
            <span>${sp.name}</span>
            <ha-icon class="chev" icon="mdi:chevron-down"></ha-icon>
          </button>
          ${vol != null ? Z`<span class="where-vol">${Math.round(vol * 100)}%</span>` : J}
        </div>
        ${vol != null ? Z`
          <div class="vol ${pair ? "vol-pair" : ""}">
            <button class="round small" @click=${() => this._call("media_player", "volume_set", { entity_id: e2.entity_id, volume_level: clamp(Math.round((vol - VOL_STEP) * 100) / 100, 0, 1) })}>
              <ha-icon icon="mdi:minus"></ha-icon></button>
            ${pair ? J : Z`<div class="vol-bar"><div style="width:${Math.round(vol * 100)}%"></div></div>`}
            <button class="round small" @click=${() => this._call("media_player", "volume_set", { entity_id: e2.entity_id, volume_level: clamp(Math.round((vol + VOL_STEP) * 100) / 100, 0, 1) })}>
              <ha-icon icon="mdi:plus"></ha-icon></button>
          </div>` : J}
      </div>`;
  }
  _speakerSheet() {
    const active = this._activeSpeaker();
    return Z`
      <div class="scrim" @click=${() => {
      this._picker = false;
    }} @touchmove=${(ev) => {
      if (ev.target === ev.currentTarget) ev.preventDefault();
    }}>
        <div class="sheet card" @click=${(ev) => ev.stopPropagation()}
             @touchstart=${(ev) => this._swStart(ev, () => {
      this._picker = false;
    })} @touchmove=${(ev) => this._swMove(ev)} @touchend=${() => this._swEnd()} @touchcancel=${() => this._swEnd(true)}>
          <div class="card-title">Play on</div>
          ${this._speakers().map((s2) => {
      const a2 = s2.shown ? s2.shown.attributes : {};
      const on = active && s2.name === active.name;
      return Z`
              <button class="sheet-row ${on ? "on" : ""}" @click=${() => this._pickSpeaker(s2, active)}>
                <ha-icon icon=${s2.icon || "mdi:speaker"}></ha-icon>
                <div class="sheet-text">
                  <div class="sheet-name">${s2.name}</div>
                  <div class="muted">${s2.playing ? `Playing ${a2.media_title || ""}` : s2.shown ? s2.shown.state.replace("_", " ") : "unavailable"}</div>
                </div>
                ${on ? Z`<ha-icon class="tick" icon="mdi:check"></ha-icon>` : J}
              </button>`;
    })}
          <div class="sheet-hint muted">Moving music works for Music Assistant playback. Spotify started from your phone stays where it is.</div>
        </div>
      </div>`;
  }
  async _pickSpeaker(target, active) {
    this._picker = false;
    this._speaker = target.name;
    try {
      localStorage.setItem(this._spKey(), target.name);
    } catch (e2) {
    }
    if (!active || active.name === target.name || !active.playing) return;
    if (!active.ma || !target.ma) return;
    const src = this._st(active.ma);
    if (!src || src.state !== "playing") return;
    try {
      await this._call(
        "music_assistant",
        "transfer_queue",
        { entity_id: target.ma, source_player: active.ma, auto_play: true }
      );
    } catch (e2) {
      console.warn("overlook-show: transfer", e2);
    }
  }
  // --- light pill: tap toggles, drag sets brightness -----------------------
  _pill(l2) {
    const e2 = this._st(l2.entity);
    if (!e2) return J;
    const on = e2.state === "on";
    const real = on ? Math.round((e2.attributes.brightness || 255) / 2.55) : 0;
    const drag = this._dragPct(l2.entity);
    this._last = this._last || {};
    if (on) this._last[l2.entity] = real;
    const pct = drag != null ? drag : real;
    const lit = drag != null ? drag > 0 : on;
    const at2 = clamp(lit ? pct : this._last[l2.entity] || 50, 22, 88);
    const rgb = e2.attributes.rgb_color;
    return Z`
      <div class="pill-wrap">
        <div class="pill-head">
          <div>
            <div class="pill-name">${l2.name || e2.attributes.friendly_name}</div>
            <div class="pill-state ${lit ? "lit" : ""}"><span class="txt">${lit ? pct >= 100 ? "On" : `On \xB7 ${pct}%` : "Off"}</span><span class="livetxt"></span></div>
          </div>
          <button class="dots" @click=${() => this._openLight(l2.entity)}>
            <ha-icon icon="mdi:dots-vertical"></ha-icon></button>
        </div>
        ${this._split(l2.entity, l2.icon, lit, pct, at2)}
        ${lit && rgb ? Z`<button class="swatch" style="background:rgb(${rgb.join(",")})"
            @click=${() => this._openLight(l2.entity)}></button>` : J}
      </div>`;
  }
  _moreInfo(entityId) {
    this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }));
  }
  // the split pill itself: drag to dim, tap = that brightness, tap the bulb = on/off
  _split(id, icon, lit, pct, at2, cls = "", style = "") {
    return Z`
      <div class="split ${lit ? "lit" : ""} ${cls} ${this._press && this._press.id === id && this._press.moved ? "dragging" : ""}"
           style="--ov-at:${at2};${style}" data-lo=${cls === "big" ? 8 : 22} data-hi=${cls === "big" ? 96 : 88}
           @pointerdown=${(ev) => this._pillDown(ev, id, pct)}
           @pointermove=${(ev) => this._pillMove(ev)}
           @pointerup=${(ev) => this._pillUp(ev)}
           @pointercancel=${() => this._pillCancel()}
           @touchmove=${(ev) => ev.preventDefault()}>
        <div class="seg seg-top"></div>
        <div class="seg seg-bot">
          <span class="seg-ico"><ha-icon icon=${icon || "mdi:lightbulb-outline"}></ha-icon></span>
        </div>
      </div>`;
  }
  // --- light sheet: HA's light dialog laid out the same way, in this look --------
  // brightness pill, power, warm/cool white, colour swatches, then the group's bulbs.
  // The corner button still opens HA's own dialog for settings, history and effects.
  _openLight(id) {
    if (!this._st(id)) return;
    fireHaptic("light");
    this._pop = null;
    this._light = id;
    this._lightAt = performance.now();
  }
  _lightSheet() {
    const id = this._light, e2 = this._st(id);
    if (!e2) return J;
    const a2 = e2.attributes, on = e2.state === "on";
    const modes = a2.supported_color_modes || [];
    const dims = modes.some((m2) => m2 !== "onoff");
    const hasCt = modes.includes("color_temp");
    const hasCol = modes.some((m2) => ["hs", "xy", "rgb", "rgbw", "rgbww"].includes(m2));
    const real = on ? Math.round((a2.brightness || 255) / 2.55) : 0;
    const drag = this._dragPct(id);
    const pct = drag != null ? drag : real;
    const lit = drag != null ? drag > 0 : on;
    this._last = this._last || {};
    if (on) this._last[id] = real;
    const at2 = clamp(lit ? pct : this._last[id] || 50, 8, 96);
    const rgb = a2.rgb_color;
    const members = Array.isArray(a2.entity_id) ? a2.entity_id.filter((m2) => this._st(m2)) : [];
    const close = () => {
      this._light = null;
    };
    const scrimClose = () => {
      if (performance.now() - (this._lightAt || 0) > 700) close();
    };
    const full = () => {
      this._light = null;
      this._moreInfo(id);
    };
    const room = !!this._lightRoom;
    const state = e2.state === "unavailable" ? "Unavailable" : lit ? dims ? `${pct}%` : "On" : "Off";
    return Z`
      <div class="scrim pop-scrim" @click=${scrimClose} @touchmove=${(ev) => {
      if (ev.target === ev.currentTarget) ev.preventDefault();
    }}>
        <div class="sheet pop lsheet ${this._config.phone || room ? "" : "two"} ${room ? "room" : ""}" @click=${(ev) => ev.stopPropagation()}
             @touchstart=${(ev) => this._swStart(ev, close)} @touchmove=${(ev) => this._swMove(ev)} @touchend=${() => this._swEnd()} @touchcancel=${() => this._swEnd(true)}>
          <div class="grabber"></div>
          <div class="pop-head">
            <span class="pop-ico ${lit ? "lit" : ""}"><ha-icon icon=${a2.icon || "mdi:lightbulb"}></ha-icon></span>
            <span class="pop-title">${this._lightName(id)}<span class="lsheet-state ${lit ? "lit" : ""}"><span class="txt">${state}</span><span class="livetxt"></span></span></span>
            ${room ? J : Z`<button class="round small" title="More settings" @click=${full}><ha-icon icon="mdi:dots-horizontal"></ha-icon></button>`}
            <button class="round small" title="Close" @click=${close}><ha-icon icon="mdi:close"></ha-icon></button>
          </div>
          <div class="pop-body lsheet-body">
            <div class="lsheet-main">
              ${dims ? this._split(id, a2.icon, lit, pct, at2, "big", rgb && lit ? `--lit-c:rgb(${rgb.join(",")})` : "") : Z`<button class="lsheet-onoff ${lit ? "lit" : ""}" @click=${() => this._call("light", "toggle", { entity_id: id })}>
                    <ha-icon icon=${a2.icon || "mdi:lightbulb"}></ha-icon></button>`}
              <button class="lsheet-power ${on ? "on" : ""}" title=${on ? "Turn off" : "Turn on"}
                      @click=${() => this._call("light", "toggle", { entity_id: id })}>
                <ha-icon icon="mdi:power"></ha-icon></button>
            </div>
            ${room ? J : Z`<div class="lsheet-side">
              ${hasCt ? this._ctBar(id, a2) : J}
              ${hasCol ? this._swatches(id, a2) : J}
              ${members.length ? Z`
                <div class="pop-sub">Lights in this group</div>
                <div class="pop-grid">${members.map((m2) => this._memberTile(m2))}</div>` : J}
            </div>`}
          </div>
        </div>
      </div>`;
  }
  _lightName(id) {
    const l2 = [...this._config.lights || [], ...(this._config.phone_rooms || []).flatMap((r2) => r2.items || [])].find((x2) => x2.entity === id && x2.name) || { name: (this._names || {})[id] };
    const e2 = this._st(id);
    return l2 && l2.name || e2 && e2.attributes.friendly_name || id;
  }
  // warm on the left, cool on the right, like HA's own slider
  _ctBar(id, a2) {
    const lo = a2.min_color_temp_kelvin || 2e3, hi = a2.max_color_temp_kelvin || 6500;
    const pend = this._ct && this._ct.id === id ? this._ct.k : null;
    const cur = pend != null ? pend : a2.color_mode === "color_temp" && a2.color_temp_kelvin || null;
    const pos = cur != null ? clamp((cur - lo) / (hi - lo) * 100, 0, 100) : null;
    const k2 = (ev, r2) => Math.round(lo + clamp((ev.clientX - r2.left) / r2.width, 0, 1) * (hi - lo));
    const down = (ev) => {
      ev.currentTarget.setPointerCapture(ev.pointerId);
      const r2 = ev.currentTarget.getBoundingClientRect();
      this._ctPress = r2;
      this._ct = { id, k: k2(ev, r2) };
    };
    const move = (ev) => {
      if (this._ctPress) this._ct = { id, k: k2(ev, this._ctPress) };
    };
    const up = () => {
      if (!this._ctPress || !this._ct) return;
      this._ctPress = null;
      const val = this._ct.k;
      this._call("light", "turn_on", { entity_id: id, color_temp_kelvin: val });
      setTimeout(() => {
        if (this._ct && this._ct.k === val) this._ct = null;
      }, 1500);
    };
    return Z`
      <div class="pop-sub">White</div>
      <div class="ctbar" @pointerdown=${down} @pointermove=${move} @pointerup=${up} @touchmove=${(ev) => ev.preventDefault()}
           @pointercancel=${() => {
      this._ctPress = null;
      this._ct = null;
    }}>
        <span class="ct-end"><ha-icon icon="mdi:weather-sunset"></ha-icon></span>
        <span class="ct-end cool"><ha-icon icon="mdi:snowflake-variant"></ha-icon></span>
        ${pos != null ? Z`<span class="ct-thumb" style="left:${pos}%"></span>` : J}
      </div>`;
  }
  _swatches(id, a2) {
    const hs2 = a2.color_mode !== "color_temp" && a2.hs_color;
    return Z`
      <div class="pop-sub">Colour</div>
      <div class="swatches">
        ${SWATCHES.map(([h2, sat, label]) => {
      const near = hs2 && hs2[1] > 40 && Math.min(Math.abs(hs2[0] - h2), 360 - Math.abs(hs2[0] - h2)) < 16;
      return Z`<button class="sw ${near ? "on" : ""}" title=${label} style="--c:hsl(${h2} ${sat}% 58%)"
            @click=${() => this._call("light", "turn_on", { entity_id: id, hs_color: [h2, sat] })}></button>`;
    })}
      </div>`;
  }
  _memberTile(m2) {
    const e2 = this._st(m2), on = e2.state === "on";
    const pct = on && e2.attributes.brightness ? Math.round(e2.attributes.brightness / 2.55) : null;
    return Z`
      <button class="ptile ${on ? "on" : ""}" @click=${() => this._call("light", "toggle", { entity_id: m2 })}>
        <span class="tile-ico"><ha-icon icon=${e2.attributes.icon || "mdi:lightbulb"}></ha-icon></span>
        <span class="tile-text"><span class="tile-name">${this._lightName(m2)}</span>
          <span class="muted">${e2.state === "unavailable" ? "Unavailable" : on ? pct != null && pct < 100 ? `On \xB7 ${pct}%` : "On" : "Off"}</span></span>
      </button>`;
  }
  // --- playlists: cover tiles, tap plays on the Active Media speaker ---------
  _playlists() {
    const e2 = this._st(this._config.playlists);
    const items = e2 && e2.attributes.items || [];
    if (!items.length) return J;
    return Z`
      <div class="card-title pl-title">Playlists</div>
      <div class="pl-row">
        ${items.map((p2) => Z`
          <button class="pl" style=${p2.image ? `background-image:url('${this._u(p2.image)}')` : ""}
                  @click=${() => this._playList(p2)}>
            <span class="pl-shade"></span>
            <span class="pl-name">${p2.name}</span>
          </button>`)}
      </div>`;
  }
  _playList(p2) {
    const sp = this._activeSpeaker();
    if (!sp || !sp.ma) return;
    this._speaker = sp.name;
    try {
      localStorage.setItem(this._spKey(), sp.name);
    } catch (e2) {
    }
    this._call(
      "music_assistant",
      "play_media",
      { entity_id: sp.ma, media_id: p2.uri, media_type: "playlist", enqueue: "replace" }
    );
  }
  _pillDown(ev, id, pct) {
    const el = ev.currentTarget;
    el.setPointerCapture(ev.pointerId);
    const box = el.closest(".pill-wrap, .lsheet");
    this._press = {
      id,
      el,
      box,
      labels: box ? [...box.querySelectorAll(".pill-state, .lsheet-state")] : [],
      y: ev.clientY,
      rect: el.getBoundingClientRect(),
      moved: false,
      start: pct,
      pct,
      lo: Number(el.dataset.lo) || 22,
      hi: Number(el.dataset.hi) || 88,
      icon: !!(ev.target.closest && ev.target.closest(".seg-ico"))
    };
  }
  // While a finger is down nothing re-renders. Once per animation frame the pill gets one
  // CSS variable (--ov-at, read by the two clip-paths) and the label's plain-text twin is
  // rewritten. Clip-path changes repaint the pill only: no layout, no Lit, so it keeps up
  // with the display (60/120 Hz) even on the Nest Hub.
  _pillMove(ev) {
    const p2 = this._press;
    if (!p2) return;
    if (!p2.moved && Math.abs(ev.clientY - p2.y) < 4) return;
    if (!p2.moved) {
      p2.moved = true;
      p2.el.classList.add("dragging");
      if (p2.box) p2.box.classList.add("live");
    }
    p2.pct = clamp(Math.round((p2.rect.bottom - ev.clientY) / p2.rect.height * 100), 0, 100);
    if (!p2.raf) p2.raf = requestAnimationFrame(() => this._paint(p2));
  }
  _paint(p2) {
    p2.raf = 0;
    p2.el.style.setProperty("--ov-at", clamp(p2.pct, p2.lo, p2.hi));
    p2.el.classList.toggle("lit", p2.pct > 0);
    const now = performance.now();
    if (now - (p2.textAt || 0) >= 50 || p2.pct === 0) {
      p2.textAt = now;
      for (const l2 of p2.labels) {
        l2.lastElementChild.textContent = p2.pct === 0 ? "Off" : l2.classList.contains("pill-state") ? `On \xB7 ${p2.pct}%` : `${p2.pct}%`;
        l2.classList.toggle("zero", p2.pct === 0);
      }
    }
  }
  _endLive(p2) {
    if (p2.raf) cancelAnimationFrame(p2.raf);
    p2.el.classList.remove("dragging");
    if (p2.box) this.updateComplete.then(() => {
      p2.box.classList.remove("live");
      for (const l2 of p2.labels) l2.classList.remove("zero");
    });
  }
  _pillCancel() {
    if (this._press) this._endLive(this._press);
    this._press = null;
    this._drag = null;
  }
  // the value to draw for a light: the finger while dragging, then what was sent until HA agrees
  _dragPct(id) {
    const p2 = this._press;
    if (p2 && p2.id === id && p2.moved) return p2.pct;
    return this._drag && this._drag.id === id && "pct" in this._drag ? this._drag.pct : null;
  }
  _pillUp() {
    const p2 = this._press;
    this._press = null;
    if (!p2) return;
    this._endLive(p2);
    if (!p2.moved && p2.icon) {
      this._call("light", "toggle", { entity_id: p2.id });
      return;
    }
    const pct = p2.moved ? p2.pct : clamp(Math.round((p2.rect.bottom - p2.y) / p2.rect.height * 100), 1, 100);
    this._drag = { id: p2.id, pct, until: Date.now() + 6e3 };
    setTimeout(() => this._settle(true), 6100);
    if (pct <= 1) this._call("light", "turn_off", { entity_id: p2.id });
    else this._call("light", "turn_on", { entity_id: p2.id, brightness_pct: pct });
  }
  // drop the held brightness once HA's state matches it (or after 6 s, whatever HA says)
  _settle(timeout = false) {
    const d2 = this._drag;
    if (!d2 || !("pct" in d2)) return;
    const e2 = this._st(d2.id);
    const real = e2 && e2.state === "on" ? Math.round((e2.attributes.brightness || 255) / 2.55) : 0;
    const done = d2.pct <= 1 ? real === 0 : Math.abs(real - d2.pct) <= 2;
    if (done || timeout && Date.now() >= d2.until) this._drag = null;
  }
  // --- heat pump: actual temperature, -/+ for the target, a button per mode ----
  _thermostat(id = this._config.climate) {
    const e2 = this._st(id);
    if (!e2) return J;
    const a2 = e2.attributes, mode = e2.state, step = a2.target_temp_step || 0.5;
    const pending = this._drag && this._drag.id === e2.entity_id ? this._drag.temp : null;
    const target = pending != null ? pending : a2.temperature;
    const label = mode === "off" ? "Off" : mode === "heat_cool" ? "Auto" : mode[0].toUpperCase() + mode.slice(1).replace("_", " ");
    const fmt = (t3) => t3 == null ? "\u2013" : `${Math.round(t3 / step) * step}\xB0`;
    const modes = [["heat", "Heat", "mdi:fire"], ["cool", "Cool", "mdi:snowflake"], ["off", "Off", "mdi:power"]].filter(([m2]) => (a2.hvac_modes || []).includes(m2));
    return Z`
      <div class="thermo">
        <div class="pill-head"><div class="pill-name">Heat pump</div></div>
        <div class="hp-now ${this._links()[id] ? "linked" : ""}" @click=${() => {
      if (this._links()[id]) this._open(id);
    }}>
          <span class="hp-temp">${a2.current_temperature != null ? `${Math.round(a2.current_temperature * 10) / 10}\xB0` : "\u2013"}</span>
          <span class="hp-mode ${mode}">${label}</span>
          ${this._links()[id] ? Z`<ha-icon class="hp-more" icon="mdi:chevron-right"></ha-icon>` : J}
        </div>
        <div class="hp-target">
          <button class="hp-step" title="Cooler" @click=${() => this._nudge(e2, -step)}>
            <ha-icon icon="mdi:minus"></ha-icon></button>
          <div class="hp-set">${fmt(target)}</div>
          <button class="hp-step" title="Warmer" @click=${() => this._nudge(e2, step)}>
            <ha-icon icon="mdi:plus"></ha-icon></button>
        </div>
        <div class="modes">
          ${modes.map(([m2, name, icon]) => Z`
            <button class="mode ${mode === m2 ? "on " + m2 : ""}"
                    @click=${() => this._call("climate", "set_hvac_mode", { entity_id: e2.entity_id, hvac_mode: m2 })}>
              <ha-icon icon=${icon}></ha-icon><span>${name}</span></button>`)}
        </div>
      </div>`;
  }
  // taps add up locally and go to HA once they stop, so three quick taps are one call
  _nudge(e2, delta) {
    const a2 = e2.attributes;
    const from = this._drag && this._drag.id === e2.entity_id ? this._drag.temp : a2.temperature;
    const temp = clamp(from + delta, a2.min_temp, a2.max_temp);
    this._drag = { id: e2.entity_id, temp };
    fireHaptic();
    clearTimeout(this._nudgeTimer);
    this._nudgeTimer = setTimeout(() => {
      this._call("climate", "set_temperature", { entity_id: e2.entity_id, temperature: temp });
      setTimeout(() => {
        if (this._drag && this._drag.id === e2.entity_id && this._drag.temp === temp) this._drag = null;
      }, 2500);
    }, 700);
  }
  // --- right column ---------------------------------------------------------
  _agenda() {
    const ev = this._events;
    const now = /* @__PURE__ */ new Date();
    const today = now.toDateString();
    const rows = (ev || []).filter((e2) => {
      return this._d(e2.end) > now;
    }).slice(0, 4);
    const fmt = (e2) => {
      const s2 = this._d(e2.start);
      const day = s2.toDateString() === today || s2 < now ? "" : `${DAYS[s2.getDay()][0]}${DAYS[s2.getDay()].slice(1).toLowerCase()} `;
      return e2.start.dateTime ? day + this._ampm(s2) : day ? day + "\xB7 All day" : "All day";
    };
    return Z`
      <div class="card agenda">
        <div class="card-title">Today</div>
        ${ev == null ? Z`<div class="empty muted">Connect Google Calendar in Home Assistant and today's events show here.</div>` : rows.length ? rows.map((e2) => Z`
            <div class="event">
              <span class="bar" style="background:${e2.colour}"></span>
              <div><div class="ev-time muted">${fmt(e2)}</div><div class="ev-name">${e2.summary}</div></div>
            </div>`) : Z`<div class="empty muted">Nothing else today.</div>`}
      </div>`;
  }
  _shopping() {
    if (!this._config.todo) return J;
    const items = this._todo || [];
    return Z`
      <div class="card shopping">
        <div class="card-title">Shopping list <span class="count">${items.length || ""}</span>
          <button class="add" title="Add an item" @click=${() => this._startAdd()}>
            <ha-icon icon="mdi:plus"></ha-icon></button></div>
        ${this._adding ? Z`
          <form class="add-row" @submit=${(ev) => this._addItem(ev)}>
            <input id="add-item" placeholder="Add an item" autocomplete="off" enterkeyhint="done"
                   @blur=${(ev) => {
      if (!ev.target.value.trim()) this._adding = false;
    }}>
            <button class="add-go" type="submit">Add</button>
          </form>` : J}
        <div class="items">
          ${items.length ? items.map((i2) => Z`
            <button class="item" @click=${() => this._call(
      "todo",
      "update_item",
      { entity_id: this._config.todo, item: i2.uid, status: "completed" }
    )}>
              <span class="box"></span><span>${i2.summary}</span>
            </button>`) : Z`<div class="empty muted">All done.</div>`}
        </div>
      </div>`;
  }
  async _startAdd() {
    this._adding = true;
    await this.updateComplete;
    const i2 = this.shadowRoot.getElementById("add-item");
    if (i2) i2.focus();
  }
  _addItem(ev) {
    ev.preventDefault();
    const input = this.shadowRoot.getElementById("add-item");
    const text = input.value.trim();
    if (!text) {
      this._adding = false;
      return;
    }
    this._call("todo", "add_item", { entity_id: this._config.todo, item: text });
    input.value = "";
    input.focus();
  }
  _sensors(s2 = this._config.sensors || []) {
    if (!s2.length) return J;
    return Z`
      <div class="sensors">
        ${s2.map((x2) => {
      const e2 = this._st(x2.entity);
      if (!e2) return J;
      const v2 = Number(e2.state);
      const shown = isNaN(v2) ? e2.state : x2.decimals != null ? v2.toFixed(x2.decimals) : Math.round(v2);
      return Z`
            <div class="sensor card">
              <ha-icon icon=${x2.icon} style="color:${x2.color || "var(--accent)"}"></ha-icon>
              <div class="s-val">${shown}<span>${x2.unit != null ? x2.unit : e2.attributes.unit_of_measurement || ""}</span></div>
              <div class="s-name muted">${x2.name}</div>
            </div>`;
    })}
      </div>`;
  }
  static styles = o`
    :host {
      --bg: linear-gradient(165deg, #f4f7fd 0%, #e4ecf9 100%);
      --card: rgba(255, 255, 255, 0.78);
      --bar: rgba(255, 255, 255, 0.55);
      --card-edge: rgba(255, 255, 255, 0.95);
      --inset: #eef3fb;
      --sheet: rgba(255, 255, 255, 0.96);
      --pop: rgba(255, 255, 255, 0.94);
      --grid-line: rgba(22, 42, 84, 0.08);
      --ink: #142038;
      --muted: #6c7891;
      --accent: #1d5cf0;
      --accent-soft: rgba(29, 92, 240, 0.12);
      --warm: #f39a43;
      --cool: #3f86f2;
      --track: #dbe5f5;
      --track-strong: #b9c6db;
      --shadow: 0 1px 2px rgba(22, 42, 84, 0.04), 0 10px 30px rgba(22, 42, 84, 0.07);
      --display: "Amazon Ember Display", "Amazon Ember", system-ui, sans-serif;
      --body: "Amazon Ember", system-ui, sans-serif;
      display: block;
    }
    @media (prefers-color-scheme: dark) {
      :host(:not([scheme="light"])) {
        --bg: linear-gradient(165deg, #0b0f18 0%, #121827 100%);
        --card: rgba(29, 35, 50, 0.82);
        --bar: rgba(29, 35, 50, 0.55);
        --card-edge: rgba(255, 255, 255, 0.05);
        --inset: rgba(255, 255, 255, 0.05);
        --sheet: rgba(29, 35, 50, 0.82);
        --pop: rgba(29, 35, 50, 0.82);
        --grid-line: rgba(255, 255, 255, 0.07);
        --ink: #eef2fb;
        --muted: #8e99b0;
        --accent: #6b9bff;
        --accent-soft: rgba(107, 155, 255, 0.16);
        --track: rgba(255, 255, 255, 0.1);
        --track-strong: rgba(255, 255, 255, 0.22);
        --shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
      }
    }
    /* option scheme: an entity that picks the look instead of the device (sun.sun: dark below the horizon) */
    :host([scheme="dark"]) {
        --bg: linear-gradient(165deg, #0b0f18 0%, #121827 100%);
        --card: rgba(29, 35, 50, 0.82);
        --bar: rgba(29, 35, 50, 0.55);
        --card-edge: rgba(255, 255, 255, 0.05);
        --inset: rgba(255, 255, 255, 0.05);
        --sheet: rgba(29, 35, 50, 0.82);
        --pop: rgba(29, 35, 50, 0.82);
        --grid-line: rgba(255, 255, 255, 0.07);
        --ink: #eef2fb;
        --muted: #8e99b0;
        --accent: #6b9bff;
        --accent-soft: rgba(107, 155, 255, 0.16);
        --track: rgba(255, 255, 255, 0.1);
        --track-strong: rgba(255, 255, 255, 0.22);
        --shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
      }
    * { box-sizing: border-box; }
    button { font: inherit; color: inherit; border: 0; background: none; padding: 0; cursor: pointer;
             -webkit-tap-highlight-color: transparent; }
    .screen {
      position: fixed; inset: 0; z-index: 10; overflow: hidden;
      background: var(--bg); color: var(--ink); font-family: var(--body);
      display: grid; grid-template-columns: 88px 1fr;
      padding-top: env(safe-area-inset-top, 0px);
      user-select: none; -webkit-user-select: none;
    }
    .screen.windowed { position: relative; inset: auto; z-index: auto; height: 100vh; height: 100dvh; }
    .restore { position: fixed; right: 16px; bottom: 16px; z-index: 10; width: 48px; height: 48px;
               border-radius: 50%; background: #1d5cf0; color: #fff; display: grid; place-items: center; }
    .muted { color: var(--muted); }
    .card {
      background: var(--card); border: 1px solid var(--card-edge); border-radius: 30px;
      box-shadow: var(--shadow); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    }
    .card-title { font-size: 17px; font-weight: 600; letter-spacing: -0.01em; color: var(--ink);
                  display: flex; align-items: center; gap: 8px; }
    .count { font-size: 13px; font-weight: 700; color: var(--accent); background: var(--accent-soft);
             border-radius: 999px; padding: 1px 8px; }
    .count:empty { display: none; }

    /* top right: weather and clock, as on the Show */
    .topright { position: absolute; top: calc(env(safe-area-inset-top, 0px) + 18px); right: 30px;
                display: flex; align-items: center; gap: 10px; z-index: 3;
                font-family: var(--body); font-weight: 500; }
    .topright .wx { --mdc-icon-size: 26px; }
    .topright .temp { font-size: 26px; }
    .topright .clock { font-size: 34px; font-weight: 500; letter-spacing: -0.01em; margin-left: 8px;
                       font-variant-numeric: tabular-nums; }
    .topright.on-photo { color: #fff; text-shadow: 0 1px 12px rgba(0, 0, 0, 0.45); }
    .topright.on-photo .clock { font-size: 62px; }
    .topright.on-photo .temp { font-size: 40px; font-weight: 600; }
    .topright.on-photo .wx { --mdc-icon-size: 38px; }
    .np-line { position: absolute; top: calc(env(safe-area-inset-top, 0px) + 112px); right: 30px; z-index: 3;
               max-width: 46%; display: flex; align-items: center; gap: 10px; padding: 8px 16px 8px 12px;
               border-radius: 999px; background: rgba(0, 0, 0, 0.32); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
               color: #fff; font-family: var(--body); text-align: left; }
    .np-line ha-icon { --mdc-icon-size: 22px; color: var(--warm); flex: none; }
    .np-line-text { display: flex; flex-direction: column; min-width: 0; line-height: 1.2; }
    .np-line-text b { font-size: 18px; font-weight: 700; }
    .np-line-text > span { font-size: 15px; font-weight: 500; opacity: 0.8; }

    /* dock */
    .dock { display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: 14px; padding: 76px 0 24px 16px; }
    .dock-pill { display: flex; flex-direction: column; gap: 6px; padding: 8px; border-radius: 28px;
                 background: var(--card); border: 1px solid var(--card-edge); box-shadow: var(--shadow); }
    .dock-btn { width: 52px; height: 52px; border-radius: 18px; display: grid; place-items: center;
                color: var(--muted); transition: background 0.2s, color 0.2s, transform 0.1s; }
    .dock-btn ha-icon { --mdc-icon-size: 26px; }
    .dock-btn.on { background: var(--accent-soft); color: var(--accent); }
    .dock-btn:active { transform: scale(0.94); }
    .photo-btn { background: var(--card); border: 1px solid var(--card-edge); box-shadow: var(--shadow);
                 border-radius: 20px; }

    .page { padding: 76px 28px 24px 18px; min-height: 0; height: 100%; }

    /* kitchen: three columns */
    .kitchen { display: grid; grid-template-columns: 0.95fr 1.45fr 1fr; gap: 18px; height: 100%; min-height: 0; }
    /* desk: no dock; four columns that each scroll on their own if they run long */
    .screen.desk-screen { grid-template-columns: 1fr; }
    .screen.desk-screen > .status { left: 20px; right: 20px; }
    .desk-screen .page { padding-left: 28px; }
    .desk { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 18px; height: 100%; min-height: 0; }
    .desk-col { display: flex; flex-direction: column; gap: 14px; min-height: 0; overflow-y: auto; scrollbar-width: none;
                margin: -10px -12px; padding: 10px 12px 24px; }
    .desk-col::-webkit-scrollbar { display: none; }
    .desk-card { padding: 18px 18px 18px; flex: none; }
    .desk-card .card-title { display: flex; align-items: center; gap: 8px; }
    .desk-ico { --mdc-icon-size: 20px; color: var(--muted); }
    .desk-title { padding: 2px 4px 0; font-family: var(--display); font-size: 20px; font-weight: 700;
                  letter-spacing: -0.01em; user-select: none; }
    .desk-sub { display: flex; align-items: center; gap: 6px; padding: 4px 4px 0; margin-bottom: -6px;
                font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); }
    .desk-sub .desk-ico { --mdc-icon-size: 16px; }
    /* lights, plugs and plants share the two middle columns */
    .desk-mid { grid-column: span 2; }
    .desk-pair { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; align-items: start; }
    .desk-pair + .desk-pair { margin-top: 6px; }
    .desk-stack { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
    .desk-card .wx-card { margin-top: 10px; padding: 0; background: none; border-radius: 0; cursor: pointer; }
    .desk-card .wx-card ha-icon, .desk-card .wx-card .wxi { --mdc-icon-size: 40px; }
    .desk-card .wx-temp { font-family: var(--display); font-size: 40px; font-weight: 700; letter-spacing: -0.02em; }
    .desk-hp { padding: 0; }
    .desk-hp .thermo { background: none; padding: 18px; }
    /* computer: the heat pump's buttons sit on the card itself, so give them the phone's light grey */
    .desk-screen .desk-hp .hp-step, .desk-screen .desk-hp .mode:not(.on) { background: var(--inset); }
    .desk-favs { display: grid; grid-template-columns: repeat(var(--n, 1), minmax(0, 1fr)); gap: 10px;
                 height: 250px; margin-top: 12px; }
    .desk .pill-wrap { min-width: 0; overflow: hidden; container-type: inline-size; }
    .desk .split { --w: min(72px, 100cqw); }
    .desk .pill-head > div { min-width: 0; }
    /* narrow pills (a laptop with the sidebar open): the dots go above the name, which
       then gets the pill's whole width and only breaks a word with a hyphen */
    .desk-favs { container: favs / inline-size; }
    @container favs (max-width: 320px) {
      .desk .pill-wrap { padding: 10px 9px 12px; }
      .desk .pill-head { position: relative; padding-top: 20px; }
      .desk .pill-head .dots { position: absolute; top: -4px; right: -5px; width: 26px; height: 26px; margin: 0; }
      .desk .pill-name { font-size: 13px; hyphens: auto; -webkit-hyphens: auto; }
    }
    .desk-scenes { flex-wrap: wrap; margin-top: 0; }
    .desk-scenes .mini-scene { flex: 0 0 calc((100% - 20px) / 3); height: 88px; }
    .col { display: flex; flex-direction: column; gap: 18px; min-height: 0; }

    .date-card { flex: 1.15; padding: 22px 22px 18px; display: flex; flex-direction: column;
                 align-items: center; min-height: 0; }
    .date-top { font-family: var(--display); font-weight: 700; font-size: 22px; letter-spacing: 0.02em;
                color: var(--accent); opacity: 0.75; margin-top: 4px; }
    .date-num { font-family: var(--display); font-weight: 800; font-size: clamp(90px, 19vh, 160px);
                line-height: 1; color: var(--accent); letter-spacing: -0.02em; margin: 2px 0 14px; flex: 1; display: flex; align-items: center; }
    .wx-card { margin-top: auto; width: 100%; background: var(--inset); border-radius: 22px;
               padding: 14px 16px; display: grid; grid-template-columns: auto auto 1fr; align-items: center; gap: 10px; }
    .wx-card ha-icon, .wx-card .wxi { --mdc-icon-size: 30px; }
    .wx-temp { font-size: 30px; font-weight: 600; }
    .wx-side { text-align: right; }
    .wx-cond { font-size: 14px; font-weight: 600; }
    .wx-hl { font-size: 13px; color: var(--muted); margin-top: 2px; white-space: nowrap; }

    .media-card { flex: 1; padding: 18px 20px; display: flex; flex-direction: column; gap: 12px; justify-content: space-between; min-height: 0; }
    .media-row { display: grid; grid-template-columns: 76px 1fr auto; gap: 12px; align-items: center; }
    .art { width: 76px; height: 76px; border-radius: 16px; background: var(--inset) center / cover;
           display: grid; place-items: center; color: var(--muted); }
    .art.input-art { background: color-mix(in srgb, var(--accent) 16%, var(--card)); color: var(--accent); }
    .art.input-art ha-icon { --mdc-icon-size: 38px; }
    .art.small.input-art ha-icon { --mdc-icon-size: 26px; }
    .media-text { min-width: 0; }
    .media-src { font-size: 11px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted); }
    .media-title { font-size: 17px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .media-artist { font-size: 14px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .round { width: 46px; height: 46px; border-radius: 50%; background: var(--accent-soft); color: var(--accent);
             display: grid; place-items: center; transition: transform 0.1s; }
    .round:active { transform: scale(0.92); }
    .round.small { width: 38px; height: 38px; background: var(--inset); color: var(--ink); }
    .round.small ha-icon { --mdc-icon-size: 20px; }
    .where { display: flex; align-items: center; justify-content: center; gap: 8px; height: 44px; border-radius: 999px;
             background: var(--accent-soft); color: var(--accent); font-weight: 600; font-size: 15px; }
    .where ha-icon { --mdc-icon-size: 20px; }
    .where-row { display: flex; gap: 6px; }
    .where-row .where { flex: 1; min-width: 0; }
    .where-row .where span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .where-vol { flex: none; min-width: 66px; height: 44px; padding: 0 14px; border-radius: 999px; display: grid; place-items: center;
                 background: var(--accent-soft); color: var(--accent); font-weight: 600; font-size: 15px; font-variant-numeric: tabular-nums; }
    .where .chev { --mdc-icon-size: 18px; opacity: 0.7; }
    .vol { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 12px; }
    .vol-bar { height: 8px; border-radius: 999px; background: var(--track); overflow: hidden; }
    .vol-bar div { height: 100%; background: var(--accent); border-radius: 999px; transition: width 0.25s; }

    /* favourites */
    .col-b { padding: 20px 22px 22px; }
    .col-b { display: flex; flex-direction: column; overflow: hidden; }
    .favs { flex: 1; display: grid; grid-template-columns: repeat(var(--n, 1), minmax(150px, 0.8fr)) 1.4fr;
            gap: 14px; min-height: 0; margin-top: 14px; }
    .fav-scenes { flex: none; display: flex; gap: 10px; margin-top: 12px; }
    .mini-scene { flex: 1 1 0; min-width: 0; height: 96px; padding: 10px 6px; border-radius: 18px; background: var(--inset);
                  display: flex; flex-direction: column; justify-content: flex-start; align-items: center; gap: 6px;
                  text-align: center; }
    .mini-scene ha-icon { flex: none; width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center;
                          background: var(--card); }
    .mini-scene.on { background: var(--accent); color: #fff; }
    .mini-scene.on ha-icon { background: rgba(255, 255, 255, 0.2); color: #fff; }
    .ms-name { font-weight: 600; font-size: 12px; line-height: 1.15; text-wrap: balance; max-width: 100%; }
    .mini-scene ha-icon { color: var(--accent); }
    .mini-scene:active { transform: scale(0.97); }
    .pill-wrap, .thermo { background: var(--inset); border-radius: 24px; padding: 14px; display: flex;
                          flex-direction: column; min-height: 0; }
    .pill-head { min-height: 40px; display: flex; justify-content: space-between; align-items: flex-start; gap: 6px; }
    .dots { width: 30px; height: 30px; margin: -4px -6px 0 0; border-radius: 50%; display: grid; place-items: center;
            color: var(--muted); }
    .dots ha-icon { --mdc-icon-size: 20px; }
    /* two full-size layers, each cut by a clip-path at --ov-at (0-100), 3px apart. Moving the split
       is a repaint of this one element: no layout. --ov-at is registered (see the bottom of the
       file) so it can transition when HA changes the light; the transition is off while dragging. */
    .split { --w: 72px; --r: calc(var(--w) / 2); flex: 1; min-height: 0; width: var(--w); margin: 12px auto 4px;
             position: relative; touch-action: none; cursor: pointer; contain: strict; will-change: transform;
             transition: --ov-at 0.18s ease-out; }
    .split.dragging { transition: none; }
    .seg { position: absolute; inset: 0; background: var(--track); transition: background 0.2s; }
    .seg-top { clip-path: inset(0 0 calc(var(--ov-at) * 1% + 1.5px) 0 round var(--r) var(--r) 6px 6px); }
    .seg-bot { clip-path: inset(calc((100 - var(--ov-at)) * 1% + 1.5px) 0 0 0 round 6px 6px var(--r) var(--r));
               display: flex; align-items: flex-end; justify-content: center; padding-bottom: 6px; color: var(--muted); }
    .livetxt, .live .txt { display: none; }
    .live .livetxt { display: inline; }
    .live .pill-state, .live .lsheet-state { color: var(--warm); }
    /* fixed height + strict containment: a changing % re-lays out the label only, not the page */
    .pill-state, .lsheet-state { height: 18px; line-height: 18px; contain: strict; white-space: nowrap; }
    .live .pill-state { font-weight: 600; }
    .live .pill-state.zero, .live .lsheet-state.zero { color: var(--muted); }
    .seg-ico { display: grid; place-items: center; width: 52px; height: 52px; border-radius: 50%; }
    .seg-bot ha-icon { --mdc-icon-size: 30px; opacity: 0.7; }
    .split.lit .seg-bot { background: var(--warm); color: #fff; }
    .split.lit .seg-bot ha-icon { opacity: 1; }
    .swatch { position: absolute; right: 14px; bottom: 14px; width: 20px; height: 20px; border-radius: 50%;
              box-shadow: 0 0 0 3px var(--card), 0 1px 4px rgba(0, 0, 0, 0.25); }
    .pill-wrap { position: relative; }
    .pl-title { margin-top: 14px; }
    .col-b .hp-target { margin-top: 18px; }
    .pl-row { flex: none; height: clamp(100px, 13.5vh, 120px); margin: 12px -22px -22px; padding: 0 22px 22px; display: flex; gap: 12px;
              overflow-x: auto; scroll-snap-type: x mandatory; scroll-padding: 0 22px; scrollbar-width: none; }
    .pl-row::-webkit-scrollbar { display: none; }
    .pl { position: relative; flex: none; height: 100%; aspect-ratio: 1; border-radius: 20px; overflow: hidden;
          background: var(--inset) center / cover; scroll-snap-align: start; text-align: left; }
    .pl:active { transform: scale(0.97); }
    .pl-shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,.55) 0%, rgba(0,0,0,0) 55%); }
    .pl-name { position: absolute; left: 12px; right: 12px; top: 10px; color: #fff; font-weight: 600; font-size: 15px;
               line-height: 1.2; text-shadow: 0 1px 6px rgba(0,0,0,.35); display: -webkit-box; -webkit-line-clamp: 2;
               -webkit-box-orient: vertical; overflow: hidden; }
    .pill-name { font-size: 15px; font-weight: 600; line-height: 1.15; }
    .pill-state { font-size: 13px; color: var(--muted); margin-top: 2px; }
    .pill-state.lit { color: var(--warm); font-weight: 600; }

    /* heat pump: rows spread down the tile, the mode buttons take what is left */
    .thermo { gap: 12px; }
    .hp-now { display: flex; align-items: baseline; gap: 10px; }
    .hp-temp { font-family: var(--display); font-weight: 700; font-size: clamp(30px, 6vh, 48px); line-height: 1;
               letter-spacing: -0.02em; }
    .hp-mode { font-size: 16px; font-weight: 600; color: var(--muted); }
    .hp-mode.heat { color: var(--warm); }
    .hp-mode.cool { color: var(--cool); }
    .hp-target { margin-top: 32px; display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 8px; }
    .hp-step { width: 60px; height: 60px; border-radius: 18px; background: var(--card); display: grid; place-items: center; }
    .hp-step:active { transform: scale(0.94); }
    .hp-step ha-icon { --mdc-icon-size: 28px; }
    .hp-set { display: flex; flex-direction: column; align-items: center; font-size: 26px; font-weight: 700; line-height: 1.1; }
    /* short buttons sat at the foot of the tile, the free space opens above them */
    .modes { flex: none; height: 64px; margin-top: auto; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .mode { border-radius: 18px; background: var(--card); display: flex; align-items: center;
            justify-content: center; gap: 6px; font-weight: 600; font-size: 14px; color: var(--ink); }
    .mode ha-icon { --mdc-icon-size: 24px; color: var(--muted); }
    .mode:active { transform: scale(0.96); }
    .mode.on.heat { background: var(--warm); color: #fff; }
    .mode.on.cool { background: var(--cool); color: #fff; }
    .mode.on.off { background: var(--ink); color: var(--card); }
    .mode.on ha-icon { color: inherit; }

    /* right column */
    .agenda, .shopping { padding: 18px 20px; display: flex; flex-direction: column; gap: 10px; min-height: 0; }
    .agenda { flex: 1; }
    .shopping { flex: 1.1; }
    .empty { font-size: 14px; line-height: 1.4; }
    .event { display: grid; grid-template-columns: 4px 1fr; gap: 10px; align-items: stretch; }
    .event .bar { border-radius: 4px; }
    .ev-time { font-size: 12px; }
    .ev-name { font-size: 15px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .add { margin-left: auto; width: 34px; height: 34px; border-radius: 50%; background: var(--accent-soft);
           color: var(--accent); display: grid; place-items: center; }
    .add ha-icon { --mdc-icon-size: 20px; }
    .add-row { display: flex; gap: 8px; }
    .add-row input { flex: 1; min-width: 0; height: 40px; border-radius: 12px; border: 1.5px solid var(--track-strong);
                     background: var(--inset); color: var(--ink); font: inherit; font-size: 16px; padding: 0 12px;
                     outline: none; user-select: text; -webkit-user-select: text; }
    .add-row input:focus { border-color: var(--accent); }
    .add-go { height: 40px; padding: 0 16px; border-radius: 12px; background: var(--accent); color: #fff; font-weight: 600; }
    .items { display: flex; flex-direction: column; gap: 2px; overflow: auto; min-height: 0; }
    .item { display: flex; align-items: center; gap: 12px; text-align: left; font-size: 16px; padding: 7px 0; }
    .box { width: 22px; height: 22px; border-radius: 7px; border: 2px solid var(--track-strong); flex: none; }
    .item:active .box { background: var(--accent); border-color: var(--accent); }
    .sensors { display: grid; grid-template-columns: repeat(auto-fit, minmax(0, 1fr)); gap: 12px; }
    .sensor { border-radius: 22px; padding: 12px 12px 10px; display: flex; flex-direction: column; gap: 2px; }
    .sensor ha-icon { --mdc-icon-size: 20px; }
    .s-val { font-size: 20px; font-weight: 700; margin-top: 4px; }
    .s-val span { font-size: 12px; font-weight: 600; color: var(--muted); margin-left: 1px; }
    .s-name { font-size: 12px; }

    /* recipes */
    .recipes { height: 100%; display: flex; flex-direction: column; gap: 14px; min-height: 0; }
    .lib-head { display: flex; align-items: center; gap: 12px; min-height: 44px; }
    .lib-head h1 { font-family: var(--display); font-weight: 700; font-size: 28px; margin: 0; letter-spacing: -0.01em; }
    .back { width: 44px; height: 44px; border-radius: 50%; background: var(--card); box-shadow: var(--shadow);
            display: grid; place-items: center; flex: none; }
    .shelf { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 8px; }
    .shelf-row { flex: 1; min-height: 0; display: flex; gap: 14px; overflow-x: auto; scrollbar-width: none;
                 margin: 0 -28px 0 -4px; padding: 2px 28px 6px 4px; scroll-snap-type: x proximity; }
    .shelf-row::-webkit-scrollbar { display: none; }
    .shelf-row .empty { align-self: center; }
    .rc, .bk { flex: none; height: 100%; aspect-ratio: 0.92; display: flex; flex-direction: column; gap: 6px;
               padding: 8px 8px 10px; border-radius: 22px; background: var(--card); border: 1px solid var(--card-edge);
               box-shadow: var(--shadow); text-align: left; scroll-snap-align: start; min-height: 0; }
    .rc:active, .bk:active { transform: scale(0.97); }
    .rc-img, .bk-cover { flex: 1; min-height: 0; border-radius: 15px; background: var(--inset) center / cover;
                         display: grid; place-items: center; color: var(--muted); overflow: hidden; }
    .bk-cover { display: grid; gap: 2px; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; place-items: stretch; }
    .bk-cover span { background: var(--inset) center / cover; }
    .bk-cover.n1 span, .bk-cover.n2 span, .bk-cover.n3 span:first-child { grid-row: span 2; }
    .bk-cover.n1 span { grid-column: span 2; }
    .rc-name { font-size: 14px; font-weight: 600; line-height: 1.2; display: -webkit-box; -webkit-line-clamp: 2;
               -webkit-box-orient: vertical; overflow: hidden; flex: none; padding: 0 2px; }
    .rc-meta { font-size: 12px; flex: none; padding: 0 2px; margin-top: -3px; }
    .book-grid { flex: 1; min-height: 0; overflow-y: auto; display: grid; gap: 14px; align-content: start;
                 grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); padding: 2px 4px 20px; }
    .book-grid { grid-auto-rows: max-content; }
    .book-grid .rc { height: auto; aspect-ratio: auto; min-height: auto; }
    .book-grid .rc-img { flex: none; aspect-ratio: 4 / 3; }
    .book-grid .rc-name { min-height: 2.4em; }

    .recipe { height: 100%; min-height: 0;
              display: grid; grid-template-columns: minmax(260px, 0.8fr) 1.2fr; gap: 18px; }
    .recipe-side, .recipe-main { background: var(--card); border: 1px solid var(--card-edge); border-radius: 30px;
                                 box-shadow: var(--shadow); padding: 18px 20px; overflow-y: auto; min-height: 0;
                                 backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px); }
    .recipe-side { position: relative; display: flex; flex-direction: column; gap: 8px; }
    .recipe-side .back { position: absolute; top: 26px; left: 28px; z-index: 1; }
    .heart { position: absolute; top: 26px; right: 28px; z-index: 1; width: 44px; height: 44px; border-radius: 50%;
             background: var(--card); box-shadow: var(--shadow); display: grid; place-items: center; color: var(--muted); }
    .heart.on { color: #e5484d; }
    .heart:active { transform: scale(0.9); }
    .recipe-photo { flex: none; aspect-ratio: 4 / 3; border-radius: 20px; background: var(--inset) center / cover; }
    .recipe h2 { font-size: 20px; line-height: 1.2; margin: 6px 0 0; }
    .recipe .card-title { margin-top: 10px; }
    .ings { margin: 0; padding: 0; list-style: none; font-size: 15px; line-height: 1.35; }
    .ings li { padding: 7px 0; border-bottom: 1px solid var(--track); }
    .steps { margin: 10px 0 0; padding: 0; list-style: none; counter-reset: s; display: flex; flex-direction: column; gap: 14px; }
    .steps li { counter-increment: s; display: grid; grid-template-columns: 34px 1fr; gap: 12px; font-size: 17px; line-height: 1.45; }
    .steps li::before { content: counter(s); width: 30px; height: 30px; border-radius: 50%; background: var(--accent-soft);
                        color: var(--accent); font-weight: 700; font-size: 14px; display: grid; place-items: center; margin-top: 1px; }

    /* placeholder pages */
    /* home: room tabs */
    .home { height: 100%; display: flex; flex-direction: column; gap: 16px; min-height: 0; }
    .tabs { display: flex; gap: 8px; flex: none; margin: -66px -8px -8px; padding: 8px; box-sizing: content-box; max-width: calc(100% - 230px); overflow-x: auto; scrollbar-width: none; }
    .tabs::-webkit-scrollbar { display: none; }
    .tab { display: flex; align-items: center; gap: 8px; height: 46px; padding: 0 18px; border-radius: 999px; flex: none;
           background: var(--card); box-shadow: var(--shadow); font-weight: 600; font-size: 15px; color: var(--muted); }
    .tab ha-icon { --mdc-icon-size: 20px; }
    .tab.on { background: var(--accent); color: #fff; }
    /* status pills: the room-tab shape; people always, alerts only while on */
    .status { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; }
    .status::-webkit-scrollbar { display: none; }
    .screen > .status { position: absolute; z-index: 2; top: calc(env(safe-area-inset-top, 0px) + 10px); left: 98px;
                        right: 250px; padding: 8px 8px 24px; pointer-events: none; }
    .screen > .status .tab { pointer-events: auto; }
    .st { color: var(--ink); }
    .st-home ha-icon { color: #3f8f63; }
    .st-away { color: var(--muted); }
    .st-away ha-icon { color: #7b63b8; }
    .st.warn { background: color-mix(in srgb, var(--warm) 18%, var(--card)); color: color-mix(in srgb, var(--warm) 75%, var(--ink)); }
    .st.bad { background: color-mix(in srgb, #e5484d 16%, var(--card)); color: color-mix(in srgb, #e5484d 80%, var(--ink)); }
    .st.cool { background: color-mix(in srgb, var(--cool) 16%, var(--card)); color: color-mix(in srgb, var(--cool) 80%, var(--ink)); }
    .st.accent { background: var(--accent-soft); color: var(--accent); }
    .st.reading small { font-size: 12px; font-weight: 500; color: var(--muted); }
    /* the Nest Hub and the tablet: people, alerts and the four readings fit beside the clock without labels */
    @media (max-width: 1400px) {
      .screen:not(.desk-screen) > .status { right: 180px; gap: 6px; }
      .screen:not(.desk-screen) > .status .tab { padding: 0 13px; gap: 6px; }
      .screen:not(.desk-screen) > .status .reading small { display: none; }
    }
    .room { flex: 1; min-height: 0; display: grid; grid-template-columns: auto minmax(340px, 1fr); grid-template-rows: 1fr auto; gap: 16px; }
    .room.has-hp { grid-template-columns: 1fr 340px; }
    .room-lights { padding: 20px 22px 22px; display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
    .room-favs.no-hp { grid-template-columns: repeat(var(--n, 1), 190px); }
    .all-btn { margin-left: auto; height: 36px; padding: 0 16px; border-radius: 999px; background: var(--inset);
               font-size: 14px; font-weight: 600; }
    .room-side { display: flex; flex-direction: column; gap: 12px; min-height: 0; overflow-y: auto; scrollbar-width: none;
                 margin: -10px -12px; padding: 10px 12px 24px; }
    .room-side::-webkit-scrollbar { display: none; }
    .player { padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; flex: none; }
    .player-row { display: grid; grid-template-columns: 52px 1fr auto; gap: 12px; align-items: center; }
    .art.small { width: 52px; height: 52px; border-radius: 12px; }
    .player-title { font-size: 16px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .tile { display: grid; grid-template-columns: 44px 1fr auto; gap: 12px; align-items: center; padding: 12px 16px;
            text-align: left; flex: none; }
    .tile-ico { width: 44px; height: 44px; border-radius: 50%; background: var(--inset); display: grid; place-items: center; color: var(--muted); }
    .tile.on .tile-ico { background: var(--warm); color: #fff; }
    .plant .tile-ico { background: rgba(63, 143, 99, 0.14); color: #3f8f63; }
    .tile-text { display: flex; flex-direction: column; min-width: 0; }
    .tile-name { font-weight: 600; font-size: 15px; }
    .tile-text .muted { font-size: 13px; }
    .tile-val { font-size: 24px; font-weight: 600; font-variant-numeric: tabular-nums; }
    .tile-val small { font-size: 14px; color: var(--muted); margin-left: 1px; }
    .room-env { flex: none; }
    .room-env .sensors { grid-template-columns: repeat(auto-fit, minmax(96px, 1fr)); }
    .scenes { grid-column: 1 / -1; display: flex; gap: 12px; overflow-x: auto; scrollbar-width: none;
              margin: -10px -12px -24px; padding: 10px 12px 24px; }
    .scenes::-webkit-scrollbar { display: none; }
    .scene { display: flex; flex-direction: column; justify-content: space-between; align-items: flex-start;
             height: 120px; min-width: 150px; padding: 16px 18px; border-radius: 24px; text-align: left;
             font-weight: 600; font-size: 16px; flex: none; }
    .scene ha-icon { width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center;
                     background: var(--accent-soft); color: var(--accent); }
    .scene.on { background: var(--accent); color: #fff; }
    .scene.on ha-icon { background: rgba(255, 255, 255, 0.2); color: #fff; }
    .scene:active, .tile:active { transform: scale(0.98); }
    .music { flex: 1; min-height: 0; display: grid; grid-template-columns: 1fr 1.5fr; gap: 16px; }
    .music .media-card { justify-content: flex-start; gap: 18px; }
    .music .media-row { grid-template-columns: 1fr; justify-items: center; text-align: center; gap: 14px; flex: 1; align-content: center; }
    .music .art { width: min(240px, 100%); height: auto; aspect-ratio: 1; border-radius: 24px; }
    .music .art ha-icon { --mdc-icon-size: 64px; }
    .music .media-title { font-size: 22px; }
    .music-pl { padding: 20px 22px 22px; display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
    .music-pl .pl-title { margin-top: 0; }
    .music-pl .pl-row { flex: 1; height: auto; margin: 12px 0 0; padding: 0; display: grid; grid-template-columns: repeat(4, 1fr);
                        grid-auto-rows: max-content; overflow-y: auto; scroll-snap-type: none; }
    .music-pl .pl { height: auto; width: 100%; }

    /* calendar */
    .calendar { display: grid; grid-template-columns: 2.7fr 1fr; gap: 18px; height: 100%; min-height: 0; }
    .month { padding: 20px 20px 16px; display: flex; flex-direction: column; min-height: 0; }
    .month-head { display: flex; align-items: center; gap: 10px; padding: 0 4px 12px; }
    .month-head h1 { font-family: var(--display); font-weight: 700; font-size: 28px; margin: 0 auto 0 0;
                     letter-spacing: -0.01em; }
    .month-head h1 .muted { font-weight: 500; }
    .nav-btn { width: 44px; height: 44px; border-radius: 50%; background: var(--inset); display: grid; place-items: center; }
    .today-btn { height: 44px; padding: 0 18px; border-radius: 999px; background: var(--accent-soft);
                 color: var(--accent); font-weight: 600; font-size: 15px; }
    .dow { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; padding: 0 0 6px; }
    .dow span { font-size: 12px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
                color: var(--muted); padding-left: 10px; }
    .mgrid { flex: 1; min-height: 0; display: grid; grid-template-columns: repeat(7, 1fr);
             grid-template-rows: repeat(var(--weeks), 1fr); gap: 6px; }
    .day { min-width: 0; min-height: 0; overflow: hidden; border-radius: 16px; background: var(--inset);
           padding: 6px 6px 6px; display: flex; flex-direction: column; align-items: stretch; gap: 3px; text-align: left; }
    .day.out { background: transparent; }
    .day.out .dnum { color: var(--muted); opacity: 0.6; }
    .day.sel { box-shadow: inset 0 0 0 2px var(--accent); }
    .dnum { width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; flex: none;
            font-size: 15px; font-weight: 600; font-variant-numeric: tabular-nums; }
    .day.today .dnum { background: var(--accent); color: #fff; }
    .chip { font-size: 12px; font-weight: 600; line-height: 1.25; padding: 2px 6px; border-radius: 6px;
            background: color-mix(in srgb, var(--c) 16%, transparent); border-left: 3px solid var(--c);
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: none; }
    .more { font-size: 11px; font-weight: 600; line-height: 16px; color: var(--muted); padding-left: 6px; flex: none; }
    /* the big screen's month: a full-width grid of lines, chips with a colour bar and the time */
    .calendar.big { display: flex; flex-direction: column; }
    .big .month { flex: 1; padding: 0; background: none; box-shadow: none; border: 0; }
    .big .month-head { gap: 8px; padding: 2px 0 16px; }
    .big .month-head h1 { font-size: 30px; margin: 0 auto 0 8px; }
    .big .month-head .mon { color: var(--accent); font-weight: 800; text-transform: uppercase; }
    .big .month-head .yr { color: var(--accent); opacity: 0.55; font-weight: 500; }
    .big .nav-btn { width: 40px; height: 40px; background: var(--card); box-shadow: var(--shadow); }
    .big .today-btn { height: 40px; background: var(--card); color: var(--ink); box-shadow: var(--shadow); font-size: 14px; }
    .big .today-btn:disabled { opacity: 0.45; box-shadow: none; }
    .big .dow { gap: 0; padding: 0 0 8px; }
    .big .dow span { text-align: center; padding: 0; font-size: 15px; font-weight: 700; color: var(--ink);
                     text-transform: none; letter-spacing: 0; }
    .big .mgrid { gap: 0; border-top: 1px solid var(--grid-line); border-left: 1px solid var(--grid-line); }
    .big .day { border-radius: 0; background: none; border-right: 1px solid var(--grid-line);
                border-bottom: 1px solid var(--grid-line); padding: 6px 6px 6px; gap: 4px; }
    .big .day.out > * { opacity: 0.4; }
    .big .day.today { box-shadow: inset 0 0 0 2px var(--accent); border-radius: 14px; }
    .big .dnum { align-self: center; width: auto; height: 22px; font-size: 14px; font-weight: 600; }
    .big .day.today .dnum { background: none; color: var(--accent); font-weight: 800; }
    .big .chip { display: flex; align-items: center; gap: 5px; border: 0; border-radius: 7px; padding: 3px 6px;
                 background: var(--card); box-shadow: 0 1px 2px rgba(22, 42, 84, 0.06); font-weight: 500; }
    .big .chip i { flex: none; width: 4px; height: 13px; border-radius: 2px; background: var(--c); }
    .big .chip b { flex: none; font-weight: 700; }
    .big .chip b:empty { display: none; }
    .big .chip span { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
    .big .more { align-self: stretch; text-align: center; padding: 2px 0; border-radius: 7px; background: var(--card); }
    .day-sheet { max-height: 80%; overflow-y: auto; }
    .day-sheet .empty { padding: 8px 0 4px; }
    .whatson { padding: 20px 20px 8px; display: flex; flex-direction: column; min-height: 0; }
    .wo-list { flex: 1; min-height: 0; overflow-y: auto; scrollbar-width: none; margin-top: 4px; padding-bottom: 12px; }
    .wo-list::-webkit-scrollbar { display: none; }
    .wo-day { font-size: 13px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase;
              color: var(--muted); margin: 14px 0 8px; }
    .wo-day.is-today { color: var(--accent); }
    .wo-ev { display: grid; grid-template-columns: 56px 4px 1fr; gap: 10px; align-items: stretch;
             padding: 8px 0; }
    .wo-time { font-size: 14px; font-weight: 600; font-variant-numeric: tabular-nums; padding-top: 1px; }
    .wo-ev .bar { border-radius: 4px; }
    .wo-text { min-width: 0; }
    .wo-text .ev-name { font-size: 16px; white-space: normal; }
    .wo-loc { font-size: 13px; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .soon { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; }
    .soon ha-icon { --mdc-icon-size: 48px; color: var(--accent); }
    .soon-title { font-family: var(--display); font-size: 28px; font-weight: 700; }

    /* speaker sheet */
    .scrim { position: absolute; inset: 0; background: rgba(8, 14, 28, 0.35); display: grid; place-items: center; z-index: 5; }
    .sheet { width: min(440px, 90vw); padding: 20px; display: flex; flex-direction: column; gap: 6px; background: var(--sheet);
             backdrop-filter: blur(30px); }
    .sheet .card-title { margin-bottom: 6px; }
    .sheet-row { display: grid; grid-template-columns: 28px 1fr auto; align-items: center; gap: 12px; text-align: left;
                 padding: 12px 14px; border-radius: 18px; }
    .sheet-row.on { background: var(--accent-soft); }
    .sheet-row .tick { color: var(--accent); }
    .sheet-name { font-weight: 600; font-size: 16px; }
    .sheet-row .muted { font-size: 13px; text-transform: none; }
    .sheet-hint { font-size: 12px; margin-top: 6px; line-height: 1.4; }

    /* photos */
    .photo { position: absolute; inset: 0; }
    .photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .photo-shade { position: absolute; inset: 0; pointer-events: none;
                   background: linear-gradient(180deg, rgba(0,0,0,.35) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 62%, rgba(0,0,0,.5) 100%); }
    .photo-cap { position: absolute; left: 40px; bottom: 36px; color: #fff; text-shadow: 0 1px 10px rgba(0,0,0,.4); }
    .cap-small { font-size: 14px; font-weight: 500; opacity: 0.85; }
    .cap-big { font-size: 20px; font-weight: 600; letter-spacing: -0.01em; margin-top: 2px; }

    /* compact: an 8-inch tablet may only be ~600px tall in CSS pixels */
    @media (max-height: 680px) {
      .screen { grid-template-columns: 76px 1fr; }
      .dock { padding: 60px 0 16px 12px; }
      .dock-btn { width: 46px; height: 46px; border-radius: 15px; }
      .dock-btn ha-icon { --mdc-icon-size: 23px; }
      .page { padding: 62px 18px 14px 12px; }
      .topright { top: calc(env(safe-area-inset-top, 0px) + 12px); right: 22px; }
      .topright .clock { font-size: 28px; }
      .topright .temp { font-size: 22px; }
      .kitchen, .col, .calendar { gap: 12px; }
      .month { padding: 14px 14px 12px; }
      .month-head { padding-bottom: 8px; }
      .month-head h1 { font-size: 22px; }
      .nav-btn, .today-btn { height: 38px; }
      .nav-btn { width: 38px; }
      .mgrid, .dow { gap: 4px; }
      .day { border-radius: 12px; padding: 4px; }
      .dnum { width: 24px; height: 24px; font-size: 13px; }
      .chip { font-size: 11px; }
      .whatson { padding: 14px 14px 6px; }
      .card { border-radius: 24px; }
      .card-title { font-size: 15px; }
      .date-card { padding: 14px 14px 12px; }
      .date-top { font-size: 17px; }
      .date-num { margin: 0 0 8px; }
      .wx-card { padding: 8px 12px; border-radius: 16px; gap: 6px; }
      .wx-card ha-icon, .wx-card .wxi { --mdc-icon-size: 24px; }
      .wx-temp { font-size: 22px; }
      .wx-cond { font-size: 12px; }
      .wx-hl { font-size: 11px; }
      .media-card { padding: 12px 14px; gap: 8px; }
      .media-row { grid-template-columns: 52px 1fr auto; gap: 10px; }
      .art { width: 52px; height: 52px; border-radius: 12px; }
      .media-title { font-size: 15px; }
      .media-artist { font-size: 13px; }
      .round { width: 40px; height: 40px; }
      .round.small { width: 32px; height: 32px; }
      .where, .where-vol { height: 36px; font-size: 14px; }
      .col-b { padding: 14px 16px 16px; }
      .favs { margin-top: 10px; gap: 10px; grid-template-columns: minmax(88px, 0.6fr) minmax(0, 1.4fr); }
      .pill-wrap, .thermo { padding: 10px 12px; border-radius: 18px; }
      .pill-head { min-height: 34px; }
      .pill-name { font-size: 14px; }
      .pill-state { font-size: 12px; }
      .split { --w: 56px; margin-top: 8px; }
      .seg-bot { padding-bottom: 4px; }
      .seg-ico { width: 44px; height: 44px; }
      .seg-bot ha-icon { --mdc-icon-size: 24px; }
      .swatch { right: 10px; bottom: 10px; width: 16px; height: 16px; }
      .thermo { gap: 5px; }
      .hp-step { width: 42px; height: 40px; border-radius: 13px; }
      .hp-set { font-size: 21px; }
      .modes { height: 42px; gap: 6px; grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .fav-scenes { margin-top: 8px; gap: 8px; }
      .mini-scene { height: 68px; padding: 7px 4px; gap: 4px; border-radius: 14px; }
      .mini-scene ha-icon { width: 28px; height: 28px; --mdc-icon-size: 18px; }
      .ms-name { font-size: 11px; }
      .hp-target { margin-top: 14px; }
      .hp-now { gap: 6px; }
      .hp-temp { font-size: 32px; }
      .mode { border-radius: 14px; font-size: 12px; gap: 3px; padding: 0 4px; min-width: 0; }
      .mode ha-icon { --mdc-icon-size: 20px; }
      .pl-title { margin-top: 12px; }
      .pl-row { height: 96px; margin: 8px -16px -16px; padding: 0 16px 16px; gap: 10px; scroll-padding: 0 16px; }
      .pl { border-radius: 16px; }
      .pl-name { font-size: 13px; left: 9px; top: 8px; }
      .agenda, .shopping { padding: 12px 14px; gap: 6px; }
      .item { font-size: 15px; padding: 5px 0; }
      .add { width: 30px; height: 30px; }
      .sensors { gap: 10px; }
      .sensor { border-radius: 18px; padding: 8px 10px; }
      .s-val { font-size: 17px; margin-top: 2px; }
      .recipe { gap: 12px; }
      .lib-head h1 { font-size: 22px; }
      .rc-name { font-size: 13px; }
    }

    /* phone: one scrolling column, a floating tab bar, every card at its natural height */
    .screen.phone { display: block; padding-top: 0; }
    .phone .page { height: 100%; overflow-y: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch;
                   padding: calc(env(safe-area-inset-top, 0px) + 14px) 16px calc(env(safe-area-inset-bottom, 0px) + 104px); }
    .phone .card { border-radius: 26px; }
    .tabbar { position: absolute; z-index: 4; left: 16px; right: 16px; bottom: calc(env(safe-area-inset-bottom, 0px) + 12px);
              display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; padding: 7px; border-radius: 28px;
              background: var(--bar); border: 1px solid var(--card-edge); box-shadow: 0 10px 40px rgba(22, 42, 84, 0.18);
              backdrop-filter: blur(22px) saturate(1.6); -webkit-backdrop-filter: blur(22px) saturate(1.6); }
    .screen.phone::after { content: ""; position: absolute; z-index: 3; left: 0; right: 0; bottom: 0; pointer-events: none;
                           height: calc(env(safe-area-inset-bottom, 0px) + 120px);
                           backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
                           -webkit-mask-image: linear-gradient(to bottom, transparent, #000 55%);
                           mask-image: linear-gradient(to bottom, transparent, #000 55%); }
    .tabbar .dock-btn { width: auto; height: 54px; display: flex; flex-direction: column; justify-content: center; gap: 2px; }
    .tabbar .dock-btn ha-icon { --mdc-icon-size: 24px; }
    .tabbar .dock-btn span { font-size: 11px; font-weight: 600; }

    /* phone home: ha-phone's order */
    .ph { display: flex; flex-direction: column; gap: 18px; }
    .ph section { display: flex; flex-direction: column; gap: 10px; }
    .ph-sec { display: flex; align-items: center; gap: 9px; padding: 0 4px; min-height: 40px; font-size: 17px; font-weight: 700;
              letter-spacing: -0.01em; }
    .ph-sec ha-icon { --mdc-icon-size: 20px; color: var(--muted); }
    .ph-group { margin-left: auto; width: 40px; height: 40px; border-radius: 50%; background: var(--card);
                box-shadow: var(--shadow); display: grid; place-items: center; color: var(--muted); }
    .ph-group ha-icon { --mdc-icon-size: 20px; color: inherit; }
    .ph-group.on { background: var(--warm); color: #fff; }
    /* players take two rows with the small tiles stacked beside them, as on ha-phone */
    .ph-grid { display: grid; grid-template-columns: 1fr 1fr; grid-auto-rows: minmax(62px, auto); grid-auto-flow: dense; gap: 10px; }
    .ph-grid .player { grid-row: span 2; justify-content: space-between; }
    .ph-grid .plant .tile-text .muted { display: none; }
    .ph-grid .player, .ph-grid .tile { min-width: 0; }
    .ph-grid .tile { grid-template-columns: 38px 1fr auto; gap: 10px; padding: 10px 12px; border-radius: 20px; min-height: 62px; }
    .ph-grid .tile-ico { width: 38px; height: 38px; }
    .ph-grid .tile-ico ha-icon { --mdc-icon-size: 20px; }
    .ph-grid .tile-name { font-size: 14px; line-height: 1.2; display: -webkit-box; -webkit-line-clamp: 2;
                          -webkit-box-orient: vertical; overflow: hidden; }
    .ph-grid .tile-text .muted { font-size: 12px; }
    .ph-grid .tile-val { font-size: 18px; }
    .tile-ico.tap { cursor: pointer; transition: transform 0.12s; }
    .tile-ico.tap:active { transform: scale(0.9); }
    .light-tile.on { background: color-mix(in srgb, var(--warm) 14%, var(--card)); }
    .ph-grid .player { padding: 12px; gap: 10px; border-radius: 20px; }
    .ph-grid .player-row { grid-template-columns: 40px 1fr; gap: 10px; }
    .ph-grid .player-row .round.play { position: absolute; width: 0; height: 0; overflow: hidden; }
    .ph-grid .art.small { width: 40px; height: 40px; border-radius: 10px; }
    .ph-grid .player-title { font-size: 14px; }
    .ph-grid .media-artist { font-size: 12px; }
    .ph-grid .vol { gap: 6px; }
    .ph-grid .player .round.small { border-radius: 13px; }
    .ph-grid .transport { display: flex; justify-content: center; }
    .ph-grid .transport.power-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
    .ph-grid .power-pair .round.small { width: 100%; }
    .ph-grid .player { position: relative; }
    .ph-vol { position: absolute; top: 12px; right: 12px; font-size: 13px; font-weight: 700;
              font-variant-numeric: tabular-nums; color: var(--muted); }
    .ph-grid .has-vol .media-text { padding-right: 34px; }
    .ph-grid .has-art .ph-vol { color: rgba(255, 255, 255, 0.85); }
    .ph-grid .player.has-art { color: #fff; position: relative; isolation: isolate; overflow: hidden; background: #171b27; }
    .ph-grid .player.has-art::before { content: ""; position: absolute; inset: 0; z-index: -1;
      background: linear-gradient(rgba(14, 18, 30, 0.55), rgba(14, 18, 30, 0.72)), var(--art) center / cover;
      filter: saturate(0.5); }
    .ph-grid .has-art .media-src, .ph-grid .has-art .media-artist { color: rgba(255, 255, 255, 0.82); }
    .ph-grid .has-art .art.small { background: rgba(255, 255, 255, 0.2); color: #fff; }
    .ph-grid .has-art .round.small { background: rgba(255, 255, 255, 0.22); color: #fff; }
    .ph-grid .has-art .vol-bar { background: rgba(255, 255, 255, 0.28); }
    .ph-grid .has-art .vol-bar div { background: #fff; }
    .ph-hp { grid-column: 1 / -1; padding: 14px; border-radius: 22px; }
    .ph-hp .thermo { background: none; padding: 0; display: grid; gap: 12px 10px; grid-template-columns: 1fr auto;
                     grid-template-areas: "now target" "modes modes"; }
    .ph-hp .pill-head { display: none; }
    .ph-hp .hp-now { grid-area: now; align-self: center; }
    .ph-hp .hp-temp { font-size: 30px; }
    .ph-hp .hp-mode { font-size: 14px; }
    .ph-hp .hp-target { grid-area: target; margin: 0; }
    .ph-hp .hp-step { width: 42px; height: 42px; border-radius: 14px; background: var(--inset); }
    .ph-hp .hp-set { font-size: 20px; min-width: 52px; }
    .ph-hp .modes { grid-area: modes; height: 46px; margin: 0; gap: 8px; }
    .ph-hp .mode { background: var(--inset); border-radius: 14px; font-size: 13px; }
    .ph-hp .mode ha-icon { --mdc-icon-size: 19px; }
    .phone .fav-scenes { margin: -10px -16px -18px; padding: 10px 16px 22px; overflow-x: auto; scrollbar-width: none;
                         scroll-snap-type: x proximity; scroll-padding: 0 16px; }
    .phone .fav-scenes::-webkit-scrollbar { display: none; }
    .phone .mini-scene { flex: none; width: 84px; height: 84px; padding: 9px 4px; scroll-snap-align: start;
                         background: var(--card); box-shadow: var(--shadow); }
    .phone .mini-scene ha-icon { background: var(--accent-soft); }
    .phone .mini-scene.on { background: var(--accent); }
    .phone .mini-scene.on ha-icon { background: rgba(255, 255, 255, 0.2); }
    .phone .status { margin: -10px -16px -22px; padding: 10px 16px 24px; }
    .phone .tab { height: 40px; padding: 0 14px; font-size: 14px; gap: 6px; }

    /* phone calendar: dots in the grid, the list underneath does the talking */
    .phone .calendar { display: flex; flex-direction: column; gap: 14px; height: auto; }
    .phone .month { padding: 16px 12px 12px; }
    .phone .month-head { padding: 0 4px 10px; gap: 8px; }
    .phone .month-head h1 { font-size: 22px; }
    .phone .nav-btn { width: 40px; height: 40px; }
    .phone .today-btn { height: 40px; padding: 0 14px; font-size: 14px; }
    .phone .dow, .phone .mgrid { gap: 4px; }
    .phone .dow span { padding: 0; text-align: center; font-size: 11px; letter-spacing: 0.02em; }
    .phone .mgrid { flex: none; grid-template-rows: repeat(var(--weeks), 50px); }
    .phone .day { border-radius: 12px; padding: 4px 2px; align-items: center; gap: 4px; }
    .phone .dnum { width: 26px; height: 26px; font-size: 14px; }
    .ev-dots { display: flex; gap: 3px; }
    .ev-dots i { width: 6px; height: 6px; border-radius: 50%; }
    .phone .whatson { padding: 18px 18px 6px; }
    .phone .wo-list { overflow: visible; }

    /* phone recipes */
    .phone .recipes { height: auto; gap: 16px; }
    .phone .lib-head h1 { font-size: 24px; }
    .phone .shelf { flex: none; }
    .phone .shelf-row { flex: none; height: 200px; margin: 0 -16px; padding: 2px 16px 8px; scroll-padding: 0 16px; }
    .phone .book-grid { overflow: visible; grid-template-columns: repeat(2, 1fr); gap: 12px; padding: 2px 0 0; }
    .phone .recipe { display: flex; flex-direction: column; gap: 14px; height: auto; }
    .phone .recipe-side, .phone .recipe-main { overflow: visible; border-radius: 26px; padding: 14px 16px 18px; }
    .phone .recipe-side .back { top: 22px; left: 24px; }
    .phone .heart { top: 22px; right: 24px; }
    .phone .steps li { font-size: 16px; }

    /* phone speaker picker: a sheet from the bottom */
    .phone .scrim { position: fixed; place-items: end stretch; padding: 0 10px calc(env(safe-area-inset-bottom, 0px) + 10px); }
    .phone .sheet { width: 100%; border-radius: 28px; }
    /* pop-up sheets */
    .pop-scrim { position: fixed; z-index: 6; display: flex; align-items: flex-end; justify-content: center;
                 padding: 0 8px calc(env(safe-area-inset-bottom, 0px) + 8px); }
    .pop { width: min(560px, 100%); max-height: 86vh; display: flex; flex-direction: column; gap: 0; padding: 8px 16px 16px;
           border-radius: 30px; background: var(--pop); backdrop-filter: blur(30px) saturate(1.4);
           -webkit-backdrop-filter: blur(30px) saturate(1.4); animation: pop-up 0.22s ease-out; }
    @keyframes pop-up { from { transform: translateY(40px); opacity: 0; } to { transform: none; opacity: 1; } }
    /* bedside night clock: fixed dark red on black in either theme, dim enough for a dark room */
    /* now playing: the speaker's music over the whole screen, same dark ground as the timer */
    .np { --np-hot: var(--warm); --np-on: #1d1206; z-index: 800; background: linear-gradient(165deg, #0b0f18 0%, #121827 100%); color: #f4f6fb;
          display: grid; grid-template-columns: auto minmax(0, 1fr); grid-template-rows: minmax(0, 1fr);
          align-items: center; gap: 4vw; padding: 6vh 5vw; overflow: hidden; }
    .np-blur { position: absolute; inset: -15%; background: center / cover; filter: blur(60px) saturate(1.4) brightness(0.5); opacity: 0.45; }
    .np-art { position: relative; height: 84vh; aspect-ratio: 1; max-width: 44vw; border-radius: 5vh;
              background: rgba(255, 255, 255, 0.08) center / cover; box-shadow: 0 2vh 6vh rgba(0, 0, 0, 0.45);
              display: grid; place-items: center; }
    .np-art ha-icon { --mdc-icon-size: 20vh; color: #8e99b0; }
    .np-side { position: relative; height: 84vh; min-width: 0; display: flex; flex-direction: column; }
    .np-head { display: flex; justify-content: space-between; align-items: center; gap: 2vw; }
    .np-src { display: flex; align-items: center; gap: 1.2vw; font-family: var(--display); font-weight: 700;
              font-size: 5vh; color: var(--np-hot); white-space: nowrap; overflow: hidden; transition: color 0.6s; }
    .np-src ha-icon { --mdc-icon-size: 6vh; flex: none; }
    .np-title { margin-top: auto; font-family: var(--display); font-weight: 700; font-size: 11vh; line-height: 1.2; }
    .np-artist { margin-top: 1.5vh; font-family: var(--body); font-weight: 600; font-size: 7.5vh; color: #b4bdd0; }
    .np-track { margin-top: 3.5vh; height: 1.6vh; min-height: 6px; border-radius: 999px; background: rgba(255, 255, 255, 0.14); overflow: hidden; flex: none; }
    .np-track div { height: 100%; border-radius: 999px; background: var(--np-hot); transition: width 1s linear, background 0.6s; }
    .np-times { display: flex; justify-content: space-between; margin-top: 1.4vh; font-family: var(--body); font-weight: 600;
                font-size: 5.5vh; color: #8e99b0; font-variant-numeric: tabular-nums; }
    /* the timer's squircle buttons: three across, play/pause in the warm accent */
    .np-ctl { margin-top: auto; flex: none; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 2vw; }
    .np-btn { height: 22vh; border-radius: 7vh; background: rgba(255, 255, 255, 0.1); color: #f4f6fb;
              display: grid; place-items: center; transition: transform 0.12s; }
    .np-btn ha-icon { --mdc-icon-size: 11vh; }
    .np-btn.main { background: var(--np-hot); color: var(--np-on); transition: transform 0.12s, background 0.6s; }
    .np-btn.x { width: 11vh; height: 11vh; border-radius: 50%; }
    .np-btn.x ha-icon { --mdc-icon-size: 6.5vh; }
    .np-btn:active { transform: scale(0.97); }
    /* text that doesn't fit scrolls to its end and back (_marquee sets --dx and --t) */
    .mq { display: block; white-space: nowrap; overflow: hidden; min-width: 0; }
    .mq > span { display: inline-block; width: max-content; }
    .mq.run > span { animation: mq var(--t, 8s) ease-in-out infinite alternate; }
    @keyframes mq { 0%, 18% { transform: translateX(0); } 82%, 100% { transform: translateX(var(--dx)); } }
    /* voice clock: timer and alarm screens, always dark like the night clock (StandBy-style) */
    .ck { --ck-bg: linear-gradient(165deg, #0b0f18 0%, #121827 100%); --ck-ink: #f4f6fb; --ck-dim: #8e99b0;
          --ck-hot: var(--warm); --ck-on-hot: #1d1206; --ck-btn: rgba(255, 255, 255, 0.1);
          z-index: 900; background: var(--ck-bg); color: var(--ck-ink); grid-template-columns: minmax(0, 1fr);
          grid-template-rows: 1fr auto auto; padding: 6vh 5.5vw 6vh; gap: 4.5vh; }
    .ck-night { --ck-bg: #000; --ck-ink: #a8231b; --ck-dim: #6e1812; --ck-hot: #a8231b; --ck-on-hot: #000; --ck-btn: #160403; }
    .ck-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 3vw; min-height: 0; min-width: 0; }
    .ck-label { display: flex; align-items: center; gap: 1.4vw; font-family: var(--display); font-weight: 700;
                font-size: 7.5vh; color: var(--ck-hot); white-space: nowrap; padding-top: 2vh; }
    .ck-label ha-icon { --mdc-icon-size: 8.5vh; }
    .ck-of { font-family: var(--body); font-weight: 600; font-size: 5vh; color: var(--ck-dim); margin-left: 0.6vw; }
    .ck-digits { font-family: var(--display); font-weight: 800; font-size: min(44vh, 21vw); line-height: 0.86;
                 letter-spacing: -0.03em; font-variant-numeric: tabular-nums; text-align: right; cursor: pointer; }
    .ck-digits.paused { opacity: 0.45; }
    .ck-digits.ring { animation: ck-blink 1s steps(1) infinite; }
    @keyframes ck-blink { 50% { opacity: 0.35; } }
    .ck-colon { opacity: 0.5; margin: 0 0.02em; position: relative; top: -0.05em; }
    .ck-ampm { font-size: 0.24em; font-weight: 700; margin-left: 0.12em; color: var(--ck-dim); letter-spacing: 0; }
    .ck-track { height: 1.6vh; min-height: 6px; border-radius: 999px; background: var(--ck-btn); overflow: hidden; }
    .ck-track div { height: 100%; border-radius: 999px; background: var(--ck-hot); transition: width 1s linear; }
    .ck-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 2.4vw; }
    .ck-btn { height: 24vh; border-radius: 7vh; background: var(--ck-btn); color: var(--ck-ink); display: flex;
              align-items: center; justify-content: center; gap: 1.6vw; font-family: var(--display); font-weight: 700;
              font-size: 7.5vh; transition: transform 0.12s; }
    .ck-btn ha-icon { --mdc-icon-size: 8.5vh; }
    .ck-btn.main { background: var(--ck-hot); color: var(--ck-on-hot); }
    .ck-btn:active { transform: scale(0.97); }
    .ck-when { display: flex; align-items: baseline; gap: 2vw; font-family: var(--display); font-weight: 700;
               font-size: 9vh; grid-row: 3; }
    .ck-when span { font-family: var(--body); font-weight: 600; font-size: 6vh; color: var(--ck-dim); }
    .va-glow { position: fixed; inset: 0; z-index: 1000; pointer-events: none; border-radius: 0;
               box-shadow: inset 0 0 0 6px rgba(110, 190, 255, 1), inset 0 0 26px 14px rgba(30, 140, 255, 0.95),
                           inset 0 0 80px 34px rgba(30, 140, 255, 0.5);
               animation: va-in 0.25s ease-out, va-pulse 1.6s ease-in-out 0.25s infinite; }
    .va-glow.processing { animation: va-in 0.25s ease-out, va-pulse 0.7s ease-in-out infinite; }
    .va-glow.responding { opacity: 0.7; animation: va-pulse-soft 2.4s ease-in-out infinite; }
    @keyframes va-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes va-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
    @keyframes va-pulse-soft { 0%, 100% { opacity: 0.75; } 50% { opacity: 0.45; } }
    .wx-screen { grid-template-columns: 1fr; place-items: center; padding: 4vh 5vw; cursor: pointer; }
    .wx-none { font-family: var(--display); font-size: 6vh; color: var(--muted); }
    .wx-day { display: grid; grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr); gap: 5vw; align-items: center; width: 100%; }
    .wx-main { display: grid; justify-items: center; gap: 1vh; text-align: center; }
    .wx-label { font-family: var(--display); font-weight: 700; font-size: 6.5vh; }
    .wx-big { --mdc-icon-size: 27vh; width: 27vh; height: 27vh; }
    /* the artwork fills less of its box than an mdi glyph, so it draws a little larger */
    img.wxi { width: calc(var(--mdc-icon-size, 24px) * 1.2); height: calc(var(--mdc-icon-size, 24px) * 1.2);
              margin: calc(var(--mdc-icon-size, 24px) * -0.1); flex: none; display: block; object-fit: contain;
              -webkit-user-drag: none; user-select: none; pointer-events: none; }
    .wx-name { font-weight: 600; font-size: 6vh; color: var(--ink); opacity: 0.8; }
    .wx-side { display: grid; gap: 3vh; }
    .wx-temps { display: flex; align-items: baseline; gap: 2vw; font-family: var(--display); }
    .wx-hi { font-weight: 800; font-size: 17vh; line-height: 0.9; }
    .wx-lo { font-weight: 600; font-size: 9vh; color: var(--ink); opacity: 0.7; }
    .wx-facts { display: grid; grid-template-columns: auto auto; justify-content: start; gap: 1.4vh 3vw;
                font-weight: 600; font-size: 5vh; }
    .wx-facts span { display: inline-flex; align-items: center; gap: 0.8vw; white-space: nowrap; }
    .wx-facts ha-icon { --mdc-icon-size: 5.4vh; color: var(--ink); opacity: 0.75; }
    .wx-hours { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); gap: 1vw;
                background: var(--card); border-radius: 3vh; padding: 2vh 1vw; }
    .wx-hour { display: grid; justify-items: center; gap: 0.6vh; font-size: 4.6vh; font-weight: 600; color: var(--ink); }
    .wx-hour > span { opacity: 0.75; }
    .wx-hour ha-icon, .wx-hour .wxi { --mdc-icon-size: 6.5vh; }
    .wx-hour b { font-size: 5.4vh; }
    .wx-pct { font-style: normal; font-weight: 700; font-size: 4.4vh; color: var(--cool); }
    .wx-week { display: grid; gap: 1.4vw; width: 100%; }
    .wx-col { display: grid; justify-items: center; gap: 1.2vh; background: var(--card); border-radius: 3vh;
              padding: 3.5vh 0.6vw; text-align: center; min-width: 0; }
    .wx-dow { font-family: var(--display); font-weight: 700; font-size: 5.4vh; }
    .wx-col ha-icon { --mdc-icon-size: 12vh; width: 12vh; height: 12vh; }
    .wx-col .wxi { --mdc-icon-size: 12vh; }
    .wx-cname { font-size: 4.2vh; font-weight: 600; line-height: 1.1; color: var(--ink); opacity: 0.8; min-height: 2.2em;
                display: flex; align-items: center; }
    .wx-chi { font-family: var(--display); font-weight: 800; font-size: 8.5vh; line-height: 1; }
    .wx-clo { font-family: var(--display); font-weight: 600; font-size: 6vh; color: var(--ink); opacity: 0.7; }
    .wx-crain { font-weight: 700; font-size: 4.6vh; color: var(--cool); }
    .wx-night { background: #000; color: #a8231b; --muted: #8a1d16; --ink: #a8231b; --card: #0d0303; --cool: #a8231b; }
    .wx-night ha-icon { color: #a8231b !important; }
    .night { background: #000; color: #a8231b; grid-template-columns: 1fr; place-items: center; cursor: pointer; }
    .night-face { display: flex; flex-direction: column; align-items: center; gap: 2vh; transition: transform 1s ease; }
    .night-time { font-family: var(--display); font-weight: 800; font-size: min(54vh, 26vw); line-height: 0.9;
                  letter-spacing: -0.03em; font-variant-numeric: tabular-nums; opacity: 0.8; }
    .night-colon { opacity: 0.45; margin: 0 0.02em; position: relative; top: -0.06em; }
    .night-date { font-family: var(--body); font-weight: 600; font-size: min(5.5vh, 26px); letter-spacing: 0.14em;
                  text-transform: uppercase; opacity: 0.5; }
    /* bedside (Echo Show 5, 960x480): the kitchen's dock on the left; photos are home, with the dock over them */
    .bedside .dock { position: relative; padding: 12px 0 12px 12px; gap: 10px; z-index: 1; }
    .bedside .dock-pill { gap: 4px; padding: 6px; border-radius: 24px; }
    .bedside .dock-btn { width: min(58px, 14.5vh); height: min(58px, 14.5vh); border-radius: 18px; }
    .bedside .dock-btn ha-icon { --mdc-icon-size: 30px; }
    .bedside .page { padding: 14px; min-width: 0; }
    .on-photo .dock-pill, .on-photo .photo-btn { background: rgba(14, 18, 28, 0.5); border-color: rgba(255, 255, 255, 0.08);
                                                 backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
    .on-photo .dock-btn { color: rgba(255, 255, 255, 0.78); }
    .on-photo .dock-btn.on { background: rgba(255, 255, 255, 0.18); color: #fff; }
    /* photos keep the dock over them on every screen; the caption sits bottom right */
    .on-photo .dock { position: relative; z-index: 1; }
    .on-photo .photo-cap { left: auto; right: 40px; text-align: right; }
    .bedside .photo-cap { left: auto; right: 22px; bottom: 20px; text-align: right; }
    .bedside .cap-big { font-size: 17px; }
    .bedside .topright { right: 22px; }
    /* the Hub is read from across the kitchen: clock and weather bigger again over photos */
    .hub .topright.on-photo { gap: 14px; }
    .hub .topright.on-photo .clock { font-size: 108px; font-weight: 600; letter-spacing: -0.02em; }
    .hub .topright.on-photo .temp { font-size: 54px; }
    .hub .topright.on-photo .wx { --mdc-icon-size: 52px; }
    .hub .np-line { top: calc(env(safe-area-inset-top, 0px) + 150px); }
    .hub .topright .clock { font-size: 40px; font-weight: 600; }
    .bedside .topright.on-photo .clock { font-size: 76px; }
    .bedside .topright.on-photo .temp { font-size: 42px; }
    .bedside .topright.on-photo .wx { --mdc-icon-size: 40px; }
    .bed-card { padding: 16px 18px; min-height: 0; }
    .bed-card .card-title { display: flex; align-items: center; gap: 8px; }
    .bed-two { height: 100%; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; min-height: 0; }
    .bedside .media-card, .hub .media-card { flex: none; height: 100%; }
    /* the bedside and Hub media card: no bar, just - and + sharing the row as squircles,
       and a bigger speaker pill and % so they read from across the room */
    .vol.vol-pair { grid-template-columns: 1fr 1fr; gap: 12px; }
    .screen:not(.phone) .where-row .where { height: 52px; font-size: 18px; gap: 10px; }
    .screen:not(.phone) .where-row .where ha-icon { --mdc-icon-size: 24px; }
    .screen:not(.phone) .where-row .where .chev { --mdc-icon-size: 22px; }
    .screen:not(.phone) .where-vol { height: 52px; min-width: 84px; font-size: 19px; }
    .screen:not(.phone) .where-row { gap: 8px; }
    /* speaker tiles on the big screens: - [ % ] + */
    .vol.vol-pair.vol-pct { grid-template-columns: 1fr auto 1fr; gap: 8px; }
    .player .vol-pair .round.small { height: 46px; border-radius: 15px; }
    .player .vol-pair .round.small ha-icon { --mdc-icon-size: 24px; }
    .screen:not(.phone) .player .vol-pct .where-vol { height: 46px; min-width: 76px; font-size: 18px; }
    .vol-pair .round.small { width: 100%; height: 56px; border-radius: 18px; }
    .vol-pair .round.small ha-icon { --mdc-icon-size: 28px; }
    .hub-controls { grid-template-rows: 1fr 1fr; }
    .hub-players { display: flex; flex-direction: column; gap: 14px; min-height: 0; overflow-y: auto; }
    .hub-hp { display: flex; flex-direction: column; min-height: 0; }
    /* the Hub's dock: bigger targets than the tablet's compact one */
    .screen.hub { grid-template-columns: 94px 1fr; }
    .hub .dock-pill { gap: 6px; padding: 7px; border-radius: 26px; }
    .hub .dock-btn { width: 62px; height: 62px; border-radius: 20px; }
    .hub .dock-btn ha-icon { --mdc-icon-size: 30px; }
    /* the 2x2 tiles stay square (two rows of the page's height); the wide cards take what's left */
    .hub .hub-sq-left { grid-template-columns: calc(100vh - 76px) minmax(0, 1fr); }
    .hub .hub-sq-right { grid-template-columns: minmax(0, 1fr) calc(100vh - 76px); }
    .hub-stack { display: grid; grid-template-rows: minmax(0, 1fr) minmax(0, 1fr); gap: 14px; min-height: 0; }
    .hub-stack > .card { min-height: 0; overflow: hidden; }
    .hub-out { display: flex; flex-direction: column; justify-content: space-between; padding: 18px 20px; text-align: left; color: var(--ink); }
    .hub-out-row { display: flex; align-items: center; gap: 16px; }
    .hub-out-row ha-icon, .hub-out-row .wxi { --mdc-icon-size: 52px; }
    .hub-out-temp { font-family: var(--display); font-weight: 700; font-size: 58px; line-height: 1; letter-spacing: -0.02em; }
    .hub .hub-out .wx-side { margin-left: auto; }
    .hub .hub-out .wx-cond { font-size: 19px; white-space: nowrap; }
    .hub .hub-out .wx-hl { font-size: 17px; }
    .hub-hp .thermo { flex: 1; padding: 16px 18px; gap: 0; }
    .hub .hub-hp .hp-temp { font-size: 52px; }
    .hub .hub-hp .hp-mode { font-size: 17px; }
    .hub .hub-hp .hp-target { margin-top: auto; }
    .hub .hub-hp .hp-step { width: 64px; height: 52px; border-radius: 16px; }
    .hub .hub-hp .hp-set { font-size: 30px; }
    .hub .hub-hp .modes { height: 52px; gap: 10px; margin-top: 10px; }
    .hub .hub-hp .mode { font-size: 16px; border-radius: 18px; }
    .hub .hub-hp .mode ha-icon { --mdc-icon-size: 24px; }
    .scenes-sheet { width: min(560px, 90vw); }
    .hub-scenes { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
    .bed-pl { display: flex; flex-direction: column; overflow: hidden; }
    .bed-pl .pl-title { margin: 0; }
    .bed-pl .pl-row { flex: 1; height: auto; margin: 10px 0 0; padding: 0; display: grid; grid-template-columns: repeat(3, 1fr);
                      grid-auto-rows: min-content; gap: 10px; overflow-y: auto; }
    .bed-pl .pl { width: 100%; height: auto; border-radius: 16px; }
    .bed-air { height: 100%; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 14px; }
    .bed-controls { height: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .air-tile.control-tile { grid-template-columns: auto; background: var(--card); border-color: var(--card-edge); }
    .air-tile.control-tile.on { background: color-mix(in srgb, var(--c) 14%, var(--card)); border-color: transparent; }
    .air-tile.control-tile .air-ico { width: 76px; height: 76px; background: var(--inset); color: var(--muted); }
    .control-tile .air-ico ha-icon { --mdc-icon-size: 36px; }
    .air-tile.control-tile.on .air-ico { background: color-mix(in srgb, var(--c) 22%, transparent); color: var(--c); }
    .control-tile .air-q { color: var(--muted); }
    .control-tile.on .air-q { color: var(--c); }
    .air-tile { min-width: 0; min-height: 0; padding: 16px 18px; display: grid; grid-template-columns: auto 1fr;
                grid-template-rows: 1fr auto; text-align: left; color: var(--ink);
                background: color-mix(in srgb, var(--c) 14%, var(--card)); border-color: transparent; }
    .air-ico { width: 46px; height: 46px; border-radius: 50%; display: grid; place-items: center;
               background: color-mix(in srgb, var(--c) 22%, transparent); color: var(--c); }
    .air-ico ha-icon { --mdc-icon-size: 22px; }
    .air-val { justify-self: end; font-family: var(--display); font-weight: 700; font-size: min(58px, 12vh); line-height: 1;
               letter-spacing: -0.03em; }
    .air-val small { font-family: var(--body); font-size: 16px; font-weight: 600; color: var(--muted); margin-left: 2px; }
    .air-name { grid-column: 1 / -1; align-self: end; display: flex; flex-direction: column; gap: 2px; font-size: 20px; font-weight: 600; }
    .air-q { font-size: 18px; font-weight: 500; color: var(--c); }
    .bed-cal .date-card { padding: 22px; justify-content: center; }
    .bed-cal .date-top { font-size: 26px; }
    .bed-cal .date-num { flex: none; font-size: min(190px, 36vh); margin: 6px 0 0; }
    .bedside .whatson { padding: 14px 16px 4px; }
    .bedside .whatson .card-title { font-size: 20px; }
    .bedside .wo-day { font-size: 16px; }
    .bedside .wo-ev { grid-template-columns: 66px 4px 1fr; }
    .bedside .wo-time { font-size: 17px; }
    .bedside .wo-text .ev-name { font-size: 20px; }
    .bedside .wo-loc { font-size: 16px; }
    /* on the kitchen display and the computer a pop-up is a centred dialog, not a sheet from the bottom */
    .screen:not(.phone) .pop-scrim { align-items: center; padding: 24px; }
    .screen:not(.phone) .pop { padding-top: 18px; animation: pop-in 0.18s ease-out; }
    @keyframes pop-in { from { transform: scale(0.94); opacity: 0; } to { transform: none; opacity: 1; } }
    .screen:not(.phone) .grabber { display: none; }
    .grabber { width: 40px; height: 5px; border-radius: 3px; background: var(--track-strong); margin: 0 auto 8px; flex: none; }
    .pop-head { display: flex; align-items: center; gap: 12px; padding: 2px 2px 12px; flex: none; }
    .pop-ico { width: 40px; height: 40px; border-radius: 50%; background: var(--accent-soft); color: var(--accent);
               display: grid; place-items: center; }
    .pop-ico ha-icon { --mdc-icon-size: 22px; }
    .pop-title { flex: 1; min-width: 0; font-family: var(--display); font-weight: 700; font-size: 18px; letter-spacing: -0.01em;
                 white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .pop-body { overflow-y: auto; overscroll-behavior: contain; display: flex; flex-direction: column; gap: 10px;
                margin: 0 -16px; padding: 0 16px 4px; }
    .pop-sub { font-size: 13px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted);
               margin: 8px 4px 0; }
    .pop-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .ptile { display: grid; grid-template-columns: 38px 1fr; gap: 10px; align-items: center; padding: 10px 12px; min-height: 62px;
             border-radius: 20px; background: var(--inset); text-align: left; min-width: 0; }
    .ptile.wide { grid-column: 1 / -1; }
    .ptile .tile-ico { width: 38px; height: 38px; background: var(--card); }
    .ptile .tile-ico ha-icon { --mdc-icon-size: 20px; }
    .ptile .tile-name { font-size: 14px; line-height: 1.2; }
    .ptile .muted { font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ptile.on .tile-ico { background: var(--warm); color: #fff; }
    .ptile.alert { background: color-mix(in srgb, var(--warm) 16%, var(--inset)); }
    .ptile.alert .tile-ico { color: var(--warm); }
    .ptile:active { transform: scale(0.98); }
    /* half width: name and value on top, - and + squircles sharing the row underneath */
    .ptile.stepper { grid-column: auto; grid-template-columns: 38px 1fr; }
    .ptile.stepper .steps-btns { grid-column: 1 / -1; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .ptile.stepper .steps-btns .round.small { width: 100%; height: 40px; border-radius: 13px; }
    /* light sheet */
    .lsheet-state { display: block; font-family: var(--body); font-size: 13px; font-weight: 600; color: var(--muted); letter-spacing: 0; }
    .lsheet-state.lit { color: var(--warm); }
    .pop-ico.lit { background: color-mix(in srgb, var(--warm) 20%, transparent); color: var(--warm); }
    .lsheet-body { gap: 4px; }
    .lsheet-main { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 4px 0 6px; }
    .split.big { --w: 104px; flex: none; height: min(250px, 31vh); margin: 0 auto; }
    .split.big .seg-ico { width: 64px; height: 64px; }
    .split.big .seg-bot ha-icon { --mdc-icon-size: 34px; }
    .split.big.lit .seg-bot { background: var(--lit-c, var(--warm)); }
    .lsheet-onoff { width: 112px; height: min(220px, 30vh); border-radius: 56px; background: var(--track); display: grid; place-items: center; }
    .lsheet-onoff ha-icon { --mdc-icon-size: 40px; opacity: 0.7; }
    .lsheet-onoff.lit { background: var(--warm); color: #fff; }
    .lsheet-onoff.lit ha-icon { opacity: 1; }
    .lsheet-power { width: 56px; height: 56px; border-radius: 50%; background: var(--inset); display: grid; place-items: center; flex: none; }
    .lsheet-power ha-icon { --mdc-icon-size: 26px; }
    .lsheet-power.on { background: var(--ink); color: var(--card); }
    .lsheet-power:active, .sw:active { transform: scale(0.94); }
    .ctbar { position: relative; height: 52px; border-radius: 18px; touch-action: none; cursor: pointer; flex: none;
             background: linear-gradient(90deg, #ffa95a, #ffd9a8 35%, #f4f1ea 60%, #cfe2ff); }
    .ct-end { position: absolute; top: 0; bottom: 0; left: 14px; display: grid; place-items: center; color: rgba(60, 40, 10, 0.55); pointer-events: none; }
    .ct-end.cool { left: auto; right: 14px; color: rgba(20, 50, 100, 0.5); }
    .ct-end ha-icon { --mdc-icon-size: 20px; }
    .ct-thumb { position: absolute; top: 6px; bottom: 6px; width: 8px; margin-left: -4px; border-radius: 4px; background: #fff;
                box-shadow: 0 0 0 2px rgba(16, 25, 46, 0.55), 0 2px 6px rgba(0, 0, 0, 0.2); pointer-events: none; }
    .swatches { display: grid; grid-template-columns: repeat(8, 1fr); gap: 8px; }
    .sw { aspect-ratio: 1; width: 100%; max-width: 52px; justify-self: center; border-radius: 50%; background: var(--c);
          box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08); }
    .sw.on { box-shadow: 0 0 0 3px var(--card), 0 0 0 5px var(--c); }
    .lsheet-side { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
    /* tablet: the pill on the left, everything else beside it */
    .lsheet.two { width: min(760px, 100%); }
    .lsheet.two .lsheet-body { display: grid; grid-template-columns: 200px 1fr; gap: 20px; align-items: start; }
    .lsheet.two .split.big { height: min(340px, 52vh); }
    .lsheet.two .lsheet-side .pop-sub:first-child { margin-top: 0; }
    .steps-btns { display: flex; gap: 8px; }
    .steps-btns .round.small { background: var(--card); }
    .choices { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .choices.compact { grid-template-columns: repeat(4, 1fr); }
    .choice { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; min-height: 66px;
              padding: 8px 4px; border-radius: 18px; background: var(--inset); font-size: 12px; font-weight: 600; text-align: center;
              line-height: 1.15; min-width: 0; }
    .choice ha-icon { --mdc-icon-size: 22px; color: var(--accent); }
    .choice.on { background: var(--accent); color: #fff; }
    .choice.on ha-icon { color: #fff; }
    .choice:active { transform: scale(0.96); }
    .pplayer { display: flex; flex-direction: column; gap: 14px; padding: 14px; border-radius: 22px; background: var(--inset); }
    .pplayer.muted-vol { background: color-mix(in srgb, #e5484d 12%, var(--inset)); }
    .pp-top { display: grid; grid-template-columns: 64px 1fr auto; gap: 12px; align-items: center; }
    .pp-top .art { width: 64px; height: 64px; background-color: var(--card); }
    .pp-top .art.input-art { background-color: color-mix(in srgb, var(--accent) 16%, var(--card)); }
    .pp-top .art.input-art ha-icon { --mdc-icon-size: 32px; }
    .pp-ctrl { display: flex; justify-content: center; align-items: center; gap: 22px; }
    .pp-ctrl .round.play { width: 56px; height: 56px; background: var(--accent); color: #fff; }
    .pp-ctrl .round.small, .pp-top .round.small { background: var(--card); }
    /* volume: - and + share 80% of the row as squircles, mute takes the other 20% */
    .pp-vol { display: grid; grid-template-columns: 2fr 2fr 1fr; gap: 10px; }
    .pp-vol .round.small { width: 100%; height: 52px; border-radius: 16px; background: var(--card); }
    .pp-vol .round.small ha-icon { --mdc-icon-size: 24px; }
    .pp-prog { display: flex; flex-direction: column; gap: 6px; }
    .pp-track { height: 6px; border-radius: 999px; background: var(--track); overflow: hidden; }
    .pp-track div { height: 100%; border-radius: 999px; background: var(--accent); transition: width 1s linear; }
    .pp-times { display: flex; justify-content: space-between; font-size: 12px; font-weight: 600;
                font-variant-numeric: tabular-nums; color: var(--muted); }
    .round.small.power-on { color: var(--accent); }
    .round.small.is-muted { color: #e5484d; }
    .graph { padding: 14px 14px 10px; border-radius: 22px; background: var(--inset); }
    .graph-head { display: flex; justify-content: space-between; font-size: 14px; font-weight: 600; }
    .graph-head b { font-size: 18px; }
    .graph svg { display: block; width: 100%; height: 90px; margin-top: 8px; }
    .graph-foot { display: flex; justify-content: space-between; font-size: 12px; margin-top: 6px; }
    .graph-empty { height: 90px; display: grid; place-items: center; font-size: 13px; }
    .mgraph svg { height: 110px; }
    .mg-legend { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 12px; margin-top: 8px; font-size: 13px; }
    .mg-legend span { display: flex; align-items: center; gap: 6px; min-width: 0; }
    .mg-legend i { width: 10px; height: 10px; border-radius: 50%; flex: none; }
    .mg-legend b { margin-left: auto; font-weight: 600; }
    .hp-now.linked { cursor: pointer; }
    .hp-more { --mdc-icon-size: 20px; color: var(--muted); align-self: center; }
    .player-row { cursor: pointer; }

    /* native cards: each one draws a piece of the phone home in the same CSS as .ph */
    .piece { height: 100%; color: var(--ink); font-family: var(--body); user-select: none; -webkit-user-select: none; }
    .piece .ph-grid.one { display: block; height: 100%; }
    .piece .ph-grid.one > * { height: 100%; width: 100%; }
    .piece .ph-sec { height: 100%; }
    /* a card is exactly its grid cell: text stays on one line and fades out at the edge */
    .piece .tile { min-height: 0; overflow: hidden; }
    .piece .player { overflow: hidden; }
    .piece .tile-name, .piece .tile-text .muted, .piece .media-src, .piece .player-title, .piece .media-artist {
      display: block; white-space: nowrap; overflow: hidden; text-overflow: clip; }
    .piece .cut { -webkit-mask-image: linear-gradient(to right, #000 calc(100% - 18px), transparent);
                  mask-image: linear-gradient(to right, #000 calc(100% - 18px), transparent); }
    .piece .missing { display: flex; align-items: center; gap: 8px; height: 100%; min-height: 62px; padding: 0 14px;
                      font-size: 13px; color: var(--muted); }
    .screen.overlay { background: none; pointer-events: none; z-index: 20; }
    .screen.overlay::after { display: none; }
    .screen.overlay > * { pointer-events: auto; }
  `;
};
try {
  CSS.registerProperty({ name: "--ov-at", syntax: "<number>", inherits: true, initialValue: "50" });
} catch (e2) {
}
if (!customElements.get("overlook-show")) customElements.define("overlook-show", OverlookShow);
var LAST_SCROLL = 0;
var PIECES = 0;
var SCROLL_HOOKED = false;
function findHuiRoot() {
  const walk = (root, depth) => {
    if (!root || depth > 12) return null;
    const hit = root.querySelector("hui-root");
    if (hit) return hit;
    for (const el of root.querySelectorAll("*")) {
      if (el.shadowRoot) {
        const r2 = walk(el.shadowRoot, depth + 1);
        if (r2) return r2;
      }
    }
    return null;
  };
  const ha = document.querySelector("home-assistant");
  return ha ? walk(ha.shadowRoot, 0) : null;
}
var OVERLAY = null;
var overlay = (hass) => {
  if (!OVERLAY) {
    OVERLAY = document.createElement("overlook-overlay");
    document.body.appendChild(OVERLAY);
  }
  if (hass && OVERLAY.hass !== hass) OVERLAY.hass = hass;
  return OVERLAY;
};
var OverlookPiece = class extends OverlookShow {
  setConfig(config) {
    if (!config) throw new Error("No configuration");
    this._config = Object.assign({
      phone: true,
      lights: [],
      popups: {},
      links: {},
      status: [],
      status_air: [],
      calendars: [],
      speakers: [],
      scenes: [],
      phone_rooms: []
    }, config);
    this._drag = null;
  }
  get _scrolledAt() {
    return LAST_SCROLL;
  }
  get _iconToggles() {
    return true;
  }
  // light tiles: icon toggles, body opens the sheet (HA's tile card)
  set _scrolledAt(v2) {
    LAST_SCROLL = v2;
  }
  connectedCallback() {
    dt.prototype.connectedCallback.call(this);
    loadFonts();
    this.style.height = "100%";
    PIECES++;
    if (!SCROLL_HOOKED) {
      SCROLL_HOOKED = true;
      window.addEventListener("scroll", () => {
        LAST_SCROLL = performance.now();
      }, { capture: true, passive: true });
    }
  }
  disconnectedCallback() {
    dt.prototype.disconnectedCallback.call(this);
    PIECES--;
  }
  updated(changed) {
    this._markCut();
    if (!changed.has("hass") || !this.hass) return;
    if (this._drag) this._settle();
    overlay(this.hass);
  }
  // fade only the text that is actually cut off by the edge of its cell
  _markCut() {
    const r2 = this.shadowRoot;
    if (!r2) return;
    for (const el of r2.querySelectorAll(".tile-name, .tile-text .muted, .media-src, .player-title, .media-artist")) {
      el.classList.toggle("cut", el.scrollWidth > el.clientWidth + 1);
    }
  }
  firstUpdated() {
    this._ro = new ResizeObserver(() => this._markCut());
    this._ro.observe(this);
  }
  _openLight(id) {
    overlay(this.hass).openLight(id, this._config.name);
  }
  // the pop-ups this card carries: its own, or each pill's and reading's (status card)
  _ownPopups() {
    const c2 = this._config, m2 = {};
    if (c2.popup && c2.entity) m2[c2.entity] = c2.popup;
    for (const x2 of [...c2.status || [], ...c2.status_air || []]) if (x2.popup && x2.entity) m2[x2.entity] = x2.popup;
    return m2;
  }
  _links() {
    return Object.fromEntries(Object.keys(this._ownPopups()).map((k2) => [k2, k2]));
  }
  _open(id) {
    const p2 = this._ownPopups()[id];
    if (p2) overlay(this.hass).openPopup(p2);
    else overlay(this.hass)._moreInfo(id);
  }
  getCardSize() {
    return 1;
  }
};
var OverlookOverlay = class extends OverlookShow {
  constructor() {
    super();
    this.setConfig({ phone: true, weather: null });
    this._names = {};
  }
  // a card's own pop-up, handed over whole
  openPopup(p2) {
    if (!p2 || !(p2.sections || []).length) return;
    fireHaptic("light");
    this._config = Object.assign({}, this._config, { popups: { card: p2 } });
    this._pop = null;
    this._pop = "card";
    this._loadHistory(p2);
  }
  connectedCallback() {
    dt.prototype.connectedCallback.call(this);
    loadFonts();
  }
  updated(changed) {
    if (changed.has("hass") && this._drag) this._settle();
    this._lockPage(!!(this._pop || this._light));
  }
  // While a sheet is up the page behind it must not move. iOS hands any swipe the sheet
  // doesn't use to the document, so the dashboard scrolled under it. Pin the body where
  // it is (position: fixed at -scrollY) and put the scroll back when the sheet closes.
  _lockPage(on) {
    if (on === !!this._locked) return;
    const de = document.documentElement, b2 = document.body;
    if (on) {
      this._locked = { y: window.scrollY };
      de.style.overflow = "hidden";
      Object.assign(b2.style, { position: "fixed", top: `-${this._locked.y}px`, left: "0", right: "0" });
    } else {
      const y2 = this._locked.y;
      this._locked = null;
      de.style.overflow = "";
      Object.assign(b2.style, { position: "", top: "", left: "", right: "" });
      window.scrollTo(0, y2);
    }
  }
  disconnectedCallback() {
    this._lockPage(false);
    dt.prototype.disconnectedCallback.call(this);
  }
  openLight(id, name, room = false) {
    if (name) this._names[id] = name;
    OverlookShow.prototype._openLight.call(this, id);
    this._lightRoom = room;
  }
  // HA listens for more-info on its own root, which this layer sits outside of
  _moreInfo(entityId) {
    const ha = document.querySelector("home-assistant");
    if (ha) ha.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }));
  }
  render() {
    if (!this.hass || !(this._pop || this._light)) return J;
    return Z`
      <div class="screen phone overlay">
        ${this._pop ? this._popSheet() : J}
        ${this._light ? this._lightSheet() : J}
      </div>`;
  }
};
if (!customElements.get("overlook-overlay")) customElements.define("overlook-overlay", OverlookOverlay);
var NATIVE_GRID = `
  :host {
    --ha-section-grid-row-height: 62px;
    --ha-section-grid-row-gap: 10px;
    --ha-section-grid-column-gap: 10px;
    --ha-view-sections-row-gap: 18px;
    --ha-view-sections-narrow-column-gap: 16px;
    --lovelace-background: linear-gradient(165deg, #f4f7fd 0%, #e4ecf9 100%);
  }
  @media (prefers-color-scheme: dark) {
    :host { --lovelace-background: linear-gradient(165deg, #0b0f18 0%, #121827 100%); }
  }`;
var PAGE_GROUND = `
  html { --primary-background-color: #e4ecf9 !important; background-color: #e4ecf9 !important; }
  @media (prefers-color-scheme: dark) {
    html { --primary-background-color: #121827 !important; background-color: #121827 !important; }
  }`;
function stylePage(css) {
  let s2 = document.getElementById("overlook-native-page");
  if (!css && !s2) return;
  if (s2 && s2.textContent === css) return;
  if (!css) s2.remove();
  else {
    if (!s2) {
      s2 = document.createElement("style");
      s2.id = "overlook-native-page";
      document.head.appendChild(s2);
    }
    s2.textContent = css;
  }
  const ha = document.querySelector("home-assistant");
  const ext = ha && ha.hass && ha.hass.auth && ha.hass.auth.external;
  if (ext) ext.fireMessage({ type: "theme-update" });
}
var HIDE_HEADER = `
  .header { display: none !important; }
  hui-view-container { padding-top: var(--safe-area-inset-top, 0px) !important; }`;
function styleHuiRoot(r2, css) {
  if (!r2 || !r2.shadowRoot) return;
  let s2 = r2.shadowRoot.getElementById("overlook-native");
  if (!css) {
    if (s2) s2.remove();
    return;
  }
  if (!s2) {
    s2 = document.createElement("style");
    s2.id = "overlook-native";
    r2.shadowRoot.appendChild(s2);
  }
  if (s2.textContent !== css) s2.textContent = css;
}
var OverlookEditButton = class extends dt {
  static get properties() {
    return { hass: { attribute: false }, editMode: { type: Boolean } };
  }
  static getConfigForm() {
    return { schema: [] };
  }
  static getStubConfig() {
    return {};
  }
  setConfig() {
  }
  getCardSize() {
    return 1;
  }
  getGridOptions() {
    return { columns: "full", rows: "auto" };
  }
  connectedCallback() {
    super.connectedCallback();
    this._tick = setInterval(() => this._sync(), 400);
    this._sync();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this._tick);
    styleHuiRoot(this._root, "");
    stylePage("");
  }
  _sync() {
    const r2 = this._root && this._root.isConnected ? this._root : findHuiRoot();
    if (r2 !== this._root) {
      styleHuiRoot(this._root, "");
      this._root = r2;
    }
    const edit = !!(r2 && r2.lovelace && r2.lovelace.editMode);
    styleHuiRoot(r2, (PIECES ? NATIVE_GRID : "") + (edit ? "" : HIDE_HEADER));
    stylePage(PIECES ? PAGE_GROUND : "");
  }
  _edit() {
    const lv = this._root && this._root.lovelace;
    if (!lv || !lv.setEditMode) return;
    fireHaptic("medium");
    lv.setEditMode(true);
  }
  render() {
    if (this.editMode) {
      return Z`<div class="note"><ha-icon icon="mdi:pencil-off-outline"></ha-icon>
        Edit button: hides HA's header on this dashboard</div>`;
    }
    return Z`<button @click=${() => this._edit()}><ha-icon icon="mdi:pencil-outline"></ha-icon>Edit dashboard</button>`;
  }
  static styles = o`
    :host { display: flex; justify-content: center; padding: 4px 0 calc(env(safe-area-inset-bottom, 0px) + 8px); }
    button { display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; border: 0; border-radius: 999px;
             font: inherit; font-size: 14px; font-weight: 500; cursor: pointer; color: var(--secondary-text-color);
             background: var(--ha-card-background, var(--card-background-color));
             box-shadow: var(--ha-card-box-shadow, none); -webkit-tap-highlight-color: transparent; }
    button:active { transform: scale(0.97); }
    ha-icon { --mdc-icon-size: 18px; }
    .note { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--secondary-text-color); padding: 10px; }
  `;
};
if (!customElements.get("overlook-edit-button")) customElements.define("overlook-edit-button", OverlookEditButton);
var TILE_KINDS = [
  ["light", "Light"],
  ["switch", "Switch"],
  ["media", "Speaker / TV"],
  ["climate", "Heat pump"],
  ["plant", "Plant"],
  ["sensor", "Reading"],
  ["scene", "Scene / script"]
];
var OverlookTile = class extends OverlookPiece {
  static getConfigForm() {
    return {
      schema: [
        { name: "entity", required: true, selector: { entity: {} } },
        { type: "grid", name: "", schema: [
          { name: "name", selector: { text: {} } },
          { name: "icon", selector: { icon: {} }, context: { icon_entity: "entity" } }
        ] },
        { name: "kind", selector: { select: { mode: "dropdown", options: TILE_KINDS.map(([value, label]) => ({ value, label })) } } }
      ],
      computeLabel: (s2) => ({ entity: "Entity", name: "Name", icon: "Icon", kind: "Show as (blank = from the entity)" })[s2.name]
    };
  }
  static getStubConfig(hass) {
    const id = Object.keys(hass.states).find((e2) => e2.startsWith("light.")) || Object.keys(hass.states)[0];
    return { entity: id };
  }
  _kind() {
    const c2 = this._config, e2 = this._st(c2.entity);
    if (c2.kind) return c2.kind;
    const dom = (c2.entity || "").split(".")[0];
    if (dom === "sensor" && e2 && e2.attributes.device_class === "moisture") return "plant";
    return DOMAIN_TYPE[dom] || "sensor";
  }
  _item() {
    const c2 = this._config, e2 = this._st(c2.entity);
    return {
      entity: c2.entity,
      name: c2.name || e2 && e2.attributes.friendly_name || c2.entity,
      icon: c2.icon || e2 && (e2.attributes.icon || CLASS_ICON[e2.attributes.device_class]) || TYPE_ICON[this._kind()]
    };
  }
  // the design's sizes: a tile is one 62px row, a player two, the heat pump the full width
  getGridOptions() {
    switch (this._kind()) {
      case "climate":
        return { columns: 12, rows: "auto", min_columns: 12 };
      case "media":
        return { columns: 6, rows: 2, min_columns: 6, min_rows: 2 };
      default:
        return { columns: 6, rows: 1, min_columns: 3, min_rows: 1 };
    }
  }
  render() {
    if (!this.hass || !this._config) return J;
    const x2 = this._item();
    if (!this._st(x2.entity)) {
      return Z`<div class="phone piece"><div class="card missing"><ha-icon icon="mdi:help-circle-outline"></ha-icon>
        ${x2.entity || "Pick an entity"} isn't there</div></div>`;
    }
    let body;
    switch (this._kind()) {
      case "climate":
        body = Z`<div class="card ph-hp">${this._thermostat(x2.entity)}</div>`;
        break;
      case "media":
        body = this._player(x2);
        break;
      case "plant":
        body = this._plantTile(x2);
        break;
      case "switch":
        body = this._switchTile(x2);
        break;
      case "sensor":
        body = this._sensorTile(x2);
        break;
      case "scene":
        body = this._sceneBtn(x2, true);
        break;
      default:
        body = this._lightTile(x2);
    }
    return Z`<div class="phone piece"><div class="ph-grid one">${body}</div></div>`;
  }
};
if (!customElements.get("overlook-tile")) customElements.define("overlook-tile", OverlookTile);
var OverlookHeading = class extends OverlookPiece {
  static getConfigForm() {
    return {
      schema: [
        { type: "grid", name: "", schema: [
          { name: "name", required: true, selector: { text: {} } },
          { name: "icon", selector: { icon: {} } }
        ] },
        { name: "group", selector: { entity: { domain: "light" } } }
      ],
      computeLabel: (s2) => ({ name: "Name", icon: "Icon", group: "All-lights button (a light group)" })[s2.name]
    };
  }
  static getStubConfig() {
    return { name: "Room", icon: "mdi:sofa" };
  }
  getGridOptions() {
    return { columns: "full", rows: "auto" };
  }
  render() {
    if (!this.hass || !this._config) return J;
    const c2 = this._config, g2 = this._st(c2.group), lit = g2 && g2.state === "on";
    const h2 = this._tapHold(
      `room:${c2.group}`,
      () => this._call("light", lit ? "turn_off" : "turn_on", { entity_id: c2.group }),
      () => overlay(this.hass).openLight(c2.group, c2.name, true)
    );
    return Z`
      <div class="phone piece"><div class="ph-sec">
        <ha-icon icon=${c2.icon || "mdi:door"}></ha-icon><span>${c2.name}</span>
        ${g2 ? Z`<button class="ph-group ${lit ? "on" : ""}" title="All lights"
            @pointerdown=${h2.down} @pointermove=${h2.move} @pointerup=${h2.up} @pointerleave=${h2.up} @pointercancel=${h2.up}
            @click=${h2.click}>
            <ha-icon icon="mdi:lightbulb-group"></ha-icon></button>` : J}
      </div></div>`;
  }
};
if (!customElements.get("overlook-heading")) customElements.define("overlook-heading", OverlookHeading);
var OverlookScenes = class extends OverlookPiece {
  static getConfigForm() {
    return {
      schema: [{ name: "scenes", selector: { object: { multiple: true, label_field: "name", description_field: "entity", fields: {
        entity: { label: "Scene, script or switch", required: true, selector: { entity: {} } },
        name: { label: "Name", selector: { text: {} } },
        icon: { label: "Icon", selector: { icon: {} } }
      } } } }],
      computeLabel: () => "Scenes"
    };
  }
  static getStubConfig(hass) {
    return { scenes: Object.keys(hass.states).filter((e2) => e2.startsWith("scene.")).slice(0, 4).map((entity) => ({ entity })) };
  }
  getGridOptions() {
    return { columns: "full", rows: "auto" };
  }
  render() {
    if (!this.hass || !this._config) return J;
    const items = (this._config.scenes || []).map((x2) => {
      const c2 = typeof x2 === "string" ? { entity: x2 } : x2, e2 = this._st(c2.entity);
      return {
        ...c2,
        name: c2.name || e2 && e2.attributes.friendly_name || c2.entity,
        icon: c2.icon || e2 && e2.attributes.icon || DOMAIN_ICON[(c2.entity || "").split(".")[0]] || "mdi:palette"
      };
    });
    return Z`<div class="phone piece"><div class="fav-scenes">${items.map((x2) => this._miniScene(x2))}</div></div>`;
  }
};
if (!customElements.get("overlook-scenes")) customElements.define("overlook-scenes", OverlookScenes);
var OverlookStatus = class extends OverlookPiece {
  static getConfigForm() {
    return {
      schema: [
        { name: "status", selector: { object: {} } },
        { name: "status_air", selector: { object: {} } }
      ],
      computeLabel: (s2) => ({
        status: "Pills (people always; the rest only while on)",
        status_air: "Readings (each with its sources)"
      })[s2.name]
    };
  }
  static getStubConfig() {
    return { status: [], status_air: [] };
  }
  getGridOptions() {
    return { columns: "full", rows: "auto" };
  }
  render() {
    if (!this.hass || !this._config) return J;
    return Z`<div class="phone piece">${this._status()}</div>`;
  }
};
if (!customElements.get("overlook-status")) customElements.define("overlook-status", OverlookStatus);
var edFire = (el, type, detail) => el.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
async function loadHaForm() {
  if (customElements.get("ha-form") && customElements.get("ha-expansion-panel")) return;
  try {
    const helpers = await window.loadCardHelpers();
    const card = await helpers.createCardElement({ type: "tile", entity: "sun.sun" });
    if (card.constructor.getConfigElement) await card.constructor.getConfigElement();
  } catch (e2) {
    console.warn("overlook: editor parts", e2);
  }
  await customElements.whenDefined("ha-form");
}
var toRgb = (h2) => {
  const m2 = /^#?([0-9a-f]{6})$/i.exec(h2 || "");
  if (!m2) return h2;
  const n2 = parseInt(m2[1], 16);
  return [n2 >> 16, n2 >> 8 & 255, n2 & 255];
};
var toHex = (a2) => Array.isArray(a2) ? "#" + a2.map((v2) => Number(v2).toString(16).padStart(2, "0")).join("") : a2;
var recolour = (v2, f2) => Array.isArray(v2) ? v2.map((x2) => recolour(x2, f2)) : v2 && typeof v2 === "object" ? Object.fromEntries(Object.entries(v2).map(([k2, x2]) => [k2, k2 === "color" ? f2(x2) : recolour(x2, f2)])) : v2;
var tidy = (o2) => Object.fromEntries(Object.entries(o2).filter(([, v2]) => v2 !== void 0 && v2 !== "" && v2 !== null && !(Array.isArray(v2) && !v2.length)));
var ED_LABELS = {
  entity: "Entity",
  name: "Name",
  icon: "Icon",
  title: "Heading",
  items: "Tiles",
  wide: "Full width",
  attr: "Show an attribute instead (e.g. current_temperature)",
  unit: "Unit",
  when: "Only while",
  state: "State",
  color: "Colour",
  hours: "Hours shown",
  series: "Lines",
  average: "One line: the average of all",
  valid_min: "Ignore readings below",
  valid_max: "Ignore readings above",
  options: "Options",
  value: "Value",
  compact: "Small buttons",
  choose: "What to choose",
  sources: "Sensors it covers (low\u2013high)",
  tone: "Colour",
  person: "Person (always shown, home or away)",
  toggle: "Tap toggles it (no pop-up)",
  show_when: "Shown while the state is (blank = on)"
};
var edLabel = (s2) => ED_LABELS[s2.name] || s2.name;
var TILE_FIELDS = {
  entity: { label: "Entity", required: true, selector: { entity: {} } },
  name: { label: "Name", selector: { text: {} } },
  icon: { label: "Icon", selector: { icon: {} } },
  wide: { label: "Full width", selector: { boolean: {} } },
  attr: { label: "Attribute instead of state", selector: { text: {} } },
  unit: { label: "Unit (with an attribute)", selector: { text: {} } },
  when: { label: "Only while", selector: { object: { fields: {
    entity: { label: "Entity", selector: { entity: {} } },
    state: { label: "is", selector: { text: {} } }
  } } } }
};
var SERIES_FIELDS = {
  entity: { label: "Entity", required: true, selector: { entity: {} } },
  name: { label: "Name", selector: { text: {} } },
  color: { label: "Colour", selector: { color_rgb: {} } },
  attr: { label: "Attribute instead of state", selector: { text: {} } }
};
var CHOOSE = [
  ["source", "Source / app"],
  ["sound_mode", "Sound mode"],
  ["fan_mode", "Fan speed"],
  ["swing_mode", "Swing"],
  ["preset_mode", "Preset"]
];
var chooseList = (attr) => ({ source: "source_list", sound_mode: "sound_mode_list" })[attr] || `${attr}s`;
var chooseService = (entity, attr) => {
  const dom = (entity || "").split(".")[0] || "media_player";
  return attr === "source" || attr === "sound_mode" ? `${dom}.select_${attr}` : `${dom}.set_${attr}`;
};
var SECTION_KINDS = [
  ["player", "Player", "mdi:play-circle-outline"],
  ["tiles", "Tiles", "mdi:view-grid-outline"],
  ["choices", "Choices", "mdi:format-list-bulleted-square"],
  ["graph", "Graph", "mdi:chart-line"],
  ["multigraph", "Graph of several", "mdi:chart-multiline"]
];
var SECTION_SCHEMA = {
  player: [{ name: "entity", required: true, selector: { entity: { domain: "media_player" } } }],
  tiles: [
    { name: "title", selector: { text: {} } },
    { name: "items", selector: { object: { multiple: true, label_field: "name", description_field: "entity", fields: TILE_FIELDS } } }
  ],
  choices: [
    { name: "title", selector: { text: {} } },
    { type: "grid", name: "", schema: [
      { name: "entity", required: true, selector: { entity: {} } },
      { name: "choose", required: true, selector: { select: {
        mode: "dropdown",
        options: CHOOSE.map(([value, label]) => ({ value, label }))
      } } }
    ] },
    { name: "compact", selector: { boolean: {} } },
    { name: "options", selector: { object: { multiple: true, label_field: "name", description_field: "value", fields: {
      value: { label: "Value (as the entity names it)", required: true, selector: { text: {} } },
      name: { label: "Name", selector: { text: {} } },
      icon: { label: "Icon", selector: { icon: {} } }
    } } } }
  ],
  graph: [
    { name: "title", selector: { text: {} } },
    { name: "entity", required: true, selector: { entity: {} } },
    { type: "grid", name: "", schema: [{ name: "name", selector: { text: {} } }, { name: "color", selector: { color_rgb: {} } }] },
    { name: "hours", selector: { number: { min: 1, max: 720, mode: "box", unit_of_measurement: "h" } } }
  ],
  multigraph: [
    { name: "title", selector: { text: {} } },
    { type: "grid", name: "", schema: [
      { name: "name", selector: { text: {} } },
      { name: "hours", selector: { number: { min: 1, max: 720, mode: "box", unit_of_measurement: "h" } } },
      { name: "unit", selector: { text: {} } },
      { name: "color", selector: { color_rgb: {} } },
      { name: "valid_min", selector: { number: { mode: "box" } } },
      { name: "valid_max", selector: { number: { mode: "box" } } }
    ] },
    { name: "average", selector: { boolean: {} } },
    { name: "series", selector: { object: { multiple: true, label_field: "name", description_field: "entity", fields: SERIES_FIELDS } } }
  ]
};
function sectionToForm(s2) {
  const d2 = recolour({ ...s2 }, toRgb);
  if (s2.type === "choices") {
    d2.choose = s2.attr;
    d2.options = (s2.options || []).map((o2) => Array.isArray(o2) ? tidy({ value: o2[0], name: o2[1], icon: o2[2] }) : o2);
  }
  if (s2.valid) {
    d2.valid_min = s2.valid[0];
    d2.valid_max = s2.valid[1];
  }
  delete d2.valid;
  delete d2.attr;
  delete d2.service;
  delete d2.field;
  delete d2.type;
  if (s2.type !== "choices") {
    if (s2.attr) d2.attr = s2.attr;
  }
  return d2;
}
function sectionFromForm(type, d2) {
  const s2 = recolour({ type, ...d2 }, toHex);
  if (type === "choices") {
    const attr = d2.choose || "source";
    Object.assign(s2, { attr, field: attr, service: chooseService(d2.entity, attr) });
    delete s2.choose;
  }
  if (d2.valid_min != null || d2.valid_max != null) s2.valid = [d2.valid_min ?? -1e9, d2.valid_max ?? 1e9];
  delete s2.valid_min;
  delete s2.valid_max;
  return tidy(s2);
}
var sectionHeader = (s2, hass) => {
  const kind = SECTION_KINDS.find((k2) => k2[0] === s2.type) || SECTION_KINDS[1];
  const e2 = s2.entity && hass && hass.states[s2.entity];
  const what = s2.title || s2.name || e2 && e2.attributes.friendly_name || s2.entity || (s2.items ? `${s2.items.length} tile${s2.items.length === 1 ? "" : "s"}` : "");
  return { label: kind[1], icon: kind[2], what };
};
var edList = (items, head, body, onChange) => {
  const move = (i2, d2) => {
    const a2 = [...items], j2 = i2 + d2;
    if (j2 < 0 || j2 >= a2.length) return;
    [a2[i2], a2[j2]] = [a2[j2], a2[i2]];
    onChange(a2);
  };
  const stop = (f2) => (ev) => {
    ev.stopPropagation();
    ev.preventDefault();
    f2();
  };
  return Z`<div class="ed-list">${items.map((x2, i2) => {
    const h2 = head(x2);
    return Z`
      <ha-expansion-panel outlined .header=${h2.label} .secondary=${h2.what || ""}>
        <ha-icon slot="leading-icon" icon=${h2.icon}></ha-icon>
        <div slot="icons" class="ed-icons">
          <button class="ed-ib" title="Move up" ?disabled=${i2 === 0} @click=${stop(() => move(i2, -1))}><ha-icon icon="mdi:arrow-up"></ha-icon></button>
          <button class="ed-ib" title="Move down" ?disabled=${i2 === items.length - 1} @click=${stop(() => move(i2, 1))}><ha-icon icon="mdi:arrow-down"></ha-icon></button>
          <button class="ed-ib" title="Remove" @click=${stop(() => onChange(items.filter((_2, k2) => k2 !== i2)))}><ha-icon icon="mdi:delete-outline"></ha-icon></button>
        </div>
        <div class="ed-body">${body(x2, (y2) => onChange(items.map((z2, k2) => k2 === i2 ? y2 : z2)))}</div>
      </ha-expansion-panel>`;
  })}</div>`;
};
var ED_STYLES = o`
  :host { display: block; }
  .ed-group { margin-top: 24px; }
  .ed-group > h3 { display: flex; align-items: center; gap: 8px; margin: 0 0 4px; font-size: 16px; font-weight: 500; }
  .ed-group > p { margin: 0 0 12px; color: var(--secondary-text-color); font-size: 13px; line-height: 1.4; }
  .ed-list { display: flex; flex-direction: column; gap: 8px; }
  ha-expansion-panel { --expansion-panel-summary-padding: 0 8px; --expansion-panel-content-padding: 0; }
  ha-expansion-panel ha-icon[slot="leading-icon"] { color: var(--secondary-text-color); margin-inline-end: 8px; }
  .ed-icons { display: flex; }
  .ed-ib { display: grid; place-items: center; width: 36px; height: 36px; padding: 0; border: 0; border-radius: 50%;
           background: none; color: var(--secondary-text-color); cursor: pointer; }
  .ed-ib:hover { background: var(--secondary-background-color); }
  .ed-ib[disabled] { opacity: 0.3; cursor: default; background: none; }
  .ed-ib ha-icon { --mdc-icon-size: 20px; }
  .ed-body { padding: 12px; display: flex; flex-direction: column; gap: 12px; }
  .ed-add { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
  .ed-chip { display: inline-flex; align-items: center; gap: 6px; padding: 0 14px; height: 36px; border-radius: 18px;
             border: 1px solid var(--divider-color); background: none; color: var(--primary-color); font: inherit;
             font-size: 14px; font-weight: 500; cursor: pointer; }
  .ed-chip:hover { background: var(--secondary-background-color); }
  .ed-chip ha-icon { --mdc-icon-size: 18px; }
  .ed-chip.quiet { color: var(--secondary-text-color); }
  .ed-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
`;
var OverlookPopupEditor = class extends dt {
  static get properties() {
    return { hass: { attribute: false }, value: { attribute: false }, label: {} };
  }
  static styles = ED_STYLES;
  _set(v2) {
    this.value = v2;
    edFire(this, "value-changed", { value: v2 });
  }
  _fill(s2, put) {
    const e2 = this.hass.states[s2.entity], attr = s2.attr || "source";
    const list = e2 && e2.attributes[chooseList(attr)];
    if (!Array.isArray(list)) return;
    const old = Object.fromEntries((s2.options || []).map((o2) => Array.isArray(o2) ? [o2[0], { value: o2[0], name: o2[1], icon: o2[2] }] : [o2.value, o2]));
    put({ ...s2, options: list.map((v2) => old[v2] || { value: v2 }) });
  }
  render() {
    const p2 = this.value;
    if (!p2) {
      return Z`<div class="ed-group"><h3><ha-icon icon="mdi:card-text-outline"></ha-icon>Pop-up</h3>
        <p>${this.label || "Without one, a tap opens HA's own details for the entity."}</p>
        <div class="ed-add"><button class="ed-chip" @click=${() => this._set({ title: "", icon: "", sections: [] })}>
          <ha-icon icon="mdi:plus"></ha-icon>Add a pop-up</button></div></div>`;
    }
    const sections = p2.sections || [];
    const putSections = (a2) => this._set({ ...p2, sections: a2 });
    return Z`
      <div class="ed-group">
        <div class="ed-row"><h3><ha-icon icon="mdi:card-text-outline"></ha-icon>Pop-up</h3>
          <button class="ed-chip quiet" @click=${() => this._set(void 0)}><ha-icon icon="mdi:close"></ha-icon>Remove pop-up</button></div>
        <ha-form .hass=${this.hass} .data=${{ title: p2.title, icon: p2.icon }} .computeLabel=${(s2) => ({ title: "Pop-up title", icon: "Pop-up icon" })[s2.name]}
          .schema=${[{ type: "grid", name: "", schema: [{ name: "title", selector: { text: {} } }, { name: "icon", selector: { icon: {} } }] }]}
          @value-changed=${(ev) => this._set(tidy({ ...p2, ...ev.detail.value, sections }))}></ha-form>
        <p style="margin-top:16px">Sections, top to bottom</p>
        ${edList(sections, (s2) => sectionHeader(s2, this.hass), (s2, put) => Z`
          <ha-form .hass=${this.hass} .data=${sectionToForm(s2)} .schema=${SECTION_SCHEMA[s2.type] || SECTION_SCHEMA.tiles}
            .computeLabel=${edLabel} @value-changed=${(ev) => put(sectionFromForm(s2.type || "tiles", ev.detail.value))}></ha-form>
          ${s2.type === "choices" ? Z`<div><button class="ed-chip" @click=${() => this._fill(s2, put)}>
            <ha-icon icon="mdi:auto-fix"></ha-icon>Fill options from the entity</button></div>` : J}`, putSections)}
        <div class="ed-add">${SECTION_KINDS.map(([type, label, icon]) => Z`
          <button class="ed-chip" @click=${() => putSections([...sections, type === "tiles" ? { type, items: [] } : { type }])}>
            <ha-icon icon=${icon}></ha-icon>${label}</button>`)}</div>
      </div>`;
  }
};
if (!customElements.get("overlook-popup-editor")) customElements.define("overlook-popup-editor", OverlookPopupEditor);
var OverlookEditorBase = class extends dt {
  static get properties() {
    return { hass: { attribute: false }, _config: { state: true }, _ready: { state: true } };
  }
  static styles = ED_STYLES;
  setConfig(c2) {
    this._config = c2;
  }
  connectedCallback() {
    super.connectedCallback();
    loadHaForm().then(() => {
      this._ready = true;
    });
  }
  _patch(p2) {
    const c2 = { ...this._config };
    for (const [k2, v2] of Object.entries(p2)) {
      if (v2 === void 0 || v2 === "" || v2 === null) delete c2[k2];
      else c2[k2] = v2;
    }
    this._config = c2;
    edFire(this, "config-changed", { config: c2 });
  }
};
var OverlookTileEditor = class extends OverlookEditorBase {
  render() {
    if (!this._ready || !this.hass || !this._config) return J;
    const form = customElements.get("overlook-tile").getConfigForm();
    const { popup, ...rest } = this._config;
    return Z`
      <ha-form .hass=${this.hass} .data=${rest} .schema=${form.schema} .computeLabel=${form.computeLabel}
        @value-changed=${(ev) => this._patch({ ...ev.detail.value, type: this._config.type })}></ha-form>
      <overlook-popup-editor .hass=${this.hass} .value=${popup}
        @value-changed=${(ev) => this._patch({ popup: ev.detail.value })}></overlook-popup-editor>`;
  }
};
if (!customElements.get("overlook-tile-editor")) customElements.define("overlook-tile-editor", OverlookTileEditor);
var PILL_SCHEMA = [
  { name: "entity", required: true, selector: { entity: {} } },
  { type: "grid", name: "", schema: [{ name: "name", selector: { text: {} } }, { name: "icon", selector: { icon: {} } }] },
  { name: "tone", selector: { select: { mode: "dropdown", options: [
    { value: "warn", label: "Amber (warning)" },
    { value: "bad", label: "Red (problem)" },
    { value: "cool", label: "Blue" },
    { value: "accent", label: "Accent" }
  ] } } },
  { name: "show_when", selector: { text: {} } },
  { name: "person", selector: { boolean: {} } },
  { name: "toggle", selector: { boolean: {} } }
];
var READING_SCHEMA = [
  { name: "entity", required: true, selector: { entity: { domain: "sensor" } } },
  { type: "grid", name: "", schema: [
    { name: "name", selector: { text: {} } },
    { name: "icon", selector: { icon: {} } },
    { name: "unit", selector: { text: {} } },
    { name: "color", selector: { color_rgb: {} } }
  ] },
  { name: "sources", selector: { object: { multiple: true, label_field: "entity", fields: {
    entity: { label: "Entity", required: true, selector: { entity: {} } },
    attr: { label: "Attribute instead of state", selector: { text: {} } }
  } } } }
];
var OverlookStatusEditor = class extends OverlookEditorBase {
  _items(key, schema, blank, toForm, fromForm, help) {
    const items = this._config[key] || [];
    return edList(
      items,
      (x2) => {
        const e2 = this.hass.states[x2.entity];
        return {
          label: x2.name || e2 && e2.attributes.friendly_name || x2.entity || "New",
          what: x2.entity,
          icon: x2.icon || (x2.person ? "mdi:account" : key === "status_air" ? "mdi:thermometer" : "mdi:alert-circle-outline")
        };
      },
      (x2, put) => Z`
      <ha-form .hass=${this.hass} .data=${toForm(x2)} .schema=${schema} .computeLabel=${edLabel}
        @value-changed=${(ev) => put(tidy({ ...fromForm(ev.detail.value), popup: x2.popup }))}></ha-form>
      <overlook-popup-editor .hass=${this.hass} .value=${x2.popup} .label=${help}
        @value-changed=${(ev) => put(tidy({ ...x2, popup: ev.detail.value }))}></overlook-popup-editor>`,
      (a2) => this._patch({ [key]: a2.length ? a2 : void 0 })
    );
  }
  render() {
    if (!this._ready || !this.hass || !this._config) return J;
    const pillTo = (x2) => {
      const { popup, when, ...d2 } = x2;
      return { ...d2, show_when: when };
    };
    const pillFrom = (d2) => {
      const { show_when, ...x2 } = d2;
      return tidy({ ...x2, when: show_when });
    };
    const readTo = (x2) => {
      const { popup, ...d2 } = x2;
      return recolour(d2, toRgb);
    };
    const readFrom = (d2) => tidy(recolour(d2, toHex));
    return Z`
      <div class="ed-group" style="margin-top:0"><h3><ha-icon icon="mdi:account-multiple"></ha-icon>People and alerts</h3>
        <p>People always show. Anything else shows only while it's on.</p>
        ${this._items("status", PILL_SCHEMA, {}, pillTo, pillFrom)}
        <div class="ed-add"><button class="ed-chip" @click=${() => this._patch({ status: [...this._config.status || [], { entity: "" }] })}>
          <ha-icon icon="mdi:plus"></ha-icon>Add a pill</button></div></div>
      <div class="ed-group"><h3><ha-icon icon="mdi:thermometer"></ha-icon>Readings</h3>
        <p>Each shows the lowest and highest of its sensors.</p>
        ${this._items("status_air", READING_SCHEMA, {}, readTo, readFrom)}
        <div class="ed-add"><button class="ed-chip" @click=${() => this._patch({ status_air: [...this._config.status_air || [], { entity: "" }] })}>
          <ha-icon icon="mdi:plus"></ha-icon>Add a reading</button></div></div>`;
  }
};
if (!customElements.get("overlook-status-editor")) customElements.define("overlook-status-editor", OverlookStatusEditor);
customElements.get("overlook-tile").getConfigElement = () => document.createElement("overlook-tile-editor");
customElements.get("overlook-status").getConfigElement = () => document.createElement("overlook-status-editor");
window.customCards = window.customCards || [];
window.customCards.push(
  { type: "overlook-tile", name: "Overlook tile", description: "One light, switch, speaker, heat pump, plant, reading or scene", preview: true },
  { type: "overlook-heading", name: "Overlook room heading", description: "A room's name with its all-lights button", preview: true },
  { type: "overlook-scenes", name: "Overlook scenes", description: "The row of scene buttons" },
  { type: "overlook-status", name: "Overlook status", description: "People, alerts and the house readings" },
  { type: "overlook-edit-button", name: "Overlook edit button", description: "Hides HA's header; an Edit dashboard button at the bottom" }
);
window.customCards = window.customCards || [];
window.customCards.push({ type: "overlook-show", name: "Overlook Show", description: "Full-screen kitchen display" });
window.addEventListener("keydown", (e2) => {
  if (e2.code !== "Power") return;
  let a2 = document.activeElement;
  while (a2 && a2.shadowRoot && a2.shadowRoot.activeElement) a2 = a2.shadowRoot.activeElement;
  if (a2 && a2.blur) a2.blur();
}, true);
console.info(`%c overlook-show ${VERSION} `, "background:#1d5cf0;color:#fff;border-radius:4px");
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
