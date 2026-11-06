// The bottle: the whole background as the side of an old glass soda bottle seen from inside, so the
// scene floats in pale blue-green glass. A full-screen quad behind everything, drawn by one fragment
// shader. The screen is read as the inside of a bottle: a ray from the eye, at an angle round the
// bottle, meets the glass, which is either a round wall (every point the same distance away) or, for a
// faceted bottle, one of `sides` flat panes (an octagon by default), each pane met at its own slant.
// The bottle's profile with height is an octagon's too: every vertical line runs straight through the
// middle, turns inward at 45 degrees toward top and bottom, then runs straight again. On the glass:
// wide soft stripes of pressed glass (two to a pane), leaning a different way on every pane so they
// kink at the pane edges; the pane edges themselves as bright ridges; a bright band where the light
// comes through, stepped from pane to pane; hoops of flow lines kept to a whisper; a slow waviness; a
// few bubbles. Nothing moves fast. `curve` is how round the bottle is (0 wide and flat, 1 tight);
// `sides` is 0 for a round bottle or the number of panes; `bend` is how far the lines turn and lean.
//
//   const bottle = createBottle(THREE, scene, { tint: '#BFDCE8', deep: '#8FB8C8', light: '#F2F8FA', curve: 0.6, sides: 8, bend: 0.7 })
//   bottle.update(dt)            // drifts the waviness
//   bottle.setTint(hex) / setDeep(hex) / setLight(hex) / setCurve(0..1) / setSides(n) / setBend(0..1); bottle.visible = false

export function createBottle(THREE, scene, { tint = '#BFDCE8', deep = '#8FB8C8', light = '#F2F8FA', curve = 0.6, sides = 8, bend = 0.7 } = {}) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { tint: { value: new THREE.Color(tint) }, deep: { value: new THREE.Color(deep) }, light: { value: new THREE.Color(light) }, time: { value: 0 }, aspect: { value: 1 }, curve: { value: curve }, sides: { value: sides }, bend: { value: bend } },
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 1.0, 1.0); }`,   // the far plane, behind everything
    fragmentShader: `
      uniform vec3 tint, deep, light; uniform float time, aspect, curve, sides, bend; varying vec2 vUv;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
      void main() {
        vec2 p = vec2((vUv.x - 0.5) * aspect, vUv.y - 0.5);
        float wave = noise(vec2(p.x * 3.0 + time * 0.05, p.y * 2.0 - time * 0.03)) - 0.5;          // the glass was never flat
        float faceted = step(2.5, sides);
        // the bottle's profile with height is an octagon's: straight through the middle, then a 45-degree run
        // inward toward top and bottom, then straight again. Every vertical line on the glass follows it.
        float prof = clamp((abs(p.y) - 0.1) / 0.14, 0.0, 1.0);
        float spread = 1.0 + bend * 1.25 * prof;
        vec2 q = vec2(p.x * spread, p.y);                                                          // the screen point, read on that profile
        // the ray from the eye: its angle round the bottle, and where it meets the glass
        float R = mix(mix(4.0, 0.95, curve), mix(2.2, 0.55, curve), faceted);                       // the bottle's radius on screen: wide and flat, or tight (faceted: three to five panes in view)
        R *= clamp(aspect / 1.5, 0.35, 1.0);                                                       // a narrow screen sees a tighter bottle, so the panes still show
        float phi = asin(clamp(q.x / R, -0.999, 0.999));                                           // the ray's angle round the bottle
        float seg = 6.2831853 / max(sides, 3.0);                                                   // the angle one pane spans
        float fi = floor((phi + 0.5 * seg) / seg);                                                 // which pane the ray meets (0 faces us)
        float phic = fi * seg;                                                                     // that pane's centre angle
        float u = faceted * (phi - phic);                                                          // the ray's slant across the pane (0 on a round wall)
        float s = mix(phi, 2.0 * tan(0.5 * seg) * fi + tan(u), faceted) * R;                      // distance round the glass: the arc, or along the panes
        float ratio = cos(u) / max(cos(phi), 0.15);                                                // how much nearer the glass is here than straight ahead
        float glance = abs(q.x) / R;                                                               // how glancing the view of the glass is here
        s += faceted * bend * 0.3 * sin(phic) * p.y;                                               // on a faceted bottle each pane's lines lean its own way too
        float freq = mix(11.0, 6.2831853 / (R * tan(0.5 * seg)), faceted);                         // stripes: a steady width, or two to a pane
        float ribs = pow(0.5 + 0.5 * cos((s + 0.04 * wave) * freq), 2.2);                          // wide soft stripes of pressed glass
        float lit = 0.5 + 0.5 * cos(phic + 0.45);                                                  // how squarely each pane faces the light
        float ridge = faceted * exp(-pow((0.5 * seg - abs(u)) * 90.0, 2.0)) * (0.15 + 0.35 * lit); // the pane edges, bright ridges
        float corner = faceted * pow(abs(u) / (0.5 * seg), 3.0) * 0.18;                            // glass thicker toward the pane edges
        float seam = (1.0 - faceted) * exp(-pow((s + 0.015 * wave - 0.18) * 30.0, 2.0)) * 0.6;     // a round bottle's mould seam
        float edge = smoothstep(0.1, 0.95, max(glance * glance, length(vec2(p.x * 0.55, p.y)) * 0.9)); // thicker glass toward the edges
        float band = exp(-pow((s + 0.08 * wave + 0.32 + faceted * bend * 0.12 * sin(phic)) * 3.2, 2.0)); // where the light comes through, stepped by each pane
        float bubbles = step(0.985, noise(p * 60.0 + 17.0)) * 0.5;                                 // seeds in the glass
        float yh = p.y / mix(1.0, ratio, bend) + 0.02 * wave;                                      // height round the bottle: the hoops flare toward the edges in perspective
        float flow = 0.5 + 0.5 * sin(yh * 9.0);                                                    // a soft swell between the hoops
        float hoops = exp(-pow((fract(yh * 7.0 + 0.5) - 0.5) * 14.0, 2.0));                        // the hoops: thin rings, level across a pane, bent at its edges
        vec3 col = mix(tint, deep, edge * 0.85);
        col = mix(col, deep, faceted * (0.2 - 0.2 * lit) + corner);                                // each pane its own shade
        col = mix(col, light, band * 0.45 + ribs * 0.3 + seam + ridge + bubbles);
        col = mix(col, deep, 0.03 * flow + 0.02 * hoops);                                          // the hoops kept to a whisper: the vertical lines carry the bottle
        gl_FragColor = vec4(col, 1.0);
      }`,
    depthTest: false, depthWrite: false,
  })
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat)
  quad.frustumCulled = false; quad.renderOrder = -1000; quad.raycast = () => {}; quad.name = 'bottle'
  scene.add(quad)
  return {
    quad,
    update(dt) { mat.uniforms.time.value += dt; mat.uniforms.aspect.value = innerWidth / Math.max(1, innerHeight) },
    setTint(c) { mat.uniforms.tint.value.set(c) }, setDeep(c) { mat.uniforms.deep.value.set(c) }, setLight(c) { mat.uniforms.light.value.set(c) },
    setCurve(v) { mat.uniforms.curve.value = v }, setSides(n) { mat.uniforms.sides.value = +n }, setBend(v) { mat.uniforms.bend.value = v },
    get visible() { return quad.visible }, set visible(v) { quad.visible = v },
  }
}
