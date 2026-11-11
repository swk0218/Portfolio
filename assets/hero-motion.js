/* Six composed scenes; all images share stable column and row tracks. */
(() => {
  const hero = document.querySelector('.hero');
  const slot = document.getElementById('typingText');
  const grid = document.querySelector('.hero-work-grid');
  if (!hero || !slot || !grid) return;
  const words = ['Strategic', 'Refined', 'Iconic', 'Distinct', 'Bold', 'Just Cool'];
  // Each scene has its own composition on one shared 12-column grid.
  // Coordinates are [column, row, columns, rows]; word length never moves them.
  const desktopFrames = [
    [[8, 0, 4, 3], [10, 3, 2, 5]],
    [[9, 0, 3, 3], [9, 4, 3, 6]],
    [[9, 0, 3, 5], [10, 5, 2, 6]],
    [[9, 0, 3, 4], [10, 4, 2, 3], [9, 7, 3, 3]],
    [[9, 0, 3, 7], [10, 7, 2, 5]],
    [[9, 4, 3, 5], [8, 0, 4, 3]]
  ];
  // Every scene uses the same 12-column / 12-row canvas. Large and small
  // modules trade places without shifting title, copy or gallery bounds.
  const compactFrames = [
    [[0, 0, 12, 6], [8, 6, 4, 6]],
    [[5, 0, 7, 6], [0, 0, 5, 12]],
    [[0, 2, 7, 10], [7, 0, 5, 7]],
    [[0, 0, 8, 7], [8, 0, 4, 4], [5, 8, 7, 4]],
    [[0, 0, 7, 12], [8, 4, 4, 8]],
    [[0, 5, 12, 7], [5, 0, 7, 4]]
  ];
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const modules = [...grid.querySelectorAll('.hero-grid-module')];
  let index = 0;
  let current = slot.querySelector('.flip-word');
  let cleanup, reveal, resize;

  function arrange(scene, entranceDelay = 0) {
    const bounds = grid.getBoundingClientRect();
    const heroBounds = hero.getBoundingClientRect();
    const line = slot.closest('.hero-line').getBoundingClientRect();
    const subtitle = hero.querySelector('.hero-subtitle').getBoundingClientRect();
    const compact = matchMedia('(max-width: 1099px)').matches;
    const gap = compact ? 12 : 18;
    const columns = 12;
    const columnPitch = (bounds.width + gap) / columns;
    const imageSpace = compact ? hero.querySelector('.hero-image-space').getBoundingClientRect() : null;
    const rowPitch = compact ? (imageSpace.height + gap) / 12
      : Math.max(36, (line.top - bounds.top - gap) / 3);
    const offsetY = compact ? imageSpace.top - bounds.top : 0;
    const frames = compact ? compactFrames : desktopFrames;
    const rectangles = frames.map(items => items.map(([col, row, cols, rows]) => ({
      x: col * columnPitch, y: offsetY + row * rowPitch,
      w: cols * columnPitch - gap, h: Math.max(1, rows * rowPitch - gap)
    })));
    if (compact) {
      hero.style.removeProperty('--hero-layout-min-height');
    } else {
      const lastImage = Math.max(...rectangles.flat().map(rect => rect.y + rect.h));
      const requiredHeight = Math.max(subtitle.bottom - heroBounds.top + 48,
        bounds.top - heroBounds.top + lastImage + 36);
      hero.style.setProperty('--hero-layout-min-height', `${Math.ceil(requiredHeight)}px`);
    }
    const active = modules.filter(module => Number(module.dataset.scene) === scene);
    active.forEach((module, order) => {
      const rect = rectangles[scene][order];
      if (!rect) return;
      module.style.setProperty('--image-x', `${rect.x}px`);
      module.style.setProperty('--image-y', `${rect.y}px`);
      module.style.setProperty('--image-w', `${rect.w}px`);
      module.style.setProperty('--image-h', `${rect.h}px`);
      module.style.setProperty('--image-delay', preference.matches ? '0ms' : `${entranceDelay + order * 90}ms`);
      module.dataset.gridSlot = `${scene}-${order}`;
      module.classList.add('is-active');
    });
    hero.dataset.keyword = words[scene];
    hero.dataset.imageCount = String(active.length);
  }

  function flip() {
    clearTimeout(cleanup);
    clearTimeout(reveal);
    slot.querySelectorAll('.is-leaving').forEach(node => node.remove());
    const previous = current;
    index = (index + 1) % words.length;
    modules.forEach(module => module.classList.remove('is-active'));
    current = document.createElement('span');
    current.className = 'flip-word';
    if (!preference.matches) current.classList.add('is-entering');
    for (const [order, char] of [...words[index]].entries()) {
      const letter = document.createElement('span');
      letter.textContent = char === ' ' ? '\u00a0' : char;
      letter.style.setProperty('--letter-index', order);
      current.append(letter);
    }
    if (previous) previous.classList.add('is-leaving');
    slot.append(current);
    if (previous) {
      if (preference.matches) previous.remove();
      else cleanup = setTimeout(() => previous.remove(), 440);
    }
    if (preference.matches) arrange(index);
    else reveal = setTimeout(() => arrange(index), 460);
  }

  let started = false;
  const start = () => {
    if (started) { arrange(index); return; }
    started = true;
    arrange(index, preference.matches ? 0 : 420);
    setInterval(flip, 2900);
  };
  const fontFallback = setTimeout(start, 1500);
  if (document.fonts) document.fonts.ready.then(() => { clearTimeout(fontFallback); start(); });
  else { clearTimeout(fontFallback); start(); }
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resize);
    resize = requestAnimationFrame(() => arrange(index));
  });
})();
