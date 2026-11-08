import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger.js';
import Lenis from 'lenis';

import * as heroScene from './scenes/hero.js';
import * as teardownScene from './scenes/teardown.js';
import * as rebuildScene from './scenes/rebuild.js';
import * as accessoriesScene from './scenes/accessories.js';
import * as wifiSceneModule from './scenes/wifi.js';
import * as finaleScene from './scenes/finale.js';

gsap.registerPlugin(ScrollTrigger);

/**
 * DATA - Master Scroll Orchestrator
 * Progress Map v2 (UPGRADE.md):
 * - hero: 0.00 - 0.07
 * - open: 0.07 - 0.20
 * - inspect: 0.20 - 0.56 (01 Battery, 02 Board, 03 Camera, 04 Port, 05 Screen)
 * - rebuild: 0.56 - 0.66
 * - accessories: 0.66 - 0.80
 * - wifi: 0.80 - 0.91
 * - finale: 0.91 - 1.00
 *
 * Layout Contract:
 * - Desktop: text column 0 to 38vw left; 3D stage right 58vw via camera.setViewOffset
 * - Portrait mobile: 3D stage top 58svh; text anchored at bottom with 20px pad + safe-area
 */
export function initScroll({
  rendererObj,
  overlayObj,
  navObj,
}) {
  const { phone, accessories, wifiScene, camera, markScrolling } = rendererObj;

  // 1. Lenis Smooth Scrolling (Desktop only)
  let lenis = null;
  const isFinePointer = window.matchMedia('(pointer: fine)').matches;

  if (isFinePointer) {
    lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  }

  // Mobile ScrollTrigger Config
  ScrollTrigger.config({ ignoreMobileResize: true });
  if (ScrollTrigger.isTouch === 1) {
    ScrollTrigger.normalizeScroll(true);
  }

  // 2. Base Camera Initial Position
  const initialCamZ = camera.position.z;

  // Reusable vectors for debug logging (no per-frame allocations)
  const debugAccVec = new THREE.Vector3();
  const debugRouterVec = new THREE.Vector3();
  const debugPhoneVec = new THREE.Vector3();
  let lastLoggedProgress = -1;

  // 3. One Master GSAP Timeline (Duration 100 units for exact 0.00 -> 1.00 mapping)
  const masterTl = gsap.timeline({
    scrollTrigger: {
      trigger: '#scroll-spacer',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.8,
      onUpdate: (self) => {
        markScrolling();
        const p = self.progress;

        // Debug logging at timeline progress ~0.84 per requirement
        const tlProg = masterTl.progress();
        if (Math.abs(tlProg - 0.84) < 0.008 && Math.abs(tlProg - lastLoggedProgress) > 0.005) {
          lastLoggedProgress = tlProg;
          accessories.group.getWorldPosition(debugAccVec);
          wifiScene.group.getWorldPosition(debugRouterVec);
          phone.group.getWorldPosition(debugPhoneVec);
          console.log(
            `[DEBUG 0.84] progress=${tlProg.toFixed(3)} | ` +
            `accessories: visible=${accessories.group.visible}, scale=${accessories.group.scale.x.toFixed(3)}, pos=[${debugAccVec.x.toFixed(2)}, ${debugAccVec.y.toFixed(2)}, ${debugAccVec.z.toFixed(2)}] | ` +
            `router: visible=${wifiScene.group.visible}, scale=${wifiScene.group.scale.x.toFixed(3)}, pos=[${debugRouterVec.x.toFixed(2)}, ${debugRouterVec.y.toFixed(2)}, ${debugRouterVec.z.toFixed(2)}] | ` +
            `phone: visible=${phone.group.visible}, scale=${phone.group.scale.x.toFixed(3)}, pos=[${debugPhoneVec.x.toFixed(2)}, ${debugPhoneVec.y.toFixed(2)}, ${debugPhoneVec.z.toFixed(2)}]`
          );
        }

        // Update nav progress fill
        if (navObj && typeof navObj.updateProgress === 'function') {
          navObj.updateProgress(p);
        }

        // Section Visibilities (Progress Map v2)
        // hero: 0.00 - 0.07
        const heroOpacity = p <= 0.05 ? 1 : Math.max(0, 1 - (p - 0.05) / 0.02);
        overlayObj.setSectionState('hero', heroOpacity, p < 0.08);
        if (typeof rendererObj.setHeroGlowOpacity === 'function') {
          rendererObj.setHeroGlowOpacity(heroOpacity * 0.12);
        }

        // inspect: 0.20 - 0.56
        const isInspect = p >= 0.19 && p <= 0.56;
        overlayObj.setSectionState('inspect', isInspect ? 1 : 0, isInspect);

        if (isInspect) {
          // 01 Battery 0.20-0.27, 02 Board 0.27-0.34, 03 Camera 0.34-0.41, 04 Port 0.41-0.48, 05 Screen 0.48-0.56
          if (p >= 0.20 && p < 0.27) overlayObj.setInspectLabel('battery');
          else if (p >= 0.27 && p < 0.34) overlayObj.setInspectLabel('board');
          else if (p >= 0.34 && p < 0.41) overlayObj.setInspectLabel('camera');
          else if (p >= 0.41 && p < 0.48) overlayObj.setInspectLabel('port');
          else if (p >= 0.48 && p <= 0.56) overlayObj.setInspectLabel('screen');
          else overlayObj.setInspectLabel(null);
        } else {
          overlayObj.setInspectLabel(null);
        }

        // rebuild: 0.56 - 0.66
        const isRebuild = p > 0.56 && p < 0.66;
        overlayObj.setSectionState('rebuild', isRebuild ? 1 : 0, isRebuild);

        // accessories: 0.66 - 0.80
        const isAccessories = p >= 0.66 && p < 0.80;
        overlayObj.setSectionState('accessories', isAccessories ? 1 : 0, isAccessories);

        // wifi: 0.80 - 0.91
        const isWifi = p >= 0.80 && p < 0.91;
        overlayObj.setSectionState('wifi', isWifi ? 1 : 0, isWifi);

        // finale: 0.91 - 1.00
        const isFinale = p >= 0.91;
        overlayObj.setSectionState('contact', isFinale ? 1 : 0, isFinale);

        // Screen Texture Redraw States
        if (p < 0.56) {
          phone.renderScreenState('lock');
        } else if (p >= 0.56 && p < 0.80) {
          phone.renderScreenState('fixed');
        } else if (p >= 0.80 && p < 0.91) {
          phone.renderScreenState('wifi');
        } else {
          phone.renderScreenState('boot');
        }

        // Update 3D label projection
        overlayObj.updateInspectPosition();
      },
    },
    defaults: { ease: 'none' }, // scrub: 0.8 provides smoothing
  });

  // Timeline Labels (Progress Map v2)
  masterTl.addLabel('hero', 0);
  masterTl.addLabel('open', 7);
  masterTl.addLabel('inspect', 20);
  masterTl.addLabel('rebuild', 56);
  masterTl.addLabel('accessories', 66);
  masterTl.addLabel('wifi', 80);
  masterTl.addLabel('finale', 91);

  // 4. Build Choreography Across Modular Scene Files
  const isMobile = window.innerWidth < 1024;
  const ctx = {
    phone,
    accessories,
    wifiScene,
    camera,
    initialCamZ,
    isMobile,
    overlayObj,
    rendererObj,
  };

  heroScene.build(masterTl, ctx);
  teardownScene.build(masterTl, ctx);
  rebuildScene.build(masterTl, ctx);
  accessoriesScene.build(masterTl, ctx);
  wifiSceneModule.build(masterTl, ctx);
  finaleScene.build(masterTl, ctx);

  // Programmatic navigation to section progress
  function scrollToProgress(targetProgress) {
    const spacer = document.getElementById('scroll-spacer');
    if (!spacer) return;

    const maxScroll = spacer.offsetHeight - window.innerHeight;
    const targetY = maxScroll * targetProgress;

    if (lenis) {
      lenis.scrollTo(targetY, { duration: 1.2 });
    } else {
      window.scrollTo({
        top: targetY,
        behavior: 'smooth',
      });
    }
  }

  return {
    masterTl,
    lenis,
    scrollToProgress,
  };
}
