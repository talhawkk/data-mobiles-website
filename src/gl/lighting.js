import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * DATA - Scene Lighting Architecture
 * Uses RoomEnvironment for physically balanced reflections and ambient lighting.
 * Calibrated for award-winning Pristine White Studio presentation.
 */
export function setupLighting(scene, renderer) {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  const roomEnv = new RoomEnvironment();
  const envMap = pmremGenerator.fromScene(roomEnv).texture;
  roomEnv.dispose();

  scene.environment = envMap;
  scene.environmentIntensity = 1.45;

  // Key Light: top-left-front (crisp bright studio illumination)
  const keyLight = new THREE.DirectionalLight(0xFFFFFF, 3.2);
  keyLight.position.set(-1.2, 3.5, 3.5);
  keyLight.castShadow = false;
  scene.add(keyLight);

  // Fill Light: front-right to illuminate stage (right 58vw)
  const fillLight = new THREE.DirectionalLight(0xEEF2F8, 2.2);
  fillLight.position.set(2.5, 1.6, 3.2);
  fillLight.castShadow = false;
  scene.add(fillLight);

  // Rim Light: crisp accent rim
  const rimLight = new THREE.DirectionalLight(0x16A34A, 3.5);
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
