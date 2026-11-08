# DATA: teardown scene v3 (realism brief)

Read SPEC.md, then UPGRADE.md, then this file. This file replaces package U3 of UPGRADE.md entirely; everything else in those files still applies (progress map v2, layout contract, budgets, QA protocol). If U1 is not done yet, keep the existing scroll windows and tell me.
Work in two parts. "Execute Part T1 only" or "Execute Part T2 only". After each part: QA, commit ("T1 done" / "T2 done"), stop.

## Goal
A repair-shop teardown that feels filmed, not animated: a real layer stack, real materials, parts that are connected by cables that stretch, and tools that do the work. Every detail below exists on a real phone. Lime accent is used only for labels, markers and the active part's outline, never as a material color.

## Real anatomy (layer stack, outermost first, drives z-order)
1. Back cover (glass) with an adhesive strip ring on its inner edge.
2. Cover plate (dark plastic, 12 Phillips screws) carrying a copper wireless-charging coil and an NFC loop, bonded to its underside, with a flex tail to the board.
3. Internals: board with shield cans, chips and connectors; camera unit on the board; battery with two white pull tabs; bottom assembly with USB-C port, speaker and vibration motor; amber flex cables joining them.
4. Midframe (aluminium frame with screw bosses and antenna split lines).
5. Display (OLED panel, graphite film behind it, copper tape strip, flex tail that folds around the bottom edge).

## PART T1: geometry, materials, static exploded view

### Geometry (all procedural, merged per part where materials match)
- Frame, battery, display, cover: `RoundedBoxGeometry` (three/addons), 5 segments. Bevels must catch light.
- Phillips screws: two `InstancedMesh` objects (steel head 0.018 radius, 0.01 tall; dark cross made of two thin boxes). 12 on the cover plate, 6 on the board, each with a boss on the frame.
- Copper coil: a spiral `TubeGeometry` of 8 turns (radius 0.004, 160 tubular and 6 radial segments; 80 and 4 on mobile) on a thin dark flex pad, plus an NFC loop.
- Board: PCB slab, 3 shield cans (thin metal boxes with a dot-grid bump map), 10-12 chips of different heights with metal top edges, 4 connector blocks (black body, gold pins).
- Camera unit: raised plate, 3 lens barrels, metal rings, dark glass domes.
- Battery: rounded slab with a sleeve label and two white stretch-release pull tabs hanging off the bottom edge.
- Bottom assembly: sub-board, USB-C port (metal shell, dark inner slot), speaker grille with a hole pattern, a small vibration motor cylinder.
- Flex ribbons (`FlexRibbon` class): `PlaneGeometry(width, 1, 24, 1)` re-positioned on a `QuadraticBezierCurve3` between two anchors with a sag; amber polyimide material; connector blocks at both ends. Updated only when scroll progress changes (dirty flag), no per-frame allocations. Ribbons: board-battery, board-port, board-display (folded), plate-board.
- Tools: spudger (thin black plastic pry tool, two boxes) and a precision Phillips screwdriver (knurled 24-sided handle, steel shaft, cross tip).

### Materials (PBR)
- Frame: color #9A9DA5, metalness 1.0, roughness 0.32, brushed look from a 256x256 procedural roughness map.
- Back glass: desktop `MeshPhysicalMaterial` (clearcoat 1, clearcoatRoughness 0.08, roughness 0.2, color #15161A); mobile `MeshStandardMaterial` roughness 0.2. Only this one mesh may use `MeshPhysicalMaterial`. No transmission anywhere.
- Copper: #B87333, metalness 1, roughness 0.28.
- PCB: base #0E1912, roughness 0.55, with a 512x512 CanvasTexture of gold traces #C9A24D, via pads and silkscreen lines.
- Shield cans: #8E9196, metalness 1, roughness 0.45. Chips: #0A0A0B, roughness 0.6; one chip carries tiny laser-etched "DATA".
- Flex ribbons: #C8791F, roughness 0.5. Pull tabs: #E9E7E0, roughness 0.85. Adhesive strip: #D8D5CC, roughness 0.9.
- Screws: #A8ABB2, metalness 1, roughness 0.35. Graphite film: #3A3B40, roughness 0.7.
- Procedural textures are generated once on canvas, cached, at most 512px (256px on mobile), total texture memory under 12 MB, disposed on teardown.

### Debug view for QA
`?explode=0..1&part=battery|board|camera|port|screen|cover` freezes the scene at that explode amount with the camera framed on the part. T1 acceptance is judged with it.

### T1 acceptance
- At `?explode=0` the phone is closed and indistinguishable from the hero phone.
- At `?explode=1` every layer is visible, ordered by the layer stack, and none intersect.
- Draw calls at most 60 on mobile with the teardown fully exploded; triangles at most 100k on mobile.
- Console 0 errors.

## PART T2: choreography, camera, labels

### Act A: Open (0.07-0.20)
- 0.07-0.10: the camera pushes in 8%, orbits to a back view (yaw -18, pitch 8 degrees) with 2 degrees of roll. The spudger enters at the bottom-left seam and slides along it.
- 0.10-0.13: the back cover peels. Pivot at its top edge, so it lifts from the bottom up to 35 degrees (the adhesive strip visibly stretching), then detaches.
- 0.13-0.15: the cover drifts toward the camera and to the right, rotating 12 degrees, and leaves the frame. The copper coil and the cover plate catch the light.
- 0.15-0.19: the screwdriver visits three screw clusters. At each, the screws spin out (4 turns) while rising 0.3 units, then settle as a loose floating group.
- 0.19-0.20: the cover plate with coil lifts, tilting 25 degrees, and exits to the left. Its ribbon disconnects with a small connector pop (0.01 progress scale punch on the connector).
- Remove the screwdriver and spudger from the frame by 0.19 / 0.15.

### Act B: Inspect (0.20-0.56), one part per window as in UPGRADE.md
For the active part:
- It pulls toward the camera by 0.35 units, rotating to show its best face (battery: 20 degrees around y to show the pull tabs; board: tilted to rake light across the shield cans; camera: to show the lens rings; port: tilted to show the slot; screen: the camera flips to the front).
- The camera tightens `fov` from 40 to 30 and moves in; other parts recede 0.4 units in z and dim 70% toward #0B0B0C.
- Connected flex ribbons stretch and re-curve as the part moves.
- Outline: only the active part gets an accent outline (opacity 0 to 0.9 and back). No outlines on inactive parts.
- Inspection light: one `SpotLight` (no shadows; angle 0.5, penumbra 0.8, intensity ramped) follows the active part from the upper left. Disabled on mobile.
- Depth: `scene.fog = new THREE.FogExp2(0x0B0B0C, 0.18)` so far parts fade into the dark. Handheld feel: add a micro camera drift (sum of two sines, amplitude 0.002 units, different periods on x and y), halved on touch.

### Labels and copy (per UPGRADE.md layout contract and index rail)
Each label: number, title, one body line, and two symptom tags in DM Mono (outlined chips, 1px). All text in `copy` in config.js with `// DUMMY: confirm with shop`.
- 01 Battery: "Drains fast", "Swollen"
- 02 Board: "No power", "Water damage"
- 03 Camera: "Blurry", "Cracked lens"
- 04 Port: "Won't charge", "Loose cable"
- 05 Screen: "Cracked", "Dead touch"
A label is shown only if its part faces the camera (dot product of part normal and view direction above 0.2). The previous label is fully hidden 0.01 progress before the next one appears.

### Performance rules
- Screws and tools through instancing or merged geometry; one `matrixWorld` update per changed object per scroll change.
- Ribbons update only when progress changes.
- Tier 2 (mobile): coil radial segments 4, no cross on screws (flat dark dot texture), no bump maps, no SpotLight, no fog density change over frames.

### T2 acceptance: expected frames (check with `window.__seek`)
| Progress | What must be visible |
|---|---|
| 0.09 | Spudger at the seam, cover still closed |
| 0.12 | Cover mid-peel, adhesive strip stretched |
| 0.14 | Cover leaving the frame, coil and plate visible |
| 0.17 | Screwdriver over a screw cluster, screws in the air |
| 0.19 | Plate lifting off with the coil on its underside |
| 0.23 | Battery pulled toward camera, pull tabs and stretched ribbons visible, others dimmed |
| 0.30 | Board close-up, shield cans catching a streak of light |
| 0.37 | Camera unit, three lens rings readable |
| 0.44 | USB-C port slot readable |
| 0.52 | Camera has flipped, display front visible with the lock screen |
- No label points at an unseen part; no ghost labels; no part cropped at the viewport edge except when leaving.
- Hand the scene to the rebuild with every part's position stored so U5 can reverse it exactly.
- Run the QA protocol at 1440x900 and 390x844. Report draw calls and triangle counts at progress 0.12, 0.23, 0.30.
