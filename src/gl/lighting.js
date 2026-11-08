import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * DATA - Scene Lighting Architecture
 * Strictly respects spec:
 * - PMREM RoomEnvironment (intensity 0.8)
 * - Key DirectionalLight (intensity 2.2, top-left-front, warm-white)
 * - Rim DirectionalLight in #C8FF2E (intensity 3.0, back-right)
 * - Maximum 2 lights, no shadow maps
 */
export function setupLighting(scene, renderer) {
  // PMREM Environment Map
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  const roomEnv = new RoomEnvironment();
  const envMap = pmremGenerator.fromScene(roomEnv, 0.04).texture;
  
  scene.environment = envMap;
  scene.environmentIntensity = 1.0;

  // Key Light: warm-white, top-left-front, intensity 2.2
  const keyLight = new THREE.DirectionalLight(0xFFF5E6, 2.2);
  keyLight.position.set(-2.5, 4.0, 3.5);
  keyLight.castShadow = false;
  scene.add(keyLight);

  // Rim Light: #C8FF2E accent, back-right, strengthened intensity 4.5 for visible frame edge
  const rimLight = new THREE.DirectionalLight(0xC8FF2E, 4.5);
  rimLight.position.set(2.2, 1.8, -2.2);
  rimLight.castShadow = false;
  scene.add(rimLight);

  return {
    keyLight,
    rimLight,
    envMap,
    dispose() {
      envMap.dispose();
      pmremGenerator.dispose();
      roomEnv.dispose();
    }
  };
}
