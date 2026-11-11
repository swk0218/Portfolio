/* Original organic motion stays continuous; word entries add a faint light. */
(() => {
  const hero = document.querySelector('.hero');
  const slot = document.getElementById('typingText');
  if (!hero || !slot) return;
  const light = hero.querySelector('.hero-light-accent');
  const subtitle = hero.querySelector('.hero-subtitle');
  const words = ['Strategic', 'Refined', 'Iconic', 'Distinct', 'Bold', 'Just Cool'];
  // Outline left bearings at Funnel Display 600; optical alignment only.
  const opticalStarts = ['-.033287em', '-.074445em', '-.078473em', '-.074445em', '-.074445em', '-.018704em'];
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
    lightOnWordEntry();
  }

  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    hero.dataset.keyword = words[index];
    arrangeBackground();
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
