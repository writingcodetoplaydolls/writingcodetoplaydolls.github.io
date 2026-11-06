// Fireflies: every hit a glowing point. A host (a balloon) gets `count` fireflies filling its sphere
// evenly; each keeps a home spot inside it, wanders a little, swirls slowly with the others round
// the host's axis, blinks to its own rhythm, and follows the host wherever it floats. One Points
// object holds all of them: a soft disc drawn on a small canvas, additive blending, a colour and a
// glow per point. If the hits outnumber `max`, each point stands for more than one hit (perPoint).
//
//   const flies = createFireflies(THREE, scene, { max: 200000, size: 0.12 })
//   flies.set([{ position: vec3 (live), radius: 0.5, color: '#6777B6' | hue: 0.6, count: 1245, size: 1 }, ...])
//   flies.update(dt, { blink: 1, glow: 0.25, disperse: 0 })
//   flies.rescale(host => multiplier)       // change each host's firefly size without rebuilding
//
// A host's `size` multiplies its flies' point size (1 = the base size), so spheres with few hits can
// have bigger fireflies than the crowded ones.
//
// A host's `color` (any THREE.Color input) is used as given, each fly a shade lighter or darker; with
// only a `hue` the colour is made from it.
//
// `disperse` runs from 0 to 1. At 0 every fly keeps to its own sphere. As it rises the spheres
// loosen (the flies drift further from their home spots) and flies begin to leave on visits: a fly
// picks one of the nearest neighbouring spheres, flies over, settles at a spot inside it for a few
// seconds and takes on that sphere's colour while it stays, then flies home carrying the colour it
// picked up, which fades back to its own only slowly. At 1 about a fifth of the flies are away at
// any moment and the spheres fill with mixed colours.

// `onLight: true` draws them for a light background: normal blending, a paler core when a fly is
// on, instead of the additive glow that only reads against the dark.
export function createFireflies(THREE, scene, { max = 200000, size = 0.12, onLight = false } = {}) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64
  const g = cv.getContext('2d'), grad = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(0.3, 'rgba(255,255,255,0.75)'); grad.addColorStop(0.65, 'rgba(255,255,255,0.12)'); grad.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grad; g.fillRect(0, 0, 64, 64)
  const sprite = new THREE.CanvasTexture(cv)

  const geo = new THREE.BufferGeometry()
  const positions = new Float32Array(max * 3), colors = new Float32Array(max * 3), glows = new Float32Array(max), scales = new Float32Array(max).fill(1)
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geo.setAttribute('glow', new THREE.BufferAttribute(glows, 1))
  geo.setAttribute('scale', new THREE.BufferAttribute(scales, 1))
  const mat = new THREE.ShaderMaterial({
    uniforms: { map: { value: sprite }, size: { value: size } },
    vertexShader: `attribute float glow; attribute float scale; attribute vec3 color; varying float vGlow; varying vec3 vColor; uniform float size;
      void main() { vGlow = glow; vColor = color; vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * scale * (0.7 + 0.8 * glow) * (300.0 / -mv.z); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: onLight
      ? `uniform sampler2D map; varying float vGlow; varying vec3 vColor;
      void main() { vec4 s = texture2D(map, gl_PointCoord); vec3 c = mix(vColor * 0.85, vec3(1.0), 0.45 * vGlow); gl_FragColor = vec4(c, s.a * (0.5 + 0.5 * vGlow)); }`
      : `uniform sampler2D map; varying float vGlow; varying vec3 vColor;
      void main() { vec4 s = texture2D(map, gl_PointCoord); gl_FragColor = vec4(vColor * (0.3 + 1.4 * vGlow), s.a * (0.35 + 0.65 * vGlow)); }`,
    transparent: true, depthWrite: false, blending: onLight ? THREE.NormalBlending : THREE.AdditiveBlending,
  })
  const points = new THREE.Points(geo, mat); points.frustumCulled = false; points.name = 'fireflies'
  scene.add(points)

  // per fly: which host, home offset inside its sphere, blink phase and speed, wander phase, its own
  // colour; and for a visit: where it is (cur), where it is going (dest host, -1 = home), how long it stays
  let n = 0, perPoint = 1, hosts = []
  const hostOf = new Int32Array(max), home = new Float32Array(max * 3), phase = new Float32Array(max), speed = new Float32Array(max), wander = new Float32Array(max)
  const own = new Float32Array(max * 3), cur = new Float32Array(max * 3), spot = new Float32Array(max * 3)
  const dest = new Int32Array(max).fill(-1), stay = new Float32Array(max), away = new Uint8Array(max)   // away: 0 home, 1 going, 2 staying, 3 returning
  let hostRGB = new Float32Array(0), neighbours = new Int32Array(0), awayCount = 0, hostStart = new Int32Array(0), hostCount = new Int32Array(0)
  const NB = 4                                                  // neighbours a fly may visit: the nearest few spheres
  const col = new THREE.Color(), base = new THREE.Color()
  let t = 0, nbTimer = 0

  function set(list) {
    hosts = list
    const total = list.reduce((s, h) => s + h.count, 0)
    perPoint = total > max ? total / max : 1
    n = 0
    hostRGB = new Float32Array(list.length * 3); hostStart = new Int32Array(list.length); hostCount = new Int32Array(list.length)
    for (let hi = 0; hi < list.length; hi++) {
      const h = list[hi], count = Math.max(1, Math.round(h.count / perPoint))
      if (h.color !== undefined) base.set(h.color); else base.setHSL(h.hue ?? 0.58, 0.75, 0.6)
      base.toArray(hostRGB, 3 * hi)
      hostStart[hi] = n; hostCount[hi] = Math.min(count, max - n)                              // a host's flies sit together: indices hostStart .. hostStart + hostCount - 1
      for (let k = 0; k < count && n < max; k++, n++) {
        // an even fill of the sphere: a random direction, a radius weighted by the cube root
        const u = Math.random(), v = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, r = Math.cbrt(Math.random()) * h.radius * 0.95
        const s = Math.sqrt(1 - v * v)
        home[3 * n] = r * s * Math.cos(a); home[3 * n + 1] = r * v; home[3 * n + 2] = r * s * Math.sin(a)
        hostOf[n] = hi; phase[n] = u * Math.PI * 2; speed[n] = 0.5 + Math.random() * 1.5; wander[n] = Math.random() * 6.28
        col.copy(base).offsetHSL((Math.random() - 0.5) * 0.02, 0, (Math.random() - 0.5) * 0.14)   // each fly its own shade
        col.toArray(colors, 3 * n); col.toArray(own, 3 * n)
        scales[n] = h.size ?? 1
        away[n] = 0; dest[n] = -1
      }
    }
    neighbours = new Int32Array(list.length * NB).fill(-1); nbTimer = 0; awayCount = 0
    geo.attributes.color.needsUpdate = true; geo.attributes.scale.needsUpdate = true
    geo.setDrawRange(0, n)
  }

  function rescale(fn) {
    const per = hosts.map((h, i) => fn(h, i))
    for (let i = 0; i < n; i++) scales[i] = per[hostOf[i]]
    geo.attributes.scale.needsUpdate = true
  }

  // the nearest few spheres to each sphere, refreshed every half second as they drift
  function findNeighbours() {
    const H = hosts.length
    for (let a = 0; a < H; a++) {
      const pa = hosts[a].position, best = []
      for (let b = 0; b < H; b++) {
        if (b === a) continue
        const d = pa.distanceToSquared(hosts[b].position)
        if (best.length < NB) best.push([d, b]); else if (d < best[NB - 1][0]) best[NB - 1] = [d, b]
        best.sort((x, y) => x[0] - y[0])
      }
      for (let k = 0; k < NB; k++) neighbours[a * NB + k] = best[k] ? best[k][1] : -1
    }
  }

  function update(dt, { blink = 1, glow = 0.25, disperse = 0 } = {}) {
    t += dt
    const step = Math.min(dt, 0.05)
    nbTimer -= step
    if (hosts.length > 1 && disperse > 0 && nbTimer <= 0) { findNeighbours(); nbTimer = 0.5 }
    const hc = hosts.map(h => Math.cos(t * 0.12 / Math.max(0.3, h.radius))), hs = hosts.map(h => Math.sin(t * 0.12 / Math.max(0.3, h.radius)))   // a slow swirl, slower for big clouds
    const loosen = 1 + 0.8 * disperse                         // the sphere puffs up as the flies drift further from home
    const departRate = disperse * disperse * 0.05             // departures per fly per second at full dispersion
    const flySpeed = 1.4
    awayCount = 0
    for (let i = 0; i < n; i++) {
      const hi = hostOf[i], h = hosts[hi], c = hc[hi], s = hs[hi]
      const hx = home[3 * i], hy = home[3 * i + 1], hz = home[3 * i + 2]
      const w = t * 0.7 + wander[i], jitter = h.radius * (0.06 + 0.5 * disperse)
      // where home is right now: the host, the swirled offset, a wander round it
      const homeX = h.position.x + (hx * c - hz * s) * loosen + Math.sin(w) * jitter
      const homeY = h.position.y + hy * loosen + Math.sin(w * 1.3 + 1) * jitter
      const homeZ = h.position.z + (hx * s + hz * c) * loosen + Math.cos(w * 0.8) * jitter

      if (away[i] === 0) {
        positions[3 * i] = homeX; positions[3 * i + 1] = homeY; positions[3 * i + 2] = homeZ
        if (disperse > 0 && hosts.length > 1 && Math.random() < departRate * step) {                     // off on a visit
          const d = neighbours[hi * NB + Math.floor(Math.random() * NB)]
          if (d >= 0) {
            const hd = hosts[d], v = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, r = Math.cbrt(Math.random()) * hd.radius * 0.8, sq = Math.sqrt(1 - v * v)
            spot[3 * i] = r * sq * Math.cos(a); spot[3 * i + 1] = r * v; spot[3 * i + 2] = r * sq * Math.sin(a)   // a spot inside the neighbour's sphere
            dest[i] = d; away[i] = 1; stay[i] = 2 + Math.random() * 5
            cur[3 * i] = homeX; cur[3 * i + 1] = homeY; cur[3 * i + 2] = homeZ
          }
        }
        // a colour brought home fades back toward its own, slowly
        const k = Math.min(1, 0.03 * step)
        colors[3 * i] += (own[3 * i] - colors[3 * i]) * k; colors[3 * i + 1] += (own[3 * i + 1] - colors[3 * i + 1]) * k; colors[3 * i + 2] += (own[3 * i + 2] - colors[3 * i + 2]) * k
      } else {
        awayCount++
        let tx, ty, tz
        if (away[i] === 3) { tx = homeX; ty = homeY; tz = homeZ }
        else { const hd = hosts[dest[i]]; tx = hd.position.x + spot[3 * i] + Math.sin(w) * jitter; ty = hd.position.y + spot[3 * i + 1] + Math.sin(w * 1.3 + 1) * jitter; tz = hd.position.z + spot[3 * i + 2] + Math.cos(w * 0.8) * jitter }
        const dx = tx - cur[3 * i], dy = ty - cur[3 * i + 1], dz = tz - cur[3 * i + 2], dist = Math.hypot(dx, dy, dz)
        const move = Math.min(dist, flySpeed * step * (1 + h.radius))
        if (dist > 1e-6) { cur[3 * i] += dx / dist * move; cur[3 * i + 1] += dy / dist * move; cur[3 * i + 2] += dz / dist * move }
        if (away[i] === 1 && dist < 0.15) away[i] = 2                                                  // arrived: stay a while
        if (away[i] === 2) {
          stay[i] -= step
          const hd = dest[i], k = Math.min(1, 0.5 * step)                                               // taking on the colour here
          colors[3 * i] += (hostRGB[3 * hd] - colors[3 * i]) * k; colors[3 * i + 1] += (hostRGB[3 * hd + 1] - colors[3 * i + 1]) * k; colors[3 * i + 2] += (hostRGB[3 * hd + 2] - colors[3 * i + 2]) * k
          if (stay[i] <= 0 || disperse === 0) away[i] = 3                                              // time to go home (at once when dispersion is turned off)
        }
        if (away[i] === 3 && dist < 0.08) { away[i] = 0; dest[i] = -1 }
        positions[3 * i] = cur[3 * i]; positions[3 * i + 1] = cur[3 * i + 1]; positions[3 * i + 2] = cur[3 * i + 2]
      }
      const b = Math.sin(t * speed[i] * blink + phase[i])
      glows[i] = glow + (1 - glow) * (b > 0 ? b * b * b * b : 0)                   // on for a moment, off for longer
    }
    geo.attributes.position.needsUpdate = true; geo.attributes.glow.needsUpdate = true; geo.attributes.color.needsUpdate = true
  }

  // The k-th fly of host hi: its index into `positions` (x, y, z at 3 * index, where it is right now,
  // visits included), or -1 when the host has fewer flies than that.
  const flyAt = (hi, k) => (hi >= 0 && hi < hostCount.length && k >= 0 && k < hostCount[hi]) ? hostStart[hi] + k : -1
  return { set, update, rescale, points, flyAt, positions, get count() { return n }, get perPoint() { return perPoint }, get away() { return awayCount }, set size(v) { mat.uniforms.size.value = v }, get size() { return mat.uniforms.size.value } }
}
