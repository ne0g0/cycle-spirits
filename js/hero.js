/* The lazy Susan.
   Two bottles orbit the glass on an ellipse; the sun and moon ride a larger ring behind the table.
   Every turn advances the whole table by a half revolution in the same direction, so the sun always
   rises over the top and sets under the bottom, the moon likewise, and the bottles take turns passing
   in front of the glass. The page theme turns with the table.

   Geometry comes from the custom properties on .stage (see css/site.css), so the layout can be tuned
   without touching this file. */
(() => {
  const hero = document.querySelector('[data-turntable]');
  if (!hero) return;

  const root = document.documentElement;
  const stage = hero.querySelector('.stage');
  const sky = hero.querySelector('.sky');
  const serves = [...hero.querySelectorAll('.serve')];
  const glasses = [...stage.querySelectorAll('.glass')];
  const turnBtn = hero.querySelector('[data-turn]');
  const turnLabel = hero.querySelector('.turn-label');
  const pauseBtn = hero.querySelector('[data-pause]');
  const announce = hero.querySelector('[data-announce]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  const bottles = [...stage.querySelectorAll('[data-orbit]')].map(el => ({
    el, id: el.dataset.orbit, a0: (parseFloat(el.dataset.angle) || 0) * Math.PI / 180
  }));
  const bodies = [...sky.querySelectorAll('[data-body]')].map(el => ({
    el, id: el.dataset.body, a0: (parseFloat(el.dataset.angle) || 0) * Math.PI / 180
  }));

  // Half-turn 0 puts Rubycello in front (day); half-turn 1 puts Pecaño in front (night).
  const ORDER = ['rubycello', 'pecano'];
  const THEME = { rubycello: 'day', pecano: 'night' };
  const NAME = { rubycello: 'Rubycello', pecano: 'Pecaño' };

  const TURN_MS = 2600;        // one half revolution
  const FACE_AT = 0.42;        // when, within the turn, the theme and the serve swap
  const autoplayMs = parseInt(hero.dataset.autoplay, 10) || 0;

  let half = hero.dataset.start === 'night' ? 1 : 0;
  let offset = half * Math.PI; // current rotation, radians
  let turning = false;
  let paused = false;
  let hovering = false;
  let timer = 0;
  let dims = null;

  const front = () => ORDER[half % 2];
  const easeInOutCubic = p => (p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

  function measure() {
    const cs = getComputedStyle(stage);
    const f = name => parseFloat(cs.getPropertyValue(name)) || 0;
    const W = stage.clientWidth;
    const H = stage.clientHeight;
    const hr = hero.getBoundingClientRect();
    const bodySize = bodies.length ? bodies[0].el.offsetWidth : 0;
    dims = {
      cx: W / 2,
      cy: H - f('--table-h') * W + f('--disc-cy') * W,
      rx: f('--ring-rx') * W,
      ry: f('--ring-ry') * W,
      back: f('--back-scale') || .6,
      scx: hr.width / 2,
      scy: hr.height * f('--sky-cy'),
      srx: hr.width / 2 + bodySize * f('--sky-rx-extra'),
      sry: hr.height * f('--sky-ry'),
      bodyMin: f('--sky-scale-min') || .8
    };
    stage.style.setProperty('--W', W + 'px');
  }

  function render(off) {
    const d = dims;
    for (const b of bottles) {
      const th = b.a0 + off;
      const sn = Math.sin(th);
      const x = d.cx + d.rx * Math.cos(th);
      const y = d.cy + d.ry * sn;
      const t = (sn + 1) / 2;                       // 0 at the back, 1 at the front
      const s = d.back + (1 - d.back) * t;
      b.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%) scale(${s.toFixed(4)})`;
      b.el.style.zIndex = sn >= 0 ? 4 : 2;         // in front of the glass, or behind it
    }
    for (const m of bodies) {
      const th = m.a0 + off;
      const sn = Math.sin(th);
      const x = d.scx + d.srx * Math.cos(th);
      const y = d.scy + d.sry * sn;
      const s = d.bodyMin + (1 - d.bodyMin) * (sn + 1) / 2;
      m.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%) scale(${s.toFixed(4)})`;
    }
  }

  function setFace(product) {
    root.dataset.theme = THEME[product];
    hero.dataset.front = product;
    serves.forEach(s => s.classList.toggle('is-on', s.dataset.for === product));
    glasses.forEach(g => g.classList.toggle('is-on', g.dataset.for === product));
    for (const b of bottles) {
      const isFront = b.id === product;
      b.el.dataset.pos = isFront ? 'front' : 'back';
      b.el.setAttribute('aria-label', isFront ? `${NAME[b.id]} is in front. Turn the table.` : `Bring ${NAME[b.id]} to the front`);
    }
    const next = ORDER[(ORDER.indexOf(product) + 1) % ORDER.length];
    if (turnLabel) turnLabel.textContent = `Turn to ${NAME[next]}`;
  }

  function finish(nextHalf, product) {
    half = nextHalf;
    offset = half * Math.PI;
    turning = false;
    hero.classList.remove('is-turning');
    if (announce) announce.textContent = `${NAME[product]} is in front.`;
  }

  function turn() {
    if (turning) return;
    const nextHalf = half + 1;
    const product = ORDER[nextHalf % 2];
    const from = offset;
    const to = offset + Math.PI;
    turning = true;
    hero.classList.add('is-turning');

    if (reduce.matches) {
      // No orbit: the faces swap in place.
      setFace(product);
      render(to);
      finish(nextHalf, product);
      return;
    }

    const t0 = performance.now();
    let faced = false;
    const frame = now => {
      const p = Math.min(1, (now - t0) / TURN_MS);
      render(from + (to - from) * easeInOutCubic(p));
      if (!faced && p >= FACE_AT) { faced = true; setFace(product); }
      if (p < 1) requestAnimationFrame(frame);
      else finish(nextHalf, product);
    };
    requestAnimationFrame(frame);
  }

  // Autoplay: a turn every few seconds, held while the pointer rests on the table,
  // while the tab is hidden, after Pause, and under reduced motion.
  function schedule(delay) {
    clearTimeout(timer);
    if (!autoplayMs || paused || reduce.matches) return;
    timer = setTimeout(tick, delay == null ? autoplayMs : delay);
  }
  function tick() {
    if (document.hidden || hovering || turning) { schedule(1500); return; }
    turn();
    schedule(autoplayMs + TURN_MS);
  }
  function manual() {
    turn();
    schedule(autoplayMs + TURN_MS + 4000);
  }

  bottles.forEach(b => b.el.addEventListener('click', manual));
  if (turnBtn) turnBtn.addEventListener('click', manual);
  if (pauseBtn) pauseBtn.addEventListener('click', () => {
    paused = !paused;
    pauseBtn.setAttribute('aria-pressed', String(paused));
    pauseBtn.textContent = paused ? 'Play' : 'Pause';
    if (paused) clearTimeout(timer); else schedule(1200);
  });
  stage.addEventListener('pointerenter', () => { hovering = true; });
  stage.addEventListener('pointerleave', () => { hovering = false; });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) schedule(); });
  reduce.addEventListener('change', () => { clearTimeout(timer); schedule(); });

  const ro = new ResizeObserver(() => { measure(); render(offset); });
  ro.observe(stage);
  ro.observe(hero);

  // First paint
  measure();
  setFace(front());
  render(offset);
  hero.classList.add('is-ready');
  if (pauseBtn && (!autoplayMs || reduce.matches)) pauseBtn.hidden = true;
  schedule(3200);
})();
