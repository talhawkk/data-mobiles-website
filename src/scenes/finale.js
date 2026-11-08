/**
 * Finale Scene Choreography (Progress 0.91 - 1.00)
 * Camera pulls back by 2.5 units, phone settles, boot screen.
 * Nothing changes from 0.96 except idle motion.
 */
export function build(tl, ctx) {
  const { phone, wifiScene, camera, initialCamZ } = ctx;

  const wifiObj = { scale: 1 };
  // Router scales out (91 to 94)
  tl.to(
    wifiObj,
    {
      scale: 0,
      duration: 3,
      ease: 'none',
      onUpdate: () => {
        wifiScene.setProgress(wifiObj.scale);
      },
    },
    91
  );

  // Restore phone scale to 1.0
  tl.to(
    phone.group.scale,
    {
      x: 1.0,
      y: 1.0,
      z: 1.0,
      duration: 5,
      ease: 'none',
    },
    91
  );

  tl.to(
    phone.group.position,
    {
      x: 0,
      y: 0,
      z: 0,
      duration: 5,
      ease: 'none',
    },
    91
  );

  tl.to(
    phone.group.rotation,
    {
      x: 0.04,
      y: Math.PI - 0.12,
      duration: 5,
      ease: 'none',
    },
    91
  );

  // Camera pulls back by 2.5 units
  tl.to(
    camera.position,
    {
      z: initialCamZ + 2.5,
      y: 0,
      x: 0,
      duration: 5,
      ease: 'none',
    },
    91
  );
}
