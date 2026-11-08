import * as THREE from 'three';
import { gsap } from 'gsap';
import { setupLighting } from './lighting.js';
import { createPhone } from './phone.js';
import { createAccessories } from './accessories.js';
import { createWifiScene } from './wifi.js';
import { QualityManager } from './quality.js';

/**
 * DATA - WebGL Scene Renderer Engine
 * Enforces single persistent canvas, strict sizing rules,
 * gsap.ticker rendering, idle motion & adaptive quality.
 */
export function initRenderer(canvasElement) {
  const isMobile = window.innerWidth <= 768 || window.matchMedia('(max-width: 768px)').matches;

  // 1. WebGL Renderer
  const renderer = new THREE.WebGLRenderer({
    canvas: canvasElement,
    antialias: !isMobile,
    powerPreference: 'high-performance',
    alpha: true,
  });

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = false; // Strictly banned by spec

  const maxDpr = isMobile ? 1.5 : 2.0;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));

  let width = window.innerWidth;
  let height = window.innerHeight;
  let lastResizeWidth = width;
  let lastResizeHeight = height;

  renderer.setSize(width, height);

  // 2. Scene & Camera
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);

  function updateCameraForViewport(w, h) {
    const aspect = w / h;
    camera.aspect = aspect;

    if (aspect < 1) {
      // Portrait: fov 50, distance so phone height (1.52) occupies ~62% of viewport
      camera.fov = 50;
      const targetVisibleHeight = 1.52 / 0.62; // ~2.45
      const radFov = (50 * Math.PI) / 180;
      const dist = targetVisibleHeight / (2 * Math.tan(radFov / 2));
      camera.position.set(0, 0, Math.max(dist, 2.6));
    } else {
      // Desktop: fov 38, centered
      camera.fov = 38;
      camera.position.set(0, 0, 3.2);
    }
    camera.updateProjectionMatrix();
  }

  updateCameraForViewport(width, height);

  // 3. Lighting
  const lighting = setupLighting(scene, renderer);

  // Soft Radial Glow Plane behind the phone (Hero 0-0.10)
  // Accent #C8FF2E at 12% opacity so dark phone separates from dark background
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = 256;
  glowCanvas.height = 256;
  const glowCtx = glowCanvas.getContext('2d');
  const glowGrad = glowCtx.createRadialGradient(128, 128, 10, 128, 128, 128);
  glowGrad.addColorStop(0, 'rgba(200, 255, 46, 1.0)');
  glowGrad.addColorStop(0.35, 'rgba(200, 255, 46, 0.55)');
  glowGrad.addColorStop(0.7, 'rgba(200, 255, 46, 0.15)');
  glowGrad.addColorStop(1, 'rgba(200, 255, 46, 0)');
  glowCtx.fillStyle = glowGrad;
  glowCtx.fillRect(0, 0, 256, 256);

  const glowTexture = new THREE.CanvasTexture(glowCanvas);
  const glowGeom = new THREE.PlaneGeometry(2.4, 2.4);
  const glowMat = new THREE.MeshBasicMaterial({
    map: glowTexture,
    transparent: true,
    opacity: 0.12, // Strict 12% opacity
    depthWrite: false,
  });
  const heroGlowMesh = new THREE.Mesh(glowGeom, glowMat);
  heroGlowMesh.name = 'heroGlow';
  heroGlowMesh.position.set(0, 0, -0.15);
  scene.add(heroGlowMesh);

  // 4. Phone Component
  const phone = createPhone({ isMobile });
  scene.add(phone.group);

  // 5. Accessories Component
  const accessories = createAccessories();
  scene.add(accessories.group);

  // 6. WiFi Scene Component
  const wifiScene = createWifiScene();
  scene.add(wifiScene.group);

  // 7. Adaptive Quality Controller
  let idleFrozen = false;
  const quality = new QualityManager({
    renderer,
    lighting,
    onFreezeIdle: () => {
      idleFrozen = true;
    },
  });

  // 8. Desktop Pointer Parallax (+/- 2 degrees = +/- 0.035 rad)
  let quickParallaxX = null;
  let quickParallaxY = null;
  if (!isMobile && window.matchMedia('(pointer: fine)').matches) {
    quickParallaxX = gsap.quickTo(camera.rotation, 'y', { duration: 0.8, ease: 'power3.out' });
    quickParallaxY = gsap.quickTo(camera.rotation, 'x', { duration: 0.8, ease: 'power3.out' });

    window.addEventListener('mousemove', (e) => {
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = (e.clientY / window.innerHeight) * 2 - 1;
      const maxAngle = (2 * Math.PI) / 180;
      quickParallaxX(-normX * maxAngle);
      quickParallaxY(-normY * maxAngle);
    });
  }

  // 9. Resize Handling
  // "On resize, ignore height-only changes under 150px; call renderer.setSize only on width or orientation change"
  window.addEventListener('resize', () => {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
    const widthChanged = Math.abs(newWidth - lastResizeWidth) > 2;
    const heightDelta = Math.abs(newHeight - lastResizeHeight);

    if (widthChanged || heightDelta > 150) {
      width = newWidth;
      height = newHeight;
      lastResizeWidth = newWidth;
      lastResizeHeight = newHeight;
      renderer.setSize(width, height);
      updateCameraForViewport(width, height);
    }
  });

  // 10. Pause on hidden or not intersecting
  let isPageVisible = !document.hidden;
  document.addEventListener('visibilitychange', () => {
    isPageVisible = !document.hidden;
  });

  let isCanvasIntersecting = true;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        isCanvasIntersecting = entry.isIntersecting;
      });
    },
    { threshold: 0.01 }
  );
  observer.observe(canvasElement);

  // 11. State & Ticker Loop (Strictly GSAP ticker, no requestAnimationFrame)
  let isScrolling = false;
  let scrollTimeout = null;
  const idleState = {
    time: 0,
    baseY: 0,
    baseRotY: 0,
  };

  function markScrolling() {
    isScrolling = true;
    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      isScrolling = false;
    }, 150);
  }

  // Ticker callback for GSAP
  function onTick(time, deltaTime) {
    if (!isPageVisible || !isCanvasIntersecting) return;

    quality.tick();

    const dt = deltaTime / 1000;
    idleState.time += dt;

    // Idle motion:
    // "phone floats y +/- 0.04 on a 4s sine and rotates 0.1 rad/s while not scrolling."
    if (!idleFrozen && !isScrolling) {
      const sineVal = Math.sin((idleState.time * 2 * Math.PI) / 4);
      phone.group.position.y = idleState.baseY + sineVal * 0.04;
      phone.group.rotation.y += 0.1 * dt;
    }

    // Tick sub-scenes
    accessories.tick(idleState.time, idleFrozen);
    wifiScene.tick(idleState.time, idleFrozen);

    // Render
    renderer.render(scene, camera);
  }

  gsap.ticker.add(onTick);

  return {
    scene,
    camera,
    renderer,
    phone,
    accessories,
    wifiScene,
    quality,
    markScrolling,
    getSize: () => ({ width, height }),
    setHeroGlowOpacity: (opacity) => {
      glowMat.opacity = opacity;
      heroGlowMesh.visible = opacity > 0.001;
    },
    setIdleBasePos: (y) => {
      idleState.baseY = y;
    },
    dispose() {
      gsap.ticker.remove(onTick);
      observer.disconnect();
      glowGeom.dispose();
      glowMat.dispose();
      glowTexture.dispose();
      phone.dispose();
      accessories.dispose();
      wifiScene.dispose();
      lighting.dispose();
      renderer.dispose();
    },
  };
}
