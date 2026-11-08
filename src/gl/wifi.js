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
 * DATA - WiFi Scene Component (UPGRADE.md U7)
 * 1. Router: matte #1A1B1E body (1.1 x 0.16 x 0.7), 2 jointed antennas, 3 accent LEDs (count 1, 2, 3 follows plan).
 * 2. 4 accent rings, looping. Max size capped so no ring passes under top nav.
 * 3. Data pulses: Points system (up to 40 particles: 12, 24, 40 by plan) travelling along QuadraticBezierCurve3.
 * 4. Phone shows speed readout counting up to plan speed with signal bars.
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
  routerGroup.rotation.x = 20 * (Math.PI / 180);
  contentGroup.add(routerGroup);

  // 1. Router Chassis: matte #1A1B1E body, 1.1 x 0.16 x 0.7
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
    color: 0x2A2C32,
    roughness: 0.45,
    metalness: 0.15,
  });
  const chassisMesh = new THREE.Mesh(chassisGeom, chassisMat);
  chassisMesh.rotation.x = Math.PI / 2;
  routerGroup.add(chassisMesh);

  // Accent edge outline so dark router separates crisply from dark background
  const outlineGroup = new THREE.Group();
  outlineGroup.rotation.x = Math.PI / 2;
  addEdgeOutline(chassisGeom, outlineGroup);
  routerGroup.add(outlineGroup);

  // 2. Two Jointed Antennas at the back corners
  const antennaMat = new THREE.MeshStandardMaterial({
    color: 0x15161A,
    metalness: 0.8,
    roughness: 0.25,
  });

  function createJointedAntenna(xPos, angleZ) {
    const jointGroup = new THREE.Group();
    jointGroup.position.set(xPos, 0.08, -0.28);

    // Base collar
    const baseCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.026, 0.026, 0.035, 16),
      antennaMat
    );
    baseCollar.position.y = 0.018;
    jointGroup.add(baseCollar);

    // Knuckle pivot sphere
    const knuckle = new THREE.Mesh(
      new THREE.SphereGeometry(0.022, 12, 12),
      antennaMat
    );
    knuckle.position.y = 0.045;
    jointGroup.add(knuckle);

    // Upper tilted antenna rod
    const rodGeom = new THREE.CylinderGeometry(0.012, 0.016, 0.65, 16);
    rodGeom.translate(0, 0.325, 0);
    const rodMesh = new THREE.Mesh(rodGeom, antennaMat);
    rodMesh.position.y = 0.045;
    rodMesh.rotation.z = angleZ;
    rodMesh.rotation.x = -0.06;
    jointGroup.add(rodMesh);

    return jointGroup;
  }

  const leftAntenna = createJointedAntenna(-0.42, -0.12);
  const rightAntenna = createJointedAntenna(0.42, 0.12);
  routerGroup.add(leftAntenna, rightAntenna);

  // 3. Three Accent LEDs on front bevel (LED count 1, 2, 3 follows plan)
  const ledGeom = new THREE.SphereGeometry(0.012, 8, 8);
  const leds = [];
  [-0.08, 0, 0.08].forEach((xPos) => {
    const ledMat = new THREE.MeshBasicMaterial({
      color: 0xC8FF2E,
      transparent: true,
      opacity: 0.2,
    });
    const ledMesh = new THREE.Mesh(ledGeom, ledMat);
    ledMesh.position.set(xPos, 0.06, 0.35);
    routerGroup.add(ledMesh);
    leds.push(ledMesh);
  });

  // Current active plan: 0 (Home), 1 (Family), 2 (Max)
  let activePlan = 0;

  function setPlan(planIndex) {
    activePlan = Math.max(0, Math.min(2, planIndex));
  }

  // 4. Four Accent Signal Rings (capped so no ring passes under top nav)
  const ringsGroup = new THREE.Group();
  ringsGroup.name = 'signalRings';
  contentGroup.add(ringsGroup);

  const ringGeom = new THREE.TorusGeometry(0.22, 0.006, 12, 64);
  const rings = [];
  const ringCount = 4;

  for (let i = 0; i < ringCount; i++) {
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xC8FF2E,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    const ringMesh = new THREE.Mesh(ringGeom, ringMat);
    ringMesh.position.set(0, 0.38, -0.25);
    ringsGroup.add(ringMesh);
    rings.push({
      mesh: ringMesh,
      offset: i / ringCount,
    });
  }

  // 5. Data Pulses: Points system of up to 40 particles travelling along QuadraticBezierCurve3
  const MAX_PULSES = 40;
  const pulsePositions = new Float32Array(MAX_PULSES * 3);
  const pulseGeom = new THREE.BufferGeometry();
  pulseGeom.setAttribute('position', new THREE.BufferAttribute(pulsePositions, 3));
  pulseGeom.setDrawRange(0, 12); // Default Home plan (12 pulses)

  const pulseMat = new THREE.PointsMaterial({
    color: 0xC8FF2E,
    size: 0.045,
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });
  const pulsePoints = new THREE.Points(pulseGeom, pulseMat);
  rootGroup.add(pulsePoints);

  // Bezier curve from router to phone
  let pulseCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0.05, 0.35, 0.0),
    new THREE.Vector3(0.20, 0.55, 0.25),
    new THREE.Vector3(0.35, -0.15, 0.20)
  );

  function updatePulseCurve(routerPos, phonePos) {
    if (!routerPos || !phonePos) return;
    const midX = (routerPos.x + phonePos.x) * 0.5;
    const midY = Math.max(routerPos.y, phonePos.y) + 0.30;
    const midZ = Math.max(routerPos.z, phonePos.z) + 0.15;

    pulseCurve.v0.set(routerPos.x, routerPos.y + 0.25, routerPos.z);
    pulseCurve.v1.set(midX, midY, midZ);
    pulseCurve.v2.set(phonePos.x, phonePos.y + 0.20, phonePos.z);
  }

  const tempPulseVec = new THREE.Vector3();

  function tick(elapsedTime, isFrozen = false) {
    if (isFrozen || !rootGroup.visible) return;

    // LED count follows highlighted plan:
    // Plan 0: 1 LED active
    // Plan 1: 2 LEDs active
    // Plan 2: 3 LEDs active
    const activeLedsCount = activePlan + 1;
    leds.forEach((led, i) => {
      if (i < activeLedsCount) {
        const blink = Math.sin(elapsedTime * 6 + i * 1.5);
        led.material.opacity = blink > -0.2 ? 0.95 : 0.35;
      } else {
        led.material.opacity = 0.12;
      }
    });

    // 4 Signal Rings: capped so max scale stays <= 2.2 and never passes under top nav
    const cycleTime = 2.4;
    rings.forEach(({ mesh, offset }) => {
      const loopT = ((elapsedTime / cycleTime) + offset) % 1;
      // Scale from 1.0 -> 2.2 (capped to protect top nav)
      const scale = 1.0 + loopT * 1.2;
      mesh.scale.set(scale, scale, scale);
      mesh.position.z = -0.25 + loopT * 0.50;
      mesh.position.y = 0.38 + loopT * 0.04;
      mesh.material.opacity = (1 - loopT) * 0.45;
    });

    // Data pulses along QuadraticBezierCurve3
    const pulseCount = activePlan === 0 ? 12 : activePlan === 1 ? 24 : 40;
    pulseGeom.setDrawRange(0, pulseCount);

    const posAttr = pulseGeom.attributes.position;
    for (let i = 0; i < pulseCount; i++) {
      const t = (elapsedTime * 0.55 + i / pulseCount) % 1;
      pulseCurve.getPoint(t, tempPulseVec);
      posAttr.setXYZ(i, tempPulseVec.x, tempPulseVec.y, tempPulseVec.z);
    }
    posAttr.needsUpdate = true;

    // Gentle organic float on contentGroup only
    contentGroup.position.y = Math.sin(elapsedTime * 1.2) * 0.015;
    contentGroup.rotation.y = Math.sin(elapsedTime * 0.4) * 0.02;
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
    setPlan,
    updatePulseCurve,
    tick,
    setProgress,
    dispose() {
      rootGroup.traverse((child) => {
        if (child.isMesh || child.isLineSegments || child.isPoints) {
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
