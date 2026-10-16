/* ==========================================================
   audio.js — background music (Solace)
   One audio element for the whole experience: never restarted
   between scenes, always faded in and out, never autoplays.
   ========================================================== */
(function () {
  'use strict';
  const G = (window.FamilyLetter = window.FamilyLetter || {});

  const TARGET_VOLUME = 0.5;
  const audio = new Audio();
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = 0;

  let available = true;
  let playing = false;
  let timer = null;
  let listener = null;

  function notify() {
    if (listener) listener({ available: available, playing: playing });
  }

  function fadeTo(volume, ms, done) {
    clearInterval(timer);
    const from = audio.volume;
    const t0 = performance.now();
    timer = setInterval(function () {
      const k = Math.min(1, (performance.now() - t0) / ms);
      audio.volume = Math.max(0, Math.min(1, from + (volume - from) * k));
      if (k >= 1) {
        clearInterval(timer);
        if (done) done();
      }
    }, 40);
  }

  function init(src, onChange) {
    listener = onChange;
    audio.addEventListener('error', function () {
      available = false;
      playing = false;
      notify();
    });
    audio.src = src;
    audio.load();
    notify();
  }

  async function play() {
    if (!available) return false;
    try {
      if (audio.paused) audio.volume = 0;
      await audio.play();
      playing = true;
      fadeTo(TARGET_VOLUME, 2600);
      notify();
      return true;
    } catch (err) {
      playing = false;
      if (audio.error) available = false;
      notify();
      return false;
    }
  }

  function pause() {
    playing = false;
    notify();
    fadeTo(0, 1200, function () {
      if (!playing) audio.pause();
    });
  }

  function toggle() {
    if (playing) { pause(); return Promise.resolve(false); }
    return play();
  }

  G.Music = {
    init: init,
    play: play,
    pause: pause,
    toggle: toggle,
    isPlaying: function () { return playing; },
    isAvailable: function () { return available; }
  };
})();
