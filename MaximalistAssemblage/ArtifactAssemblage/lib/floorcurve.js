// The floor: a line pattern and, if wanted, a sheet of old green bottle glass, both laid over a
// height field that rises toward whatever floats above it, as if reaching, and undulates slowly.
//
// The pattern is one of: an Archimedean spiral or a Hilbert curve (one continuous line), a
// triangular lattice or a honeycomb (many short segments), or none. Its heights are recomputed on the
// CPU every frame from the bodies passed in. The glass is a plane of the same size whose vertices are
// lifted by the same height function in a vertex shader (the bodies go in as uniforms, up to 64), with
// a fragment shader for the look: a green tint that deepens where the glass is seen edge-on or lies
// low, a fresnel sheen, one soft highlight, and the slight waviness of old glass.
//
//   const floor = createFloorCurve(THREE, scene, { kind: 'spiral', radius: 7, spacing: 0.3, color: '#92A2A6', opacity: 0.5, glass: true, tint: '#9CC2A0' })
//   floor.update(dt, { hosts: [{ position, radius }], reach: 0.35, undulate: 0.1 })
//   floor.setKind('honeycomb')   // 'spiral' | 'hilbert' | 'triangles' | 'honeycomb' | 'none'
//   floor.setGlass(true); floor.setTint('#9CC2A0')
//
// reach: how far up toward each body the floor rises, as a share of the body's height above the
// ground (0 = flat); undulate: the height of a slow travelling swell in metres.

const MAX_HOSTS = 64

export function createFloorCurve(THREE, scene, { kind = 'spiral', radius = 7, spacing = 0.3, step = 0.1, order = 6, color = '#92A2A6', opacity = 0.5, y0 = 0, glass = true, tint = '#9CC2A0' } = {}) {
  const group = new THREE.Group(); group.name = 'floor'; scene.add(group)
  const lineMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity })
  let line = null, base = null, pts = 0, segments = false, t = 0
  const hx = new Float32Array(MAX_HOSTS), hz = new Float32Array(MAX_HOSTS), hr = new Float32Array(MAX_HOSTS), ht = new Float32Array(MAX_HOSTS)
  let H = 0

  // ---- the patterns, as flat xz point lists (a path, or pairs for segments) ----
  function spiral() {                                                 // r = a·θ, sampled at an even arc length
    const a = spacing / (2 * Math.PI), out = []
    let theta = 0
    while (a * theta < radius) { const r = a * theta; out.push(r * Math.cos(theta), r * Math.sin(theta)); theta += step / Math.max(0.05, r) }
    return { points: out, segments: false }
  }
  function hilbert() {                                                // the classic d → (x, y) walk, scaled to a square 2·radius wide
    const n = 1 << order, out = [], size = 2 * radius / n
    for (let d = 0; d < n * n; d++) {
      let x = 0, y = 0, tt = d
      for (let s = 1; s < n; s *= 2) {
        const rx = 1 & (tt / 2), ry = 1 & (tt ^ rx)
        if (ry === 0) { if (rx === 1) { x = s - 1 - x; y = s - 1 - y } const k = x; x = y; y = k }
        x += s * rx; y += s * ry; tt = Math.floor(tt / 4)
      }
      out.push((x + 0.5) * size - radius, (y + 0.5) * size - radius)
    }
    return { points: out, segments: false }
  }
  const subdivided = (ax, az, bx, bz, out, n = 3) => {                // an edge in n pieces, so it can follow the field
    for (let k = 0; k < n; k++) { const u = k / n, v = (k + 1) / n; out.push(ax + (bx - ax) * u, az + (bz - az) * u, ax + (bx - ax) * v, az + (bz - az) * v) }
  }
  function triangles() {                                              // three families of parallel lines at 60°, a lattice of equilateral triangles
    const out = [], d = spacing * 1.6, L = radius * 1.05
    for (const ang of [0, Math.PI / 3, 2 * Math.PI / 3]) {
      const ux = Math.cos(ang), uz = Math.sin(ang), vx = -uz, vz = ux
      for (let o = -L; o <= L; o += d) {
        let prev = null
        for (let s = -L; s <= L; s += step * 1.5) {
          const x = vx * o + ux * s, z = vz * o + uz * s
          if (x * x + z * z <= radius * radius) { if (prev) out.push(prev[0], prev[1], x, z); prev = [x, z] } else prev = null
        }
      }
    }
    return { points: out, segments: true }
  }
  function honeycomb() {                                              // hexagonal cells, each edge drawn once per cell
    const out = [], r = spacing * 1.2, w = Math.sqrt(3) * r, h = 1.5 * r
    for (let row = -Math.ceil(radius / h) - 1; row <= Math.ceil(radius / h) + 1; row++) {
      for (let col = -Math.ceil(radius / w) - 1; col <= Math.ceil(radius / w) + 1; col++) {
        const cx = col * w + (row % 2 ? w / 2 : 0), cz = row * h
        if (cx * cx + cz * cz > radius * radius) continue
        for (let k = 0; k < 6; k++) {
          const a0 = Math.PI / 6 + k * Math.PI / 3, a1 = a0 + Math.PI / 3
          subdivided(cx + r * Math.cos(a0), cz + r * Math.sin(a0), cx + r * Math.cos(a1), cz + r * Math.sin(a1), out, 2)
        }
      }
    }
    return { points: out, segments: true }
  }
  const PATTERNS = { spiral, hilbert, triangles, honeycomb }

  function setKind(k) {
    kind = k
    if (line) { group.remove(line); line.geometry.dispose(); line = null }
    if (!PATTERNS[kind]) return
    const made = PATTERNS[kind]()
    base = made.points; segments = made.segments; pts = base.length / 2
    const pos = new Float32Array(pts * 3)
    for (let i = 0; i < pts; i++) { pos[3 * i] = base[2 * i]; pos[3 * i + 1] = y0; pos[3 * i + 2] = base[2 * i + 1] }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    line = segments ? new THREE.LineSegments(geo, lineMat) : new THREE.Line(geo, lineMat)
    line.frustumCulled = false; line.raycast = () => {}
    group.add(line)
  }

  // ---- the glass: the same height function on the GPU, and the look of old bottle glass ----
  const glassMat = new THREE.ShaderMaterial({
    uniforms: {
      hosts: { value: Array.from({ length: MAX_HOSTS }, () => new THREE.Vector4()) }, nHosts: { value: 0 },
      reach: { value: 0.35 }, undulate: { value: 0.1 }, time: { value: 0 }, y0: { value: y0 },
      tint: { value: new THREE.Color(tint) }, lightDir: { value: new THREE.Vector3(0.4, 1, 0.3).normalize() },
    },
    vertexShader: `
      uniform vec4 hosts[${MAX_HOSTS}]; uniform int nHosts; uniform float reach, undulate, time, y0;
      varying vec3 vNormal; varying vec3 vWorld; varying float vLift;
      float heightAt(vec2 p) {
        float y = undulate * sin(0.9 * p.x + time * 0.5) * cos(0.9 * p.y - time * 0.4);
        for (int k = 0; k < ${MAX_HOSTS}; k++) {
          if (k >= nHosts) break;
          vec4 h = hosts[k]; vec2 d = p - h.xz; float r = h.w * 2.2;
          float lift = exp(-dot(d, d) / (r * r)) * max(0.0, h.y - h.w - y0) * reach;
          y = max(y, lift);
        }
        return y;
      }
      void main() {
        vec2 p = position.xz;
        float y = heightAt(p), e = 0.08;
        float dx = heightAt(p + vec2(e, 0.0)) - heightAt(p - vec2(e, 0.0));
        float dz = heightAt(p + vec2(0.0, e)) - heightAt(p - vec2(0.0, e));
        vec3 n = normalize(vec3(-dx, 2.0 * e, -dz));
        vec3 pos = vec3(position.x, y0 + y - 0.01, position.z);
        vLift = y; vNormal = normalize(normalMatrix * n);
        vec4 w = modelMatrix * vec4(pos, 1.0); vWorld = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: `
      uniform vec3 tint; uniform vec3 lightDir;
      varying vec3 vNormal; varying vec3 vWorld; varying float vLift;
      void main() {
        vec3 n = normalize(vNormal); vec3 v = normalize(cameraPosition - vWorld);
        // old glass: a slight waviness in the normal, seen as streaks
        n = normalize(n + 0.06 * vec3(sin(vWorld.x * 7.0 + vWorld.z * 3.0), 0.0, cos(vWorld.z * 6.0 - vWorld.x * 2.0)));
        float fres = pow(1.0 - max(dot(n, v), 0.0), 2.5);                 // bright at the edges, like a bottle's rim
        float spec = pow(max(dot(reflect(-lightDir, n), v), 0.0), 60.0);  // one soft highlight
        float thick = clamp(0.35 + 0.25 * vLift, 0.0, 1.0);                // the glass reads thicker where it rises
        vec3 deep = tint * vec3(0.45, 0.62, 0.5);                           // the colour seen through more glass
        vec3 col = mix(tint, deep, thick) * (0.55 + 0.45 * max(dot(n, lightDir), 0.0));
        col += fres * tint * 0.9 + spec * vec3(0.9, 1.0, 0.92);
        float alpha = 0.22 + 0.5 * fres + 0.35 * spec;
        gl_FragColor = vec4(col, alpha);
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  })
  const plane = new THREE.PlaneGeometry(2 * radius, 2 * radius, 96, 96); plane.rotateX(-Math.PI / 2)
  const sheet = new THREE.Mesh(plane, glassMat); sheet.frustumCulled = false; sheet.raycast = () => {}; sheet.renderOrder = -1; sheet.visible = glass
  group.add(sheet)

  function update(dt, { hosts = [], reach = 0.35, undulate = 0.1 } = {}) {
    t += dt
    // the bodies, the largest first, at most MAX_HOSTS
    const list = hosts.length > MAX_HOSTS ? hosts.slice().sort((a, b) => b.radius - a.radius).slice(0, MAX_HOSTS) : hosts
    H = list.length
    for (let k = 0; k < H; k++) {
      const h = list[k]; hx[k] = h.position.x; hz[k] = h.position.z; hr[k] = h.radius * 2.2; ht[k] = Math.max(0, h.position.y - h.radius - y0) * reach
      glassMat.uniforms.hosts.value[k].set(h.position.x, h.position.y, h.position.z, h.radius)
    }
    glassMat.uniforms.nHosts.value = H; glassMat.uniforms.reach.value = reach; glassMat.uniforms.undulate.value = undulate; glassMat.uniforms.time.value = t
    if (!line) return
    const pos = line.geometry.attributes.position.array
    for (let i = 0; i < pts; i++) {
      const x = base[2 * i], z = base[2 * i + 1]
      let y = undulate * Math.sin(0.9 * x + t * 0.5) * Math.cos(0.9 * z - t * 0.4)
      for (let k = 0; k < H; k++) {                                   // the nearest body lifts the floor most; a soft peak, not a spike
        const dx = x - hx[k], dz = z - hz[k], d2 = dx * dx + dz * dz, r2 = hr[k] * hr[k]
        if (d2 > 6 * r2) continue                                     // too far to matter (the lift would be under e⁻⁶)
        const lift = Math.exp(-d2 / r2) * ht[k]; if (lift > y) y = lift
      }
      pos[3 * i + 1] = y0 + y
    }
    line.geometry.attributes.position.needsUpdate = true
  }

  setKind(kind)
  return {
    group, update, setKind, get kind() { return kind }, get points() { return pts }, material: lineMat,
    setGlass(on) { sheet.visible = on }, setTint(c) { glassMat.uniforms.tint.value.set(c) }, glass: sheet,
  }
}
