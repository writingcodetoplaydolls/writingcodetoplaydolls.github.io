/* =============================================================================
 *  TiltAWhirl  —  p5.js port of the Processing (P3D) sketch by Amy Traylor.
 *
 *  Eight "whirl" shapes (a stylized fugue/clef SVG) arranged around a circle,
 *  each slowly rotating and oscillating in depth, over a pale-yellow field that
 *  very slowly builds up trails.
 *
 *  The original loaded fullfuge.svg as a PShape and recoloured it every frame
 *  (svg.disableStyle()). p5 has no PShape, so the two SVG paths are rendered as
 *  Path2D objects on the 2D canvas, which lets us recolour them identically.
 *
 *  p5 INSTANCE MODE — no global scope pollution.
 * ========================================================================== */

(function () {
  "use strict";

  const CONTAINER_ID = "tiltawhirl-sketch";
  const WORLD   = 1100;        // original was 1100 x 1100
  const RADIUS  = 230;
  const NUM     = 8;           // numWhirls

  // fullfuge.svg — viewBox 0 0 120 255.9, two paths (recoloured each frame)
  const SVG_W = 120, SVG_H = 255.9;
  const SVG_PATHS = [
    "M106.4,108.7v41.5c0,3.5-0.2,7-0.9,10.5l-11.6,76.4c-2.4,16.6-18,16.6-20.6,0.2l-11.6-76.5c-0.5-3.5-0.7-7-0.7-10.5c0.1-14,0.1-28.2,0.1-42.3",
    "M103,75c0-1.7,0-7,0-8.5c-13.1,0-26.3,0-39.3,0c0,1.5,0,6.8,0,8.5C76.8,75,89.9,75,103,75z M35.6,47.5c1.1,0.2,3.3,0,4.3,0c-0.7-0.7-1.4-1.4-1.9-2.2c-2.4-3.3-4-7.4-4.2-11.8c0-4.5,1.5-9.7,3.8-13.1l-3.5,0.7c-2.2,0-3.8,1.9-4.8,3.8c-3.1,5.5-3.1,14,0.9,19.2C31.3,45.5,33.7,47.5,35.6,47.5z M40.5,16c-2.4-2.8-6.6-4.5-10.7-4.2c-3.8,0.5-7.2,3.3-9.4,7.4c-5.9,10.2-5,25.1,3.8,33.7c3.5,3.5,7.8,4.5,11.6,4c2.8-0.7,5.2-2.2,7.6-5.7c-3.8,0.5-7,0.9-8.8,0.7c-2.8-0.7-5.7-2.6-7.8-5.5c-4.5-6.1-5.2-16.4-1.1-23.9c2.4-4,5.5-5.7,8.5-5.9C36.5,16.4,38.5,16.4,40.5,16z M54.5,41.3c-1.9,4-4.3,5.5-6.8,5.5c-2.4,0-3.5-0.7-5-3.1c2.6-1.5,4-6.4,3.8-10.9s-2.2-9.2-5-10.2c1.1-1.7,1.9-2.8,4.2-3.3c2.8-0.5,5.9,1.4,7.8,4.2C56.7,27.8,57.3,35.4,54.5,41.3z M60.9,82.7H50.2c-8.8,0-8.3-0.7-12.7-8.5l-6.7-12.5c-5.2,0.2-10.9-2.2-14.7-6.4C6.1,44.6,5,25.5,15.3,14.6C17.7,12,21,9.8,25,8.5c8.1-2.6,16.4,0.5,21.3,6.8c3.5,0,6.8,2.2,9.2,5.5c4.2,5.5,5.9,14.4,1.7,22.7c-2.4,4.3-5.5,6.8-8.5,7c-1.5,3.5-3.8,5.9-6.4,8.1c1.8,4.2,4.5,9.5,6.5,13.5c1.1,2.2,1.7,2.8,9,2.8h3.1V63.4h45.3c0,2.6,0,9,0,11.6h3.1c1.4,0,2.6,1.1,2.6,2.6V80c0,1.5-1.4,2.6-2.6,2.6h-3.1V151c0,3.5-0.2,7-0.9,10.5l-11.6,76.4c-2.4,16.6-18,16.6-20.6,0.2l-11.6-76.5c-0.5-3.5-0.7-7-0.7-10.5C60.9,128.4,60.9,105.5,60.9,82.7z M63.7,151.2c0,3.3,0.5,6.8,0.9,10.1l11.5,76.3c1.9,13.3,12.7,13.1,14.7,0l11.6-76.4c0.5-3.3,0.7-6.8,0.7-10.1V82.6H63.7C63.7,105.5,63.7,128.4,63.7,151.2z"
  ];

  const sketch = function (p) {
    // colours (from the sketch header + constructor)
    const C_STROKE = [240, 8, 24];    // #F00818  bright red
    const C_FILL   = [64, 184, 160];  // #40B8A0  bright teal
    const C_BG     = [253, 232, 0];   // #FDE800  yellow

    // approximate Processing's default P3D perspective for the depth "tilt"
    const EYE_Z = (WORLD / 2) / Math.tan(Math.PI / 6); // ~952

    let paths = [];
    let whirls = [];
    let theta = 0;

    class Whirl {
      constructor() {
        this.theta   = p.random(-5, 5);
        this.zPos    = p.random(-80, 80);
        this.thetaMax = 5; this.thetaMin = -5;
        this.easing  = 0.008;
        this.inc     = 0.33 * p.random(-1, 1);
        this.zPosMax = 80; this.zPosMin = -80;
        this.growing = true;
        this.contracting = true;
      }

      display(arcPos) {
        const sc = EYE_Z / (EYE_Z - this.zPos); // subtle perspective scaling

        p.push();
        p.rotate(this.theta);
        p.translate(arcPos, arcPos);
        p.rotate(this.theta);
        p.scale(sc);

        p.fill(C_FILL[0], C_FILL[1], C_FILL[2], p.random(100, 200));
        p.stroke(C_STROKE[0], C_STROKE[1], C_STROKE[2]);
        p.strokeWeight(2);
        drawSVG();
        p.pop();

        // oscillate rotation
        if (this.growing) {
          if (this.theta < this.thetaMax) this.theta += this.inc * this.easing;
          else this.growing = false;
        } else {
          if (this.theta > this.thetaMin) this.theta -= this.inc * this.easing;
          else this.growing = true;
        }
        // oscillate depth
        if (this.contracting) {
          if (this.zPos < this.zPosMax) this.zPos += 0.05 * this.easing;
          else this.contracting = false;
        } else {
          if (this.zPos > this.zPosMin) this.zPos -= 0.05 * this.easing;
          else this.contracting = true;
        }
      }
    }

    // draw the SVG paths with the current p5 fill/stroke
    function drawSVG() {
      const ctx = p.drawingContext;
      for (const pth of paths) {
        ctx.fill(pth);
        ctx.stroke(pth);
      }
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
      p.angleMode(p.RADIANS);
      paths = SVG_PATHS.map(function (d) { return new Path2D(d); });
      for (let i = 0; i < NUM; i++) whirls.push(new Whirl());
      p.background(C_BG[0], C_BG[1], C_BG[2]);
    };

    p.draw = function () {
      const viewScale = Math.min(p.width, p.height) / WORLD;

      // faint yellow wash each frame => slow trails (translate(0,0,-200) rect alpha 5)
      p.push();
      p.noStroke();
      p.fill(C_BG[0], C_BG[1], C_BG[2], 5);
      p.rect(0, 0, p.width, p.height);
      p.pop();

      p.push();
      // scale the 1100-world to the canvas and move origin to its centre
      p.translate(p.width / 2, p.height / 2);
      p.scale(viewScale);
      p.translate(-WORLD / 2, -WORLD / 2);

      const distr = 360 / NUM; // = 45 (added as radians, exactly as the original)
      for (let i = 0; i < NUM; i++) {
        p.push();
        p.translate(
          WORLD / 2 + RADIUS * p.cos(theta + i * distr),
          WORLD / 2 + RADIUS * p.sin(theta + i * distr)
        );
        whirls[i].display(25);
        p.pop();
      }
      theta += 0.01;
      p.pop();
    };

    p.windowResized = function () {
      const sz = containerSize();
      p.resizeCanvas(sz.w, sz.h);
      p.background(C_BG[0], C_BG[1], C_BG[2]);
    };

    // space = pause/resume, 'b' = clear to background
    let paused = false;
    p.keyPressed = function () {
      if (p.key === " ") { paused = !paused; paused ? p.noLoop() : p.loop(); }
      if (p.key === "b" || p.key === "B") {
        p.background(C_BG[0], C_BG[1], C_BG[2]);
      }
    };
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { new p5(sketch); });
  } else {
    new p5(sketch);
  }
})();
