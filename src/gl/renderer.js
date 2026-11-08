import * as THREE from 'three';
import { gsap } from 'gsap';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { setupLighting } from './lighting.js';
import { createPhone } from './phone.js';
import { createAccessories } from './accessories.js';
import { createWifiScene } from './wifi.js';
import { QualityManager } from './quality.js';

/**
 * Custom Post-Processing Shader (UPGRADE.md U4 Item 2)
 * Features:
 * - Vignette 0.35
 * - Animated grain 0.04
 * - Radial chromatic aberration driven by scroll velocity (clamped at 0.0025)
 * - 1/255 dither in shader to prevent banding on 8-bit dark backgrounds
 */
const PostProcessShader = {
  name: 'DATA_PostProcessShader',
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uVignette: { value: 0.35 },
    uGrain: { value: 0.04 },
    uAberration: { value: 0.0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform vec2 uResolution;
    uniform float uVignette;
    uniform float uGrain;
    uniform float uAberration;

    varying vec2 vUv;

    // High quality pseudo-random hash
    float hash(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    void main() {
      vec2 uv = vUv;
      vec2 coord = uv - 0.5;

      // 1. Chromatic Aberration (radial displacement, clamped at 0.0025)
      vec2 offset = coord * uAberration;
      float r = texture2D(tDiffuse, uv + offset).r;
      float g = texture2D(tDiffuse, uv).g;
      float b = texture2D(tDiffuse, uv - offset).b;
      vec3 color = vec3(r, g, b);

      // 2. Vignette (strength 0.35, smooth falloff from center)
      float dist = length(coord) * 1.4142;
      float vignette = clamp(1.0 - smoothstep(0.4, 1.25, dist) * uVignette, 0.0, 1.0);
      color *= vignette;

      // 3. Animated Grain (strength 0.04)
      vec2 grainCoord = uv * uResolution + fract(uTime * 19.37);
      float grain = (hash(grainCoord) - 0.5) * uGrain;
      color += grain;

      // 4. 1/255 Dither in shader to eliminate banding on 8-bit dark backgrounds
      float dither = (hash(uv * uResolution + fract(uTime * 3.17) + 1.234) - 0.5) / 255.0;
      color += dither;

      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

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
  // (c) Tone mapping applied exactly once, exposure adjusted for visibility
  renderer.toneMappingExposure = 1.25;
  renderer.shadowMap.enabled = false; // Strictly banned by spec
  renderer.info.autoReset = false; // Controlled frame reset so composer pass counts are accurate

  const maxDpr = isMobile ? 1.5 : 2.0;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));

  let width = window.innerWidth;
  let height = window.innerHeight;
  let lastResizeWidth = width;
  let lastResizeHeight = height;

  renderer.setSize(width, height);

  // 2. Scene & Camera
  const scene = new THREE.Scene();

  // (a) scene.fog off
  scene.fog = null;

  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);

  function updateCameraForViewport(w, h) {
    const aspect = w / h;
    camera.aspect = aspect;

    if (w >= 1024) {
      // Desktop: fov 38, centered in stage via setViewOffset (stage is right 58vw)
      // Hero phone height is strictly 62% of viewport height (phone height = 1.52)
      camera.fov = 38;
      const targetVisibleHeight = 1.52 / 0.62;
      const radFov = (38 * Math.PI) / 360;
      const dist = targetVisibleHeight / (2 * Math.tan(radFov));
      camera.position.set(0, 0, dist);
      camera.setViewOffset(w, h, -0.21 * w, 0, w, h);
    } else {
      // Mobile portrait (<1024): fov 50, stage is top 58svh (phone height at most 46svh tall)
      camera.fov = 50;
      const targetVisibleHeight = 1.52 / 0.46;
      const radFov = (50 * Math.PI) / 360;
      const dist = targetVisibleHeight / (2 * Math.tan(radFov));
      camera.position.set(0, 0, Math.max(dist, 2.6));
      camera.setViewOffset(w, h, 0, 0.21 * h, w, h);
    }
    camera.updateProjectionMatrix();
  }

  updateCameraForViewport(width, height);

  // 3. Lighting & Environment Setup
  const lighting = setupLighting(scene, renderer);
  // Initial environment rotation for sweep
  scene.environmentRotation.set(0, -0.7, 0);

  // Inspection SpotLight (TEARDOWN.md Part T2: disabled on mobile)
  let inspectSpotLight = null;
  if (!isMobile) {
    inspectSpotLight = new THREE.SpotLight(0xFFFFFF, 0, 8, 0.5, 0.8, 1);
    inspectSpotLight.position.set(-1.6, 2.2, 3.2);
    inspectSpotLight.castShadow = false;
    scene.add(inspectSpotLight);
    scene.add(inspectSpotLight.target);
  }

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

  // 4. Phone Component & Idle / Tilt Wrappers
  const phone = createPhone({ isMobile });

  const idleWrapper = new THREE.Group();
  idleWrapper.name = 'idleWrapper';
  scene.add(idleWrapper);

  const velocityTiltGroup = new THREE.Group();
  velocityTiltGroup.name = 'velocityTiltGroup';
  idleWrapper.add(velocityTiltGroup);

  const tiltGroup = new THREE.Group();
  tiltGroup.name = 'tiltGroup';
  velocityTiltGroup.add(tiltGroup);

  tiltGroup.add(phone.group);

  // 5. Accessories Component
  const accessories = createAccessories();
  scene.add(accessories.group);

  // 6. WiFi Scene Component
  const wifiScene = createWifiScene();
  scene.add(wifiScene.group);

  // 7. Post-Processing Pipeline (UPGRADE.md U4 Item 2)
  // Tier 0: RenderPass, UnrealBloomPass (0.35, 0.6, 0.85), custom ShaderPass, OutputPass
  // Tier 1: bloomPass.enabled = false
  // Tier 2 & touch: no composer (renderer.render direct)
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(renderer.getPixelRatio());
  composer.setSize(width, height);

  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(width, height),
    0.35, // strength
    0.6,  // radius
    0.85  // threshold
  );
  composer.addPass(bloomPass);

  const customShaderPass = new ShaderPass(PostProcessShader);
  customShaderPass.uniforms.uResolution.value.set(width, height);
  composer.addPass(customShaderPass);

  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  function updateComposerTier(tier) {
    if (composer) {
      composer.setPixelRatio(renderer.getPixelRatio());
    }
    if (bloomPass) {
      bloomPass.enabled = (tier === 0);
    }
  }

  // 8. Adaptive Quality Controller
  let idleFrozen = false;
  const quality = new QualityManager({
    renderer,
    lighting,
    onFreezeIdle: () => {
      idleFrozen = true;
    },
    onTierChange: (newTier) => {
      updateComposerTier(newTier);
    },
  });
  updateComposerTier(quality.getTier());

  // 9. Desktop Pointer Tilt up to 6 degrees via gsap.quickTo
  let currentScrollProgress = 0;
  const isTouch = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  let quickTiltX = null;
  let quickTiltY = null;
  if (!isTouch && window.matchMedia('(pointer: fine)').matches) {
    quickTiltX = gsap.quickTo(tiltGroup.rotation, 'x', { duration: 0.6, ease: 'power2.out' });
    quickTiltY = gsap.quickTo(tiltGroup.rotation, 'y', { duration: 0.6, ease: 'power2.out' });

    window.addEventListener('mousemove', (e) => {
      if (currentScrollProgress > 0.08) {
        quickTiltX(0);
        quickTiltY(0);
        return;
      }
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = (e.clientY / window.innerHeight) * 2 - 1;
      const maxTilt = (6 * Math.PI) / 180; // 6 degrees
      quickTiltX(-normY * maxTilt);
      quickTiltY(normX * maxTilt);
    });
  }

  // 10. Scroll Velocity Drivers (UPGRADE.md U4 Item 3)
  // Drives chromatic aberration (clamped at 0.0025), camera roll up to 1.2 deg, phone tilt up to 3 deg
  // Zero when idle. Touch effects halved.
  const touchFactor = isTouch ? 0.5 : 1.0;
  const maxRollRad = (1.2 * Math.PI / 180) * touchFactor;
  const maxTiltRad = (3.0 * Math.PI / 180) * touchFactor;
  const maxAberration = 0.0025 * touchFactor;

  const quickRoll = gsap.quickTo(camera.rotation, 'z', {
    duration: 0.45,
    ease: 'power2.out',
  });
  const quickTilt = gsap.quickTo(velocityTiltGroup.rotation, 'x', {
    duration: 0.45,
    ease: 'power2.out',
  });
  const quickAberration = customShaderPass
    ? gsap.quickTo(customShaderPass.uniforms.uAberration, 'value', {
        duration: 0.45,
        ease: 'power2.out',
      })
    : null;

  function updateScrollVelocity(vel) {
    const factor = Math.max(-1.0, Math.min(1.0, vel / 2500));
    const absFactor = Math.abs(factor);

    const targetRoll = factor * maxRollRad;
    const targetTilt = factor * maxTiltRad;
    const targetAberration = absFactor * maxAberration;

    quickRoll(targetRoll);
    quickTilt(targetTilt);
    if (quickAberration) {
      quickAberration(targetAberration);
    }
  }

  // 11. Resize Handling
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
      if (composer) {
        composer.setSize(width, height);
        composer.setPixelRatio(renderer.getPixelRatio());
      }
      if (bloomPass) {
        bloomPass.setSize(width, height);
      }
      if (customShaderPass) {
        customShaderPass.uniforms.uResolution.value.set(width, height);
      }
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
  const baseCamPos = { x: 0, y: 0 };
  const idleState = {
    time: 0,
    baseY: 0,
    baseRotY: 0,
  };

  // 12. Debug HUD for ?debug=1 (progress, fps, draw calls, triangles, tier)
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const isDebugMode = urlParams?.get('debug') === '1';
  let hudEl = null;

  if (isDebugMode) {
    hudEl = document.createElement('div');
    hudEl.id = 'debug-hud';
    hudEl.style.cssText = [
      'position: fixed',
      'top: 16px',
      'right: 16px',
      'z-index: 99999',
      'background: rgba(11, 11, 12, 0.90)',
      'border: 1px solid rgba(200, 255, 46, 0.4)',
      'color: #C8FF2E',
      'font-family: "DM Mono", monospace',
      'font-size: 11px',
      'line-height: 1.5',
      'padding: 8px 12px',
      'pointer-events: none',
      'border-radius: 2px',
      'letter-spacing: 0.05em',
    ].join(';');
    document.body.appendChild(hudEl);
  }

  // 13. QA Debug Exploded View (?explode=0..1&part=battery|board|camera|port|screen|cover)
  const explodeParam = urlParams?.get('explode');
  const partParam = urlParams?.get('part');
  if (explodeParam !== null && explodeParam !== undefined) {
    const explodeVal = Math.max(0, Math.min(1, parseFloat(explodeParam)));
    idleFrozen = true;
    phone.setExplodeProgress(explodeVal);

    if (partParam) {
      phone.setActivePart(partParam);
      const partGroupMap = {
        battery: phone.batteryGroup,
        board: phone.boardGroup,
        camera: phone.cameraUnitGroup,
        port: phone.portGroup,
        screen: phone.screenGroup,
        cover: phone.backCoverGroup,
      };
      const targetGrp = partGroupMap[partParam];
      if (targetGrp) {
        phone.group.rotation.set(0.12, 0.45, 0);
        phone.setExplodeProgress(explodeVal);
        const targetWorldPos = new THREE.Vector3();
        targetGrp.getWorldPosition(targetWorldPos);
        camera.lookAt(targetWorldPos);
      }
    } else if (explodeVal > 0) {
      phone.group.rotation.set(0.12, 0.52, 0);
    }
  }

  function markScrolling() {
    isScrolling = true;
    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      isScrolling = false;
    }, 150);
  }

  // Reveal Light Sweep Animation (U2 Item 3)
  function triggerRevealAnimation() {
    scene.environmentRotation.set(0, -0.7, 0);
    gsap.to(scene.environmentRotation, {
      y: 0.4,
      duration: 2.4,
      ease: 'expo.out',
    });

    const baseRim = lighting.rimLight.intensity;
    gsap.fromTo(
      lighting.rimLight,
      { intensity: baseRim * 2 },
      {
        intensity: baseRim,
        duration: 2.4,
        ease: 'expo.out',
      }
    );
  }

  // Ticker callback for GSAP
  function onTick(time, deltaTime) {
    if (!isPageVisible || !isCanvasIntersecting) return;

    renderer.info.reset();
    quality.tick();

    const dt = deltaTime / 1000;
    idleState.time += dt;

    // Idle motion & Hero sway/tilt (U2 Item 4):
    // - Float and slow yaw
    // - Desktop pointer tilt up to 6 degrees via gsap.quickTo
    // - Touch: slow 8 degree sway
    // - Smoothly fades out as scroll progresses beyond hero
    const heroInfluence = Math.max(0, 1 - currentScrollProgress / 0.07);

    if (!idleFrozen) {
      if (heroInfluence > 0.001) {
        // Vertical sinusoidal float (y +/- 0.035, 3.5s period)
        const floatY = Math.sin(idleState.time * (Math.PI * 2 / 3.5)) * 0.035;
        // Slow yaw (subtle +/- 0.05 rad (~3 deg), 5.0s period)
        const slowYaw = Math.sin(idleState.time * (Math.PI * 2 / 5.0)) * 0.05;

        idleWrapper.position.y = (idleState.baseY + floatY) * heroInfluence;
        idleWrapper.rotation.y = slowYaw * heroInfluence;

        // Touch: slow 8 degree sway (8 * Math.PI / 180 = ~0.1396 rad, 4.0s period)
        if (isTouch) {
          const touchSway = Math.sin(idleState.time * (Math.PI * 2 / 4.0)) * ((8 * Math.PI) / 180);
          tiltGroup.rotation.y = touchSway * heroInfluence;
        }
      } else {
        idleWrapper.position.y = 0;
        idleWrapper.rotation.y = 0;
        if (isTouch) {
          tiltGroup.rotation.y = 0;
        }
      }
    }

    // Handheld feel: micro camera drift (amplitude 0.002 units, halved on touch)
    if (!idleFrozen) {
      const driftAmp = isTouch ? 0.001 : 0.002;
      const driftX = (Math.sin(idleState.time * 1.8) + Math.sin(idleState.time * 0.7)) * driftAmp;
      const driftY = (Math.cos(idleState.time * 1.4) + Math.sin(idleState.time * 2.3)) * driftAmp;
      camera.position.x = baseCamPos.x + driftX;
      camera.position.y = baseCamPos.y + driftY;
    }

    // Tick sub-scenes
    accessories.tick(idleState.time, idleFrozen);
    wifiScene.tick(idleState.time, idleFrozen);

    // (b) composer/post-processing off (render directly)
    const shouldUseComposer = false;

    if (shouldUseComposer && composer) {
      bloomPass.enabled = (tier === 0);
      customShaderPass.uniforms.uTime.value = idleState.time;
      composer.render();
    } else {
      renderer.render(scene, camera);
    }

    // Update Debug HUD if active
    if (hudEl) {
      const fps = Math.round(1 / Math.max(dt, 0.001));
      const calls = renderer.info.render.calls;
      const tris = renderer.info.render.triangles;
      const currentTier = quality.getTier();
      const prog = typeof window !== 'undefined' && window.__DATA_DEBUG__?.masterTl
        ? window.__DATA_DEBUG__.masterTl.progress().toFixed(3)
        : '0.000';
      hudEl.innerHTML = `PROG: ${prog} | FPS: ${fps}<br>CALLS: ${calls} | TRIS: ${tris}<br>TIER: ${currentTier}`;
    }
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
    lighting,
    composer,
    updateScrollVelocity,
    markScrolling,
    setScrollProgress: (p) => {
      currentScrollProgress = p;
    },
    setBaseCamPos: (x, y) => {
      baseCamPos.x = x;
      baseCamPos.y = y;
    },
    setInspectSpotTarget: (targetPos, intensity = 4.0) => {
      if (inspectSpotLight) {
        inspectSpotLight.target.position.copy(targetPos);
        inspectSpotLight.intensity = intensity;
        inspectSpotLight.target.updateMatrixWorld();
      }
    },
    triggerRevealAnimation,
    compileSceneAsync: async () => {
      if (typeof renderer.compileAsync === 'function') {
        try {
          await renderer.compileAsync(scene, camera);
        } catch (e) {
          renderer.compile(scene, camera);
        }
      } else {
        renderer.compile(scene, camera);
      }
      if (composer && !isTouch && quality.getTier() < 2) {
        try {
          composer.render();
        } catch (e) {}
      }
    },
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
      if (hudEl && hudEl.parentNode) {
        hudEl.parentNode.removeChild(hudEl);
      }
      if (composer) {
        composer.dispose();
      }
      if (bloomPass) {
        bloomPass.dispose();
      }
      if (customShaderPass) {
        customShaderPass.dispose();
      }
      if (outputPass) {
        outputPass.dispose();
      }
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
