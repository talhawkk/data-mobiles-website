import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger.js';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

/**
 * DATA - Master Scroll Orchestrator
 * Strictly adheres to section 5 & 8:
 * - One master timeline driven by one ScrollTrigger on #scroll-spacer
 * - No pin anywhere
 * - scrub: 0.8, ease: 'none' for scrubbed timelines
 * - Lenis wired to gsap.ticker on desktop (pointer: fine) only
 * - Timeline labels: hero, open, inspect, rebuild, accessories, wifi, contact
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

        // Section Visibilities
        // hero: 0 - 0.10
        const heroOpacity = p <= 0.08 ? 1 : Math.max(0, 1 - (p - 0.08) / 0.04);
        overlayObj.setSectionState('hero', heroOpacity, p < 0.12);
        if (typeof rendererObj.setHeroGlowOpacity === 'function') {
          rendererObj.setHeroGlowOpacity(heroOpacity * 0.12);
        }

        // inspect: 0.28 - 0.52
        const isInspect = p >= 0.26 && p <= 0.52;
        overlayObj.setSectionState('inspect', isInspect ? 1 : 0, isInspect);

        if (isInspect) {
          if (p >= 0.27 && p < 0.32) overlayObj.setInspectLabel('screen');
          else if (p >= 0.32 && p < 0.37) overlayObj.setInspectLabel('battery');
          else if (p >= 0.37 && p < 0.42) overlayObj.setInspectLabel('port');
          else if (p >= 0.42 && p < 0.47) overlayObj.setInspectLabel('camera');
          else if (p >= 0.47 && p <= 0.52) overlayObj.setInspectLabel('board');
        } else {
          overlayObj.setInspectLabel(null);
        }

        // rebuild: 0.52 - 0.66
        const isRebuild = p > 0.53 && p < 0.65;
        overlayObj.setSectionState('rebuild', isRebuild ? 1 : 0, isRebuild);

        // accessories: 0.66 - 0.78
        const isAccessories = p >= 0.66 && p < 0.77;
        overlayObj.setSectionState('accessories', isAccessories ? 1 : 0, isAccessories);

        // wifi: 0.78 - 0.90
        const isWifi = p >= 0.78 && p < 0.89;
        overlayObj.setSectionState('wifi', isWifi ? 1 : 0, isWifi);

        // contact: 0.90 - 1.00
        const isContact = p >= 0.90;
        overlayObj.setSectionState('contact', isContact ? 1 : 0, isContact);

        // Screen Texture Redraw States
        if (p < 0.52) {
          phone.renderScreenState('lock');
        } else if (p >= 0.52 && p < 0.77) {
          phone.renderScreenState('fixed');
        } else if (p >= 0.77 && p < 0.90) {
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

  // Timeline Labels
  masterTl.addLabel('hero', 0);
  masterTl.addLabel('open', 10);
  masterTl.addLabel('inspect', 28);
  masterTl.addLabel('rebuild', 52);
  masterTl.addLabel('accessories', 66);
  masterTl.addLabel('wifi', 78);
  masterTl.addLabel('contact', 90);

  // --- Choreography ---
  // A. Hero -> Open (0 -> 28)
  // Back cover slides off, phone rotates to show profile, explosion begins
  const phoneExplodeObj = { progress: 0 };
  masterTl.to(
    phone.group.rotation,
    {
      y: 0.6,
      x: 0.15,
      duration: 18,
    },
    10
  );

  masterTl.to(
    phoneExplodeObj,
    {
      progress: 1.0,
      duration: 18,
      onUpdate: () => {
        phone.setExplodeProgress(phoneExplodeObj.progress, false);
      },
    },
    10
  );

  // B. Inspect Phase (28 -> 52)
  // Camera glides toward assembly; phone shifts right (desktop) so label can sit left.
  // 20-degree orbit: phone.group.rotation.y sweeps +0.35 rad across the 24-unit range.
  const isMobile = window.innerWidth <= 768;
  const inspectPhoneX = isMobile ? 0 : 0.42;

  masterTl.to(
    phone.group.position,
    {
      x: inspectPhoneX,
      duration: 24,
    },
    28
  );

  masterTl.to(
    camera.position,
    {
      z: initialCamZ - 0.45,
      y: 0.05,
      duration: 24,
    },
    28
  );

  masterTl.to(
    phone.group.rotation,
    {
      y: Math.PI - 0.15 + 0.35, // base + 20° orbit across inspect range
      x: 0.05,
      duration: 24,
    },
    28
  );

  // C. Rebuild Phase (52 -> 66)
  // Parts snap back together, phone turns completely to face camera, screen says "Fixed."
  const rebuildPhoneX = isMobile ? 0 : 0.62;
  const rebuildPhoneY = isMobile ? 0.35 : 0;

  // rebuildObj goes 1→0 so setExplodeProgress(t, true) can interpret t as "how open"
  const rebuildObj = { progress: 1 };
  masterTl.to(
    rebuildObj,
    {
      progress: 0,
      duration: 14,
      onUpdate: () => {
        phone.setExplodeProgress(rebuildObj.progress, true);
      },
    },
    52
  );

  masterTl.to(
    phone.group.position,
    {
      x: rebuildPhoneX,
      y: rebuildPhoneY,
      duration: 14,
    },
    52
  );

  masterTl.to(
    camera.position,
    {
      z: initialCamZ,
      y: 0,
      x: 0,
      duration: 14,
    },
    52
  );

  masterTl.to(
    phone.group.rotation,
    {
      y: Math.PI, // Facing front screen directly
      x: 0,
      duration: 14,
    },
    52
  );

  // D. Accessories Phase (66 -> 78)
  // Camera pans, phone shifts to left, accessories orbit in on right
  const sidePhoneX = isMobile ? 0 : -0.75;
  const sidePhoneY = isMobile ? 0.45 : 0;

  // Phone moves to left during accessories entrance (66 -> 72)
  masterTl.to(
    phone.group.position,
    {
      x: sidePhoneX,
      y: sidePhoneY,
      duration: 6,
    },
    66
  );

  // Keep phone facing screen with subtle tilt
  masterTl.to(
    phone.group.rotation,
    {
      y: Math.PI - 0.2,
      x: 0.05,
      duration: 6,
    },
    66
  );

  // Position accessories group to the right (desktop) or upper (mobile)
  if (!isMobile) {
    accessories.group.position.set(0.75, 0, 0);
  } else {
    accessories.group.position.set(0, 0.45, 0);
  }

  const accObj = { scale: 0 };
  // Scale accessories in from 66 to 70
  masterTl.to(
    accObj,
    {
      scale: 1,
      duration: 4,
      onUpdate: () => {
        accessories.setProgress(accObj.scale);
      },
    },
    66
  );

  // REQUIREMENT 1: "all accessories scale to 0 and leave the frame by progress 0.78"
  // Between 74 and 78, scale accessories out to 0 and shift slightly right
  masterTl.to(
    accObj,
    {
      scale: 0,
      duration: 4,
      onUpdate: () => {
        accessories.setProgress(accObj.scale);
      },
    },
    74
  );
  if (!isMobile) {
    masterTl.to(accessories.group.position, { x: 1.6, duration: 4 }, 74);
  }

  // As accessories leave (74 -> 78), phone shifts to right half near router at small scale
  // Desktop: x = 1.05, y = -0.22, z = 0.20, scale = 0.45
  // Mobile: x = 0.28, y = 0.22, z = 0.20, scale = 0.40
  const wifiPhoneX = isMobile ? 0.28 : 1.05;
  const wifiPhoneY = isMobile ? 0.22 : -0.22;
  const wifiPhoneScale = isMobile ? 0.40 : 0.45;

  masterTl.to(
    phone.group.position,
    {
      x: wifiPhoneX,
      y: wifiPhoneY,
      z: 0.20,
      duration: 4,
    },
    74
  );

  masterTl.to(
    phone.group.scale,
    {
      x: wifiPhoneScale,
      y: wifiPhoneScale,
      z: wifiPhoneScale,
      duration: 4,
    },
    74
  );

  masterTl.to(
    phone.group.rotation,
    {
      y: Math.PI - 0.12,
      x: 0.10,
      duration: 4,
    },
    74
  );

  // E. WiFi Phase (78 -> 90)
  // Router sits in right half of frame, about 35% of viewport height, tilted 20 degrees toward camera.
  // Four accent rings expand from antennas toward camera, staggered and looping.
  // Phone shows wifi-bars screen at small scale near router.
  // Nothing overlaps heading or plan lines on left.
  const wifiRouterX = isMobile ? 0 : 0.65;
  const wifiRouterY = isMobile ? 0.52 : 0.18;
  const wifiRouterZ = isMobile ? -0.20 : 0.0;
  const targetRouterScale = isMobile ? 0.72 : 1.0;

  wifiScene.group.position.set(wifiRouterX, wifiRouterY, wifiRouterZ);

  const wifiObj = { scale: 0 };
  masterTl.to(
    wifiObj,
    {
      scale: targetRouterScale,
      duration: 4,
      onUpdate: () => {
        wifiScene.setProgress(wifiObj.scale);
      },
    },
    78
  );

  // F. Contact Phase (90 -> 100)
  // Objects settle to edges, camera pulls back by 2.5 units
  masterTl.to(
    wifiObj,
    {
      scale: 0,
      duration: 4,
      onUpdate: () => {
        wifiScene.setProgress(wifiObj.scale);
      },
    },
    90
  );

  // Restore phone scale to 1.0
  masterTl.to(
    phone.group.scale,
    {
      x: 1.0,
      y: 1.0,
      z: 1.0,
      duration: 10,
    },
    90
  );

  masterTl.to(
    phone.group.position,
    {
      x: isMobile ? 0 : 0.75,
      y: isMobile ? 0.35 : 0,
      z: 0,
      duration: 10,
    },
    90
  );

  masterTl.to(
    phone.group.rotation,
    {
      x: 0.05,
      y: Math.PI - 0.15, // Keep front screen facing camera with elegant 3D tilt
      duration: 10,
    },
    90
  );

  masterTl.to(
    camera.position,
    {
      z: initialCamZ + 2.5,
      y: 0,
      x: 0,
      duration: 10,
    },
    90
  );

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
