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
    [[9, 0, 3, 7], [9, 7, 3, 3]],
    [[8, 0, 4, 3], [10, 3, 2, 3], [9, 6, 3, 4]],
    [[9, 3, 3, 7], [8, 0, 4, 3]],
    [[8, 0, 4, 3], [10, 3, 2, 6]],
    [[9, 0, 3, 6], [9, 6, 3, 3]],
    [[8, 9, 4, 2], [9, 0, 3, 7]]
  ];
  // On compact screens, keep imagery on both sides of the typography block.
  // The lower band's origin is snapped to the same row pitch as the upper band.
  const compactFrames = [
    [['lower', 0, 0, 4, 6], ['upper', 3, 0, 3, 3]],
    [['upper', 0, 0, 4, 3], ['lower', 0, 0, 3, 4], ['lower', 3, 2, 3, 4]],
    [['lower', 2, 0, 4, 6], ['upper', 0, 0, 3, 3]],
    [['upper', 2, 0, 4, 3], ['lower', 0, 0, 4, 6]],
    [['lower', 0, 0, 4, 6], ['upper', 2, 0, 4, 3], ['lower', 4, 2, 2, 3]],
    [['lower', 0, 0, 6, 4], ['upper', 3, 0, 3, 3]]
  ];
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const modules = [...grid.querySelectorAll('.hero-grid-module')];
  let index = 0;
  let current = slot.querySelector('.flip-word');
  let cleanup, reveal, resize;

  function arrange(scene, entranceDelay = 0) {
    const bounds = grid.getBoundingClientRect();
    const heroBounds = hero.getBoundingClientRect();
    const firstLine = hero.querySelector('.hero-line').getBoundingClientRect();
    const line = slot.closest('.hero-line').getBoundingClientRect();
    const subtitle = hero.querySelector('.hero-subtitle').getBoundingClientRect();
    const compact = matchMedia('(max-width: 1099px)').matches;
    const gap = compact ? 12 : 18;
    const columns = compact ? 6 : 12;
    const columnPitch = (bounds.width + gap) / columns;
    const rowPitch = compact
      ? Math.max(28, (firstLine.top - bounds.top) / 3)
      : Math.max(36, (line.top - bounds.top - gap) / 3);
    const lowerRow = Math.ceil((subtitle.bottom - bounds.top + 28) / rowPitch);
    const frames = compact ? compactFrames : desktopFrames.map((frames, i) =>
      i === 5 && matchMedia('(max-width: 1279px)').matches
        ? [[9, 9, 3, 2], frames[1]] : frames);
    const rectangles = frames.map(items => items.map(frame => {
      if (compact) {
        const [band, col, row, cols, rows] = frame;
        return {x: col * columnPitch, y: ((band === 'lower' ? lowerRow : 0) + row) * rowPitch,
          w: cols * columnPitch - gap, h: rows * rowPitch - gap};
      }
      const [col, row, cols, rows] = frame;
      return {x: col * columnPitch, y: row * rowPitch,
        w: cols * columnPitch - gap, h: rows * rowPitch - gap};
    }));
    // Reserve the complete sequence, so changing scene never changes hero height.
    const lastImage = Math.max(...rectangles.flat().map(rect => rect.y + rect.h));
    const requiredHeight = Math.max(subtitle.bottom - heroBounds.top + 48,
      bounds.top - heroBounds.top + lastImage + 36);
    hero.style.setProperty('--hero-layout-min-height', `${Math.ceil(requiredHeight)}px`);
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
