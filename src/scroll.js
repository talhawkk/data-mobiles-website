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

        // Update nav progress fill
        if (navObj && typeof navObj.updateProgress === 'function') {
          navObj.updateProgress(p);
        }

        // Section Visibilities
        // hero: 0 - 0.10
        const heroOpacity = p <= 0.08 ? 1 : Math.max(0, 1 - (p - 0.08) / 0.04);
        overlayObj.setSectionState('hero', heroOpacity, p < 0.12);

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
        phone.setExplodeProgress(phoneExplodeObj.progress);
      },
    },
    10
  );

  // B. Inspect Phase (28 -> 52)
  // Camera glides through parts as phone rotates towards front screen
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
      y: Math.PI - 0.15,
      x: 0.05,
      duration: 24,
    },
    28
  );

  // C. Rebuild Phase (52 -> 66)
  // Parts snap back together, phone turns completely to face camera, screen says "Fixed."
  const isMobile = window.innerWidth <= 768;
  const rebuildPhoneX = isMobile ? 0 : 0.62;
  const rebuildPhoneY = isMobile ? 0.35 : 0;

  masterTl.to(
    phoneExplodeObj,
    {
      progress: 0,
      duration: 14,
      onUpdate: () => {
        phone.setExplodeProgress(phoneExplodeObj.progress);
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

  masterTl.to(
    phone.group.position,
    {
      x: sidePhoneX,
      y: sidePhoneY,
      duration: 12,
    },
    66
  );

  // Keep phone facing screen with subtle tilt
  masterTl.to(
    phone.group.rotation,
    {
      y: Math.PI - 0.2,
      x: 0.05,
      duration: 12,
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
  masterTl.to(
    accObj,
    {
      scale: 1,
      duration: 12,
      onUpdate: () => {
        accessories.setProgress(accObj.scale);
      },
    },
    66
  );

  // E. WiFi Phase (78 -> 90)
  // Accessories scale out, phone shifts, wifi router appears with rings
  masterTl.to(
    accObj,
    {
      scale: 0,
      duration: 6,
      onUpdate: () => {
        accessories.setProgress(accObj.scale);
      },
    },
    78
  );

  // Position wifi scene to the right (desktop) or upper (mobile)
  if (!isMobile) {
    wifiScene.group.position.set(0.75, -0.05, 0);
  } else {
    wifiScene.group.position.set(0, 0.4, 0);
  }

  const wifiObj = { scale: 0 };
  masterTl.to(
    wifiObj,
    {
      scale: 1,
      duration: 12,
      onUpdate: () => {
        wifiScene.setProgress(wifiObj.scale);
      },
    },
    78
  );

  masterTl.to(
    phone.group.position,
    {
      x: isMobile ? 0 : 0.65,
      y: isMobile ? 0.4 : -0.2,
      duration: 12,
    },
    78
  );

  masterTl.to(
    phone.group.rotation,
    {
      y: Math.PI + 0.15,
      x: 0.08,
      duration: 12,
    },
    78
  );

  // F. Contact Phase (90 -> 100)
  // Objects settle to edges, camera pulls back by 2.5 units
  masterTl.to(
    wifiObj,
    {
      scale: 0,
      duration: 8,
      onUpdate: () => {
        wifiScene.setProgress(wifiObj.scale);
      },
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
