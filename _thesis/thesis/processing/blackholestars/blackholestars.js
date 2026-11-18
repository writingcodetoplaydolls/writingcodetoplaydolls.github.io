/* =============================================================================
 *  FinalPerformanceVersionsBlackHoleStars  —  p5.js (WEBGL) port of the
 *  Processing GLSL sketch by Amy Traylor (Eden collaboration).
 *
 *  A rotating starfield; on "collapse" a black hole forms at centre and the
 *  infalling stars spiral in. The original drove a PShader fullscreen; here the
 *  same fragment shader runs on a full-canvas plane in p5 WEBGL.
 *
 *  Only shader1 (BlackHoleStarfieldMix) is ported — the original computed a
 *  second shader but never drew it (its image() call was commented out), and
 *  BlackHole7_31.glsl wasn't loaded.
 *
 *  The black hole OSCILLATES: its driving time ramps 0 -> maxTime -> 0 with a
 *  triangle wave, so the hole forms and then recedes, back and forth, forever
 *  (the shader's radius and star-spiral math reverse as time goes back down).
 *
 *    click / space : restart the oscillation cycle
 *    r             : switch to / from the plain (non-collapsing) starfield
 *    mouse         : passed to the shader as a normalized uniform
 *
 *  p5 INSTANCE MODE.
 * ========================================================================== */

(function () {
  "use strict";

  const CONTAINER_ID = "blackholestars-sketch";

  const sketch = function (p) {
    let shd;
    let state = 1.0;              // start collapsing + oscillating
    let currentTime = 0.0;        // time offset, reset to restart the cycle
    const maxTime = 365.0;
    const numStars = 500;
    const infallRatio = 0.33;
    const trailFade = 1.0;
    const PERIOD = 180.0;         // seconds for a full back-and-forth cycle (90s in, 90s out)

    function containerSize() {
      const el = document.getElementById(CONTAINER_ID);
      const w = (el && el.clientWidth)  || window.innerWidth;
      const h = (el && el.clientHeight) || window.innerHeight;
      return { w: Math.max(1, w), h: Math.max(1, h) };
    }

    p.preload = function () {
      shd = p.loadShader("blackholestars.vert", "blackholestars.frag");
    };

    p.setup = function () {
      const sz = containerSize();
      const c = p.createCanvas(sz.w, sz.h, p.WEBGL);
      c.parent(CONTAINER_ID);
      p.pixelDensity(1);           // so gl_FragCoord matches the resolution uniform
      p.noStroke();
      currentTime = p.millis() / 1000.0; // start the cycle at phase 0
    };

    p.draw = function () {
      const elapsed = p.millis() / 1000.0 - currentTime;

      let effTime;
      if (state > 0.5) {
        // triangle wave: 0 -> maxTime -> 0 -> ... (forms, then recedes)
        const ph = elapsed / (PERIOD / 2.0);        // 0,1,2,...
        const tri = 1.0 - Math.abs((ph % 2.0) - 1.0); // 0 -> 1 -> 0
        effTime = tri * maxTime;
      } else {
        effTime = elapsed;                          // plain rotating starfield
      }

      p.shader(shd);
      shd.setUniform("time", effTime);
      shd.setUniform("resolution", [p.width, p.height]);
      shd.setUniform("numStars", numStars);
      shd.setUniform("maxTime", maxTime);
      shd.setUniform("state", state);
      shd.setUniform("trailFade", trailFade);
      shd.setUniform("infallRatio", infallRatio);
      shd.setUniform("mouse", [p.mouseX / p.width, p.mouseY / p.height]);

      p.plane(p.width, p.height);  // full-canvas quad the shader paints
    };

    function collapse() {
      state = 1.0;
      currentTime = p.millis() / 1000.0; // restart the shader clock
    }
    function reset() {
      state = 0.0;
      currentTime = p.millis() / 1000.0;
    }

    p.mousePressed = function () {
      if (p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) collapse();
    };
    p.keyPressed = function () {
      if (p.key === " ") collapse();
      if (p.key === "r" || p.key === "R") reset();
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
