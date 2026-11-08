/**
 * WiFi Scene Choreography (Progress 0.80 - 0.91)
 * Router in stage zone, tilted 20 degrees toward camera.
 * 4 accent rings expand toward camera, staggered and looping.
 * Phone shows wifi-bars screen at small scale near router.
 */
export function build(tl, ctx) {
  const { phone, wifiScene, isMobile } = ctx;

  const targetRouterScale = isMobile ? 0.72 : 1.0;
  const wifiRouterX = isMobile ? 0 : 0.05;
  const wifiRouterY = isMobile ? 0.52 : 0.18;
  const wifiRouterZ = isMobile ? -0.20 : 0.0;

  wifiScene.group.position.set(wifiRouterX, wifiRouterY, wifiRouterZ);

  const wifiObj = { scale: 0 };
  tl.to(
    wifiObj,
    {
      scale: targetRouterScale,
      duration: 3,
      ease: 'none',
      onUpdate: () => {
        wifiScene.setProgress(wifiObj.scale);
      },
    },
    80
  );

  tl.to(
    phone.group.rotation,
    {
      y: Math.PI - 0.10,
      x: 0.08,
      duration: 11,
      ease: 'none',
    },
    80
  );
}
