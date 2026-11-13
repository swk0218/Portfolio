
    (() => {
      const lightboxItems = JSON.parse(document.getElementById('projectMedia').textContent);
      const modal = document.getElementById('projectLightbox');
      if (!modal || !lightboxItems.length) return;

      const stage = modal.querySelector('.lightbox-stage');
      const caption = modal.querySelector('.lightbox-caption');
      const counter = modal.querySelector('.lightbox-counter');
      const closeButton = modal.querySelector('.lightbox-close');
      const prevButton = modal.querySelector('.lightbox-prev');
      const nextButton = modal.querySelector('.lightbox-next');
      let index = 0;
      let touchStartX = 0;
      let canSwipe = false;
      let returnFocus = null;
      let backgroundState = [];

      const escapeHtml = (value) => String(value || '').replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[char]));

      function render() {
        const item = lightboxItems[index];
        const alt = escapeHtml(item.alt);
        const src = escapeHtml(item.src);
        if (item.type === 'video') {
          stage.innerHTML = `<video src="${src}" aria-label="${alt}" controls autoplay playsinline preload="auto"></video>`;
        } else if (item.type === 'embed') {
          const joiner = src.includes('?') ? '&' : '?';
          const embedSrc = `${src}${joiner}autoplay=1`;
          stage.innerHTML = `<iframe src="${embedSrc}" title="${alt}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
        } else {
          stage.innerHTML = `<img src="${src}" alt="${alt}">`;
        }
        caption.textContent = item.caption || '';
        counter.textContent = `${index + 1} / ${lightboxItems.length}`;
      }

      function open(nextIndex, trigger) {
        returnFocus = trigger;
        index = Number(nextIndex) || 0;
        render();
        modal.inert = false;
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('lightbox-open');
        closeButton.focus({ preventScroll: true });
        backgroundState = Array.from(document.body.children)
          .filter(el => el !== modal && !['SCRIPT', 'STYLE', 'LINK'].includes(el.tagName))
          .map(el => [el, el.inert]);
        backgroundState.forEach(([el]) => { el.inert = true; });
      }

      function close() {
        backgroundState.forEach(([el, wasInert]) => { el.inert = wasInert; });
        backgroundState = [];
        if (returnFocus && returnFocus.isConnected) returnFocus.focus({ preventScroll: true });
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        modal.inert = true;
        document.body.classList.remove('lightbox-open');
        stage.replaceChildren();
      }

      function move(delta) {
        index = (index + delta + lightboxItems.length) % lightboxItems.length;
        render();
      }

      document.querySelectorAll('[data-lightbox-index]').forEach((trigger) => {
        trigger.addEventListener('click', (event) => {
          event.preventDefault();
          open(trigger.getAttribute('data-lightbox-index'), trigger);
        });
      });

      closeButton.addEventListener('click', close);
      prevButton.addEventListener('click', () => move(-1));
      nextButton.addEventListener('click', () => move(1));
      modal.addEventListener('click', (event) => {
        if (event.target === modal) close();
      });
      document.addEventListener('keydown', (event) => {
        if (!modal.classList.contains('is-open')) return;
        if (event.key === 'Tab') {
          const controls = Array.from(modal.querySelectorAll('button, [href], input, select, textarea, video[controls], iframe, [tabindex]'))
            .filter(el => !el.disabled && el.tabIndex >= 0 && el.getClientRects().length);
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
        if (event.key === 'Escape') close();
        const usesArrowKeys = event.target?.isContentEditable ||
          event.target?.closest?.('input, textarea, select, video[controls]');
        if (event.key === 'ArrowLeft' && !usesArrowKeys) move(-1);
        if (event.key === 'ArrowRight' && !usesArrowKeys) move(1);
      });
      stage.addEventListener('touchstart', (event) => {
        canSwipe = !event.target.closest('video[controls], iframe, input, textarea, select, button, a');
        if (!canSwipe) return;
        touchStartX = event.changedTouches[0].clientX;
      }, { passive: true });
      stage.addEventListener('touchend', (event) => {
        if (!canSwipe) return;
        canSwipe = false;
        const delta = event.changedTouches[0].clientX - touchStartX;
        if (Math.abs(delta) > 45) move(delta > 0 ? -1 : 1);
      }, { passive: true });
    })();
