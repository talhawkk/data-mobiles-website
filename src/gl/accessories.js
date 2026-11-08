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
 * Procedural Accessories
 * - charger brick (rounded box + 2 prongs)
 * - cable (TubeGeometry on CatmullRomCurve3, radius 0.02)
 * - earbud case (rounded capsule)
 * - phone case (rounded frame)
 */
export function createAccessories() {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'accessoriesRoot';
  rootGroup.visible = false;
  rootGroup.scale.set(0.001, 0.001, 0.001);

  // Common materials
  const matteMat = new THREE.MeshStandardMaterial({
    color: 0x1E1F24,
    roughness: 0.35,
    metalness: 0.15,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xD0D2D8,
    roughness: 0.2,
    metalness: 0.95,
  });

  const accentMat = new THREE.MeshBasicMaterial({
    color: 0xC8FF2E,
  });

  // --- 1. CHARGER BRICK ---
  const chargerGroup = new THREE.Group();
  chargerGroup.name = 'accessoryCharger';

  const brickShape = createRoundedRectShape(0.24, 0.24, 0.04);
  const brickGeom = new THREE.ExtrudeGeometry(brickShape, {
    depth: 0.32,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: 0.005,
    bevelThickness: 0.005,
  });
  brickGeom.center();
  const brickMesh = new THREE.Mesh(brickGeom, matteMat);
  chargerGroup.add(brickMesh);

  // 2 Metallic Prongs
  const prongGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.14, 16);
  prongGeom.rotateX(Math.PI / 2);
  const prong1 = new THREE.Mesh(prongGeom, metalMat);
  prong1.position.set(-0.06, 0, 0.22);
  const prong2 = prong1.clone();
  prong2.position.set(0.06, 0, 0.22);
  chargerGroup.add(prong1, prong2);

  // --- 2. CABLE ---
  const cableGroup = new THREE.Group();
  cableGroup.name = 'accessoryCable';

  const curvePoints = [
    new THREE.Vector3(-0.35, -0.2, 0),
    new THREE.Vector3(-0.15, 0.25, 0.15),
    new THREE.Vector3(0.2, 0.1, -0.1),
    new THREE.Vector3(0.35, -0.25, 0.05),
  ];
  const curve = new THREE.CatmullRomCurve3(curvePoints);
  const cableGeom = new THREE.TubeGeometry(curve, 48, 0.02, 12, false);
  const cableMat = new THREE.MeshStandardMaterial({
    color: 0x16171A,
    roughness: 0.5,
    metalness: 0.1,
  });
  const cableMesh = new THREE.Mesh(cableGeom, cableMat);
  cableGroup.add(cableMesh);

  // Connector heads at cable ends
  const headGeom = new THREE.BoxGeometry(0.05, 0.04, 0.1);
  const headMesh1 = new THREE.Mesh(headGeom, metalMat);
  headMesh1.position.copy(curvePoints[0]);
  headMesh1.lookAt(curvePoints[1]);
  const headMesh2 = new THREE.Mesh(headGeom, metalMat);
  headMesh2.position.copy(curvePoints[curvePoints.length - 1]);
  headMesh2.lookAt(curvePoints[curvePoints.length - 2]);
  cableGroup.add(headMesh1, headMesh2);

  // --- 3. EARBUD CASE ---
  const earbudGroup = new THREE.Group();
  earbudGroup.name = 'accessoryEarbuds';

  const podGeom = new THREE.CapsuleGeometry(0.12, 0.18, 16, 16);
  podGeom.rotateZ(Math.PI / 2);
  const podMesh = new THREE.Mesh(podGeom, matteMat);
  earbudGroup.add(podMesh);

  // Subtle accent status LED
  const ledGeom = new THREE.SphereGeometry(0.012, 8, 8);
  const ledMesh = new THREE.Mesh(ledGeom, accentMat);
  ledMesh.position.set(0, 0, 0.12);
  earbudGroup.add(ledMesh);

  // --- 4. PHONE CASE ---
  const caseGroup = new THREE.Group();
  caseGroup.name = 'accessoryPhoneCase';

  const outerShape = createRoundedRectShape(0.76, 1.56, 0.10);
  const innerHole = createRoundedRectShape(0.68, 1.48, 0.08);
  outerShape.holes.push(innerHole);

  const caseGeom = new THREE.ExtrudeGeometry(outerShape, {
    depth: 0.045,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.003,
    bevelThickness: 0.003,
  });
  caseGeom.center();

  const caseMat = new THREE.MeshStandardMaterial({
    color: 0x242830,
    roughness: 0.4,
    metalness: 0.05,
    transparent: true,
    opacity: 0.88,
  });
  const caseMesh = new THREE.Mesh(caseGeom, caseMat);
  caseGroup.add(caseMesh);

  // Place individual accessories in orbital spatial positions
  chargerGroup.position.set(-1.1, 0.4, -0.3);
  cableGroup.position.set(0.9, -0.5, 0.2);
  earbudGroup.position.set(1.1, 0.6, -0.2);
  caseGroup.position.set(-0.8, -0.6, 0.1);

  rootGroup.add(chargerGroup);
  rootGroup.add(cableGroup);
  rootGroup.add(earbudGroup);
  rootGroup.add(caseGroup);

  const items = [
    { group: chargerGroup, speed: 0.7, rotSpeed: 0.4, basePos: chargerGroup.position.clone() },
    { group: cableGroup, speed: 0.5, rotSpeed: 0.3, basePos: cableGroup.position.clone() },
    { group: earbudGroup, speed: 0.9, rotSpeed: 0.6, basePos: earbudGroup.position.clone() },
    { group: caseGroup, speed: 0.4, rotSpeed: 0.2, basePos: caseGroup.position.clone() },
  ];

  function tick(elapsedTime, isFrozen = false) {
    if (isFrozen || !rootGroup.visible) return;

    items.forEach((item, idx) => {
      const t = elapsedTime * item.speed + idx;
      item.group.position.y = item.basePos.y + Math.sin(t) * 0.06;
      item.group.position.x = item.basePos.x + Math.cos(t * 0.8) * 0.04;
      item.group.rotation.y += 0.005 * item.rotSpeed;
      item.group.rotation.x = Math.sin(t * 0.5) * 0.15;
    });
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
