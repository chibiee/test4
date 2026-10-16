/* ==========================================================
   main.js — runs the scenes in order and wires up the controls.
   Order: gate -> opening -> Mama -> Ate -> shared reflection
          -> finale (heart + photo) -> final letter -> rest.
   ========================================================== */
(function () {
  'use strict';
  const G = window.FamilyLetter;
  const S = G.story;
  const Seq = G.Sequencer;
  const Music = G.Music;

  const $ = function (id) { return document.getElementById(id); };
  const body = document.body;
  const root = document.documentElement;
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');

  const photo = $('photo');
  const photoImg = $('photo-img');
  const backdrop = document.querySelector('.backdrop');
  let photoRatio = 4 / 3;
  let photoKey = '';
  let started = false;

  /* ---------- Particle field ---------- */
  const field = new G.Particles.Field($('particles'));
  field.setReduced(mq.matches);
  field.setAmbient(0);
  field.onLayout = applyPhoto;
  field.start();

  function onMotionChange() {
    field.setReduced(mq.matches);
    root.dataset.motion = mq.matches ? 'reduced' : 'full';
  }
  if (mq.addEventListener) mq.addEventListener('change', onMotionChange);
  onMotionChange();

  /* ---------- Layout -> CSS variables ---------- */
  function fit(box, ratio) {
    if (box.w / box.h > ratio) return { w: box.h * ratio, h: box.h };
    return { w: box.w, h: box.w / ratio };
  }

  // The photo is laid out once at its final (goal) size and position. While the heart
  // glides, only a transform changes, so no layout work happens per frame.
  function applyPhoto(now, goal) {
    goal = goal || field.goal;
    const g = G.Particles.photoRect(goal.core);
    const gf = fit(g, photoRatio);
    const key = [g.cx, g.cy, gf.w, gf.h].map(function (n) { return n.toFixed(1); }).join('|');
    if (key !== photoKey) {
      photoKey = key;
      const ps = photo.style;
      ps.left = g.cx.toFixed(1) + 'px';
      ps.top = g.cy.toFixed(1) + 'px';
      ps.width = gf.w.toFixed(1) + 'px';
      ps.height = gf.h.toFixed(1) + 'px';
    }
    const b = G.Particles.photoRect(now);
    const k = now.s / goal.core.s;
    photo.style.transform = 'translate(' + (b.cx - g.cx).toFixed(2) + 'px,' + (b.cy - g.cy).toFixed(2) +
      'px) translate(-50%,-50%) scale(' + k.toFixed(4) + ')';
    // warm glow follows the heart (set on the small backdrop subtree, not the whole page)
    backdrop.style.setProperty('--heart-cx', now.cx.toFixed(1) + 'px');
    backdrop.style.setProperty('--heart-cy', (now.y0 + 2.5 * now.s).toFixed(1) + 'px');
  }

  function applyText() {
    const L = G.Particles.computeLayout(window.innerWidth, window.innerHeight, 'letter');
    const st = root.style;
    st.setProperty('--text-left', L.text.left.toFixed(1) + 'px');
    st.setProperty('--text-top', L.text.top.toFixed(1) + 'px');
    st.setProperty('--text-width', L.text.width.toFixed(1) + 'px');
    st.setProperty('--text-height', L.text.height.toFixed(1) + 'px');
    body.dataset.layout = L.wide ? 'wide' : 'stacked';
  }
  window.addEventListener('resize', applyText);
  applyText();
  applyPhoto(field.now, field.goal);

  /* ---------- Photograph ---------- */
  $('photo-missing-path').textContent = S.assets.photo;
  photoImg.addEventListener('load', function () {
    if (photoImg.naturalWidth && photoImg.naturalHeight) {
      photoRatio = photoImg.naturalWidth / photoImg.naturalHeight;
      applyPhoto(field.now);
    }
  });
  photoImg.addEventListener('error', function () {
    photo.classList.add('is-missing');
    photoRatio = 4 / 3;
    applyPhoto(field.now);
  });
  photoImg.src = S.assets.photo;

  /* ---------- Text sequencer ---------- */
  Seq.init($('passage-layer'), S.timing);

  /* ---------- Music ---------- */
  const musicBtn = $('music-toggle');
  const beginMusic = $('begin-music');
  const gateWarn = $('gate-warn');

  function syncMusic(state) {
    musicBtn.classList.toggle('is-playing', state.playing);
    musicBtn.setAttribute('aria-pressed', String(state.playing));
    musicBtn.disabled = !state.available;
    musicBtn.setAttribute('aria-label', !state.available ? 'Music unavailable' : (state.playing ? 'Pause music' : 'Play music'));
    musicBtn.title = !state.available ? 'Music file not found: ' + S.assets.music : '';
    beginMusic.disabled = !state.available;
    if (!state.available) {
      gateWarn.hidden = false;
      gateWarn.textContent = 'Music file not found (' + S.assets.music + '). The letter works in silence.';
    } else {
      gateWarn.hidden = true;
    }
  }
  Music.init(S.assets.music, syncMusic);
  musicBtn.addEventListener('click', function () { Music.toggle(); });

  /* ---------- Controls: pause, continue ---------- */
  const holdBtn = $('hold-btn');
  const transport = $('transport');

  holdBtn.addEventListener('click', function () {
    const on = !Seq.isPaused();
    Seq.setPaused(on);
    holdBtn.textContent = on ? 'Resume' : 'Pause';
    holdBtn.setAttribute('aria-pressed', String(on));
  });
  $('next-btn').addEventListener('click', function () { Seq.skip(); quietHint(); });
  $('replay-btn').addEventListener('click', function () { window.location.reload(); });

  document.addEventListener('click', function (e) {
    if (!started || e.target.closest('button, a')) return;
    Seq.skip();
    quietHint();
  });
  document.addEventListener('keydown', function (e) {
    if (e.target.closest && e.target.closest('button')) return;
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
      if (!started) return;
      e.preventDefault();
      Seq.skip();
      quietHint();
    }
  });

  function quietHint() { transport.classList.add('is-quiet'); }

  /* ---------- Scene helpers ---------- */
  function setWarmth(level) {
    body.dataset.warmth = String(level);
    field.setWarmth(level > 0 ? 1 : 0);
  }

  async function playScene(scene) {
    setWarmth(scene.warmth);
    body.dataset.scene = scene.id;
    if (scene.id === 'opening') await Seq.sleep(S.timing.openingPause);
    if (scene.title) await Seq.show({ title: scene.title, style: 'title' });
    await Seq.playPassages(scene.passages);
    await Seq.sleep(scene.endPause || 1600);
  }

  async function finale() {
    const F = S.final;
    body.dataset.scene = 'final';
    setWarmth(2);
    field.setAmbient(0.4);
    await Seq.sleep(F.darkPause);

    field.beginHeart();
    await Seq.sleep(F.photoDelay);
    photo.classList.add('is-visible');
    photo.removeAttribute('aria-hidden');

    await field.whenFormed();
    await Seq.sleep(F.holdBeforeLetter);

    field.setPhase('letter');
    await Seq.sleep(F.glidePause);

    await Seq.playPassages(F.letter);
    await Seq.show(F.closing, { keep: true });

    // Rest. Nothing restarts, nothing is removed; the music keeps playing.
    body.dataset.done = 'true';
    transport.classList.remove('is-quiet');
    setTimeout(function () { $('replay-btn').hidden = false; }, 8000);
  }

  async function run() {
    for (let i = 0; i < S.scenes.length; i++) await playScene(S.scenes[i]);
    await finale();
  }

  /* ---------- Begin ---------- */
  const gate = $('gate');
  async function begin(withMusic) {
    if (started) return;
    started = true;
    if (withMusic) Music.play(); // called inside the click, so browsers allow it
    gate.classList.add('is-leaving');
    await Seq.sleep(1800);
    gate.hidden = true;
    body.dataset.scene = 'opening';
    field.setAmbient(1);
    try {
      await run();
    } catch (err) {
      console.error(err);
    }
  }
  beginMusic.addEventListener('click', function () { begin(true); });
  $('begin-silent').addEventListener('click', function () { begin(false); });
  beginMusic.focus({ preventScroll: true });

  window.addEventListener('pagehide', function () { field.destroy(); });
})();
