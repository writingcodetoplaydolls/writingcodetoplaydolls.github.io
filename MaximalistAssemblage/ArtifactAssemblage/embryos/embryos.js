/* =============================================================================
 *  Embryos7  —  p5.js (WEBGL) port of the Processing (P3D) sketch
 *  "Atomic Model Embryo Division" by Amy Traylor.
 *
 *  Faithful reimplementation of Embryos7.pde / Embryo.pde / EmbryoGroup.pde /
 *  colors.pde. Renders a gradient backdrop, a slowly rotating wireframe shell
 *  (zona pellucida), and video-textured spheres that drift, divide and shrink
 *  (cell division).
 *
 *  Written in p5 INSTANCE MODE so it never touches global scope and drops
 *  cleanly into any page (or iframe) without colliding with other scripts.
 * ========================================================================== */

(function () {
  "use strict";

  /* ---- Configuration (edit these) ---------------------------------------- */
  const CONTAINER_ID = "embryo-sketch";       // id of the host <div>
  const VIDEO_SRC    = "assets/Us.mp4";        // texture mapped onto the cells
  const GRADIENT_SRC = "assets/gradient-183.png"; // background image
  const WORLD        = 1500;                    // original sketch was 1500x1500
  const NUM_CELLS    = 24;                      // numbercells (division target)
  /* ------------------------------------------------------------------------ */

  const sketch = function (p) {

    // ---- palette (colors.pde) --------------------------------------------
    const COL = {};
    function setupColors() {
      COL.yellow          = p.color(249, 247, 139);
      COL.darkblue        = p.color(9, 16, 66);
      COL.lightblue       = p.color(155, 195, 246);
      COL.lightgreen      = p.color(119, 201, 153);
      COL.olivegreen      = p.color(89, 82, 27);
      COL.ltelectricblue  = p.color(166, 218, 239);
      COL.medelectricblue = p.color(42, 162, 222);
      COL.darkelectricblue= p.color(5, 54, 86);
      COL.red             = p.color(190, 43, 53);
      COL.black           = p.color(6, 8, 69);
    }

    // ---- state (globals from Embryos7.pde) -------------------------------
    let gradient, vid;
    let zona;                 // the shell EmbryoGroup
    let embryos = [];         // ArrayList<EmbryoGroup>
    let timer = 0;
    let sCount = 0;           // mirrors `s` (embryos.size()-1 at start)
    let radi = 200;
    let shrink = radi / (NUM_CELLS * 4);
    let currRadius = radi;
    let startShrinking = false;
    let embryosplit = false;
    let videoStarted = false;

    // Original used (450,450) for the shell but (width/2,height/2)=(750,750) for
    // the cells, so they never lined up. Center both on the true middle.
    const centerScreen = () => p.createVector(WORLD / 2, WORLD / 2, 0);

    // ---------------------------------------------------------------------
    //  EmbryoGroup  (EmbryoGroup.pde)
    // ---------------------------------------------------------------------
    class EmbryoGroup {
      constructor(origin, rad) {
        this.o = origin.copy();
        this.radius = rad;
        this.drift = 80;
        this.current = 0;
        // location always initialises to screen centre in the original
        this.location = p.createVector(WORLD / 2, WORLD / 2, 0);
        this.velocity = p.createVector(
          p.random(-3, 3), p.random(-3, 3), p.random(-3, 3)
        );
        this.rotX = 0; this.rotY = 0; this.rotZ = 0;
      }

      // scribbled wireframe sphere ("zona pellucida")
      drawShell() {
        const max = 900;
        p.push();
        this.rotX += 0.001;
        this.rotY += 0.005;
        this.rotZ -= 0.0015;
        p.translate(this.o.x, this.o.y, this.o.z);

        // Original looped y 0..1000 only to end on this colour; the inner
        // draw calls were commented out, so we set it once (big perf win).
        const c = p.lerpColor(COL.yellow, COL.darkelectricblue, 0.999);
        p.noFill();
        p.strokeWeight(3);
        p.stroke(p.red(c), p.green(c), p.blue(c), 100);

        for (let i = 0; i < 360; i += 5) {
          p.rotateY(this.rotY + i);
          p.rotateZ(this.rotZ + i);
          p.rotateZ(this.rotX + i); // (quirk preserved from original)
          drawHalfArc(max);
        }
        p.pop();
      }

      // drift within the shell, bouncing off the boundary
      drawEmbie(/* radi */) {
        const max = 900;
        if (this.current < this.drift) {
          this.current++;
          const d = this.o.dist(this.location);
          if (d < (max / 2) - this.radius) {
            this.location.add(this.velocity);
          } else {
            this.velocity.mult(-1);
            this.location.add(this.velocity);
          }
        }
      }
    }

    // ---------------------------------------------------------------------
    //  Embryo  (Embryo.pde)  — a drifting, rotating, video-textured sphere
    // ---------------------------------------------------------------------
    class Embryo extends EmbryoGroup {
      constructor(origin, rad) {
        super(origin, rad);
        this.radius = rad;
        this.rot = p.random(-1, 1);
        if (this.rot === 0) this.rot = -1;
        this.rotr = this.rot <= 0;   // rotr true => spin one way, else the other
      }

      drawEmbie(r) {
        super.drawEmbie(r);
        p.push();
        p.translate(this.location.x, this.location.y, this.location.z);
        p.rotateY(this.rot);
        p.rotateZ(this.rot / 2);
        p.rotateX(-this.rot);
        p.noStroke();
        if (vid) p.texture(vid);
        p.sphere(r, 20, 16);
        p.pop();
        this.rot += this.rotr ? 0.01 : -0.01;
      }
    }

    // half circle (upper half: -PI..0), replaces Processing's arc()
    function drawHalfArc(d) {
      p.noFill();
      p.beginShape();
      for (let a = -p.PI; a <= 0.0001; a += p.PI / 40) {
        p.vertex(p.cos(a) * d / 2, p.sin(a) * d / 2, 0);
      }
      p.endShape();
    }

    // merge_embryos() equivalent is inline below.

    function initEmbryos() {
      embryos = [];
      radi = 200;
      shrink = radi / (NUM_CELLS * 4);
      embryos.push(new Embryo(centerScreen(), radi));
      sCount = embryos.length - 1;              // s = embryos.size()-1
      zona = new EmbryoGroup(centerScreen(), radi);
      timer = 0;
      startShrinking = false;
      embryosplit = false;
    }

    // ---------------------------------------------------------------------
    //  p5 lifecycle
    // ---------------------------------------------------------------------
    function containerSize() {
      const el = document.getElementById(CONTAINER_ID);
      const w = (el && el.clientWidth)  || window.innerWidth;
      const h = (el && el.clientHeight) || window.innerHeight;
      return { w: Math.max(1, w), h: Math.max(1, h) };
    }

    p.preload = function () {
      gradient = p.loadImage(GRADIENT_SRC);
    };

    p.setup = function () {
      const sz = containerSize();
      const c = p.createCanvas(sz.w, sz.h, p.WEBGL);
      c.parent(CONTAINER_ID);

      // video texture — muted so it can autoplay
      vid = p.createVideo([VIDEO_SRC], function () {
        vid.elt.muted = true;
        vid.elt.setAttribute("playsinline", "");
        vid.elt.setAttribute("webkit-playsinline", "");
        vid.loop();
        const pr = vid.elt.play();
        if (pr && pr.then) pr.then(function () { videoStarted = true; })
                             .catch(function () { videoStarted = false; });
      });
      vid.hide();

      setupColors();
      initEmbryos();
    };

    p.draw = function () {
      p.background(COL.black);

      // ---- gradient backdrop (painted behind the 3D content) -------------
      if (gradient) {
        const gl = p.drawingContext;
        gl.disable(gl.DEPTH_TEST);
        p.push();
        p.noLights();
        p.texture(gradient);
        p.noStroke();
        // full-canvas quad at the camera plane
        p.image(gradient, -p.width / 2, -p.height / 2, p.width, p.height);
        p.pop();
        gl.enable(gl.DEPTH_TEST);
      }

      // ---- 3D scene ------------------------------------------------------
      // scale the original 1500-unit world to fit the canvas, and shift the
      // origin to the top-left so the original coordinates line up.
      const viewScale = Math.min(p.width, p.height) / WORLD;
      p.push();
      p.scale(viewScale);
      p.translate(-WORLD / 2, -WORLD / 2, -500);

      p.lights();
      p.directionalLight(100, 100, 0, -1, 1, -1);

      timer += 1;
      zona.drawShell();

      // ---- division / shrink state machine (drawEmbryos) ----------------
      if (sCount < NUM_CELLS) {
        if (timer % 50 === 0) {
          currRadius = radi;
          startShrinking = true;
        }
        if (embryosplit) {
          sCount = embryos.length;
          const newOnes = [];
          for (const e of embryos) {
            newOnes.push(new Embryo(e.location.copy(), radi));
          }
          embryos = embryos.concat(newOnes);
          embryosplit = false;
        }
      }

      for (const b of embryos) b.drawEmbie(radi);

      if (startShrinking) {
        if (radi > shrink) {
          if (radi > currRadius - radi * 0.3) {
            radi -= 5.0;
          } else {
            radi = currRadius - radi * 0.3;
            startShrinking = false;
            embryosplit = true;
          }
        } else {
          radi = shrink;
        }
      }

      p.pop();
    };

    p.windowResized = function () {
      const sz = containerSize();
      p.resizeCanvas(sz.w, sz.h);
    };

    // autoplay fallback: resume the video on first interaction
    function resumeVideo() {
      if (vid && !videoStarted) {
        const pr = vid.elt.play();
        if (pr && pr.then) pr.then(function () { videoStarted = true; })
                             .catch(function () {});
      }
    }
    p.mousePressed = resumeVideo;
    p.touchStarted = resumeVideo;

    // press 'r' to restart the division cycle
    p.keyPressed = function () {
      if (p.key === "r" || p.key === "R") initEmbryos();
    };
  };

  // boot once the DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { new p5(sketch); });
  } else {
    new p5(sketch);
  }
})();
