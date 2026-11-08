import * as THREE from 'three';

/**
 * Teardown Scene Choreography (TEARDOWN.md Part T2)
 *
 * Act A: Open (0.07 - 0.20, timeline 7 to 20)
 * - 0.07-0.10: Camera pushes in 8%, orbits to back view (yaw -18, pitch 8, roll 2 deg). Spudger enters at seam and slides.
 * - 0.10-0.13: Back cover peels, pivoting at top edge up to 35 deg, adhesive stretching, detaches.
 * - 0.13-0.15: Back cover drifts toward camera & right, rotating 12 deg, exits frame. Spudger exits.
 * - 0.15-0.19: Screwdriver visits 3 screw clusters; screws spin out (4 turns) and rise 0.3 units into floating group. Screwdriver exits.
 * - 0.19-0.20: Cover plate with coil lifts, tilting 25 deg, exits left. Plate ribbon connector pops.
 *
 * Act B: Inspect (0.20 - 0.56, timeline 20 to 56)
 * - 01 Battery (20-27): pulls +0.35 in Z, rotates 20 deg around Y to show pull tabs.
 * - 02 Board   (27-34): pulls +0.35 in Z, tilted (rx: 0.15, ry: -0.15) to rake light across shield cans.
 * - 03 Camera  (34-41): pulls +0.35 in Z, rotates to show triple lens rings.
 * - 04 Port    (41-48): pulls +0.35 in Z, tilted (rx: -0.35) to show USB-C slot.
 * - 05 Screen  (48-56): Camera flips to front, screen pulls forward, lock screen visible.
 *
 * Catmull-Rom camera path & fov tightening (40 -> 30).
 */
export function build(tl, ctx) {
  const { phone, camera, initialCamZ, rendererObj } = ctx;

  const isMobile = window.innerWidth < 1024;
  const tools = phone.tools;

  // -------------------------------------------------------------------
  // ACT A: OPEN (0.07 - 0.20, Timeline 7 to 20)
  // -------------------------------------------------------------------

  // 1. 0.07 - 0.10 (7 to 10): Camera pushes in 8%, orbits to back view (yaw -18, pitch 8 deg, roll 2 deg)
  tl.to(
    camera.position,
    {
      z: initialCamZ * 0.92,
      duration: 3,
      ease: 'power2.inOut',
    },
    7
  );

  // Orbit phone to back view (yaw: Math.PI - 0.314 rad, pitch: 0.14 rad, roll: 0.035 rad)
  tl.to(
    phone.group.rotation,
    {
      y: Math.PI - 0.314,
      x: 0.14,
      z: 0.035,
      duration: 3,
      ease: 'power2.inOut',
    },
    7
  );

  // Spudger enters at bottom-left seam and slides along it
  tl.set(tools.toolsGroup, { visible: true }, 7);
  tl.set(tools.spudgerGroup, { visible: true }, 7);

  tl.fromTo(
    tools.spudgerGroup.position,
    { x: -0.365, y: -0.68, z: 0.048 },
    { x: -0.365, y: 0.20, z: 0.048, duration: 3, ease: 'power1.inOut' },
    7
  );
  tl.fromTo(
    tools.spudgerGroup.rotation,
    { z: 0.18, y: -0.1 },
    { z: 0.04, y: 0.0, duration: 3, ease: 'power1.inOut' },
    7
  );

  // 2. 0.10 - 0.13 (10 to 13): Back cover peels (pivoting at top edge up to 35 deg = -0.61 rad)
  tl.to(
    phone.backCoverGroup.rotation,
    {
      x: -0.61, // 35 degrees lift
      duration: 3,
      ease: 'power2.inOut',
    },
    10
  );

  tl.to(
    phone.backCoverGroup.position,
    {
      z: 0.38,
      y: 0.08,
      duration: 3,
      ease: 'power2.inOut',
    },
    10
  );

  // 3. 0.13 - 0.15 (13 to 15): Back cover drifts toward camera & right, exits frame
  tl.to(
    phone.backCoverGroup.position,
    {
      x: 1.65,
      z: 1.55,
      y: -0.15,
      duration: 2,
      ease: 'power2.in',
    },
    13
  );

  tl.to(
    phone.backCoverGroup.rotation,
    {
      y: 0.21, // 12 degrees
      z: 0.18,
      duration: 2,
      ease: 'power2.in',
    },
    13
  );

  // Spudger exits frame by 0.15
  tl.to(
    tools.spudgerGroup.position,
    {
      x: -1.6,
      duration: 2,
      ease: 'power2.in',
    },
    13
  );
  tl.set(tools.spudgerGroup, { visible: false }, 15);

  // 4. 0.15 - 0.19 (15 to 19): Screwdriver visits 3 screw clusters; screws spin out (4 turns)
  tl.set(tools.driverGroup, { visible: true }, 15);

  // Screwdriver visits top cluster (15 to 16)
  tl.fromTo(
    tools.driverGroup.position,
    { x: 0.6, y: 1.2, z: 0.5 },
    { x: 0.0, y: 0.66, z: 0.32, duration: 1.0, ease: 'power2.out' },
    15
  );
  tl.to(
    tools.driverGroup.rotation,
    { z: Math.PI * 4, duration: 1.0, ease: 'linear' },
    15
  );

  // Screwdriver visits middle cluster (16.2 to 17.5)
  tl.to(
    tools.driverGroup.position,
    { x: 0.28, y: 0.0, z: 0.32, duration: 1.3, ease: 'power2.inOut' },
    16.2
  );
  tl.to(
    tools.driverGroup.rotation,
    { z: Math.PI * 8, duration: 1.3, ease: 'linear' },
    16.2
  );

  // Screwdriver visits bottom cluster (17.7 to 18.8)
  tl.to(
    tools.driverGroup.position,
    { x: -0.28, y: -0.66, z: 0.32, duration: 1.1, ease: 'power2.inOut' },
    17.7
  );
  tl.to(
    tools.driverGroup.rotation,
    { z: Math.PI * 12, duration: 1.1, ease: 'linear' },
    17.7
  );

  // Screwdriver exits by 0.19
  tl.to(
    tools.driverGroup.position,
    { x: 1.8, y: 1.4, z: 0.8, duration: 0.5, ease: 'power2.in' },
    18.8
  );
  tl.set(tools.driverGroup, { visible: false }, 19);

  // 5. 0.19 - 0.20 (19 to 20): Cover plate with coil lifts, tilting 25 deg, exits left
  tl.to(
    phone.coverPlateGroup.position,
    {
      x: -1.65,
      z: 0.95,
      y: 0.12,
      duration: 1.0,
      ease: 'power2.in',
    },
    19
  );

  tl.to(
    phone.coverPlateGroup.rotation,
    {
      x: -0.436, // 25 degrees
      z: -0.12,
      duration: 1.0,
      ease: 'power2.in',
    },
    19
  );

  // Plate ribbon connector pop (scale punch 1.0 -> 1.3 -> 1.0)
  tl.to(
    phone.ribbons.plateBoard.group.scale,
    { x: 1.35, y: 1.35, z: 1.35, duration: 0.5, ease: 'power2.out' },
    19
  );
  tl.to(
    phone.ribbons.plateBoard.group.scale,
    { x: 1.0, y: 1.0, z: 1.0, duration: 0.5, ease: 'power2.in' },
    19.5
  );

  tl.set(tools.toolsGroup, { visible: false }, 20);

  // -------------------------------------------------------------------
  // ACT B: INSPECT (0.20 - 0.56, Timeline 20 to 56)
  // Exploded layer separation + 5 Inspect Windows
  // -------------------------------------------------------------------

  // Base exploded separation across internals
  const explodeProgressObj = { t: 0 };
  tl.to(
    explodeProgressObj,
    {
      t: 1.0,
      duration: 2,
      ease: 'power2.out',
      onUpdate: () => {
        phone.setExplodeProgress(explodeProgressObj.t);
      },
    },
    20
  );

  // Tighten camera fov from 38/50 to 30 during inspect
  const baseFov = isMobile ? 50 : 38;
  tl.to(
    camera,
    {
      fov: 30,
      duration: 4,
      ease: 'power2.inOut',
      onUpdate: () => camera.updateProjectionMatrix(),
    },
    20
  );

  // WINDOW 01: BATTERY (0.20 - 0.27, t: 20 to 27)
  // Battery pulls toward camera (+0.35 in Z), rotates 20 deg around Y to show pull tabs
  tl.to(
    phone.batteryGroup.position,
    {
      z: 0.44 + 0.35,
      x: -0.06,
      duration: 3,
      ease: 'power2.out',
    },
    20
  );
  tl.to(
    phone.batteryGroup.rotation,
    {
      y: 0.35, // 20 degrees around Y
      x: -0.08,
      duration: 3,
      ease: 'power2.out',
    },
    20
  );

  // Camera focuses on Battery world position
  tl.to(
    camera.position,
    {
      z: initialCamZ * 0.84,
      y: -0.06,
      duration: 6,
      ease: 'none',
    },
    20
  );

  // Battery returns to baseline exploded position before next window
  tl.to(
    phone.batteryGroup.position,
    {
      z: 0.44,
      x: -0.08,
      duration: 1.0,
      ease: 'power2.inOut',
    },
    26.0
  );
  tl.to(
    phone.batteryGroup.rotation,
    {
      y: 0.04,
      x: -0.03,
      duration: 1.0,
      ease: 'power2.inOut',
    },
    26.0
  );

  // WINDOW 02: BOARD (0.27 - 0.34, t: 27 to 34)
  // Board pulls toward camera (+0.35 in Z), tilted (rx: 0.15, ry: -0.15) to rake light across shield cans
  tl.to(
    phone.boardGroup.position,
    {
      z: 0.24 + 0.35,
      y: 0.46,
      duration: 3,
      ease: 'power2.out',
    },
    27
  );
  tl.to(
    phone.boardGroup.rotation,
    {
      x: 0.15,
      y: -0.15,
      duration: 3,
      ease: 'power2.out',
    },
    27
  );

  // Camera focuses on Board
  tl.to(
    camera.position,
    {
      z: initialCamZ * 0.80,
      y: 0.36,
      duration: 6,
      ease: 'none',
    },
    27
  );

  // Board returns to baseline
  tl.to(
    phone.boardGroup.position,
    {
      z: 0.24,
      y: 0.44,
      duration: 1.0,
      ease: 'power2.inOut',
    },
    33.0
  );
  tl.to(
    phone.boardGroup.rotation,
    {
      x: 0.03,
      y: -0.03,
      duration: 1.0,
      ease: 'power2.inOut',
    },
    33.0
  );

  // WINDOW 03: CAMERA UNIT (0.34 - 0.41, t: 34 to 41)
  // Camera unit pulls forward (+0.35 in Z), rotates to show triple lens rings
  tl.to(
    phone.cameraUnitGroup.position,
    {
      z: 0.68 + 0.35,
      x: -0.20,
      y: 0.58,
      duration: 3,
      ease: 'power2.out',
    },
    34
  );
  tl.to(
    phone.cameraUnitGroup.rotation,
    {
      x: 0.10,
      y: -0.12,
      duration: 3,
      ease: 'power2.out',
    },
    34
  );

  tl.to(
    camera.position,
    {
      z: initialCamZ * 0.82,
      y: 0.42,
      duration: 6,
      ease: 'none',
    },
    34
  );

  // Camera unit returns
  tl.to(
    phone.cameraUnitGroup.position,
    {
      z: 0.68,
      x: -0.22,
      y: 0.56,
      duration: 1.0,
      ease: 'power2.inOut',
    },
    40.0
  );
  tl.to(
    phone.cameraUnitGroup.rotation,
    {
      x: 0.04,
      y: -0.04,
      duration: 1.0,
      ease: 'power2.inOut',
    },
    40.0
  );

  // WINDOW 04: PORT (0.41 - 0.48, t: 41 to 48)
  // Port pulls forward (+0.35 in Z), tilted (rx: -0.35) to show USB-C slot
  tl.to(
    phone.portGroup.position,
    {
      z: 0.10 + 0.35,
      y: -0.12,
      duration: 3,
      ease: 'power2.out',
    },
    41
  );
  tl.to(
    phone.portGroup.rotation,
    {
      x: -0.35, // tilt to show slot
      y: 0.08,
      duration: 3,
      ease: 'power2.out',
    },
    41
  );

  tl.to(
    camera.position,
    {
      z: initialCamZ * 0.82,
      y: -0.42,
      duration: 6,
      ease: 'none',
    },
    41
  );

  // Port returns
  tl.to(
    phone.portGroup.position,
    {
      z: 0.10,
      y: -0.06,
      duration: 1.0,
      ease: 'power2.inOut',
    },
    47.0
  );
  tl.to(
    phone.portGroup.rotation,
    {
      x: 0.02,
      y: -0.02,
      duration: 1.0,
      ease: 'power2.inOut',
    },
    47.0
  );

  // WINDOW 05: SCREEN (0.48 - 0.56, t: 48 to 56)
  // Phone flips to front (yaw: 0), screen pulls forward toward camera, lock screen visible!
  tl.to(
    phone.group.rotation,
    {
      y: 0.0,
      x: 0.04,
      z: 0.0,
      duration: 8,
      ease: 'power2.inOut',
    },
    48
  );

  tl.to(
    phone.screenGroup.position,
    {
      z: -0.35 - 0.25,
      x: -0.04,
      duration: 5,
      ease: 'power2.out',
    },
    48
  );

  // Camera centers and restores fov
  tl.to(
    camera.position,
    {
      z: initialCamZ * 0.88,
      y: 0.0,
      x: 0.0,
      duration: 8,
      ease: 'power2.inOut',
    },
    48
  );

  tl.to(
    camera,
    {
      fov: baseFov,
      duration: 8,
      ease: 'power2.inOut',
      onUpdate: () => camera.updateProjectionMatrix(),
    },
    48
  );
}
