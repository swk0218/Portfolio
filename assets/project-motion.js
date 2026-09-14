
        // Viewport rail/full-bleed sync (midcheck)
        (function () {
            const root = document.documentElement;
            if (!root) return;

            function syncFullBleed() {
                const width = Math.max(root.clientWidth || 0, window.innerWidth || 0);
                const safeWidth = root.clientWidth || width;
                if (!safeWidth) return;
                root.style.setProperty('--full-bleed-width', `${safeWidth}px`);
                root.style.setProperty('--full-bleed-offset', `calc(50% - ${safeWidth / 2}px)`);
            }

            syncFullBleed();
            window.addEventListener('resize', syncFullBleed, { passive: true });
            window.addEventListener('orientationchange', syncFullBleed, { passive: true });
        })();
        // /Viewport rail/full-bleed sync (midcheck)

        // Locopopo-inspired scroll reveal (midcheck)
        (function () {
            if (!document.body || !document.body.classList.contains('motion-loco')) return;

            const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            const revealables = [];
            const seen = new Set();

            function add(el, type = 'text', delay = 0) {
                if (!el || seen.has(el)) return;
                seen.add(el);
                el.setAttribute('data-reveal', type);
                el.style.setProperty('--reveal-delay', `${Math.max(0, Math.round(delay))}ms`);
                revealables.push(el);
            }

            document.querySelectorAll('.project-card').forEach((card, index) => {
                const base = Math.min((index % 4) * 90, 270);
                add(card.querySelector('.project-image'), 'media', base);
                add(card.querySelector('.project-details'), 'text', base + 115);
            });

            document.querySelectorAll('.work-item').forEach((item, index) => {
                const base = Math.min((index % 6) * 55, 275);
                add(item.querySelector('.work-item-image'), 'media', base);
                add(item.querySelector('.work-item-category'), 'text', base + 82);
                add(item.querySelector('.work-item-title'), 'text', base + 104);
                add(item.querySelector('.work-item-tagline'), 'text', base + 126);
                add(item.querySelector('.work-item-awards'), 'text', base + 142);
            });

            [
                '.selected-works-title',
                '.all-work .section-title',
                '.work-tabs',
                '.about-grid > div',
                '.skill-item',
                '.awards-section .about-contact-label',
                '.awards-section .feature-item',
                '.featured-in .about-contact-label',
                '.featured-in .feature-item',
                '.about-contact-item',
                '.site-footer',
                '.project-header',
                '.hero-media',
                '.overview-section',
                '.shot-block',
                '.next'
            ].forEach((selector) => {
                document.querySelectorAll(selector).forEach((el, index) => {
                    const media = el.matches('.hero-media, .shot-block');
                    const delay = media ? Math.min((index % 6) * 62, 310) : Math.min((index % 8) * 54, 270);
                    add(el, media ? 'media' : 'text', delay);
                });
            });

            if (!revealables.length) return;

            let observer = null;

            function reveal(el) {
                el.setAttribute('data-reveal-state', 'in');
                if (observer) observer.unobserve(el);
            }

            if (reduce) {
                revealables.forEach((el) => reveal(el));
                return;
            }

            function revealVisible() {
                const vh = window.innerHeight || document.documentElement.clientHeight;
                revealables.forEach((el) => {
                    if (el.getAttribute('data-reveal-state') === 'in') return;
                    const rect = el.getBoundingClientRect();
                    if (rect.top < vh * 0.92 && rect.bottom > 0) reveal(el);
                });
            }

            if ('IntersectionObserver' in window) {
                observer = new IntersectionObserver((entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) reveal(entry.target);
                    });
                }, { threshold: 0.13, rootMargin: '0px 0px -7% 0px' });
                revealables.forEach((el) => observer.observe(el));
            }

            requestAnimationFrame(revealVisible);
            window.addEventListener('load', revealVisible, { once: true });
            window.addEventListener('hashchange', () => requestAnimationFrame(revealVisible));
        })();
        // /Locopopo-inspired scroll reveal (midcheck)
