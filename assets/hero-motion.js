/* Two fixed grid compositions alternate between two and three images. */
(() => {
  const hero = document.querySelector('.hero');
  const slot = document.getElementById('typingText');
  const grid = document.querySelector('.hero-work-grid');
  if (!hero || !slot || !grid) return;
  const words = ['Strategic', 'Refined', 'Iconic', 'Distinct', 'Bold', 'Just Cool'];
  const sceneSlots = [['A', 'B'], ['C', 'D', 'E'], ['A', 'B'], ['C', 'D', 'E'], ['A', 'B'], ['C', 'D', 'E']];
  // [zone, column, row, column span, row span]. Shared slots never follow word width.
  const desktopCells = {
    A: ['upper', 8, 0, 4, 4], B: ['middle', 10, 0, 2, 2],
    C: ['lower', 8, 0, 4, 4], D: ['upper', 5, 0, 3, 3], E: ['middle', 10, 2, 2, 2]
  };
  const tabletCells = {...desktopCells, B: ['upper', 6, 0, 2, 2]};
  const mobileCells = {
    A: ['upper', 2, 0, 4, 4], B: ['upper', 0, 0, 2, 2],
    C: ['lower', 0, 0, 4, 4], D: ['lower', 4, 0, 2, 2], E: ['lower', 4, 2, 2, 2]
  };
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const modules = [...grid.querySelectorAll('.hero-grid-module')];
  let index = 0;
  let current = slot.querySelector('.flip-word');
  let cleanup, reveal, resize;

  function arrange(scene, entranceDelay = 0) {
    const bounds = grid.getBoundingClientRect();
    const line = slot.closest('.hero-line').getBoundingClientRect();
    const title = hero.querySelector('.hero-title').getBoundingClientRect();
    const subtitle = hero.querySelector('.hero-subtitle').getBoundingClientRect();
    const mobile = matchMedia('(max-width: 768px)').matches;
    const gap = mobile ? 12 : 18;
    const columnPitch = (bounds.width + gap) / (mobile ? 6 : 12);
    const bandHeight = Math.max(72, line.top - bounds.top - gap - 8);
    const rowPitch = (bandHeight + gap) / 4;
    const origins = {
      upper: 0,
      middle: line.top - bounds.top,
      lower: (matchMedia('(max-width: 1023px)').matches ? subtitle.bottom : title.bottom) - bounds.top + gap + 8
    };
    const requiredHeight = bounds.top - hero.getBoundingClientRect().top + origins.lower + bandHeight + 32;
    hero.style.setProperty('--hero-layout-min-height', `${Math.ceil(requiredHeight)}px`);
    const cells = mobile ? mobileCells : matchMedia('(max-width: 1023px)').matches ? tabletCells : desktopCells;
    const active = modules.filter(module => Number(module.dataset.scene) === scene);
    active.forEach((module, order) => {
      module.classList.remove('is-active');
      const name = sceneSlots[scene][order];
      if (!name) return;
      const [zone, col, row, cols, rows] = cells[name];
      module.style.setProperty('--image-x', `${col * columnPitch}px`);
      module.style.setProperty('--image-y', `${origins[zone] + row * rowPitch}px`);
      module.style.setProperty('--image-w', `${cols * columnPitch - gap}px`);
      module.style.setProperty('--image-h', `${rows * rowPitch - gap}px`);
      module.style.setProperty('--image-delay', preference.matches ? '0ms' : `${entranceDelay + order * 90}ms`);
      module.dataset.gridSlot = name;
      module.classList.add('is-active');
    });
    hero.dataset.keyword = words[scene];
    hero.dataset.imageCount = String(Math.min(active.length, sceneSlots[scene].length));
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
