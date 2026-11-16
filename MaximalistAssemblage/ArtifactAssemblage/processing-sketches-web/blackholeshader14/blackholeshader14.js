/* =============================================================================
 *  BlackHoleShaderJuly14  —  p5.js (WEBGL) port of the Processing GLSL sketch
 *  by Amy Traylor (Eden collaboration).
 *
 *  Same family as the July16 version, but no zoom and both sphere layers are
 *  blended. In the original, the MOUSE already controlled bumpiness (mouse Y) and
 *  ring spacing (mouse X); only `radius` and `timeDiv` (speed) came solely from
 *  MIDI. So MIDI + audio input are removed and those two are bound to the KEYBOARD,
 *  while bumpiness / ring spacing stay on the mouse exactly as the sketch intended:
 *
 *      up / down     : radius
 *      left / right  : animation speed (left slower, right faster)
 *      mouse X       : ring spacing
 *      mouse Y       : bumpiness (surface ripple)
 *      0             : reset radius & speed
 *
 *  p5 INSTANCE MODE.
 * ========================================================================== */

(function () {
  "use strict";

  const CONTAINER_ID = "blackholeshader14-sketch";

  const DEF = { radius: 1.5, timeDiv: 1000.0 };
  const R_RADIUS = [0.01, 2.0];
  const R_TIMEDIV = [100.0, 100000.0];

  const sketch = function (p) {
    let shd;
    let radius = DEF.radius;
    let timeDiv = DEF.timeDiv;
    let mouseActive = false;

    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

    function containerSize() {
      const el = document.getElementById(CONTAINER_ID);
      const w = (el && el.clientWidth)  || window.innerWidth;
      const h = (el && el.clientHeight) || window.innerHeight;
      return { w: Math.max(1, w), h: Math.max(1, h) };
    }

    function handleKeys() {
      if (p.keyIsDown(p.UP_ARROW))    radius = clamp(radius + 0.01, R_RADIUS[0], R_RADIUS[1]);
      if (p.keyIsDown(p.DOWN_ARROW))  radius = clamp(radius - 0.01, R_RADIUS[0], R_RADIUS[1]);
      if (p.keyIsDown(p.LEFT_ARROW))  timeDiv = clamp(timeDiv * 1.03, R_TIMEDIV[0], R_TIMEDIV[1]); // slower
      if (p.keyIsDown(p.RIGHT_ARROW)) timeDiv = clamp(timeDiv / 1.03, R_TIMEDIV[0], R_TIMEDIV[1]); // faster
    }

    p.preload = function () {
      shd = p.loadShader("blackholeshader14.vert", "blackholeshader14.frag");
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

      // mouse -> ring spacing (X) and bumpiness (Y), as in the original draw()
      const mx = mouseActive ? clamp(p.mouseX, 0, p.width) : p.width * 0.5;
      const my = mouseActive ? clamp(p.mouseY, 0, p.height) : p.height * 0.5;
      const ringSpacing = p.map(mx, 0, p.width, 0.025, 0.45);
      const bumpiness = p.map(my, 0, p.height, 0.25, 0.62);

      p.shader(shd);
      shd.setUniform("resolution", [p.width, p.height]);
      shd.setUniform("time", p.millis() / timeDiv);
      shd.setUniform("radius", radius);
      shd.setUniform("ringSpacing", ringSpacing);
      shd.setUniform("bumpiness", bumpiness);
      shd.setUniform("mouse", [0, 0]); // original never set this uniform (stays 0)

      p.plane(p.width, p.height);
    };

    p.mouseMoved = function () { mouseActive = true; };

    p.keyPressed = function () {
      if (p.key === "0") { radius = DEF.radius; timeDiv = DEF.timeDiv; }
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
