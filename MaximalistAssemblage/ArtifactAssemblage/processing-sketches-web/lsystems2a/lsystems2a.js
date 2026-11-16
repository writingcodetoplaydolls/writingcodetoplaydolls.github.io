/* =============================================================================
 *  LSystems2a  —  p5.js port of the Processing sketch by Amy Traylor.
 *
 *  An L-system drawn with a turtle. The Processing `Turtle` library has no p5
 *  equivalent, so a small turtle is reimplemented here (forward / left / right /
 *  getX / getY). Static image (the original noLoop()s), drawn once.
 *
 *    axiom "F-F-F-F", rule F -> "F-FF--F-F", 6 iterations, angle 90, size 11.
 *    When the turtle nears an edge it turns around (as in the original).
 *
 *  p5 INSTANCE MODE.
 * ========================================================================== */

(function () {
  "use strict";

  const CONTAINER_ID = "lsystems2a-sketch";
  const WORLD = 800;
  const BG = [251, 255, 144]; // #FBFF90

  const sketch = function (p) {
    const RULES = [["F", "F-FF--F-F"]];
    const AXIOM = "F-F-F-F";
    const ITER = 6;
    const SIZE = 11;
    const ANGLE = 90;
    let computed = AXIOM;

    function iterate(generations) {
      for (let i = 0; i < generations; i++) {
        let next = "";
        for (const ch of computed) {
          let replaced = false;
          for (const [a, b] of RULES) { if (ch === a) { next += b; replaced = true; break; } }
          if (!replaced) next += ch;
        }
        computed = next;
      }
    }

    const turtle = {
      x: WORLD / 2, y: WORLD / 2, heading: -90,
      reset() { this.x = WORLD / 2; this.y = WORLD / 2; this.heading = -90; },
      forward(d) {
        const r = p.radians(this.heading);
        const nx = this.x + d * Math.cos(r), ny = this.y + d * Math.sin(r);
        p.line(this.x, this.y, nx, ny);
        this.x = nx; this.y = ny;
      },
      right(a) { this.heading += a; },
      left(a) { this.heading -= a; },
      getX() { return this.x; }, getY() { return this.y; }
    };

    function drawLSystem() {
      const len = computed.length;
      for (let i = 0; i < len; i++) {
        const buffer = SIZE < 50 ? 50 : SIZE;
        const t = turtle;
        if (t.getX() > buffer && t.getX() < WORLD - buffer &&
            t.getY() > buffer && t.getY() < WORLD - buffer) {
          p.strokeWeight(p.map(i, 0, len, 10, 0.5));
          const ms = p.map(i, 0, len, 255, 0);
          p.stroke(ms, ms); // grayscale + alpha, as the original
          switch (computed.charAt(i)) {
            case 'F': t.forward(SIZE); break;
            case '+': t.right(ANGLE); break;
            case '-': t.left(ANGLE); break;
          }
        } else {
          t.right(ANGLE); t.right(ANGLE); t.forward(SIZE);
        }
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
      iterate(ITER);
      p.noLoop();
    };

    p.draw = function () {
      p.background(BG[0], BG[1], BG[2]);
      const vs = Math.min(p.width, p.height) / WORLD;
      p.push();
      p.translate(p.width / 2, p.height / 2);
      p.scale(vs);
      p.translate(-WORLD / 2, -WORLD / 2);
      turtle.reset();
      drawLSystem();
      p.pop();
    };

    p.windowResized = function () {
      const sz = containerSize();
      p.resizeCanvas(sz.w, sz.h);
      p.redraw();
    };

    p.mousePressed = function () { p.redraw(); }; // redraw on click
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { new p5(sketch); });
  } else {
    new p5(sketch);
  }
})();
