import { gsap } from 'gsap';

/**
 * Preloader Controller (UPGRADE.md U2)
 * - Characters D A T A rise through masks
 * - 1px accent line draws left to right with mono counter 000 to 100
 * - Waits for document.fonts.ready and renderer.compileAsync
 * - Reveals hero by clip-path wipe upward (clip-path: inset(0 0 100% 0))
 * - Total duration at most 1.8s
 */
export function initPreloader(options = {}) {
  // Support either function callback or options object
  const onComplete = typeof options === 'function' ? options : options.onComplete;
  const readyPromise = options.readyPromise || Promise.resolve();

  const preloaderEl = document.getElementById('preloader');
  const counterEl = document.getElementById('preloader-counter');
  const lineFillEl = document.querySelector('.preloader-line-fill');
  const charEls = document.querySelectorAll('.preloader-char');

  if (!preloaderEl || !counterEl) {
    if (typeof onComplete === 'function') onComplete();
    return;
  }

  let isReady = false;
  let counterDone = false;
  let hasRevealed = false;

  function doWipe() {
    if (hasRevealed) return;
    hasRevealed = true;

    // Upward clip-path wipe
    gsap.to(preloaderEl, {
      clipPath: 'inset(0 0 100% 0)',
      duration: 0.65,
      ease: 'power3.inOut',
      onComplete: () => {
        preloaderEl.style.display = 'none';
        if (typeof onComplete === 'function') onComplete();
      },
    });
  }

  // Track asset readiness with a strict timeout to guarantee <= 1.8s total
  const safetyTimeout = new Promise((resolve) => setTimeout(resolve, 1100));
  Promise.race([readyPromise, safetyTimeout]).finally(() => {
    isReady = true;
    if (counterDone) {
      doWipe();
    }
  });

  const tl = gsap.timeline({
    onComplete: () => {
      counterDone = true;
      if (isReady) {
        doWipe();
      }
    },
  });

  // 1. D A T A characters rise through masks
  tl.to(
    charEls,
    {
      y: '0%',
      duration: 0.75,
      stagger: 0.07,
      ease: 'expo.out',
    },
    0.05
  );

  // 2. 1px accent line draws left to right (width: 0% -> 100%)
  if (lineFillEl) {
    tl.to(
      lineFillEl,
      {
        width: '100%',
        duration: 1.0,
        ease: 'power2.inOut',
      },
      0.0
    );
  }

  // 3. Mono counter 000 -> 100
  const counterObj = { value: 0 };
  tl.to(
    counterObj,
    {
      value: 100,
      duration: 1.0,
      ease: 'power2.inOut',
      onUpdate: () => {
        counterEl.textContent = Math.floor(counterObj.value).toString().padStart(3, '0');
      },
    },
    0.0
  );
}
