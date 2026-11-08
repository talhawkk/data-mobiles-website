# DATA — WebGL Scroll Experience (Lahore)

A bespoke, production-grade 3D scroll website for **DATA**, an unbranded phone shop, precision repair lab, and local WiFi hub in Main Market, Gulberg, Lahore. Built in vanilla JavaScript and Three.js with hardware-accelerated GSAP timelines, post-processing pipelines, procedural geometry, and responsive layout choreography.

---

## 1. How to Edit Content

All client-facing copy, hours, phone numbers, and plans live in a single centralized source of truth: **[`src/config.js`](file:///D:/Work/Website/src/config.js)**.

### A. WhatsApp & Contact Number
In `src/config.js`:
```javascript
export const WHATSAPP_NUMBER = '923001234567'; // 12-digit number without '+' or leading '0'
export const PHONE_DISPLAY = '+92 300 1234567';
```
Changing `WHATSAPP_NUMBER` automatically updates all WhatsApp CTA links with prefilled messages throughout the site.

### B. Business Hours & Live Status Chip
In `src/config.js`:
```javascript
export const HOURS = {
  open: 10,       // 10:00 AM (24-hour format)
  close: 22,      // 10:00 PM (24-hour format)
  tz: 'Asia/Karachi',
};
```
The live status chip in both the hero and finale automatically calculates whether the shop is open right now in Karachi timezone using `Intl.DateTimeFormat`, updating live every minute.

### C. Home WiFi Plans
In `src/config.js` under `copy.wifi.plans`:
```javascript
plans: [
  { name: 'Home', speed: '10 Mbps', price: 'Rs. 1,500' },
  { name: 'Family', speed: '20 Mbps', price: 'Rs. 2,500' },
  { name: 'Max', speed: '50 Mbps', price: 'Rs. 4,000' },
]
```
The 3D router LEDs, signal pulses, and phone screen speed meter automatically adapt to these plans.

### D. Headings and Section Copy
In `src/config.js`, edit the `copy` object:
- `copy.hero`: Eyebrow, main headline, and subline.
- `copy.inspect`: Titles, body descriptions, and symptom tags for the 5 teardown parts (Battery, Board, Camera, Port, Screen).
- `copy.rebuild`: "Fixed." payoff headline and guarantee subline.
- `copy.accessories`: Categories and descriptions for Cases, Earbuds, Chargers, and Cables.
- `copy.wifi`: Headline and plan rows.
- `copy.finale`: Call-to-action title and store metadata.

---

## 2. Complete List of Dummy Items (Confirm with Shop)

Every placeholder claim is tagged in `src/config.js` with `// DUMMY: confirm with shop`. Confirm the following real details before public launch:

1. **WhatsApp & Phone Number**:
   - `923001234567` (`+92 300 1234567`) — confirm actual WhatsApp business number.
2. **Physical Address**:
   - `Shop 12, Main Market, Lahore` — confirm exact shop number, plaza name, or street.
3. **Operating Hours**:
   - `10:00 AM - 10:00 PM, daily` (`Asia/Karachi` timezone) — confirm exact opening/closing times and Friday prayer break hours if applicable.
4. **WiFi Plan Pricing & Speeds**:
   - `Home (10 Mbps / Rs. XXX)`
   - `Family (20 Mbps / Rs. XXX)`
   - `Max (50 Mbps / Rs. XXX)` — confirm real package speeds, monthly rates, and installation fees.
5. **Repair Turnaround Claims**:
   - `Same day`, `30 mins` — confirm average turnaround times for screens and batteries.
6. **Accessories Inventory**:
   - Confirm available accessory brands and warranty terms.

---

## 3. Tech Stack & Architecture

- **Rendering Engine**: Three.js `0.187.0` (procedural parts, RoundedBoxGeometry, ExtrudeGeometry, CatmullRomCurve3, TubeGeometry, Points system).
- **Animation Choreography**: GSAP 3 + ScrollTrigger + SplitText with a master 100-unit timeline matching 0-1 scroll progress.
- **Smooth Scrolling**: Lenis `1.3.27` on desktop (native touch scrolling on mobile).
- **Post-Processing (Tier 0)**: EffectComposer with RenderPass, UnrealBloomPass, custom ShaderPass (vignette, animated grain, chromatic aberration, 1/255 dither), and OutputPass.
- **Typography**: `@fontsource-variable/bricolage-grotesque` (display) & `@fontsource/dm-mono` (technical mono).
- **Bundler**: Vite 8 with Rolldown tree-shaking.

---

## 4. Development, Build & Deploy

### Local Development
```bash
# Install dependencies
npm install

# Start local dev server (default port: 3000)
npm run dev
```

### Production Build
```bash
# Compile and bundle static assets
npm run build

# Preview production build locally
npm run preview
```
Output bundle is placed in `dist/`. Total JavaScript bundle size is ~226 kB gzipped (budget: ≤ 450 kB).

### Deployment

#### Cloudflare Pages
1. Push this repository to GitHub or GitLab.
2. In Cloudflare Dashboard, go to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Select repository, set framework preset to **Vite**, build command `npm run build`, and output directory `dist`.
4. Deploy.

#### Vercel / Netlify
- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`

#### GitHub Pages
Push to `main`. Ensure GitHub Pages source is set to GitHub Actions using `.github/workflows/deploy.yml`.

---

## 5. URL Query Flags & QA Controls

- **`window.__seek(p)`**: Programmatic seek to progress `p` (0.0 to 1.0) with immediate Lenis scroll snapping and two-frame settling.
- **`?tier=0`**: High tier desktop (Full studio lighting + Bloom + Grain + Aberration post-processing).
- **`?tier=1`**: Medium tier desktop (Composer enabled without bloom).
- **`?tier=2`**: Low / mobile tier (Direct WebGL rendering, zero post-processing overhead).
- **`?debug=1`**: Live on-screen performance HUD showing FPS, progress, tier, draw calls, and triangle count.

---

## 6. Performance & QA Verification Protocol

To run the automated 18-point verification and multi-viewport matrix check across Chrome:
```bash
node scripts/verify.mjs
```

### Scripted 8-Second Scroll Benchmark (`scripts/benchmark-scroll.mjs`)
Measures frame deltas and p95 latency during continuous scroll (0 → 1) over 8 seconds:
- **Desktop Tier 0**: Average ~19.6 ms (~51 FPS), p95 ~33.3 ms (Draw calls: 80 / budget: ≤ 150).
- **Mobile Tier 2 (with 4x CPU Throttling)**: Average ~32.8 ms (~30.4 FPS), p95 ~50.0 ms (Draw calls: 65 / budget: ≤ 80, Triangles: 28.8k / budget: ≤ 100k).

### Open Graph Assets
- `public/og-image.png`: 1200x630 hero poster at ~180 kB (budget: < 200 kB). Generated via `node scripts/generate-og-image.mjs`.
