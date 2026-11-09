import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  createProceduralTextures,
  createWirelessCoil,
  createInstancedScrews,
  createWorkshopTools,
  FlexRibbon,
} from './teardown-parts.js';

/**
 * Creates a thin accent outline mesh on geometries
 */
function addEdgeOutline(geometry, parentGroup) {
  const edgesGeom = new THREE.EdgesGeometry(geometry, 25);
  const edgesMat = new THREE.LineBasicMaterial({
    color: 0x16A34A,
    transparent: true,
    opacity: 0.55,
  });
  const edgesMesh = new THREE.LineSegments(edgesGeom, edgesMat);
  edgesMesh.name = 'edgeOutline';
  parentGroup.add(edgesMesh);
  return edgesMesh;
}

/**
 * Procedural Phone Component (TEARDOWN.md Part T1)
 * Real Anatomy Layer Stack (outermost to innermost):
 * 1. Back cover (glass) + adhesive strip ring
 * 2. Cover plate (dark plastic, 12 Phillips screws) + copper wireless charging coil & NFC loop
 * 3. Internals:
 *    - Board (PCB, 3 shield cans, 10-12 chips, "DATA" laser etch, 4 connectors, 6 screws)
 *    - Camera unit (raised plate, 3 lens barrels, rings, domes)
 *    - Battery (rounded slab, label, 2 white stretch pull tabs, gold connector)
 *    - Bottom assembly (sub-board, USB-C port, speaker grille, vibration motor)
 *    - Amber flex ribbons joining board-battery, board-port, board-display, plate-board
 * 4. Midframe (aluminium frame, brushed procedural roughness map, antenna split lines)
 * 5. Display (OLED front with lock screen, graphite film, copper tape strip, flex tail)
 * 6. Workshop Tools (spudger pry tool and precision Phillips screwdriver)
 */
export function createPhone({ isMobile = false } = {}) {
  const phoneGroup = new THREE.Group();
  phoneGroup.name = 'phoneRoot';

  // Inner model group rotated by Math.PI so front of phone faces +Z by default
  const innerGroup = new THREE.Group();
  innerGroup.name = 'phoneInner';
  innerGroup.rotation.y = Math.PI;
  phoneGroup.add(innerGroup);

  // --- PROCEDURAL TEXTURES ---
  const textures = createProceduralTextures(isMobile);

  // --- SCREEN CANVAS TEXTURE (512 x 1056) ---
  const screenCanvas = document.createElement('canvas');
  screenCanvas.width = 512;
  screenCanvas.height = 1056;
  const ctx = screenCanvas.getContext('2d');
  const screenTexture = new THREE.CanvasTexture(screenCanvas);
  screenTexture.colorSpace = THREE.SRGBColorSpace;

  const timeFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Karachi',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  let currentScreenState = 'lock';
  let currentCheckProgress = -1;
  let lastDrawnMinute = -1;

  function renderScreenState(state, checkProgress = 1) {
    if (state === 'fixed') {
      const roundedCp = Math.round(checkProgress * 40) / 40;
      if (currentScreenState === 'fixed' && Math.abs(currentCheckProgress - roundedCp) < 0.01) {
        return;
      }
      currentCheckProgress = roundedCp;
    } else if (state === 'charge') {
      const roundedPct = Math.round(checkProgress || 12);
      if (currentScreenState === 'charge' && currentCheckProgress === roundedPct) {
        return;
      }
      currentCheckProgress = roundedPct;
    } else if (state === 'wifi') {
      const roundedSpeed = Math.round(checkProgress || 50);
      if (currentScreenState === 'wifi' && currentCheckProgress === roundedSpeed) {
        return;
      }
      currentCheckProgress = roundedSpeed;
    } else if (state === currentScreenState && state !== 'lock') {
      return;
    }
    currentScreenState = state;
    ctx.clearRect(0, 0, 512, 1056);

    if (state === 'off') {
      ctx.fillStyle = '#060709';
      ctx.fillRect(0, 0, 512, 1056);
    } else if (state === 'boot') {
      ctx.fillStyle = '#060709';
      ctx.fillRect(0, 0, 512, 1056);
      ctx.fillStyle = '#F2EFE8';
      ctx.font = '800 68px "Bricolage Grotesque", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('DATA', 256, 520);
      ctx.fillStyle = '#C8FF2E';
      ctx.beginPath();
      ctx.arc(365, 475, 7, 0, Math.PI * 2);
      ctx.fill();
    } else if (state === 'lock') {
      const now = new Date();
      const currentMinute = Math.floor(now.getTime() / 60000);
      if (currentMinute === lastDrawnMinute && currentScreenState === 'lock') {
        return;
      }
      lastDrawnMinute = currentMinute;

      const grad = ctx.createRadialGradient(256, 380, 40, 256, 420, 440);
      grad.addColorStop(0, '#546A94');
      grad.addColorStop(0.30, '#3E4E6E');
      grad.addColorStop(0.60, '#262F44');
      grad.addColorStop(0.82, '#161A26');
      grad.addColorStop(1, '#0B0D12');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 1056);

      // Subtle top speaker notch & status bar
      ctx.fillStyle = '#8C8A84';
      ctx.font = '500 18px "DM Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('DATA MOBILE', 42, 68);
      ctx.textAlign = 'right';
      ctx.fillText('100%', 470, 68);

      const timeParts = timeFormatter.formatToParts(now);
      const hours = timeParts.find((p) => p.type === 'hour')?.value || '19';
      const minutes = timeParts.find((p) => p.type === 'minute')?.value || '45';
      const timeStr = `${hours}:${minutes}`;

      ctx.fillStyle = '#F2EFE8';
      ctx.font = '800 110px "Bricolage Grotesque", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(timeStr, 256, 320);

      const dateStr = dateFormatter.format(now);
      ctx.fillStyle = '#C8FF2E';
      ctx.font = '500 22px "DM Mono", monospace';
      ctx.fillText(dateStr.toUpperCase(), 256, 375);

      // Bottom unlock pill
      ctx.strokeStyle = 'rgba(242, 239, 232, 0.4)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(196, 980, 120, 6, 3);
      ctx.stroke();
    } else if (state === 'fixed') {
      const grad = ctx.createRadialGradient(256, 420, 40, 256, 440, 440);
      grad.addColorStop(0, '#546A94');
      grad.addColorStop(0.30, '#3E4E6E');
      grad.addColorStop(0.60, '#262F44');
      grad.addColorStop(0.82, '#161A26');
      grad.addColorStop(1, '#0B0D12');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 1056);

      // Check mark badge / stroke (U5 Item 1)
      const cp = Math.max(0, Math.min(1, checkProgress !== undefined ? checkProgress : 1));

      // Draw glowing background ring
      ctx.save();
      ctx.strokeStyle = 'rgba(200, 255, 46, 0.25)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(256, 420, 52, 0, Math.PI * 2);
      ctx.stroke();

      // Draw check mark stroke-by-stroke
      if (cp > 0.001) {
        ctx.strokeStyle = '#C8FF2E';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const p1 = { x: 226, y: 418 };
        const p2 = { x: 248, y: 442 };
        const p3 = { x: 290, y: 396 };

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);

        if (cp <= 0.35) {
          const t = cp / 0.35;
          ctx.lineTo(p1.x + (p2.x - p1.x) * t, p1.y + (p2.y - p1.y) * t);
        } else {
          ctx.lineTo(p2.x, p2.y);
          const t = (cp - 0.35) / 0.65;
          ctx.lineTo(p2.x + (p3.x - p2.x) * t, p2.y + (p3.y - p2.y) * t);
        }
        ctx.stroke();
      }
      ctx.restore();

      // "Fixed." title
      ctx.fillStyle = '#F2EFE8';
      ctx.font = '800 76px "Bricolage Grotesque", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Fixed.', 256, 540);

      // Subline
      ctx.fillStyle = '#C8FF2E';
      ctx.font = '500 20px "DM Mono", monospace';
      ctx.fillText('MOST REPAIRS · SAME DAY', 256, 595);
    } else if (state === 'charge') {
      const grad = ctx.createRadialGradient(256, 420, 20, 256, 420, 340);
      grad.addColorStop(0, '#3A4864');
      grad.addColorStop(0.35, '#222838');
      grad.addColorStop(0.70, '#141720');
      grad.addColorStop(1, '#0C0D12');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 1056);

      const pct = Math.max(12, Math.min(100, Math.round(checkProgress || 12)));

      // Battery Outline Box (center: 256, 380)
      ctx.strokeStyle = '#8C8A84';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.roundRect(176, 320, 160, 90, 16);
      ctx.stroke();

      // Battery positive terminal nub
      ctx.fillStyle = '#8C8A84';
      ctx.beginPath();
      ctx.roundRect(338, 345, 12, 40, [0, 6, 6, 0]);
      ctx.fill();

      // Battery Fill Bar (based on pct)
      const fillW = Math.max(8, ((pct - 12) / 88) * 144);
      ctx.fillStyle = '#C8FF2E';
      ctx.beginPath();
      ctx.roundRect(184, 328, fillW, 74, 10);
      ctx.fill();

      // Bolt icon
      ctx.fillStyle = '#F2EFE8';
      ctx.beginPath();
      ctx.moveTo(260, 480);
      ctx.lineTo(240, 530);
      ctx.lineTo(256, 530);
      ctx.lineTo(248, 570);
      ctx.lineTo(276, 516);
      ctx.lineTo(258, 516);
      ctx.closePath();
      ctx.fill();

      // Percentage Text
      ctx.fillStyle = '#F2EFE8';
      ctx.font = '800 84px "Bricolage Grotesque", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${pct}%`, 256, 680);

      // Subline
      ctx.fillStyle = '#C8FF2E';
      ctx.font = '500 22px "DM Mono", monospace';
      ctx.fillText('FAST CHARGING', 256, 735);
    } else if (state === 'wifi') {
      const grad = ctx.createRadialGradient(256, 420, 20, 256, 420, 340);
      grad.addColorStop(0, '#3A4864');
      grad.addColorStop(0.35, '#222838');
      grad.addColorStop(0.70, '#141720');
      grad.addColorStop(1, '#0C0D12');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 1056);

      const speedVal = Math.round(checkProgress || 50);

      // Top status
      ctx.fillStyle = '#8C8A84';
      ctx.font = '500 18px "DM Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('DATA HOME WIFI', 256, 120);

      // 4 Dynamic WiFi Signal Arcs radiating from center (256, 360)
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      [36, 62, 88, 114].forEach((r) => {
        ctx.strokeStyle = '#C8FF2E';
        ctx.beginPath();
        ctx.arc(256, 360, r, -Math.PI * 0.75, -Math.PI * 0.25);
        ctx.stroke();
      });
      // Center signal dot
      ctx.fillStyle = '#C8FF2E';
      ctx.beginPath();
      ctx.arc(256, 360, 9, 0, Math.PI * 2);
      ctx.fill();

      // Speed Readout
      ctx.fillStyle = '#F2EFE8';
      ctx.font = '800 100px "Bricolage Grotesque", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(speedVal), 256, 540);

      ctx.fillStyle = '#C8FF2E';
      ctx.font = '700 28px "DM Mono", monospace';
      ctx.fillText('MBPS', 256, 595);

      // Plan Subline
      ctx.fillStyle = '#8C8A84';
      ctx.font = '500 20px "DM Mono", monospace';
      ctx.fillText('FAST · ULTRA LOW LATENCY', 256, 660);

      // 4 Stepped Signal Bars (214 to 286)
      for (let b = 0; b < 4; b++) {
        const bh = 14 + b * 10;
        ctx.fillStyle = '#C8FF2E';
        ctx.beginPath();
        ctx.roundRect(214 + b * 22, 760 - bh, 14, bh, 3);
        ctx.fill();
      }
    }

    screenTexture.needsUpdate = true;
  }

  renderScreenState('lock');

  // ===================================================================
  // 1. LAYER 5: DISPLAY / SCREEN (Front-most)
  // OLED panel, graphite film behind it, copper tape strip, flex tail
  // ===================================================================
  const screenGroup = new THREE.Group();
  screenGroup.name = 'screen';

  const screenGeom = new RoundedBoxGeometry(0.68, 1.48, 0.015, 5, 0.06);

  // Front face material: canvas texture, FrontSide only
  const screenFrontMat = new THREE.MeshBasicMaterial({
    map: screenTexture,
    side: THREE.FrontSide,
  });

  // Back face: graphite film (#3A3B40, roughness 0.7)
  const graphiteMat = new THREE.MeshStandardMaterial({
    color: 0x3A3B40,
    roughness: 0.7,
    metalness: 0.2,
    side: THREE.FrontSide,
  });

  // Screen mesh with front display and back graphite panel
  const screenFrontMesh = new THREE.Mesh(screenGeom, screenFrontMat);
  screenFrontMesh.rotation.y = Math.PI; // Face user in -Z
  screenGroup.add(screenFrontMesh);

  // Graphite backing plane
  const graphiteGeom = new RoundedBoxGeometry(0.66, 1.46, 0.003, 3, 0.05);
  const graphiteMesh = new THREE.Mesh(graphiteGeom, graphiteMat);
  graphiteMesh.position.set(0, 0, 0.006);
  screenGroup.add(graphiteMesh);

  // Copper tape strip across display rear
  const copperTapeGeom = new THREE.BoxGeometry(0.55, 0.12, 0.002);
  const copperTapeMat = new THREE.MeshStandardMaterial({
    color: 0xB87333,
    metalness: 1.0,
    roughness: 0.3,
  });
  const copperTapeMesh = new THREE.Mesh(copperTapeGeom, copperTapeMat);
  copperTapeMesh.position.set(0, -0.25, 0.005);
  screenGroup.add(copperTapeMesh);

  const screenOutline = addEdgeOutline(screenGeom, screenGroup);
  innerGroup.add(screenGroup);

  // ===================================================================
  // 2. LAYER 4: MIDFRAME
  // Natural Titanium frame #DCE0E6, metalness 0.95, roughness 0.28
  // ===================================================================
  const frameGroup = new THREE.Group();
  frameGroup.name = 'frame';

  const frameGeom = new RoundedBoxGeometry(0.72, 1.52, 0.08, 5, 0.08);
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0xDCE0E6,
    metalness: 0.95,
    roughness: 0.28,
    roughnessMap: textures.brushedTexture,
  });
  const frameMesh = new THREE.Mesh(frameGeom, frameMat);
  frameGroup.add(frameMesh);

  // Antenna split lines (merged geometry)
  const antennaMat = new THREE.MeshBasicMaterial({ color: 0x8C929E });
  const antGeom1 = new THREE.BoxGeometry(0.01, 0.01, 0.082);
  antGeom1.translate(-0.358, 0.45, 0);
  const antGeom2 = new THREE.BoxGeometry(0.01, 0.01, 0.082);
  antGeom2.translate(0.358, 0.45, 0);
  const mergedAntGeom = BufferGeometryUtils.mergeGeometries([antGeom1, antGeom2]);
  const antennaMesh = new THREE.Mesh(mergedAntGeom, antennaMat);
  frameGroup.add(antennaMesh);

  const frameOutline = addEdgeOutline(frameGeom, frameGroup);
  innerGroup.add(frameGroup);

  // ===================================================================
  // 3. LAYER 3: INTERNALS (Bottom Assembly, Battery, Board, Camera, Ribbons)
  // ===================================================================

  // A. Bottom Assembly / USB-C Port & Taptic Engine
  const portGroup = new THREE.Group();
  portGroup.name = 'port';

  // Sub-board PCB
  const subBoardGeom = new RoundedBoxGeometry(0.64, 0.22, 0.012, 3, 0.03);
  const subBoardMat = new THREE.MeshStandardMaterial({
    color: 0x0D1C13,
    roughness: 0.55,
    map: textures.pcbTexture,
  });
  const subBoardMesh = new THREE.Mesh(subBoardGeom, subBoardMat);
  subBoardMesh.position.set(0, -0.62, 0);
  portGroup.add(subBoardMesh);

  // Precision CNC Stainless Steel USB-C Shell
  const portShellGeom = new RoundedBoxGeometry(0.125, 0.038, 0.048, 3, 0.012);
  const portShellMat = new THREE.MeshStandardMaterial({
    color: 0xCACDD6,
    metalness: 1.0,
    roughness: 0.22,
  });
  const portShellMesh = new THREE.Mesh(portShellGeom, portShellMat);
  portShellMesh.position.set(0, -0.74, 0);
  portGroup.add(portShellMesh);

  // Waterproof Blue Silicone O-Ring Gasket around port collar
  const gasketGeom = new RoundedBoxGeometry(0.132, 0.042, 0.008, 2, 0.01);
  const gasketMat = new THREE.MeshStandardMaterial({
    color: 0x0284C7, // Waterproof electric blue silicone
    roughness: 0.6,
    metalness: 0.05,
  });
  const gasketMesh = new THREE.Mesh(gasketGeom, gasketMat);
  gasketMesh.position.set(0, -0.725, 0);
  portGroup.add(gasketMesh);

  // USB-C Internal 24-pin Gold Reversible Contact Tongue
  const tongueGeom = new THREE.BoxGeometry(0.082, 0.008, 0.032);
  const tongueMat = new THREE.MeshStandardMaterial({
    color: 0xD4AF37, // 24K Gold contact pins
    metalness: 1.0,
    roughness: 0.20,
  });
  const tongueMesh = new THREE.Mesh(tongueGeom, tongueMat);
  tongueMesh.position.set(0, -0.748, 0);
  portGroup.add(tongueMesh);

  // Dark inner receptacle cavity
  const slotGeom = new THREE.BoxGeometry(0.095, 0.016, 0.034);
  const slotMat = new THREE.MeshBasicMaterial({ color: 0x020304 });
  const slotMesh = new THREE.Mesh(slotGeom, slotMat);
  slotMesh.position.set(0, -0.755, 0);
  portGroup.add(slotMesh);

  // Taptic Engine (Linear Resonant Vibration Actuator)
  const tapticGeom = new RoundedBoxGeometry(0.18, 0.11, 0.022, 3, 0.018);
  const tapticMat = new THREE.MeshStandardMaterial({
    color: 0xA8ABB4,
    metalness: 0.95,
    roughness: 0.28,
    roughnessMap: textures.brushedTexture,
  });
  const tapticMesh = new THREE.Mesh(tapticGeom, tapticMat);
  tapticMesh.position.set(-0.18, -0.61, 0.010);
  portGroup.add(tapticMesh);

  // Taptic laser-engraved logo plate
  const tapticPlateGeom = new THREE.PlaneGeometry(0.14, 0.08);
  const tapticPlateMat = new THREE.MeshStandardMaterial({
    color: 0x8C8F98,
    metalness: 0.9,
    roughness: 0.35,
  });
  const tapticPlate = new THREE.Mesh(tapticPlateGeom, tapticPlateMat);
  tapticPlate.position.set(-0.18, -0.61, 0.022);
  portGroup.add(tapticPlate);

  // MEMS Microphone & Speaker Acoustic Chamber
  const spkGeom = new RoundedBoxGeometry(0.14, 0.09, 0.018, 3, 0.014);
  const spkMat = new THREE.MeshStandardMaterial({ color: 0x18191D, roughness: 0.75 });
  const spkMesh = new THREE.Mesh(spkGeom, spkMat);
  spkMesh.position.set(0.18, -0.61, 0.008);
  portGroup.add(spkMesh);

  // Coaxial RF Antenna Cables running along side edge (blue & black shielded cables)
  const coaxCurve1 = new THREE.LineCurve3(new THREE.Vector3(0.28, -0.70, 0.012), new THREE.Vector3(0.28, -0.48, 0.012));
  const coaxGeom1 = new THREE.TubeGeometry(coaxCurve1, 16, 0.0035, 6, false);
  const coaxMat1 = new THREE.MeshStandardMaterial({ color: 0x2563EB, roughness: 0.45 }); // Blue RF cable
  const coaxMesh1 = new THREE.Mesh(coaxGeom1, coaxMat1);
  portGroup.add(coaxMesh1);

  const coaxCurve2 = new THREE.LineCurve3(new THREE.Vector3(0.29, -0.70, 0.012), new THREE.Vector3(0.29, -0.48, 0.012));
  const coaxGeom2 = new THREE.TubeGeometry(coaxCurve2, 16, 0.0035, 6, false);
  const coaxMat2 = new THREE.MeshStandardMaterial({ color: 0x0F172A, roughness: 0.45 }); // Black RF cable
  const coaxMesh2 = new THREE.Mesh(coaxGeom2, coaxMat2);
  portGroup.add(coaxMesh2);

  const portOutline = addEdgeOutline(subBoardGeom, portGroup);
  innerGroup.add(portGroup);

  // B. Flagship Battery (Pouch Cell with BMS, Pull Tabs & Regulatory Markings)
  const batteryGroup = new THREE.Group();
  batteryGroup.name = 'battery';

  // Main Pouch Cell with vacuum-crimped perimeter lip
  const batteryGeom = new RoundedBoxGeometry(0.33, 0.93, 0.026, 5, 0.025);
  const batteryMat = new THREE.MeshStandardMaterial({
    color: 0x141518,
    roughness: 0.65,
    metalness: 0.15,
    map: textures.batteryTexture,
  });
  const batteryMesh = new THREE.Mesh(batteryGeom, batteryMat);
  batteryGroup.add(batteryMesh);

  // Top BMS (Battery Management System) Protection Board wrapped in amber Kapton tape
  const bmsGeom = new RoundedBoxGeometry(0.31, 0.07, 0.018, 3, 0.01);
  const bmsMat = new THREE.MeshStandardMaterial({
    color: 0xD9822B, // Translucent amber Kapton polyimide
    roughness: 0.35,
    metalness: 0.10,
    transparent: true,
    opacity: 0.92,
  });
  const bmsMesh = new THREE.Mesh(bmsGeom, bmsMat);
  bmsMesh.position.set(0, 0.44, 0.005);
  batteryGroup.add(bmsMesh);

  // Dual Laser-Welded Nickel Foil Tabs connecting pouch to BMS
  const nickelMat = new THREE.MeshStandardMaterial({ color: 0xD1D5DB, metalness: 1.0, roughness: 0.25 });
  const nTab1 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 0.004), nickelMat);
  nTab1.position.set(-0.08, 0.46, 0.014);
  const nTab2 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 0.004), nickelMat);
  nTab2.position.set(0.08, 0.46, 0.014);
  batteryGroup.add(nTab1);
  batteryGroup.add(nTab2);

  // Gold Spring Connector Tab (#D4AF37) at top
  const batConnGeom = new THREE.BoxGeometry(0.045, 0.055, 0.008);
  const batConnMat = new THREE.MeshStandardMaterial({
    color: 0xD4AF37,
    metalness: 1.0,
    roughness: 0.22,
  });
  const batConnMesh = new THREE.Mesh(batConnGeom, batConnMat);
  batConnMesh.position.set(-0.10, 0.495, 0.010);
  batteryGroup.add(batConnMesh);

  // Dual Stretch-Release Pull Tabs at base with directional chevrons
  const pullTabMat = new THREE.MeshStandardMaterial({ color: 0x0F172A, roughness: 0.85 });
  const tabGeom1 = new THREE.BoxGeometry(0.07, 0.09, 0.004);
  tabGeom1.translate(-0.065, -0.495, 0.005);
  const tabGeom2 = new THREE.BoxGeometry(0.07, 0.09, 0.004);
  tabGeom2.translate(0.065, -0.495, 0.005);
  const mergedTabs = BufferGeometryUtils.mergeGeometries([tabGeom1, tabGeom2]);
  const pullTabsMesh = new THREE.Mesh(mergedTabs, pullTabMat);
  batteryGroup.add(pullTabsMesh);

  const batteryOutline = addEdgeOutline(batteryGeom, batteryGroup);
  batteryGroup.position.set(-0.14, -0.06, 0);
  innerGroup.add(batteryGroup);

  // C. Hyper-Realistic Main Logic Board (PCB, Processor SoC, 40+ SMD passives, Cans)
  const boardGroup = new THREE.Group();
  boardGroup.name = 'board';

  // Stepped Multi-layer Logic Board Substrate
  const boardGeom = new RoundedBoxGeometry(0.66, 0.58, 0.014, 4, 0.04);
  const boardMat = new THREE.MeshStandardMaterial({
    color: 0x0D1C13,
    roughness: 0.50,
    metalness: 0.10,
    map: textures.pcbTexture,
  });
  const boardMesh = new THREE.Mesh(boardGeom, boardMat);
  boardGroup.add(boardMesh);

  // Copper Vapor Chamber Heat Pipe extending underneath the SoC & Board
  const vaporPipeGeom = new THREE.BoxGeometry(0.48, 0.22, 0.005);
  const vaporPipeMat = new THREE.MeshStandardMaterial({
    color: 0xC87533, // High-polish stamped copper
    metalness: 1.0,
    roughness: 0.22,
  });
  const vaporPipeMesh = new THREE.Mesh(vaporPipeGeom, vaporPipeMat);
  vaporPipeMesh.position.set(0.04, -0.05, -0.008);
  boardGroup.add(vaporPipeMesh);

  // Main Processor SoC BGA Chip (DATA A18 PRO BIONIC 3nm)
  const socGeom = new THREE.BoxGeometry(0.125, 0.125, 0.022);
  const socMat = new THREE.MeshStandardMaterial({
    color: 0x0A0B0E,
    metalness: 0.40,
    roughness: 0.18,
    map: textures.socTexture,
  });
  const socMesh = new THREE.Mesh(socGeom, socMat);
  socMesh.position.set(-0.15, -0.06, 0.016);
  boardGroup.add(socMesh);

  // NAND Flash Storage Chip (256GB NVMe)
  const nandGeom = new THREE.BoxGeometry(0.11, 0.09, 0.018);
  const nandMat = new THREE.MeshStandardMaterial({
    color: 0x111216,
    metalness: 0.35,
    roughness: 0.28,
  });
  const nandMesh = new THREE.Mesh(nandGeom, nandMat);
  nandMesh.position.set(0.02, -0.06, 0.014);
  boardGroup.add(nandMesh);

  // 3 Stamped Stainless Steel RF/EMI Shield Cans with Micro-Perforations
  const canMat = new THREE.MeshStandardMaterial({
    color: 0xA8ABB4,
    metalness: 1.0,
    roughness: 0.32,
    bumpMap: textures.shieldBumpTexture,
    bumpScale: 0.006,
  });

  const can1Geom = new THREE.BoxGeometry(0.24, 0.22, 0.018);
  can1Geom.translate(0.14, 0.12, 0.013);
  const can2Geom = new THREE.BoxGeometry(0.18, 0.16, 0.016);
  can2Geom.translate(-0.14, 0.14, 0.012);
  const can3Geom = new THREE.BoxGeometry(0.28, 0.14, 0.014);
  can3Geom.translate(0.10, -0.15, 0.011);
  const mergedCansGeom = BufferGeometryUtils.mergeGeometries([can1Geom, can2Geom, can3Geom]);
  const cansMesh = new THREE.Mesh(mergedCansGeom, canMat);
  boardGroup.add(cansMesh);

  // 35+ Physical 3D SMD Micro-Components (Capacitors, Resistors, Inductors) - Merged
  const smdCapMat = new THREE.MeshStandardMaterial({
    color: 0xC4A46C, // Tan/yellow ceramic capacitor package
    metalness: 0.15,
    roughness: 0.35,
  });

  const smdPositions = [
    // Caps around SoC
    { x: -0.23, y: -0.01, w: 0.016, h: 0.024, d: 0.012 },
    { x: -0.23, y: -0.05, w: 0.016, h: 0.024, d: 0.012 },
    { x: -0.23, y: -0.09, w: 0.016, h: 0.024, d: 0.012 },
    { x: -0.23, y: -0.13, w: 0.016, h: 0.024, d: 0.012 },
    { x: -0.15, y: -0.14, w: 0.024, h: 0.016, d: 0.012 },
    { x: -0.11, y: -0.14, w: 0.024, h: 0.016, d: 0.012 },
    { x: -0.07, y: -0.14, w: 0.024, h: 0.016, d: 0.012 },
    // Caps around NAND
    { x: 0.02, y: -0.13, w: 0.020, h: 0.014, d: 0.011 },
    { x: 0.06, y: -0.13, w: 0.020, h: 0.014, d: 0.011 },
    { x: 0.09, y: -0.06, w: 0.014, h: 0.022, d: 0.011 },
    { x: 0.09, y: -0.02, w: 0.014, h: 0.022, d: 0.011 },
    // Power inductors (ferrite chokes)
    { x: -0.05, y: 0.02, w: 0.032, h: 0.032, d: 0.016 },
    { x: -0.01, y: 0.02, w: 0.032, h: 0.032, d: 0.016 },
    { x: 0.03,  y: 0.02, w: 0.032, h: 0.032, d: 0.016 },
    { x: 0.22,  y: -0.02, w: 0.028, h: 0.028, d: 0.015 },
    { x: 0.22,  y: -0.06, w: 0.028, h: 0.028, d: 0.015 },
  ];

  const smdGeoms = smdPositions.map((p) => {
    const g = new THREE.BoxGeometry(p.w, p.h, p.d);
    g.translate(p.x, p.y, p.d / 2 + 0.007);
    return g;
  });
  const mergedSmdGeom = BufferGeometryUtils.mergeGeometries(smdGeoms);
  const smdMesh = new THREE.Mesh(mergedSmdGeom, smdCapMat);
  boardGroup.add(smdMesh);

  // 4 Board-to-Board FPC Micro-Connectors with Gold Pins
  const connBlockMat = new THREE.MeshStandardMaterial({ color: 0x18191C, roughness: 0.65 });
  const cb1Geom = new THREE.BoxGeometry(0.055, 0.024, 0.014);
  cb1Geom.translate(-0.25, -0.22, 0.012);
  const cb2Geom = new THREE.BoxGeometry(0.055, 0.024, 0.014);
  cb2Geom.translate(0.0, -0.24, 0.012);
  const cb3Geom = new THREE.BoxGeometry(0.055, 0.024, 0.014);
  cb3Geom.translate(0.24, 0.24, 0.012);
  const cb4Geom = new THREE.BoxGeometry(0.055, 0.024, 0.014);
  cb4Geom.translate(-0.24, 0.24, 0.012);
  const mergedCbGeom = BufferGeometryUtils.mergeGeometries([cb1Geom, cb2Geom, cb3Geom, cb4Geom]);
  const cbMesh = new THREE.Mesh(mergedCbGeom, connBlockMat);
  boardGroup.add(cbMesh);

  // 6 Phillips screws on board
  const boardScrewPositions = [
    { x: -0.28, y: 0.22, z: 0.014 },
    { x: 0.28, y: 0.22, z: 0.014 },
    { x: -0.28, y: -0.22, z: 0.014 },
    { x: 0.28, y: -0.22, z: 0.014 },
    { x: 0.0, y: 0.24, z: 0.014 },
    { x: -0.06, y: 0.04, z: 0.014 },
  ];
  const boardScrews = createInstancedScrews(boardScrewPositions, isMobile);
  boardGroup.add(boardScrews);

  const boardOutline = addEdgeOutline(boardGeom, boardGroup);
  boardGroup.position.set(0, 0.42, 0);
  innerGroup.add(boardGroup);

  // D. Triple-Lens Pro Camera Unit with OIS Coils & Periscope Prism
  const cameraUnitGroup = new THREE.Group();
  cameraUnitGroup.name = 'cameraUnit';

  // Aerospace Titanium Camera Housing
  const camPlateGeom = new RoundedBoxGeometry(0.29, 0.31, 0.024, 4, 0.04);
  const camPlateMat = new THREE.MeshStandardMaterial({
    color: 0x2A2C32,
    metalness: 0.85,
    roughness: 0.28,
  });
  const camPlateMesh = new THREE.Mesh(camPlateGeom, camPlateMat);
  cameraUnitGroup.add(camPlateMesh);

  // Knurled Lens Rings
  const lensRingMat = new THREE.MeshStandardMaterial({
    color: 0xB5B9C2,
    metalness: 1.0,
    roughness: 0.20,
  });

  const lensCoords = [
    { x: -0.062, y: 0.068 },
    { x: -0.062, y: -0.068 },
    { x: 0.068, y: 0.0 },
  ];

  const ringGeoms = lensCoords.map((lc) => {
    const g = new THREE.TorusGeometry(0.044, 0.007, 14, isMobile ? 18 : 32);
    g.translate(lc.x, lc.y, 0.016);
    return g;
  });
  const mergedRingsGeom = BufferGeometryUtils.mergeGeometries(ringGeoms);
  const ringsMesh = new THREE.Mesh(mergedRingsGeom, lensRingMat);
  cameraUnitGroup.add(ringsMesh);

  // Anti-reflective Coated Sapphire Optics Domes
  const opticsMat = new THREE.MeshStandardMaterial({
    color: 0x020306,
    roughness: 0.04,
    metalness: 0.95,
    map: textures.cameraLensTexture,
  });

  const domeGeoms = lensCoords.map((lc) => {
    const g = new THREE.SphereGeometry(0.040, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    g.translate(lc.x, lc.y, 0.015);
    return g;
  });
  const mergedDomesGeom = BufferGeometryUtils.mergeGeometries(domeGeoms);
  const domesMesh = new THREE.Mesh(mergedDomesGeom, opticsMat);
  cameraUnitGroup.add(domesMesh);

  // Copper OIS Suspension Voice-Coils around Main Lens
  const oisCoilGeom = new THREE.TorusGeometry(0.048, 0.003, 8, 24);
  const oisCoilMat = new THREE.MeshStandardMaterial({
    color: 0xC87533, // Real copper voice coil wire
    metalness: 1.0,
    roughness: 0.22,
  });
  const oisCoilMesh = new THREE.Mesh(oisCoilGeom, oisCoilMat);
  oisCoilMesh.position.set(-0.062, 0.068, 0.012);
  cameraUnitGroup.add(oisCoilMesh);

  // Periscope Prism Rectangular Opening for 5x Telephoto
  const periscopeGeom = new RoundedBoxGeometry(0.055, 0.045, 0.012, 2, 0.008);
  const periscopeMat = new THREE.MeshStandardMaterial({ color: 0x050608, roughness: 0.2, metalness: 0.8 });
  const periscopeMesh = new THREE.Mesh(periscopeGeom, periscopeMat);
  periscopeMesh.position.set(0.068, -0.075, 0.014);
  cameraUnitGroup.add(periscopeMesh);

  // LiDAR Optical Depth Sensor (Matte black sapphire window)
  const lidarGeom = new THREE.CylinderGeometry(0.018, 0.018, 0.006, 16);
  lidarGeom.rotateX(Math.PI / 2);
  const lidarMat = new THREE.MeshStandardMaterial({ color: 0x040508, roughness: 0.08, metalness: 0.9 });
  const lidarMesh = new THREE.Mesh(lidarGeom, lidarMat);
  lidarMesh.position.set(0.068, 0.075, 0.014);
  cameraUnitGroup.add(lidarMesh);

  // Quad True Tone Dual-LED Flash with Fresnel Lens
  const flashGeom = new THREE.CircleGeometry(0.018, 20);
  const flashMat = new THREE.MeshBasicMaterial({ color: 0xFFFBE6 });
  const flashMesh = new THREE.Mesh(flashGeom, flashMat);
  flashMesh.position.set(-0.062, 0.0, 0.015);
  cameraUnitGroup.add(flashMesh);

  const cameraOutline = addEdgeOutline(camPlateGeom, cameraUnitGroup);
  cameraUnitGroup.position.set(-0.18, 0.52, 0);
  innerGroup.add(cameraUnitGroup);

  // ===================================================================
  // 4. LAYER 2: COVER PLATE & WIRELESS COIL
  // Dark plastic plate, 12 Phillips screws, copper wireless charging coil & NFC loop
  // ===================================================================
  const coverPlateGroup = new THREE.Group();
  coverPlateGroup.name = 'coverPlate';

  const plateGeom = new RoundedBoxGeometry(0.68, 1.46, 0.012, 5, 0.05);
  const plateMat = new THREE.MeshStandardMaterial({
    color: 0x18191C,
    roughness: 0.6,
    metalness: 0.1,
  });
  const plateMesh = new THREE.Mesh(plateGeom, plateMat);
  coverPlateGroup.add(plateMesh);

  // Wireless charging copper coil + NFC loop bonded to underside
  const coilGroup = createWirelessCoil(isMobile);
  coilGroup.position.set(0, -0.05, 0.008);
  coverPlateGroup.add(coilGroup);

  // 12 Phillips screws on cover plate
  const plateScrewPositions = [
    { x: -0.28, y: 0.66, z: 0.01 },
    { x: 0.28, y: 0.66, z: 0.01 },
    { x: -0.28, y: 0.32, z: 0.01 },
    { x: 0.28, y: 0.32, z: 0.01 },
    { x: -0.28, y: -0.05, z: 0.01 },
    { x: 0.28, y: -0.05, z: 0.01 },
    { x: -0.28, y: -0.42, z: 0.01 },
    { x: 0.28, y: -0.42, z: 0.01 },
    { x: -0.28, y: -0.66, z: 0.01 },
    { x: 0.28, y: -0.66, z: 0.01 },
    { x: 0.0, y: 0.66, z: 0.01 },
    { x: 0.0, y: -0.66, z: 0.01 },
  ];
  const plateScrews = createInstancedScrews(plateScrewPositions, isMobile);
  coverPlateGroup.add(plateScrews);

  const plateOutline = addEdgeOutline(plateGeom, coverPlateGroup);
  innerGroup.add(coverPlateGroup);

  // ===================================================================
  // 5. LAYER 1: BACK COVER (Glass)
  // Clearcoat glass, inner adhesive strip ring, camera cutout
  // ===================================================================
  const backCoverGroup = new THREE.Group();
  backCoverGroup.name = 'backCover';

  const backCoverGeom = new RoundedBoxGeometry(0.70, 1.50, 0.015, 5, 0.06);

  // White Titanium / Ceramic Silver Back Cover
  let backCoverMat;
  if (!isMobile && THREE.MeshPhysicalMaterial) {
    backCoverMat = new THREE.MeshPhysicalMaterial({
      color: 0xF5F6FA,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      roughness: 0.16,
      metalness: 0.05,
    });
  } else {
    backCoverMat = new THREE.MeshStandardMaterial({
      color: 0xF5F6FA,
      roughness: 0.16,
      metalness: 0.05,
    });
  }

  const backCoverMesh = new THREE.Mesh(backCoverGeom, backCoverMat);
  backCoverGroup.add(backCoverMesh);

  // White Titanium Sculpted Camera Plateau on Back Cover
  const camPlateauGeom = new RoundedBoxGeometry(0.28, 0.28, 0.008, 4, 0.035);
  const camPlateauMat = new THREE.MeshStandardMaterial({
    color: 0xEFF1F5,
    roughness: 0.20,
    metalness: 0.08,
  });
  const camPlateauMesh = new THREE.Mesh(camPlateauGeom, camPlateauMat);
  camPlateauMesh.position.set(-0.18, 0.52, 0.009);
  backCoverGroup.add(camPlateauMesh);

  // Subtle chrome / silver-gloss "DATA" logo on rear glass
  const logoCanvas = document.createElement('canvas');
  logoCanvas.width = 256;
  logoCanvas.height = 128;
  const logoCtx = logoCanvas.getContext('2d');
  logoCtx.fillStyle = '#A0A5B0';
  logoCtx.font = '800 48px "Bricolage Grotesque", sans-serif';
  logoCtx.textAlign = 'center';
  logoCtx.fillText('DATA', 128, 76);
  logoCtx.fillStyle = '#00875A';
  logoCtx.beginPath();
  logoCtx.arc(206, 52, 6, 0, Math.PI * 2);
  logoCtx.fill();

  const logoTexture = new THREE.CanvasTexture(logoCanvas);
  const logoGeom = new THREE.PlaneGeometry(0.22, 0.11);
  const logoMat = new THREE.MeshBasicMaterial({
    map: logoTexture,
    transparent: true,
    opacity: 0.75,
    side: THREE.FrontSide,
  });
  const logoMesh = new THREE.Mesh(logoGeom, logoMat);
  logoMesh.position.set(0, -0.22, 0.008);
  backCoverGroup.add(logoMesh);

  // Adhesive strip ring (#D8D5CC, roughness 0.9) on inner edge
  const adhesiveGeom = new RoundedBoxGeometry(0.68, 1.48, 0.002, 3, 0.05);
  const adhesiveMat = new THREE.MeshStandardMaterial({
    color: 0xD8D5CC,
    roughness: 0.9,
    transparent: true,
    opacity: 0.85,
  });
  const adhesiveMesh = new THREE.Mesh(adhesiveGeom, adhesiveMat);
  adhesiveMesh.position.set(0, 0, -0.008);
  backCoverGroup.add(adhesiveMesh);

  const backCoverOutline = addEdgeOutline(backCoverGeom, backCoverGroup);
  innerGroup.add(backCoverGroup);

  // ===================================================================
  // 6. DYNAMIC FLEX RIBBONS (Kept inert/hidden per visual cleanliness)
  // Ribbons removed from scene to eliminate brown line poking bug
  // ===================================================================
  const ribbons = {
    boardBattery: new FlexRibbon({ width: 0.038, segments: 24 }),
    boardPort: new FlexRibbon({ width: 0.044, segments: 24 }),
    boardDisplay: new FlexRibbon({ width: 0.035, segments: 24 }),
    plateBoard: new FlexRibbon({ width: 0.032, segments: 24 }),
  };
  Object.values(ribbons).forEach((r) => {
    r.group.visible = false;
  });

  // ===================================================================
  // 7. WORKSHOP TOOLS (Hidden per user request: no screwdriver/spudger)
  // ===================================================================
  const tools = createWorkshopTools();
  tools.toolsGroup.visible = false;

  // ===================================================================
  // 8. TWO-LAYER CONTACT SHADOW (UPGRADE.md U4 Item 4)
  // Tight dark core + Wide soft ambient shadow that widens as phone lifts
  // ===================================================================
  // Layer A: Tight Dark Core
  const tightCanvas = document.createElement('canvas');
  tightCanvas.width = 256;
  tightCanvas.height = 256;
  const tCtx = tightCanvas.getContext('2d');
  const tGrad = tCtx.createRadialGradient(128, 128, 8, 128, 128, 100);
  tGrad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
  tGrad.addColorStop(0.35, 'rgba(0, 0, 0, 0.50)');
  tGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.15)');
  tGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  tCtx.fillStyle = tGrad;
  tCtx.fillRect(0, 0, 256, 256);

  const tightTexture = new THREE.CanvasTexture(tightCanvas);
  const tightGeom = new THREE.PlaneGeometry(0.8, 1.4);
  const tightMat = new THREE.MeshBasicMaterial({
    map: tightTexture,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });
  const tightShadowMesh = new THREE.Mesh(tightGeom, tightMat);
  tightShadowMesh.name = 'tightShadow';
  tightShadowMesh.rotation.x = -Math.PI / 2;
  tightShadowMesh.position.set(0, -0.81, 0);
  phoneGroup.add(tightShadowMesh);

  // Layer B: Wide Soft Ambient Shadow
  const wideCanvas = document.createElement('canvas');
  wideCanvas.width = 256;
  wideCanvas.height = 256;
  const wCtx = wideCanvas.getContext('2d');
  const wGrad = wCtx.createRadialGradient(128, 128, 12, 128, 128, 124);
  wGrad.addColorStop(0, 'rgba(0, 0, 0, 0.40)');
  wGrad.addColorStop(0.35, 'rgba(0, 0, 0, 0.22)');
  wGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.06)');
  wGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  wCtx.fillStyle = wGrad;
  wCtx.fillRect(0, 0, 256, 256);

  const wideTexture = new THREE.CanvasTexture(wideCanvas);
  const wideGeom = new THREE.PlaneGeometry(1.6, 2.2);
  const wideMat = new THREE.MeshBasicMaterial({
    map: wideTexture,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const wideShadowMesh = new THREE.Mesh(wideGeom, wideMat);
  wideShadowMesh.name = 'wideShadow';
  wideShadowMesh.rotation.x = -Math.PI / 2;
  wideShadowMesh.position.set(0, -0.815, 0);
  phoneGroup.add(wideShadowMesh);

  // ===================================================================
  // 9. REBUILD EFFECTS: SHOCKWAVE RING & SCREEN FLASH (UPGRADE.md U5)
  // ===================================================================
  // Additive accent ring expanding 0 -> 3 units at contact
  const shockwaveGeom = new THREE.RingGeometry(0.04, 0.12, 64);
  const shockwaveMat = new THREE.MeshBasicMaterial({
    color: 0xC8FF2E,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const shockwaveMesh = new THREE.Mesh(shockwaveGeom, shockwaveMat);
  shockwaveMesh.name = 'shockwaveRing';
  shockwaveMesh.position.set(0, 0, 0.05);
  shockwaveMesh.visible = false;
  innerGroup.add(shockwaveMesh);

  // White flash plane over OLED screen (0.2 opacity flash at contact)
  const screenFlashGeom = new THREE.PlaneGeometry(0.68, 1.48);
  const screenFlashMat = new THREE.MeshBasicMaterial({
    color: 0xFFFFFF,
    transparent: true,
    opacity: 0,
    side: THREE.FrontSide,
    depthWrite: false,
  });
  const screenFlashMesh = new THREE.Mesh(screenFlashGeom, screenFlashMat);
  screenFlashMesh.name = 'screenFlash';
  screenFlashMesh.position.set(0, 0, -0.012);
  screenFlashMesh.visible = false;
  screenGroup.add(screenFlashMesh);

  // ===================================================================
  // REAL ANATOMY POSITIONS (Rest vs Exploded)
  // Ordered strictly according to layer stack (outermost back to innermost front)
  // At explode=0: phone is closed and flush within 0.001
  // At explode=1: every layer is visible without intersection
  // ===================================================================
  const restPositions = {
    screen:      { x:  0.0,   y:  0.0,   z: -0.042, rx: 0, ry: 0 },
    frame:       { x:  0.0,   y:  0.0,   z:  0.000, rx: 0, ry: 0 },
    port:        { x:  0.0,   y:  0.0,   z: -0.006, rx: 0, ry: 0 },
    battery:     { x: -0.14,  y: -0.06,  z:  0.010, rx: 0, ry: 0 },
    board:       { x:  0.0,   y:  0.42,  z:  0.008, rx: 0, ry: 0 },
    cameraUnit:  { x: -0.18,  y:  0.52,  z:  0.052, rx: 0, ry: 0 },
    coverPlate:  { x:  0.0,   y:  0.0,   z:  0.032, rx: 0, ry: 0 },
    backCover:   { x:  0.0,   y:  0.0,   z:  0.045, rx: 0, ry: 0 },
  };

  const explodedPositions = {
    // Exact layer separation along Z and slight lateral reveals
    screen:      { x: -0.12,  y:  0.01,  z: -0.35, rx: -0.02, ry:  0.03 },
    frame:       { x:  0.0,   y:  0.0,   z:  0.00, rx:  0.00, ry:  0.00 },
    port:        { x:  0.02,  y: -0.06,  z:  0.10, rx:  0.02, ry: -0.02 },
    board:       { x:  0.03,  y:  0.44,  z:  0.24, rx:  0.03, ry: -0.03 },
    battery:     { x: -0.08,  y: -0.08,  z:  0.44, rx: -0.03, ry:  0.04 },
    cameraUnit:  { x: -0.22,  y:  0.56,  z:  0.68, rx:  0.04, ry: -0.04 },
    coverPlate:  { x:  0.04,  y: -0.02,  z:  0.96, rx:  0.05, ry: -0.04 },
    backCover:   { x:  0.08,  y: -0.04,  z:  1.32, rx:  0.06, ry: -0.05 },
  };

  const allParts = [
    { group: screenGroup,     key: 'screen',     outline: screenOutline },
    { group: frameGroup,      key: 'frame',      outline: frameOutline },
    { group: portGroup,       key: 'port',       outline: portOutline },
    { group: boardGroup,      key: 'board',      outline: boardOutline },
    { group: batteryGroup,    key: 'battery',    outline: batteryOutline },
    { group: cameraUnitGroup, key: 'cameraUnit', outline: cameraOutline },
    { group: coverPlateGroup, key: 'coverPlate', outline: plateOutline },
    { group: backCoverGroup,  key: 'backCover',  outline: backCoverOutline },
  ];

  // Reusable vectors for ribbon and label updates
  const tempStart = new THREE.Vector3();
  const tempEnd = new THREE.Vector3();
  const tempControl = new THREE.Vector3();
  const anchorVec = new THREE.Vector3();

  function updateRibbonAnchors() {
    // Ribbons removed to eliminate brown line poking through geometry
  }

  function setExplodeProgress(t, isReassemble = false) {
    t = Math.max(0, Math.min(1, t));

    allParts.forEach(({ group, key }) => {
      const rest = restPositions[key];
      const expl = explodedPositions[key];

      let factor = t;
      if (isReassemble) {
        // Reverse stagger with 2% overshoot
        factor = Math.max(0, Math.min(1.02, (1 - t) * 1.02));
      }

      // Smooth cubic hermite
      const smoothT = factor * factor * (3 - 2 * factor);

      group.position.x = THREE.MathUtils.lerp(rest.x, expl.x, smoothT);
      group.position.y = THREE.MathUtils.lerp(rest.y, expl.y, smoothT);
      group.position.z = THREE.MathUtils.lerp(rest.z, expl.z, smoothT);
      group.rotation.x = THREE.MathUtils.lerp(rest.rx, expl.rx, smoothT);
      group.rotation.y = THREE.MathUtils.lerp(rest.ry, expl.ry, smoothT);
    });

    updateRibbonAnchors();

    // Contact shadows: tight dark core fades, wide soft shadow widens as phone lifts
    tightShadowMesh.material.opacity = THREE.MathUtils.lerp(0.85, 0.08, t);
    const tightScale = THREE.MathUtils.lerp(1.0, 0.65, t);
    tightShadowMesh.scale.set(tightScale, tightScale, 1.0);

    wideShadowMesh.material.opacity = THREE.MathUtils.lerp(0.55, 0.20, t);
    const wideScale = THREE.MathUtils.lerp(1.0, 1.65, t); // widens as phone lifts
    wideShadowMesh.scale.set(wideScale, wideScale, 1.0);
  }

  // Active Part Isolation, Outlines & Material Dimming
  const originalColors = new Map();
  const dimColor = new THREE.Color(0xE0E3EB);

  function applyPhoneTheme(theme) {
    if (theme === 'light') {
      dimColor.setHex(0xE0E3EB);
      allParts.forEach(({ outline }) => {
        if (outline) outline.material.color.setHex(0x16A34A);
      });
    } else {
      dimColor.setHex(0x0B0B0C);
      allParts.forEach(({ outline }) => {
        if (outline) outline.material.color.setHex(0xC8FF2E);
      });
    }
  }

  const initialTheme = document.documentElement.getAttribute('data-theme') || 'light';
  applyPhoneTheme(initialTheme);
  window.addEventListener('themechange', (e) => applyPhoneTheme(e.detail?.theme || 'light'));

  function setActivePart(partKey) {
    allParts.forEach(({ group, key, outline }) => {
      const isActive = key === partKey;
      if (isActive) {
        group.scale.set(1.04, 1.04, 1.04);
        if (outline) {
          outline.material.opacity = 0.9;
          outline.visible = true;
        }
      } else {
        group.scale.set(1.0, 1.0, 1.0);
        if (outline) {
          outline.material.opacity = 0.0;
          outline.visible = false;
        }
      }

      // Material Dimming: Inactive parts dimmed 70% toward #0B0B0C
      group.traverse((child) => {
        if (child.isMesh && child.material && child.material.color && child.name !== 'screenFront') {
          if (!originalColors.has(child)) {
            originalColors.set(child, child.material.color.clone());
          }
          const baseColor = originalColors.get(child);
          if (partKey && !isActive) {
            // (f) Inactive-part dimming: at most 30% toward background
            child.material.color.copy(baseColor).lerp(dimColor, 0.25);
          } else {
            child.material.color.copy(baseColor);
          }
        }
      });
    });
  }

  // Dot product of part outward normal and view direction (must be > 0.2 to show label)
  const tempNormal = new THREE.Vector3();
  const tempViewDir = new THREE.Vector3();
  const tempPartPos = new THREE.Vector3();
  const tempCamPos = new THREE.Vector3();
  const tempQuat = new THREE.Quaternion();

  function getPartFacingDot(partName, camera) {
    let targetGroup = phoneGroup;
    const localNormal = new THREE.Vector3(0, 0, 1); // standard outward normal on back parts

    switch (partName) {
      case 'screen':
        targetGroup = screenGroup;
        localNormal.set(0, 0, -1); // screen front face normal
        break;
      case 'battery':
        targetGroup = batteryGroup;
        break;
      case 'port':
        targetGroup = portGroup;
        localNormal.set(0, -0.6, 0.8).normalize();
        break;
      case 'camera':
      case 'cameraUnit':
        targetGroup = cameraUnitGroup;
        break;
      case 'board':
        targetGroup = boardGroup;
        break;
      case 'cover':
      case 'coverPlate':
      case 'backCover':
        targetGroup = backCoverGroup;
        break;
    }

    targetGroup.getWorldQuaternion(tempQuat);
    tempNormal.copy(localNormal).applyQuaternion(tempQuat).normalize();

    camera.getWorldPosition(tempCamPos);
    targetGroup.getWorldPosition(tempPartPos);
    tempViewDir.subVectors(tempCamPos, tempPartPos).normalize();

    return tempNormal.dot(tempViewDir);
  }

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
        localOffset.set(0, -0.74, 0);
        break;
      case 'camera':
      case 'cameraUnit':
        targetGroup = cameraUnitGroup;
        localOffset.set(-0.19, 0.52, 0.06);
        break;
      case 'board':
        targetGroup = boardGroup;
        localOffset.set(0, 0.42, 0.02);
        break;
      case 'cover':
      case 'coverPlate':
      case 'backCover':
        targetGroup = backCoverGroup;
        localOffset.set(0, 0, 0.04);
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

  function setOutlinesOpacity(opacity) {
    allParts.forEach(({ outline }) => {
      if (outline) {
        outline.material.opacity = opacity;
        outline.visible = opacity > 0.01;
      }
    });
  }

  // Initial update
  setExplodeProgress(0);

  return {
    group: phoneGroup,
    screenGroup,
    backCoverGroup,
    coverPlateGroup,
    cameraUnitGroup,
    batteryGroup,
    boardGroup,
    portGroup,
    frameGroup,
    tools,
    ribbons,
    shockwaveMesh,
    screenFlashMesh,
    setOutlinesOpacity,
    updateRibbonAnchors,
    allParts,
    renderScreenState,
    setExplodeProgress,
    setActivePart,
    getPartScreenPosition,
    getPartFacingDot,
    restPositions,
    dispose() {
      screenTexture.dispose();
      shadowTexture.dispose();
      textures.dispose();
      shockwaveGeom.dispose();
      shockwaveMat.dispose();
      screenFlashGeom.dispose();
      screenFlashMat.dispose();
      Object.values(ribbons).forEach((r) => r.dispose());
      phoneGroup.traverse((child) => {
        if (child.isMesh || child.isLineSegments || child.isInstancedMesh) {
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
