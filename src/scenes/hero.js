/**
 * Hero Scene Choreography (Progress 0.00 - 0.07)
 * Layout Contract: Text column 0-38vw left; 3D stage right 58vw.
 */
export function build(tl, ctx) {
  const { phone, rendererObj } = ctx;

  // Initial resting state
  phone.group.position.set(0, 0, 0);
  phone.group.rotation.set(0, 0, 0);
  phone.group.scale.set(1, 1, 1);

  // Hero transition to open (0.00 -> 0.07)
  // Subtle initial breathing / orientation
  tl.to(
    phone.group.rotation,
    {
      y: 0.08,
      x: 0.02,
      duration: 7,
      ease: 'none',
    },
    0
  );
}
