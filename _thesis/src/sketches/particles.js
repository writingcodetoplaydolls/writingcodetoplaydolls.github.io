// A second sketch, here mainly to prove the picker. Open it with ?sketch=particles
// or click its name in the corner of the page.

const COUNT = 4000
let points, positions, seeds

export function setup({ THREE, scene, hint }) {
  scene.background = new THREE.Color(0x0b0d12)
  hint('drag to look')

  positions = new Float32Array(COUNT * 3)
  seeds = new Float32Array(COUNT)
  for (let i = 0; i < COUNT; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * 6
    positions[i * 3 + 1] = Math.random() * 3
    positions[i * 3 + 2] = (Math.random() - 0.5) * 6
    seeds[i] = Math.random() * Math.PI * 2
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  points = new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0x9cc7ff, size: 0.02 }))
  scene.add(points)
  scene.add(new THREE.GridHelper(8, 16, 0x30343d, 0x22252c))
}

export function draw(ctx, dt, t) {
  for (let i = 0; i < COUNT; i++) {
    positions[i * 3 + 1] += Math.sin(t + seeds[i]) * dt * 0.2
  }
  points.geometry.attributes.position.needsUpdate = true
  points.rotation.y += dt * 0.05
}
