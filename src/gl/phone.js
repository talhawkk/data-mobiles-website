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
 * Accent edge outline: thin EdgesGeometry lines on each part,
 * colour #C8FF2E at opacity 0.35, so dark slabs separate from background.
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
 * Procedural Phone Component
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

      ctx.fillStyle = '#C8FF2E';
      ctx.font = '800 84px "Bricolage Grotesque", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('DATA', 256, 500);

      ctx.fillStyle = '#8C8A84';
      ctx.font = '600 20px "DM Mono", monospace';
      ctx.fillText('LAHORE // 042', 256, 570);

      ctx.fillStyle = '#C8FF2E';
      ctx.fillRect(186, 620, 140, 3);
    } else if (state === 'lock') {
      ctx.fillStyle = '#101014';
      ctx.fillRect(0, 0, 512, 1056);

      const grad = ctx.createRadialGradient(256, 400, 10, 256, 400, 320);
      grad.addColorStop(0, 'rgba(200, 255, 46, 0.12)');
      grad.addColorStop(1, 'rgba(16, 16, 20, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 1056);

      ctx.fillStyle = '#8C8A84';
      ctx.font = '600 18px "DM Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('DATA 5G', 40, 56);
      ctx.textAlign = 'right';
      ctx.fillText('98%', 472, 56);

      ctx.fillStyle = '#F2EFE8';
      ctx.font = '800 110px "Bricolage Grotesque", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('10:42', 256, 320);

      ctx.fillStyle = '#8C8A84';
      ctx.font = '600 22px "Bricolage Grotesque", sans-serif';
      ctx.fillText('Friday, November 8', 256, 380);

      ctx.fillStyle = '#303036';
      ctx.fillRect(176, 990, 160, 6);
    } else if (state === 'fixed') {
      ctx.fillStyle = '#08080A';
      ctx.fillRect(0, 0, 512, 1056);

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

      ctx.strokeStyle = '#C8FF2E';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.arc(256, 480, 110, Math.PI * 1.25, Math.PI * 1.75);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(256, 480, 75, Math.PI * 1.25, Math.PI * 1.75);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(256, 480, 40, Math.PI * 1.25, Math.PI * 1.75);
      ctx.stroke();

      ctx.fillStyle = '#C8FF2E';
      ctx.beginPath();
      ctx.arc(256, 480, 14, 0, Math.PI * 2);
      ctx.fill();

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

  renderScreenState('lock');

  // --- 2. SCREEN MESH ---
  // FIX #1: FrontSide only on the display face. Back gets a separate dark panel
  // with a flex-cable strip — no texture, nothing ever mirrored.
  const screenShape = createRoundedRectShape(0.68, 1.48, 0.08);
  const screenGeom = new THREE.ShapeGeometry(screenShape);

  // UV mapping for FrontSide (un-mirrored) — standard left-to-right
  const pos = screenGeom.attributes.position;
  const uvsArr = [];
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    // No inversion needed: FrontSide will render these UVs correctly on the -Z face
    uvsArr.push((x + 0.34) / 0.68, (y + 0.74) / 1.48);
  }
  screenGeom.setAttribute('uv', new THREE.Float32BufferAttribute(uvsArr, 2));

  // Front face: canvas texture, FrontSide only
  const screenFrontMat = new THREE.MeshBasicMaterial({
    map: screenTexture,
    side: THREE.FrontSide,
  });
  const screenFrontMesh = new THREE.Mesh(screenGeom, screenFrontMat);
  screenFrontMesh.name = 'screenFront';
  // Rotate so the front face (z+) points toward -Z (the user-facing side of the phone)
  screenFrontMesh.rotation.y = Math.PI;

  // Back face: dark matte panel (no texture) + flex-cable strip
  const screenBackGeom = screenGeom.clone();
  const screenBackMat = new THREE.MeshStandardMaterial({
    color: 0x0E0F12,
    roughness: 0.65,
    metalness: 0.1,
    side: THREE.FrontSide,
  });
  const screenBackMesh = new THREE.Mesh(screenBackGeom, screenBackMat);
  screenBackMesh.name = 'screenBack';
  // No rotation: faces +Z (back of phone)

  // Flex cable strip — a thin rectangle on the back
  const flexCableGeom = new THREE.BoxGeometry(0.06, 0.28, 0.003);
  const flexCableMat = new THREE.MeshStandardMaterial({
    color: 0x1C2010,
    roughness: 0.4,
    metalness: 0.3,
  });
  const flexCableMesh = new THREE.Mesh(flexCableGeom, flexCableMat);
  flexCableMesh.position.set(0.18, -0.52, 0.003);
  flexCableMesh.name = 'flexCable';

  const screenGroup = new THREE.Group();
  screenGroup.name = 'screen';
  screenGroup.add(screenFrontMesh);
  screenGroup.add(screenBackMesh);
  screenGroup.add(flexCableMesh);
  screenGroup.position.set(0, 0, -0.041);
  phoneGroup.add(screenGroup);

  // --- 3. FRAME ---
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
  // Accent edge outline on back cover so it separates from the dark background
  addEdgeOutline(backGeom, backCoverGroup);
  backCoverGroup.position.set(0, 0, 0.043);
  phoneGroup.add(backCoverGroup);

  // --- 5. CAMERA UNIT ---
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
  addEdgeOutline(camPlateGeom, cameraUnitGroup);

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

  lensPositions.forEach((lp) => {
    const ringGeom = new THREE.CylinderGeometry(0.042, 0.042, 0.018, 24);
    ringGeom.rotateX(Math.PI / 2);
    const ringMesh = new THREE.Mesh(ringGeom, lensRingMat);
    ringMesh.position.set(lp.x, lp.y, 0.061);
    cameraUnitGroup.add(ringMesh);

    const glassGeom = new THREE.CylinderGeometry(0.034, 0.034, 0.019, 20);
    glassGeom.rotateX(Math.PI / 2);
    const glassMesh = new THREE.Mesh(glassGeom, lensGlassMat);
    glassMesh.position.set(lp.x, lp.y, 0.0615);
    cameraUnitGroup.add(glassMesh);
  });

  phoneGroup.add(cameraUnitGroup);

  // --- 6. BATTERY ---
  // Matte dark body, silver label stripe, small connector tab
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
  const batteryBodyMat = new THREE.MeshStandardMaterial({
    color: 0x1A1D22,  // matte dark
    roughness: 0.75,
    metalness: 0.08,
  });
  const batteryMesh = new THREE.Mesh(batteryGeom, batteryBodyMat);
  batteryMesh.position.set(0, -0.18, 0.005);
  batteryGroup.add(batteryMesh);
  addEdgeOutline(batteryGeom, batteryGroup);

  // Silver label stripe across the battery face
  const stripeMat = new THREE.MeshStandardMaterial({
    color: 0xC0C4CC,
    roughness: 0.3,
    metalness: 0.85,
  });
  const stripeGeom = new THREE.BoxGeometry(0.42, 0.028, 0.004);
  const stripeMesh = new THREE.Mesh(stripeGeom, stripeMat);
  stripeMesh.position.set(0, -0.055, 0.021);  // sits on top face
  batteryGroup.add(stripeMesh);

  // Small connector tab (rectangular nub at top-right)
  const tabGeom = new THREE.BoxGeometry(0.055, 0.038, 0.015);
  const tabMesh = new THREE.Mesh(tabGeom, stripeMat);
  tabMesh.position.set(0.21, 0.37, 0.009);
  batteryGroup.add(tabMesh);

  phoneGroup.add(batteryGroup);

  // --- 7. BOARD ---
  // Dark green-black PCB with gold trace CanvasTexture, 8-12 chips, one metal shield can
  const boardGroup = new THREE.Group();
  boardGroup.name = 'board';

  // PCB Texture (CanvasTexture for gold traces)
  const pcbCanvas = document.createElement('canvas');
  pcbCanvas.width = 256;
  pcbCanvas.height = 192;
  const pcbCtx = pcbCanvas.getContext('2d');

  // PCB base: dark green-black
  pcbCtx.fillStyle = '#0F1A14';
  pcbCtx.fillRect(0, 0, 256, 192);

  // Gold trace lines
  pcbCtx.strokeStyle = '#8B6914';
  pcbCtx.lineWidth = 1.5;

  // Horizontal traces
  [24, 48, 72, 96, 120, 144, 168].forEach((y) => {
    pcbCtx.beginPath();
    pcbCtx.moveTo(8, y);
    pcbCtx.lineTo(248, y);
    pcbCtx.stroke();
  });
  // Vertical traces
  [32, 64, 96, 128, 160, 192, 224].forEach((x) => {
    pcbCtx.beginPath();
    pcbCtx.moveTo(x, 8);
    pcbCtx.lineTo(x, 184);
    pcbCtx.stroke();
  });
  // Extra connector pads (brighter gold)
  pcbCtx.fillStyle = '#B08020';
  [[20, 10], [236, 10], [20, 182], [236, 182]].forEach(([x, y]) => {
    pcbCtx.fillRect(x - 4, y - 3, 8, 6);
  });

  const pcbTexture = new THREE.CanvasTexture(pcbCanvas);

  const pcbGeom = new THREE.BoxGeometry(0.58, 0.44, 0.012);
  const pcbMat = new THREE.MeshStandardMaterial({
    color: 0x0F1A14,
    map: pcbTexture,
    roughness: 0.5,
    metalness: 0.2,
  });
  const pcbMesh = new THREE.Mesh(pcbGeom, pcbMat);
  pcbMesh.position.set(0, 0.46, 0.005);
  boardGroup.add(pcbMesh);
  addEdgeOutline(pcbGeom, boardGroup);

  // Merged Chips (8 chips, all dark matte)
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

  // Metal shield can (larger chip with metallic lid)
  const shieldGeom = new THREE.BoxGeometry(0.17, 0.14, 0.012);
  shieldGeom.translate(-0.03, 0.59, 0.015);
  const shieldMat = new THREE.MeshStandardMaterial({
    color: 0x8A8D94,
    roughness: 0.2,
    metalness: 0.95,
  });
  const shieldMesh = new THREE.Mesh(shieldGeom, shieldMat);
  boardGroup.add(shieldMesh);

  phoneGroup.add(boardGroup);

  // --- 8. PORT ---
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
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.set(0, -0.82, 0);
  phoneGroup.add(shadowMesh);

  // -------------------------------------------------------------------
  // EXPLODED VIEW POSITIONS
  // Staggered explosion: backCover first, then cameraUnit, battery,
  // board, screen — each part has its own 0..1 progress curve via offsets.
  // Max 4 degrees (~0.07 rad) of rotation drift.
  // -------------------------------------------------------------------
  const restPositions = {
    screen:      { x: 0,     y: 0,     z: -0.041, rx: 0,     ry: 0 },
    backCover:   { x: 0,     y: 0,     z:  0.043, rx: 0,     ry: 0 },
    cameraUnit:  { x: 0,     y: 0,     z:  0,     rx: 0,     ry: 0 },
    battery:     { x: 0,     y: 0,     z:  0,     rx: 0,     ry: 0 },
    board:       { x: 0,     y: 0,     z:  0,     rx: 0,     ry: 0 },
    port:        { x: 0,     y: 0,     z:  0,     rx: 0,     ry: 0 },
    frame:       { x: 0,     y: 0,     z:  0,     rx: 0,     ry: 0 },
  };

  const explodedPositions = {
    // z values per spec: backCover +1.2, cameraUnit +0.7, battery +0.45, board +0.25, screen -0.35
    // Lateral drift kept modest for clean silhouette separation
    screen:      { x: -0.14, y:  0.01, z: -0.35,  rx: -0.03, ry:  0.04 },
    backCover:   { x:  0.08, y: -0.03, z:  1.20,  rx:  0.06, ry: -0.05 },
    cameraUnit:  { x: -0.06, y:  0.09, z:  0.70,  rx:  0.05, ry: -0.04 },
    battery:     { x:  0.05, y: -0.07, z:  0.45,  rx: -0.04, ry:  0.04 },
    board:       { x:  0.03, y:  0.05, z:  0.25,  rx:  0.03, ry: -0.03 },
    port:        { x:  0,    y: -0.08, z:  0.05,  rx:  0.02, ry:  0    },
    frame:       { x:  0,    y:  0,    z:  0,     rx:  0,    ry:  0    },
  };

  // Stagger offsets: each part starts opening at a different sub-progress within [0,1]
  // Order: backCover → cameraUnit → battery → board → screen
  // Offset[key] = how much progress must elapse before THIS part starts moving
  const explodeStagger = {
    backCover:  0.00,
    cameraUnit: 0.04,
    battery:    0.08,
    board:      0.12,
    screen:     0.16,
    port:       0.08,
    frame:      0.00,
  };
  const explodeTaper = 0.84; // parts reach full exploded state at this t (leaving tail for overshoot)

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

  /**
   * setExplodeProgress(t, isReassemble)
   * t ∈ [0, 1]
   * When isReassemble=true (rebuild phase) we apply a 2% overshoot on the lerp
   * and reverse stagger order: screen → board → battery → cameraUnit → backCover
   */
  function setExplodeProgress(t, isReassemble = false) {
    const parts = [
      { group: screenGroup,     key: 'screen' },
      { group: backCoverGroup,  key: 'backCover' },
      { group: cameraUnitGroup, key: 'cameraUnit' },
      { group: batteryGroup,    key: 'battery' },
      { group: boardGroup,      key: 'board' },
      { group: portGroup,       key: 'port' },
    ];

    parts.forEach(({ group, key }) => {
      const rest = restPositions[key];
      const expl = explodedPositions[key];
      const offset = explodeStagger[key];

      let localT;
      if (!isReassemble) {
        // Opening: stagger — each part starts at its offset
        localT = offset >= 1 ? 0 : Math.min(1, Math.max(0, (t - offset) / (explodeTaper - offset)));
        // Smooth step
        localT = localT * localT * (3 - 2 * localT);
      } else {
        // Reassemble: reverse stagger — backCover closes last
        // Reverse offset: 1 - offset_original gives last-in-first-out
        const reverseOffset = explodeStagger[key]; // same offsets; we invert t space
        localT = reverseOffset >= 1 ? 1 : Math.max(0, Math.min(1, (t - reverseOffset) / (explodeTaper - reverseOffset)));
        localT = localT * localT * (3 - 2 * localT);
        // 2% overshoot: lerp a bit past rest
        const overshoot = 1.02;
        localT = localT * overshoot;
        localT = Math.min(1.02, localT); // allow slight over-travel
      }

      if (isReassemble) {
        // t=0 means still open, t=1 means closed. So effective progress = 1 - localT
        const eff = 1.0 - localT;
        group.position.x = THREE.MathUtils.lerp(rest.x, expl.x, eff);
        group.position.y = THREE.MathUtils.lerp(rest.y, expl.y, eff);
        group.position.z = THREE.MathUtils.lerp(rest.z, expl.z, eff);
        group.rotation.x = THREE.MathUtils.lerp(rest.rx, expl.rx, eff);
        group.rotation.y = THREE.MathUtils.lerp(rest.ry, expl.ry, eff);
      } else {
        group.position.x = THREE.MathUtils.lerp(rest.x, expl.x, localT);
        group.position.y = THREE.MathUtils.lerp(rest.y, expl.y, localT);
        group.position.z = THREE.MathUtils.lerp(rest.z, expl.z, localT);
        group.rotation.x = THREE.MathUtils.lerp(rest.rx, expl.rx, localT);
        group.rotation.y = THREE.MathUtils.lerp(rest.ry, expl.ry, localT);
      }
    });

    shadowMesh.material.opacity = THREE.MathUtils.lerp(0.7, 0.2, Math.min(t, 1));
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
      pcbTexture.dispose();
      phoneGroup.traverse((child) => {
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
