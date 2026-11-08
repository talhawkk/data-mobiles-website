# DATA: site spec

Single source of truth. Re-read this file fully before every task. If a request in chat conflicts with this file, say so and ask; do not silently deviate.

## 0. Purpose
One-page site for DATA, a neighbourhood shop in Lahore that sells phone accessories, repairs phones, and provides local WiFi.
- Within 5 seconds the visitor should think "this shop is serious". Within 60 seconds they should tap the WhatsApp button.
- Visitors: ordinary customers on mid-range Android phones (portrait, 360-412px wide), and the owner showing it on a laptop.
- Language: all text English, Latin script only. The brand is written exactly `DATA`.
- Content is deliberately tiny. The 3D scroll experience is the product. Maximum 8 words per heading, 12 words per supporting line.

## 1. Concept
One persistent 3D scene. A single fixed WebGL canvas sits behind all content for the entire scroll. A phone is the only protagonist. Scrolling moves one continuous camera shot:
idle phone -> back cover slides off -> parts float apart -> camera travels through the parts -> parts snap back -> screen boots and says "Fixed." -> camera pans to accessories -> router with signal rings -> pull back to the contact lines.
No hard cuts. No section background may hide the canvas. No second canvas.

## 2. Stack and structure
- Vite, vanilla JS (ES modules), no UI framework.
- npm packages, exact versions pinned: `three`, `gsap` (3.x; ScrollTrigger and SplitText are free and included), `lenis`, `@fontsource-variable/bricolage-grotesque`, `@fontsource/dm-mono`. No CDNs.
- `npm run build` produces a static `dist/`. README with deploy steps for Cloudflare Pages and GitHub Pages.
- Layout:
  - `src/config.js`, `src/main.js`, `src/scroll.js`
  - `src/gl/renderer.js, phone.js, lighting.js, accessories.js, wifi.js, quality.js`
  - `src/ui/preloader.js, overlay.js, cursor.js, nav.js`
  - `src/styles/tokens.css, base.css, overlay.css`

## 3. Dummy data (only in `src/config.js`, clearly marked DUMMY)
- WHATSAPP_NUMBER `923001234567`, prefilled message "Hi DATA, I need help with my phone."
- ADDRESS `Shop 12, Main Market, Lahore`, HOURS `10 AM - 10 PM, daily`
- SERVICES: Screen, Battery, Charging port, Camera, Board repair
- WIFI_PLANS: Home 10 Mbps / Rs. XXX, Family 20 Mbps / Rs. XXX, Max 50 Mbps / Rs. XXX
- ACCESSORIES: Cases, Chargers, Cables, Earbuds

## 4. Visual system
Colors (CSS variables): `--bg #0B0B0C`, `--bg-2 #141416`, `--text #F2EFE8`, `--muted #8C8A84`, `--accent #C8FF2E` (the only accent).
Type: Bricolage Grotesque variable for display and body (display weight 800, letter-spacing -0.04em, line-height 0.88). DM Mono for labels (12-13px, uppercase, letter-spacing 0.12em). Two families only.
Scale: wordmark `clamp(6rem, 28vw, 30rem)`; headings `clamp(2.5rem, 7vw, 7rem)`; body 1-1.125rem.
Layout: 12-col grid on desktop (40px gutter), 4-col on mobile (20px gutter). Text sits at the edges; the phone owns the center.
Texture: static film-grain overlay (tiled noise, opacity 0.06, pointer-events none) and a radial vignette over the canvas.
Banned: purple or blue gradients, glassmorphism, drop-shadow cards, icon-in-circle grids, emoji, stock photos, lorem ipsum, placeholder boxes, and any text telling the user to click, drag, or scroll for 3D. The only scroll cue allowed is a 1px animated line, no words.

## 5. Motion language
- Exactly three easings: `expo.out` for entrances, `power3.inOut` for movement between states, `none` for scrubbed timelines (smoothing comes from `scrub: 0.8`).
- Durations: UI reveals 0.9s; text line reveals 1.1s with 0.06s stagger; preloader at most 1.8s total.
- Text: SplitText lines inside overflow-hidden masks sliding from `yPercent: 110`; the wordmark animates per character.
- Scroll architecture:
  - The canvas and all overlay text are `position: fixed`. A tall `#scroll-spacer` (900vh desktop, 700svh mobile) creates the scroll distance.
  - ONE master GSAP timeline, driven by ONE ScrollTrigger on the spacer, controls camera, phone parts, and overlay text. No `pin` anywhere.
  - Timeline labels: `hero` 0-0.10, `open` 0.10-0.28, `inspect` 0.28-0.52, `rebuild` 0.52-0.66, `accessories` 0.66-0.78, `wifi` 0.78-0.90, `contact` 0.90-1.00.
- Never use `addEventListener('scroll')` or your own `requestAnimationFrame` loop. The render loop is `gsap.ticker`.
- Lenis (desktop only, see section 8) is wired exactly like this: `lenis.on('scroll', ScrollTrigger.update)`, `gsap.ticker.add(t => lenis.raf(t * 1000))`, `gsap.ticker.lagSmoothing(0)`.
- Idle motion: phone floats `y +/- 0.04` on a 4s sine and rotates `0.1 rad/s` while not scrolling.
- Desktop pointer: camera parallax of +/-2 degrees through `gsap.quickTo`.

## 6. 3D build
Renderer: `WebGLRenderer({ antialias: !isMobile, powerPreference: 'high-performance' })`, sRGB output, ACESFilmic tone mapping at exposure 1.0, `setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2))`.
No shadow maps: use a blurred radial-gradient plane under the phone as a contact shadow. No post-processing in v1.
Lighting (max 2 lights, no shadows): `RoomEnvironment` through PMREMGenerator as env map (intensity 0.8); a warm-white key DirectionalLight (intensity 2.2, top-left-front); a rim DirectionalLight in `#C8FF2E` (intensity 3, back-right).
Materials: do NOT use `transmission`. Glass is faked with a dark glossy `MeshStandardMaterial` plus the env map. `MeshPhysicalMaterial` (clearcoat) is allowed on at most one mesh (the back cover), desktop only; on mobile use `MeshStandardMaterial`.

Phone (procedural, unbranded). Separate named groups: `frame`, `screen`, `backCover`, `cameraUnit`, `battery`, `board`, `port`.
- frame: rounded box 0.72 x 1.52 x 0.08, corner radius 0.09, metalness 1.0, roughness 0.28, color `#8D9098`.
- screen: plane with a 512x1056 CanvasTexture on a `MeshBasicMaterial`. The canvas is redrawn for four states: off, boot (DATA logo), lock screen (clock), "Fixed." (accent text on black), plus a WiFi-bars state.
- backCover: rounded slab, color `#17181B`, roughness 0.18.
- cameraUnit: raised rounded plate with 3 lens cylinders (dark glass, metal ring).
- battery: rounded box 0.5 x 0.8 x 0.03; board: thin box with at most 12 chips merged into one geometry; port: small capsule.
- Merge static sub-geometries wherever materials match. Total draw calls at most 60 on mobile.
Exploded view: each part has `rest` and `exploded` z positions (backCover +1.2, cameraUnit +0.7, battery +0.45, board +0.25, screen -0.35) with at most 4 degrees of rotation drift.
Labels: HTML elements positioned each frame by projecting a per-part anchor to screen space with one reused Vector3 (no per-frame allocations). A 1px accent line connects part to label. One label visible at a time.

Accessories scene (procedural): charger brick (rounded box + 2 prongs), cable (`TubeGeometry` on a `CatmullRomCurve3`, radius 0.02), earbud case (rounded capsule), phone case (rounded frame). Each floats and orbits at a different speed and scales in from 0 with `expo.out`.
WiFi scene (procedural): router (rounded box 1.1 x 0.16 x 0.7, 2 antenna cylinders, 3 accent LEDs blinking), 4 thin torus rings scaling 1 -> 4 while fading 0.6 -> 0, staggered and looping (`MeshBasicMaterial`, transparent, `depthWrite: false`).
Contact: objects settle to the edges, the camera pulls back by 2.5 units, the phone shows the DATA boot screen.

## 7. Overlay copy (dummy, short)
- Preloader: counter 0 -> 100 and the letters D A T A assembling.
- Hero: giant `DATA` wordmark behind the phone, plus `Mobiles. Repairs. WiFi.`
- Inspect labels: Screen "Cracked? Replaced today." / Battery "Full day power again." / Port "Charges like new." / Camera "Sharp again." / Board "Dead phone? We try."
- Rebuild: `Fixed.` plus `Most repairs, same day.`
- Accessories: `Everything it wears.` plus the four category names.
- WiFi: `Fast WiFi. No drama.` plus 3 plan lines from config.
- Contact: `Tell us what's broken.`, a large `Chat on WhatsApp` button, address, hours, a Google Maps link.
- Always on: top bar with `DATA` wordmark + 3 anchor links, floating WhatsApp button, scroll progress line.

## 8. Mobile (portrait first)
- Design at 390x844 first, then verify 360x740 and 412x915, then 1440x900 and 1920x1080.
- Canvas size comes from `window.innerWidth/innerHeight` at load. On resize, ignore height-only changes under 150px (address bar showing or hiding); call `renderer.setSize` only on a width change or orientation change.
- `ScrollTrigger.config({ ignoreMobileResize: true })`. No pin anywhere. If a jump still appears on touch, enable `ScrollTrigger.normalizeScroll(true)` only when `ScrollTrigger.isTouch === 1`, then re-test.
- Lenis only when `(pointer: fine)`. Touch devices use native scrolling.
- Portrait camera: if aspect < 1, set fov 50 and distance so the phone is 62% of viewport height. Labels sit at the bottom (12svh), left aligned.
- Tap targets at least 48px. The floating WhatsApp button is 56px, bottom-right, respecting `env(safe-area-inset-bottom)`.
- No effect may depend on hover. The custom cursor exists only on `(pointer: fine)`.
- Use `svh`/`dvh` units, never `vh`, for layout.

## 9. Performance and fallbacks
- Budgets: draw calls at most 100 desktop and 60 mobile; at most 100k triangles on mobile; at most 2 font files (woff2, `font-display: swap`); no image over 100 kB; JS target at most 400 kB gzipped.
- Adaptive quality (`quality.js`): rolling average of the last 60 frame times. If above 22ms, step down: DPR 1.5 -> 1.25 -> 1.0, then disable the rim light, then freeze idle motion. Never step back up.
- Pause rendering when `document.hidden` or the canvas is not intersecting. Dispose geometries, materials, textures on teardown.
- `prefers-reduced-motion` or no WebGL2: no scrub, a static composition with the same overlay sections as normal scrolling blocks and a CSS-drawn phone silhouette.

## 10. Meta, accessibility, WhatsApp
- `lang="en"`, title `DATA | Mobiles, Repairs & WiFi, Lahore`, description, Open Graph tags, `theme-color #0B0B0C`, SVG favicon (accent "D" on dark), JSON-LD LocalBusiness from config.
- WhatsApp link: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(prefill)}` (number in international format, digits only). Magnetic hover on desktop.
- All overlay text is real DOM text; canvas is `aria-hidden`; visible focus ring (2px accent); contrast at least 4.5:1.

## 11. Definition of done (run before saying a phase is finished)
With the browser tool at 390x844 and 1440x900, capture screenshots at scroll progress 0, 0.08, 0.2, 0.35, 0.5, 0.6, 0.72, 0.84, 0.97. Check for each: text readable, nothing clipped, no label overlapping the phone's screen, no object floating off-canvas. Console must show 0 errors and 0 warnings. Report average frame time and draw-call count (`renderer.info.render.calls`). Fix problems first, then report.
