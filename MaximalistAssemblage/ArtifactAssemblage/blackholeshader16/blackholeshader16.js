/* =============================================================================
 *  BlackHoleShaderJuly16  —  p5.js (WEBGL) port of the Processing GLSL sketch
 *  by Amy Traylor (Eden collaboration).
 *
 *  A layered, rippling black-hole shader. The original was driven by a MIDI
 *  controller (themidibus) + audio input; neither exists on the web, so those
 *  are removed and the parameters the MIDI controlled are bound to the KEYBOARD:
 *
 *      up / down     : radius
 *      left / right  : animation speed (left slower, right faster)
 *      W / S         : bumpiness (surface ripple)
 *      A / D         : ring spacing
 *      mouse X       : zoom (as in the original; also drives the fade)
 *      0             : reset all parameters
 *
 *  (Both arrow keys and WASD are used because there are four adjustable params.)
 *  distDiv / baseRadius from the MIDI code were dropped — the shader never used
 *  them.
 *
 *  p5 INSTANCE MODE.
 * ========================================================================== */

(function () {
  "use strict";

  const CONTAINER_ID = "blackholeshader-sketch";

  // defaults match what the original actually rendered
  const DEF = { radius: 1.0, timeDiv: 10000.0, bumpiness: 0.62, ringSpacing: 0.45 };
  const RANGE = {
    radius:      [0.01, 2.0],
    timeDiv:     [100.0, 100000.0],
    bumpiness:   [0.1, 5.0],
    ringSpacing: [0.005, 2.0]
  };

  const sketch = function (p) {
    let shd;
    let radius = DEF.radius;
    let timeDiv = DEF.timeDiv;
    let bumpiness = DEF.bumpiness;
    let ringSpacing = DEF.ringSpacing;
    let mouseActive = false;

    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

    function containerSize() {
      const el = document.getElementById(CONTAINER_ID);
      const w = (el && el.clientWidth)  || window.innerWidth;
      const h = (el && el.clientHeight) || window.innerHeight;
      return { w: Math.max(1, w), h: Math.max(1, h) };
    }

    function handleKeys() {
      // arrows: radius (up/down) and speed (left/right)
      if (p.keyIsDown(p.UP_ARROW))    radius = clamp(radius + 0.01, RANGE.radius[0], RANGE.radius[1]);
      if (p.keyIsDown(p.DOWN_ARROW))  radius = clamp(radius - 0.01, RANGE.radius[0], RANGE.radius[1]);
      if (p.keyIsDown(p.LEFT_ARROW))  timeDiv = clamp(timeDiv * 1.03, RANGE.timeDiv[0], RANGE.timeDiv[1]); // slower
      if (p.keyIsDown(p.RIGHT_ARROW)) timeDiv = clamp(timeDiv / 1.03, RANGE.timeDiv[0], RANGE.timeDiv[1]); // faster
      // WASD: bumpiness (W/S) and ring spacing (A/D)
      if (p.keyIsDown(87)) bumpiness = clamp(bumpiness + 0.03, RANGE.bumpiness[0], RANGE.bumpiness[1]);     // W
      if (p.keyIsDown(83)) bumpiness = clamp(bumpiness - 0.03, RANGE.bumpiness[0], RANGE.bumpiness[1]);     // S
      if (p.keyIsDown(68)) ringSpacing = clamp(ringSpacing + 0.01, RANGE.ringSpacing[0], RANGE.ringSpacing[1]); // D
      if (p.keyIsDown(65)) ringSpacing = clamp(ringSpacing - 0.01, RANGE.ringSpacing[0], RANGE.ringSpacing[1]); // A
    }

    p.preload = function () {
      shd = p.loadShader("blackholeshader16.vert", "blackholeshader16.frag");
    };

    p.setup = function () {
      const sz = containerSize();
      const c = p.createCanvas(sz.w, sz.h, p.WEBGL);
      c.parent(CONTAINER_ID);
      p.pixelDensity(1);
      p.noStroke();
    };

    p.draw = function () {
      handleKeys();

      // mouse X -> zoom (default to centre until the mouse is used)
      const mxpix = mouseActive ? clamp(p.mouseX, 0, p.width) : p.width * 0.5;
      const mypix = mouseActive ? clamp(p.mouseY, 0, p.height) : p.height * 0.5;
      const zoom = p.map(mxpix, 0, p.width, 2.0, 0.001);

      p.shader(shd);
      shd.setUniform("resolution", [p.width, p.height]);
      shd.setUniform("time", p.millis() / timeDiv);
      shd.setUniform("radius", radius);
      shd.setUniform("ringSpacing", ringSpacing);
      shd.setUniform("bumpiness", bumpiness);
      shd.setUniform("zoom", zoom);
      shd.setUniform("mouse", [zoom, mypix]);

      p.plane(p.width, p.height);
    };

    p.mouseMoved = function () { mouseActive = true; };

    p.keyPressed = function () {
      if (p.key === "0") {
        radius = DEF.radius; timeDiv = DEF.timeDiv;
        bumpiness = DEF.bumpiness; ringSpacing = DEF.ringSpacing;
      }
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
