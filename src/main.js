// Import Design Tokens & Typography
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource/dm-mono';
import './styles/tokens.css';
import './styles/base.css';
import './styles/overlay.css';

import { initRenderer } from './gl/renderer.js';
import { initPreloader } from './ui/preloader.js';
import { initCursor } from './ui/cursor.js';
import { initNav } from './ui/nav.js';
import { initOverlay } from './ui/overlay.js';
import { initScroll } from './scroll.js';
import { getOpenStatus } from './config.js';
import { initAudio } from './ui/audio.js';

/**
 * Checks for WebGL2 capability
 */
function isWebGL2Available() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGL2RenderingContext && canvas.getContext('webgl2'));
  } catch (e) {
    return false;
  }
}

/**
 * Main Application Bootstrapper
 */
function boot() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const webGLSupported = isWebGL2Available();

  // Handle fallback if no WebGL2 or reduced motion requested
  if (!webGLSupported || prefersReducedMotion) {
    document.body.classList.add('static-fallback-active');
    if (!webGLSupported) document.body.classList.add('no-webgl');
    console.warn('WebGL2 unavailable or reduced motion enabled. Running static layout.');
  }

  const canvas = document.getElementById('webgl-canvas');
  if (!canvas) return;

  initAudio();

  let scrollObj = null;
  const navigateFn = (progress) => {
    if (scrollObj) {
      scrollObj.scrollToProgress(progress);
    }
  };

  // 1. Initialize WebGL Scene
  let rendererObj = null;
  try {
    rendererObj = initRenderer(canvas, {
      onNavigate: (p) => navigateFn(p),
    });
  } catch (err) {
    console.error('Failed to initialize WebGL renderer:', err);
    document.body.classList.add('no-webgl');
  }

  // 2. Initialize Overlay Controller
  const overlayObj = initOverlay({
    phone: rendererObj?.phone,
    camera: rendererObj?.camera,
    getSize: rendererObj?.getSize || (() => ({ width: window.innerWidth, height: window.innerHeight })),
    onNavigate: navigateFn,
  });

  // 3. Navigation Controller
  const navObj = initNav({
    onNavigate: navigateFn,
  });

  // 4. Custom Follower Cursor
  initCursor();

  // 5. Scroll Timeline Orchestrator
  if (rendererObj) {
    scrollObj = initScroll({
      rendererObj,
      overlayObj,
      navObj,
    });

    // Expose debug interface for verification and performance testing
    window.__DATA_DEBUG__ = {
      renderer: rendererObj.renderer,
      scene: rendererObj.scene,
      camera: rendererObj.camera,
      phone: rendererObj.phone,
      accessories: rendererObj.accessories,
      wifiScene: rendererObj.wifiScene,
      masterTl: scrollObj.masterTl,
      quality: rendererObj.quality,
      getDrawCalls: () => rendererObj.renderer.info.render.calls,
      getTriangles: () => rendererObj.renderer.info.render.triangles,
    };

    // U1 Requirement: window.__seek(p) scrolls to progress p, waits two frames, resolves
    window.__seek = async function (p) {
      p = Math.max(0, Math.min(1, Number(p)));
      const spacer = document.getElementById('scroll-spacer');
      if (spacer) {
        const maxScroll = spacer.offsetHeight - window.innerHeight;
        const targetY = maxScroll * p;
        if (scrollObj && scrollObj.lenis) {
          scrollObj.lenis.scrollTo(targetY, { immediate: true });
        } else {
          window.scrollTo(0, targetY);
        }
        if (scrollObj && scrollObj.masterTl) {
          const st = scrollObj.masterTl.scrollTrigger;
          if (st) {
            st.scroll(targetY);
            st.update();
            const tw = st.getTween();
            if (tw) tw.totalProgress(1);
          }
          scrollObj.masterTl.progress(p);
        }
      }
      // Wait two animation frames
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      if (scrollObj && scrollObj.masterTl) {
        const st = scrollObj.masterTl.scrollTrigger;
        if (st) {
          const tw = st.getTween();
          if (tw) tw.totalProgress(1);
        }
        scrollObj.masterTl.progress(p);
      }
      return {
        progress: p,
        drawCalls: rendererObj ? rendererObj.renderer.info.render.calls : 0,
        triangles: rendererObj ? rendererObj.renderer.info.render.triangles : 0,
      };
    };
  }

  // 6. Initialize Status Chips (Hero & Finale) & Auto-Refresh every 60s (U2 Item 2 & U8 Item 4)
  function updateAllStatusChips() {
    const currentStatus = getOpenStatus();
    ['hero-status-chip', 'finale-status-chip'].forEach((chipId) => {
      const chip = document.getElementById(chipId);
      if (chip) {
        const dot = chip.querySelector('.status-dot, .status-pulse-dot');
        const label = chip.querySelector('.status-label, .status-chip-text');
        if (label) label.textContent = currentStatus.label;
        if (dot) {
          if (!currentStatus.open) {
            dot.style.background = '#FF4D4D';
            dot.style.boxShadow = '0 0 8px rgba(255, 77, 77, 0.6)';
          } else {
            dot.style.background = '#C8FF2E';
            dot.style.boxShadow = '0 0 10px rgba(200, 255, 46, 0.7)';
          }
        }
      }
    });
  }
  updateAllStatusChips();
  setInterval(updateAllStatusChips, 60000);

  // 6b. Finale Interactive Behaviors (U8 Items 2, 3, 6)
  // Pointer glow mask on oversized DATA wordmark
  const wordmarkGlow = document.getElementById('finale-wordmark-glow');
  if (wordmarkGlow) {
    window.addEventListener('pointermove', (e) => {
      const rect = wordmarkGlow.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      wordmarkGlow.style.setProperty('--mouse-x', `${x}px`);
      wordmarkGlow.style.setProperty('--mouse-y', `${y}px`);
    }, { passive: true });
  }

  // Magnetic CTA Button on Desktop (pointer: fine)
  const primaryCta = document.getElementById('finale-primary-cta');
  if (primaryCta && window.matchMedia('(pointer: fine)').matches) {
    primaryCta.addEventListener('pointermove', (e) => {
      const bounds = primaryCta.getBoundingClientRect();
      const mouseX = e.clientX - (bounds.left + bounds.width / 2);
      const mouseY = e.clientY - (bounds.top + bounds.height / 2);
      gsap.to(primaryCta, {
        x: mouseX * 0.28,
        y: mouseY * 0.28,
        duration: 0.3,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    });

    primaryCta.addEventListener('pointerleave', () => {
      gsap.to(primaryCta, {
        x: 0,
        y: 0,
        duration: 0.6,
        ease: 'elastic.out(1, 0.4)',
        overwrite: 'auto',
      });
    });
  }

  // Back to top button
  const backToTopBtn = document.getElementById('back-to-top-btn');
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof window.__seek === 'function') {
        window.__seek(0);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  // 7. Preloader Entrance & Compilation Wait (U2 Item 1 & 3)
  const compilePromise = rendererObj && typeof rendererObj.compileSceneAsync === 'function'
    ? rendererObj.compileSceneAsync()
    : Promise.resolve();

  const readyPromise = Promise.all([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    compilePromise,
  ]);

  initPreloader({
    readyPromise,
    onComplete: () => {
      if (rendererObj && typeof rendererObj.triggerRevealAnimation === 'function') {
        rendererObj.triggerRevealAnimation();
      }
      overlayObj.revealHero();
    },
  });
}

// Start once DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
