/* =============================================================================
 *  SphereHarmonics  —  p5.js (WEBGL) port of the Processing sketch by
 *  Amy Traylor (after Karsten Schmidt / toxiclibs + Paul Bourke).
 *
 *  The original used toxiclibs' SphericalHarmonics + SurfaceMeshBuilder to build
 *  a TriangleMesh and rendered it with per-vertex normal-mapped colours. p5 has
 *  no toxiclibs, so the spherical-harmonics surface is generated directly from
 *  Paul Bourke's formula and built into a p5.Geometry, coloured by vertex normal.
 *
 *    r      : randomize the harmonics (new form)
 *    move mouse : rotate (as in the original)
 *
 *  p5 INSTANCE MODE. No assets.
 * ========================================================================== */

(function () {
  "use strict";

  const CONTAINER_ID = "sphereharmonics-sketch";
  const RES = 64;          // grid resolution (phi x theta)
  const TARGET = 520;      // the form is auto-scaled so its radius ~ this

  const sketch = function (p) {
    let geo, cam;
    let version = 0;
    let m = new Array(8).fill(1);

    function randomizeM() {
      for (let i = 0; i < 8; i++) m[i] = Math.floor(p.random(9)); // 0..8, as original
    }

    // Paul Bourke / toxiclibs spherical harmonics radius
    function shRadius(phi, theta) {
      let r = 0;
      r += Math.pow(Math.sin(m[0] * phi), m[1]);
      r += Math.pow(Math.cos(m[2] * phi), m[3]);
      r += Math.pow(Math.sin(m[4] * theta), m[5]);
      r += Math.pow(Math.cos(m[6] * theta), m[7]);
      return r;
    }

    function buildMesh() {
      const g = new p5.Geometry();
      g.gid = "sphereharmonics-" + (version++); // stable id so p5 caches GPU buffers

      // vertices
      let maxR = 0.0001;
      for (let i = 0; i <= RES; i++) {
        const theta = (i / RES) * Math.PI;          // 0..PI
        const sinT = Math.sin(theta), cosT = Math.cos(theta);
        for (let j = 0; j <= RES; j++) {
          const phi = (j / RES) * Math.PI * 2;      // 0..2PI
          const r = shRadius(phi, theta);
          const x = r * sinT * Math.cos(phi);
          const y = r * cosT;
          const z = r * sinT * Math.sin(phi);
          g.vertices.push(p.createVector(x, y, z));
          const d = Math.sqrt(x * x + y * y + z * z);
          if (d > maxR) maxR = d;
        }
      }
      // normalize scale so the form is a consistent size regardless of m
      const s = TARGET / maxR;
      for (const v of g.vertices) v.mult(s);

      // faces (two triangles per grid cell)
      const stride = RES + 1;
      for (let i = 0; i < RES; i++) {
        for (let j = 0; j < RES; j++) {
          const a = i * stride + j;
          const b = a + 1;
          const c = a + stride;
          const d = c + 1;
          g.faces.push([a, c, b]);
          g.faces.push([b, c, d]);
        }
      }

      g.computeNormals();

      // colour each vertex by its normal (the original's normal-map look)
      g.vertexColors = [];
      for (const n of g.vertexNormals) {
        g.vertexColors.push(n.x * 0.5 + 0.5, n.y * 0.5 + 0.5, n.z * 0.5 + 0.5, 1);
      }
      return g;
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
      cam = p.createCamera();
      cam.setPosition(0, 0, TARGET * 3.2);   // pull back so the whole form fits
      cam.lookAt(0, 0, 0);
      randomizeM();
      geo = buildMesh();
    };

    p.draw = function () {
      p.background(0);

      // rotate from mouse position over the canvas (as the original did)
      p.rotateX(p.mouseY * 0.01);
      p.rotateY(p.mouseX * 0.01);

      // per-vertex normal colours carry the form's shading (the original's
      // "normal map" look); no material/lights so the colours render reliably.
      p.noStroke();
      p.model(geo);
    };

    p.windowResized = function () {
      const sz = containerSize();
      p.resizeCanvas(sz.w, sz.h);
    };

    p.keyPressed = function () {
      if (p.key === "r" || p.key === "R") {
        randomizeM();
        geo = buildMesh();
      }
    };
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { new p5(sketch); });
  } else {
    new p5(sketch);
  }
})();
