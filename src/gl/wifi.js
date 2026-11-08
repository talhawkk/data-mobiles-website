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
 * Accent edge outline helper
 */
function addEdgeOutline(geometry, parentGroup) {
  const edgesGeom = new THREE.EdgesGeometry(geometry, 25);
  const edgesMat = new THREE.LineBasicMaterial({
    color: 0xC8FF2E,
    transparent: true,
    opacity: 0.35,
  });
  const edgesMesh = new THREE.LineSegments(edgesGeom, edgesMat);
  parentGroup.add(edgesMesh);
  return edgesMesh;
}

/**
 * WiFi Scene (Procedural)
 * - router: box 1.1 x 0.16 x 0.7, 2 antenna cylinders, 3 blinking accent LEDs
 *   tilted 20 degrees toward the camera so it clearly reads as a router.
 * - 4 thin torus rings expanding from the antennas toward the camera, staggered and looping
 *   MeshBasicMaterial, transparent, depthWrite: false
 */
export function createWifiScene() {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'wifiRoot';
  rootGroup.visible = false;
  rootGroup.scale.set(0.001, 0.001, 0.001);

  // contentGroup isolates organic floating from rootGroup transforms
  const contentGroup = new THREE.Group();
  contentGroup.name = 'wifiContent';
  rootGroup.add(contentGroup);

  // routerGroup holds the router body, antennas, and LEDs, tilted 20 degrees toward camera
  const routerGroup = new THREE.Group();
  routerGroup.name = 'routerAssembly';
  // 20 degrees tilt toward camera (+0.35 rad around X)
  routerGroup.rotation.x = 20 * (Math.PI / 180);
  contentGroup.add(routerGroup);

  // 1. Router Chassis: 1.1 x 0.16 x 0.7
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
    color: 0x16181D,
    roughness: 0.28,
    metalness: 0.35,
  });
  const chassisMesh = new THREE.Mesh(chassisGeom, chassisMat);
  // Lay horizontally: X=1.1, Y=0.16, Z=0.7
  chassisMesh.rotation.x = Math.PI / 2;
  routerGroup.add(chassisMesh);

  // Accent edge outline so dark router separates crisply from dark background
  const outlineGroup = new THREE.Group();
  outlineGroup.rotation.x = Math.PI / 2;
  addEdgeOutline(chassisGeom, outlineGroup);
  routerGroup.add(outlineGroup);

  // 2. Antennas: 2 cylinders at the back corners
  const antennaMat = new THREE.MeshStandardMaterial({
    color: 0x1D1F26,
    metalness: 0.85,
    roughness: 0.22,
  });
  const antennaGeom = new THREE.CylinderGeometry(0.016, 0.012, 0.72, 16);

  const antenna1 = new THREE.Mesh(antennaGeom, antennaMat);
  antenna1.position.set(-0.42, 0.38, -0.28);
  antenna1.rotation.z = -0.08;
  antenna1.rotation.x = -0.06;

  const antenna2 = new THREE.Mesh(antennaGeom, antennaMat);
  antenna2.position.set(0.42, 0.38, -0.28);
  antenna2.rotation.z = 0.08;
  antenna2.rotation.x = -0.06;

  // Base pivot nubs for antennas
  const baseGeom = new THREE.CylinderGeometry(0.026, 0.026, 0.04, 16);
  const base1 = new THREE.Mesh(baseGeom, antennaMat);
  base1.position.set(-0.42, 0.08, -0.28);
  const base2 = new THREE.Mesh(baseGeom, antennaMat);
  base2.position.set(0.42, 0.08, -0.28);

  routerGroup.add(antenna1, antenna2, base1, base2);

  // 3. Three Accent Blinking LEDs on front bevel
  const ledGeom = new THREE.SphereGeometry(0.014, 8, 8);
  const leds = [];
  [-0.08, 0, 0.08].forEach((xPos) => {
    const ledMat = new THREE.MeshBasicMaterial({
      color: 0xC8FF2E,
      transparent: true,
      opacity: 0.95,
    });
    const ledMesh = new THREE.Mesh(ledGeom, ledMat);
    ledMesh.position.set(xPos, 0.06, 0.35);
    routerGroup.add(ledMesh);
    leds.push(ledMesh);
  });

  // 4. Four Accent Torus Signal Rings
  // Rings face the camera and expand forward from antennas toward viewer
  const ringsGroup = new THREE.Group();
  ringsGroup.name = 'signalRings';
  contentGroup.add(ringsGroup);

  const ringGeom = new THREE.TorusGeometry(0.28, 0.007, 12, 64);
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
    // Face the camera directly
    ringMesh.position.set(0, 0.38, -0.25);
    ringsGroup.add(ringMesh);
    rings.push({
      mesh: ringMesh,
      offset: i / ringCount, // Stagger: 0, 0.25, 0.5, 0.75
    });
  }

  function tick(elapsedTime, isFrozen = false) {
    if (isFrozen || !rootGroup.visible) return;

    // Blinking LEDs
    leds.forEach((led, i) => {
      const blink = Math.sin(elapsedTime * 7 + i * 2.1);
      led.material.opacity = blink > 0.05 ? 0.95 : 0.2;
    });

    // 4 Accent Signal Rings expanding from antennas toward the camera
    const cycleTime = 2.4;
    rings.forEach(({ mesh, offset }) => {
      const loopT = ((elapsedTime / cycleTime) + offset) % 1;
      // Scale from 1.0 -> 4.2
      const scale = 1.0 + loopT * 3.2;
      mesh.scale.set(scale, scale, scale);
      // Advance toward the camera: from antenna plane z=-0.25 forward to z=0.65
      mesh.position.z = -0.25 + loopT * 0.90;
      mesh.position.y = 0.38 + loopT * 0.08;
      // Fade 0.6 -> 0
      mesh.material.opacity = (1 - loopT) * 0.6;
    });

    // Gentle organic float on contentGroup only (never overwrites rootGroup.position)
    contentGroup.position.y = Math.sin(elapsedTime * 1.2) * 0.02;
    contentGroup.rotation.y = Math.sin(elapsedTime * 0.4) * 0.03;
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
        if (child.isMesh || child.isLineSegments) {
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
