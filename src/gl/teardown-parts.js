import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/**
 * DATA Teardown Anatomy & Realism Architecture (TEARDOWN.md Part T1)
 * Procedural PBR components:
 * - Real layer stack: Back Cover -> Cover Plate & Wireless Coil -> Internals (Board, Battery, Port, Ribbons) -> Midframe -> Display
 * - Instanced Phillips screws (steel heads + cross slot)
 * - Archimedean spiral copper wireless charging coil (TubeGeometry) + NFC loop
 * - Dynamic FlexRibbon class (QuadraticBezierCurve3)
 * - Spudger pry tool and precision Phillips screwdriver
 * - Procedural canvas textures (brushed aluminium roughness, gold PCB traces, shield can dot-grid, battery label)
 */

/**
 * 1. Procedural Texture Generators (Cached once, disposed on teardown)
 */
export function createProceduralTextures(isMobile = false) {
  // A. Brushed Aluminium Roughness Map (256x256)
  const brushedCanvas = document.createElement('canvas');
  brushedCanvas.width = 256;
  brushedCanvas.height = 256;
  const bCtx = brushedCanvas.getContext('2d');
  bCtx.fillStyle = '#555555';
  bCtx.fillRect(0, 0, 256, 256);

  // Horizontal brushed metal micro-streaks
  for (let i = 0; i < 400; i++) {
    const y = Math.random() * 256;
    const len = 40 + Math.random() * 180;
    const x = Math.random() * (256 - len);
    const bright = Math.floor(65 + Math.random() * 45);
    bCtx.strokeStyle = `rgba(${bright}, ${bright}, ${bright}, ${0.15 + Math.random() * 0.25})`;
    bCtx.lineWidth = 1 + Math.random() * 1.5;
    bCtx.beginPath();
    bCtx.moveTo(x, y);
    bCtx.lineTo(x + len, y);
    bCtx.stroke();
  }
  const brushedTexture = new THREE.CanvasTexture(brushedCanvas);
  brushedTexture.wrapS = THREE.RepeatWrapping;
  brushedTexture.wrapT = THREE.RepeatWrapping;

  // B. PCB Circuit Trace Map (512x512 desktop, 256x256 mobile)
  const pcbSize = isMobile ? 256 : 512;
  const pcbCanvas = document.createElement('canvas');
  pcbCanvas.width = pcbSize;
  pcbCanvas.height = pcbSize;
  const pCtx = pcbCanvas.getContext('2d');

  // Base dark green/black PCB (#0E1912)
  pCtx.fillStyle = '#0E1912';
  pCtx.fillRect(0, 0, pcbSize, pcbSize);

  // Subdued ground plane copper pour
  pCtx.fillStyle = 'rgba(20, 36, 26, 0.45)';
  pCtx.fillRect(10, 10, pcbSize - 20, pcbSize - 20);

  // Gold traces (#C9A24D)
  pCtx.strokeStyle = '#C9A24D';
  pCtx.lineWidth = isMobile ? 1.5 : 2;
  pCtx.lineCap = 'round';
  pCtx.lineJoin = 'round';

  const traceStep = pcbSize / 16;
  for (let i = 2; i < 15; i++) {
    const yStart = i * traceStep;
    pCtx.beginPath();
    pCtx.moveTo(20, yStart);
    pCtx.lineTo(pcbSize * 0.35, yStart);
    pCtx.lineTo(pcbSize * 0.45, yStart + (i % 2 === 0 ? 20 : -20));
    pCtx.lineTo(pcbSize * 0.75, yStart + (i % 2 === 0 ? 20 : -20));
    pCtx.lineTo(pcbSize - 25, yStart);
    pCtx.stroke();
  }

  // Gold Via Pads (small circles with dark drill centers)
  pCtx.fillStyle = '#C9A24D';
  for (let vx = 30; vx < pcbSize - 30; vx += traceStep) {
    for (let vy = 30; vy < pcbSize - 30; vy += traceStep) {
      if ((vx + vy) % 3 === 0) {
        pCtx.beginPath();
        pCtx.arc(vx, vy, isMobile ? 3 : 4, 0, Math.PI * 2);
        pCtx.fill();
        pCtx.fillStyle = '#0A120D';
        pCtx.beginPath();
        pCtx.arc(vx, vy, isMobile ? 1.2 : 1.8, 0, Math.PI * 2);
        pCtx.fill();
        pCtx.fillStyle = '#C9A24D';
      }
    }
  }

  // Silkscreen text and markings
  pCtx.fillStyle = 'rgba(235, 235, 230, 0.75)';
  pCtx.font = `600 ${isMobile ? 10 : 14}px "DM Mono", monospace`;
  pCtx.fillText('DATA LOGIC V3.2', 28, pcbSize - 32);
  pCtx.fillText('042-LHR', pcbSize - 85, pcbSize - 32);

  const pcbTexture = new THREE.CanvasTexture(pcbCanvas);
  pcbTexture.colorSpace = THREE.SRGBColorSpace;

  // C. Shield Can Dot-Grid Bump Map (128x128)
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = 128;
  bumpCanvas.height = 128;
  const bumpCtx = bumpCanvas.getContext('2d');
  bumpCtx.fillStyle = '#808080';
  bumpCtx.fillRect(0, 0, 128, 128);
  bumpCtx.fillStyle = '#202020';
  for (let x = 8; x < 128; x += 12) {
    for (let y = 8; y < 128; y += 12) {
      bumpCtx.beginPath();
      bumpCtx.arc(x, y, 2.5, 0, Math.PI * 2);
      bumpCtx.fill();
    }
  }
  const shieldBumpTexture = new THREE.CanvasTexture(bumpCanvas);
  shieldBumpTexture.wrapS = THREE.RepeatWrapping;
  shieldBumpTexture.wrapT = THREE.RepeatWrapping;
  shieldBumpTexture.repeat.set(3, 3);

  // D. Battery Label Texture (256x512)
  const batCanvas = document.createElement('canvas');
  batCanvas.width = 256;
  batCanvas.height = 512;
  const batCtx = batCanvas.getContext('2d');

  // Matte dark base (#111215)
  batCtx.fillStyle = '#111215';
  batCtx.fillRect(0, 0, 256, 512);

  // Silver foil horizontal stripe across center
  const silverGrad = batCtx.createLinearGradient(0, 0, 256, 0);
  silverGrad.addColorStop(0, '#8E9196');
  silverGrad.addColorStop(0.3, '#D4D7DE');
  silverGrad.addColorStop(0.5, '#F0F2F6');
  silverGrad.addColorStop(0.7, '#C2C5CD');
  silverGrad.addColorStop(1, '#8E9196');
  batCtx.fillStyle = silverGrad;
  batCtx.fillRect(0, 230, 256, 36);

  // Accent #C8FF2E top-right corner mark
  batCtx.fillStyle = '#C8FF2E';
  batCtx.fillRect(230, 16, 12, 12);

  // Battery mono text lines
  batCtx.fillStyle = '#E1E3E8';
  batCtx.font = '700 16px "DM Mono", monospace';
  batCtx.fillText('DATA POWER CELL', 24, 60);

  batCtx.fillStyle = '#8C8E94';
  batCtx.font = '500 11px "DM Mono", monospace';
  batCtx.fillText('MODEL: DT-4500-LHR', 24, 88);
  batCtx.fillText('RATED: 3.87V / 4500mAh / 17.41Wh', 24, 108);
  batCtx.fillText('MAX CHARGE VOLTAGE: 4.45V', 24, 128);

  batCtx.fillStyle = '#15161A';
  batCtx.font = '700 13px "DM Mono", monospace';
  batCtx.fillText('CERTIFIED WORKSHOP REPAIR PART', 18, 254);

  batCtx.fillStyle = '#6E7178';
  batCtx.font = '400 9px "DM Mono", monospace';
  batCtx.fillText('CAUTION: DO NOT CRUSH, PUNCTURE OR HEAT', 24, 300);
  batCtx.fillText('REPLACE ONLY WITH AUTHORIZED BATTERY', 24, 316);
  batCtx.fillText('RECYCLE OR DISPOSE PROPERLY', 24, 332);

  const batteryTexture = new THREE.CanvasTexture(batCanvas);
  batteryTexture.colorSpace = THREE.SRGBColorSpace;

  return {
    brushedTexture,
    pcbTexture,
    shieldBumpTexture,
    batteryTexture,
    dispose() {
      brushedTexture.dispose();
      pcbTexture.dispose();
      shieldBumpTexture.dispose();
      batteryTexture.dispose();
    },
  };
}

/**
 * 2. Dynamic Flex Ribbon Class (TEARDOWN.md Part T1)
 * Uses PlaneGeometry repositioned along a QuadraticBezierCurve3 between two anchors.
 * Connectors at both ends. Updated only when progress changes (dirty flag).
 */
export class FlexRibbon {
  constructor({ width = 0.04, segments = 24, color = 0xC8791F }) {
    this.width = width;
    this.segments = segments;

    // Amber polyimide material (#C8791F, roughness 0.5)
    this.material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.5,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });

    this.geometry = new THREE.PlaneGeometry(width, 1, 1, segments);
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.castShadow = false;

    this.curve = new THREE.QuadraticBezierCurve3();
    this.group = new THREE.Group();
    this.group.name = 'flexRibbonGroup';
    this.group.add(this.mesh);
  }

  updateCurve(start, end, control) {
    this.curve.v0.copy(start);
    this.curve.v1.copy(control);
    this.curve.v2.copy(end);

    const pos = this.geometry.attributes.position;
    const tangent = new THREE.Vector3();
    const binormal = new THREE.Vector3(1, 0, 0);
    const point = new THREE.Vector3();
    const halfW = this.width / 2;

    for (let i = 0; i <= this.segments; i++) {
      const t = i / this.segments;
      this.curve.getPoint(t, point);
      this.curve.getTangent(t, tangent);

      binormal.crossVectors(tangent, new THREE.Vector3(0, 0, 1)).normalize();
      if (binormal.lengthSq() < 0.001) {
        binormal.set(1, 0, 0);
      }

      const idxLeft = i * 2;
      const idxRight = i * 2 + 1;

      pos.setXYZ(idxLeft, point.x - binormal.x * halfW, point.y - binormal.y * halfW, point.z - binormal.z * halfW);
      pos.setXYZ(idxRight, point.x + binormal.x * halfW, point.y + binormal.y * halfW, point.z + binormal.z * halfW);
    }

    pos.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }
}

/**
 * 3. Archimedean Spiral Copper Wireless Coil & NFC Loop (TubeGeometry)
 */
class SpiralCurve extends THREE.Curve {
  constructor(turns = 8, innerRadius = 0.05, outerRadius = 0.19) {
    super();
    this.turns = turns;
    this.innerRadius = innerRadius;
    this.outerRadius = outerRadius;
  }

  getPoint(t, optionalTarget = new THREE.Vector3()) {
    const totalAngle = this.turns * Math.PI * 2;
    const angle = t * totalAngle;
    const r = this.innerRadius + t * (this.outerRadius - this.innerRadius);
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);
    return optionalTarget.set(x, y, 0);
  }
}

export function createWirelessCoil(isMobile = false) {
  const coilGroup = new THREE.Group();
  coilGroup.name = 'wirelessCoilGroup';

  // Thin dark flex pad under coil
  const padGeom = new RoundedBoxGeometry(0.44, 0.44, 0.002, 3, 0.04);
  const padMat = new THREE.MeshStandardMaterial({
    color: 0x1A1B1F,
    roughness: 0.65,
    metalness: 0.1,
  });
  const padMesh = new THREE.Mesh(padGeom, padMat);
  coilGroup.add(padMesh);

  // Archimedean spiral copper TubeGeometry
  const spiralCurve = new SpiralCurve(8, 0.05, 0.19);
  const tubularSegments = isMobile ? 80 : 160;
  const radialSegments = isMobile ? 4 : 6;
  const coilGeom = new THREE.TubeGeometry(spiralCurve, tubularSegments, 0.004, radialSegments, false);
  const copperMat = new THREE.MeshStandardMaterial({
    color: 0xB87333, // Copper #B87333
    metalness: 1.0,
    roughness: 0.28,
  });
  const coilMesh = new THREE.Mesh(coilGeom, copperMat);
  coilMesh.position.set(0, 0, 0.003);
  coilGroup.add(coilMesh);

  // Outer NFC antenna loop (gold/copper trace loop)
  const nfcGeom = new THREE.RingGeometry(0.205, 0.215, isMobile ? 32 : 48);
  const nfcMat = new THREE.MeshStandardMaterial({
    color: 0xB87333,
    metalness: 1.0,
    roughness: 0.3,
    side: THREE.DoubleSide,
  });
  const nfcMesh = new THREE.Mesh(nfcGeom, nfcMat);
  nfcMesh.position.set(0, 0, 0.002);
  coilGroup.add(nfcMesh);

  return coilGroup;
}

/**
 * 4. Instanced Phillips Screws (Steel heads + cross slots)
 * 12 on cover plate, 6 on board — total 18 screws rendered in 1-2 draw calls!
 */
export function createInstancedScrews(positions, isMobile = false) {
  const count = positions.length;
  // Screw head: steel cylinder (#A8ABB2, metalness 1, roughness 0.35)
  const headGeom = new THREE.CylinderGeometry(0.016, 0.016, 0.008, isMobile ? 8 : 12);
  headGeom.rotateX(Math.PI / 2);
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xA8ABB2,
    metalness: 1.0,
    roughness: 0.35,
  });

  const instancedMesh = new THREE.InstancedMesh(headGeom, headMat, count);
  instancedMesh.name = 'instancedScrews';

  const dummy = new THREE.Object3D();
  positions.forEach((pos, i) => {
    dummy.position.set(pos.x, pos.y, pos.z);
    dummy.rotation.set(0, 0, (i * 0.5) % Math.PI); // subtle randomized slot angles
    dummy.updateMatrix();
    instancedMesh.setMatrixAt(i, dummy.matrix);
  });
  instancedMesh.instanceMatrix.needsUpdate = true;

  return instancedMesh;
}

/**
 * 5. Workshop Tools: Spudger Pry Tool & Precision Phillips Screwdriver
 */
export function createWorkshopTools() {
  const toolsGroup = new THREE.Group();
  toolsGroup.name = 'workshopTools';
  toolsGroup.visible = false; // Hidden unless actively animating in teardown scene

  // A. Spudger (black plastic pry tool)
  const spudgerGroup = new THREE.Group();
  spudgerGroup.name = 'spudger';

  const sBodyGeom = new THREE.BoxGeometry(0.024, 0.38, 0.008);
  const sMat = new THREE.MeshStandardMaterial({
    color: 0x141517,
    roughness: 0.75,
    metalness: 0.1,
  });
  const sBodyMesh = new THREE.Mesh(sBodyGeom, sMat);

  // Beveled chisel tip
  const sTipGeom = new THREE.BoxGeometry(0.024, 0.06, 0.003);
  const sTipMesh = new THREE.Mesh(sTipGeom, sMat);
  sTipMesh.position.set(0, -0.21, -0.002);

  spudgerGroup.add(sBodyMesh);
  spudgerGroup.add(sTipMesh);
  spudgerGroup.position.set(-0.8, -0.5, 0); // start outside frame
  toolsGroup.add(spudgerGroup);

  // B. Precision Phillips Screwdriver
  const driverGroup = new THREE.Group();
  driverGroup.name = 'screwdriver';

  // Knurled 24-sided metallic handle
  const handleGeom = new THREE.CylinderGeometry(0.024, 0.024, 0.42, 24);
  const handleMat = new THREE.MeshStandardMaterial({
    color: 0x484B52,
    metalness: 0.85,
    roughness: 0.42,
  });
  const handleMesh = new THREE.Mesh(handleGeom, handleMat);

  // Swivel top cap
  const capGeom = new THREE.CylinderGeometry(0.026, 0.026, 0.04, 24);
  const capMat = new THREE.MeshStandardMaterial({ color: 0x222326, roughness: 0.6 });
  const capMesh = new THREE.Mesh(capGeom, capMat);
  capMesh.position.set(0, 0.22, 0);

  // Steel shaft
  const shaftGeom = new THREE.CylinderGeometry(0.007, 0.007, 0.26, 12);
  const shaftMat = new THREE.MeshStandardMaterial({
    color: 0xB5B9C2,
    metalness: 1.0,
    roughness: 0.25,
  });
  const shaftMesh = new THREE.Mesh(shaftGeom, shaftMat);
  shaftMesh.position.set(0, -0.32, 0);

  // Cross tip
  const tipGeom = new THREE.BoxGeometry(0.009, 0.025, 0.009);
  const tipMesh = new THREE.Mesh(tipGeom, shaftMat);
  tipMesh.position.set(0, -0.45, 0);

  driverGroup.add(handleMesh);
  driverGroup.add(capMesh);
  driverGroup.add(shaftMesh);
  driverGroup.add(tipMesh);
  driverGroup.position.set(0.8, 0.6, 0.5); // start outside frame
  toolsGroup.add(driverGroup);

  return {
    toolsGroup,
    spudgerGroup,
    driverGroup,
  };
}
