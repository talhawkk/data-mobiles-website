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

  // 1. Initialize WebGL Scene
  let rendererObj = null;
  try {
    rendererObj = initRenderer(canvas);
  } catch (err) {
    console.error('Failed to initialize WebGL renderer:', err);
    document.body.classList.add('no-webgl');
  }

  // 2. Initialize Overlay Controller
  const overlayObj = initOverlay({
    phone: rendererObj?.phone,
    camera: rendererObj?.camera,
    getSize: rendererObj?.getSize || (() => ({ width: window.innerWidth, height: window.innerHeight })),
  });

  // 3. Navigation Controller
  let scrollObj = null;
  const navObj = initNav({
    onNavigate: (progress) => {
      if (scrollObj) {
        scrollObj.scrollToProgress(progress);
      }
    },
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
  }

  // 6. Preloader Entrance
  initPreloader(() => {
    overlayObj.revealHero();
  });
}

// Start once DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
