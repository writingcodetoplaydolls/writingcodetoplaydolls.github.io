// Human-scale walking for flat (non-XR) viewing: first-person look by dragging, walk with
// WASD or the arrow keys, Shift to hurry, the wheel for a step along the look direction (the
// orbit zoom's counterpart, so scrolling keeps meaning "closer"), and every frame the floor beneath the viewer is
// found by a downward ray and the camera is held at eye height above it. Feet stay on the
// floor across steps, porches and the ground outside. Pair it with createTeleport: a tap on
// a floor still jumps there, and the height lock takes over on landing.
//
// Inside a headset this does nothing; the local-floor reference space is the real thing.

import * as THREE from 'three'

export function createWalkControls({
  camera, domElement, controls = null, floors = [], obstacles = [],
  eyeHeight = 1.6, speed = 1.8, runFactor = 2.5, lookSpeed = 0.0022,
  solidWalls = false, bodyRadius = 0.35, floorReach = 6, wheelStep = 1.5,
}) {
  const floorSet = [], obstacleSet = []
  const addFloor = o => { floorSet.push(o); return o }
  const addObstacle = o => { obstacleSet.push(o); return o }
  floors.forEach(addFloor); obstacles.forEach(addObstacle)

  const state = { enabled: false, eyeHeight, speed, yaw: 0, pitch: 0, solidWalls, bodyRadius }
  const keys = new Set()
  const raycaster = new THREE.Raycaster()
  const down = new THREE.Vector3(0, -1, 0)
  const from = new THREE.Vector3(), forward = new THREE.Vector3(), right = new THREE.Vector3(), move = new THREE.Vector3()
  const normal = new THREE.Vector3(), normalMatrix = new THREE.Matrix3()
  const euler = new THREE.Euler(0, 0, 0, 'YXZ')
  let dragging = false, lastX = 0, lastY = 0, floorY = null

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

  // ---- look: drag anywhere on the canvas -----------------------------------
  const onDown = e => { if (!state.enabled) return; dragging = true; lastX = e.clientX; lastY = e.clientY }
  const onMove = e => {
    if (!state.enabled || !dragging) return
    state.yaw -= (e.clientX - lastX) * lookSpeed
    state.pitch = THREE.MathUtils.clamp(state.pitch - (e.clientY - lastY) * lookSpeed, -1.45, 1.45)
    lastX = e.clientX; lastY = e.clientY
  }
  const onUp = () => { dragging = false }
  domElement.addEventListener('pointerdown', onDown)
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)

  // ---- walk: keyboard, ignored while typing in a panel field -----------------
  const typing = e => ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)
  const onKeyDown = e => { if (state.enabled && !typing(e)) { keys.add(e.code); if (/^(Arrow|Space)/.test(e.code)) e.preventDefault() } }
  const onKeyUp = e => keys.delete(e.code)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('blur', () => keys.clear())

  // ---- wheel: a step forward or back along the look direction, metres per notch --------
  let dollyPending = 0
  const onWheel = e => {
    if (!state.enabled) return
    e.preventDefault()
    const notches = e.deltaMode === 1 ? e.deltaY / 3 : e.deltaMode === 2 ? e.deltaY : e.deltaY / 100   // pixels, lines or pages
    dollyPending -= notches * wheelStep
  }
  domElement.addEventListener('wheel', onWheel, { passive: false })

  function syncFromCamera() {                 // pick up the orientation the orbit camera had
    euler.setFromQuaternion(camera.quaternion, 'YXZ')
    state.yaw = euler.y; state.pitch = euler.x
  }

  function floorBelow(reach) {
    from.copy(camera.position); from.y += 0.5
    raycaster.set(from, down); raycaster.far = reach
    return raycaster.intersectObjects(floorSet, true).find(h => h.object.visible)
  }
  function snapToFloor(dt) {
    const hit = floorBelow(floorReach)
    if (hit) floorY = hit.point.y
    if (floorY === null) return
    const target = floorY + state.eyeHeight
    camera.position.y += (target - camera.position.y) * Math.min(1, dt * 12)   // eases over steps instead of popping
  }

  return {
    state, addFloor, addObstacle,
    get enabled() { return state.enabled },
    enable() {
      if (state.enabled) return
      syncFromCamera(); state.enabled = true; floorY = null
      if (controls) controls.enabled = false
      // feet on the floor from the start: drop to whatever floor is below, however far down
      const hit = floorBelow(1000)
      if (hit) { floorY = hit.point.y; camera.position.y = floorY + state.eyeHeight }
    },
    disable() {
      if (!state.enabled) return
      state.enabled = false; keys.clear(); dragging = false
      if (controls) {
        controls.enabled = true
        forward.set(0, 0, -1).applyQuaternion(camera.quaternion)
        controls.target.copy(camera.position).addScaledVector(forward, 4)   // orbit around what you were looking at
      }
    },
    // call every frame from draw(); returns true while it owns the camera
    update(dt, { xrPresenting = false } = {}) {
      if (!state.enabled || xrPresenting) return false
      euler.set(state.pitch, state.yaw, 0, 'YXZ')
      camera.quaternion.setFromEuler(euler)
      forward.set(-Math.sin(state.yaw), 0, -Math.cos(state.yaw))
      right.set(forward.z, 0, -forward.x)
      move.set(0, 0, 0)
      if (keys.has('KeyW') || keys.has('ArrowUp')) move.add(forward)
      if (keys.has('KeyS') || keys.has('ArrowDown')) move.sub(forward)
      if (keys.has('KeyD') || keys.has('ArrowRight')) move.add(right)
      if (keys.has('KeyA') || keys.has('ArrowLeft')) move.sub(right)
      if (move.lengthSq() > 0) {
        const s = state.speed * ((keys.has('ShiftLeft') || keys.has('ShiftRight')) ? runFactor : 1)
        move.normalize().multiplyScalar(s * dt)
        if (state.solidWalls && obstacleSet.length) resolveWalls(move)
        camera.position.add(move)
      }
      if (dollyPending !== 0) {                                      // wheel steps, eased out over a few frames
        const amount = Math.abs(dollyPending) < 0.02 ? dollyPending : dollyPending * Math.min(1, dt * 8)
        dollyPending -= amount
        move.copy(forward).multiplyScalar(amount)
        if (state.solidWalls && obstacleSet.length) resolveWalls(move)
        camera.position.add(move)
      }
      snapToFloor(dt)
      // OrbitControls.update() re-aims the camera at its target every frame; keep that target in
      // front of us so the two agree while this mode owns the camera.
      if (controls) controls.target.copy(camera.position).addScaledVector(forward, 1)
      return true
    },
    dispose() {
      domElement.removeEventListener('pointerdown', onDown); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp)
      domElement.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp)
    },
  }
}
