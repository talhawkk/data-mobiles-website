import * as THREE from 'three';

/**
 * Rebuild Scene Choreography (UPGRADE.md U5: Progress 0.56 - 0.66, Timeline 56 to 66)
 *
 * 1. Parts converge in reverse order with power4.in:
 *    Screen -> Port -> Board -> Battery -> Camera unit -> Cover plate -> Back cover.
 * 2. At contact (progress 0.60, Timeline 60.0):
 *    - Phone scale punch: 1.0 -> 1.03 -> 1.0 over 0.015 progress (duration 1.5 units: 60.0 to 61.5).
 *    - Additive accent ring expands from 0 to 3 units while fading 0.7 to 0 (60.0 to 61.5).
 *    - Outlines flash to opacity 1 and fade (60.0 to 61.5).
 *    - Screen flashes white at 0.2 opacity (60.0 to 60.6).
 *    - Screen shows boot logo (60.0 to 61.2), then "Fixed." with check mark drawn stroke by stroke (61.2 to 63.5).
 * 3. Camera pulls back and settles at a 3/4 front view (yaw 25 degrees = 0.4363 rad, pitch ~4.5 deg = 0.08 rad).
 *    After reassembly exactly one phone exists: at p=0.62 every part position equals its rest position within 0.001.
 * 4. Headline "Fixed." animates word by word; supporting line follows.
 *    Acceptance: no leftover slabs at p=0.62-0.66.
 */
export function build(tl, ctx) {
  const { phone, camera, initialCamZ } = ctx;
  const rest = phone.restPositions;

  // 1. REVERSE ORDER CONVERGENCE (56 to 60) WITH power4.in
  // Part 1: Screen pulls in (56.0 to 58.5)
  tl.to(
    phone.screenGroup.position,
    {
      x: rest.screen.x,
      y: rest.screen.y,
      z: rest.screen.z,
      duration: 2.5,
      ease: 'power4.in',
    },
    56.0
  );
  tl.to(
    phone.screenGroup.rotation,
    {
      x: rest.screen.rx || 0,
      y: rest.screen.ry || 0,
      z: 0,
      duration: 2.5,
      ease: 'power4.in',
    },
    56.0
  );

  // Part 2: Port sub-board settles (56.4 to 58.8)
  tl.to(
    phone.portGroup.position,
    {
      x: rest.port.x,
      y: rest.port.y,
      z: rest.port.z,
      duration: 2.4,
      ease: 'power4.in',
    },
    56.4
  );
  tl.to(
    phone.portGroup.rotation,
    {
      x: rest.port.rx || 0,
      y: rest.port.ry || 0,
      z: 0,
      duration: 2.4,
      ease: 'power4.in',
    },
    56.4
  );

  // Part 3: Logic Board settles (56.8 to 59.2)
  tl.to(
    phone.boardGroup.position,
    {
      x: rest.board.x,
      y: rest.board.y,
      z: rest.board.z,
      duration: 2.4,
      ease: 'power4.in',
    },
    56.8
  );
  tl.to(
    phone.boardGroup.rotation,
    {
      x: rest.board.rx || 0,
      y: rest.board.ry || 0,
      z: 0,
      duration: 2.4,
      ease: 'power4.in',
    },
    56.8
  );

  // Part 4: Battery docks in (57.2 to 59.5)
  tl.to(
    phone.batteryGroup.position,
    {
      x: rest.battery.x,
      y: rest.battery.y,
      z: rest.battery.z,
      duration: 2.3,
      ease: 'power4.in',
    },
    57.2
  );
  tl.to(
    phone.batteryGroup.rotation,
    {
      x: rest.battery.rx || 0,
      y: rest.battery.ry || 0,
      z: 0,
      duration: 2.3,
      ease: 'power4.in',
    },
    57.2
  );

  // Part 5: Camera unit docks in (57.5 to 59.7)
  tl.to(
    phone.cameraUnitGroup.position,
    {
      x: rest.cameraUnit.x,
      y: rest.cameraUnit.y,
      z: rest.cameraUnit.z,
      duration: 2.2,
      ease: 'power4.in',
    },
    57.5
  );
  tl.to(
    phone.cameraUnitGroup.rotation,
    {
      x: rest.cameraUnit.rx || 0,
      y: rest.cameraUnit.ry || 0,
      z: 0,
      duration: 2.2,
      ease: 'power4.in',
    },
    57.5
  );

  // Part 6: Cover plate drops on and snaps connector (57.8 to 59.9)
  tl.to(
    phone.coverPlateGroup.position,
    {
      x: rest.coverPlate.x,
      y: rest.coverPlate.y,
      z: rest.coverPlate.z,
      duration: 2.1,
      ease: 'power4.in',
    },
    57.8
  );
  tl.to(
    phone.coverPlateGroup.rotation,
    {
      x: rest.coverPlate.rx || 0,
      y: rest.coverPlate.ry || 0,
      z: 0,
      duration: 2.1,
      ease: 'power4.in',
    },
    57.8
  );

  // Part 7: Back cover swoops back in from off-canvas and clicks flush (58.0 to 60.0)
  tl.to(
    phone.backCoverGroup.position,
    {
      x: rest.backCover.x,
      y: rest.backCover.y,
      z: rest.backCover.z,
      duration: 2.0,
      ease: 'power4.in',
    },
    58.0
  );
  tl.to(
    phone.backCoverGroup.rotation,
    {
      x: rest.backCover.rx || 0,
      y: rest.backCover.ry || 0,
      z: 0,
      duration: 2.0,
      ease: 'power4.in',
      onUpdate: () => {
        if (typeof phone.updateRibbonAnchors === 'function') {
          phone.updateRibbonAnchors();
        }
      },
    },
    58.0
  );

  // At contact point 60.0: ensure explode progress is 0, ribbons rest, and active part cleared
  tl.call(
    () => {
      phone.setExplodeProgress(0);
      phone.setActivePart(null);
    },
    null,
    60.0
  );

  // 2. CAMERA PULL BACK & 3/4 FRONT VIEW SETTLING (56 to 62)
  tl.to(
    camera.position,
    {
      z: initialCamZ,
      y: 0,
      x: 0,
      duration: 6,
      ease: 'power2.inOut',
    },
    56
  );

  // Settle at a 3/4 front view: yaw 25 degrees (0.4363 rad), pitch ~4.5 deg (0.08 rad)
  tl.to(
    phone.group.rotation,
    {
      y: 25 * (Math.PI / 180), // 3/4 front view
      x: 0.08,
      z: 0,
      duration: 6,
      ease: 'power2.inOut',
    },
    56
  );

  // 3. CONTACT EFFECTS (Progress 0.60, Timeline 60.0 to 61.5)
  // Sub-effect A: Phone scale punch 1.0 -> 1.03 -> 1.0 over 0.015 progress (1.5 units)
  tl.to(
    phone.group.scale,
    {
      x: 1.03,
      y: 1.03,
      z: 1.03,
      duration: 0.75,
      ease: 'power2.out',
    },
    60.0
  );
  tl.to(
    phone.group.scale,
    {
      x: 1.0,
      y: 1.0,
      z: 1.0,
      duration: 0.75,
      ease: 'power2.inOut',
    },
    60.75
  );

  // Sub-effect B: Additive accent ring expands 0 -> 3 units while fading 0.7 -> 0
  if (phone.shockwaveMesh) {
    tl.set(phone.shockwaveMesh, { visible: true }, 60.0);
    tl.fromTo(
      phone.shockwaveMesh.scale,
      { x: 0.01, y: 0.01, z: 0.01 },
      { x: 3.0, y: 3.0, z: 3.0, duration: 1.5, ease: 'power2.out' },
      60.0
    );
    tl.fromTo(
      phone.shockwaveMesh.material,
      { opacity: 0.7 },
      { opacity: 0.0, duration: 1.5, ease: 'power2.out' },
      60.0
    );
    tl.set(phone.shockwaveMesh, { visible: false }, 61.5);
  }

  // Sub-effect C: Outlines flash to opacity 1 and fade back to 0.35
  const outlineFlash = { opacity: 1.0 };
  tl.fromTo(
    outlineFlash,
    { opacity: 1.0 },
    {
      opacity: 0.35,
      duration: 1.5,
      ease: 'power2.out',
      onUpdate: () => {
        if (typeof phone.setOutlinesOpacity === 'function') {
          phone.setOutlinesOpacity(outlineFlash.opacity);
        }
      },
    },
    60.0
  );

  // Sub-effect D: Screen flashes white at 0.2 opacity
  if (phone.screenFlashMesh) {
    tl.set(phone.screenFlashMesh, { visible: true }, 60.0);
    tl.fromTo(
      phone.screenFlashMesh.material,
      { opacity: 0.2 },
      { opacity: 0.0, duration: 0.6, ease: 'power2.out' },
      60.0
    );
    tl.set(phone.screenFlashMesh, { visible: false }, 60.6);
  }

  // 4. OVERLAY HEADLINE "Fixed." WORD BY WORD & SUBLINE
  const rebuildEyebrow = document.querySelector('.rebuild-eyebrow');
  const titleWords = document.querySelectorAll('.rebuild-title .word-mask-inner');
  const sublineWords = document.querySelectorAll('.rebuild-subline .word-mask-inner');
  const rebuildContent = document.querySelector('.rebuild-content');

  if (rebuildEyebrow) {
    tl.fromTo(
      rebuildEyebrow,
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' },
      60.2
    );
  }

  if (titleWords.length > 0) {
    tl.fromTo(
      titleWords,
      { yPercent: 110 },
      { yPercent: 0, duration: 1.2, stagger: 0.1, ease: 'expo.out' },
      60.4
    );
  }

  if (sublineWords.length > 0) {
    tl.fromTo(
      sublineWords,
      { yPercent: 110 },
      { yPercent: 0, duration: 1.2, stagger: 0.12, ease: 'expo.out' },
      61.0
    );
  }

  if (rebuildContent) {
    tl.to(
      rebuildContent,
      { opacity: 0, y: -20, duration: 1.5, ease: 'power2.in' },
      64.5
    );
  }
}
