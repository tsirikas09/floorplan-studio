/* Floorplan Studio card - v0.1.0
 * Renders a floor plan from the descriptor stored by the floorplan_studio integration.
 *   type: custom:floorplan-studio-card
 *   floor: g                  # floor id from the descriptor
 *   orientation: auto         # auto | landscape | portrait   (auto = portrait on narrow cards)
 *   title: Ισόγειο            # optional
 */
const CARD_VERSION = "0.1.0";
const COLORS = { on: "#ffc56b", green: "#6fe3a0", blue: "#5ec8ff", orange: "#ff8a4c", violet: "#b69cff", amber: "#ffd45e" };
const LIGHT_KINDS = ["ceiling", "lamp", "strip", "spot"];
const DEFAULT_COLOR = { socket: "green", washer: "blue", valve: "blue", boiler: "orange", tv: "violet", ac: "blue", person: "green", camera: "green", bell: "green" };
const POWER_ON_W = 2;      // a socket above this load counts as "connected"
const WASH_W = 8;          // a washer above this load counts as "washing"

/* 64x64 glyphs. Strokes follow currentColor, fills follow --gf. */
const FILL = 'style="fill:var(--gf)"';
const GLYPH = {
  ceiling: `<line x1="32" y1="11" x2="32" y2="19"/><path ${FILL} d="M18 37 A14 14 0 0 1 46 37 Z"/><line x1="16" y1="37" x2="48" y2="37"/><path d="M25 43 L23 49 M32 43 L32 51 M39 43 L41 49"/>`,
  lamp: `<path ${FILL} d="M23 17 L41 17 L47 36 L17 36 Z"/><line x1="32" y1="36" x2="32" y2="47"/><path d="M24 48 Q32 44 40 48"/>`,
  strip: `<rect ${FILL} x="11" y="26" width="42" height="12" rx="6"/><circle cx="20" cy="32" r="1.7" fill="currentColor" stroke="none"/><circle cx="32" cy="32" r="1.7" fill="currentColor" stroke="none"/><circle cx="44" cy="32" r="1.7" fill="currentColor" stroke="none"/><path d="M18 43 L18 48 M32 43 L32 50 M46 43 L46 48"/>`,
  spot: `<path ${FILL} d="M22 15 H42 L39 26 H25 Z"/><path d="M26 32 L19 48 M32 32 L32 50 M38 32 L45 48"/>`,
  socket: `<rect ${FILL} x="17" y="17" width="30" height="30" rx="9"/><circle cx="26" cy="30" r="2.2" fill="currentColor" stroke="none"/><circle cx="38" cy="30" r="2.2" fill="currentColor" stroke="none"/><path d="M28 39 H36"/>`,
  washer: `<rect ${FILL} x="15" y="11" width="34" height="42" rx="8"/><rect x="19" y="15" width="26" height="6" rx="3" style="fill:currentColor;opacity:.35" stroke="none"/><circle cx="32" cy="36" r="12"/><circle cx="32" cy="36" r="7" style="fill:currentColor;opacity:.25" stroke="none"/><g class="blades"><path d="M32 36 L32 29 M32 36 L38 39.5 M32 36 L26 39.5" stroke-width="3"/></g>`,
  valve: `<line x1="10" y1="42" x2="54" y2="42"/><rect ${FILL} x="23" y="33" width="18" height="18" rx="5"/><line x1="32" y1="33" x2="32" y2="20"/><line x1="23" y1="20" x2="41" y2="20"/>`,
  boiler: `<rect ${FILL} x="19" y="12" width="26" height="40" rx="11"/><path d="M32 22 C39 29 39 36 32 43 C25 36 25 29 32 22 Z"/><line x1="26" y1="48" x2="38" y2="48"/>`,
  tv: `<rect ${FILL} x="12" y="19" width="40" height="26" rx="5"/><path d="M23 51 H41 M32 45 V51"/>`,
  ac: `<rect ${FILL} x="11" y="19" width="42" height="18" rx="7"/><line x1="17" y1="32" x2="47" y2="32"/><path d="M20 42 q3 4 0 8 M32 42 q3 4 0 8 M44 42 q3 4 0 8"/>`,
  drop: `<path ${FILL} d="M32 12 C41 25 45 31 45 38 A13 13 0 0 1 19 38 C19 31 23 25 32 12 Z"/>`,
  bolt: `<path ${FILL} d="M36 11 L20 36 H31 L27 53 L45 27 H34 Z"/>`,
  camera: `<rect ${FILL} x="12" y="23" width="30" height="21" rx="6"/><circle cx="27" cy="33.5" r="5.5"/><path d="M42 30 L53 23 L53 44 L42 38"/>`,
  bell: `<rect ${FILL} x="21" y="12" width="22" height="40" rx="11"/><circle cx="32" cy="38" r="4.5" fill="currentColor" stroke="none"/><line x1="27" y1="23" x2="37" y2="23"/>`,
  thermo: `<path ${FILL} d="M27 35 V17 a5 5 0 0 1 10 0 V35 a10 10 0 1 1 -10 0 Z"/><line x1="32" y1="26" x2="32" y2="43"/>`,
  humidity: `<path ${FILL} d="M32 12 C41 25 45 31 45 38 A13 13 0 0 1 19 38 C19 31 23 25 32 12 Z"/><path d="M25 40 q3.5 -3.5 7 0 t7 0"/>`,
  sun: `<circle ${FILL} cx="32" cy="32" r="8.5"/>` + [0, 1, 2, 3, 4, 5, 6, 7].map(i => { const a = i * Math.PI / 4; return `<line x1="${(32 + 13 * Math.cos(a)).toFixed(1)}" y1="${(32 + 13 * Math.sin(a)).toFixed(1)}" x2="${(32 + 19 * Math.cos(a)).toFixed(1)}" y2="${(32 + 19 * Math.sin(a)).toFixed(1)}"/>`; }).join(""),
  person: `<circle ${FILL} cx="32" cy="22" r="7.5"/><path ${FILL} d="M18 51 a14 14 0 0 1 28 0"/>`,
};

const STYLE = `
:host{display:block}
ha-card{background:transparent;box-shadow:none;border:0}
.wrap{position:relative;border-radius:20px;overflow:hidden;background:radial-gradient(120% 90% at 30% 15%,#1a2138 0%,#0d1220 70%)}
.hd{display:flex;justify-content:space-between;align-items:flex-end;padding:18px 20px 0;gap:12px}
.ttl{font-size:34px;font-weight:300;color:#f1f4fb;line-height:1.05}
.cap{font-size:11px;letter-spacing:.38em;color:rgba(255,255,255,.4);margin-top:4px}
.btns{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
.btns button{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);color:#e8ecf6;border-radius:10px;padding:6px 12px;cursor:pointer;font:inherit;font-size:13px}
.btns button.pri{background:#ffc56b;color:#1b1405;border-color:#ffc56b;font-weight:600}
.btns button:disabled{opacity:.45;cursor:not-allowed}
.hint{padding:6px 20px 0;font-size:12px;color:#8d98b4}
svg.plan{display:block;width:100%;height:auto;touch-action:none}
.wall{fill:rgba(255,255,255,.05);stroke:#59627a;stroke-linejoin:round}
.outdoor{fill:rgba(255,255,255,.035);stroke:rgba(255,255,255,.14)}
.shape{fill:none;stroke:rgba(255,255,255,.26);stroke-linecap:round;stroke-linejoin:round}
.shape.green{fill:rgba(123,216,143,.12);stroke:rgba(123,216,143,.5)}
.shape.faint{stroke:rgba(255,255,255,.12)}
.divider{stroke:rgba(255,255,255,.12);stroke-linecap:round}
.rlabel{fill:rgba(255,255,255,.55);font-weight:600;text-anchor:middle;pointer-events:none}
.glow{opacity:0;transition:opacity .6s ease;pointer-events:none}
.glow.on{opacity:1}
.zone{fill:transparent;cursor:pointer}
.zone:hover{fill:rgba(255,255,255,.035)}
.dev{color:rgba(255,255,255,.82);--gf:none}
.dev .face{fill:rgba(255,255,255,.09);stroke:rgba(255,255,255,.32);stroke-width:1.6}
.dev .halo{fill:none;stroke:none}
.dev.on{color:var(--c);--gf:color-mix(in srgb,var(--c) 30%,transparent)}
.dev.on .face{fill:color-mix(in srgb,var(--c) 22%,transparent);stroke:var(--c);stroke-width:2.2}
.dev.on .halo{stroke:var(--c);stroke-opacity:.35;stroke-width:2.5}
.dev.washer .face{fill:#121a36;stroke:#5ea8ff;stroke-width:3}
.dev.washer{color:#8fc3ff}
.dev.washing{color:#38d0ff;--gf:rgba(56,208,255,.3)}
.dev.washing .face{stroke:#38d0ff;animation:pulse 1.6s ease-in-out infinite}
.dev.finished{color:#6fe3a0;--gf:rgba(111,227,160,.3)}
.dev.finished .face{stroke:#6fe3a0}
.dev.washing .blades{animation:spin .9s linear infinite;transform-box:fill-box;transform-origin:center}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{50%{stroke-opacity:.45}}
.dev.edit{cursor:grab}
.dev.sel{filter:drop-shadow(0 0 4px #5ec8ff)}
.dev.unavail{opacity:.45}
.hit{fill:transparent;cursor:pointer}
.watt{fill:#ffd45e;font-weight:700;text-anchor:middle;paint-order:stroke;stroke:rgba(0,0,0,.6);pointer-events:none}
.badge{display:none}
.badge.show{display:inline}
.vlabel{font-weight:700;text-anchor:middle;paint-order:stroke;stroke:rgba(0,0,0,.6)}
.chips{display:flex;flex-wrap:wrap;gap:10px;padding:0 18px 18px}
.chip{display:flex;align-items:center;gap:8px;padding:6px 12px 6px 8px;border-radius:999px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.14);color:#f1f4fb;font-weight:700;font-size:14px}
.chip.link{cursor:pointer}
.chip svg{width:26px;height:26px;flex:none}
.err{padding:24px;color:#ffb4b4}
`;

class FloorplanStudioCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._desc = null; this._floor = null; this._edit = false; this._dirty = false; this._sel = null;
    this._pos = {}; this._items = []; this._ro = null; this._lastW = 0; this._hass = null; this._loading = false; this._portrait = false;
  }
  static getStubConfig() { return { floor: "g" }; }
  setConfig(config) {
    if (!config || !config.floor) throw new Error("Συμπλήρωσε το floor (π.χ. floor: g)");
    this._config = Object.assign({ orientation: "auto" }, config);
    if (this._desc) this._build();
  }
  getCardSize() { return 8; }
  connectedCallback() {
    if (!this._ro && typeof ResizeObserver !== "undefined") {
      this._ro = new ResizeObserver(() => { const w = this.getBoundingClientRect().width; if (this._desc && Math.abs(w - this._lastW) > 8) this._build(); });
      this._ro.observe(this);
    }
  }
  disconnectedCallback() { if (this._ro) { this._ro.disconnect(); this._ro = null; } }
  set hass(hass) {
    const first = !this._hass; this._hass = hass;
    if (first || (!this._desc && !this._loading)) this._load();
    this._updateStates();
  }
  async _load() {
    if (!this._hass || this._loading) return; this._loading = true;
    try {
      this._desc = await this._hass.callWS({ type: "floorplan_studio/get_descriptor" });
      this._build();
    } catch (e) {
      this.shadowRoot.innerHTML = `<style>${STYLE}</style><ha-card><div class="err">Δεν φορτώθηκε ο περιγραφέας. Έχεις προσθέσει την integration "Floorplan Studio" στις Ρυθμίσεις → Συσκευές και υπηρεσίες;<br><small>${(e && e.message) || e}</small></div></ha-card>`;
    }
    this._loading = false;
  }

  /* ---------- geometry ---------- */
  _layoutBox() {
    const [x0, y0, w, h] = this._floor.plan.view;
    const width = this.getBoundingClientRect().width || 700; this._lastW = width;
    const o = this._config.orientation;
    this._portrait = o === "portrait" || (o === "auto" && width < 520);
    this._P = this._portrait ? (x, y) => [h - (y - y0), x - x0] : (x, y) => [x - x0, y - y0];
    this._vw = this._portrait ? h : w; this._vh = this._portrait ? w : h;
    this._scale = width / this._vw;
  }
  _build() {
    if (!this._desc || !this._config) return;
    this._floor = this._desc.floors.find(f => f.id === this._config.floor);
    if (!this._floor) { this.shadowRoot.innerHTML = `<style>${STYLE}</style><ha-card><div class="err">Δεν υπάρχει όροφος "${this._config.floor}" στον περιγραφέα.</div></ha-card>`; return; }
    this._layoutBox();
    const fl = this._floor, P = this._P, unit = 1 / this._scale;
    const px = (n) => (n * unit).toFixed(2);
    let defs = "", glow = "", walls = "", zones = "", shapes = "", labels = "";
    const rbox = {};
    fl.plan.rooms.forEach(r => {
      const pts = r.polygon.map(p => P(p[0], p[1]));
      const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
      const box = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; rbox[r.id] = box;
      const cx = (box[0] + box[2]) / 2, cy = (box[1] + box[3]) / 2, rad = Math.max(box[2] - box[0], box[3] - box[1]) * 0.75;
      const ps = pts.map(p => p.map(v => v.toFixed(1)).join(",")).join(" ");
      defs += `<radialGradient id="g-${r.id}" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${rad}"><stop offset="0" stop-color="#ffc56b" stop-opacity=".55"/><stop offset=".6" stop-color="#ffa733" stop-opacity=".22"/><stop offset="1" stop-color="#ff9a1f" stop-opacity=".10"/></radialGradient>`;
      glow += `<polygon class="glow" data-room="${r.id}" points="${ps}" fill="url(#g-${r.id})" stroke="#ffc56b" stroke-opacity=".75" stroke-width="${px(3)}" stroke-linejoin="round"/>`;
      if (r.style === "outdoor") walls += `<polygon class="outdoor" points="${ps}" stroke-width="${px(1.5)}" stroke-dasharray="${px(6)} ${px(8)}"/>`;
      zones += `<polygon class="zone" data-room="${r.id}" points="${ps}"><title>${r.name} · πάτα για όλες τις συσκευές</title></polygon>`;
    });
    (fl.plan.walls || []).forEach(poly => { walls += `<polygon class="wall" points="${poly.map(p => P(p[0], p[1]).map(v => v.toFixed(1)).join(",")).join(" ")}" stroke-width="${px(7)}"/>`; });
    (fl.plan.dividers || []).forEach(d => { const a = P(d[0], d[1]), b = P(d[2], d[3]); shapes += `<line class="divider" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke-width="${px(1.6)}" stroke-dasharray="${px(3)} ${px(9)}"/>`; });
    (fl.plan.shapes || []).forEach(s => { shapes += this._shape(s, px); });
    const fs = this._portrait ? 11 : 13, obstacles = [];
    fl.plan.rooms.forEach(r => {
      if (!r.label) return; const [lx, ly] = P(r.label[0], r.label[1]);
      labels += `<text class="rlabel" x="${lx}" y="${ly}" font-size="${px(fs)}" letter-spacing="${px(2.4)}">${r.name.toUpperCase()}</text>`;
      const wpx = (fs * 0.72 + 2.4) * r.name.length;
      obstacles.push([lx - (wpx / 2 + 2) * unit, ly - fs * unit, lx + (wpx / 2 + 2) * unit, ly + 4 * unit]);
    });
    const size = (this._portrait || this._lastW < 520 ? 30 : 36) * unit;
    this._items = this._placeDevices(fl, P, size, rbox, obstacles);
    const devs = this._items.map(it => this._devMarkup(it, px)).join("");
    const isAdmin = this._hass && this._hass.user && this._hass.user.is_admin;
    const btns = this._edit
      ? `<button class="pri" data-act="save" ${this._dirty ? "" : "disabled"}>Αποθήκευση</button><button data-act="cancel">Ακύρωση</button>`
      : (isAdmin ? `<button data-act="edit">Επεξεργασία θέσεων</button>` : "");
    this.shadowRoot.innerHTML = `<style>${STYLE}</style><ha-card><div class="wrap">
      <div class="hd"><div><div class="ttl">${this._config.title || fl.name}</div><div class="cap">${fl.caption || ""}</div></div><div class="btns">${btns}</div></div>
      ${this._edit ? '<div class="hint">Σύρε ένα εικονίδιο ή επίλεξέ το και χρησιμοποίησε τα βέλη (Shift: μεγαλύτερο βήμα). Μετά πάτα Αποθήκευση.</div>' : ""}
      <svg class="plan" viewBox="0 0 ${this._vw.toFixed(1)} ${this._vh.toFixed(1)}" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs>${walls}${shapes}${glow}${zones}${labels}<g class="devs">${devs}</g></svg>
      <div class="chips">${this._chips()}</div></div></ha-card>`;
    this._wire(); this._updateStates();
  }
  _shape(s, px) {
    const P = this._P, cls = "shape" + (s.green ? " green" : "") + (s.faint ? " faint" : ""), sw = px(2.2), dash = s.dash ? ` stroke-dasharray="${px(4)} ${px(6)}"` : "";
    if (s.t === "rect") {
      const a = P(s.x, s.y), b = P(s.x + s.w, s.y + s.h);
      return `<rect class="${cls}" x="${Math.min(a[0], b[0])}" y="${Math.min(a[1], b[1])}" width="${Math.abs(b[0] - a[0])}" height="${Math.abs(b[1] - a[1])}" rx="${s.r || 0}" stroke-width="${sw}"${dash}/>`;
    }
    if (s.t === "ellipse") { const c = P(s.cx, s.cy), rx = this._portrait ? s.ry : s.rx, ry = this._portrait ? s.rx : s.ry; return `<ellipse class="${cls}" cx="${c[0]}" cy="${c[1]}" rx="${rx}" ry="${ry}" stroke-width="${sw}"${dash}/>`; }
    if (s.t === "circle") { const c = P(s.cx, s.cy); return `<circle class="${cls}" cx="${c[0]}" cy="${c[1]}" r="${s.r}" stroke-width="${sw}"${dash}/>`; }
    if (s.t === "line") { const a = P(s.x1, s.y1), b = P(s.x2, s.y2); return `<line class="${cls}" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke-width="${px(1.6)}"/>`; }
    if (s.t === "arc") { const a = P(s.x1, s.y1), b = P(s.x2, s.y2); return `<path class="${cls}" d="M ${a[0]} ${a[1]} A ${s.r} ${s.r} 0 0 1 ${b[0]} ${b[1]}" stroke-width="${sw}" stroke-dasharray="${px(2)} ${px(7)}"/>`; }
    return "";
  }

  /* ---------- device layout with overlap avoidance ---------- */
  _placeDevices(fl, P, size, rbox, obstacles) {
    const unit = 1 / this._scale, items = [];
    fl.devices.forEach(d => {
      const pos = this._pos[d.id] || d.pos, [X, Y] = P(pos[0], pos[1]);
      const s = d.kind === "washer" ? size * (this._portrait ? 1.2 : 1.3) : (d.kind === "socket" ? size * 0.8 : size);
      let bb = [-s / 2, -s / 2, s / 2, s / 2];
      const lw = 46 * unit;
      if (d.power && !d.nobolt) bb = [-Math.max(s, lw) / 2, -s / 2 - 5 * unit, Math.max(s, lw) / 2 + 6 * unit, s / 2 + 15 * unit];
      if (d.hot) bb = [-26 * unit, -s / 2, 26 * unit, s / 2 + 16 * unit];
      if (d.flow) bb = [-s / 2, -s / 2, s / 2 + 72 * unit, s / 2];
      items.push({ d, x: X, y: Y, ox: X, oy: Y, s, bb, zone: rbox[d.popup_room || d.room] });
    });
    if (this._edit) return items;                       // raw positions while editing
    const rect = a => [a.x + a.bb[0], a.y + a.bb[1], a.x + a.bb[2], a.y + a.bb[3]];
    const ov = (r, q, m) => [Math.min(r[2], q[2]) - Math.max(r[0], q[0]) + m, Math.min(r[3], q[3]) - Math.max(r[1], q[1]) + m];
    const run = (slack) => {
      items.forEach(a => { a.x = a.ox; a.y = a.oy; });
      for (let it = 0; it < 900; it++) {
        let moved = false;
        for (let i = 0; i < items.length; i++) {
          const a = items[i];
          obstacles.forEach(q => {
            const r = rect(a), [ox, oy] = ov(r, q, 2 * unit);
            if (ox > 0 && oy > 0) { if (ox < oy) a.x += (r[0] + r[2]) / 2 < (q[0] + q[2]) / 2 ? -ox : ox; else a.y += (r[1] + r[3]) / 2 < (q[1] + q[3]) / 2 ? -oy : oy; moved = true; }
          });
          for (let j = i + 1; j < items.length; j++) {
            const b = items[j], ra = rect(a), rb = rect(b), [ox, oy] = ov(ra, rb, 3 * unit);
            if (ox > 0 && oy > 0) {
              if (ox < oy) { const sg = (ra[0] + ra[2]) / 2 >= (rb[0] + rb[2]) / 2 ? 1 : -1; a.x += sg * ox / 2; b.x -= sg * ox / 2; }
              else { const sg = (ra[1] + ra[3]) / 2 >= (rb[1] + rb[3]) / 2 ? 1 : -1; a.y += sg * oy / 2; b.y -= sg * oy / 2; }
              moved = true;
            }
          }
          const z = a.zone;
          if (z) {
            const sl = slack * unit, w = a.bb[2] - a.bb[0], h = a.bb[3] - a.bb[1];
            if (z[2] - z[0] + 2 * sl > w + 4 * unit) a.x = Math.min(Math.max(a.x, z[0] - sl - a.bb[0] + 2 * unit), z[2] + sl - a.bb[2] - 2 * unit);
            if (z[3] - z[1] + 2 * sl > h + 4 * unit) a.y = Math.min(Math.max(a.y, z[1] - sl - a.bb[1] + 2 * unit), z[3] + sl - a.bb[3] - 2 * unit);
          }
        }
        if (!moved) break;
      }
      let bad = 0;
      for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) { const [ox, oy] = ov(rect(items[i]), rect(items[j]), 0); if (ox > 0 && oy > 0) bad++; }
      return bad;
    };
    let best = null;
    for (const sl of [10, 14, 18, 24]) { const bad = run(sl); if (!best || bad < best.bad) best = { bad, sl }; if (bad === 0) break; }
    if (best.bad !== 0) run(best.sl);                   // re-run with the best slack if the last attempt was worse
    this._unresolved = best.bad;
    return items;
  }
  _devMarkup(it, px) {
    const d = it.d, s = it.s, k = s / 64, unit = 1 / this._scale;
    const c = COLORS[d.color || DEFAULT_COLOR[d.kind] || "on"] || COLORS.on;
    const tip = d.name + (d.popup ? " · πάτα για λεπτομέρειες" : (d.tap === "more-info" ? " · πάτα για ρυθμίσεις" : " · πάτα: ενεργοποίηση/απενεργοποίηση · κράτημα: ρυθμίσεις"));
    let extra = "";
    if (d.power && !d.nobolt) {
      extra += `<g class="badge" data-badge="${d.id}"><circle cx="${(s * 0.42).toFixed(2)}" cy="${(-s * 0.42).toFixed(2)}" r="${(s * 0.2).toFixed(2)}" fill="#1b2236" stroke="#ffd45e" stroke-width="${px(1.6)}"/><path transform="translate(${(s * 0.42 - s * 0.14).toFixed(2)} ${(-s * 0.42 - s * 0.16).toFixed(2)}) scale(${(s * 0.28 / 64).toFixed(4)})" d="M36 6 L18 36 H31 L27 58 L46 26 H34 Z" fill="#ffd45e"/></g>`;
      extra += `<text class="watt badge" data-watt="${d.id}" y="${(s / 2 + 11 * unit).toFixed(2)}" font-size="${px(11)}" stroke-width="${px(2.5)}"></text>`;
    }
    if (d.hot) extra += `<text class="vlabel" data-hot="${d.id}" y="${(s / 2 + 11 * unit).toFixed(2)}" font-size="${px(11)}" stroke-width="${px(2.5)}" fill="#ff9a5c"></text>`;
    if (d.flow) extra += `<text class="vlabel" data-flow="${d.id}" x="${(s / 2 + 36 * unit).toFixed(2)}" y="${(4 * unit).toFixed(2)}" font-size="${px(11)}" stroke-width="${px(2.5)}" fill="#7fd4ff"></text>`;
    return `<g class="dev ${d.kind}" data-id="${d.id}" tabindex="0" style="--c:${c}" transform="translate(${it.x.toFixed(2)} ${it.y.toFixed(2)})"><title>${tip}</title>
      <g transform="scale(${k.toFixed(4)})"><circle class="halo" r="31.5"/><circle class="face" r="29.5"/><g transform="translate(-32 -32)" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">${GLYPH[d.kind] || GLYPH.socket}</g></g>
      <circle class="hit" r="${(s / 2).toFixed(2)}"/>${extra}</g>`;
  }
  _chips() {
    const r = this._floor.readouts || {};
    const chip = (kind, ent, color, popup, tip) => ent ? `<div class="chip ${popup ? "link" : ""}" data-chip="${ent}" data-popup="${popup || ""}" title="${tip}"><svg viewBox="0 0 64 64" style="--gf:color-mix(in srgb,${color} 30%,transparent);color:${color}"><circle cx="32" cy="32" r="29.5" style="fill:color-mix(in srgb,${color} 22%,transparent);stroke:${color};stroke-width:2.2"/><g fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">${GLYPH[kind]}</g></svg><span class="cv">…</span></div>` : "";
    return chip("bolt", r.power, COLORS.on, r.power_popup, "Κατανάλωση ρεύματος ορόφου") + chip("drop", r.water, COLORS.blue, r.water_popup, "Ροή νερού")
      + chip("person", r.presence, COLORS.green, r.info_popup, "Παρουσία") + chip("sun", r.illuminance, COLORS.amber, r.info_popup, "Φωτεινότητα")
      + chip("thermo", r.temperature, COLORS.orange, r.info_popup, "Θερμοκρασία") + chip("humidity", r.humidity, COLORS.blue, r.info_popup, "Υγρασία");
  }

  /* ---------- state ---------- */
  _fmt(entId) {
    const st = this._hass.states[entId]; if (!st) return "—";
    if (this._hass.formatEntityState) { try { return this._hass.formatEntityState(st); } catch (e) { /* fall through */ } }
    const u = st.attributes.unit_of_measurement || "", n = parseFloat(st.state);
    return isNaN(n) ? st.state : `${Math.round(n * 10) / 10} ${u}`.trim();
  }
  _num(entId) { const st = entId && this._hass.states[entId]; const n = st ? parseFloat(st.state) : NaN; return isNaN(n) ? 0 : n; }
  _updateStates() {
    if (!this._hass || !this._floor || !this.shadowRoot.querySelector("svg.plan")) return;
    const H = this._hass, root = this.shadowRoot, roomOn = {};
    this._items.forEach(it => {
      const d = it.d, g = root.querySelector(`.dev[data-id="${d.id}"]`); if (!g) return;
      const st = d.entity ? H.states[d.entity] : null, s = st ? st.state : null;
      let on = false, mode = "";
      if (d.kind === "washer") {
        const status = d.status && H.states[d.status] ? H.states[d.status].state : null;
        mode = status || (this._num(d.power) > WASH_W ? "washing" : "idle");
      } else if (d.kind === "ac") { on = !!s && !["off", "unavailable", "unknown"].includes(s); g.style.setProperty("--c", s === "heat" ? COLORS.orange : COLORS.blue); }
      else if (d.kind === "tv") on = !!s && !["off", "standby", "unavailable", "unknown"].includes(s);
      else if (d.entity) on = s === "on";
      else on = true;                                                                    // static icons (camera, doorbell)
      g.classList.toggle("on", on);
      g.classList.toggle("unavail", !!d.entity && (!st || s === "unavailable"));
      g.classList.toggle("washing", mode === "washing"); g.classList.toggle("finished", mode === "finished");
      if (on && LIGHT_KINDS.includes(d.kind) && d.entity) roomOn[d.room] = true;
      if (d.power && !d.nobolt) {
        const w = this._num(d.power), show = w > POWER_ON_W;
        root.querySelectorAll(`[data-badge="${d.id}"],[data-watt="${d.id}"]`).forEach(e => e.classList.toggle("show", show));
        const t = root.querySelector(`[data-watt="${d.id}"]`); if (t) t.textContent = `${Math.round(w)} W`;
      }
      if (d.hot) { const t = root.querySelector(`[data-hot="${d.id}"]`); if (t) t.textContent = this._fmt(d.hot); }
      if (d.flow) { const t = root.querySelector(`[data-flow="${d.id}"]`); if (t) t.textContent = this._fmt(d.flow); }
    });
    root.querySelectorAll(".glow").forEach(g => g.classList.toggle("on", !!roomOn[g.dataset.room]));
    root.querySelectorAll(".chip").forEach(c => {
      const ent = c.dataset.chip, st = H.states[ent], el = c.querySelector(".cv"); if (!el) return;
      el.textContent = ent.startsWith("binary_sensor.") && st && ["on", "off"].includes(st.state) ? (st.state === "on" ? "Εντοπίστηκε" : "Καμία") : this._fmt(ent);
    });
  }

  /* ---------- interaction ---------- */
  _wire() {
    const root = this.shadowRoot;
    root.querySelectorAll("[data-act]").forEach(b => b.addEventListener("click", () => this._act(b.dataset.act)));
    root.querySelectorAll(".chip.link").forEach(c => c.addEventListener("click", () => this._navigate(c.dataset.popup)));
    root.querySelectorAll(".zone").forEach(z => z.addEventListener("click", () => {
      if (this._edit) return; const r = this._floor.plan.rooms.find(x => x.id === z.dataset.room); if (r && r.popup) this._navigate(r.popup);
    }));
    root.querySelectorAll(".dev").forEach(g => {
      const d = this._floor.devices.find(x => x.id === g.dataset.id); let timer = null, held = false, drag = null;
      if (this._edit) g.classList.add("edit");
      if (this._sel === d.id) g.classList.add("sel");
      g.addEventListener("pointerdown", ev => {
        if (this._edit) { ev.preventDefault(); this._select(d.id); drag = { x: ev.clientX, y: ev.clientY, base: (this._pos[d.id] || d.pos).slice() }; try { g.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ } return; }
        held = false; timer = setTimeout(() => { held = true; if (d.entity) this._moreInfo(d.entity); }, 550);
      });
      g.addEventListener("pointermove", ev => {
        if (!this._edit || !drag) return;
        const k = this._scale, dx = (ev.clientX - drag.x) / k, dy = (ev.clientY - drag.y) / k;
        const [mx, my] = this._portrait ? [dy, -dx] : [dx, dy];                          // inverse of the portrait rotation
        this._setPos(d.id, [drag.base[0] + mx, drag.base[1] + my]); this._moveNode(g, d.id);
      });
      g.addEventListener("pointerup", () => { clearTimeout(timer); drag = null; });
      g.addEventListener("pointercancel", () => { clearTimeout(timer); drag = null; });
      g.addEventListener("click", () => { if (this._edit || held) return; this._tap(d); });
      g.addEventListener("keydown", ev => {
        if (!this._edit) return; const m = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[ev.key]; if (!m) return;
        ev.preventDefault(); const st = ev.shiftKey ? 2 : 0.4, base = this._pos[d.id] || d.pos;
        const [mx, my] = this._portrait ? [m[1], -m[0]] : m; this._setPos(d.id, [base[0] + mx * st, base[1] + my * st]); this._moveNode(g, d.id);
      });
    });
  }
  _select(id) { this._sel = id; this.shadowRoot.querySelectorAll(".dev").forEach(g => g.classList.toggle("sel", g.dataset.id === id)); }
  _setPos(id, p) { this._pos[id] = [Math.round(p[0] * 100) / 100, Math.round(p[1] * 100) / 100]; this._dirty = true; const b = this.shadowRoot.querySelector('[data-act="save"]'); if (b) b.disabled = false; }
  _moveNode(g, id) { const p = this._P(...this._pos[id]); g.setAttribute("transform", `translate(${p[0].toFixed(2)} ${p[1].toFixed(2)})`); }
  _tap(d) {
    if (d.popup) return this._navigate(d.popup);
    if (!d.entity) return;
    if (d.tap === "more-info") return this._moreInfo(d.entity);
    const st = this._hass.states[d.entity];
    if ((d.kind === "socket" || d.kind === "washer") && d.power && this._num(d.power) > POWER_ON_W && st && st.state === "on") {
      if (!window.confirm(`Η «${d.name}» καταναλώνει ρεύμα αυτή τη στιγμή. Είσαι σίγουρος ότι θέλεις να την απενεργοποιήσεις;`)) return;
    }
    this._hass.callService("homeassistant", "toggle", { entity_id: d.entity });
  }
  _moreInfo(entityId) { this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true })); }
  _navigate(hash) {
    if (!hash) return;
    history.pushState(null, "", `${location.pathname}${location.search}#${hash}`);
    window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }
  async _act(a) {
    if (a === "edit") { this._edit = true; this._dirty = false; this._pos = {}; this._build(); }
    else if (a === "cancel") { this._edit = false; this._pos = {}; this._dirty = false; this._build(); }
    else if (a === "save") {
      const desc = JSON.parse(JSON.stringify(this._desc)), fl = desc.floors.find(f => f.id === this._config.floor);
      fl.devices.forEach(d => { if (this._pos[d.id]) d.pos = this._pos[d.id]; });
      try { await this._hass.callWS({ type: "floorplan_studio/save_descriptor", descriptor: desc }); this._desc = desc; this._edit = false; this._pos = {}; this._dirty = false; this._build(); }
      catch (e) { window.alert("Η αποθήκευση απέτυχε: " + ((e && e.message) || e)); }
    }
  }
}
if (!customElements.get("floorplan-studio-card")) customElements.define("floorplan-studio-card", FloorplanStudioCard);
window.customCards = window.customCards || [];
if (!window.customCards.some(c => c.type === "floorplan-studio-card")) window.customCards.push({ type: "floorplan-studio-card", name: "Floorplan Studio", description: "Διαδραστική κάτοψη σπιτιού με έλεγχο συσκευών και επεξεργασία θέσεων.", preview: false });
console.info(`%c FLOORPLAN-STUDIO %c v${CARD_VERSION} `, "background:#ffc56b;color:#1b1405;font-weight:700", "background:#1b2236;color:#ffc56b");
