import * as THREE from 'three';

/**
 * DATA - Scene Studio Lighting Architecture (UPGRADE.md U4 Item 1)
 * Builds custom studio PMREM environment from a small dark room
 * containing three emissive softbox planes:
 * 1. Large key (top-left, warm-white #FFF5E8)
 * 2. Narrow strip (right, accent #C8FF2E)
 * 3. Small kicker (bottom, cool-white #DDE2EC)
 * Replaces RoomEnvironment. scene.environmentIntensity = 1.0.
 */
export function setupLighting(scene, renderer) {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  // 1. Build Studio Scene
  const studioScene = new THREE.Scene();
  studioScene.background = new THREE.Color(0x060709);

  // Softbox 1: Large Key top-left (warm-white emissive)
  const keyGeom = new THREE.PlaneGeometry(4.0, 4.0);
  const keyMat = new THREE.MeshBasicMaterial({ color: 0xFFF5E8, side: THREE.DoubleSide });
  const keySoftbox = new THREE.Mesh(keyGeom, keyMat);
  keySoftbox.position.set(-3.2, 3.5, 2.4);
  keySoftbox.lookAt(0, 0, 0);
  studioScene.add(keySoftbox);

  // Softbox 2: Narrow Strip right (accent #C8FF2E emissive)
  const stripGeom = new THREE.PlaneGeometry(1.0, 5.5);
  const stripMat = new THREE.MeshBasicMaterial({ color: 0xC8FF2E, side: THREE.DoubleSide });
  const stripSoftbox = new THREE.Mesh(stripGeom, stripMat);
  stripSoftbox.position.set(3.2, 1.2, -1.2);
  stripSoftbox.lookAt(0, 0, 0);
  studioScene.add(stripSoftbox);

  // Softbox 3: Small Kicker bottom (cool-white emissive)
  const kickerGeom = new THREE.PlaneGeometry(2.4, 1.2);
  const kickerMat = new THREE.MeshBasicMaterial({ color: 0xDDE2EC, side: THREE.DoubleSide });
  const kickerSoftbox = new THREE.Mesh(kickerGeom, kickerMat);
  kickerSoftbox.position.set(0, -3.2, 1.2);
  kickerSoftbox.lookAt(0, 0, 0);
  studioScene.add(kickerSoftbox);

  // Generate PMREM texture
  const envMap = pmremGenerator.fromScene(studioScene, 0.04).texture;
  scene.environment = envMap;
  scene.environmentIntensity = 1.0;

  // Cleanup temporary studio meshes & geometries
  keyGeom.dispose();
  keyMat.dispose();
  stripGeom.dispose();
  stripMat.dispose();
  kickerGeom.dispose();
  kickerMat.dispose();

  // 2. Directional Lights
  // Key Light: warm-white, top-left-front, intensity 2.2
  const keyLight = new THREE.DirectionalLight(0xFFF5E6, 2.2);
  keyLight.position.set(-2.5, 4.0, 3.5);
  keyLight.castShadow = false;
  scene.add(keyLight);

  // Rim Light: #C8FF2E accent, back-right, intensity 4.5
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
    },
  };
}
