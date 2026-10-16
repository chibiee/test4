/* ==========================================================
   particles.js — drifting golden light, and the heart halo.

   * Ambient particles drift slowly through the whole scene.
   * Heart particles emerge, drift, then are gently pulled toward
     targets spread along a heart curve (outside the photo area).
   * Layout (heart size / position, photo box, text region) is
     computed here so the heart, photo and text always agree.
   ========================================================== */
(function () {
  'use strict';
  const G = (window.FamilyLetter = window.FamilyLetter || {});

  const TAU = Math.PI * 2;
  // warm gold, champagne, ivory, amber, pale gold
  const PALETTE = [[255, 216, 150], [246, 224, 182], [255, 246, 228], [233, 184, 104], [255, 232, 196]];

  const rand = function (a, b) { return a + Math.random() * (b - a); };
  const clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  const smooth = function (t) { return t * t * (3 - 2 * t); };

  /* ---------- Heart curve, sampled by arc length ---------- */
  const HEART = (function () {
    const N = 900;
    const pts = [];
    const cum = [0];
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * TAU;
      const s = Math.sin(t);
      pts.push({
        x: 16 * s * s * s,
        y: 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)
      });
    }
    for (let i = 1; i <= N; i++) {
      cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    }
    const total = cum[N];
    // outward-facing unit normals (centre of the heart is about y = -2.5)
    const nrm = pts.map(function (p, i) {
      const a = pts[Math.max(0, i - 1)];
      const b = pts[Math.min(N, i + 1)];
      let tx = b.x - a.x;
      let ty = b.y - a.y;
      const l = Math.hypot(tx, ty) || 1;
      tx /= l; ty /= l;
      let nx = ty;
      let ny = -tx;
      if (nx * p.x + ny * (p.y + 2.5) < 0) { nx = -nx; ny = -ny; }
      return { nx: nx, ny: ny };
    });
    function at(u) {
      const L = u * total;
      let lo = 0;
      let hi = N;
      while (hi - lo > 1) {
        const m = (lo + hi) >> 1;
        if (cum[m] <= L) lo = m; else hi = m;
      }
      const seg = cum[hi] - cum[lo] || 1;
      const f = (L - cum[lo]) / seg;
      return {
        x: pts[lo].x + (pts[hi].x - pts[lo].x) * f,
        y: pts[lo].y + (pts[hi].y - pts[lo].y) * f,
        nx: nrm[lo].nx + (nrm[hi].nx - nrm[lo].nx) * f,
        ny: nrm[lo].ny + (nrm[hi].ny - nrm[lo].ny) * f
      };
    }
    return { at: at };
  })();

  /* ---------- Layout ---------- */
  // Band (heart + halo) is about 34.4 units wide and 31.5 units tall (before horizontal stretch).
  const BAND_W = 34.4;
  const BAND_H = 31.5;
  const TOP_UNITS = 13.3; // distance from band top to the heart's y = 0 line

  // Photograph box, in heart units, sits comfortably inside the heart outline.
  function photoRect(core) {
    return {
      cx: core.cx,
      cy: core.y0 + 1.0 * core.s,
      w: 18.0 * core.stretch * core.s,
      h: 10.4 * core.s
    };
  }

  function computeLayout(w, h, phase) {
    const wide = w / h >= 1.3;
    const stretch = wide ? 1.1 : 1.0;
    const UW = BAND_W * stretch;
    let s;
    let cx;
    let heartTop;
    let text;

    if (wide) {
      if (phase === 'letter') {
        s = Math.min((h * 0.86) / BAND_H, (w * 0.52) / UW);
        cx = w * 0.035 + (UW * s) / 2;
      } else {
        s = Math.min((h * 0.64) / BAND_H, (w * 0.6) / UW);
        cx = w / 2;
      }
      heartTop = (h - BAND_H * s) / 2;
      const heartRight = w * 0.035 + UW * Math.min((h * 0.86) / BAND_H, (w * 0.52) / UW);
      const tl = heartRight + w * 0.04;
      text = { left: tl, top: h * 0.08, width: Math.max(260, w * 0.965 - tl), height: h * 0.82 };
    } else {
      s = Math.min((h * 0.55) / BAND_H, (w * 0.94) / UW);
      cx = w / 2;
      heartTop = Math.max(h * 0.05, 24);
      const tt = heartTop + BAND_H * s + Math.max(h * 0.025, 14);
      text = { left: w * 0.07, top: tt, width: w * 0.86, height: Math.max(120, h - tt - 56) };
    }
    return {
      core: { cx: cx, y0: heartTop + TOP_UNITS * s, s: s, stretch: stretch },
      text: text,
      wide: wide
    };
  }

  /* ---------- Glow sprites (pre-rendered, so drawing stays cheap) ---------- */
  function makeSprite(rgb) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    const col = rgb.join(',');
    g.addColorStop(0, 'rgba(' + col + ',1)');
    g.addColorStop(0.12, 'rgba(' + col + ',.95)');
    g.addColorStop(0.3, 'rgba(' + col + ',.32)');
    g.addColorStop(0.6, 'rgba(' + col + ',.07)');
    g.addColorStop(1, 'rgba(' + col + ',0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 64, 64);
    return c;
  }

  /* ---------- The particle field ---------- */
  function Field(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
    this.dprCap = 1.5;
    this.ema = 0.016; this.slow = 0; this.quality = 0; this.thin = false;
    this.reduced = false;
    this.running = false;
    this.time = 0;
    this.last = 0;
    this.raf = 0;
    this.low = ((navigator.hardwareConcurrency || 8) <= 4) || window.innerWidth < 700;
    this.sprites = PALETTE.map(makeSprite);
    this.phase = 'center';
    this.warmth = 0; this.warmGoal = 0;
    this.amb = 0; this.ambGoal = 0;
    this.px = 0; this.py = 0; this.tpx = 0; this.tpy = 0;
    this.heartOn = false;
    this.formed = false;
    this.heartT0 = 0;
    this.formedPromise = null;
    this._resolveFormed = null;
    this.onLayout = null;
    this._lastEmit = null;
    this.ambient = [];
    this.heart = [];
    this.w = window.innerWidth;
    this.h = window.innerHeight;

    this._measure();
    this._build();

    const self = this;
    this._onPointer = function (e) {
      self.tpx = e.clientX / self.w - 0.5;
      self.tpy = e.clientY / self.h - 0.5;
    };
    this._resizeQueued = false;
    this._onResize = function () {
      if (self._resizeQueued) return;
      self._resizeQueued = true;
      requestAnimationFrame(function () {
        self._resizeQueued = false;
        self._resize();
      });
    };
    this._loop = function (ts) {
      if (!self.running) return;
      const raw = (ts - self.last) / 1000 || 0.016;
      const dt = Math.min(0.05, raw);
      self.last = ts;
      if (self.time > 2) self._watchPerf(raw);
      self._update(dt);
      self._draw();
      self.raf = requestAnimationFrame(self._loop);
    };
    window.addEventListener('pointermove', this._onPointer, { passive: true });
    window.addEventListener('resize', this._onResize);
  }

  // Canvas pixel size. Soft glowing dots look the same at 1.5x as at 2x, and cost far less.
  Field.prototype._sizeCanvas = function () {
    this.dpr = Math.min(window.devicePixelRatio || 1, this.dprCap);
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  };

  Field.prototype._measure = function () {
    this._sizeCanvas();
    this.goal = computeLayout(this.w, this.h, this.phase);
    this.now = Object.assign({}, this.goal.core);
  };

  // Automatic quality fallback: if frames stay slow, first lower the canvas resolution,
  // then draw fewer of the faintest particles. The look stays the same, just lighter.
  Field.prototype._watchPerf = function (rawDt) {
    this.ema = this.ema * 0.95 + Math.min(rawDt, 0.1) * 0.05;
    if (this.ema > 0.026) this.slow++; else this.slow = Math.max(0, this.slow - 2);
    if (this.slow > 90 && this.quality < 2) {
      this.quality++;
      this.slow = 0;
      this.ema = 0.016;
      if (this.quality === 1) { this.dprCap = 1; this._sizeCanvas(); }
      else this.thin = true;
    }
  };

  Field.prototype._build = function () {
    const ambientCount = this.low ? 36 : 70;
    const heartCount = this.low ? 300 : 560;
    let i;
    for (i = 0; i < ambientCount; i++) {
      this.ambient.push({
        x: rand(0, this.w), y: rand(0, this.h),
        vx: rand(-3, 3), vy: rand(-8, -1.5),
        size: rand(0.5, 1.5),
        ci: (Math.random() * PALETTE.length) | 0,
        phase: rand(0, TAU), tw: rand(0.25, 0.8),
        depth: rand(0.2, 1), base: rand(0.2, 0.55),
        warm: Math.random() < 0.35
      });
    }
    for (i = 0; i < heartCount; i++) {
      const u = (i + Math.random()) / heartCount;
      const off = Math.pow(Math.random(), 1.7) * 1.05 + 0.08; // outward from the curve, never inside
      const f = HEART.at(u);
      this.heart.push({
        bx: f.x + f.nx * off, by: f.y + f.ny * off,
        x: rand(0, this.w), y: rand(0, this.h),
        vx: 0, vy: 0,
        size: rand(0.6, 2.0) * (Math.random() < 0.07 ? 1.5 : 1),
        ci: (Math.random() * PALETTE.length) | 0,
        phase: rand(0, TAU), phase2: rand(0, TAU),
        f1: rand(0.4, 1.1), f2: rand(0.4, 1.1), amp: rand(0.8, 2.6),
        ta: rand(0, 4.5), tg: rand(3, 9.5), td: rand(5, 8),
        k: rand(0.7, 1.3), tw: rand(0.5, 1.4), base: rand(0.45, 1),
        drifter: Math.random() < 0.14,
        state: 'attached', stateT: 0, riseAt: Infinity,
        appear: 0, fade: 1, a: 0
      });
    }
  };

  Field.prototype._resize = function () {
    const ow = this.w;
    const oh = this.h;
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    const kx = this.w / ow;
    const ky = this.h / oh;
    this.ambient.forEach(function (p) { p.x *= kx; p.y *= ky; });
    this.heart.forEach(function (p) { p.x *= kx; p.y *= ky; });
    this._measure();
    this._emit(true);
  };

  Field.prototype._emit = function (force) {
    const n = this.now;
    const l = this._lastEmit;
    if (!force && l && Math.abs(n.cx - l.cx) + Math.abs(n.y0 - l.y0) + Math.abs(n.s - l.s) < 0.02) return;
    this._lastEmit = { cx: n.cx, y0: n.y0, s: n.s };
    if (this.onLayout) this.onLayout(n, this.goal);
  };

  /* ----- public API ----- */
  Field.prototype.start = function () {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this._loop);
    this._emit(true);
  };
  Field.prototype.setReduced = function (v) { this.reduced = !!v; };
  Field.prototype.setWarmth = function (v) { this.warmGoal = v; };
  Field.prototype.setAmbient = function (v) { this.ambGoal = v; };
  Field.prototype.setPhase = function (phase) {
    this.phase = phase;
    this.goal = computeLayout(this.w, this.h, phase);
  };
  Field.prototype.beginHeart = function () {
    const self = this;
    this.heartOn = true;
    this.formed = false;
    this.heartT0 = this.time;
    this.formedPromise = new Promise(function (r) { self._resolveFormed = r; });
    return this.formedPromise;
  };
  Field.prototype.whenFormed = function () {
    return this.formedPromise || Promise.resolve();
  };
  Field.prototype.destroy = function () {
    this.running = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('pointermove', this._onPointer);
    window.removeEventListener('resize', this._onResize);
  };

  /* ----- simulation ----- */
  Field.prototype._update = function (dt) {
    const t = (this.time += dt);
    const g = this.goal.core;
    const n = this.now;

    // layout glide (heart slides to make room for the letter)
    if (this.reduced) {
      n.cx = g.cx; n.y0 = g.y0; n.s = g.s; n.stretch = g.stretch;
    } else {
      const k = 1 - Math.exp(-dt * 1.15);
      n.cx += (g.cx - n.cx) * k;
      n.y0 += (g.y0 - n.y0) * k;
      n.s += (g.s - n.s) * k;
      n.stretch = g.stretch;
    }
    this._emit(false);

    this.warmth += (this.warmGoal - this.warmth) * (1 - Math.exp(-dt * 0.4));
    this.amb += (this.ambGoal - this.amb) * (1 - Math.exp(-dt * 0.5));
    const kp = 1 - Math.exp(-dt * 2);
    this.px += (this.tpx - this.px) * kp;
    this.py += (this.tpy - this.py) * kp;

    if (!this.reduced) {
      const w = this.w;
      const h = this.h;
      for (let i = 0; i < this.ambient.length; i++) {
        const a = this.ambient[i];
        a.x += (a.vx + Math.sin(t * 0.25 + a.phase) * 5) * dt;
        a.y += a.vy * dt;
        if (a.y < -12) { a.y = h + 12; a.x = rand(0, w); }
        if (a.x < -12) a.x = w + 12;
        if (a.x > w + 12) a.x = -12;
      }
    }
    if (this.heartOn) this._updateHeart(dt, t);
  };

  Field.prototype._updateHeart = function (dt, t) {
    const th = t - this.heartT0;
    const L = this.now;
    const sx = L.s * L.stretch;
    const sy = L.s;
    const ccy = L.y0 + 2.5 * sy;
    const pulse = this.reduced ? 1 : 1 + 0.007 * Math.sin(t * 1.05);
    const swayK = L.s / 20;
    const K = 3.4;
    const C = 3.3;
    let sumW = 0;
    let cnt = 0;

    for (let i = 0; i < this.heart.length; i++) {
      const p = this.heart[i];
      p.appear = smooth(clamp((th - p.ta) / 2.2, 0, 1));
      let w = this.reduced ? 1 : smooth(clamp((th - p.tg) / p.td, 0, 1));
      p.fade = 1;

      // a few particles slowly rise away after the heart has formed, then return
      if (p.drifter && this.formed && !this.reduced) {
        if (p.state === 'attached' && th > p.riseAt) {
          p.state = 'rising'; p.stateT = 0;
        } else if (p.state === 'rising') {
          p.stateT += dt;
          if (p.stateT >= 4.8) {
            p.state = 'returning'; p.stateT = 0;
            p.x = L.cx + p.bx * sx; p.y = L.y0 - p.by * sy;
            p.vx = 0; p.vy = 0;
          }
        } else if (p.state === 'returning') {
          p.stateT += dt;
          if (p.stateT >= 3.2) { p.state = 'attached'; p.riseAt = th + rand(6, 18); }
        }
        if (p.state === 'rising') p.fade = 1 - smooth(p.stateT / 4.8);
        else if (p.state === 'returning') p.fade = smooth(p.stateT / 3.2);
      }

      let tx = L.cx + p.bx * sx;
      let ty = L.y0 - p.by * sy;
      tx = L.cx + (tx - L.cx) * pulse;
      ty = ccy + (ty - ccy) * pulse;

      if (this.reduced) {
        p.x = tx; p.y = ty;
        sumW += 1; cnt++;
      } else {
        let ax;
        let ay;
        if (p.state === 'rising') {
          ax = (Math.sin(t * 0.5 + p.phase) * 5 - p.vx) * 0.9;
          ay = (-18 - p.vy) * 0.7;
        } else {
          tx += Math.sin(t * p.f1 + p.phase) * p.amp * swayK;
          ty += Math.cos(t * p.f2 + p.phase2) * p.amp * swayK;
          const fx = Math.sin(t * 0.35 + p.phase + p.y * 0.004) * 16;
          const fy = Math.cos(t * 0.3 + p.phase2 + p.x * 0.004) * 11 - 3;
          ax = (1 - w) * (fx - p.vx) * 0.8 + w * ((tx - p.x) * K * p.k - p.vx * C);
          ay = (1 - w) * (fy - p.vy) * 0.8 + w * ((ty - p.y) * K * p.k - p.vy * C);
          sumW += w; cnt++;
        }
        p.vx += ax * dt; p.vy += ay * dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
      }
      p.a = p.appear * p.base * (this.reduced ? 0.9 : 0.7 + 0.3 * Math.sin(t * p.tw + p.phase)) * p.fade;
    }

    if (!this.formed && cnt && sumW / cnt > 0.84 && th > 6) {
      this.formed = true;
      for (let j = 0; j < this.heart.length; j++) {
        if (this.heart[j].drifter) this.heart[j].riseAt = th + rand(1, 16);
      }
      if (this._resolveFormed) this._resolveFormed();
    }
  };

  /* ----- drawing ----- */
  Field.prototype._draw = function () {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);
    const t = this.time;
    const warm = this.warmth;
    let i;

    for (i = 0; i < this.ambient.length; i++) {
      const a = this.ambient[i];
      const tw = this.reduced ? 1 : 0.6 + 0.4 * Math.sin(t * a.tw + a.phase);
      let alpha = a.base * tw * this.amb * (1 + warm * 0.8);
      if (a.warm) alpha *= warm;
      if (alpha < 0.01) continue;
      const r = a.size * 4.2;
      const x = a.x + this.px * a.depth * 16;
      const y = a.y + this.py * a.depth * 10;
      ctx.globalAlpha = Math.min(alpha, 0.85);
      ctx.drawImage(this.sprites[a.ci], x - r, y - r, r * 2, r * 2);
    }

    if (this.heartOn) {
      for (i = 0; i < this.heart.length; i++) {
        const p = this.heart[i];
        if (p.a < 0.01) continue;
        if (this.thin && p.size < 1.1 && (i & 1)) continue; // quality fallback: drop some faint dots
        const r = p.size * 4.5;
        ctx.globalAlpha = Math.min(p.a, 1);
        ctx.drawImage(this.sprites[p.ci], p.x - r, p.y - r, r * 2, r * 2);
      }
    }
    ctx.globalAlpha = 1;
  };

  G.Particles = {
    Field: Field,
    computeLayout: computeLayout,
    photoRect: photoRect
  };
})();
