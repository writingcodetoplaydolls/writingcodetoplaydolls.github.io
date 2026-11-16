/* =============================================================================
 *  LSystems1  —  p5.js port of the Processing sketch by Amy Traylor.
 *  (LSystems1.pde + LSystem.pde)
 *
 *  A turtle L-system where the turtle keeps its pen UP (so it draws no lines) and
 *  instead stamps black dots and little squares at each step. Rule F -> "F-F++F-F",
 *  axiom "F", 7 iterations, with a random angle (45–90°) chosen each run.
 *  The Processing `Turtle` library is reimplemented here (with pen up/down).
 *  Static (the original noLoop()s); click to re-roll the angle and redraw.
 *
 *  p5 INSTANCE MODE.
 * ========================================================================== */

(function () {
  "use strict";

  const CONTAINER_ID = "lsystems1-sketch";
  const WORLD = 800;

  const sketch = function (p) {
    const RULE = ["F", "F-F++F-F"];
    const AXIOM = "F";
    const ITER = 7;
    const SIZE = 50;
    let computed = AXIOM;
    let angle = 60;

    function iterate(generations) {
      angle = p.random(45, 90);
      computed = AXIOM;
      for (let i = 0; i < generations; i++) {
        computed = computed.split(RULE[0]).join(RULE[1]); // replaceAll F -> ...
      }
    }

    const turtle = {
      x: WORLD / 2, y: WORLD / 2, heading: -90, pen: true,
      reset() { this.x = WORLD / 2; this.y = WORLD / 2; this.heading = -90; this.pen = true; },
      penUp() { this.pen = false; },
      penDown() { this.pen = true; },
      forward(d) {
        const r = p.radians(this.heading);
        const nx = this.x + d * Math.cos(r), ny = this.y + d * Math.sin(r);
        if (this.pen) p.line(this.x, this.y, nx, ny);
        this.x = nx; this.y = ny;
      },
      right(a) { this.heading += a; },
      left(a) { this.heading -= a; },
      getX() { return this.x; }, getY() { return this.y; }
    };

    function drawLSystem() {
      const t = turtle;
      for (let i = 0; i < computed.length; i++) {
        if (t.getX() > 50 && t.getX() < WORLD - 50 && t.getY() > 50 && t.getY() < WORLD - 50) {
          switch (computed.charAt(i)) {
            case 'F':
              t.penUp();
              t.forward(SIZE * 1.5);
              p.noStroke();
              p.fill(0);
              p.ellipse(t.getX(), t.getY(), SIZE / 2, SIZE / 2);
              p.rect(t.getX() + SIZE, t.getY() + SIZE, SIZE / 4, SIZE / 4);
              break;
            case '+':
              t.penUp();
              t.right(angle);
              p.noStroke();
              p.fill(0);
              p.ellipse(t.getX(), t.getY(), SIZE, SIZE);
              break;
            case '-':
              t.penDown();
              p.stroke(5);
              p.strokeWeight(5);
              t.left(angle);
              break;
          }
        } else {
          p.ellipse(t.getX(), t.getY(), SIZE, SIZE); // uses the current fill/stroke
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
      p.background(255);
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

    p.mousePressed = function () { iterate(ITER); p.redraw(); }; // new random angle + redraw
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { new p5(sketch); });
  } else {
    new p5(sketch);
  }
})();
