/* Keyword scenes cycle 2 / 3 / 1 images. Every image belongs to its own module. */
(() => {
  const hero = document.querySelector('.hero');
  const slot = document.getElementById('typingText');
  const grid = document.querySelector('.hero-work-grid');
  if (!hero || !slot || !grid) return;
  const words = ['Strategic', 'Refined', 'Iconic', 'Distinct', 'Bold', 'Just Cool'];
  const counts = [2, 3, 1, 2, 3, 1];
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const modules = [...grid.querySelectorAll('.hero-grid-module')];
  let index = 0;
  let current = slot.querySelector('.flip-word');
  let cleanup, reveal, resize;

  const overlaps = (a, b, gap = 0) => a.x < b.x + b.w + gap && a.x + a.w > b.x - gap && a.y < b.y + b.h + gap && a.y + a.h > b.y - gap;

  function arrange(scene, entranceDelay = 0) {
    const bounds = grid.getBoundingClientRect();
    const word = slot.getBoundingClientRect();
    const mobile = matchMedia('(max-width: 768px)').matches;
    const columns = mobile ? 6 : 12;
    const rows = 12;
    const gap = mobile ? 12 : 18;
    const pitch = (bounds.width + gap) / columns;
    const rowPitch = bounds.height / rows;
    const protectedWord = {x: word.left - bounds.left - 18, y: word.top - bounds.top - 12, w: word.width + 36, h: word.height + 24};
    const protectedRects = [protectedWord];
    const subtitle = hero.querySelector('.hero-subtitle');
    for (const node of subtitle.childNodes) {
      if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const rect of range.getClientRects()) protectedRects.push({x: rect.left - bounds.left - 10, y: rect.top - bounds.top - 8, w: rect.width + 20, h: rect.height + 16});
    }
    const placed = [];
    const active = modules.filter(module => Number(module.dataset.scene) === scene);
    const large = counts[scene] === 1;
    const anchors = scene % 2 === 0 ? [[1, .04], [.8, .95], [.4, .05]] : [[1, .9], [.95, .03], [.45, .95]];
    active.forEach((module, order) => {
      module.classList.remove('is-active');
      const maxSpan = large ? 6 : mobile ? 3 : counts[scene] === 2 ? 4 : 3;
      const minSpan = large ? mobile ? 4 : 4 : mobile ? 2 : 3;
      let best;
      for (let span = maxSpan; span >= minSpan && !best; span--) {
        const w = span * pitch - gap;
        const h = w / (large ? 16 / 9 : 16 / 10);
        const candidates = [];
        for (let col = 0; col <= columns - span; col++) {
          for (let row = 0; row < rows; row++) {
            const rect = {x: col * pitch, y: row * rowPitch, w, h};
            if (rect.y + h > bounds.height || protectedRects.some(reserved => overlaps(rect, reserved)) || placed.some(other => overlaps(rect, other, gap))) continue;
            const anchor = anchors[order];
            const score = Math.hypot((rect.x + w / 2) / bounds.width - anchor[0], (rect.y + h / 2) / bounds.height - anchor[1]);
            candidates.push({...rect, score});
          }
        }
        candidates.sort((a, b) => a.score - b.score);
        best = candidates[0];
      }
      if (!best) return;
      placed.push(best);
      module.style.setProperty('--image-x', `${best.x}px`);
      module.style.setProperty('--image-y', `${best.y}px`);
      module.style.setProperty('--image-w', `${best.w}px`);
      module.style.setProperty('--image-h', `${best.h}px`);
      module.style.setProperty('--image-delay', preference.matches ? '0ms' : `${entranceDelay + order * 90}ms`);
      module.classList.add('is-active');
    });
    hero.dataset.keyword = words[scene];
    hero.dataset.imageCount = String(placed.length);
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
