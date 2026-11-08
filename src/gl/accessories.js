import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

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
 * DATA - Procedural Accessories (UPGRADE.md U6)
 * Four distinct items:
 * 1. Case: ExtrudeGeometry rounded shell with hole, lime inner edge (#C8FF2E). Slides onto phone from behind.
 * 2. Earbuds: Capsule case with hinged lid (opens 70 deg), 2 earbuds float & orbit, accent LED.
 * 3. Charger: Rounded-box brick with 2 metal prongs.
 * 4. Cable: TubeGeometry (radius 0.02) drawing itself via setDrawRange to phone port.
 */
export function createAccessories() {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'accessoriesRoot';
  rootGroup.visible = false;
  rootGroup.scale.set(0.001, 0.001, 0.001);

  // Common materials
  const matteMat = new THREE.MeshStandardMaterial({
    color: 0x1A1C22,
    roughness: 0.35,
    metalness: 0.15,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xE2E4EC,
    roughness: 0.15,
    metalness: 0.95,
  });

  const limeMat = new THREE.MeshBasicMaterial({
    color: 0xC8FF2E,
  });

  // ===================================================================
  // 1. BEAT 01: PHONE CASE (0.66 - 0.70)
  // Rounded-rectangle shell, ExtrudeGeometry with hole, lime inner edge
  // ===================================================================
  const caseGroup = new THREE.Group();
  caseGroup.name = 'accessoryCase';
  caseGroup.visible = false;

  const outerShape = createRoundedRectShape(0.78, 1.58, 0.09);
  const innerHole = createRoundedRectShape(0.725, 1.525, 0.08);
  outerShape.holes.push(innerHole);

  const caseShellGeom = new THREE.ExtrudeGeometry(outerShape, {
    depth: 0.088,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.004,
    bevelThickness: 0.004,
  });
  caseShellGeom.center();

  const caseShellMat = new THREE.MeshStandardMaterial({
    color: 0x242832,
    roughness: 0.40,
    metalness: 0.10,
    transparent: true,
    opacity: 0.92,
  });
  const caseMesh = new THREE.Mesh(caseShellGeom, caseShellMat);
  caseGroup.add(caseMesh);

  // Lime inner edge highlight (#C8FF2E)
  const limeEdgeShape = createRoundedRectShape(0.74, 1.54, 0.082);
  const limeEdgeHole = createRoundedRectShape(0.722, 1.522, 0.078);
  limeEdgeShape.holes.push(limeEdgeHole);
  const limeEdgeGeom = new THREE.ExtrudeGeometry(limeEdgeShape, {
    depth: 0.086,
    bevelEnabled: false,
  });
  limeEdgeGeom.center();
  const limeEdgeMesh = new THREE.Mesh(limeEdgeGeom, limeMat);
  caseGroup.add(limeEdgeMesh);

  rootGroup.add(caseGroup);

  // ===================================================================
  // 2. BEAT 02: EARBUDS (0.70 - 0.73)
  // Capsule case with lid hinged open 70 deg, 2 orbiting earbuds, accent LED
  // ===================================================================
  const earbudSystemGroup = new THREE.Group();
  earbudSystemGroup.name = 'accessoryEarbuds';
  earbudSystemGroup.visible = false;

  // Case Body (lower half)
  const bodyGeom = new RoundedBoxGeometry(0.38, 0.28, 0.22, 4, 0.06);
  bodyGeom.translate(0, -0.14, 0);
  const bodyMesh = new THREE.Mesh(bodyGeom, matteMat);
  earbudSystemGroup.add(bodyMesh);

  // Accent LED on front body
  const ledMesh = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 8), limeMat);
  ledMesh.position.set(0, -0.10, 0.114);
  earbudSystemGroup.add(ledMesh);

  // Hinged Lid (pivots at rear edge)
  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, 0.0, -0.10);

  const lidGeom = new RoundedBoxGeometry(0.38, 0.20, 0.22, 4, 0.06);
  lidGeom.translate(0, 0.10, 0.10);
  const lidMesh = new THREE.Mesh(lidGeom, matteMat);
  lidPivot.add(lidMesh);
  earbudSystemGroup.add(lidPivot);

  // Two Sculpted Earbuds (base pod + stem)
  function createEarbudMesh() {
    const grp = new THREE.Group();
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.038, 16, 16), metalMat);
    head.scale.set(1.0, 1.2, 0.9);
    grp.add(head);

    const stemGeom = new THREE.CylinderGeometry(0.012, 0.010, 0.14, 12);
    stemGeom.translate(0, -0.08, 0.015);
    const stem = new THREE.Mesh(stemGeom, matteMat);
    grp.add(stem);

    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 8), limeMat);
    tip.position.set(0, -0.15, 0.015);
    grp.add(tip);

    return grp;
  }

  const earbud1 = createEarbudMesh();
  const earbud2 = createEarbudMesh();
  earbudSystemGroup.add(earbud1, earbud2);

  // Position earbuds in stage zone
  earbudSystemGroup.position.set(0.35, 0.15, 0.1);
  rootGroup.add(earbudSystemGroup);

  // ===================================================================
  // 3. BEAT 03: CHARGER BRICK (0.73 - 0.77)
  // Rounded-box brick with 2 metal prongs
  // ===================================================================
  const chargerGroup = new THREE.Group();
  chargerGroup.name = 'accessoryCharger';
  chargerGroup.visible = false;

  const brickGeom = new RoundedBoxGeometry(0.26, 0.26, 0.36, 4, 0.04);
  const brickMesh = new THREE.Mesh(brickGeom, matteMat);
  chargerGroup.add(brickMesh);

  // 2 Metal Prongs
  const prongGeom = new THREE.CylinderGeometry(0.014, 0.014, 0.15, 12);
  prongGeom.rotateX(Math.PI / 2);
  const prong1 = new THREE.Mesh(prongGeom, metalMat);
  prong1.position.set(-0.06, 0.0, 0.24);
  const prong2 = prong1.clone();
  prong2.position.set(0.06, 0.0, 0.24);
  chargerGroup.add(prong1, prong2);

  // USB-C port cutout on rear
  const usbSlotGeom = new THREE.BoxGeometry(0.06, 0.02, 0.02);
  const usbSlotMesh = new THREE.Mesh(usbSlotGeom, limeMat);
  usbSlotMesh.position.set(0.0, 0.0, -0.185);
  chargerGroup.add(usbSlotMesh);

  chargerGroup.position.set(0.40, -0.05, 0.15);
  rootGroup.add(chargerGroup);

  // ===================================================================
  // 4. BEAT 04: CABLE (0.77 - 0.80)
  // TubeGeometry (radius 0.02) drawing itself to phone's port via setDrawRange
  // ===================================================================
  const cableGroup = new THREE.Group();
  cableGroup.name = 'accessoryCable';
  cableGroup.visible = false;

  // Spline points from charger USB-C port to phone bottom port
  const cablePoints = [
    new THREE.Vector3(0.40, -0.05, 0.0),
    new THREE.Vector3(0.45, -0.38, 0.12),
    new THREE.Vector3(0.28, -0.68, 0.08),
    new THREE.Vector3(0.12, -0.74, 0.02),
    new THREE.Vector3(0.00, -0.76, 0.0),
  ];
  const cableCurve = new THREE.CatmullRomCurve3(cablePoints);
  const cableGeom = new THREE.TubeGeometry(cableCurve, 64, 0.016, 12, false);
  const totalIndices = cableGeom.index ? cableGeom.index.count : 0;
  cableGeom.setDrawRange(0, 0); // Initially un-drawn

  const cableMat = new THREE.MeshStandardMaterial({
    color: 0x15161A,
    roughness: 0.5,
    metalness: 0.2,
  });
  const cableMesh = new THREE.Mesh(cableGeom, cableMat);
  cableGroup.add(cableMesh);

  // Connector plug at charger end
  const plugGeom = new THREE.BoxGeometry(0.04, 0.03, 0.06);
  const plugMesh1 = new THREE.Mesh(plugGeom, metalMat);
  plugMesh1.position.copy(cablePoints[0]);
  plugMesh1.lookAt(cablePoints[1]);
  cableGroup.add(plugMesh1);

  // Connector plug at phone port end
  const plugMesh2 = new THREE.Mesh(plugGeom, metalMat);
  plugMesh2.position.copy(cablePoints[cablePoints.length - 1]);
  plugMesh2.lookAt(new THREE.Vector3(0, -0.6, 0));
  plugMesh2.visible = false;
  cableGroup.add(plugMesh2);

  rootGroup.add(cableGroup);

  // -------------------------------------------------------------------
  // Dynamic Beat Animation Controller
  // -------------------------------------------------------------------
  function setCableProgress(p) {
    if (!cableGeom.index) return;
    p = Math.max(0, Math.min(1, p));
    const count = Math.floor(totalIndices * p);
    cableGeom.setDrawRange(0, count);
    plugMesh2.visible = p > 0.95;
  }

  function setLidAngle(degrees) {
    const rad = (degrees * Math.PI) / 180;
    lidPivot.rotation.x = -rad;
  }

  function setEarbudsOrbit(t) {
    // Earbud 1 orbit
    earbud1.position.set(
      Math.sin(t * 2) * 0.16,
      0.14 + Math.cos(t * 1.5) * 0.08,
      Math.cos(t * 2) * 0.12
    );
    earbud1.rotation.set(t * 1.2, t * 1.5, 0.2);

    // Earbud 2 orbit (opposite phase)
    earbud2.position.set(
      -Math.sin(t * 2) * 0.16,
      0.16 - Math.cos(t * 1.5) * 0.08,
      -Math.cos(t * 2) * 0.12
    );
    earbud2.rotation.set(-t * 1.1, -t * 1.4, -0.2);
  }

  function tick(elapsedTime, isFrozen = false) {
    if (isFrozen || !rootGroup.visible) return;

    // Subtle ambient float for active items in stage
    if (chargerGroup.visible) {
      chargerGroup.position.y = -0.05 + Math.sin(elapsedTime * 1.8) * 0.015;
    }
    if (earbudSystemGroup.visible) {
      earbudSystemGroup.position.y = 0.15 + Math.sin(elapsedTime * 2.0) * 0.015;
    }
  }

  function setVisibility(visible) {
    rootGroup.visible = visible;
    if (!visible) {
      rootGroup.scale.set(0.001, 0.001, 0.001);
      caseGroup.visible = false;
      earbudSystemGroup.visible = false;
      chargerGroup.visible = false;
      cableGroup.visible = false;
    }
  }

  return {
    group: rootGroup,
    caseGroup,
    earbudSystemGroup,
    chargerGroup,
    cableGroup,
    setCableProgress,
    setLidAngle,
    setEarbudsOrbit,
    setVisibility,
    tick,
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
