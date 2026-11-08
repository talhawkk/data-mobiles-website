/**
 * Accessories Scene Choreography (Progress 0.66 - 0.80)
 * Four windows: Case 0.66-0.70, Earbuds 0.70-0.73, Charger 0.73-0.77, Cable 0.77-0.80
 * All accessories scale to 0 and leave frame by 0.80.
 * Layout contract: Text 0-38vw left; objects in 3D stage.
 */
export function build(tl, ctx) {
  const { phone, accessories, isMobile } = ctx;

  // Accessories enter 66 -> 70
  const accObj = { scale: 0 };
  tl.to(
    accObj,
    {
      scale: 1,
      duration: 4,
      ease: 'none',
      onUpdate: () => {
        accessories.setProgress(accObj.scale);
      },
    },
    66
  );

  // Phone tilt during accessories
  tl.to(
    phone.group.rotation,
    {
      y: Math.PI - 0.15,
      x: 0.06,
      duration: 10,
      ease: 'none',
    },
    66
  );

  // Accessories scale to 0 and exit by 0.80 (timeline 76 -> 80)
  tl.to(
    accObj,
    {
      scale: 0,
      duration: 4,
      ease: 'none',
      onUpdate: () => {
        accessories.setProgress(accObj.scale);
      },
    },
    76
  );

  // Phone scales down and prepares for WiFi scene (76 -> 80)
  const wifiPhoneScale = isMobile ? 0.40 : 0.45;
  const wifiPhoneX = isMobile ? 0.28 : 0.35;
  const wifiPhoneY = isMobile ? 0.22 : -0.22;

  tl.to(
    phone.group.position,
    {
      x: wifiPhoneX,
      y: wifiPhoneY,
      z: 0.20,
      duration: 4,
      ease: 'none',
    },
    76
  );

  tl.to(
    phone.group.scale,
    {
      x: wifiPhoneScale,
      y: wifiPhoneScale,
      z: wifiPhoneScale,
      duration: 4,
      ease: 'none',
    },
    76
  );
}
