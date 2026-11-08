import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * DATA - Scene Lighting Architecture
 * Uses RoomEnvironment for physically balanced reflections and ambient lighting.
 * Seamlessly adapts between Pristine Light Studio and Obsidian Dark Studio.
 */
export function setupLighting(scene, renderer) {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  // (d) Replace custom studio environment with RoomEnvironment
  const roomEnv = new RoomEnvironment();
  const envMap = pmremGenerator.fromScene(roomEnv).texture;
  roomEnv.dispose();

  // (e) scene.environment is assigned and scene.environmentIntensity is 1.0 (or slightly higher for visibility)
  scene.environment = envMap;
  scene.environmentIntensity = 1.35;

  // 2. Directional Lights
  // Key Light: top-left-front
  const keyLight = new THREE.DirectionalLight(0xFFFFFF, 2.8);
  keyLight.position.set(-1.2, 3.5, 3.5);
  keyLight.castShadow = false;
  scene.add(keyLight);

  // Fill Light: front-right to illuminate stage (right 58vw)
  const fillLight = new THREE.DirectionalLight(0xE2E8F0, 2.0);
  fillLight.position.set(2.5, 1.6, 3.2);
  fillLight.castShadow = false;
  scene.add(fillLight);

  // Rim Light: back-right
  const rimLight = new THREE.DirectionalLight(0x16A34A, 3.8);
  rimLight.position.set(2.2, 1.8, -2.2);
  rimLight.castShadow = false;
  scene.add(rimLight);

  function applyThemeLighting(theme) {
    if (theme === 'light') {
      keyLight.color.setHex(0xFFFFFF);
      keyLight.intensity = 2.85;
      fillLight.color.setHex(0xEEF2F8);
      fillLight.intensity = 2.1;
      rimLight.color.setHex(0x16A34A);
      rimLight.intensity = 3.6;
      scene.environmentIntensity = 1.4;
    } else {
      keyLight.color.setHex(0xFFF5E6);
      keyLight.intensity = 2.6;
      fillLight.color.setHex(0xD8DEEB);
      fillLight.intensity = 1.8;
      rimLight.color.setHex(0xC8FF2E);
      rimLight.intensity = 4.5;
      scene.environmentIntensity = 1.35;
    }
  }

  const initialTheme = document.documentElement.getAttribute('data-theme') || 'light';
  applyThemeLighting(initialTheme);

  const onThemeChange = (e) => {
    applyThemeLighting(e.detail?.theme || 'light');
  };
  window.addEventListener('themechange', onThemeChange);

  return {
    keyLight,
    fillLight,
    rimLight,
    envMap,
    dispose() {
      window.removeEventListener('themechange', onThemeChange);
      envMap.dispose();
      pmremGenerator.dispose();
    },
  };
}
