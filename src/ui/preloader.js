import { gsap } from 'gsap';

/**
 * Preloader Controller
 * Counter 0 -> 100 and letters D A T A assembling.
 * Maximum duration: 1.8s total.
 */
export function initPreloader(onComplete) {
  const preloaderEl = document.getElementById('preloader');
  const counterEl = document.getElementById('preloader-counter');
  const charEls = document.querySelectorAll('.preloader-char');

  if (!preloaderEl || !counterEl) {
    if (typeof onComplete === 'function') onComplete();
    return;
  }

  const tl = gsap.timeline({
    onComplete: () => {
      gsap.to(preloaderEl, {
        yPercent: -100,
        duration: 0.7,
        ease: 'power3.inOut',
        onComplete: () => {
          preloaderEl.style.display = 'none';
          if (typeof onComplete === 'function') onComplete();
        },
      });
    },
  });

  const counterObj = { value: 0 };

  // Animate counter from 0 to 100 in 1.1s
  tl.to(counterObj, {
    value: 100,
    duration: 1.1,
    ease: 'power3.inOut',
    onUpdate: () => {
      counterEl.textContent = `${Math.floor(counterObj.value).toString().padStart(3, '0')}%`;
    },
  }, 0);

  // Assemble letters D A T A
  tl.to(charEls, {
    y: 0,
    duration: 0.9,
    stagger: 0.08,
    ease: 'expo.out',
  }, 0.1);

  // Fade counter text slightly before exit
  tl.to(counterEl, {
    opacity: 0.4,
    duration: 0.3,
  }, 1.1);
}
