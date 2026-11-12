/* Keep the production composition and continuous background untouched. */
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
      hero.removeAttribute('data-parallax-active');
      return;
    }
    const bounds = hero.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, -bounds.top / Math.max(1, bounds.height)));
    const eased = progress * progress * (3 - 2 * progress);
    background.style.transform = `translate3d(0, ${(bounds.height * .07 * eased).toFixed(2)}px, 0) scale(${(1 + .18 * eased).toFixed(4)})`;
    hero.toggleAttribute('data-parallax-active', bounds.bottom > 0 && bounds.top <= 0);
  }
  function queueBackground() {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => { scrollFrame = null; backgroundScroll(); });
  }

  function positionCopy() {
    if (!content || !awards || !navigation) return;
    if (!matchMedia('(max-width: 768px)').matches) {
      content.style.removeProperty('--hero-copy-optical-offset');
      return;
    }
    const haze = getComputedStyle(navigation, '::before');
    const hazeBottom = (parseFloat(haze.top) || 0) + (parseFloat(haze.height) || navigation.offsetHeight);
    // Layout offsets exclude both the entrance animation and our own optical lift.
    const awardsTop = content.offsetTop + awards.offsetTop;
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
    current = makeWord(words[index], true);
    slot.replaceChildren(current);
    heading.setAttribute('aria-label', 'Crafting strategic identities');
    hero.dataset.keyword = words[index];
    queueLayout();
    // The original constellation entrance completes before the first shared pulse.
    setInterval(flip, 2900);
  }
  const fallback = setTimeout(start, 1500);
  if (document.fonts) document.fonts.ready.then(() => { clearTimeout(fallback); start(); });
  else { clearTimeout(fallback); start(); }
  preference.addEventListener('change', () => {
    starAnimations.forEach(animation => animation.cancel());
    starAnimations = [];
    queueBackground();
  });
  window.addEventListener('resize', queueLayout);
  window.addEventListener('load', queueLayout);
  if ('ResizeObserver' in window && navigation) new ResizeObserver(queueLayout).observe(navigation);
  window.addEventListener('scroll', () => { if (backgroundVisible) queueBackground(); }, { passive: true });
  if (background && 'IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      backgroundVisible = entries[0].isIntersecting;
      queueBackground();
    }, { threshold: 0 }).observe(hero);
  }
})();
