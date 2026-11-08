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

  // Velocity driver loop (UPGRADE.md U4 Item 3)
  // Scroll velocity from Lenis (desktop) or ScrollTrigger getVelocity() (touch), smoothed with gsap.quickTo
  // Drives chromatic aberration (clamped at 0.0025), camera roll up to 1.2 deg, phone tilt up to 3 deg
  gsap.ticker.add(() => {
    let vel = 0;
    if (lenis && isFinePointer) {
      vel = (lenis.velocity || 0) * 60;
    } else if (typeof ScrollTrigger.getVelocity === 'function') {
      vel = ScrollTrigger.getVelocity();
    }

    // Deadband: below 15 px/s is treated as idle (0)
    if (Math.abs(vel) < 15) {
      vel = 0;
    }

    if (typeof rendererObj.updateScrollVelocity === 'function') {
      rendererObj.updateScrollVelocity(vel);
    }
  });

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

        if (typeof rendererObj.setScrollProgress === 'function') {
          rendererObj.setScrollProgress(p);
        }

        // DATA watermark moves at 0.4x scroll speed (U2 Item 5)
        const wordmark = document.querySelector('.hero-wordmark');
        if (wordmark) {
          const scrollY = window.scrollY || window.pageYOffset || 0;
          wordmark.style.transform = `translate3d(0, ${scrollY * 0.4}px, 0)`;
        }

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

        // inspect: 0.20 - 0.56 (TEARDOWN.md Part T2: 5 windows with 0.01 gap to eliminate ghosts)
        const isInspect = p >= 0.19 && p <= 0.56;
        overlayObj.setSectionState('inspect', isInspect ? 1 : 0, isInspect);

        if (isInspect) {
          // 01 Battery 0.20-0.26, 02 Board 0.27-0.33, 03 Camera 0.34-0.40, 04 Port 0.41-0.47, 05 Screen 0.48-0.55
          if (p >= 0.20 && p < 0.260) {
            phone.setActivePart('battery');
            overlayObj.setInspectLabel('battery');
            phone.batteryGroup.getWorldPosition(debugPhoneVec);
            if (typeof rendererObj.setInspectSpotTarget === 'function') rendererObj.setInspectSpotTarget(debugPhoneVec, 4.0);
          } else if (p >= 0.270 && p < 0.330) {
            phone.setActivePart('board');
            overlayObj.setInspectLabel('board');
            phone.boardGroup.getWorldPosition(debugPhoneVec);
            if (typeof rendererObj.setInspectSpotTarget === 'function') rendererObj.setInspectSpotTarget(debugPhoneVec, 4.0);
          } else if (p >= 0.340 && p < 0.400) {
            phone.setActivePart('cameraUnit');
            overlayObj.setInspectLabel('camera');
            phone.cameraUnitGroup.getWorldPosition(debugPhoneVec);
            if (typeof rendererObj.setInspectSpotTarget === 'function') rendererObj.setInspectSpotTarget(debugPhoneVec, 4.0);
          } else if (p >= 0.410 && p < 0.470) {
            phone.setActivePart('port');
            overlayObj.setInspectLabel('port');
            phone.portGroup.getWorldPosition(debugPhoneVec);
            if (typeof rendererObj.setInspectSpotTarget === 'function') rendererObj.setInspectSpotTarget(debugPhoneVec, 4.0);
          } else if (p >= 0.480 && p <= 0.550) {
            phone.setActivePart('screen');
            overlayObj.setInspectLabel('screen');
            phone.screenGroup.getWorldPosition(debugPhoneVec);
            if (typeof rendererObj.setInspectSpotTarget === 'function') rendererObj.setInspectSpotTarget(debugPhoneVec, 3.5);
          } else {
            phone.setActivePart(null);
            overlayObj.setInspectLabel(null);
            if (typeof rendererObj.setInspectSpotTarget === 'function') rendererObj.setInspectSpotTarget(debugPhoneVec, 0.0);
          }
        } else {
          phone.setActivePart(null);
          overlayObj.setInspectLabel(null);
          if (typeof rendererObj.setInspectSpotTarget === 'function') rendererObj.setInspectSpotTarget(debugPhoneVec, 0.0);
        }

        // rebuild: 0.56 - 0.66
        const isRebuild = p > 0.56 && p < 0.66;
        overlayObj.setSectionState('rebuild', isRebuild ? 1 : 0, isRebuild);

        // accessories: 0.66 - 0.80
        const isAccessories = p >= 0.66 && p < 0.80;
        overlayObj.setSectionState('accessories', isAccessories ? 1 : 0, isAccessories);
        if (isAccessories) {
          let beat = 0;
          if (p >= 0.77) beat = 3;
          else if (p >= 0.73) beat = 2;
          else if (p >= 0.70) beat = 1;
          overlayObj.setAccessoryBeat(beat);
        }

        // wifi: 0.80 - 0.91
        const isWifi = p >= 0.80 && p < 0.91;
        overlayObj.setSectionState('wifi', isWifi ? 1 : 0, isWifi);
        if (isWifi) {
          let planIndex = 0;
          let speedMbps = 10;
          if (p < 0.835) {
            planIndex = 0;
            const t = Math.max(0, Math.min(1, (p - 0.80) / 0.035));
            speedMbps = Math.round(2 + t * 8);
          } else if (p < 0.875) {
            planIndex = 1;
            const t = Math.max(0, Math.min(1, (p - 0.835) / 0.04));
            speedMbps = Math.round(10 + t * 10);
          } else {
            planIndex = 2;
            const t = Math.max(0, Math.min(1, (p - 0.875) / 0.035));
            speedMbps = Math.round(20 + t * 30);
          }
          overlayObj.setWifiPlan(planIndex);
          wifiScene.setPlan(planIndex);
          phone.renderScreenState('wifi', speedMbps);
        }

        // finale: 0.91 - 1.00
        const isFinale = p >= 0.91;
        overlayObj.setSectionState('contact', isFinale ? 1 : 0, isFinale);

        // Screen Texture Redraw States (UPGRADE.md U5, U6 & U7)
        if (p < 0.56) {
          phone.renderScreenState('lock');
        } else if (p >= 0.56 && p < 0.60) {
          phone.renderScreenState('off');
        } else if (p >= 0.60 && p < 0.612) {
          phone.renderScreenState('boot');
        } else if (p >= 0.612 && p < 0.77) {
          const checkProgress = Math.max(0, Math.min(1, (p - 0.612) / 0.023));
          phone.renderScreenState('fixed', checkProgress);
        } else if (p >= 0.77 && p < 0.80) {
          const chargePct = Math.round(12 + ((p - 0.77) / 0.03) * 88);
          phone.renderScreenState('charge', chargePct);
        } else if (p >= 0.80 && p < 0.91) {
          // Handled above in isWifi
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
  masterTl.set({}, {}, 100); // Guarantees exact 100 unit duration for 1:1 progress mapping

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
