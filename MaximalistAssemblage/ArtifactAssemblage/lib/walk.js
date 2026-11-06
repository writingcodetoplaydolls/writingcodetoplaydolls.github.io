// Human-scale walking for flat (non-XR) viewing, on top of the orbit controls, so the mouse keeps
// its usual three jobs and the keys work at the same time:
//
//   left drag      turn the view (orbit around the target, which walking keeps just ahead of you)
//   right drag     pan                  middle drag / wheel   zoom (and the wheel also takes a step)
//   W A S D        walk, target and all, along the view; Shift hurries; arrows do the same
//   Q / E          down / up, out of walk mode only (walking keeps your feet on the floor)
//
// Every frame in walk mode the floor beneath the viewer is found by a downward ray and the viewer
// is held at eye height above it, target and all, so feet stay on the floor across steps, porches
// and the ground outside; with solid walls on, a step into a wall slides along it instead. Out of
// walk mode the same keys fly the camera, free of the floor. Pair it with createTeleport: a tap on
// a floor still jumps there, and the height lock takes over on landing.
//
// Inside a headset this does nothing; the local-floor reference space is the real thing.

import * as THREE from 'three'

export function createWalkControls({
  camera, domElement, controls = null, floors = [], obstacles = [],
  eyeHeight = 1.6, speed = 1.8, runFactor = 2.5,
  solidWalls = false, bodyRadius = 0.35, floorReach = 6, wheelStep = 1.5, flyWhenOff = true,
}) {
  const floorSet = [], obstacleSet = []
  const addFloor = o => { floorSet.push(o); return o }
  const addObstacle = o => { obstacleSet.push(o); return o }
  floors.forEach(addFloor); obstacles.forEach(addObstacle)

  const state = { enabled: false, eyeHeight, speed, solidWalls, bodyRadius }
  const keys = new Set()
  const raycaster = new THREE.Raycaster()
  const down = new THREE.Vector3(0, -1, 0)
  const from = new THREE.Vector3(), forward = new THREE.Vector3(), right = new THREE.Vector3(), move = new THREE.Vector3()
  const normal = new THREE.Vector3(), normalMatrix = new THREE.Matrix3()
  let floorY = null, dollyPending = 0

  // Walls: probe the step at chest and knee height; on a hit, keep only the part of the step
  // that runs along the wall. Two passes so a corner cannot be slipped through.
  function wallHit(step) {
    const len = step.length(); if (len === 0) return null
    const dir = step.clone().divideScalar(len)
    let nearest = null
    for (const drop of [0.5, 1.2]) {
      from.copy(camera.position); from.y -= Math.min(drop, state.eyeHeight - 0.2)
      raycaster.set(from, dir); raycaster.far = len + state.bodyRadius
      const hit = raycaster.intersectObjects(obstacleSet, true).find(h => h.object.visible && h.face)
      if (hit && (!nearest || hit.distance < nearest.distance)) nearest = hit
    }
    return nearest
  }
  function resolveWalls(step) {
    for (let pass = 0; pass < 2; pass++) {
      const hit = wallHit(step)
      if (!hit) return step
      normal.copy(hit.face.normal).applyMatrix3(normalMatrix.getNormalMatrix(hit.object.matrixWorld)).normalize()
      normal.y = 0; normal.normalize()
      if (normal.dot(step) > 0) normal.negate()                        // face us, whichever side was exported
      step.addScaledVector(normal, -step.dot(normal))                  // slide along the wall
      const room = hit.distance - state.bodyRadius                      // already too close: back off a little
      if (room < 0) step.addScaledVector(normal, -room * 0.5)
    }
    return wallHit(step) ? step.set(0, 0, 0) : step
  }

  // ---- keys, ignored while typing in a panel field --------------------------
  const typing = e => ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)
  const active = () => state.enabled || flyWhenOff
  const onKeyDown = e => { if (active() && !typing(e)) { keys.add(e.code); if (/^(Arrow|Space)/.test(e.code)) e.preventDefault() } }
  const onKeyUp = e => keys.delete(e.code)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('blur', () => keys.clear())

  // ---- wheel: a step along the view, metres per notch, on top of the orbit zoom ----------
  let dollyPendingSign = 1
  const onWheel = e => {
    if (!state.enabled) return                                           // out of walk mode the wheel is the orbit zoom alone
    const notches = e.deltaMode === 1 ? e.deltaY / 3 : e.deltaMode === 2 ? e.deltaY : e.deltaY / 100   // pixels, lines or pages
    dollyPending -= notches * wheelStep
  }
  domElement.addEventListener('wheel', onWheel, { passive: true })

  // The horizontal direction the view faces: toward the orbit target, or where the camera points.
  function viewForward() {
    if (controls) forward.subVectors(controls.target, camera.position); else forward.set(0, 0, -1).applyQuaternion(camera.quaternion)
    forward.y = 0
    if (forward.lengthSq() < 1e-6) forward.set(0, 1, 0).applyQuaternion(camera.quaternion).setY(0)   // looking straight down: screen-up is the heading
    if (forward.lengthSq() < 1e-6) forward.set(0, 0, -1)
    forward.normalize()
    right.set(-forward.z, 0, forward.x)                              // 90° clockwise from forward, seen from above: the viewer's right
  }
  function shift(delta) { camera.position.add(delta); if (controls) controls.target.add(delta) }   // viewer and target move as one
  // The floor under the viewer: looked for from the head down first, so a ceiling or roof overhead
  // can never be taken for the floor, and only if the head finds nothing (it has sunk into ground
  // climbing ahead) from 2 m above it.
  function floorBelow(reach, dx = 0, dz = 0) {
    for (const lift of [0, 2]) {
      from.copy(camera.position); from.x += dx; from.z += dz; from.y += lift
      raycaster.set(from, down); raycaster.far = reach + lift
      const hit = raycaster.intersectObjects(floorSet, true).find(h => h.object.visible)
      if (hit) return hit
    }
    return undefined
  }
  // The floor under the feet. When the centre suddenly finds it much lower (a crack between two
  // floors, the lip of a deck), the feet have width: the floor is the highest found under the body's
  // four edges too, so a gap narrower than the body is stepped over and an edge is only fallen off
  // once the whole body is past it.
  function floorUnderFeet() {
    let hit = floorBelow(floorReach)
    if (hit && floorY !== null && hit.point.y < floorY - 0.5) {
      const r = state.bodyRadius
      for (const [dx, dz] of [[r, 0], [-r, 0], [0, r], [0, -r]]) { const h = floorBelow(floorReach, dx, dz); if (h && h.point.y > hit.point.y) hit = h }
    }
    return hit
  }
  // The nearest ceiling over the feet, as a height above the floor; Infinity under the sky.
  const up = new THREE.Vector3(0, 1, 0)
  function headroom() {
    from.copy(camera.position); from.y = floorY + 0.05
    raycaster.set(from, up); raycaster.far = state.eyeHeight + 0.3
    const hit = raycaster.intersectObjects(obstacleSet.length ? obstacleSet : floorSet, true).find(h => h.object.visible && h.face)
    return hit ? hit.point.y - floorY : Infinity
  }
  function snapToFloor(dt) {
    const hit = floorUnderFeet()
    if (hit) floorY = hit.point.y
    if (floorY === null) return
    // a tall eye ducks under a low ceiling rather than going out through the roof (only looked for
    // when the eye is taller than a person; the check is a ray against everything solid)
    const eye = state.eyeHeight > 2.5 ? Math.min(state.eyeHeight, Math.max(0.3, headroom() - 0.3)) : state.eyeHeight
    const dy = (floorY + eye - camera.position.y) * Math.min(1, dt * 12)   // eases over steps instead of popping
    camera.position.y += dy; if (controls) controls.target.y += dy
  }

  return {
    state, addFloor, addObstacle,
    get enabled() { return state.enabled },
    enable() {
      if (state.enabled) return
      state.enabled = true; floorY = null
      // feet on the floor from the start: drop to whatever floor is below, however far down
      const hit = floorBelow(1000)
      if (hit) { floorY = hit.point.y; const dy = floorY + state.eyeHeight - camera.position.y; camera.position.y += dy; if (controls) controls.target.y += dy }
      if (controls) {
        controls.minDistance = 0.2                                       // zooming in all the way turns the orbit into a look-around
        // the orbit point comes to a metre ahead, same direction, so a drag turns you on the spot
        // instead of swinging you round a point far away
        forward.subVectors(controls.target, camera.position)
        if (forward.lengthSq() < 1e-6) forward.set(0, 0, -1).applyQuaternion(camera.quaternion)
        controls.target.copy(camera.position).addScaledVector(forward.normalize(), 1)
      }
    },
    disable() {
      if (!state.enabled) return
      state.enabled = false; keys.clear(); dollyPending = 0
    },
    // call every frame from draw(); returns true while walk mode is on
    update(dt, { xrPresenting = false } = {}) {
      if (xrPresenting || !active()) return false
      viewForward()
      move.set(0, 0, 0)
      if (keys.has('KeyW') || keys.has('ArrowUp')) move.add(forward)
      if (keys.has('KeyS') || keys.has('ArrowDown')) move.sub(forward)
      if (keys.has('KeyD') || keys.has('ArrowRight')) move.add(right)
      if (keys.has('KeyA') || keys.has('ArrowLeft')) move.sub(right)
      if (!state.enabled) { if (keys.has('KeyE')) move.y += 1; if (keys.has('KeyQ')) move.y -= 1 }
      if (move.lengthSq() > 0) {
        const s = state.speed * ((keys.has('ShiftLeft') || keys.has('ShiftRight')) ? runFactor : 1)
        move.normalize().multiplyScalar(s * dt)
        if (state.enabled && state.solidWalls && obstacleSet.length) resolveWalls(move)
        shift(move)
      }
      if (dollyPending !== 0) {                                        // wheel steps, eased out over a few frames
        const amount = Math.abs(dollyPending) < 0.02 ? dollyPending : dollyPending * Math.min(1, dt * 8)
        dollyPending -= amount
        move.copy(forward).multiplyScalar(amount)
        if (state.enabled && state.solidWalls && obstacleSet.length) resolveWalls(move)
        shift(move)
      }
      if (state.enabled) snapToFloor(dt)
      return state.enabled
    },
    dispose() {
      window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp)
      domElement.removeEventListener('wheel', onWheel)
    },
  }
}
