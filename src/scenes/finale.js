/**
 * Finale Scene Choreography (Progress 0.91 - 1.00)
 * 1. Camera pulls back by 2.2 units to a wide composition.
 * 2. Phone settles in the 3D stage zone at full scale (1.0), 3/4 front view.
 * 3. Router and accessories orbit small in the distant background.
 * 4. Choreography settles by 0.96. Nothing changes from 0.96 to 1.00 except idle motion.
 */
export function build(tl, ctx) {
  const { phone, accessories, wifiScene, camera, initialCamZ, isMobile } = ctx;

  const targetPhoneX = 0;
  const targetPhoneY = isMobile ? 0.42 : 0;
  const targetPhoneScale = isMobile ? 0.40 : 1.0;

  // Camera pulls back to wide composition (91 -> 96)
  tl.to(
    camera.position,
    {
      z: initialCamZ + 2.2,
      y: 0,
      x: 0,
      duration: 5,
      ease: 'power2.inOut',
    },
    91
  );

  // Phone transitions to stage rest position (91 -> 96)
  tl.to(
    phone.group.position,
    {
      x: targetPhoneX,
      y: targetPhoneY,
      z: 0,
      duration: 5,
      ease: 'power2.inOut',
    },
    91
  );

  tl.to(
    phone.group.scale,
    {
      x: targetPhoneScale,
      y: targetPhoneScale,
      z: targetPhoneScale,
      duration: 5,
      ease: 'power2.inOut',
    },
    91
  );

  tl.to(
    phone.group.rotation,
    {
      y: 0.38, // ~22 degrees front 3/4 view
      x: 0.06, // ~3.5 degrees pitch
      z: 0.0,
      duration: 5,
      ease: 'power2.inOut',
    },
    91
  );

  // Router moves to distant background orbit (91 -> 96)
  tl.set(wifiScene.group, { visible: true }, 91);
  const routerOrbitScale = { scale: 0.22 };
  tl.to(
    routerOrbitScale,
    {
      scale: 0.22,
      duration: 5,
      ease: 'power2.inOut',
      onUpdate: () => {
        wifiScene.setProgress(routerOrbitScale.scale);
      },
    },
    91
  );
  tl.to(
    wifiScene.group.position,
    {
      x: isMobile ? 0.45 : 0.85,
      y: isMobile ? 0.35 : 0.38,
      z: -1.6,
      duration: 5,
      ease: 'power2.inOut',
    },
    91
  );

  // Accessories move to distant background orbit (91 -> 96)
  tl.set(accessories.group, { visible: true }, 91);
  tl.set(accessories.chargerGroup, { visible: true }, 91);
  tl.set(accessories.earbudSystemGroup, { visible: true }, 91);
  tl.to(
    accessories.group.position,
    {
      x: isMobile ? -0.45 : -0.85,
      y: isMobile ? -0.20 : -0.28,
      z: -1.6,
      duration: 5,
      ease: 'power2.inOut',
    },
    91
  );
  tl.to(
    accessories.group.scale,
    {
      x: 0.22,
      y: 0.22,
      z: 0.22,
      duration: 5,
      ease: 'power2.inOut',
    },
    91
  );

  // Note: from 96 to 100, no tweens exist - state is fully settled and idle motion takes over.
}
