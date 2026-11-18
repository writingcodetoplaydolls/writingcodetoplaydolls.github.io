/* =============================================================================
 *  LSystems3  —  p5.js port of the Processing sketch by Amy Traylor.
 *
 *  Turtle-drawn L-system (axiom "F-F-F-F", rule F -> "F-FF--F-F", 6 iterations,
 *  angle 90) over a green field, with per-symbol colours/weights (F red, + yellow,
 *  - cyan) and a randomized turn-around when the turtle nears an edge.
 *  The Processing `Turtle` library is reimplemented here. Static (noLoop).
 *
 *  p5 INSTANCE MODE.
 * ========================================================================== */

(function () {
  "use strict";

  const CONTAINER_ID = "lsystems3-sketch";
  const WORLD = 800;
  const BG = [100, 200, 100];

  const sketch = function (p) {
    const AXIOM = "F-F-F-F";
    const RULE = ["F", "F-FF--F-F"];
    const ITER = 6;
    const ANGLE = 90;
    const BUFFER = 50;
    let computed = AXIOM;

    function iterate(generations) {
      for (let i = 0; i < generations; i++) {
        computed = computed.split(RULE[0]).join(RULE[1]); // replaceAll F -> ...
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
      const t = turtle;
      for (let i = 0; i < computed.length; i++) {
        if (t.getX() > BUFFER && t.getX() < WORLD - BUFFER &&
            t.getY() > BUFFER && t.getY() < WORLD - BUFFER) {
          switch (computed.charAt(i)) {
            case 'F': p.strokeWeight(0.5); p.stroke(255, 0, 0); t.forward(5); break;
            case '+': p.strokeWeight(2);   p.stroke(255, 255, 0); t.right(ANGLE); break;
            case '-': p.strokeWeight(1);   p.stroke(0, 255, 255); t.left(ANGLE); break;
          }
        } else {
          if (Math.floor(p.random(0, 2)) === 0) {
            p.stroke(0, 255, 0); t.right(ANGLE); t.right(ANGLE); t.forward(9);
          } else {
            p.stroke(222, 255, 255); t.left(ANGLE); t.left(ANGLE); t.forward(11);
          }
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

    p.mousePressed = function () { p.redraw(); };
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { new p5(sketch); });
  } else {
    new p5(sketch);
  }
})();
