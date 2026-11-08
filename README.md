# DATA — WebGL Scroll Experience (Lahore)

A high-performance, single-scene 3D scroll website for **DATA**, an unbranded phone shop, repair center, and local fiber hub in Main Market, Lahore. Built strictly in vanilla JavaScript and Three.js with hardware-accelerated GSAP timelines.

## Tech Stack

- **Three.js** (procedural 3D phone model, accessories, and WiFi signal visualizations)
- **GSAP 3** + **ScrollTrigger** + **SplitText** (master scrubbed timeline)
- **Lenis** (fine-pointer desktop smooth scrolling)
- **Vite** (ES module bundler)
- **Typography**: Bricolage Grotesque Variable & DM Mono

## Development

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev
```

The dev server will run locally at `http://localhost:3000`.

## Production Build

```bash
# Build static production bundle
npm run build

# Preview production build locally
npm run preview
```

The static output is placed in the `dist/` directory.

## Deployment Guides

### Cloudflare Pages

1. Push this repository to GitHub or GitLab.
2. In the **Cloudflare Dashboard**, navigate to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Select your repository.
4. Set the build configuration:
   - **Framework preset**: `None` / `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. Click **Save and Deploy**.

### GitHub Pages

1. Push your repository to GitHub.
2. Create a GitHub Actions workflow at `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

3. In GitHub repo **Settings** > **Pages**, under **Source**, select **GitHub Actions**.

## Performance & Budgets

- **Draw calls**: < 60 on mobile, < 100 on desktop
- **Adaptive quality**: Automatic downgrade of DPR, rim light, and idle oscillations if frame delta exceeds 22ms.
- **Zero shadow maps**: Contact shadow powered by procedural radial gradient canvas textures.
- **Mobile First**: Optimized layout for 390x844 with safe-area support and native touch responsiveness.
