import { gsap } from 'gsap';

/**
 * Interactive Button Dynamics (Magnetic Interactions)
 * Dot cursor removed per user request.
 */
export function initCursor() {
  if (!window.matchMedia('(pointer: fine)').matches) {
    return;
  }

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
