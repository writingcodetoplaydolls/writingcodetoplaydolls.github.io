// Balloons: bodies that float and bounce, with no skin of their own (the sketch draws each as a
// cloud of fireflies). Each has a radius, a hue, a position and a velocity. Lift says how high they
// float: 0 rests them on the floor, 1 presses them under the ceiling, and between they hover at that
// share of the height, bobbing; they bounce off each other and the walls with a little spring in
// it; a breeze wanders through; a balloon tethered to another stays against it, like a grape on a
// bunch. Each carries an invisible sphere so a pointer can find it, which can be shown as a faint
// skin to read the grouping.
//
//   const balloons = createBalloons(THREE, scene, { ceiling: 7, floor: 0.6, walls: 6 })
//   const b = balloons.add({ radius: 0.5, color: '#6777B6' | hue: 0.6, tether: null | balloon, userData })
//   balloons.update(dt, { lift: 0.5, breeze: 0.3, bounce: 0.5, damping: 0.5 })
//   balloons.setSkin(0.08); balloons.pickables; b.pos, b.vel, b.radius, b.hue, b.userData

export function createBalloons(THREE, scene, { ceiling = 7, floor = 0.6, walls = 6 } = {}) {
  const balloons = []
  const root = new THREE.Group(); root.name = 'balloons'; scene.add(root)
  const sphere = new THREE.SphereGeometry(1, 24, 18)
  let skinOpacity = 0
  const f = new THREE.Vector3(), d = new THREE.Vector3(), n = new THREE.Vector3()
  let t = 0

  function add({ radius = 0.3, hue = 0.6, color: given, tether = null, userData = {} } = {}) {
    const color = given !== undefined ? new THREE.Color(given) : new THREE.Color().setHSL(hue, 0.6, 0.6)
    const skin = new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: skinOpacity, depthWrite: false, side: THREE.BackSide }))
    skin.scale.setScalar(radius); root.add(skin)
    const start = tether ? tether.pos : new THREE.Vector3((Math.random() - 0.5) * walls, floor + radius + Math.random() * 2, (Math.random() - 0.5) * walls)
    const pos = new THREE.Vector3(start.x + (Math.random() - 0.5) * radius * 2, start.y + (tether ? radius : 0), start.z + (Math.random() - 0.5) * radius * 2)
    const b = { skin, pos, vel: new THREE.Vector3(), radius, hue, color, tether, userData, phase: Math.random() * 100, mass: radius ** 3 }
    skin.position.copy(pos); skin.userData.balloon = b
    balloons.push(b)
    return b
  }

  function update(dt, { lift = 0.5, breeze = 0.3, bounce = 0.5, damping = 0.5 } = {}) {
    t += dt
    const step = Math.min(dt, 0.04)
    for (const b of balloons) {
      // the height it floats at: a share of the room between floor and ceiling, with a slow bob
      const want = floor + b.radius + Math.max(0, Math.min(1, lift)) * Math.max(0, ceiling - floor - 2 * b.radius) + 0.25 * Math.sin(t * 0.5 + b.phase)
      f.set(breeze * (Math.sin(t * 0.33 + b.phase) * 0.6 + Math.sin(t * 0.87 + b.phase * 1.7) * 0.25), (want - b.pos.y) * 1.2, breeze * Math.cos(t * 0.27 + b.phase * 0.6) * 0.6)
      if (b.tether) {                                                                // held against its parent, like a grape on the bunch
        d.subVectors(b.pos, b.tether.pos); const dist = d.length() || 1e-6, side = b.tether.radius + b.radius * 0.85
        f.addScaledVector(d.divideScalar(dist), -(dist - side) * 30)
        f.y = -0.4                                                                   // no lift of its own: it hangs beside its parent, a little below
      }
      b.vel.addScaledVector(f, step).multiplyScalar(Math.max(0, 1 - damping * step))
    }
    for (let i = 0; i < balloons.length; i++) for (let j = i + 1; j < balloons.length; j++) {   // bouncing off each other
      const a = balloons[i], c = balloons[j]
      if (a.tether === c || c.tether === a) continue
      d.subVectors(c.pos, a.pos); const dist = d.length(), gap = a.radius + c.radius
      if (dist >= gap || dist < 1e-6) continue
      n.copy(d).divideScalar(dist)
      const push = (gap - dist) * 0.5
      a.pos.addScaledVector(n, -push * c.mass / (a.mass + c.mass) * 2); c.pos.addScaledVector(n, push * a.mass / (a.mass + c.mass) * 2)
      const rel = c.vel.dot(n) - a.vel.dot(n)                                        // closing speed along the line between centres
      if (rel < 0) {
        const jn = -(1 + bounce) * rel / (1 / a.mass + 1 / c.mass)
        a.vel.addScaledVector(n, -jn / a.mass); c.vel.addScaledVector(n, jn / c.mass)
      }
    }
    for (const b of balloons) {
      b.pos.addScaledVector(b.vel, step)
      if (b.pos.y + b.radius > ceiling) { b.pos.y = ceiling - b.radius; b.vel.y = -Math.abs(b.vel.y) * bounce }       // bobbing under the ceiling
      if (b.pos.y - b.radius < floor) { b.pos.y = floor + b.radius; b.vel.y = Math.abs(b.vel.y) * bounce }
      for (const k of ['x', 'z']) {
        if (b.pos[k] + b.radius > walls) { b.pos[k] = walls - b.radius; b.vel[k] = -Math.abs(b.vel[k]) * bounce }
        if (b.pos[k] - b.radius < -walls) { b.pos[k] = -walls + b.radius; b.vel[k] = Math.abs(b.vel[k]) * bounce }
      }
      b.skin.position.copy(b.pos)
    }
  }

  function setSkin(opacity) { skinOpacity = opacity; for (const b of balloons) b.skin.material.opacity = opacity }
  function clear() { for (const b of balloons) { root.remove(b.skin); b.skin.material.dispose() } balloons.length = 0 }
  return { add, update, clear, setSkin, balloons, root, get pickables() { return balloons.map(b => b.skin) } }
}
