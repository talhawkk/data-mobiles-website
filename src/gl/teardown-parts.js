import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/**
 * DATA Teardown Anatomy & Hyper-Realism Architecture (TEARDOWN.md Part T1 & T2)
 *
 * Real flagship smartphone anatomy layer stack:
 * - High-density multi-layer logic board with BGA processor, NAND flash, PMIC, 40+ SMD capacitors/resistors,
 *   stamped stainless steel EMI shields, gold FPC connectors, copper heat-pipe vapor chamber.
 * - Pouch cell battery with vacuum crimp perimeter lip, authentic regulatory label (CE, WEEE, UL, Li-ion, cautions),
 *   top BMS circuit with Kapton amber tape, and stretch-release pull tabs.
 * - Triple-lens camera module with anti-reflective sapphire optics, periscope prism, LiDAR, and Quad True Tone flash.
 * - Bottom sub-board with 24-pin USB-C receptacle, silicone waterproof gasket, Taptic Engine linear motor, and RF coax cables.
 * - Display assembly with rear copper heat-dissipation sheet, graphite pad, and display driver COF flex ribbon.
 */

/**
 * 1. Hyper-Realistic Procedural Texture Generators
 */
export function createProceduralTextures(isMobile = false) {
  // A. Brushed Aluminium Roughness Map (256x256)
  const brushedCanvas = document.createElement('canvas');
  brushedCanvas.width = 256;
  brushedCanvas.height = 256;
  const bCtx = brushedCanvas.getContext('2d');
  bCtx.fillStyle = '#666666';
  bCtx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 450; i++) {
    const y = Math.random() * 256;
    const len = 50 + Math.random() * 190;
    const x = Math.random() * (256 - len);
    const bright = Math.floor(75 + Math.random() * 55);
    bCtx.strokeStyle = `rgba(${bright}, ${bright}, ${bright}, ${0.18 + Math.random() * 0.28})`;
    bCtx.lineWidth = 1 + Math.random() * 1.5;
    bCtx.beginPath();
    bCtx.moveTo(x, y);
    bCtx.lineTo(x + len, y);
    bCtx.stroke();
  }
  const brushedTexture = new THREE.CanvasTexture(brushedCanvas);
  brushedTexture.wrapS = THREE.RepeatWrapping;
  brushedTexture.wrapT = THREE.RepeatWrapping;

  // B. Hyper-Detailed PCB Circuit Trace Map (1024x1024 desktop, 512x512 mobile)
  const pcbSize = isMobile ? 512 : 1024;
  const pcbCanvas = document.createElement('canvas');
  pcbCanvas.width = pcbSize;
  pcbCanvas.height = pcbSize;
  const pCtx = pcbCanvas.getContext('2d');

  // Base dark emerald substrate (#0D1C13)
  pCtx.fillStyle = '#0D1C13';
  pCtx.fillRect(0, 0, pcbSize, pcbSize);

  // Woven fiberglass micro-grid substrate texture
  pCtx.strokeStyle = 'rgba(20, 42, 28, 0.4)';
  pCtx.lineWidth = 1;
  const weaveStep = isMobile ? 8 : 12;
  for (let x = 0; x < pcbSize; x += weaveStep) {
    pCtx.beginPath();
    pCtx.moveTo(x, 0);
    pCtx.lineTo(x, pcbSize);
    pCtx.stroke();
  }
  for (let y = 0; y < pcbSize; y += weaveStep) {
    pCtx.beginPath();
    pCtx.moveTo(0, y);
    pCtx.lineTo(pcbSize, y);
    pCtx.stroke();
  }

  // Copper ground planes & power distribution polygons
  pCtx.fillStyle = 'rgba(28, 56, 38, 0.55)';
  pCtx.beginPath();
  pCtx.roundRect(16, 16, pcbSize - 32, pcbSize - 32, 20);
  pCtx.fill();

  // Dense Gold immersion (ENIG) circuit trace routing
  pCtx.strokeStyle = '#D4AF37'; // Rich gold ENIG
  pCtx.lineWidth = isMobile ? 1.5 : 2.5;
  pCtx.lineCap = 'round';
  pCtx.lineJoin = 'round';

  const traceCount = isMobile ? 24 : 42;
  const step = pcbSize / traceCount;

  for (let i = 1; i < traceCount; i++) {
    const yStart = i * step;
    pCtx.beginPath();
    pCtx.moveTo(24, yStart);
    pCtx.lineTo(pcbSize * 0.28, yStart);
    const offset = (i % 3 - 1) * (step * 0.8);
    pCtx.lineTo(pcbSize * 0.40, yStart + offset);
    pCtx.lineTo(pcbSize * 0.72, yStart + offset);
    pCtx.lineTo(pcbSize - 28, yStart);
    pCtx.stroke();

    // Serpentine meandering delay traces on select high-speed data buses
    if (i % 5 === 0) {
      pCtx.beginPath();
      let sx = pcbSize * 0.44;
      pCtx.moveTo(sx, yStart + offset);
      for (let s = 0; s < 4; s++) {
        pCtx.lineTo(sx + 10, yStart + offset - 8);
        pCtx.lineTo(sx + 20, yStart + offset + 8);
        sx += 20;
      }
      pCtx.stroke();
    }
  }

  // 100+ Gold Via Drill Holes (gold annular rings with black drill barrels)
  pCtx.fillStyle = '#D4AF37';
  const viaRadius = isMobile ? 3.5 : 5.0;
  const drillRadius = isMobile ? 1.4 : 2.0;

  for (let vx = 36; vx < pcbSize - 36; vx += step * 1.5) {
    for (let vy = 36; vy < pcbSize - 36; vy += step * 1.5) {
      if ((vx + vy) % 4 === 0) {
        pCtx.beginPath();
        pCtx.arc(vx, vy, viaRadius, 0, Math.PI * 2);
        pCtx.fill();

        pCtx.fillStyle = '#060B08';
        pCtx.beginPath();
        pCtx.arc(vx, vy, drillRadius, 0, Math.PI * 2);
        pCtx.fill();
        pCtx.fillStyle = '#D4AF37';
      }
    }
  }

  // SMD Solder Footprint Arrays (pads for capacitors and resistors)
  pCtx.fillStyle = '#E6C665';
  for (let bx = 60; bx < pcbSize - 60; bx += step * 2.2) {
    for (let by = 60; by < pcbSize - 60; by += step * 2.2) {
      pCtx.fillRect(bx, by, isMobile ? 6 : 9, isMobile ? 3 : 5);
      pCtx.fillRect(bx + (isMobile ? 10 : 14), by, isMobile ? 6 : 9, isMobile ? 3 : 5);
    }
  }

  // High-precision silkscreen markings
  pCtx.fillStyle = 'rgba(240, 242, 245, 0.85)';
  pCtx.font = `700 ${isMobile ? 11 : 16}px "DM Mono", monospace`;
  pCtx.fillText('DATA LOGIC BIONIC REV 4.2', 36, pcbSize - 40);
  pCtx.font = `600 ${isMobile ? 9 : 12}px "DM Mono", monospace`;
  pCtx.fillText('5G SUB-6 // UWB // NFC // DSI_0', 36, pcbSize - 22);
  pCtx.fillText('TP_GND · VCC_MAIN', pcbSize - 180, pcbSize - 40);
  pCtx.fillText('LAHORE 042 // PK', pcbSize - 180, pcbSize - 22);

  const pcbTexture = new THREE.CanvasTexture(pcbCanvas);
  pcbTexture.colorSpace = THREE.SRGBColorSpace;

  // C. Main Processor SoC BGA Chip Texture (512x512)
  const socCanvas = document.createElement('canvas');
  socCanvas.width = 512;
  socCanvas.height = 512;
  const sCtx = socCanvas.getContext('2d');

  // Glossy dark obsidian silicon packaging (#08080A)
  sCtx.fillStyle = '#08080A';
  sCtx.fillRect(0, 0, 512, 512);

  // Chamfered gold pin 1 index notch
  sCtx.fillStyle = '#D4AF37';
  sCtx.beginPath();
  sCtx.moveTo(12, 12);
  sCtx.lineTo(44, 12);
  sCtx.lineTo(12, 44);
  sCtx.closePath();
  sCtx.fill();

  // Subtle metallic specular bezel edge
  sCtx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  sCtx.lineWidth = 4;
  sCtx.strokeRect(6, 6, 500, 500);

  // Golden perimeter BGA solder balls indicator
  sCtx.fillStyle = '#C9A24D';
  for (let i = 18; i < 494; i += 16) {
    sCtx.fillRect(i, 6, 8, 3);
    sCtx.fillRect(i, 503, 8, 3);
    sCtx.fillRect(6, i, 3, 8);
    sCtx.fillRect(503, i, 3, 8);
  }

  // Laser silkscreen branding & specs
  sCtx.fillStyle = '#FFFFFF';
  sCtx.font = '800 38px "Bricolage Grotesque", sans-serif';
  sCtx.textAlign = 'center';
  sCtx.fillText('DATA', 256, 170);

  sCtx.fillStyle = '#16A34A';
  sCtx.font = '700 22px "DM Mono", monospace';
  sCtx.fillText('A18 PRO BIONIC', 256, 206);

  sCtx.fillStyle = '#A8ABB4';
  sCtx.font = '500 15px "DM Mono", monospace';
  sCtx.fillText('3nm ARCHITECTURE · 6-CORE CPU', 256, 252);
  sCtx.fillText('6-CORE GPU · 16-CORE NEURAL ENGINE', 256, 276);
  sCtx.fillText('8GB LPDDR5X · 8533 Mbps', 256, 300);

  // 2D DataMatrix barcode simulation
  sCtx.fillStyle = '#E0E3EB';
  const qrX = 216;
  const qrY = 340;
  const qrSize = 80;
  sCtx.fillRect(qrX, qrY, qrSize, 4);
  sCtx.fillRect(qrX, qrY, 4, qrSize);
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if ((r * 3 + c * 7 + 1) % 5 > 1) {
        sCtx.fillRect(qrX + c * 8 + 4, qrY + r * 8 + 4, 6, 6);
      }
    }
  }

  sCtx.fillStyle = '#727682';
  sCtx.font = '500 12px "DM Mono", monospace';
  sCtx.fillText('LOT N3B-2026-LHR-042', 256, 452);

  const socTexture = new THREE.CanvasTexture(socCanvas);
  socTexture.colorSpace = THREE.SRGBColorSpace;

  // D. Full Regulatory Flagship Battery Label Texture (512x1024)
  const batCanvas = document.createElement('canvas');
  batCanvas.width = 512;
  batCanvas.height = 1024;
  const batCtx = batCanvas.getContext('2d');

  // Matte graphite lithium-ion polymer foil pouch (#131417)
  batCtx.fillStyle = '#131417';
  batCtx.fillRect(0, 0, 512, 1024);

  // Hermetic laser crimp perimeter seal flange
  batCtx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  batCtx.lineWidth = 14;
  batCtx.strokeRect(7, 7, 498, 1010);

  // Vacuum packaging micro surface ribbing
  batCtx.fillStyle = 'rgba(255, 255, 255, 0.015)';
  for (let y = 30; y < 1000; y += 12) {
    batCtx.fillRect(16, y, 480, 2);
  }

  // Silver foil horizontal band
  const silverGrad = batCtx.createLinearGradient(0, 0, 512, 0);
  silverGrad.addColorStop(0, '#7D8087');
  silverGrad.addColorStop(0.25, '#CFD2D9');
  silverGrad.addColorStop(0.5, '#F5F7FA');
  silverGrad.addColorStop(0.75, '#C2C5CD');
  silverGrad.addColorStop(1, '#7D8087');
  batCtx.fillStyle = silverGrad;
  batCtx.fillRect(0, 480, 512, 64);

  batCtx.fillStyle = '#08090C';
  batCtx.font = '800 22px "DM Mono", monospace';
  batCtx.textAlign = 'left';
  batCtx.fillText('CERTIFIED WORKSHOP REPAIR PACK', 36, 520);

  // Top Title
  batCtx.fillStyle = '#FFFFFF';
  batCtx.font = '800 28px "Bricolage Grotesque", sans-serif';
  batCtx.fillText('DATA POWER CELL PRO', 40, 90);

  batCtx.fillStyle = '#16A34A';
  batCtx.font = '700 18px "DM Mono", monospace';
  batCtx.fillText('MODEL: DT-B4685-PRO // HIGH DENSITY', 40, 130);

  // Ratings Table
  batCtx.fillStyle = '#CFD2D9';
  batCtx.font = '500 16px "DM Mono", monospace';
  batCtx.fillText('RATED VOLTAGE: 3.89 Vdc', 40, 175);
  batCtx.fillText('CAPACITY: 4685 mAh / 18.22 Wh', 40, 205);
  batCtx.fillText('LIMITED CHARGE VOLTAGE: 4.45 Vdc', 40, 235);
  batCtx.fillText('CHEMISTRY: RECHARGEABLE LI-ION POLYMER', 40, 265);

  // Official Regulatory Icons drawn in 2D
  // 1. Crossed-out wheelie bin (WEEE)
  const drawWheelieBin = (cx, cy) => {
    batCtx.strokeStyle = '#FFFFFF';
    batCtx.lineWidth = 3;
    batCtx.strokeRect(cx - 16, cy - 16, 32, 34);
    batCtx.beginPath();
    batCtx.moveTo(cx - 20, cy - 16);
    batCtx.lineTo(cx + 20, cy - 16);
    batCtx.stroke();
    // Heavy bar below bin
    batCtx.fillRect(cx - 18, cy + 22, 36, 6);
    // Crossed out lines
    batCtx.strokeStyle = '#EF4444';
    batCtx.beginPath();
    batCtx.moveTo(cx - 22, cy - 20);
    batCtx.lineTo(cx + 22, cy + 20);
    batCtx.moveTo(cx + 22, cy - 20);
    batCtx.lineTo(cx - 22, cy + 20);
    batCtx.stroke();
  };
  drawWheelieBin(80, 350);

  // 2. Recycling chasing arrows with Li-ion
  batCtx.fillStyle = '#FFFFFF';
  batCtx.font = '700 18px "DM Mono", monospace';
  batCtx.fillText('♻', 140, 360);
  batCtx.font = '600 12px "DM Mono", monospace';
  batCtx.fillText('Li-ion 00', 165, 355);

  // 3. CE & UKCA Marks
  batCtx.font = '800 24px "DM Mono", monospace';
  batCtx.fillText('CE  UKCA', 270, 358);
  batCtx.fillText('UL 1642', 400, 358);

  // Warnings in crisp typography
  batCtx.fillStyle = '#A0A4B0';
  batCtx.font = '400 13px "DM Mono", monospace';
  batCtx.fillText('WARNING: Burn hazard. Do not disassemble, crush, heat', 40, 590);
  batCtx.fillText('above 60°C (140°F), or incinerate. Replace only with', 40, 615);
  batCtx.fillText('genuine DATA authorized replacement pack.', 40, 640);
  batCtx.fillText('CAUTION: Dispose of used batteries according to laws.', 40, 675);

  // Serial Barcode
  batCtx.fillStyle = '#FFFFFF';
  const barX = 40;
  const barY = 740;
  const barH = 50;
  for (let i = 0; i < 430; i += 6) {
    const w = ((i * 7 + 13) % 4 === 0) ? 3 : 1.5;
    batCtx.fillRect(barX + i, barY, w, barH);
  }
  batCtx.font = '600 14px "DM Mono", monospace';
  batCtx.fillText('SN: DT-2026-LHR-98441-A', 40, 815);

  // Pull Tab arrows at bottom
  batCtx.fillStyle = '#16A34A';
  batCtx.font = '800 18px "DM Mono", monospace';
  batCtx.textAlign = 'center';
  batCtx.fillText('▲▲ PULL TO RELEASE / ZIEHEN ▲▲', 256, 940);
  batCtx.textAlign = 'left';

  const batteryTexture = new THREE.CanvasTexture(batCanvas);
  batteryTexture.colorSpace = THREE.SRGBColorSpace;

  // E. Camera Lens Elements Texture (512x512)
  const lensCanvas = document.createElement('canvas');
  lensCanvas.width = 512;
  lensCanvas.height = 512;
  const lCtx = lensCanvas.getContext('2d');

  // Deep optical black core
  lCtx.fillStyle = '#030406';
  lCtx.fillRect(0, 0, 512, 512);

  // Concentric antireflective optical coating rings
  const lensGrad = lCtx.createRadialGradient(256, 256, 20, 256, 256, 250);
  lensGrad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');  // cyan core
  lensGrad.addColorStop(0.35, 'rgba(168, 85, 247, 0.35)'); // magenta/violet anti-reflective glare
  lensGrad.addColorStop(0.7, 'rgba(16, 185, 129, 0.25)'); // emerald antireflection
  lensGrad.addColorStop(1, 'rgba(2, 6, 23, 0.95)');
  lCtx.fillStyle = lensGrad;
  lCtx.beginPath();
  lCtx.arc(256, 256, 250, 0, Math.PI * 2);
  lCtx.fill();

  // Aperture iris blades (6-sided mechanical diaphragm)
  lCtx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  lCtx.lineWidth = 2;
  for (let a = 0; a < 6; a++) {
    const ang = (a * Math.PI) / 3;
    lCtx.beginPath();
    lCtx.arc(256 + Math.cos(ang) * 90, 256 + Math.sin(ang) * 90, 100, ang, ang + Math.PI);
    lCtx.stroke();
  }

  // Laser engraved bezel ring text
  lCtx.fillStyle = '#D1D5DB';
  lCtx.font = '700 16px "DM Mono", monospace';
  lCtx.textAlign = 'center';
  lCtx.fillText('DATA OPTICS · 50MP 1/1.28" · 24MM F/1.78 · OIS', 256, 32);
  lCtx.fillText('SAPPHIRE CRYSTAL · 5X TELEPHOTO', 256, 492);

  const cameraLensTexture = new THREE.CanvasTexture(lensCanvas);
  cameraLensTexture.colorSpace = THREE.SRGBColorSpace;

  // F. Shield Can Micro-Perforations Bump Map (128x128)
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = 128;
  bumpCanvas.height = 128;
  const bumpCtx = bumpCanvas.getContext('2d');
  bumpCtx.fillStyle = '#808080';
  bumpCtx.fillRect(0, 0, 128, 128);
  bumpCtx.fillStyle = '#101010';
  for (let x = 6; x < 128; x += 10) {
    for (let y = 6; y < 128; y += 10) {
      bumpCtx.beginPath();
      bumpCtx.arc(x, y, 2.0, 0, Math.PI * 2);
      bumpCtx.fill();
    }
  }
  const shieldBumpTexture = new THREE.CanvasTexture(bumpCanvas);
  shieldBumpTexture.wrapS = THREE.RepeatWrapping;
  shieldBumpTexture.wrapT = THREE.RepeatWrapping;
  shieldBumpTexture.repeat.set(4, 4);

  return {
    brushedTexture,
    pcbTexture,
    socTexture,
    batteryTexture,
    cameraLensTexture,
    shieldBumpTexture,
    dispose() {
      brushedTexture.dispose();
      pcbTexture.dispose();
      socTexture.dispose();
      batteryTexture.dispose();
      cameraLensTexture.dispose();
      shieldBumpTexture.dispose();
    },
  };
}

/**
 * 2. Dynamic Flex Ribbon Class
 */
export class FlexRibbon {
  constructor({ width = 0.04, segments = 24, color = 0xC8791F }) {
    this.width = width;
    this.segments = segments;

    this.material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.45,
      metalness: 0.15,
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
 * 3. Archimedean Spiral Copper Wireless Coil & NFC Loop
 */
class SpiralCurve extends THREE.Curve {
  constructor(turns = 9, innerRadius = 0.045, outerRadius = 0.195) {
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
  const spiralCurve = new SpiralCurve(9, 0.045, 0.195);
  const tubularSegments = isMobile ? 80 : 160;
  const radialSegments = isMobile ? 4 : 6;
  const coilGeom = new THREE.TubeGeometry(spiralCurve, tubularSegments, 0.0042, radialSegments, false);
  const copperMat = new THREE.MeshStandardMaterial({
    color: 0xC87533, // High-polish copper
    metalness: 1.0,
    roughness: 0.22,
  });
  const coilMesh = new THREE.Mesh(coilGeom, copperMat);
  coilMesh.position.set(0, 0, 0.003);
  coilGroup.add(coilMesh);

  // Outer NFC antenna loop
  const nfcGeom = new THREE.RingGeometry(0.205, 0.218, isMobile ? 32 : 48);
  const nfcMat = new THREE.MeshStandardMaterial({
    color: 0xC87533,
    metalness: 1.0,
    roughness: 0.25,
    side: THREE.DoubleSide,
  });
  const nfcMesh = new THREE.Mesh(nfcGeom, nfcMat);
  nfcMesh.position.set(0, 0, 0.002);
  coilGroup.add(nfcMesh);

  return coilGroup;
}

/**
 * 4. Instanced Phillips Screws
 */
export function createInstancedScrews(positions, isMobile = false) {
  const count = positions.length;
  const headGeom = new THREE.CylinderGeometry(0.016, 0.016, 0.008, isMobile ? 8 : 12);
  headGeom.rotateX(Math.PI / 2);
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xB8BAC2,
    metalness: 1.0,
    roughness: 0.30,
  });

  const instancedMesh = new THREE.InstancedMesh(headGeom, headMat, count);
  instancedMesh.name = 'instancedScrews';

  const dummy = new THREE.Object3D();
  positions.forEach((pos, i) => {
    dummy.position.set(pos.x, pos.y, pos.z);
    dummy.rotation.set(0, 0, (i * 0.5) % Math.PI);
    dummy.updateMatrix();
    instancedMesh.setMatrixAt(i, dummy.matrix);
  });
  instancedMesh.instanceMatrix.needsUpdate = true;

  return instancedMesh;
}

/**
 * 5. Workshop Tools: Spudger Pry Tool & Precision Screwdriver
 */
export function createWorkshopTools() {
  const toolsGroup = new THREE.Group();
  toolsGroup.name = 'workshopTools';
  toolsGroup.visible = false;

  const spudgerGroup = new THREE.Group();
  spudgerGroup.name = 'spudger';

  const sBodyGeom = new THREE.BoxGeometry(0.024, 0.38, 0.008);
  const sMat = new THREE.MeshStandardMaterial({
    color: 0x141517,
    roughness: 0.75,
    metalness: 0.1,
  });
  const sBodyMesh = new THREE.Mesh(sBodyGeom, sMat);

  const sTipGeom = new THREE.BoxGeometry(0.024, 0.06, 0.003);
  const sTipMesh = new THREE.Mesh(sTipGeom, sMat);
  sTipMesh.position.set(0, -0.21, -0.002);

  spudgerGroup.add(sBodyMesh);
  spudgerGroup.add(sTipMesh);
  spudgerGroup.position.set(-0.8, -0.5, 0);
  toolsGroup.add(spudgerGroup);

  const driverGroup = new THREE.Group();
  driverGroup.name = 'screwdriver';

  const handleGeom = new THREE.CylinderGeometry(0.024, 0.024, 0.42, 24);
  const handleMat = new THREE.MeshStandardMaterial({
    color: 0x484B52,
    metalness: 0.85,
    roughness: 0.42,
  });
  const handleMesh = new THREE.Mesh(handleGeom, handleMat);

  const capGeom = new THREE.CylinderGeometry(0.026, 0.026, 0.04, 24);
  const capMat = new THREE.MeshStandardMaterial({ color: 0x222326, roughness: 0.6 });
  const capMesh = new THREE.Mesh(capGeom, capMat);
  capMesh.position.set(0, 0.22, 0);

  const shaftGeom = new THREE.CylinderGeometry(0.007, 0.007, 0.26, 12);
  const shaftMat = new THREE.MeshStandardMaterial({
    color: 0xB5B9C2,
    metalness: 1.0,
    roughness: 0.25,
  });
  const shaftMesh = new THREE.Mesh(shaftGeom, shaftMat);
  shaftMesh.position.set(0, -0.32, 0);

  const tipGeom = new THREE.BoxGeometry(0.009, 0.025, 0.009);
  const tipMesh = new THREE.Mesh(tipGeom, shaftMat);
  tipMesh.position.set(0, -0.45, 0);

  driverGroup.add(handleMesh);
  driverGroup.add(capMesh);
  driverGroup.add(shaftMesh);
  driverGroup.add(tipMesh);
  driverGroup.position.set(0.8, 0.6, 0.5);
  toolsGroup.add(driverGroup);

  return {
    toolsGroup,
    spudgerGroup,
    driverGroup,
  };
}
