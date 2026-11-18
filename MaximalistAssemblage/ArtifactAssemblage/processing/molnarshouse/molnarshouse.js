/* =============================================================================
 *  MolnarsHouse23  —  p5.js (WEBGL) port of the Processing (P3D) sketch by
 *  Amy Traylor (after Vera Molnar).
 *
 *  A generative "house": a box base plus wobbly stacked "stories", redrawn once
 *  per second with fresh random jitter, slowly rotating. White faces, black
 *  edges, on black. No assets.
 *
 *  The original aliases the corners/prevCorners PVector arrays (assignment copies
 *  references, then .add() mutates the shared objects); that aliasing is part of
 *  the look, so it is reproduced here with the same reference semantics.
 *
 *  p5 INSTANCE MODE.
 * ========================================================================== */

(function () {
  "use strict";

  const CONTAINER_ID = "molnarshouse-sketch";
  const WORLD = 800;

  const sketch = function (p) {
    let rot = 0.5;
    let ranOffset = 0;
    let corners = new Array(8);
    let prevCorners = new Array(8);

    function V(x, y, z) { return p.createVector(x, y, z); }

    function quad(a, b, c, d) {
      p.beginShape();
      p.vertex(a.x, a.y, a.z);
      p.vertex(b.x, b.y, b.z);
      p.vertex(c.x, c.y, c.z);
      p.vertex(d.x, d.y, d.z);
      p.endShape(p.CLOSE);
    }

    function houseBoxBase(cx, cy, cz, w, h, variance) {
      corners[0] = V(cx - w / 2, cy + h / 2, cz + w / 2);
      corners[1] = V(cx + w / 2, cy + h / 2, cz + w / 2);
      corners[2] = V(cx + w / 2, cy + h / 2, cz - w / 2);
      corners[3] = V(cx - w / 2, cy + h / 2, cz - w / 2);

      corners[4] = V(cx - w / 2, cy - h / 2, cz + w / 2);
      let v = p.random(-variance, variance); corners[4].add(V(v, v, v));
      corners[5] = V(cx + w / 2, cy - h / 2, cz + w / 2);
      v = p.random(-variance, variance); corners[5].add(V(v, v, v));
      corners[6] = V(cx + w / 2, cy - h / 2, cz - w / 2);
      v = p.random(-variance, variance); corners[6].add(V(v, v, v));
      corners[7] = V(cx - w / 2, cy - h / 2, cz - w / 2);
      v = p.random(-variance, variance); corners[7].add(V(v, v, v));

      for (let i = 0; i < 8; i++) prevCorners[i] = corners[i]; // arrayCopy (refs)

      quad(corners[3], corners[0], corners[4], corners[7]); // left
      quad(corners[0], corners[1], corners[5], corners[4]); // back
      quad(corners[1], corners[2], corners[6], corners[5]); // right
      quad(corners[2], corners[3], corners[7], corners[6]); // front
    }

    function stories(variance, h) {
      // bottom = prevCorners[4..7], top = corners[4..7] raised by h
      quad(prevCorners[7], prevCorners[4], V(corners[4].x, corners[4].y - h, corners[4].z), V(corners[7].x, corners[7].y - h, corners[7].z));
      quad(prevCorners[4], prevCorners[5], V(corners[5].x, corners[5].y - h, corners[5].z), V(corners[4].x, corners[4].y - h, corners[4].z));
      quad(prevCorners[5], prevCorners[6], V(corners[6].x, corners[6].y - h, corners[6].z), V(corners[5].x, corners[5].y - h, corners[5].z));
      quad(prevCorners[6], prevCorners[7], V(corners[7].x, corners[7].y - h, corners[7].z), V(corners[6].x, corners[6].y - h, corners[6].z));

      prevCorners[4] = corners[4]; prevCorners[5] = corners[5];
      prevCorners[6] = corners[6]; prevCorners[7] = corners[7];

      let v = p.random(-variance, variance); corners[4].add(V(v, v, v));
      v = p.random(-variance, variance); corners[5].add(V(v, v, v));
      v = p.random(-variance, variance); corners[6].add(V(v, v, v));
      v = p.random(-variance, variance); corners[7].add(V(v, v, v));
    }

    function containerSize() {
      const el = document.getElementById(CONTAINER_ID);
      const w = (el && el.clientWidth)  || window.innerWidth;
      const h = (el && el.clientHeight) || window.innerHeight;
      return { w: Math.max(1, w), h: Math.max(1, h) };
    }

    p.setup = function () {
      const sz = containerSize();
      const c = p.createCanvas(sz.w, sz.h, p.WEBGL);
      c.parent(CONTAINER_ID);
      p.frameRate(1); // one generative redraw per second, as the original
    };

    p.draw = function () {
      p.background(0);
      p.fill(255);
      p.stroke(0);
      p.strokeWeight(1);

      const vs = Math.min(p.width, p.height) / WORLD;

      // block 1: base
      ranOffset = p.random(-100, 100);
      p.push(); p.scale(vs); p.translate(0, 300, -500); p.rotateY(rot);
      houseBoxBase(0, 0, 0, 300, 300, ranOffset); p.pop();

      // blocks 2-4: stories (two at the same height offset, as the original)
      ranOffset = p.random(-100, 100);
      p.push(); p.scale(vs); p.translate(0, 300, -500); p.rotateY(rot);
      stories(ranOffset, 300); p.pop();

      p.push(); p.scale(vs); p.translate(0, 0, -500); p.rotateY(rot);
      stories(ranOffset, 300); p.pop();

      p.push(); p.scale(vs); p.translate(0, 0, -500); p.rotateY(rot);
      stories(ranOffset, 300); p.pop();

      rot += 0.1;
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
