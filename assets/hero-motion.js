/* Flip Words style: a complete word, then staggered characters with blur and lift.
   Native Web Animations keeps this static portfolio independent of React. */
(() => {
  const hero = document.querySelector('.hero');
  const slot = document.getElementById('typingText');
  if (!hero || !slot) return;
  const words = ['STRATEGIC', 'REFINED', 'ICONIC', 'DISTINCT', 'BOLD', 'JUST COOL'];
  const media = [
    ['theframe', 'The Frame', 'theframe-01-960.webp'],
    ['odyssey-oled', 'Odyssey OLED', 'odyssey-oled-01-960.webp'],
    ['mrgb', 'Micro RGB', 'mrgb-01-960.webp'],
    ['thepremiere-8k', 'The Premiere 8K', 'thepremiere-8k-01-960.webp'],
    ['ballie', 'Ballie', 'ballie-01-960.webp'],
    ['viewfinity', 'ViewFinity', 'viewfinity-01-960.webp']
  ];
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  const field = hero.querySelector('.hero-workfield');
  const frames = [...hero.querySelectorAll('.hero-workfield-tile')];
  const activeAnimations = new Set();
  let wordIndex = 0;
  let timer;
  let inView = true;
  let disposed = false;
  const run = (element, keyframes, options) => {
    const animation = element.animate(keyframes, options);
    activeAnimations.add(animation);
    animation.finished.catch(() => {}).finally(() => activeAnimations.delete(animation));
    return animation;
  };
  const makeWord = (text) => {
    const node = document.createElement('span');
    node.className = 'flip-word';
    [...text].forEach(char => {
      const span = document.createElement('span');
      span.textContent = char === ' ' ? '\u00a0' : char;
      node.append(span);
    });
    return node;
  };
  let currentWord = slot.querySelector('.flip-word');
  const updateFrame = async (frame, index) => {
    const [, , file] = media[index % media.length];
    const old = frame.querySelector('img');
    const image = new Image();
    image.src = `assets/thumbs/list/${file}`;
    image.alt = '';
    image.className = 'hero-media-current';
    try { await image.decode(); } catch { return; }
    if (disposed || motionPreference.matches || document.hidden || !inView) return;
    frame.append(image);
    await run(image, [
      { opacity: 0, transform: 'translate3d(16%,8%,0) scale(1.1)', filter: 'blur(5px)' },
      { opacity: 1, transform: 'translate3d(0,0,0) scale(1)', filter: 'blur(0px)' }
    ], {duration: 900, easing: 'cubic-bezier(.22,1,.36,1)'}).finished.catch(() => {});
    old?.remove();
  };
  function canAnimate() { return !disposed && !motionPreference.matches && !document.hidden && inView; }
  function schedule() { clearTimeout(timer); if (canAnimate()) timer = setTimeout(flip, 3600); }
  function flip() {
    if (!canAnimate()) return;
    wordIndex = (wordIndex + 1) % words.length;
    const previous = currentWord;
    previous.classList.add('is-leaving');
    const next = makeWord(words[wordIndex]);
    slot.append(next);
    currentWord = next;
    const exit = run(previous, [
      { opacity: 1, transform: 'translateY(0) scale(1)', filter: 'blur(0px)' },
      { opacity: 0, transform: 'translateY(-22px) scale(1.06)', filter: 'blur(7px)' }
    ], {duration: 320, easing: 'ease-out'});
    exit.finished.catch(() => {}).finally(() => previous.remove());
    [...next.children].forEach((character, index) => run(character, [
      { opacity: 0, transform: 'translateY(18px)', filter: 'blur(5px)' },
      { opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' }
    ], {duration: 480, delay: index * 32, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards'}));
    frames.forEach((frame, index) => updateFrame(frame, wordIndex + index));
    schedule();
  }
  const syncPlayback = () => {
    if (!canAnimate()) {
      clearTimeout(timer);
      activeAnimations.forEach(animation => animation.finish());
    } else schedule();
  };
  document.addEventListener('visibilitychange', syncPlayback);
  motionPreference.addEventListener('change', syncPlayback);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; syncPlayback(); }, {threshold: .05});
    observer.observe(hero);
  }
  window.addEventListener('pagehide', () => { disposed = true; clearTimeout(timer); activeAnimations.forEach(a => a.cancel()); });
  window.addEventListener('pageshow', () => { disposed = false; schedule(); });
  let lastPoint = null;
  let trailIndex = 0;
  let lastTrailTime = 0;
  hero.addEventListener('pointermove', event => {
    if (!canAnimate() || event.pointerType !== 'mouse' || !field) return;
    const rect = hero.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    field.style.setProperty('--pointer-x', `${(x / rect.width - .5) * 32}px`);
    field.style.setProperty('--pointer-y', `${(y / rect.height - .5) * 24}px`);
    const now = performance.now();
    const distance = lastPoint ? Math.hypot(x - lastPoint.x, y - lastPoint.y) : 120;
    if (distance < 105 || now - lastTrailTime < 160) return;
    lastPoint = {x, y}; lastTrailTime = now;
    const images = field.querySelectorAll('.hero-image-trail');
    if (images.length >= 5) return;
    const image = new Image();
    image.src = `assets/thumbs/list/${media[trailIndex++ % media.length][2]}`;
    image.alt = ''; image.className = 'hero-image-trail';
    image.style.left = `${x}px`; image.style.top = `${y}px`;
    field.append(image);
    const rotation = trailIndex % 2 ? -9 : 8;
    const animation = run(image, [
      {opacity: 0, transform: `translate(-50%,-40%) rotate(${rotation - 5}deg) scale(.82)`},
      {opacity: .9, offset: .18, transform: `translate(-50%,-50%) rotate(${rotation}deg) scale(1)`},
      {opacity: 0, transform: `translate(-45%,-72%) rotate(${rotation + 4}deg) scale(.94)`}
    ], {duration: 1100, easing: 'cubic-bezier(.22,1,.36,1)'});
    animation.finished.catch(() => {}).finally(() => image.remove());
  }, {passive: true});
  hero.addEventListener('pointerleave', () => {
    lastPoint = null;
    field?.style.setProperty('--pointer-x', '0px');
    field?.style.setProperty('--pointer-y', '0px');
  });
  schedule();
})();
