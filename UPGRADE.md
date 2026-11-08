# DATA: upgrade brief v2

Read SPEC.md first, then this file. Where they conflict, this file wins.
Work on ONE package at a time, only when told "Execute package Un only". After each package: run the QA protocol (section Q), commit with message "Un done", and stop. Do not touch anything outside the package. Do not regress what already works.

## Findings from the v1 review (frames from a 20s screen recording, 960x540)
1. Hero (0-3s): the phone fills about 20% of the frame width and sits dark on dark; the headline is larger than the phone, so the phone is not the focal point. Nothing moves for the first 4 seconds.
2. Teardown (4-9s): parts read as flat slabs (a large dark back-cover slab at the right edge, a muddy olive slab at 6s). No part has a distinct silhouette or material, and there is no focal hierarchy.
3. Labels (6-9s): at 8-9s the label says "Camera" while the camera is on the back and the camera shows the front lock screen. A ghost "Port" label overlaps "Camera" at 8s. Leader lines are long and end at arbitrary points. Each label lives about 1 second.
4. The lock screen shows a hard-coded weekday ("Friday, November 8"); the real date is not Friday. Use the live date.
5. Rebuild (10-11s): "Fixed." is a good payoff, but the phone is seen side-on with grey slabs floating beside it, so it does not read as a closed phone. There is no "click" moment.
6. Accessories (12-13s): the heading sits mid-frame, the earbud case and the cable overlap it; the objects are crude (cable like a rod, case like an empty outline). Text alignment differs from the other scenes.
7. WiFi (14-15s): clearly better. Rings clip under the top nav at 15s; the router is the brightest object on the page and breaks the dark palette.
8. Finale (16-20s): the phone is small, the right and bottom of the frame are empty, the primary CTA is about 12% of the frame width, and the last 4 seconds are static. The last frame is not poster-worthy.

## Overrides to SPEC.md
- Progress map v2 (replaces SPEC section 5 labels). Spacer: 1200vh desktop, 1000svh mobile.
  - hero 0.00-0.07; open 0.07-0.20
  - inspect 0.20-0.56 with five windows: 01 Battery 0.20-0.27, 02 Board 0.27-0.34, 03 Camera 0.34-0.41, 04 Port 0.41-0.48, 05 Screen 0.48-0.56
  - rebuild 0.56-0.66
  - accessories 0.66-0.80: Case 0.66-0.70, Earbuds 0.70-0.73, Charger 0.73-0.77, Cable 0.77-0.80
  - wifi 0.80-0.91; finale 0.91-1.00 (nothing changes from 0.96 except idle motion)
- Post-processing is allowed on the high tier only (see U4). SPEC's "no post-processing" no longer applies to desktop.
- Budgets: draw calls at most 150 desktop and 80 mobile; at most 100k triangles on mobile; JS at most 450 kB gzipped.
- Every visible string lives in a `copy` object in src/config.js. Every claim in it carries the comment `// DUMMY: confirm with shop`. Remove the words "fiber" and "premium" everywhere.
- Use `scene.environmentIntensity` for environment strength (per-material envMapIntensity does not affect scene.environment in current three.js).

## Layout contract (all scenes, all packages)
- Desktop (width at least 1024): text column occupies x from 0 to 38vw, aligned left in every scene. The 3D stage is the right 58vw. The projected scene center is shifted into the stage with `camera.setViewOffset`, recomputed on resize. No 3D object may overlap the text column except while entering or exiting.
- Portrait mobile: the 3D stage is the top 58svh (phone at most 46svh tall); text is anchored at the bottom with 20px padding plus safe-area inset.
- One idea per scene: one heading, at most one supporting line, at most one list.

## U1. Foundations
1. `window.__seek(p)`: scrolls to progress p (0-1), waits two animation frames, resolves. `?debug=1` shows a HUD (progress, fps, draw calls, triangles, tier). `?tier=0|1|2` forces a quality tier (0 = high desktop, 1 = desktop no bloom, 2 = mobile/low).
2. Split choreography into `src/scenes/{hero,teardown,rebuild,accessories,wifi,finale}.js`, each exporting `build(tl, ctx)`. Apply the progress map v2 and the layout contract.
3. Move all copy into `copy` in config.js. Add `HOURS = { open: 10, close: 22, tz: 'Asia/Karachi' }` and a helper `getOpenStatus()` returning `{ open: bool, label: 'Open now · until 10 PM' | 'Closed · opens 10 AM' }`.
4. Lock screen: draw the live time and date in Asia/Karachi using `Intl.DateTimeFormat`; redraw the texture at most once per minute. No hard-coded weekday.
Acceptance: QA passes with no visual changes other than the layout contract and the date fix.

## U2. Hero and preloader
1. Preloader, at most 1.8s: characters D A T A rise through masks (SplitText), a 1px accent line draws left to right with a mono counter 000 to 100, then the hero is revealed by a clip-path wipe upward. Wait for fonts and `renderer.compileAsync` before the reveal so there is no first-frame hitch.
2. Hero phone height is 62% of viewport height, centered in the stage. Headline `clamp(2.75rem, 7vw, 7.5rem)`, three lines, supporting line at most 8 words, plus a status chip from `getOpenStatus()` with a pulsing accent dot.
3. Light sweep on reveal: animate `scene.environmentRotation.y` from -0.7 to +0.4 over 2.4s (`expo.out`) while the rim light pulses from 2x to 1x intensity.
4. Idle: float and slow yaw. Desktop pointer tilt up to 6 degrees via `gsap.quickTo`. Touch: slow 8 degree sway.
5. The DATA watermark moves at 0.4x scroll speed at opacity 0.05.
Acceptance: the frame 3 seconds after load looks composed; the phone's edge is clearly separated from the background by the rim light.

## U3. Teardown: parts and cinematics
Parts (all procedural):
- Use `RoundedBoxGeometry` (three/addons) with 5 segments for frame, battery and screen so edges catch light.
- Frame: brushed look from a 256x256 procedural roughness map.
- Board: 512x512 CanvasTexture trace map (base #0F1A14, gold traces #B89B4A, via pads, two shield cans), 10-12 chips of different heights with metal tops, one printed "DATA".
- Battery: canvas label (silver foil stripe, mono text lines, accent corner) plus a gold connector tab #C9852B.
- Screen: black glass with a faint reflection streak on the front; on the back a dark panel with a copper flex-cable strip (no texture, so nothing can appear mirrored).
- Keep the camera unit and edge outlines (accent, opacity 0.35).
Choreography:
- Open (0.07-0.20): the camera orbits to a back view (yaw -18, pitch 8 degrees). The back cover slides forward 1.4 units, rotates 6 degrees, and leaves the frame instead of staying as a slab. Remaining parts separate with stagger.
- Inspect: the camera follows a `CatmullRomCurve3` through five keyframes, looking at the active part's world position. Active part: scale 1.04, outline opacity 0.9. Inactive parts: color lerped 70% toward #0B0B0C.
- Order 01 Battery, 02 Board, 03 Camera, 04 Port, 05 Screen. In window 05 the camera flips to the front and shows the lock screen.
- Index rail on the left edge: 01-05 in DM Mono, the active item in accent with a growing 1px line. At the part anchor a numbered marker; an elbow leader line (24px horizontal, then diagonal, 1px) to the label. Label: title `clamp(2rem, 3.5vw, 3.5rem)`, one body line, no filled box.
- A label shows only if the part faces the camera (dot product of part normal and view direction above 0.2). Hide the previous label completely 0.01 progress before the next appears; no ghosts.
Acceptance: no label ever points at an unseen part; no overlapping labels; no part clipped at the viewport edge except the cover while leaving.

## U4. Lighting, post-processing, scroll velocity (high tier only)
1. Studio environment: build it with `PMREMGenerator.fromScene` from a small dark room containing three emissive softbox planes (large key top-left, narrow strip right, small kicker bottom). Replace RoomEnvironment. `scene.environmentIntensity = 1.0`.
2. Tier 0 composer: RenderPass, UnrealBloomPass (strength 0.35, radius 0.6, threshold 0.85), one custom ShaderPass (vignette 0.35, animated grain 0.04, chromatic aberration), OutputPass last, with 1/255 dither in the shader to prevent banding. Tier 1: no bloom. Tier 2 and all touch devices: no composer.
3. Scroll velocity from Lenis (desktop) or `ScrollTrigger` `getVelocity()` (touch), smoothed with `gsap.quickTo`. It drives chromatic aberration (clamped at 0.0025), camera roll up to 1.2 degrees, and phone tilt up to 3 degrees. Zero when idle. Touch: effects halved.
4. Contact shadow: two layers (tight dark, wide soft) that widen as the phone lifts.
Acceptance: `?tier=` switches cleanly; mobile draw calls unchanged; no banding in the background vignette.

## U5. Rebuild: the click
1. Parts converge in reverse order with `power4.in`. At contact (progress 0.60): phone scale punch 1.0, 1.03, 1.0 over 0.015 progress; an additive accent ring expands from 0 to 3 units while fading 0.7 to 0; outlines flash to opacity 1 and fade; the screen flashes white at 0.2 opacity, then shows the boot logo, then "Fixed." with a check mark drawn stroke by stroke.
2. The camera pulls back and settles at a 3/4 front view (yaw 25 degrees). After reassembly exactly one phone exists: at p=0.62 every part position equals its rest position within 0.001.
3. Headline "Fixed." animates word by word; supporting line follows.
Acceptance: no leftover slabs at p=0.62-0.66.

## U6. Accessories (four beats, one index rail: 01 Cases, 02 Earbuds, 03 Chargers, 04 Cables)
- Case: a rounded-rectangle shell built with `ExtrudeGeometry` from a `Shape` with a hole, slightly larger than the phone, with a lime inner edge. It slides onto the phone from behind at the start of its window and slides off at the end.
- Earbuds: a capsule case whose lid hinges open 70 degrees; two earbuds float out and orbit; accent LED.
- Charger: rounded-box brick with two metal prongs.
- Cable: a `TubeGeometry` (radius 0.02) that draws itself from the charger to the phone's port by animating the index `setDrawRange`; the phone screen shows a bolt and a percentage counting 12 to 100.
- Layout contract applies: text left, objects in the stage.
Acceptance: no object overlaps the heading at any progress in 0.66-0.80.

## U7. WiFi
1. Router: matte #1A1B1E body, two jointed antennas, three accent LEDs. LED count 1, 2, 3 follows the highlighted plan (Home, Family, Max); the plan row gets an accent left bar. Router height 28-32% of viewport height; phone 22%.
2. Four accent rings, looping. Maximum ring size is capped so no ring passes under the top nav.
3. Data pulses: a `Points` system of up to 40 points (12, 24, 40 by plan) travelling along a `QuadraticBezierCurve3` from router to phone, additive blending.
4. The phone shows a speed readout counting up to the plan speed with signal bars.
Acceptance: the router is the focal object; nothing overlaps the heading or plan lines.

## U8. Finale and footer
1. The camera pulls back to a wide composition: the phone in the stage zone, router and accessories small and orbiting far away.
2. Oversized `DATA` wordmark at the bottom, `font-size: 34vw`, about 65% visible, fill `--bg-2`, 1px stroke at rgba(242,239,232,0.12). On pointer move (desktop) the letters light accent near the cursor via a CSS mask following the pointer.
3. Primary CTA: min-height 64px, min-width 280px on desktop (full width minus 40px on mobile), 18px text, magnetic on desktop, wa.me link with the prefilled message. A secondary `tel:` link (dummy number).
4. Status chip from `getOpenStatus()`, refreshed every minute.
5. One-line marquee in DM Mono "MOBILES · REPAIRS · ACCESSORIES · HOME WIFI ·" at 40px/s; direction follows scroll direction; paused under reduced motion.
6. Footer line: © 2026 DATA, address, hours, "Back to top".
Acceptance: the last frame shows the phone, the wordmark and the CTA together at 1440x900 and 390x844 without scrolling further.

## U9. Mobile composition pass
- Per scene at 390x844: stage top 58svh, text bottom. The index rail becomes a five-dot horizontal indicator above the text. A short 1px stem replaces the leader line. The finale CTA sits in the bottom 20svh within thumb reach; the floating WhatsApp button hides in the finale.
- Touch: native scrolling, velocity effects halved, no cursor, no bloom.
- Test 360x740, 390x844, 412x915, 768x1024 and landscape 844x390 (compress text, keep the stage readable).

## U10. Final QA and handoff
1. Full QA protocol; fix everything it finds.
2. README: how to edit content (copy, number, hours, plans), build and deploy steps, and a list of everything that is dummy.
3. `og-image.png` 1200x630 from a hero screenshot, under 200 kB; add the Open Graph tags.
4. Report p95 frame time during a scripted scroll 0 to 1 over 8 seconds, at the default tier and at tier 2 with 4x CPU throttling if the browser tool supports it.

## Q. QA protocol (after every package)
Use `window.__seek(p)` with the browser tool at 1440x900 and 390x844. Capture at progress 0.03, 0.10, 0.17, 0.23, 0.30, 0.37, 0.44, 0.52, 0.59, 0.62, 0.68, 0.72, 0.75, 0.79, 0.84, 0.88, 0.94, 1.0. For each capture check: nothing overlaps the text column; no mirrored text; no label pointing at an unseen part; no ghost labels; no unintended clipping. Report console errors and warnings (must be 0), max draw calls, triangle count, and average frame time. Fix first, then report.
