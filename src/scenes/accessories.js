/**
 * Accessories Scene Choreography (Progress 0.66 - 0.80)
 * Four distinct beats with one index rail (01 Cases, 02 Earbuds, 03 Chargers, 04 Cables):
 * 1. Case (0.66 - 0.70): Slides onto phone from behind, snaps flush, slides off.
 * 2. Earbuds (0.70 - 0.73): Capsule case opens 70°, 2 earbuds float and orbit, lid closes.
 * 3. Charger (0.73 - 0.77): Brick enters with 2 metal prongs tilted to catch light.
 * 4. Cable (0.77 - 0.80): Tube draws to phone port via setDrawRange; phone screen fast-charges 12%->100%.
 * All accessories scale to 0 and exit by 0.80.
 * Layout contract: Text 0-38vw left; objects in 3D stage (x > 0).
 */
export function build(tl, ctx) {
  const { phone, accessories, isMobile } = ctx;

  const stageX = isMobile ? 0.0 : 0.40;
  const wifiPhoneScale = isMobile ? 0.35 : 0.45;
  const wifiPhoneX = isMobile ? 0.22 : 0.35;
  const wifiPhoneY = isMobile ? 0.18 : -0.22;

  // Make sure accessories group is hidden until section 66
  accessories.group.visible = false;
  accessories.group.scale.set(1, 1, 1);

  // Reparent case group to phone group so it moves/rotates seamlessly with the phone
  if (accessories.caseGroup.parent !== phone.group) {
    phone.group.add(accessories.caseGroup);
  }
  accessories.caseGroup.visible = false;
  accessories.caseGroup.position.set(0, 0, -0.8);

  // Position earbuds and charger in stage zone
  accessories.earbudSystemGroup.position.set(stageX, isMobile ? 0.22 : 0.14, 0.12);
  accessories.chargerGroup.position.set(stageX, isMobile ? 0.20 : -0.05, 0.15);

  // -------------------------------------------------------------------
  // BEAT 01: CASE (66 -> 70)
  // -------------------------------------------------------------------
  tl.set(accessories.group, { visible: true }, 66);
  tl.set(accessories.caseGroup, { visible: true }, 66);
  tl.set(accessories.caseGroup.position, { x: 0, y: 0, z: -0.75 }, 66);

  // Case slides forward onto phone from behind (66 -> 67.2)
  tl.to(
    accessories.caseGroup.position,
    {
      z: 0.0,
      duration: 1.2,
      ease: 'power2.out',
    },
    66
  );

  // Gentle phone tilt showing case fit (66 -> 70)
  tl.to(
    phone.group.rotation,
    {
      y: Math.PI * 0.18,
      x: 0.08,
      duration: 4,
      ease: 'none',
    },
    66
  );

  // Case slides off behind and exits (68.8 -> 70.0)
  tl.to(
    accessories.caseGroup.position,
    {
      z: -0.85,
      duration: 1.2,
      ease: 'power2.in',
    },
    68.8
  );
  tl.set(accessories.caseGroup, { visible: false }, 70);

  // -------------------------------------------------------------------
  // BEAT 02: EARBUDS (70 -> 73)
  // -------------------------------------------------------------------
  tl.set(accessories.earbudSystemGroup, { visible: true }, 70);
  accessories.earbudSystemGroup.scale.set(0.001, 0.001, 0.001);

  // Case pops into stage
  tl.to(
    accessories.earbudSystemGroup.scale,
    {
      x: 1,
      y: 1,
      z: 1,
      duration: 0.6,
      ease: 'back.out(1.2)',
    },
    70
  );

  // Lid hinges open 70 degrees (70.3 -> 71.0)
  const earbudState = { lidDeg: 0, orbitT: 0 };
  tl.to(
    earbudState,
    {
      lidDeg: 70,
      duration: 0.7,
      ease: 'power2.out',
      onUpdate: () => {
        accessories.setLidAngle(earbudState.lidDeg);
      },
    },
    70.3
  );

  // Earbuds float out and orbit (70.6 -> 72.3)
  tl.to(
    earbudState,
    {
      orbitT: 4.0,
      duration: 1.7,
      ease: 'sine.inOut',
      onUpdate: () => {
        accessories.setEarbudsOrbit(earbudState.orbitT);
      },
    },
    70.6
  );

  // Lid closes (72.2 -> 72.7)
  tl.to(
    earbudState,
    {
      lidDeg: 0,
      duration: 0.5,
      ease: 'power2.in',
      onUpdate: () => {
        accessories.setLidAngle(earbudState.lidDeg);
      },
    },
    72.2
  );

  // Earbuds case scales to 0 and exits (72.6 -> 73.0)
  tl.to(
    accessories.earbudSystemGroup.scale,
    {
      x: 0.001,
      y: 0.001,
      z: 0.001,
      duration: 0.4,
      ease: 'power2.in',
    },
    72.6
  );
  tl.set(accessories.earbudSystemGroup, { visible: false }, 73);

  // -------------------------------------------------------------------
  // BEAT 03: CHARGER BRICK (73 -> 77)
  // -------------------------------------------------------------------
  tl.set(accessories.chargerGroup, { visible: true }, 73);
  accessories.chargerGroup.scale.set(0.001, 0.001, 0.001);
  accessories.chargerGroup.rotation.set(0.2, -0.4, 0.1);

  tl.to(
    accessories.chargerGroup.scale,
    {
      x: 1,
      y: 1,
      z: 1,
      duration: 0.6,
      ease: 'back.out(1.2)',
    },
    73
  );

  tl.to(
    accessories.chargerGroup.rotation,
    {
      x: 0.35,
      y: 0.45,
      z: 0.05,
      duration: 3.4,
      ease: 'sine.inOut',
    },
    73.6
  );

  // -------------------------------------------------------------------
  // BEAT 04: CABLE & CHARGE (77 -> 80)
  // -------------------------------------------------------------------
  // Phone scales down and prepares for WiFi scene (76 -> 80)
  tl.to(
    phone.group.position,
    {
      x: wifiPhoneX,
      y: wifiPhoneY,
      z: 0.20,
      duration: 4,
      ease: 'power2.inOut',
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
      ease: 'power2.inOut',
    },
    76
  );

  tl.to(
    phone.group.rotation,
    {
      y: 0.15,
      x: 0.05,
      z: 0.0,
      duration: 4,
      ease: 'power2.inOut',
    },
    76
  );

  // Cable draws itself from charger to phone port (77 -> 79.5)
  tl.set(accessories.cableGroup, { visible: true }, 77);
  const cableState = { progress: 0 };
  tl.to(
    cableState,
    {
      progress: 1,
      duration: 2.5,
      ease: 'power2.out',
      onUpdate: () => {
        accessories.setCableProgress(cableState.progress);
      },
    },
    77
  );

  // All accessories scale to 0 and leave frame by 80
  tl.to(
    accessories.chargerGroup.scale,
    {
      x: 0.001,
      y: 0.001,
      z: 0.001,
      duration: 0.6,
      ease: 'power2.in',
    },
    79.4
  );

  tl.to(
    accessories.cableGroup.scale,
    {
      x: 0.001,
      y: 0.001,
      z: 0.001,
      duration: 0.6,
      ease: 'power2.in',
    },
    79.4
  );

  tl.set(accessories.chargerGroup, { visible: false }, 80);
  tl.set(accessories.cableGroup, { visible: false }, 80);
  tl.set(accessories.group, { visible: false }, 80);
}
