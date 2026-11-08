/**
 * Teardown Scene Choreography
 * - Open: 0.07 - 0.20 (timeline 7 to 20)
 * - Inspect: 0.20 - 0.56 (timeline 20 to 56)
 *   Five windows:
 *   01 Battery 0.20-0.27 (20-27)
 *   02 Board   0.27-0.34 (27-34)
 *   03 Camera  0.34-0.41 (34-41)
 *   04 Port    0.41-0.48 (41-48)
 *   05 Screen  0.48-0.56 (48-56)
 */
export function build(tl, ctx) {
  const { phone, camera, initialCamZ } = ctx;

  // 1. OPEN (0.07 - 0.20)
  // Phone rotates into profile, parts explode outward
  const phoneExplodeObj = { progress: 0 };

  tl.to(
    phone.group.rotation,
    {
      y: 0.65,
      x: 0.12,
      duration: 13,
      ease: 'none',
    },
    7
  );

  tl.to(
    phoneExplodeObj,
    {
      progress: 1.0,
      duration: 13,
      ease: 'none',
      onUpdate: () => {
        phone.setExplodeProgress(phoneExplodeObj.progress, false);
      },
    },
    7
  );

  // 2. INSPECT (0.20 - 0.56)
  // Camera pushes in slightly through parts
  tl.to(
    camera.position,
    {
      z: initialCamZ - 0.45,
      y: 0.04,
      duration: 36,
      ease: 'none',
    },
    20
  );

  // Smooth camera orbit sweep across windows 01-04 (20 -> 48)
  tl.to(
    phone.group.rotation,
    {
      y: 0.65 + 0.35, // 20-degree orbit
      x: 0.08,
      duration: 28,
      ease: 'none',
    },
    20
  );

  // Window 05 Screen (48 -> 56): Phone rotates to front so the lock screen faces the camera
  tl.to(
    phone.group.rotation,
    {
      y: Math.PI - 0.15,
      x: 0.04,
      duration: 8,
      ease: 'none',
    },
    48
  );
}
