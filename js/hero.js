/* The lazy Susan.
   Each bottle and its glass sit together as one setting and orbit the table on an ellipse; the sun and
   moon ride a larger ring behind it. Every turn advances the table a half revolution in the same
   direction, so the sun always rises over the top and sets under the bottom, the moon likewise, and
   the settings take turns passing through the front. When a setting reaches the front the table rests
   and the glass pours: a stream from above, the liquid rising, the ice lifting with it. The page theme
   turns with the table.

   Geometry comes from the custom properties on .stage (see css/site.css). Each glass carries its own
   numbers as data attributes: data-top and data-h are the interior's top and height in SVG units,
   data-level the fill fraction, data-st where the stream starts, data-ice-drop how far the ice sits
   below its floating position when the glass is empty. */
(() => {
  const hero = document.querySelector('[data-turntable]');
  if (!hero) return;

  const root = document.documentElement;
  const stage = hero.querySelector('.stage');
  const sky = hero.querySelector('.sky');
  const serves = [...hero.querySelectorAll('.serve')];
  const turnBtn = hero.querySelector('[data-turn]');
  const turnLabel = hero.querySelector('.turn-label');
  const pauseBtn = hero.querySelector('[data-pause]');
  const announce = hero.querySelector('[data-announce]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  const ORDER = ['rubycello', 'pecano'];   // half-turn 0 → Rubycello in front (day); 1 → Pecaño (night)
  const THEME = { rubycello: 'day', pecano: 'night' };
  const NAME = { rubycello: 'Rubycello', pecano: 'Pecaño' };

  const TURN_MS = 2600;        // one half revolution
  const FACE_AT = 0.42;        // when, within the turn, the theme and the serve swap
  const POUR_DELAY = 350;      // rest before the pour starts
  const POUR = { appear: 220, fill: 1700, end: 320 };
  const DRAIN_MS = 500;
  const autoplayMs = parseInt(hero.dataset.autoplay, 10) || 0;

  const easeInOutCubic = p => (p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  const easeInOutQuad = p => (p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);
  const easeOutQuad = p => 1 - (1 - p) * (1 - p);
  const easeInQuad = p => p * p;

  function readGlass(setting) {
    const el = setting.querySelector('[data-glass]');
    if (!el) return null;
    const d = el.dataset;
    return {
      el,
      top: parseFloat(d.top) || 0,
      h: parseFloat(d.h) || 100,
      level: parseFloat(d.level) || .65,
      st: parseFloat(d.st) || -70,
      iceDrop: parseFloat(d.iceDrop) || 0,
      liquid: el.querySelector('.liquid'),
      surface: el.querySelector('.liquid-surface'),
      stream: el.querySelector('.stream'),
      core: el.querySelector('.stream-core'),
      ice: el.querySelector('.ice'),
      L: 0,
      raf: 0,
    };
  }

  const settings = [...stage.querySelectorAll('[data-orbit]')].map(el => ({
    el, id: el.dataset.orbit, a0: (parseFloat(el.dataset.angle) || 0) * Math.PI / 180, glass: readGlass(el)
  }));
  const bodies = [...sky.querySelectorAll('[data-body]')].map(el => ({
    el, id: el.dataset.body, a0: (parseFloat(el.dataset.angle) || 0) * Math.PI / 180
  }));

  let half = hero.dataset.start === 'night' ? 1 : 0;
  let offset = half * Math.PI; // current rotation, radians
  let turning = false;
  let paused = false;
  let hovering = false;
  let timer = 0;
  let pourTimer = 0;
  let dims = null;

  const front = () => ORDER[half % 2];
  const settingOf = id => settings.find(s => s.id === id);

  /* ---- the glass ---- */
  function setGlass(G, L, y1, y2) {
    const dy = (1 - L) * G.h;
    if (G.liquid) G.liquid.style.transform = `translateY(${dy.toFixed(2)}px)`;
    if (G.surface) G.surface.style.transform = `translateY(${dy.toFixed(2)}px)`;
    if (G.ice) G.ice.style.transform = `translateY(${((1 - L) * G.iceDrop).toFixed(2)}px)`;
    const hgt = Math.max(0, y2 - y1);
    for (const r of [G.stream, G.core]) {
      if (!r) continue;
      r.setAttribute('y', y1.toFixed(2));
      r.setAttribute('height', hgt.toFixed(2));
    }
    G.L = L;
  }
  function stopGlass(G) {
    if (G.raf) cancelAnimationFrame(G.raf);
    G.raf = 0;
    G.el.classList.remove('is-pouring');
  }
  function pour(G) {
    if (!G) return;
    stopGlass(G);
    const target = G.level;
    const surfaceY = L => G.top + (1 - L) * G.h;
    if (reduce.matches) { setGlass(G, target, 0, 0); return; }
    const t0 = performance.now();
    const T1 = POUR.appear, T2 = T1 + POUR.fill, T3 = T2 + POUR.end;
    G.el.classList.add('is-pouring');
    const frame = now => {
      const t = now - t0;
      let L, y1, y2;
      if (t < T1) { const p = easeOutQuad(t / T1); L = 0; y1 = G.st; y2 = G.st + (surfaceY(0) - G.st) * p; }
      else if (t < T2) { L = target * easeInOutQuad((t - T1) / POUR.fill); y1 = G.st; y2 = surfaceY(L); }
      else if (t < T3) { const p = easeInQuad((t - T2) / POUR.end); L = target; y1 = G.st + (surfaceY(L) - G.st) * p; y2 = surfaceY(L); }
      else { setGlass(G, target, 0, 0); G.raf = 0; G.el.classList.remove('is-pouring'); return; }
      setGlass(G, L, y1, y2);
      G.raf = requestAnimationFrame(frame);
    };
    G.raf = requestAnimationFrame(frame);
  }
  function drain(G) {
    if (!G) return;
    stopGlass(G);
    const from = G.L;
    if (from <= 0 || reduce.matches) { setGlass(G, 0, 0, 0); return; }
    const t0 = performance.now();
    const frame = now => {
      const p = Math.min(1, (now - t0) / DRAIN_MS);
      setGlass(G, from * (1 - easeInQuad(p)), 0, 0);
      G.raf = p < 1 ? requestAnimationFrame(frame) : 0;
    };
    G.raf = requestAnimationFrame(frame);
  }
  function pourFront(delay) {
    clearTimeout(pourTimer);
    const G = settingOf(front()).glass;
    pourTimer = setTimeout(() => pour(G), delay);
  }

  /* ---- the table ---- */
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
    for (const s of settings) {
      const th = s.a0 + off;
      const sn = Math.sin(th);
      const x = d.cx + d.rx * Math.cos(th);
      const y = d.cy + d.ry * sn;
      const t = (sn + 1) / 2;                       // 0 at the back, 1 at the front
      const sc = d.back + (1 - d.back) * t;
      s.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%) scale(${sc.toFixed(4)})`;
      s.el.style.zIndex = sn >= 0 ? 4 : 2;
    }
    for (const m of bodies) {
      const th = m.a0 + off;
      const sn = Math.sin(th);
      const x = d.scx + d.srx * Math.cos(th);
      const y = d.scy + d.sry * sn;
      const sc = d.bodyMin + (1 - d.bodyMin) * (sn + 1) / 2;
      m.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%) scale(${sc.toFixed(4)})`;
    }
  }

  function setFace(product) {
    root.dataset.theme = THEME[product];
    hero.dataset.front = product;
    serves.forEach(s => s.classList.toggle('is-on', s.dataset.for === product));
    for (const s of settings) {
      const isFront = s.id === product;
      s.el.dataset.pos = isFront ? 'front' : 'back';
      s.el.setAttribute('aria-label', isFront ? `${NAME[s.id]} is in front. Turn the table.` : `Bring ${NAME[s.id]} to the front`);
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
    pourFront(POUR_DELAY);
  }

  function turn() {
    if (turning) return;
    const nextHalf = half + 1;
    const product = ORDER[nextHalf % 2];
    const from = offset;
    const to = offset + Math.PI;
    turning = true;
    hero.classList.add('is-turning');
    clearTimeout(pourTimer);
    drain(settingOf(front()).glass);               // the glass empties as it leaves the front

    if (reduce.matches) {
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

  /* ---- autoplay: a turn every few seconds, held while the pointer rests on the table,
          while the tab is hidden, after Pause, and under reduced motion ---- */
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

  settings.forEach(s => s.el.addEventListener('click', manual));
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

  /* ---- first paint ---- */
  measure();
  settings.forEach(s => { if (s.glass) setGlass(s.glass, 0, 0, 0); });
  setFace(front());
  render(offset);
  hero.classList.add('is-ready');
  if (pauseBtn && (!autoplayMs || reduce.matches)) pauseBtn.hidden = true;
  pourFront(700);
  schedule(6000);
})();
