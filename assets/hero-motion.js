/* Original organic motion stays continuous; word entries add a faint light. */
(() => {
  const hero = document.querySelector('.hero');
  const slot = document.getElementById('typingText');
  if (!hero || !slot) return;
  const light = hero.querySelector('.hero-light-accent');
  const modules = hero.querySelector('.hero-modules');
  const subtitle = hero.querySelector('.hero-subtitle');
  const words = ['Strategic', 'Refined', 'Iconic', 'Distinct', 'Bold', 'Just Cool'];
  // Outline left bearings at Funnel Display 600; optical alignment only.
  const opticalStarts = ['-.033287em', '-.074445em', '-.078473em', '-.074445em', '-.074445em', '-.018704em'];
  // 3 columns × 4 rows, numbered row-first. Adjacent scenes use disjoint cells,
  // including the last-to-first transition. The grid itself never moves on a flip.
  const scenes = [
    { project: 'mrgb', name: 'Micro RGB', slots: [[0,1,3,4], [5]],
      images: [['strategic-exhibit'], ['strategic-poster', 'strategic-colorbox']] },
    { project: 'thepremiere-8k', name: 'The Premiere 8K', slots: [[6,7,9,10], [8]],
      images: [['refined-product'], ['refined-material']] },
    { project: 'ballie', name: 'Ballie', slots: [[1,2,4,5], [0]],
      images: [['iconic-stack'], ['iconic-booklet', 'iconic-box']] },
    { project: 'odyssey-oled', name: 'Odyssey OLED', slots: [[9,10], [3], [6]],
      images: [['distinct-portal'], ['distinct-type'], ['distinct-portrait']] },
    { project: 'wirelessaudio-vl', name: 'Wireless Audio VL', slots: [[4,5,7,8], [0]],
      images: [['bold-yellow', 'bold-poster'], ['bold-orange']] },
    { name: 'Just Cool', slots: [[10,11], [2], [6,9]],
      images: [['cool-cave'], ['cool-viewfinity'], ['cool-ark']],
      projects: ['monitor-os', 'viewfinity', 'ark'],
      names: ['The Odyssey Continues', 'ViewFinity', 'Ark'] }
  ];
  const imageDescriptions = {
    'strategic-exhibit': 'Micro RGB campaign exhibition',
    'strategic-poster': 'Micro RGB color campaign poster',
    'strategic-colorbox': 'Micro RGB color and material cube',
    'refined-product': 'The Premiere 8K product photography',
    'refined-material': 'The Premiere 8K metal and grille detail',
    'iconic-stack': 'Ballie and its packaging',
    'iconic-booklet': 'Ballie illustrated booklet',
    'iconic-box': 'Ballie packaging detail',
    'distinct-portal': 'Odyssey OLED portal artwork',
    'distinct-type': 'Odyssey OLED typographic poster',
    'distinct-portrait': 'Odyssey OLED campaign portrait',
    'bold-yellow': 'Wireless Audio VL geometric poster',
    'bold-orange': 'Wireless Audio VL orange graphic',
    'bold-poster': 'Wireless Audio VL outdoor poster',
    'cool-cave': 'The Odyssey Continues floating artifact artwork',
    'cool-viewfinity': 'ViewFinity glass artwork',
    'cool-ark': 'Ark lifestyle photography'
  };
  const entries = words.map(() => 0);
  const title = hero.querySelector('.hero-title');
  const measure = document.createElement('canvas').getContext('2d');
  let activeSet;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0;
  let current = slot.querySelector('.flip-word');
  let cleanup, lightAnimation, layoutFrame;

  function arrangeBackground() {
    const bounds = hero.getBoundingClientRect();
    const copyBottom = subtitle.getBoundingClientRect().bottom - bounds.top;
    const compact = matchMedia('(max-width: 1199px)').matches;
    const wide = bounds.width / bounds.height > 1.4;
    let x, y, size;
    if (compact && !wide) {
      const top = copyBottom + Math.min(28, Math.max(12, bounds.height * .025));
      const space = Math.max(80, bounds.height - top);
      size = Math.min(bounds.width * (bounds.width < 600 ? 1.7 : .98), space * 1.5, 840);
      x = bounds.width * (bounds.width < 600 ? .56 : .62);
      y = top + space * .73;
    } else {
      size = Math.min(bounds.width * (compact ? .58 : .64), bounds.height * .9, 960);
      x = bounds.width * .82;
      y = bounds.height * .63;
    }
    hero.style.setProperty('--hero-orb-x', `${Math.round(x)}px`);
    hero.style.setProperty('--hero-orb-y', `${Math.round(y)}px`);
    hero.style.setProperty('--hero-orb-size', `${Math.round(size)}px`);
    arrangeModules(bounds, copyBottom);
  }
  function arrangeModules(bounds, copyBottom) {
    if (!modules) return;
    const content = hero.querySelector('.hero-content');
    const contentStyle = getComputedStyle(content);
    const railLeft = parseFloat(contentStyle.paddingLeft);
    const railRight = bounds.width - parseFloat(contentStyle.paddingRight);
    const portrait = bounds.width / bounds.height <= 1.4;
    let left, top, width, available;
    if (portrait) {
      width = Math.min(railRight - railLeft, 620);
      left = railRight - width;
      top = copyBottom + Math.min(28, Math.max(20, bounds.height * .025));
      available = bounds.height - Math.max(20, parseFloat(contentStyle.paddingBottom) || 0) - top;
    } else {
      const style = getComputedStyle(title);
      const size = parseFloat(style.fontSize);
      measure.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const tracking = parseFloat(style.letterSpacing) || 0;
      // A stable reservation for the widest keyword, not the currently visible one.
      const widest = Math.max(...words.map(word => measure.measureText(word).width + tracking * (word.length - 1)),
        ...[...title.querySelectorAll('.hero-word')].map(word => word.getBoundingClientRect().width));
      left = Math.max(bounds.width * .58, railLeft + widest + Math.max(24, size * .12));
      width = Math.max(0, railRight - left);
      top = Math.max(parseFloat(contentStyle.paddingTop), bounds.height * .20);
      available = bounds.height - 28 - top;
    }
    const height = Math.max(0, Math.min(available, width * 1.25));
    top += Math.max(0, (available - height) * .5);
    modules.style.left = `${left}px`;
    modules.style.top = `${top}px`;
    modules.style.width = `${width}px`;
    modules.style.height = `${height}px`;
    hero.dataset.moduleLayout = portrait ? 'below' : 'side';
    hero.style.setProperty('--hero-copy-max', `${Math.max(0, left - railLeft - 24)}px`);
    modules.classList.toggle('is-short', portrait && height < 210);
    modules.hidden = width < 90 || height < 70;
  }
  function showImages(sceneIndex) {
    if (!modules) return;
    modules.querySelectorAll('.is-leaving').forEach(set => set.remove());
    if (activeSet) {
      const previous = activeSet;
      previous.classList.add('is-leaving');
      previous.inert = true;
      if (preference.matches) previous.remove();
      else setTimeout(() => previous.remove(), 440);
    }
    const scene = scenes[sceneIndex];
    const entry = entries[sceneIndex]++;
    activeSet = document.createElement('div');
    activeSet.className = 'hero-module-set';
    activeSet.dataset.scene = words[sceneIndex];
    scene.slots.forEach((cells, order) => {
      const first = Math.min(...cells), last = Math.max(...cells);
      const row = Math.floor(first / 3) + 1, column = first % 3 + 1;
      const rowSpan = Math.floor(last / 3) - row + 2;
      const columnSpan = last % 3 - column + 2;
      const project = scene.projects ? scene.projects[order] : scene.project;
      const name = scene.names ? scene.names[order] : scene.name;
      const file = scene.images[order][entry % scene.images[order].length];
      const card = document.createElement('a');
      card.className = 'hero-module';
      card.href = `projects/${project}.html`;
      card.setAttribute('aria-label', `Explore ${name}`);
      card.dataset.cells = cells.join(',');
      card.style.gridArea = `${row} / ${column} / span ${rowSpan} / span ${columnSpan}`;
      card.style.setProperty('--module-order', order);
      const image = document.createElement('img');
      image.src = `assets/hero/glimpses/${file}.webp`;
      image.alt = imageDescriptions[file];
      image.decoding = 'async';
      image.draggable = false;
      card.append(image);
      activeSet.append(card);
    });
    modules.append(activeSet);
    // Next scene loads in advance; no network wait interrupts the shared rhythm.
    scenes[(sceneIndex + 1) % scenes.length].images.flat().forEach(file => {
      const image = new Image();
      image.src = `assets/hero/glimpses/${file}.webp`;
    });
  }
  function queueLayout() {
    cancelAnimationFrame(layoutFrame);
    layoutFrame = requestAnimationFrame(arrangeBackground);
  }

  function lightOnWordEntry() {
    if (!light || preference.matches) return;
    if (lightAnimation && lightAnimation.playState === 'running') return;
    lightAnimation = light.animate([
      { opacity: 0, easing: 'ease-in-out' },
      { opacity: .075, easing: 'ease-in-out' },
      { opacity: 0 }
    ], { duration: 2200, delay: 250 });
  }
  function flip() {
    if (modules && modules.matches(':focus-within')) return;
    clearTimeout(cleanup);
    slot.querySelectorAll('.is-leaving').forEach(node => node.remove());
    const previous = current;
    index = (index + 1) % words.length;
    current = document.createElement('span');
    current.className = 'flip-word';
    current.style.setProperty('--word-optical-start', opticalStarts[index]);
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
    hero.dataset.keyword = words[index];
    showImages(index);
    lightOnWordEntry();
  }

  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    hero.dataset.keyword = words[index];
    arrangeBackground();
    showImages(index);
    lightOnWordEntry();
    setInterval(flip, 2900);
  };
  const fontFallback = setTimeout(start, 1500);
  if (document.fonts) document.fonts.ready.then(() => { clearTimeout(fontFallback); start(); });
  else { clearTimeout(fontFallback); start(); }
  window.addEventListener('resize', queueLayout);
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(queueLayout);
    [hero, subtitle, document.querySelector('nav')].filter(Boolean).forEach(node => observer.observe(node));
  }
  preference.addEventListener('change', () => { if (lightAnimation) lightAnimation.cancel(); });
})();
