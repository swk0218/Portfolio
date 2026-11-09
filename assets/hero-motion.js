/* Complete-word transitions; no typing caret, image field, or cursor trail. */
(() => {
  const hero = document.querySelector('.hero');
  const slot = document.getElementById('typingText');
  if (!hero || !slot) return;
  const words = ['STRATEGIC', 'REFINED', 'ICONIC', 'DISTINCT', 'BOLD', 'JUST COOL'];
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const animations = new Set();
  let current = slot.querySelector('.flip-word');
  let index = 0;
  let timer;
  let inView = true;
  let suspended = false;
  const canPlay = () => !preference.matches && !document.hidden && inView && !suspended;
  function animate(element, frames, options) {
    const animation = element.animate(frames, options);
    animations.add(animation);
    animation.finished.catch(() => {}).finally(() => animations.delete(animation));
    return animation;
  }
  function schedule() {
    clearTimeout(timer);
    if (canPlay()) timer = setTimeout(flip, 3600);
  }
  function flip() {
    if (!canPlay()) return;
    index = (index + 1) % words.length;
    const previous = current;
    previous.classList.add('is-leaving');
    current = document.createElement('span');
    current.className = 'flip-word';
    for (const char of words[index]) {
      const span = document.createElement('span');
      span.textContent = char === ' ' ? '\u00a0' : char;
      current.append(span);
    }
    slot.append(current);
    const exit = animate(previous, [
      {opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)'},
      {opacity: 0, transform: 'translateY(-18px)', filter: 'blur(6px)'}
    ], {duration: 300, easing: 'ease-out'});
    exit.finished.catch(() => {}).finally(() => previous.remove());
    [...current.children].forEach((span, order) => animate(span, [
      {opacity: 0, transform: 'translateY(16px)', filter: 'blur(4px)'},
      {opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)'}
    ], {duration: 460, delay: order * 30, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards'}));
    schedule();
  }
  function sync() {
    if (canPlay()) schedule();
    else {
      clearTimeout(timer);
      animations.forEach(animation => { try { animation.finish(); } catch {} });
    }
  }
  document.addEventListener('visibilitychange', sync);
  preference.addEventListener('change', sync);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    }, {threshold: .05}).observe(hero);
  }
  window.addEventListener('pagehide', () => {
    suspended = true;
    clearTimeout(timer);
    animations.forEach(animation => animation.cancel());
  });
  window.addEventListener('pageshow', () => { suspended = false; sync(); });
  schedule();
})();
