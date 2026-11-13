/* Shared viewport and one-shot entrance motion for home and project pages. */
(() => {
  const root = document.documentElement;
  if (!root) return;
  function syncFullBleed() {
    const width = root.clientWidth || window.innerWidth;
    if (!width) return;
    root.style.setProperty('--full-bleed-width', `${width}px`);
    root.style.setProperty('--full-bleed-offset', `calc(50% - ${width / 2}px)`);
  }
  syncFullBleed();
  window.addEventListener('resize', syncFullBleed, { passive: true });
  window.addEventListener('orientationchange', syncFullBleed, { passive: true });

  // Inline project videos load and play near the viewport, respecting live motion preferences.
  const mediaPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const inlineVideos = [...document.querySelectorAll('.shot-block video[data-video-src], .hero-media video[data-video-src]')];
  const visibleVideos = new Set();
  function syncInlineVideo(video) {
    if (mediaPreference.matches || document.hidden || document.body.classList.contains('lightbox-open') || !visibleVideos.has(video)) {
      video.pause();
      return;
    }
    if (!video.getAttribute('src')) video.src = video.dataset.videoSrc;
    const playing = video.play();
    if (playing?.catch) playing.catch(() => {});
  }
  if (inlineVideos.length) {
    if ('IntersectionObserver' in window) {
      const videoObserver = new IntersectionObserver(entries => {
        entries.forEach(({ target, isIntersecting }) => {
          if (isIntersecting) visibleVideos.add(target);
          else visibleVideos.delete(target);
          syncInlineVideo(target);
        });
      }, { rootMargin: '0px', threshold: 0 });
      inlineVideos.forEach(video => videoObserver.observe(video));
    } else {
      inlineVideos.forEach(video => { visibleVideos.add(video); syncInlineVideo(video); });
    }
    mediaPreference.addEventListener('change', () => inlineVideos.forEach(syncInlineVideo));
    document.addEventListener('visibilitychange', () => inlineVideos.forEach(syncInlineVideo));
    if ('MutationObserver' in window) {
      new MutationObserver(() => inlineVideos.forEach(syncInlineVideo))
        .observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }
  }

  if (!document.body?.classList.contains('motion-loco') || root.hasAttribute('data-motion-system')) return;
  root.setAttribute('data-motion-system', 'ready');
  const preference = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const records = [];
  const seen = new Set();
  const grids = new Set();
  let observer = null;
  let layoutFrame = 0;

  function add(el, type = 'text', offset = 0, gridItem = el) {
    if (!el || seen.has(el)) return;
    seen.add(el);
    el.setAttribute('data-reveal', type);
    el.style.setProperty('--reveal-delay', `${offset}ms`);
    const parent = gridItem?.parentElement;
    const grid = parent && getComputedStyle(parent).display.includes('grid') ? parent : null;
    if (grid) grids.add(grid);
    records.push({ el, offset, grid, gridItem, settle: null });
  }

  document.querySelectorAll('.project-card').forEach(card => {
    add(card.querySelector('.project-image'), 'media', 0, card);
    add(card.querySelector('.project-details'), 'text', 100, card);
  });
  document.querySelectorAll('.work-item').forEach(item => {
    add(item.querySelector('.work-item-image'), 'media', 0, item);
    add(item.querySelector('.work-item-category'), 'text', 70, item);
    add(item.querySelector('.work-item-title'), 'text', 90, item);
    add(item.querySelector('.work-item-tagline'), 'text', 110, item);
    add(item.querySelector('.work-item-awards'), 'text', 130, item);
  });
  [
    '.selected-works-title', '.all-work .section-title', '.work-tabs',
    '.about-grid > div', '.skill-item',
    '.awards-section .about-contact-label', '.awards-section .feature-item',
    '.featured-in .about-contact-label', '.featured-in .feature-item',
    '.about-contact-item', '.site-footer', '.project-header',
    '.hero-media', '.overview-section', '.shot-block', '.next'
  ].forEach(selector => {
    document.querySelectorAll(selector).forEach(el => {
      add(el, el.matches('.hero-media, .shot-block') ? 'media' : 'text');
    });
  });

  // A selected parent is the atomic reveal group; its children do not rise twice.
  const revealables = records.filter(record => {
    if (!record.el.parentElement?.closest('[data-reveal]')) return true;
    record.el.removeAttribute('data-reveal');
    record.el.removeAttribute('data-reveal-state');
    record.el.removeAttribute('data-reveal-settled');
    record.el.style.removeProperty('--reveal-delay');
    return false;
  });
  if (!revealables.length) return;

  function refreshDelays() {
    layoutFrame = 0;
    const gridColumns = new Map();
    grids.forEach(grid => {
      const visible = [...grid.children].filter(item => item.getClientRects().length);
      const columns = [...new Set(visible.map(item => Math.round(item.offsetLeft)))].sort((a, b) => a - b);
      gridColumns.set(grid, { visible: new Set(visible), columns });
    });
    revealables.forEach(({ el, offset, grid, gridItem }) => {
      if (el.getAttribute('data-reveal-state') === 'in') return;
      const group = gridColumns.get(grid);
      const column = group?.visible.has(gridItem)
        ? Math.max(0, group.columns.indexOf(Math.round(gridItem.offsetLeft))) : 0;
      el.style.setProperty('--reveal-delay', `${offset + column * 70}ms`);
    });
  }
  function queueLayout() {
    if (!layoutFrame) layoutFrame = requestAnimationFrame(() => {
      refreshDelays();
      if (observer) observeRemaining();
    });
  }
  refreshDelays();
  window.addEventListener('resize', queueLayout, { passive: true });
  window.addEventListener('orientationchange', queueLayout, { passive: true });
  // Filtering changes the visible columns without re-running a completed entrance.
  if ('MutationObserver' in window) {
    const mutations = new MutationObserver(queueLayout);
    grids.forEach(grid => mutations.observe(grid, { attributes: true, attributeFilter: ['class'], childList: true, subtree: true }));
  }

  function reveal(record) {
    const { el } = record;
    if (el.getAttribute('data-reveal-state') === 'in') return;
    el.setAttribute('data-reveal-state', 'in');
    observer?.unobserve(el);
    let timer;
    const settle = () => {
      if (!record.settle) return;
      record.settle = null;
      clearTimeout(timer);
      el.removeEventListener('transitionend', onEnd);
      el.setAttribute('data-reveal-settled', '');
    };
    const onEnd = event => {
      if (event.target === el && (event.propertyName === 'opacity' || event.propertyName === 'transform')) settle();
    };
    record.settle = settle;
    el.addEventListener('transitionend', onEnd);
    const style = getComputedStyle(el);
    const duration = parseFloat(style.getPropertyValue('--loco-duration')) || 900;
    const delay = parseFloat(style.getPropertyValue('--reveal-delay')) || 0;
    timer = setTimeout(settle, duration + delay + 150);
  }
  function revealAll() {
    observer?.disconnect();
    revealables.forEach(record => {
      record.el.setAttribute('data-reveal-state', 'in');
      if (record.settle) record.settle();
      else record.el.setAttribute('data-reveal-settled', '');
    });
  }
  document.addEventListener('focusin', event => {
    const record = revealables.find(({ el }) => el.contains(event.target));
    if (!record) return;
    reveal(record);
    record.settle?.();
  });
  const motionChange = () => { if (preference?.matches) revealAll(); };
  if (preference?.addEventListener) preference.addEventListener('change', motionChange);
  else preference?.addListener?.(motionChange);

  // Older browsers and reduced-motion visitors always receive visible content.
  if (preference?.matches || !('IntersectionObserver' in window)) {
    revealAll();
    return;
  }
  const byElement = new Map(revealables.map(record => [record.el, record]));
  function observeRemaining() {
    observer?.disconnect();
    if (preference?.matches) return;
    const inset = Math.round((window.innerHeight || root.clientHeight) * .08);
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) reveal(byElement.get(entry.target)); });
    }, { threshold: 0, rootMargin: `0px 0px -${inset}px 0px` });
    revealables.forEach(({ el }) => {
      if (el.getAttribute('data-reveal-state') !== 'in') observer.observe(el);
    });
  }
  observeRemaining();

  function revealVisible() {
    const height = window.innerHeight || root.clientHeight;
    refreshDelays();
    revealables.forEach(record => {
      if (record.el.getAttribute('data-reveal-state') === 'in') return;
      const rect = record.el.getBoundingClientRect();
      if (rect.top < height * .92 && rect.bottom > 0) reveal(record);
    });
  }
  requestAnimationFrame(revealVisible);
  window.addEventListener('load', revealVisible, { once: true });
  window.addEventListener('hashchange', () => requestAnimationFrame(revealVisible));
})();
