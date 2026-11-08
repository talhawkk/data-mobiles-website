/**
 * WiFi Scene Choreography (Progress 0.80 - 0.91)
 * 1. Router in stage zone (matte #1A1B1E body, 2 jointed antennas, 3 accent LEDs).
 * 2. 4 accent rings looping, capped to never pass under top nav.
 * 3. 40-particle QuadraticBezierCurve3 data pulses travelling router -> phone.
 * 4. Phone displays animated wifi signal arcs and live speed readout.
 * 5. Router height 28-32% of viewport height; phone 22%.
 */
export function build(tl, ctx) {
  const { phone, wifiScene, isMobile } = ctx;

  const targetRouterScale = isMobile ? 0.72 : 1.0;
  const wifiRouterX = isMobile ? 0 : 0.05;
  const wifiRouterY = isMobile ? 0.52 : 0.18;
  const wifiRouterZ = isMobile ? -0.20 : 0.0;

  wifiScene.group.position.set(wifiRouterX, wifiRouterY, wifiRouterZ);
  wifiScene.updatePulseCurve(wifiScene.group.position, phone.group.position);

  // Router enters stage (80 -> 82)
  const wifiObj = { scale: 0 };
  tl.to(
    wifiObj,
    {
      scale: targetRouterScale,
      duration: 2,
      ease: 'power2.out',
      onUpdate: () => {
        wifiScene.setProgress(wifiObj.scale);
      },
    },
    80
  );

  // Phone gentle rotation showing screen clearly during WiFi scene (80 -> 91)
  tl.to(
    phone.group.rotation,
    {
      y: 0.12,
      x: 0.06,
      z: 0.0,
      duration: 11,
      ease: 'none',
    },
    80
  );

  // At finale transition (89.5 -> 91), router shrinks to background orbiter
  tl.to(
    wifiObj,
    {
      scale: targetRouterScale * 0.24,
      duration: 1.5,
      ease: 'power2.inOut',
      onUpdate: () => {
        wifiScene.setProgress(wifiObj.scale);
      },
    },
    89.5
  );

  tl.to(
    wifiScene.group.position,
    {
      x: isMobile ? 0.45 : 0.65,
      y: 0.42,
      z: -1.2,
      duration: 1.5,
      ease: 'power2.inOut',
    },
    89.5
  );
}
