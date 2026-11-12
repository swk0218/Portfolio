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
  // 3 columns × 4 rows, numbered row-first. One portrait spans two rows;
  // companions occupy one cell. Adjacent scenes share no occupied cells,
  // including the last-to-first transition. The grid stays fixed on a flip.
  const scenes = [
    { project: 'mrgb', name: 'Micro RGB', slots: [0, 8, 1], rowSpans: [2, 1, 1],
      images: [['strategic-bag-portrait'], ['strategic-tv-detail'], ['strategic-color-monument']] },
    { project: 'thepremiere-8k', name: 'The Premiere 8K', slots: [4, 9, 2], rowSpans: [2, 1, 1],
      images: [['refined-portal-portrait'], ['refined-product-front'], ['refined-sunset-experience']] },
    { project: 'ballie', name: 'Ballie', slots: [8, 1, 3], rowSpans: [2, 1, 1],
      images: [['iconic-robot-stack-fresh'], ['iconic-case-interaction'], ['iconic-package-system-fresh']] },
    { project: 'odyssey-oled', name: 'Odyssey OLED', slots: [2, 10, 0], rowSpans: [2, 1, 1],
      images: [['distinct-oled-profile-fresh'], ['distinct-get-ready-fresh'], ['distinct-monitor-front-fresh']] },
    { project: 'wirelessaudio-vl', name: 'Wireless Audio VL', slots: [3, 1, 11], rowSpans: [2, 1, 1],
      images: [['bold-dancer-tall'], ['bold-speaker'], ['bold-publication']] },
    { name: 'Just Cool', slots: [4, 2, 9, 5, 10], rowSpans: [2, 1, 1, 1, 1],
      images: [['cool-ark-alt-tall'], ['cool-cave'], ['cool-optical'], ['cool-play'], ['cool-glass']],
      projects: ['ark', 'monitor-os', 'cdp-exhibit', 'smart-monitor', 'viewfinity'],
      names: ['Ark', 'The Odyssey Continues', 'Creative Pool', 'Smart Monitor', 'ViewFinity'] }
  ];
  // Prepared crops fill each frame; no automatic focal shift or letterboxing.
  const imageDescriptions = {
    "strategic-bag-portrait": "Micro RGB campaign shopping bag held by a hand",
    "strategic-tv-detail": "Micro RGB television showing a vivid color spectrum",
    "strategic-color-monument": "Micro RGB color monument with human silhouettes",
    "refined-portal-portrait": "The Premiere 8K architectural portal and projected light",
    "refined-product-front": "The Premiere 8K complete frontal product silhouette",
    "refined-sunset-experience": "The Premiere 8K sunset projection in a premium living room",
    "iconic-robot-stack-fresh": "Ballie robot displayed on its packaging stack",
    "iconic-case-interaction": "Ballie case opening tab pulled by a hand",
    "iconic-package-system-fresh": "Ballie unfolded inner packaging structure",
    "distinct-oled-profile-fresh": "Odyssey OLED thin display profile with a rainbow edge",
    "distinct-get-ready-fresh": "Odyssey OLED GET READY graphic typography",
    "distinct-monitor-front-fresh": "Odyssey OLED monitor and circular spectrum lighting",
    "bold-dancer-tall": "Wireless Audio VL dancer campaign on a large outdoor poster",
    "bold-speaker": "Wireless Audio VL speaker in a listening room",
    "bold-publication": "Wireless Audio VL orange graphic in an open publication",
    "cool-ark-alt-tall": "Ark vertical gaming display in a room",
    "cool-cave": "The Odyssey Continues floating artifact in a blue cave",
    "cool-optical": "Creative Pool optical light installation",
    "cool-play": "Smart Monitor floating headphones and creative objects",
    "cool-glass": "ViewFinity flowing blue and purple glass artwork"
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
    // A square grid field keeps one-cell frames near 1.4:1 and tall frames near 2:3.
    // Shrink the whole fixed grid on short screens instead of cropping portraits harder.
    width = Math.max(0, Math.min(width, available));
    left = railRight - width;
    const height = width;
    top += Math.max(0, (available - height) * .5);
    modules.style.left = `${left}px`;
    modules.style.top = `${top}px`;
    modules.style.width = `${width}px`;
    modules.style.height = `${height}px`;
    hero.dataset.moduleLayout = portrait ? 'below' : 'side';
    hero.style.setProperty('--hero-copy-max', `${Math.max(0, left - railLeft - 24)}px`);
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
    const incoming = activeSet;
    const decoding = [];
    scene.slots.forEach((cell, order) => {
      const row = Math.floor(cell / 3) + 1, column = cell % 3 + 1;
      const rowSpan = scene.rowSpans[order];
      const project = scene.projects ? scene.projects[order] : scene.project;
      const name = scene.names ? scene.names[order] : scene.name;
      const file = scene.images[order][entry % scene.images[order].length];
      const card = document.createElement('a');
      card.className = 'hero-module';
      card.href = `projects/${project}.html`;
      card.setAttribute('aria-label', `Explore ${name}`);
      card.dataset.cell = cell;
      card.dataset.rowSpan = rowSpan;
      card.style.gridArea = `${row} / ${column} / ${row + rowSpan} / ${column + 1}`;
      card.style.setProperty('--module-order', order);
      const image = document.createElement('img');
      image.src = `assets/hero/glimpses/${file}.webp`;
      image.alt = imageDescriptions[file];
      image.decoding = 'async';
      image.draggable = false;
      // Start the reveal after decoding, so slow images never appear already settled.
      decoding.push(image.decode().catch(() => {}));
      card.append(image);
      activeSet.append(card);
    });
    modules.append(incoming);
    Promise.all(decoding).then(() => {
      if (activeSet === incoming && incoming.isConnected) incoming.classList.add('is-ready');
    });
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
