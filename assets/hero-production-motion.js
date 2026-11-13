/* Let the organic field grow and dissolve with reversible scroll progress. */
(() => {
  const hero = document.querySelector('.hero');
  const slot = document.getElementById('typingText');
  if (!hero || !slot) return;
  const heading = hero.querySelector('.hero-title');
  const content = hero.querySelector('.hero-content');
  const awards = hero.querySelector('.hero-award-stars');
  const navigation = document.querySelector('nav');
  const background = hero.querySelector('.hero-shader-parallax');
  const stars = [...hero.querySelectorAll('.hero-award-stars svg')];
  const words = ['Strategic', 'Refined', 'Iconic', 'Distinct', 'Bold', 'Just Cool'];
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0, current, cleanup, started = false;
  let starAnimations = [];
  let layoutFrame;
  let scrollFrame, backgroundVisible = true;

  function backgroundScroll() {
    if (!background) return;
    if (preference.matches) {
      background.style.removeProperty('transform');
      background.style.removeProperty('opacity');
      hero.removeAttribute('data-parallax-active');
      return;
    }
    const bounds = hero.getBoundingClientRect();
    const distance = Math.max(0, Math.min(bounds.height, -bounds.top));
    // Complete the dissolve before the hero exits; both values reverse with the scroll.
    const progress = Math.min(1, distance / Math.max(1, bounds.height * .8));
    const eased = 1 - (1 - progress) ** 2;
    const scale = 1 + .7 * eased;
    const dissolve = progress * progress * (3 - 2 * progress);
    background.style.transform = `translate3d(0, ${(distance * .25).toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
    background.style.opacity = (1 - dissolve).toFixed(4);
    hero.toggleAttribute('data-parallax-active', bounds.bottom > 0 && bounds.top <= 0);
  }
  function queueBackground() {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => { scrollFrame = null; backgroundScroll(); });
  }

  function positionCopy() {
    if (!content || !awards || !navigation) return;
    const haze = getComputedStyle(navigation, '::before');
    const hazeBottom = (parseFloat(haze.top) || 0) + (parseFloat(haze.height) || navigation.offsetHeight);
    // Offset-based coordinates exclude entrance animations and our own translation.
    const awardsTop = content.offsetTop + awards.offsetTop;
    if (matchMedia('(min-width: 1200px)').matches) {
      const rootSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const baseOffset = Math.min(rootSize, Math.max(rootSize * .55, innerHeight * .014));
      const offset = Math.max(baseOffset, hazeBottom + 20 - awardsTop);
      content.style.setProperty('--hero-copy-desktop-offset', `${offset}px`);
      content.style.removeProperty('--hero-copy-optical-offset');
      return;
    }
    content.style.removeProperty('--hero-copy-desktop-offset');
    if (!matchMedia('(max-width: 768px)').matches) {
      content.style.removeProperty('--hero-copy-optical-offset');
      return;
    }
    const desiredLift = Math.min(35.2, Math.max(19.2, hero.clientHeight * .035));
    const lift = Math.max(0, Math.min(desiredLift, awardsTop - hazeBottom - 16));
    content.style.setProperty('--hero-copy-optical-offset', `${-lift}px`);
  }
  function queueLayout() {
    cancelAnimationFrame(layoutFrame);
    layoutFrame = requestAnimationFrame(() => { positionCopy(); queueBackground(); });
  }

  function makeWord(word, animate) {
    const node = document.createElement('span');
    node.className = 'flip-word';
    node.setAttribute('aria-hidden', 'true');
    if (animate && !preference.matches) node.classList.add('is-entering');
    [...word].forEach((char, order) => {
      const letter = document.createElement('span');
      letter.textContent = char === ' ' ? '\u00a0' : char;
      letter.style.setProperty('--letter-index', order);
      node.append(letter);
    });
    return node;
  }

  function awardWave() {
    starAnimations.forEach(animation => animation.cancel());
    starAnimations = [];
    if (preference.matches) return;
    const blur = matchMedia('(max-width: 600px)').matches ? '.45px' : '.65px';
    // A disappearing/reappearing full turn travels across the six fixed centers.
    // Its 1.375s total matches the final staggered letter settling into place.
    starAnimations = stars.map((star, order) => star.animate([
      { transform: 'translateX(-50%) rotate(0deg)', opacity: 1, filter: 'blur(0px)', offset: 0, easing: 'cubic-bezier(.55,0,.8,.4)' },
      { transform: 'translateX(-50%) rotate(160deg)', opacity: 0, filter: `blur(${blur})`, offset: .26 },
      { transform: 'translateX(-50%) rotate(180deg)', opacity: 0, filter: `blur(${blur})`, offset: .34, easing: 'cubic-bezier(.25,.75,.25,1)' },
      { transform: 'translateX(-50%) rotate(360deg)', opacity: 1, filter: 'blur(0px)', offset: 1 }
    ], { duration: 1100, delay: order * 55, easing: 'linear' }));
  }

  function flip() {
    if (document.hidden) return;
    clearTimeout(cleanup);
    slot.querySelectorAll('.is-leaving').forEach(node => node.remove());
    const previous = current;
    index = (index + 1) % words.length;
    current = makeWord(words[index], true);
    if (previous && !preference.matches) previous.classList.add('is-leaving');
    slot.append(current);
    if (previous) {
      if (preference.matches) previous.remove();
      else cleanup = setTimeout(() => previous.remove(), 440);
    }
    heading.setAttribute('aria-label', `Crafting ${words[index].toLowerCase()} identities`);
    hero.dataset.keyword = words[index];
    queueLayout();
    awardWave();
  }

  function start() {
    if (started) return;
    started = true;
    slot.classList.add('flip-slot');
    // Adopt the word prepared in HTML without restarting its staged first reveal.
    current = slot.querySelector('.flip-word');
    if (!current) {
      current = makeWord(words[index], true);
      current.classList.add('is-initial');
      slot.replaceChildren(current);
    }
    heading.setAttribute('aria-label', 'Crafting strategic identities');
    hero.dataset.keyword = words[index];
    queueLayout();
    // Leave the first revealed word readable, then retain the existing cycle cadence.
    setTimeout(() => {
      flip();
      setInterval(flip, 2900);
    }, 4200);
  }
  start();
  // Font completion adjusts layout without delaying or replaying the entrance.
  if (document.fonts) document.fonts.ready.then(queueLayout);
  // Let the foreground paint before loading the larger WebGL background bundle.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const shader = document.createElement('script');
    shader.src = 'assets/hero-shadergradient.js?v=20260915';
    shader.async = true;
    document.body.append(shader);
  }));
  preference.addEventListener('change', () => {
    starAnimations.forEach(animation => animation.cancel());
    starAnimations = [];
    queueBackground();
  });
  window.addEventListener('resize', queueLayout);
  window.addEventListener('load', queueLayout);
  if ('ResizeObserver' in window && navigation) new ResizeObserver(queueLayout).observe(navigation);
  window.addEventListener('scroll', () => { if (backgroundVisible) queueBackground(); }, { passive: true, capture: true });
  if (background && 'IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      backgroundVisible = entries[0].isIntersecting;
      queueBackground();
    }, { threshold: 0 }).observe(hero);
  }
})();
