import * as THREE from 'three';

/**
 * Creates a 2D rounded rectangle shape
 */
function createRoundedRectShape(width, height, radius) {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  const w = width;
  const h = height;
  const r = Math.min(radius, width / 2, height / 2);

  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);

  return shape;
}

/**
 * WiFi Scene (Procedural)
 * - router: rounded box 1.1 x 0.16 x 0.7, 2 antenna cylinders, 3 accent LEDs blinking
 * - 4 thin torus rings scaling 1 -> 4 while fading 0.6 -> 0, staggered and looping
 *   MeshBasicMaterial, transparent, depthWrite: false
 */
export function createWifiScene() {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'wifiRoot';
  rootGroup.visible = false;
  rootGroup.scale.set(0.001, 0.001, 0.001);

  // Router Chassis
  const chassisShape = createRoundedRectShape(1.1, 0.7, 0.08);
  const chassisGeom = new THREE.ExtrudeGeometry(chassisShape, {
    depth: 0.16,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: 0.008,
    bevelThickness: 0.008,
  });
  chassisGeom.center();

  const chassisMat = new THREE.MeshStandardMaterial({
    color: 0x151619,
    roughness: 0.3,
    metalness: 0.2,
  });
  const chassisMesh = new THREE.Mesh(chassisGeom, chassisMat);
  // Lay horizontally: X=1.1, Y=0.16, Z=0.7
  chassisMesh.rotation.x = Math.PI / 2;
  rootGroup.add(chassisMesh);

  // 2 Antennas
  const antennaMat = new THREE.MeshStandardMaterial({
    color: 0x1A1B20,
    metalness: 0.8,
    roughness: 0.3,
  });
  const antennaGeom = new THREE.CylinderGeometry(0.016, 0.012, 0.65, 16);

  const antenna1 = new THREE.Mesh(antennaGeom, antennaMat);
  antenna1.position.set(-0.42, 0.35, -0.28);
  antenna1.rotation.z = -0.08;
  antenna1.rotation.x = -0.05;

  const antenna2 = new THREE.Mesh(antennaGeom, antennaMat);
  antenna2.position.set(0.42, 0.35, -0.28);
  antenna2.rotation.z = 0.08;
  antenna2.rotation.x = -0.05;

  rootGroup.add(antenna1, antenna2);

  // 3 Accent Blinking LEDs
  const ledGeom = new THREE.SphereGeometry(0.014, 8, 8);
  const leds = [];
  [-0.08, 0, 0.08].forEach((xPos) => {
    const ledMat = new THREE.MeshBasicMaterial({
      color: 0xC8FF2E,
      transparent: true,
      opacity: 0.9,
    });
    const ledMesh = new THREE.Mesh(ledGeom, ledMat);
    ledMesh.position.set(xPos, 0.04, 0.36);
    rootGroup.add(ledMesh);
    leds.push(ledMesh);
  });

  // 4 Thin Torus Signal Rings
  // scaling 1 -> 4 while fading 0.6 -> 0, staggered and looping (MeshBasicMaterial, transparent, depthWrite: false)
  const ringGeom = new THREE.TorusGeometry(0.4, 0.008, 8, 48);
  ringGeom.rotateX(Math.PI / 2);

  const rings = [];
  const ringCount = 4;
  for (let i = 0; i < ringCount; i++) {
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xC8FF2E,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    const ringMesh = new THREE.Mesh(ringGeom, ringMat);
    // Center rings above antennas/router
    ringMesh.position.set(0, 0.45, -0.15);
    rootGroup.add(ringMesh);
    rings.push({
      mesh: ringMesh,
      offset: i / ringCount, // Stagger 0, 0.25, 0.5, 0.75
    });
  }

  function tick(elapsedTime, isFrozen = false) {
    if (isFrozen || !rootGroup.visible) return;

    // Blinking LEDs
    leds.forEach((led, i) => {
      const blink = Math.sin(elapsedTime * 8 + i * 2);
      led.material.opacity = blink > 0.1 ? 0.95 : 0.2;
    });

    // Torus Signal Rings Pulsing
    // Each loops 0 -> 1 over a 2.5s cycle
    const cycleTime = 2.4;
    rings.forEach(({ mesh, offset }) => {
      const loopT = ((elapsedTime / cycleTime) + offset) % 1;
      // Scale from 1 to 4
      const scale = 1.0 + loopT * 3.0;
      mesh.scale.set(scale, scale, scale);
      // Fade 0.6 -> 0
      mesh.material.opacity = (1 - loopT) * 0.6;
    });

    // Gentle float
    rootGroup.position.y = -0.2 + Math.sin(elapsedTime * 1.2) * 0.03;
    rootGroup.rotation.y = Math.sin(elapsedTime * 0.4) * 0.08;
  }

  function setProgress(progress) {
    if (progress <= 0.001) {
      rootGroup.visible = false;
      rootGroup.scale.set(0.001, 0.001, 0.001);
      return;
    }

    rootGroup.visible = true;
    const s = Math.max(0.001, progress);
    rootGroup.scale.set(s, s, s);
  }

  return {
    group: rootGroup,
    tick,
    setProgress,
    dispose() {
      rootGroup.traverse((child) => {
        if (child.isMesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else if (child.material) {
            child.material.dispose();
          }
        }
      });
    },
  };
}
