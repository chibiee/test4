/* ==========================================================
   sequencer.js — shows text passages one at a time.
   Fade in -> readable hold (scaled to word count) -> fade out.
   A click / key can finish a fade or end a hold early,
   and the hold timer can be paused by the viewer.
   ========================================================== */
(function () {
  'use strict';
  const G = (window.FamilyLetter = window.FamilyLetter || {});

  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = function () { return mq.matches; };
  const sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  let layer = null;
  let T = null;
  let paused = false;
  let skipHook = null;

  function init(layerEl, timing) {
    layer = layerEl;
    T = timing;
  }

  function times() {
    const f = reduced() ? 0.5 : 1;
    return {
      fadeIn: Math.round(T.fadeIn * f),
      fadeOut: Math.round(T.fadeOut * f),
      stagger: Math.round(T.stagger * (reduced() ? 0.6 : 1))
    };
  }

  function countWords(p) {
    const text = p.title ? p.title : (p.lines ? p.lines.join(' ') : p.text);
    return text.trim().split(/\s+/).length;
  }

  function holdFor(p) {
    if (typeof p.hold === 'number') return p.hold;
    if (p.title) return 2800;
    return Math.max(T.minHold, T.baseHold + countWords(p) * T.perWord);
  }

  function build(p) {
    const wrap = document.createElement('div');
    wrap.className = 'passage' + (p.style ? ' passage--' + p.style : '');
    const parts = [];
    if (p.title) {
      const h = document.createElement('h2');
      h.className = 'passage__part passage__title';
      h.textContent = p.title;
      const rule = document.createElement('span');
      rule.className = 'passage__part passage__rule';
      rule.setAttribute('aria-hidden', 'true');
      wrap.append(h, rule);
      parts.push(h, rule);
    } else {
      (p.lines || [p.text]).forEach(function (t) {
        const d = document.createElement('p');
        d.className = 'passage__part passage__line';
        d.textContent = t;
        wrap.append(d);
        parts.push(d);
      });
    }
    return { wrap: wrap, parts: parts };
  }

  function reveal(parts, tm, stagger) {
    return parts.map(function (el, i) {
      const frames = reduced()
        ? [{ opacity: 0 }, { opacity: 1 }]
        : [
            { opacity: 0, transform: 'translate3d(0,10px,0)' },
            { opacity: 1, transform: 'translate3d(0,0,0)' }
          ];
      return el.animate(frames, {
        duration: tm.fadeIn,
        delay: i * stagger,
        easing: 'cubic-bezier(.22,.61,.36,1)',
        fill: 'both'
      });
    });
  }

  // Pause-aware, skippable wait.
  function waitHold(ms) {
    return new Promise(function (resolve) {
      let elapsed = 0;
      let last = performance.now();
      let timer = null;
      function finish() {
        clearTimeout(timer);
        skipHook = null;
        resolve();
      }
      skipHook = finish;
      (function tick() {
        const now = performance.now();
        if (!paused) elapsed += now - last;
        last = now;
        if (elapsed >= ms) finish();
        else timer = setTimeout(tick, 80);
      })();
    });
  }

  async function show(p, opts) {
    const keep = !!(opts && opts.keep);
    const tm = times();
    const built = build(p);
    layer.append(built.wrap);

    const stagger = typeof p.stagger === 'number' ? p.stagger : tm.stagger;
    const anims = reveal(built.parts, tm, reduced() ? Math.min(stagger, tm.stagger) : stagger);

    // A click during the fade-in simply completes it.
    skipHook = function () {
      anims.forEach(function (a) { try { a.finish(); } catch (e) { /* ignore */ } });
    };
    await Promise.all(anims.map(function (a) { return a.finished.catch(function () {}); }));
    skipHook = null;

    if (keep) return built.wrap;

    await waitHold(holdFor(p));

    const out = built.wrap.animate(
      [{ opacity: 1 }, { opacity: 0 }],
      { duration: tm.fadeOut, easing: 'ease-in-out', fill: 'forwards' }
    );
    await out.finished.catch(function () {});
    built.wrap.remove();
    await sleep(T.gap);
    return null;
  }

  async function playPassages(list) {
    for (let i = 0; i < list.length; i++) {
      await show(list[i]);
      if (list[i].pauseAfter) await sleep(list[i].pauseAfter);
    }
  }

  G.Sequencer = {
    init: init,
    show: show,
    playPassages: playPassages,
    sleep: sleep,
    skip: function () { if (skipHook) skipHook(); },
    setPaused: function (v) { paused = !!v; },
    isPaused: function () { return paused; }
  };
})();
