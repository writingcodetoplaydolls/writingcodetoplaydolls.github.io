/* =============================================================================
 *  SwitchScenes6  —  p5.js port of the Processing (P2D) sketch by Amy Traylor.
 *
 *  An "art-making machine": a shape (rectangle / ellipse / triangle / line,
 *  chosen by scene 0-3) travels across the screen and wraps around, leaving long
 *  trails because each frame paints a near-transparent black wash over the page.
 *  Driven entirely by keyboard controls (see bottom of file / the README).
 *
 *  p5 INSTANCE MODE. No assets.
 * ========================================================================== */

(function () {
  "use strict";

  const CONTAINER_ID = "switchscenes-sketch";
  const WORLD = 1100;

  // palette: #FF0505 #80F0D8 #FEFF0A #7832B7 #FA6635 #000AFF #FFFFFF
  const COLORS = [
    [255, 5, 5], [128, 240, 216], [254, 255, 10], [120, 50, 183],
    [250, 102, 53], [0, 10, 255], [255, 255, 255]
  ];

  const sketch = function (p) {
    let current = 0;            // which scene
    let xpos = 0, ypos = 0, w = 50, h = 50;
    let movement = 5;
    let currentColor = 0, currentColorSW = 1;
    let sW = 2.0;
    let directionX = 0, directionY = 0;
    const max = WORLD, min = 0;
    let rotateMode = 0;         // was `rotate` (int) in the original
    let rot = 0, inc = 0;
    let lightingInc = 1;
    let alpha = 255;

    function fillC(idx, a) { p.fill(COLORS[idx][0], COLORS[idx][1], COLORS[idx][2], a); }
    function strokeC(idx, a) { p.stroke(COLORS[idx][0], COLORS[idx][1], COLORS[idx][2], a); }

    // custom shape helpers (original overrode triangle()/added newline())
    function tri(x, y, W, H) { p.triangle(x - W / 2, y - H / 2, x, y - H, x + W / 2, y - H / 2); }
    function newline(x2, y2, W2, H2) { p.line(x2, y2, x2 + W2, y2 - H2); }

    function sceneShape(kind) {
      fillC(currentColor, alpha);
      strokeC(currentColorSW, alpha);
      p.strokeWeight(Math.abs(sW));
      if (rotateMode < 3) {
        if (kind === 0) p.rectMode(p.CENTER);
        p.push();
        p.translate(xpos, ypos);
        p.rotate(rot);
        if (kind === 0) p.rect(0, 0, w, h);
        else if (kind === 1) p.ellipse(0, 0, w, h);
        else if (kind === 2) tri(0, 0, w, h);
        else newline(0, 0, w, h);
        p.pop();
      } else {
        if (kind === 0) p.rectMode(p.CENTER);
        if (kind === 0) p.rect(xpos, ypos, w, h);
        else if (kind === 1) p.ellipse(xpos, ypos, w, h);
        else if (kind === 2) tri(xpos, ypos, w, h);
        else newline(xpos, ypos, w, h);
      }
      rot += inc;
    }

    function containerSize() {
      const el = document.getElementById(CONTAINER_ID);
      const cw = (el && el.clientWidth)  || window.innerWidth;
      const ch = (el && el.clientHeight) || window.innerHeight;
      return { w: Math.max(1, cw), h: Math.max(1, ch) };
    }

    p.setup = function () {
      const sz = containerSize();
      const c = p.createCanvas(sz.w, sz.h);
      c.parent(CONTAINER_ID);
      p.background(255);
    };

    p.draw = function () {
      // trail wash (screen space, before the world transform)
      if (p.frameCount % lightingInc === 0) {
        p.push();
        p.fill(0, 1);
        p.noStroke();
        p.rectMode(p.CORNER);
        p.rect(0, 0, p.width, p.height);
        p.pop();
      }

      const viewScale = Math.min(p.width, p.height) / WORLD;
      p.push();
      p.translate(p.width / 2, p.height / 2);
      p.scale(viewScale);
      p.translate(-WORLD / 2, -WORLD / 2);

      switch (current) {
        case 0: sceneShape(0); break;
        case 1: sceneShape(1); break;
        case 2: sceneShape(2); break;
        case 3: sceneShape(3); break;
        default: sceneShape(0); break;
      }

      // movement + wraparound
      if (directionX === 0) {
        if (xpos < max + w) xpos += movement; else xpos = min - w;
      } else {
        if (xpos > min - w) xpos -= movement; else xpos = max + w;
      }
      if (directionY === 0) {
        if (ypos < max + h) ypos += movement; else ypos = min - h;
      } else {
        if (ypos > min - h) ypos -= movement; else ypos = max + h;
      }

      p.pop();
    };

    p.windowResized = function () {
      const sz = containerSize();
      p.resizeCanvas(sz.w, sz.h);
    };

    p.mousePressed = function () {
      if (p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
        p.background(0);
      }
    };

    p.keyPressed = function () {
      if (p.key === " ") {
        currentColor = Math.floor(p.random(COLORS.length));
        currentColorSW = Math.floor(p.random(COLORS.length));
        xpos = Math.floor(p.random(-w, WORLD + w));
        ypos = Math.floor(p.random(-h, WORLD + h));
        w = Math.floor(p.random(50, 250));
        h = Math.floor(p.random(50, 250));
        movement = Math.floor(p.random(5, 25));
        sW = Math.floor(p.random(0, 5));
        directionX = Math.floor(p.random(2));
        directionY = Math.floor(p.random(2));
        rotateMode = Math.floor(p.random(4));
      }
      if (p.key === "0") current = 0;
      if (p.key === "1") current = 1;
      if (p.key === "2") current = 2;
      if (p.key === "3") current = 3;
      if (p.keyCode === p.UP) inc += 0.01;
      if (p.keyCode === p.DOWN) inc -= 0.01;
      if (p.keyCode === p.LEFT) movement += 0.1;
      if (p.keyCode === p.RIGHT) movement -= 0.1;
      if (p.key === "d" || p.key === "D") {
        directionX = Math.floor(p.random(2));
        directionY = Math.floor(p.random(2));
      }
      if (p.key === "r" || p.key === "R") rotateMode = rotateMode > 2 ? 0 : 3;
      if (p.key === "c" || p.key === "C") {
        currentColor = Math.floor(p.random(COLORS.length));
        currentColorSW = Math.floor(p.random(COLORS.length));
      }
      if (p.key === "l") lightingInc += 1;
      if (p.key === "k") { if (lightingInc > 1) lightingInc -= 1; }
      if (p.key === "w") sW += 0.1;
      if (p.key === "q") { if (sW > 0) sW -= 0.1; }
      if (p.key === "a") alpha += 1;
      if (p.key === "f") { if (alpha > 0) alpha -= 1; }
      if (p.key === "b" || p.key === "B") p.background(0);
    };
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { new p5(sketch); });
  } else {
    new p5(sketch);
  }
})();
