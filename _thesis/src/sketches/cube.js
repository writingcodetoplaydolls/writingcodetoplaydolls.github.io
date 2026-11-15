// Your sketch. Same shape as p5 and openFrameworks: setup once, draw every frame.
//
// ctx gives you:
//   THREE, scene, camera, renderer, rig, controls, listener
//   selectable(obj)  register obj so onSelect fires when it is clicked, tapped, or pointed at
//   xr               true while a headset session is running
//
// Units are metres. y is up. The floor is y = 0 and a standing viewer's eyes are about y = 1.6.

let cube
const params = { size: 0.4 }

export function setup({ THREE, scene, selectable, hint, gui }) {
  scene.background = new THREE.Color(0x181a20)
  hint('drag to look · click or tap the cube')

  // NEW: slider from 0.1 to 2 in steps of 0.05
  gui.add(params, 'size', 0.1, 2, 0.05)                        
   
  scene.add(new THREE.HemisphereLight(0xffffff, 0x334455, 1.2))
  const sun = new THREE.DirectionalLight(0xffffff, 1.5)
  sun.position.set(3, 5, 2)
  scene.add(sun)

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(4, 64),
    new THREE.MeshStandardMaterial({ color: 0x2a2d36, roughness: 0.9 }),
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -0.005
  scene.add(floor)
  scene.add(new THREE.GridHelper(8, 16, 0x444a55, 0x30343d))

  cube = selectable(new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.4, 0.4),
    new THREE.MeshStandardMaterial({ color: 0xff7a3d, roughness: 0.4, metalness: 0.1 }),
  ))
  cube.position.set(0, 1.2, 0)
  scene.add(cube)
}

export function draw(ctx, dt, t) {
  cube.rotation.y += dt * 0.8
  cube.position.y = 1.2 + Math.sin(t * 1.5) * 0.1
  // NEW: read the slider every frame
  cube.scale.setScalar(params.size / 0.4)                      
   
}

// Fired by a click, a tap, a controller trigger, or a hand pinch.
export function onSelect(hit) {
  if (!hit) return
  hit.object.material.color.setHSL(Math.random(), 0.7, 0.55)
}

export function onEnterXR() {}
export function onExitXR() {}
