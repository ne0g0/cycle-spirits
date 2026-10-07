/* Scroll parallax for the origin section.
   Each [data-depth] layer moves against the scroll by depth × range. A positive depth rises faster
   than the page (the floating photographs); a negative depth lags behind it (the field of leaves).
   Off under prefers-reduced-motion, and only computed while the section is near the viewport. */
(() => {
  const sections = [...document.querySelectorAll('[data-parallax]')];
  if (!sections.length) return;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const layers = sections.flatMap(sec =>
    [...sec.querySelectorAll('[data-depth]')].map(el => ({ sec, el, depth: parseFloat(el.dataset.depth) || 0 }))
  );
  const active = new Set();
  let queued = false;

  function update() {
    queued = false;
    if (reduce.matches) { layers.forEach(l => { l.el.style.transform = ''; }); return; }
    const vh = window.innerHeight;
    for (const sec of active) {
      const r = sec.getBoundingClientRect();
      const progress = (vh - r.top) / (vh + r.height);      // 0 as it enters from below, 1 as it leaves above
      const c = Math.min(.5, Math.max(-.5, progress - .5));
      const range = Math.min(r.height, vh) * .5;
      for (const l of layers) {
        if (l.sec !== sec) continue;
        const y = -c * l.depth * range;
        l.el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
      }
    }
  }
  function request() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  }

  const io = new IntersectionObserver(entries => {
    for (const e of entries) { if (e.isIntersecting) active.add(e.target); else active.delete(e.target); }
    request();
  }, { rootMargin: '25% 0px' });
  sections.forEach(s => io.observe(s));

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  reduce.addEventListener('change', request);
  request();
})();
