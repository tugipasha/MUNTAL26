# Silt Atelier — Editorial spiral gallery landing

A premium dark editorial landing page for an independent creative studio, built with Vite 5 (vanilla JS), Three.js, Lenis, GSAP ScrollTrigger, and custom GLSL shaders.

## Features

- Full-screen sticky hero with a 3D spiral gallery of curved image tiles
- Custom `BufferGeometry` arc segments (not flat planes) with `ShaderMaterial`
- Subtle per-tile vignette and depth fade in fragment shaders
- Lenis smooth scroll driving camera Y, spiral spin from scroll velocity, and ScrollTrigger sync
- Desktop mouse parallax tilt on the spiral group
- GSAP text reveals (once) on all content below the hero
- Editorial typography (Instrument Serif + DM Sans + IBM Plex Mono)
- Film grain overlay via inline SVG turbulence

## Install

```bash
cd silt-atelier
npm install      # also runs postinstall to generate img1–img10.jpg
npm run dev      # development
npm run build    # production build to dist/
npm run preview  # preview production build
```

Open the URL printed by Vite (default `http://localhost:5173/`).

## Project structure

```
├── index.html          # Semantic markup, no inline JS/CSS
├── package.json
├── vite.config.js
├── public/images/      # img1.jpg … img10.jpg (spiral textures)
└── src/
    ├── script.js       # Three.js, Lenis, GSAP, interaction
    ├── shaders.js      # vertexShader, fragmentShader exports
    └── styles.css      # All presentation
```

## CONFIG object

Defined at the top of `src/script.js`:

| Key | Role |
|-----|------|
| `totalImages` | Number of JPG textures to load (cycles across tiles) |
| `tilesPerRevolution` | Tiles per full 360° turn |
| `revolutions` | How many times the helix wraps |
| `startRadius` / `endRadius` | Inner/outer taper of the spiral |
| `tileHeightRatio` | Scales tile height relative to arc chord |
| `tileSegments` | Curved mesh resolution per tile |
| `spiralGap` | Vertical spacing between tiles |
| `tileOverlap` | Extra arc radians so tiles meet cleanly |
| `cameraZ` | Base camera distance (+3 on mobile) |
| `cameraSmoothing` | Lerp factor for camera Y and mouse tilt |
| `baseRotationSpeed` | Constant slow spin |
| `scrollRotationMultiplier` | How much scroll velocity adds spin |
| `rotationDecay` | Spin momentum decay per frame (0.9) |
| `scrollMultiplier` | Extra gain on scroll-driven spin |
| `cameraYMultiplier` | How far camera drifts on scroll |
| `parallaxStrength` | Mouse tilt amount (desktop) |
| `spiralOffsetY` | Vertical offset of the spiral group |

## How it works

### Geometry

Each tile is a curved strip: vertices are placed along an arc at a given radius, with top/bottom pairs at ±half tile height. UVs run 0→1 across the arc. Tiles are stacked with `spiralGap`, rotated by `i * angleStep`, and given a lerped radius so the helix tapers from `startRadius` to `endRadius`.

### Scroll → camera

Lenis reports `scroll / limit` as `scrollProgress`. The camera target Y is `-scrollProgress * cameraYMultiplier * 10`, smoothed each frame. `camera.lookAt` tracks a point slightly above origin so the spiral drifts cinematically as the page stack slides over the sticky hero.

### Scroll velocity → spin

On each Lenis scroll event, `velocity * scrollRotationMultiplier * scrollMultiplier` is added to `spinVelocity`. Each frame the spiral rotates by `baseRotationSpeed + spinVelocity`, then `spinVelocity *= rotationDecay` for inertial decay.

### Mouse parallax

On desktop, normalized mouse position sets `targetTiltX` / `targetTiltZ` from `parallaxStrength`. These ease onto `spiral.rotation.x` and `spiral.rotation.z`. Mobile disables tilt.

### Image replacement

Replace files in `public/images/` keeping names `img1.jpg` through `img10.jpg`. Use portrait-oriented images (~3:4 or 2:3) for best results on curved tiles. Textures use sRGB, max anisotropy, and mipmapped linear filtering.

### Tuning CONFIG

- **Denser / taller spiral:** increase `revolutions` or decrease `spiralGap`
- **Wider helix:** raise `startRadius` / `endRadius`
- **Faster scroll spin:** raise `scrollRotationMultiplier` or lower `rotationDecay`
- **More camera travel:** increase `cameraYMultiplier`
- **Stronger mouse tilt:** increase `parallaxStrength`
- **Larger tiles:** increase `tileHeightRatio` or `tilesPerRevolution` (fewer tiles per revolution)

WebGL initializes via `requestIdleCallback` (1.5s timeout) so hero typography can paint first (LCP-friendly).
