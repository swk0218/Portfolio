/* Blue keywords retain their flip transition over the production background. */
(() => {
  const hero = document.querySelector('.hero');
  const slot = document.getElementById('typingText');
  if (!hero || !slot) return;
  const words = ['Strategic', 'Refined', 'Iconic', 'Distinct', 'Bold', 'Just Cool'];
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0;
  let current = slot.querySelector('.flip-word');
  let cleanup;

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
  }

  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    hero.dataset.keyword = words[index];
    setInterval(flip, 2900);
  };
  const fontFallback = setTimeout(start, 1500);
  if (document.fonts) document.fonts.ready.then(() => { clearTimeout(fontFallback); start(); });
  else { clearTimeout(fontFallback); start(); }
})();
