/* =============================================================================
 *  PlayHouse6  —  p5.js (WEBGL) port of the Processing (P3D) sketch by
 *  Amy Traylor.
 *
 *  A slowly orbiting camera looks at a little "house" built from video-textured
 *  panels (roofs, walls, floor) and a video-textured 3-D model (Greg reaching).
 *  The piece cuts between ~13 scenes on a random timer, over accumulating trails.
 *
 *  Ports of library features:
 *    - damkjer.ocd Camera  -> an orbiting p5 camera (camera() each frame)
 *    - processing.video    -> createVideo() textures
 *    - loadShape(.obj)     -> loadModel(), textured with video via its UVs
 *
 *  The Wiggler / WalkerAnimation classes are omitted: drawWigglies() is never
 *  called in the original draw loop.
 *
 *  NOTE on assets: the original loaded "Animation1_2.mp4" (not present in the
 *  project folder). "Animation4_100square.mp4" is substituted as `vidA`. Swap
 *  VID_A below if you have the original.
 *
 *  p5 INSTANCE MODE.
 * ========================================================================== */

(function () {
  "use strict";

  const CONTAINER_ID = "playhouse-sketch";
  const W = 960, H = 1080;                 // original canvas / world size

  const VID_A  = "assets/animation.mp4";   // was Animation1_2.mp4 (missing)
  const VID_2  = "assets/quilt2.mp4";
  const VID_3  = "assets/quilt.mp4";
  const MODEL  = "assets/greg.obj";

  // palettes (Colors.pde) used for the occasional background flash
  const PALETTES = [
    ["#A51C30","#D16103","#F4EDCA","#C4961A","#FFDB6D"],
    ["#022601","#487329","#A6BF6F","#BFAB8E","#D98B48"],
    ["#41110F","#F8BA65","#F3AF20","#6EC7AB","#ED2B22"],
    ["#3BBFA7","#02735E","#014034","#F2B035","#F27127"],
    ["#5E005E","#AB2F52","#E55D4A","#E88554","#FFAF53"],
    ["#4A849f","#182E38","#B4D6C6","#F5F1D5","#FF4D61"],
    ["#D7C048","#D9D4B5","#F2B946","#D82C2B","#C2292B"],
    ["#397521","#A1FF7B","#6CC24A","#75156C","#C24AB7"],
    ["#99BBC1","#D1CFD8","#EF5EA9","#D8AE8E","#EFDE6C"],
    ["#F29AA1","#2EA690","#1F844E","#A67563","#D9ABA0"],
    ["#F18A9B","#DB4A6E","#A63B56","#5C2D3A","#D7A0AE"],
    ["#2E112D","#540032","#820333","#C9283E","#F0433A"],
    ["#F29821","#ED4A6B","#FFFFFF","#7ED642","#D3CDC7"]
  ];

  const sketch = function (p) {
    let vidA, vid2, vid3, greg;
    let gl;
    const target = { x: W / 2, y: H / 2, z: 0 };
    let orbit = 0;
    let a = 6;                 // current scene (start on the full house)
    let newVal = 80;           // frames between scene changes
    let sceneTimer = 0;
    let started = false;

    // ---- orbiting camera (emulates OCD Camera.circle) --------------------
    function setOrbitCamera(ex, ey, ez, inc) {
      orbit += inc;
      const rx = ex - target.x, ry = ey - target.y, rz = ez - target.z;
      const R = Math.sqrt(rx * rx + rz * rz) || 0.0001;
      const base = Math.atan2(rx, rz);
      const x = target.x + R * Math.sin(base + orbit);
      const z = target.z + R * Math.cos(base + orbit);
      p.camera(x, target.y + ry, z, target.x, target.y, target.z, 0, 1, 0);
    }

    // ---- House (textured panels) -----------------------------------------
    const house = {
      x: W * 0.4, y: H / 5, z: 0, w: 200, h: 200,
      get rightWall() { return this.z - this.x / 4; },
      get leftWall()  { return this.z + this.x / 4; },

      panel(tex, verts) {
        p.push();
        p.noStroke();
        p.textureMode(p.NORMAL);
        if (tex) p.texture(tex);
        p.beginShape();
        for (const v of verts) p.vertex(v[0], v[1], v[2], v[3], v[4]);
        p.endShape();
        p.pop();
      },
      leftRoof(tex) {
        const { x, y, z, w, h } = this;
        this.panel(tex, [
          [x, y, z, 0, 0], [x + w, y, z, 1, 0],
          [x + w * 1.5, y + h, z + x / 4, 1, 1], [x + w / 2, y + h, z + x / 4, 0, 1],
        ]);
      },
      rightRoof(tex) {
        const { x, y, z, w, h } = this;
        this.panel(tex, [
          [x, y, z, 0, 0], [x + w, y, z, 1, 0],
          [x + w, y + h, z - x / 4, 1, 1], [x - w / 2, y + h, z - x / 4, 0, 1],
        ]);
      },
      leftWallFace(tex) {
        const { x, y, w, h, leftWall } = this;
        this.panel(tex, [
          [x, y + h * 2, leftWall, 0, 0], [x + w / 2, y + h * 2, leftWall, 1, 0],
          [x + w / 2, y + h, leftWall, 1, 1], [x + w * 1.5, y + h, leftWall, 0, 1],
        ]);
      },
      rightWallFace(tex) {
        const { x, y, w, h, rightWall } = this;
        this.panel(tex, [
          [x, y + h * 2, rightWall, 0, 0], [x + w, y + h * 2, rightWall, 1, 0],
          [x + w, y + h, rightWall, 1, 1], [x - w / 2, y + h, rightWall, 0, 1],
        ]);
      },
      floor(tex) {
        const { x, y, w, h, rightWall, leftWall } = this;
        this.panel(tex, [
          [x - w / 2, y + h * 2, rightWall, 0, 0], [x + w, y + h * 2, rightWall, 0, 1],
          [x + w * 1.5, y + h * 2, leftWall, 1, 1], [x + w / 2, y + h * 2, leftWall, 0, 1],
        ]);
      },
      build() {
        this.leftRoof(vidA); this.leftWallFace(vid2);
        this.rightRoof(vidA); this.rightWallFace(vid2); this.floor(vid3);
      }
    };

    function drawModel(spin) {
      p.push();
      p.translate(W / 2, H / 2 + 50, 0);
      if (spin) {
        p.rotateX(3.5 + p.frameCount * 0.01);
        p.rotateY(9.5 - p.frameCount * 0.01);
        p.rotateZ(-5.6 - p.frameCount * 0.03);
      } else {
        p.rotateX(3.5); p.rotateY(19); p.rotateZ(5.6);
      }
      p.noStroke();
      p.texture(vid3);
      p.scale(1.4);           // normalized model is ~100 units; small beside the house
      if (greg) p.model(greg);
      p.pop();
    }

    function drawFullscreenVideo(v) {
      gl.disable(gl.DEPTH_TEST);
      // own flat projection/camera (reset again next frame by draw())
      p.ortho(-p.width / 2, p.width / 2, -p.height / 2, p.height / 2, -1000, 1000);
      p.camera(0, 0, 100, 0, 0, 0, 0, 1, 0);
      p.noStroke();
      p.texture(v);
      p.plane(p.width, p.height);
      gl.enable(gl.DEPTH_TEST);
    }

    function sceneLights() {
      p.ambientLight(150, 150, 150);
      p.pointLight(127, 127, 127, W / 2, H / 2, 300);
      p.directionalLight(255, 245, 215, -1, 1, 0);
    }

    function clearBG(col) { p.background(col); }

    function getNewValue() {
      newVal = Math.floor(p.random(30, 130));
      if (newVal % 34 === 0) {
        const pal = PALETTES[Math.floor(p.random(PALETTES.length))];
        clearBG(pal[Math.floor(p.random(pal.length))]);
      }
    }

    function containerSize() {
      const el = document.getElementById(CONTAINER_ID);
      const w = (el && el.clientWidth)  || window.innerWidth;
      const h = (el && el.clientHeight) || window.innerHeight;
      return { w: Math.max(1, w), h: Math.max(1, h) };
    }

    function makeVideo(src) {
      const v = p.createVideo([src], function () {
        v.elt.muted = true;
        v.elt.setAttribute("playsinline", "");
        v.loop();
        const pr = v.elt.play();
        if (pr && pr.catch) pr.catch(function () {});
      });
      v.hide();
      return v;
    }

    p.preload = function () {
      greg = p.loadModel(MODEL, true); // normalize => predictable scale
    };

    p.setup = function () {
      const sz = containerSize();
      const c = p.createCanvas(sz.w, sz.h, p.WEBGL);
      c.parent(CONTAINER_ID);
      p.setAttributes("preserveDrawingBuffer", true); // trails (no per-frame clear)
      gl = p.drawingContext;
      vidA = makeVideo(VID_A);
      vid2 = makeVideo(VID_2);
      vid3 = makeVideo(VID_3);
      p.background(255);
    };

    p.draw = function () {
      // Orthographic projection containing the 960x1080 world (the original's
      // scenes use ortho(), which renders ~1:1 and centres the house), with a
      // little margin and "contain" fitting to any canvas aspect.
      const ca = p.width / p.height, wa = W / H, margin = 1.15;
      let halfW, halfH;
      if (ca > wa) { halfH = (H / 2) * margin; halfW = halfH * ca; }
      else { halfW = (W / 2) * margin; halfH = halfW / ca; }
      p.ortho(-halfW, halfW, -halfH, halfH, 0.1, 8000);
      setOrbitCamera(W / 2, H / 2, 2000, 0.05); // orbit radius (ortho: size unaffected)

      // clean-house scenes clear to white each frame (as the original did)
      if (a === 6 || a === 7 || a === 9 || a === 10) p.background(255);

      sceneLights();

      switch (a) {
        case 0: house.leftRoof(vidA); break;
        case 1: house.rightRoof(vidA); break;
        case 2: house.leftWallFace(vid2); break;
        case 3: house.rightWallFace(vid2); break;
        case 4: house.floor(vid3); break;
        case 5: drawModel(false); break;
        case 6: house.build(); break;
        case 7: house.build(); drawModel(false); break;
        case 8: drawModel(false); break;
        case 9: drawModel(false); break;
        case 10: house.build(); drawModel(false); break;
        case 11: drawModel(true); break;
        case 12: drawFullscreenVideo(vidA); break;
        default: break;
      }

      // scene timer
      sceneTimer++;
      if (sceneTimer >= newVal) {
        a = Math.floor(p.random(13));
        getNewValue();
        sceneTimer = 0;
      }
    };

    p.windowResized = function () {
      const sz = containerSize();
      p.resizeCanvas(sz.w, sz.h);
      p.background(255);
    };

    function resume() {
      [vidA, vid2, vid3].forEach(function (v) {
        if (v && v.elt && v.elt.paused) { const pr = v.elt.play(); if (pr && pr.catch) pr.catch(function(){}); }
      });
    }
    p.mousePressed = function () { a = a < 12 ? a + 1 : 0; resume(); };
    p.touchStarted = resume;
    p.keyPressed = function () { if (p.key === "b" || p.key === "B") p.background(255); };
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { new p5(sketch); });
  } else {
    new p5(sketch);
  }
})();
