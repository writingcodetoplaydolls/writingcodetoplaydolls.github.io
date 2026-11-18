/* =============================================================================
 *  A pause control for the sketch in this window.
 *
 *  WCAG 2.2.2 (Pause, Stop, Hide, level A) applies to anything that moves by
 *  itself for more than five seconds beside other content. Each of these
 *  sketches is a window in a page of prose, so each one needs a way to stop it.
 *
 *  This file touches no sketch. It wraps the p5 constructor to get hold of the
 *  instance, then calls the instance's own noLoop() / loop(). It also pauses
 *  any video the sketch is using as a texture, and suspends the audio context
 *  if p5.sound is loaded -- stopping the drawing alone would leave those
 *  running unseen.
 *
 *  If the sketch turns out not to animate (the L-systems draw once and stop),
 *  no button appears.
 *
 *  Honours prefers-reduced-motion: the sketch is held still until asked for.
 *
 *  Load it BEFORE the sketch's own script.
 * ========================================================================== */

(function () {
  "use strict";

  var P5 = window.p5;
  if (!P5 || window.__sketchMotion) return;
  window.__sketchMotion = true;

  var instances = [];

  function Wrapped() {
    var made = Reflect.construct(P5, arguments);
    instances.push(made);
    return made;
  }
  Wrapped.prototype = P5.prototype;      // p5.prototype.registerMethod, addons
  Object.setPrototypeOf(Wrapped, P5);    // p5.Vector, p5.Geometry, p5.SoundFile
  window.p5 = Wrapped;

  var running = true;
  var resumeVideos = [];
  var button = null;

  function videos() {
    return Array.prototype.slice.call(document.querySelectorAll("video, audio"));
  }

  function hold() {
    running = false;
    instances.forEach(function (i) { try { i.noLoop(); } catch (e) {} });
    resumeVideos = videos().filter(function (v) { return !v.paused; });
    resumeVideos.forEach(function (v) { try { v.pause(); } catch (e) {} });
    try {
      var ctx = window.getAudioContext && window.getAudioContext();
      if (ctx && ctx.state === "running") ctx.suspend();
    } catch (e) {}
    label();
  }

  function release() {
    running = true;
    instances.forEach(function (i) { try { i.loop(); } catch (e) {} });
    resumeVideos.forEach(function (v) { v.play().catch(function () {}); });
    resumeVideos = [];
    try {
      var ctx = window.getAudioContext && window.getAudioContext();
      if (ctx && ctx.state === "suspended") ctx.resume();
    } catch (e) {}
    label();
  }

  function label() {
    if (!button) return;
    button.textContent = running ? "Pause" : "Play";
    button.setAttribute("aria-label", running ? "Pause the animation" : "Play the animation");
  }

  function build() {
    var css = document.createElement("style");
    css.textContent = [
      ".motion-hold{position:fixed;right:12px;bottom:12px;z-index:9999;",
      "  font:600 13px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;",
      "  color:#fff;background:#1a1a1a;border:1px solid #fff;border-radius:6px;",
      "  padding:9px 14px;min-width:68px;cursor:pointer;opacity:.75;",
      "  transition:opacity .2s ease}",          /* 17.4:1 white on #1a1a1a */
      ".motion-hold:hover,.motion-hold:focus{opacity:1}",
      ".motion-hold:focus-visible{outline:3px solid #ffbf47;outline-offset:2px;",
      "  box-shadow:0 0 0 6px rgba(0,0,0,.6)}",   /* a dark halo, so the ring
           holds against a white sketch as well as a black one */
      "@media print{.motion-hold{display:none}}"
    ].join("");
    document.head.appendChild(css);

    button = document.createElement("button");
    button.type = "button";
    button.className = "motion-hold";
    button.addEventListener("click", function () { running ? hold() : release(); });
    document.body.appendChild(button);
    label();
  }

  function animated() {
    return instances.some(function (i) {
      try { return typeof i.isLooping !== "function" || i.isLooping(); } catch (e) { return true; }
    });
  }

  // Give the sketch time to set up and decide whether it animates at all.
  setTimeout(function () {
    if (!instances.length || !animated()) return;
    build();
    var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
    if (still && still.matches) hold();
  }, 1500);
}());
