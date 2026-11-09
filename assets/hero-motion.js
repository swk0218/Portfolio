/* Keep words cycling in embedded previews and after returning to the page.
   CSS reduces the transition, rather than freezing the copy, for reduced motion. */
(() => {
  const slot = document.getElementById('typingText');
  if (!slot) return;
  const words = ['strategic', 'refined', 'iconic', 'distinct', 'bold', 'just cool'];
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0;
  let current = slot.querySelector('.flip-word');
  let cleanup;
  const modules = [...document.querySelectorAll('.hero-grid-module')];
  let reveal;

  function flip() {
    clearTimeout(cleanup);
    slot.querySelectorAll('.is-leaving').forEach(node => node.remove());
    index = (index + 1) % words.length;
    clearTimeout(reveal);
    modules.forEach(module => module.classList.remove('is-active'));
    if (modules.length) {
      const next = modules[index % modules.length];
      if (preference.matches) next.classList.add('is-active');
      else reveal = setTimeout(() => next.classList.add('is-active'), 190);
    }
    const previous = current;
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
      else cleanup = setTimeout(() => previous.remove(), 300);
    }
  }

  // Browser throttling handles background tabs. No observer can strand a word
  // when a host embeds or restores this document.
  setInterval(flip, 3600);
})();
