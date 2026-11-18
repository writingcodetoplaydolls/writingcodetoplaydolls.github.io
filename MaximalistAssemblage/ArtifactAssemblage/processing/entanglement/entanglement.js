/* =============================================================================
 *  Entanglement3  —  p5.js (WEBGL) port of the Processing (P3D) sketch
 *  by Amy Traylor.
 *
 *  Every pixel of a source image becomes a point in a 3D cube (its R,G,B mapped
 *  to x,y,z). A rotating, flickering subset of those points is drawn, while a
 *  "Twin" pair of movers wander between random points, linked by a line; when
 *  they come close they flare red ("entangle"). Nothing clears the frame, so the
 *  whole thing accumulates into smeared trails — orbit with the mouse.
 *
 *  PeasyCam -> orbitControl() + a camera at distance 3200.
 *  p5 INSTANCE MODE.
 * ========================================================================== */

(function () {
  "use strict";

  const CONTAINER_ID = "entanglement-sketch";
  const IMG_SRC = "assets/grid.png";
  const SIZER   = 500;      // cube half-extent
  const STEP    = 2500;     // draw every Nth point (as in the original)

  const sketch = function (p) {
    let img, cam;
    let pts;                 // Float32Array, flat [x,y,z, x,y,z, ...]
    let numPts = 0;
    let rot = 0.1;
    const inc = 0.0001;
    let twins = [];
    let gl;

    // ---- Mover (Shiffman) ------------------------------------------------
    class Mover {
      constructor(x, y, z) {
        this.location = p.createVector(x, y, z);
        this.velocity = p.createVector(0, 0, 0);
        this.topspeed = p.random(5, 9);
        this.mag = p.random(0.001, 0.2);
      }
      update(x, y, z) {
        const target = p.createVector(x, y, z);
        const acc = p5.Vector.sub(target, this.location);
        acc.setMag(this.mag);
        this.velocity.add(acc);
        this.velocity.limit(this.topspeed);
        this.location.add(this.velocity);
      }
    }

    // ---- Twin ------------------------------------------------------------
    class Twin {
      constructor() {
        this.m1 = null; this.m2 = null;
        this.count = 0; this.trigger = false; this.wait = false;
      }
      initialize() {
        const a = randPt(), b = randPt();
        this.m1 = new Mover(a.x, a.y, a.z);
        this.m2 = new Mover(b.x, b.y, b.z);
      }
      draw() {
        const a = randPt(), b = randPt();
        this.m1.update(a.x, a.y, a.z);
        this.m2.update(b.x, b.y, b.z);

        p.push();
        p.stroke(255, 50);
        p.strokeWeight(2);
        p.line(this.m1.location.x, this.m1.location.y, this.m1.location.z,
               this.m2.location.x, this.m2.location.y, this.m2.location.z);
        p.pop();

        const d1 = p.dist(
          this.m1.location.x, this.m1.location.y, this.m1.location.z,
          this.m2.location.x, this.m2.location.y, this.m2.location.z);
        let localD = 0;
        if (!this.wait && d1 < 150) {
          this.trigger = true; this.count = 55; localD = d1;
        }
        if (this.trigger) this.triggerNode(this.m1.location, this.m2.location, localD);
      }
      triggerNode(pts1, pts2, d) {
        if (this.count > 0) { this.count -= 0.00010; this.wait = true; }
        else { this.trigger = false; this.wait = false; }
        d -= this.count;
        const mapD = 255;
        p.push();
        p.noStroke();
        p.fill(mapD, 0, 0, this.count);
        p.push(); p.translate(pts1.x, pts1.y, pts1.z); drawFacingEllipse(d, d); p.pop();
        p.push(); p.translate(pts2.x, pts2.y, pts2.z); drawFacingEllipse(d, d); p.pop();
        p.pop();
      }
    }

    function randPt() {
      const i = Math.floor(p.random(numPts));
      return { x: pts[i * 3], y: pts[i * 3 + 1], z: pts[i * 3 + 2] };
    }

    // ellipse in the XY plane (p5 ellipse works in WEBGL)
    function drawFacingEllipse(w, h) { p.ellipse(0, 0, w, h); }

    // ---- point cloud -----------------------------------------------------
    function buildPoints() {
      img.loadPixels();
      const px = img.pixels;              // RGBA per pixel
      numPts = px.length / 4;
      pts = new Float32Array(numPts * 3);
      for (let i = 0; i < numPts; i++) {
        const r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2];
        pts[i * 3]     = (r / 255 * 2 - 1) * SIZER;  // map 0..255 -> -1..1 * sizer
        pts[i * 3 + 1] = (g / 255 * 2 - 1) * SIZER;
        pts[i * 3 + 2] = (b / 255 * 2 - 1) * SIZER;
      }
    }

    function drawSphere() {
      p.push();
      p.rotateY(rot / p.random(9.5, 10));
      p.rotateX(p.PI / p.random(15.5, 16));
      p.rotateY(p.PI / 12);
      p.rotateZ(p.PI);
      for (let i = 0; i < numPts; i += STEP) {
        p.push();
        p.translate(pts[i * 3], pts[i * 3 + 1], pts[i * 3 + 2]);
        p.rotateY(rot);
        p.rotateX(rot / 2);
        p.rotateZ(-rot / 3);
        rot += inc;
        p.stroke(50, 25);
        p.strokeWeight(2);
        p.fill(200 * Math.abs(Math.sin(p.frameCount / p.random(95, 100))), 25);
        p.ellipse(0, 0, 15, 15);
        p.pop();
      }
      p.pop();
    }

    function containerSize() {
      const el = document.getElementById(CONTAINER_ID);
      const w = (el && el.clientWidth)  || window.innerWidth;
      const h = (el && el.clientHeight) || window.innerHeight;
      return { w: Math.max(1, w), h: Math.max(1, h) };
    }

    p.preload = function () { img = p.loadImage(IMG_SRC); };

    p.setup = function () {
      const sz = containerSize();
      const c = p.createCanvas(sz.w, sz.h, p.WEBGL);
      c.parent(CONTAINER_ID);
      // keep the drawing buffer so frames accumulate into trails (no clear)
      p.setAttributes("preserveDrawingBuffer", true);
      gl = p.drawingContext;

      buildPoints();

      cam = p.createCamera();
      cam.setPosition(0, 0, 3200);
      cam.lookAt(0, 0, 0);

      const t = new Twin();
      t.initialize();
      twins.push(t);

      p.background(0);
    };

    p.draw = function () {
      // flat, additive-style accumulation: no depth test, no per-frame clear
      gl.disable(gl.DEPTH_TEST);
      p.orbitControl();

      drawSphere();
      for (const t of twins) t.draw();
    };

    p.mousePressed = function () {
      // only add a twin on a plain click inside the canvas (ignore orbit drags elsewhere)
      if (p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
        const t = new Twin();
        t.initialize();
        twins.push(t);
      }
    };

    p.windowResized = function () {
      const sz = containerSize();
      p.resizeCanvas(sz.w, sz.h);
      p.background(0);
    };

    p.keyPressed = function () {
      if (p.key === "b" || p.key === "B") p.background(0); // clear the trails
    };
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { new p5(sketch); });
  } else {
    new p5(sketch);
  }
})();
