/**
 * Hero Scene Choreography (Progress 0.00 - 0.07)
 * Layout Contract: Text column 0-38vw left; 3D stage right 58vw.
 */
export function build(tl, ctx) {
  const { phone, rendererObj, isMobile } = ctx;

  const initialY = isMobile ? 0.22 : 0;
  const initialScale = isMobile ? 0.60 : 1;

  // Initial resting state: Front OLED screen facing camera (y = 0 with innerGroup inverted)
  phone.group.position.set(0, initialY, 0);
  phone.group.rotation.set(0.02, 0, 0);
  phone.group.scale.set(initialScale, initialScale, initialScale);

  // Hero transition to open (0.00 -> 0.07)
  // Subtle initial breathing / orientation
  tl.to(
    phone.group.rotation,
    {
      y: 0.08,
      x: 0.04,
      duration: 7,
      ease: 'none',
    },
    0
  );
}
