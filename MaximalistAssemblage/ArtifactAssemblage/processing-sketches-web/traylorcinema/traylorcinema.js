/* =============================================================================
 *  TraylorCinema5  —  p5.js port of the Processing (P3D) "generative cinema"
 *  sketch by Amy Traylor.
 *
 *  Two side-by-side panels each show a random frame from a set of rendered
 *  images, cross-fading with shifting blend modes; timing is driven by the
 *  brightness of a sampled pixel. Looping audio plays underneath, with a short
 *  whisper sample triggered on slow cuts.
 *
 *  Ported library features:
 *    - ddf.minim  ->  p5.sound (AudioPlayer -> loadSound loop; AudioSample ->
 *                     a short sound played/panned on trigger)
 *
 *  ⚠ REQUIRES ASSETS that were NOT in the project zip:
 *    - assets/images/housePlay0.png ... housePlay{NUM_IMAGES-1}.png
 *      (these are rendered frames from the PlayHouse sketch; the zip's images/
 *       folder was empty). Drop them in and set NUM_IMAGES below.
 *    - assets/bellows4.wav  and  assets/carmenwhisper2.wav  (present in the zip;
 *      copy them into assets/).
 *
 *  Browsers block audio until a user gesture, so there's a click-to-start.
 *  This is the one sketch that could not be verified without the images.
 *
 *  p5 INSTANCE MODE.
 * ========================================================================== */

(function () {
  "use strict";

  const CONTAINER_ID = "traylorcinema-sketch";
  const W = 1920, H = 1080;
  const NUM_IMAGES = 465;            // housePlay0..464 (adjust to how many you have)
  const BUFFER = 10;
  const IMG_PATH = n => "assets/images/housePlay" + n + ".png";

  const sketch = function (p) {
    // Processing blend ints {128,1,2,4,16,32,0,8,64,256} -> p5 blend modes
    let BLENDS;
    let images = [];
    let currentimage = 0, currentimage2 = 1;
    let imagealpha = 255, imagealpha2 = 255;
    let timedelay = 20, timedelay2 = 50, counter = 0, counter2 = 0;
    let blender = 0, blender2 = 2;
    let startCounting = true, startCounting2 = true;
    let loaded = false, audioStarted = false, started = false;
    let bellows, whisper;

    function loadBuffer() {
      for (let i = 0; i < BUFFER; i++) {
        const r = Math.floor(p.random(NUM_IMAGES));
        images[i] = p.loadImage(IMG_PATH(r), null, function () {/* ignore 404s */});
      }
    }

    function containerSize() {
      const el = document.getElementById(CONTAINER_ID);
      const w = (el && el.clientWidth)  || window.innerWidth;
      const h = (el && el.clientHeight) || window.innerHeight;
      return { w: Math.max(1, w), h: Math.max(1, h) };
    }

    p.preload = function () {
      // audio (optional — guarded so the sketch still runs without it)
      try { bellows = p.loadSound("assets/bellows4.wav"); } catch (e) {}
      try { whisper = p.loadSound("assets/carmenwhisper2.wav"); } catch (e) {}
    };

    p.setup = function () {
      const sz = containerSize();
      const c = p.createCanvas(sz.w, sz.h);
      c.parent(CONTAINER_ID);
      BLENDS = [p.MULTIPLY, p.BLEND, p.ADD, p.SUBTRACT, p.DARKEST,
                p.DIFFERENCE, p.BLEND, p.LIGHTEST, p.EXCLUSION, p.SCREEN];
      p.imageMode(p.CORNER);
      p.background(0);
      loadBuffer();
      loaded = true;
    };

    function panelImage(idx) {
      const im = images[idx];
      return (im && im.width) ? im : null;
    }

    p.draw = function () {
      if (!loaded) return;
      const sx = p.width / W, sy = p.height / H;

      // left panel
      const im1 = panelImage(currentimage);
      if (im1) {
        p.push();
        p.blendMode(BLENDS[blender] || p.BLEND);
        p.tint(255, imagealpha);
        p.image(im1, 0, 0, (W / 2) * sx, H * sy);
        p.pop();
      }
      // right panel
      const im2 = panelImage(currentimage2);
      if (im2) {
        p.push();
        p.blendMode(BLENDS[blender2] || p.BLEND);
        p.tint(255, imagealpha2);
        p.image(im2, (W / 2) * sx, 0, (W / 2) * sx, H * sy);
        p.pop();
      }
      p.blendMode(p.BLEND);

      // panel 1 cadence
      if (p.frameCount % timedelay === 0) {
        startCounting = true;
        if (timedelay > 300) { imagealpha = 255; if (whisper && audioStarted) whisper.play(); }
        else imagealpha = Math.floor(p.random(255));
        if (timedelay < 200) blender = (blender === 1) ? 4 : 1;
      }
      // panel 2 cadence
      if (p.frameCount % timedelay2 === 0) {
        if (currentimage2 === currentimage) currentimage2 = Math.floor(p.random(images.length));
        if (timedelay2 > 200) {
          imagealpha2 = 255;
          if (whisper && audioStarted) { whisper.play(); whisper.pan(p.random(-1, 1)); }
        } else imagealpha2 = Math.floor(p.random(255));
        if (timedelay2 < 200) blender2 = (blender2 === 1) ? 4 : 1;
      }

      if (startCounting && ++counter > timedelay) {
        loadBuffer();
        currentimage = Math.floor(p.random(images.length));
        timedelay = Math.max(2, Math.floor(brightnessAt(p.width * 0.25, p.height / 2)));
        counter = 0;
      }
      if (startCounting2 && ++counter2 > timedelay2) {
        loadBuffer();
        currentimage2 = Math.floor(p.random(images.length));
        timedelay2 = Math.max(2, Math.floor(brightnessAt(p.width * 0.75, p.height / 2)));
        counter2 = 0;
      }

      if (!started) drawHint();
    };

    function brightnessAt(x, y) {
      const c = p.get(Math.floor(x), Math.floor(y)); // [r,g,b,a]
      return Math.max(c[0], c[1], c[2]);             // HSB brightness
    }

    function drawHint() {
      p.push();
      p.blendMode(p.BLEND);
      p.noStroke();
      p.fill(0, 150);
      p.rect(0, p.height / 2 - 40, p.width, 80);
      p.fill(255);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(Math.max(14, p.width * 0.02));
      p.text("click to start sound", p.width / 2, p.height / 2);
      p.pop();
    }

    function startAudio() {
      started = true;
      if (audioStarted) return;
      if (p.getAudioContext) { try { p.userStartAudio(); } catch (e) {} }
      if (bellows && bellows.isLoaded && bellows.isLoaded()) { bellows.setLoop(true); bellows.play(); }
      else if (bellows) { try { bellows.loop(); } catch (e) {} }
      if (whisper && whisper.setVolume) whisper.setVolume(0.3);
      audioStarted = true;
    }

    p.mousePressed = startAudio;
    p.touchStarted = startAudio;

    p.windowResized = function () {
      const sz = containerSize();
      p.resizeCanvas(sz.w, sz.h);
      p.background(0);
    };
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { new p5(sketch); });
  } else {
    new p5(sketch);
  }
})();
