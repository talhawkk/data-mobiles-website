import { gsap } from 'gsap';

/**
 * Custom Cursor & Magnetic Interactions
 * Strictly active only when (pointer: fine)
 */
export function initCursor() {
  if (!window.matchMedia('(pointer: fine)').matches) {
    return;
  }

  const cursorEl = document.querySelector('.custom-cursor');
  if (!cursorEl) return;

  const quickX = gsap.quickTo(cursorEl, 'x', { duration: 0.2, ease: 'power3.out' });
  const quickY = gsap.quickTo(cursorEl, 'y', { duration: 0.2, ease: 'power3.out' });

  window.addEventListener('mousemove', (e) => {
    quickX(e.clientX);
    quickY(e.clientY);
  });

  // Hover states on interactive targets
  const interactiveElements = document.querySelectorAll('a, button, [role="button"], input');
  interactiveElements.forEach((el) => {
    el.addEventListener('mouseenter', () => {
      cursorEl.classList.add('active');
    });
    el.addEventListener('mouseleave', () => {
      cursorEl.classList.remove('active');
    });
  });

  // Magnetic Hover for WhatsApp Button & Primary CTA
  const magneticElements = document.querySelectorAll('.floating-whatsapp, .contact-cta-btn');
  magneticElements.forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const relX = e.clientX - (rect.left + rect.width / 2);
      const relY = e.clientY - (rect.top + rect.height / 2);

      gsap.to(el, {
        x: relX * 0.35,
        y: relY * 0.35,
        duration: 0.3,
        ease: 'power3.out',
      });
    });

    el.addEventListener('mouseleave', () => {
      gsap.to(el, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: 'elastic.out(1, 0.4)',
      });
    });
  });
}
