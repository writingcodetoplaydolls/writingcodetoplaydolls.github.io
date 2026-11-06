// Port of Teleporter.cs. In Unity: a controller ray hits the ground, a pointer marks the spot,
// releasing the trigger fades to black, moves the camera rig so the head stands over the marker,
// fades back. Here the harness already delivers "select" hits from mouse, touch, controller or
// pinch, so this only decides whether a hit is a floor and moves the rig (or, out of XR, the
// camera and its orbit target). The fade is a CSS overlay, which a headset never sees, so XR
// moves instantly.

import * as THREE from 'three'

export function createTeleport({ renderer, camera, rig, controls, floors = [], fadeMs = 250, markerRadius = 0.25, eyeHeight = null }) {
  const floorSet = new Set()
  const addFloor = o => { o.traverse(c => floorSet.add(c)); return o }
  floors.forEach(addFloor)

  const marker = new THREE.Mesh(
    new THREE.RingGeometry(markerRadius * 0.6, markerRadius, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x9cc7ff, transparent: true, opacity: 0.85, depthWrite: false }),
  )
  marker.visible = false

  const fade = document.createElement('div')
  Object.assign(fade.style, { position: 'fixed', inset: 0, background: '#000', opacity: 0, pointerEvents: 'none', transition: `opacity ${fadeMs}ms`, zIndex: 999 })
  document.body.appendChild(fade)

  const head = new THREE.Vector3(), delta = new THREE.Vector3()
  let busy = false

  function moveTo(point) {
    // where the head currently stands on the floor
    camera.getWorldPosition(head)
    delta.set(point.x - head.x, 0, point.z - head.z)
    if (renderer.xr.isPresenting) {
      rig.position.add(delta)
      rig.position.y = point.y                 // the headset's floor is the rig's origin: stand on the floor you chose
    } else {
      camera.position.add(delta)
      controls?.target.add(delta)
      const eye = typeof eyeHeight === 'function' ? eyeHeight() : eyeHeight
      if (eye !== null) {                      // floors at different heights (decks, a slab, a roof): stand on the one chosen
        const dy = point.y + eye - camera.position.y
        camera.position.y += dy; controls?.target.setY(controls.target.y + dy)
      }
      if (controls) {                          // land standing: the gaze levelled, the orbit point a few strides ahead
        delta.subVectors(controls.target, camera.position); delta.y = 0
        if (delta.lengthSq() < 1e-6) delta.set(0, 0, -1).applyQuaternion(camera.quaternion).setY(0)
        if (delta.lengthSq() < 1e-6) delta.set(0, 0, -1)
        controls.target.copy(camera.position).addScaledVector(delta.normalize(), 3)
        controls.minDistance = Math.min(controls.minDistance, 0.5)
      }
    }
    marker.position.copy(point).y += 0.01
    marker.visible = true
    setTimeout(() => { marker.visible = false }, 1500)
  }

  return {
    marker, addFloor,
    isFloor: hit => !!hit && floorSet.has(hit.object),
    // call from onSelect; returns true when it consumed the hit
    onSelect(hit) {
      if (!hit || !floorSet.has(hit.object) || busy) return false
      camera.getWorldPosition(head)
      if (hit.point.y > head.y - 0.3) return false   // a surface over the eyes is a ceiling or a roof's underside, not a floor to stand on
      if (renderer.xr.isPresenting) { moveTo(hit.point); return true }
      busy = true
      fade.style.opacity = 1
      setTimeout(() => { moveTo(hit.point); fade.style.opacity = 0; setTimeout(() => { busy = false }, fadeMs) }, fadeMs)
      return true
    },
  }
}
