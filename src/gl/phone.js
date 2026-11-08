import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

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
 * Procedural Phone Component
 * Exactly adheres to section 6:
 * Groups: frame, screen, backCover, cameraUnit, battery, board, port
 * CanvasTexture 512x1056 with off, boot, lock, fixed, wifi-bars states
 */
export function createPhone({ isMobile = false } = {}) {
  const phoneGroup = new THREE.Group();
  phoneGroup.name = 'phoneRoot';

  // --- 1. SCREEN CANVAS TEXTURE (512 x 1056) ---
  const screenCanvas = document.createElement('canvas');
  screenCanvas.width = 512;
  screenCanvas.height = 1056;
  const ctx = screenCanvas.getContext('2d');
  const screenTexture = new THREE.CanvasTexture(screenCanvas);
  screenTexture.colorSpace = THREE.SRGBColorSpace;

  function renderScreenState(state = 'lock') {
    ctx.clearRect(0, 0, 512, 1056);

    if (state === 'off') {
      ctx.fillStyle = '#080809';
      ctx.fillRect(0, 0, 512, 1056);
    } else if (state === 'boot') {
      ctx.fillStyle = '#0B0B0C';
      ctx.fillRect(0, 0, 512, 1056);

      // DATA Wordmark
      ctx.fillStyle = '#C8FF2E';
      ctx.font = '800 84px "Bricolage Grotesque", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('DATA', 256, 500);

      // Minimal boot indicator
      ctx.fillStyle = '#8C8A84';
      ctx.font = '600 20px "DM Mono", monospace';
      ctx.fillText('LAHORE // 042', 256, 570);

      // Sleek 2px progress bar
      ctx.fillStyle = '#C8FF2E';
      ctx.fillRect(186, 620, 140, 3);
    } else if (state === 'lock') {
      ctx.fillStyle = '#101014';
      ctx.fillRect(0, 0, 512, 1056);

      // Gradient glow
      const grad = ctx.createRadialGradient(256, 400, 10, 256, 400, 320);
      grad.addColorStop(0, 'rgba(200, 255, 46, 0.12)');
      grad.addColorStop(1, 'rgba(16, 16, 20, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 1056);

      // Status Bar
      ctx.fillStyle = '#8C8A84';
      ctx.font = '600 18px "DM Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('DATA 5G', 40, 56);
      ctx.textAlign = 'right';
      ctx.fillText('98%', 472, 56);

      // Clock
      ctx.fillStyle = '#F2EFE8';
      ctx.font = '800 110px "Bricolage Grotesque", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('10:42', 256, 320);

      // Date
      ctx.fillStyle = '#8C8A84';
      ctx.font = '600 22px "Bricolage Grotesque", sans-serif';
      ctx.fillText('Friday, November 8', 256, 380);

      // Bottom unlock bar
      ctx.fillStyle = '#303036';
      ctx.fillRect(176, 990, 160, 6);
    } else if (state === 'fixed') {
      ctx.fillStyle = '#08080A';
      ctx.fillRect(0, 0, 512, 1056);

      // Glowing badge
      ctx.fillStyle = '#C8FF2E';
      ctx.font = '800 96px "Bricolage Grotesque", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Fixed.', 256, 500);

      ctx.fillStyle = '#F2EFE8';
      ctx.font = '600 24px "DM Mono", monospace';
      ctx.fillText('100% OPERATIONAL', 256, 570);

      ctx.fillStyle = '#8C8A84';
      ctx.font = '400 18px "DM Mono", monospace';
      ctx.fillText('DATA LABS LAHORE', 256, 620);
    } else if (state === 'wifi') {
      ctx.fillStyle = '#0B0B0E';
      ctx.fillRect(0, 0, 512, 1056);

      // WiFi Arcs
      ctx.strokeStyle = '#C8FF2E';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';

      // Arc 1
      ctx.beginPath();
      ctx.arc(256, 480, 110, Math.PI * 1.25, Math.PI * 1.75);
      ctx.stroke();

      // Arc 2
      ctx.beginPath();
      ctx.arc(256, 480, 75, Math.PI * 1.25, Math.PI * 1.75);
      ctx.stroke();

      // Arc 3
      ctx.beginPath();
      ctx.arc(256, 480, 40, Math.PI * 1.25, Math.PI * 1.75);
      ctx.stroke();

      // Dot
      ctx.fillStyle = '#C8FF2E';
      ctx.beginPath();
      ctx.arc(256, 480, 14, 0, Math.PI * 2);
      ctx.fill();

      // Text
      ctx.fillStyle = '#F2EFE8';
      ctx.font = '800 42px "Bricolage Grotesque", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CONNECTED', 256, 590);

      ctx.fillStyle = '#8C8A84';
      ctx.font = '500 20px "DM Mono", monospace';
      ctx.fillText('DATA FIBER 50 MBPS', 256, 636);
    }

    screenTexture.needsUpdate = true;
  }

  // Initial screen render
  renderScreenState('lock');

  // 2. SCREEN MESH
  const screenShape = createRoundedRectShape(0.68, 1.48, 0.08);
  const screenGeom = new THREE.ShapeGeometry(screenShape);
  const pos = screenGeom.attributes.position;
  const uvs = [];
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    uvs.push((x + 0.34) / 0.68, (y + 0.74) / 1.48);
  }
  screenGeom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

  const screenMat = new THREE.MeshBasicMaterial({
    map: screenTexture,
    side: THREE.DoubleSide,
  });
  const screenMesh = new THREE.Mesh(screenGeom, screenMat);
  screenMesh.rotation.y = Math.PI;
  screenMesh.name = 'screenMesh';

  const screenGroup = new THREE.Group();
  screenGroup.name = 'screen';
  screenGroup.add(screenMesh);
  screenGroup.position.set(0, 0, -0.041);
  phoneGroup.add(screenGroup);

  // --- 3. FRAME ---
  // rounded box 0.72 x 1.52 x 0.08, corner radius 0.09, metalness 1.0, roughness 0.28, color #8D9098
  const frameShape = createRoundedRectShape(0.72, 1.52, 0.09);
  const frameGeom = new THREE.ExtrudeGeometry(frameShape, {
    depth: 0.076,
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 1,
    bevelSize: 0.003,
    bevelThickness: 0.003,
  });
  frameGeom.center();

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x8D9098,
    metalness: 1.0,
    roughness: 0.28,
  });
  const frameMesh = new THREE.Mesh(frameGeom, frameMat);
  frameMesh.name = 'frameMesh';

  const frameGroup = new THREE.Group();
  frameGroup.name = 'frame';
  frameGroup.add(frameMesh);
  phoneGroup.add(frameGroup);

  // --- 4. BACK COVER ---
  // rounded slab, color #17181B, roughness 0.18. MeshPhysicalMaterial (clearcoat) desktop, MeshStandard on mobile
  const backShape = createRoundedRectShape(0.70, 1.50, 0.08);
  const backGeom = new THREE.ExtrudeGeometry(backShape, {
    depth: 0.008,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.002,
    bevelThickness: 0.002,
  });
  backGeom.center();

  let backMat;
  if (!isMobile) {
    backMat = new THREE.MeshPhysicalMaterial({
      color: 0x17181B,
      roughness: 0.18,
      metalness: 0.1,
      clearcoat: 0.85,
      clearcoatRoughness: 0.12,
    });
  } else {
    backMat = new THREE.MeshStandardMaterial({
      color: 0x17181B,
      roughness: 0.18,
      metalness: 0.1,
    });
  }

  const backMesh = new THREE.Mesh(backGeom, backMat);
  backMesh.name = 'backMesh';

  const backCoverGroup = new THREE.Group();
  backCoverGroup.name = 'backCover';
  backCoverGroup.add(backMesh);
  backCoverGroup.position.set(0, 0, 0.043);
  phoneGroup.add(backCoverGroup);

  // --- 5. CAMERA UNIT ---
  // raised rounded plate with 3 lens cylinders (dark glass, metal ring)
  const cameraUnitGroup = new THREE.Group();
  cameraUnitGroup.name = 'cameraUnit';

  const camPlateShape = createRoundedRectShape(0.26, 0.30, 0.04);
  const camPlateGeom = new THREE.ExtrudeGeometry(camPlateShape, {
    depth: 0.015,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.002,
    bevelThickness: 0.002,
  });
  camPlateGeom.center();
  const camPlateMesh = new THREE.Mesh(camPlateGeom, backMat);
  camPlateMesh.position.set(-0.19, 0.52, 0.052);
  cameraUnitGroup.add(camPlateMesh);

  // 3 Lenses
  const lensRingMat = frameMat;
  const lensGlassMat = new THREE.MeshStandardMaterial({
    color: 0x050508,
    roughness: 0.08,
    metalness: 0.8,
  });

  const lensPositions = [
    { x: -0.22, y: 0.58 },
    { x: -0.22, y: 0.46 },
    { x: -0.15, y: 0.52 },
  ];

  lensPositions.forEach((pos) => {
    // Outer metal ring
    const ringGeom = new THREE.CylinderGeometry(0.042, 0.042, 0.018, 24);
    ringGeom.rotateX(Math.PI / 2);
    const ringMesh = new THREE.Mesh(ringGeom, lensRingMat);
    ringMesh.position.set(pos.x, pos.y, 0.061);
    cameraUnitGroup.add(ringMesh);

    // Inner dark glass
    const glassGeom = new THREE.CylinderGeometry(0.034, 0.034, 0.019, 20);
    glassGeom.rotateX(Math.PI / 2);
    const glassMesh = new THREE.Mesh(glassGeom, lensGlassMat);
    glassMesh.position.set(pos.x, pos.y, 0.0615);
    cameraUnitGroup.add(glassMesh);
  });

  phoneGroup.add(cameraUnitGroup);

  // --- 6. BATTERY ---
  // rounded box 0.5 x 0.8 x 0.03
  const batteryGroup = new THREE.Group();
  batteryGroup.name = 'battery';

  const batteryShape = createRoundedRectShape(0.50, 0.80, 0.02);
  const batteryGeom = new THREE.ExtrudeGeometry(batteryShape, {
    depth: 0.028,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.002,
    bevelThickness: 0.002,
  });
  batteryGeom.center();
  const batteryMat = new THREE.MeshStandardMaterial({
    color: 0x1E2024,
    roughness: 0.6,
    metalness: 0.2,
  });
  const batteryMesh = new THREE.Mesh(batteryGeom, batteryMat);
  batteryMesh.position.set(0, -0.18, 0.005);
  batteryGroup.add(batteryMesh);
  phoneGroup.add(batteryGroup);

  // --- 7. BOARD ---
  // thin box with at most 12 chips merged into one geometry
  const boardGroup = new THREE.Group();
  boardGroup.name = 'board';

  const pcbGeom = new THREE.BoxGeometry(0.58, 0.44, 0.012);
  const pcbMat = new THREE.MeshStandardMaterial({
    color: 0x121A16,
    roughness: 0.45,
    metalness: 0.25,
  });
  const pcbMesh = new THREE.Mesh(pcbGeom, pcbMat);
  pcbMesh.position.set(0, 0.46, 0.005);
  boardGroup.add(pcbMesh);

  // Merged Chips
  const chipGeometries = [];
  const chipDefs = [
    { x: -0.16, y: 0.52, w: 0.14, h: 0.14, d: 0.008 },
    { x: 0.02, y: 0.55, w: 0.16, h: 0.12, d: 0.009 },
    { x: 0.18, y: 0.50, w: 0.09, h: 0.18, d: 0.007 },
    { x: -0.18, y: 0.38, w: 0.08, h: 0.08, d: 0.006 },
    { x: -0.06, y: 0.39, w: 0.10, h: 0.07, d: 0.006 },
    { x: 0.08, y: 0.40, w: 0.08, h: 0.08, d: 0.007 },
    { x: 0.20, y: 0.36, w: 0.06, h: 0.06, d: 0.005 },
    { x: 0.00, y: 0.30, w: 0.12, h: 0.05, d: 0.006 },
  ];

  chipDefs.forEach((def) => {
    const chipGeom = new THREE.BoxGeometry(def.w, def.h, def.d);
    chipGeom.translate(def.x, def.y, 0.015);
    chipGeometries.push(chipGeom);
  });

  const mergedChipsGeom = BufferGeometryUtils.mergeGeometries(chipGeometries);
  const chipMat = new THREE.MeshStandardMaterial({
    color: 0x0A0B0D,
    roughness: 0.3,
    metalness: 0.7,
  });
  const chipsMesh = new THREE.Mesh(mergedChipsGeom, chipMat);
  boardGroup.add(chipsMesh);
  phoneGroup.add(boardGroup);

  // --- 8. PORT ---
  // small capsule at bottom edge
  const portGroup = new THREE.Group();
  portGroup.name = 'port';

  const portGeom = new THREE.CapsuleGeometry(0.014, 0.045, 8, 8);
  portGeom.rotateZ(Math.PI / 2);
  const portMat = new THREE.MeshStandardMaterial({
    color: 0x0D0E10,
    metalness: 0.9,
    roughness: 0.2,
  });
  const portMesh = new THREE.Mesh(portGeom, portMat);
  portMesh.position.set(0, -0.76, 0);
  portGroup.add(portMesh);
  phoneGroup.add(portGroup);

  // --- 9. CONTACT SHADOW ---
  // blurred radial-gradient plane under the phone as a contact shadow (no shadow maps!)
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 256;
  shadowCanvas.height = 256;
  const sCtx = shadowCanvas.getContext('2d');
  const sGrad = sCtx.createRadialGradient(128, 128, 10, 128, 128, 120);
  sGrad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
  sGrad.addColorStop(0.4, 'rgba(0, 0, 0, 0.35)');
  sGrad.addColorStop(0.8, 'rgba(0, 0, 0, 0.08)');
  sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  sCtx.fillStyle = sGrad;
  sCtx.fillRect(0, 0, 256, 256);

  const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
  const shadowGeom = new THREE.PlaneGeometry(1.4, 1.4);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTexture,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeom, shadowMat);
  shadowMesh.name = 'contactShadow';
  // Lay horizontally strictly underneath the phone (bottom is at y = -0.76)
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.set(0, -0.82, 0);
  phoneGroup.add(shadowMesh);

  // Exploded view positions (from spec section 6):
  // rest vs exploded:
  // backCover: +1.2
  // cameraUnit: +0.7
  // battery: +0.45
  // board: +0.25
  // screen: -0.35
  const restPositions = {
    screen: { x: 0, y: 0, z: -0.041, rx: 0, ry: 0 },
    backCover: { x: 0, y: 0, z: 0.043, rx: 0, ry: 0 },
    cameraUnit: { x: 0, y: 0, z: 0, rx: 0, ry: 0 },
    battery: { x: 0, y: 0, z: 0, rx: 0, ry: 0 },
    board: { x: 0, y: 0, z: 0, rx: 0, ry: 0 },
    port: { x: 0, y: 0, z: 0, rx: 0, ry: 0 },
    frame: { x: 0, y: 0, z: 0, rx: 0, ry: 0 },
  };

  const explodedPositions = {
    screen: { x: -0.28, y: 0.02, z: -0.35, rx: -0.03, ry: 0.04 },
    backCover: { x: 0.38, y: -0.04, z: 0.65, rx: 0.04, ry: -0.05 },
    cameraUnit: { x: -0.12, y: 0.20, z: 0.55, rx: 0.04, ry: -0.04 },
    battery: { x: 0.05, y: -0.16, z: 0.35, rx: -0.03, ry: 0.03 },
    board: { x: 0.10, y: 0.24, z: 0.20, rx: 0.03, ry: -0.03 },
    port: { x: 0, y: -0.20, z: 0.10, rx: 0.02, ry: 0 },
    frame: { x: -0.06, y: 0, z: 0, rx: 0, ry: 0 },
  };

  // Reusable vector for label projection
  const anchorVec = new THREE.Vector3();

  function getPartScreenPosition(partName, camera, width, height) {
    let targetGroup;
    let localOffset = new THREE.Vector3(0, 0, 0);

    switch (partName) {
      case 'screen':
        targetGroup = screenGroup;
        localOffset.set(0, 0.2, 0);
        break;
      case 'battery':
        targetGroup = batteryGroup;
        localOffset.set(0, -0.15, 0);
        break;
      case 'port':
        targetGroup = portGroup;
        localOffset.set(0, -0.76, 0);
        break;
      case 'camera':
      case 'cameraUnit':
        targetGroup = cameraUnitGroup;
        localOffset.set(-0.19, 0.52, 0.06);
        break;
      case 'board':
        targetGroup = boardGroup;
        localOffset.set(0, 0.46, 0.02);
        break;
      default:
        targetGroup = phoneGroup;
    }

    targetGroup.getWorldPosition(anchorVec);
    anchorVec.add(localOffset);
    anchorVec.project(camera);

    const x = (anchorVec.x * 0.5 + 0.5) * width;
    const y = (-anchorVec.y * 0.5 + 0.5) * height;

    return { x, y, visible: anchorVec.z < 1 };
  }

  // Setter for exploded progression [0..1]
  function setExplodeProgress(t) {
    const parts = [
      { group: screenGroup, key: 'screen' },
      { group: backCoverGroup, key: 'backCover' },
      { group: cameraUnitGroup, key: 'cameraUnit' },
      { group: batteryGroup, key: 'battery' },
      { group: boardGroup, key: 'board' },
      { group: portGroup, key: 'port' },
    ];

    parts.forEach(({ group, key }) => {
      const rest = restPositions[key];
      const expl = explodedPositions[key];

      group.position.x = THREE.MathUtils.lerp(rest.x, expl.x, t);
      group.position.y = THREE.MathUtils.lerp(rest.y, expl.y, t);
      group.position.z = THREE.MathUtils.lerp(rest.z, expl.z, t);
      group.rotation.x = THREE.MathUtils.lerp(rest.rx, expl.rx, t);
      group.rotation.y = THREE.MathUtils.lerp(rest.ry, expl.ry, t);
    });

    // Fade contact shadow slightly during explosion
    shadowMesh.material.opacity = THREE.MathUtils.lerp(0.7, 0.25, t);
  }

  return {
    group: phoneGroup,
    screenGroup,
    backCoverGroup,
    cameraUnitGroup,
    batteryGroup,
    boardGroup,
    portGroup,
    frameGroup,
    renderScreenState,
    setExplodeProgress,
    getPartScreenPosition,
    dispose() {
      screenTexture.dispose();
      shadowTexture.dispose();
      phoneGroup.traverse((child) => {
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
