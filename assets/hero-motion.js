/* Keyword changes gently gather and release the existing organic background. */
(() => {
  const hero = document.querySelector('.hero');
  const slot = document.getElementById('typingText');
  if (!hero || !slot) return;
  const atmosphere = hero.querySelector('.hero-atmosphere');
  const subtitle = hero.querySelector('.hero-subtitle');
  const words = ['Strategic', 'Refined', 'Iconic', 'Distinct', 'Bold', 'Just Cool'];
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0;
  let current = slot.querySelector('.flip-word');
  let cleanup, pulse, layoutFrame;

  if (new URLSearchParams(location.search).get('hero') === 'name') {
    hero.classList.add('hero--name');
    const title = hero.querySelector('h1');
    const name = document.createElement('span');
    name.className = 'hero-line';
    name.textContent = 'Wonkyoung Seo';
    const descriptor = document.createElement('p');
    descriptor.className = 'hero-name-descriptor';
    descriptor.append('Crafting ', slot, ' identities.');
    title.replaceChildren(name);
    title.setAttribute('aria-label', 'Wonkyoung Seo');
    title.after(descriptor);
  }

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

  function breathe() {
    if (!atmosphere || preference.matches) return;
    if (pulse) pulse.cancel();
    pulse = atmosphere.animate([
      { transform: 'scale(1)', opacity: 1, filter: 'brightness(1)', offset: 0 },
      { transform: 'scale(.945)', opacity: .72, filter: 'brightness(.94)', offset: .22 },
      { transform: 'scale(1.035)', opacity: 1, filter: 'brightness(1.14)', offset: .60 },
      { transform: 'scale(1)', opacity: 1, filter: 'brightness(1)', offset: 1 }
    ], { duration: 1500, easing: 'cubic-bezier(.25,.65,.25,1)' });
  }
  function flip() {
    clearTimeout(cleanup);
    slot.querySelectorAll('.is-leaving').forEach(node => node.remove());
    const previous = current;
    index = (index + 1) % words.length;
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
    hero.dataset.keyword = words[index];
    breathe();
  }

  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    hero.dataset.keyword = words[index];
    arrangeBackground();
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
  preference.addEventListener('change', () => { if (pulse) pulse.cancel(); });
})();
