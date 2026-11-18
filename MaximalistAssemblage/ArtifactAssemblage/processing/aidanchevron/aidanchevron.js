/* =============================================================================
 *  Aidan_chevron_football  —  p5.js port of the Processing sketch by
 *  Amy Traylor (originally built on the HYPE framework).
 *
 *  A pool of 400 "donut" rings laid out in a row, each driven by four
 *  oscillators (x, y, rotation, scale) with a per-item phase offset, recoloured
 *  from a palette. HYPE isn't available on the web, so its HDrawablePool /
 *  HOscillator / HColorPool / HGridLayout behaviour is reimplemented directly.
 *
 *  Missing assets (both were absolute D:\ paths, not in the project):
 *    - donut.svg       -> a donut is drawn procedurally (annulus) instead.
 *    - Chevron.mp4     -> omitted. (The original drew it opaquely over
 *                         everything, which the author flagged "not what I want".)
 *
 *  p5 INSTANCE MODE.
 * ========================================================================== */

(function () {
  "use strict";

  const CONTAINER_ID = "aidanchevron-sketch";
  const WORLD = 1000;
  const COUNT = 400;

  const PALETTE = ["#5a4741","#89bcc0","#464c64","#8ebf7d","#b03f37",
                   "#9f8179","#c4465b","#d9ba5f","#c74d42","#603a2f","#d1a693"];
  const BG = "#202020";
  const DONUT_OUTER = 44, DONUT_INNER = 20;

  const sketch = function (p) {
    let items = [];
    let strokeCol;

    // one oscillator: value = base + map((sin(radians(step*freq))+1)/2, 0..1, lo..hi)
    function osc(step, speed, freq, lo, hi, base) {
      const wave = (Math.sin(p.radians(step * freq)) + 1) / 2;
      return base + (lo + (hi - lo) * wave);
    }

    function containerSize() {
      const el = document.getElementById(CONTAINER_ID);
      const w = (el && el.clientWidth)  || window.innerWidth;
      const h = (el && el.clientHeight) || window.innerHeight;
      return { w: Math.max(1, w), h: Math.max(1, h) };
    }

    p.setup = function () {
      const sz = containerSize();
      const c = p.createCanvas(sz.w, sz.h);
      c.parent(CONTAINER_ID);
      strokeCol = PALETTE[255 % PALETTE.length]; // colors.getColor(255)
      for (let i = 0; i < COUNT; i++) {
        items.push({
          baseX: 0 + i,            // HGridLayout startLoc(0,h/2) spacing(1,0) cols(400)
          baseY: WORLD / 2,
          col: PALETTE[(i * 100) % PALETTE.length], // colors.getColor(i*100)
          sx: i, sy: i, sr: i, ss: i   // oscillator steps start at currentStep(i)
        });
      }
    };

    p.draw = function () {
      p.background(BG);

      const vs = Math.min(p.width, p.height) / WORLD;
      p.push();
      p.translate(p.width / 2, p.height / 2);
      p.scale(vs);
      p.translate(-WORLD / 2, -WORLD / 2);

      const recolor = (p.frameCount % 25 === 0);

      for (const d of items) {
        // advance oscillator steps (speed = degrees added per frame)
        d.sx += 1;    d.sy += 2;    d.sr += 0.001; d.ss += 1;

        const x = osc(d.sx, 1, 0.5, -300, 300, d.baseX);
        const y = osc(d.sy, 2, 0.7, -300, 300, d.baseY);
        const rot = osc(d.sr, 0.001, 1, 0, 360, 0);
        const sc = osc(d.ss, 1, 4, 0, 2, 0);

        if (recolor) d.col = PALETTE[Math.floor(p.random(PALETTE.length))];

        p.push();
        p.translate(x, y);
        p.rotate(p.radians(rot));
        p.scale(sc);
        // donut = outer disc in palette colour + inner hole in bg colour
        p.noStroke();
        p.fill(d.col);
        p.ellipse(0, 0, DONUT_OUTER, DONUT_OUTER);
        p.fill(BG);
        p.ellipse(0, 0, DONUT_INNER, DONUT_INNER);
        // thin ring outline
        p.noFill();
        p.stroke(strokeCol);
        p.strokeWeight(1);
        p.ellipse(0, 0, DONUT_OUTER, DONUT_OUTER);
        p.pop();
      }
      p.pop();
    };

    p.windowResized = function () {
      const sz = containerSize();
      p.resizeCanvas(sz.w, sz.h);
    };
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { new p5(sketch); });
  } else {
    new p5(sketch);
  }
})();
