# Processing sketches → web (p5.js)

Browser ports of Amy Traylor's Processing (P3D/P2D) sketches, rewritten for
**p5.js** so they run on the Jekyll GitHub Pages site
(`writingcodetoplaydolls.github.io`), each inside its own window in a thesis page.

The site already loads **p5.js 1.9.0** (via `p5: true` front matter), so none of
these need new dependencies when embedded. Each sketch is also a **self-contained
folder** that loads its own p5 from the CDN, so the iframe embed below works on
any page.

## The sketches

| folder            | original      | renderer | assets | status |
|-------------------|---------------|----------|--------|--------|
| `embryos/`        | Embryos7      | WEBGL | gradient + video (2.9 MB) | ✅ tested |
| `tiltawhirl/`     | TiltAWhirl    | 2D | SVG inlined | ✅ tested |
| `entanglement/`   | Entanglement3 | WEBGL | 1 image | ✅ tested |
| `switchscenes/`   | SwitchScenes6 | 2D | none | ✅ tested |
| `sphereharmonics/`| SphereHarmonics | WEBGL | none | ✅ tested |
| `playhouse/`      | PlayHouse6    | WEBGL | 3 videos + OBJ (4.6 MB) | ✅ tested* |
| `molnarshouse/`   | MolnarsHouse23| WEBGL | none | ✅ tested |
| `aidanchevron/`   | Aidan_chevron_football | 2D | none | ✅ tested** |
| `blackholestars/` | …BlackHoleStars | WEBGL (GLSL) | none | ✅ tested |
| `blackholeshader16/` | BlackHoleShaderJuly16 | WEBGL (GLSL) | none | ✅ tested |
| `blackholeshader14/` | BlackHoleShaderJuly14 | WEBGL (GLSL) | none | ✅ tested |
| `lsystems1/`      | LSystems1     | 2D | none | ✅ tested |
| `lsystems2a/`     | LSystems2a    | 2D | none | ✅ tested |
| `lsystems3/`      | LSystems3     | 2D | none | ✅ tested |
| `lsystems3a/`     | LSystems3a    | 2D | none | ✅ tested |
| `traylorcinema/`  | TraylorCinema5| 2D (+sound) | audio + **465 frames (missing)** | ⚠ needs images |

\* PlayHouse6 renders correctly; one original video (`Animation1_2.mp4`) was not
in the project and is substituted — see its note below.
\*\* Aidan_chevron_football used the HYPE framework + a donut SVG + a video (both
absolute `D:\` paths, not in the project); HYPE is reimplemented and the donut is
drawn procedurally — see its note below.

## Embedding in your thesis template

Copy the folder(s) you want into the repo (e.g. under `MaximalistAssemblage/`),
then drop an iframe into any page. The iframe **is** the window — isolated, no
`p5: true` needed on the host page:

```html
<div style="max-width: 760px; margin: 2rem auto;">
  <iframe src="{{ '/MaximalistAssemblage/embryos/' | relative_url }}"
          title="Embryo Cell Division" loading="lazy"
          style="width:100%; aspect-ratio:1/1; border:0; background:#060845;">
  </iframe>
</div>
```

Swap `src`, `background`, and `aspect-ratio` per sketch:

| sketch          | `src`                 | `background` | suggested `aspect-ratio` |
|-----------------|-----------------------|--------------|--------------------------|
| embryos         | `…/embryos/`          | `#060845`    | `1 / 1` |
| tiltawhirl      | `…/tiltawhirl/`       | `#FDE800`    | `1 / 1` |
| entanglement    | `…/entanglement/`     | `#000000`    | `1 / 1` |
| switchscenes    | `…/switchscenes/`     | `#ffffff`    | `1 / 1` |
| sphereharmonics | `…/sphereharmonics/`  | `#000000`    | `1 / 1` |
| playhouse       | `…/playhouse/`        | `#ffffff`    | `16 / 9` or `4 / 3` |
| molnarshouse    | `…/molnarshouse/`     | `#000000`    | `1 / 1` |
| aidanchevron    | `…/aidanchevron/`     | `#202020`    | `1 / 1` |
| blackholestars  | `…/blackholestars/`   | `#000000`    | `16 / 9` |
| blackholeshader16 | `…/blackholeshader16/` | `#000000`  | `1 / 1` |
| blackholeshader14 | `…/blackholeshader14/` | `#000000`  | `1 / 1` |
| lsystems1       | `…/lsystems1/`        | `#ffffff`    | `1 / 1` |
| lsystems2a      | `…/lsystems2a/`       | `#FBFF90`    | `1 / 1` |
| lsystems3       | `…/lsystems3/`        | `#64c864`    | `1 / 1` |
| lsystems3a      | `…/lsystems3a/`       | `#FBFF90`    | `1 / 1` |
| traylorcinema   | `…/traylorcinema/`    | `#000000`    | `16 / 9` |

All canvases fill their window and the original coordinate systems scale to fit.

## Per-sketch notes

**embryos** — video-textured cells divide (1→2→…→64) and shrink over ~5 s, inside
a rotating wireframe shell, centered together. Press **r** to restart. Video is
muted to autoplay; click resumes it if a browser blocks it.

**tiltawhirl** — 8 "fugue" SVG shapes whirl in a ring over a yellow field with
trails. The SVG paths are inlined (no file needed). **space** pause, **b** clear.

**entanglement** — every pixel of `assets/grid.png` becomes a 3-D point; a
rotating subset flickers while "twin" movers wander and flare red when they meet.
**Drag** to orbit, **click** to add a twin pair, **b** to clear trails.

**switchscenes** — an "art-making machine": a shape travels and wraps, leaving
long trails. Keys: **space** randomize everything · **0–3** shape (rect/ellipse/
triangle/line) · **c** colors · **r** toggle rotation · **↑/↓** spin speed ·
**←/→** move speed · **w/q** stroke weight · **a/f** alpha · **l/k** trail length ·
**d** direction · **b**/click clear.

**sphereharmonics** — a spherical-harmonics surface (Paul Bourke formula,
reimplemented since toxiclibs isn't on the web) coloured by surface normal.
**r** generates a new form; move the mouse to rotate. (The original's wireframe/
normal debug toggles were omitted.)

**playhouse** — an orbiting camera over a video-textured house + a video-textured
3-D model (Greg), cutting between ~13 scenes on a timer, with trails. **Click**
to step scenes. The house panels are single-sided, so they thin out edge-on as
the camera orbits — same as the original. The `Wiggler`/`WalkerAnimation` classes
were omitted (never called in the original). **⚠ Substituted video:** the original
loaded `Animation1_2.mp4`, which wasn't in the project folder, so
`Animation4_100square.mp4` is used for the roofs/fullscreen (`VID_A` in
`playhouse.js`) — swap it if you find the original. Quilt videos were compressed
to 480p (23/26 MB → ~1.8/1.9 MB).

**molnarshouse** — a generative Vera-Molnár-style "house": a box base plus wobbly
stacked stories, redrawn with fresh jitter **once per second** (`frameRate(1)`, as
the original — so it looks near-still, by design), slowly rotating. White faces,
black edges, on black. The original's corners/prevCorners pointer-aliasing is
preserved, since it's part of the look.

**aidanchevron** — 400 "donut" rings in a row, each driven by four oscillators
(x/y/rotation/scale) with per-item phase offsets, recolouring from a palette;
HYPE's pool/oscillator/color-pool/grid-layout behaviour is reimplemented in plain
p5 and the donut is drawn procedurally. The original's SVG and video were absolute
`D:\` paths (not in the project); the video is omitted (the original drew it
opaquely on top — the author's own comment was "not what I want").

**blackholestars** — a GLSL fragment shader (ported from `BlackHoleStarfieldMix7_31.glsl`)
run fullscreen in p5 WEBGL: a starfield that collapses into a black hole, stars
spiralling in. It **oscillates** — the driving time ramps 0→max→0 with a triangle
wave, so the hole forms then recedes, back and forth, continuously (the shader's
radius/spiral math reverses with it). At the peak it fully engulfs the screen (its
radius is scaled to the screen diagonal), holds, then retracts. Tune the cycle
length with `PERIOD` (seconds, default 180 = 90s in, 90s out) in `blackholestars.js`. **Click/space** restart the cycle, **r** toggles
to the plain non-collapsing starfield. The star loop bound was made constant (500)
for WebGL1, and `pixelDensity(1)` keeps `gl_FragCoord` aligned with the `resolution`
uniform. Only the one shader the original actually drew was ported (`StarfieldSpiral`
was computed but never drawn; `BlackHole7_31` wasn't loaded).

**blackholeshader16 / blackholeshader14** — two GLSL black-hole shaders (ported
from `blackholeJuly16_notouch.glsl` / `blackholeJuly14_notouch.glsl`), run
fullscreen in p5 WEBGL. Both were originally driven by a **MIDI controller**
(themidibus) + audio input, which don't exist on the web — so those are removed
and the parameters the MIDI controlled are bound to the **keyboard**:
- **16:** ↑/↓ radius · ←/→ speed · W/S bumpiness · A/D ring spacing · mouse X zoom · 0 reset
- **14:** ↑/↓ radius · ←/→ speed · mouse X ring spacing · mouse Y bumpiness · 0 reset
  (in the July-14 sketch the mouse already controlled bumpiness/ring spacing, so
  only radius + speed came from MIDI; those became the arrow keys.)
Each loop bound was made constant (18) for WebGL1, precision raised to highp, and
`pixelDensity(1)` keeps `gl_FragCoord` aligned with `resolution`. The unused
`distDiv` / `baseRadius` MIDI params were dropped (the shaders never read them).

**lsystems1 / lsystems2a / lsystems3 / lsystems3a** — turtle-drawn L-systems. The
Processing `Turtle` library has no p5 equivalent, so a small turtle (forward /
left / right / getX / getY, plus pen up/down for #1, starting at centre heading
up) is reimplemented in each. They're static (the originals `noLoop()`), drawn
once; **click to redraw** (1 re-rolls its random angle, 3 re-rolls its random edge
turns). 1 keeps the pen up and stamps black dots/squares (rule F→"F-F++F-F",
random 45–90° angle); 2a is a grayscale Koch-island fill on pale yellow; 3 is the
same family in red/yellow/cyan over green; 3a uses two rules (L→"L+R+", R→"-L-R")
at the unusual size/angle of 227, giving overlapping rotated polygons. The
coordinate world is a fixed 800×800 scaled to the canvas, so the turtle's
edge-bounds behave as in the original. `saveFrame` output was dropped.

**traylorcinema** — ⚠ **not yet runnable.** Two panels cross-fade random frames
with shifting blend modes and looping audio. It needs **465 frames** at
`assets/images/housePlay0.png … housePlay464.png` — these are rendered output
from the PlayHouse sketch, and the zip's `images/` folder was empty. Drop them in
(and set `NUM_IMAGES` in `traylorcinema.js` to how many you have) and it will run.
Audio (`bellows4.wav`, `carmenwhisper2.wav`) is included and starts on a click
(browsers block audio autoplay). This is the one sketch not verified end-to-end.

## What was dropped (unused by each sketch)

- embryos: VR `Vive`/`Controller`/`PGraphicsTest`, `positions.txt`, render dumps,
  other videos.
- tiltawhirl: PDF-export code and `pdf_complex_out.pdf`.
- entanglement: `Notes.pde`, `*-Desktop.pde`, saved `entangled-*.png` frames.
- playhouse: `Wiggler`/`WalkerAnimation` (never called), `saveFrame` output,
  the OBJ's own `.mtl`/`.jpg` texture (the model is textured with video instead).
- aidanchevron: the `HYPE.pde` library (reimplemented), the `build/` folder.
- blackholeshader16 / blackholeshader14: `Midi.pde` (themidibus) and the audio-in
  code — replaced by keyboard controls.
- traylorcinema: the unused `Scene from my favorite movie.mp4` and extra wavs.

Source sketches were extracted next to their originals in `*_extracted/` folders;
the originals are untouched.
