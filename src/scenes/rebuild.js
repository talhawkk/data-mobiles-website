/**
 * Rebuild Scene Choreography (Progress 0.56 - 0.66)
 * Parts snap back together in reverse order with 2% overshoot.
 * Phone turns completely to face camera; screen displays "Fixed."
 */
export function build(tl, ctx) {
  const { phone, camera, initialCamZ } = ctx;

  const rebuildObj = { progress: 1 };

  tl.to(
    rebuildObj,
    {
      progress: 0,
      duration: 10,
      ease: 'none',
      onUpdate: () => {
        phone.setExplodeProgress(rebuildObj.progress, true);
      },
    },
    56
  );

  tl.to(
    camera.position,
    {
      z: initialCamZ,
      y: 0,
      x: 0,
      duration: 10,
      ease: 'none',
    },
    56
  );

  tl.to(
    phone.group.rotation,
    {
      y: Math.PI, // Facing front screen directly
      x: 0,
      duration: 10,
      ease: 'none',
    },
    56
  );
}
