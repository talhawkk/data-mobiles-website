import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * DATA - Scene Lighting Architecture
 * Uses RoomEnvironment for physically balanced reflections and ambient lighting.
 * scene.environmentIntensity = 1.0.
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
  // Key Light: warm-white, top-left-front, intensity 2.6
  const keyLight = new THREE.DirectionalLight(0xFFF5E6, 2.6);
  keyLight.position.set(-1.2, 3.5, 3.5);
  keyLight.castShadow = false;
  scene.add(keyLight);

  // Fill Light: soft cool-white from front-right to illuminate stage (right 58vw)
  const fillLight = new THREE.DirectionalLight(0xD8DEEB, 1.8);
  fillLight.position.set(2.5, 1.6, 3.2);
  fillLight.castShadow = false;
  scene.add(fillLight);

  // Rim Light: #C8FF2E accent, back-right, intensity 4.5
  const rimLight = new THREE.DirectionalLight(0xC8FF2E, 4.5);
  rimLight.position.set(2.2, 1.8, -2.2);
  rimLight.castShadow = false;
  scene.add(rimLight);

  return {
    keyLight,
    fillLight,
    rimLight,
    envMap,
    dispose() {
      envMap.dispose();
      pmremGenerator.dispose();
    },
  };
}
