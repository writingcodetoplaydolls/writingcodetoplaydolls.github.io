// Inverse kinematics on the rig with no clips at all. Four spheres are targets; the hands (and,
// if switched on, the feet) reach for them, and the reaching is written against the joints by their
// Mixamo names. Nothing from Mixamo's clips is used; the body starts in its rest pose and only the
// limbs move. Drag a sphere with the mouse or a finger; in a headset, squeeze a controller near a
// sphere to carry it. "targets drift" moves the spheres from code instead.
//
// Each limb is a two-bone chain (upper arm + forearm, thigh + shin) solved analytically with a pole:
// the triangle root–elbow–tip fixes the elbow angle (law of cosines), the pole says which way the
// elbow points (out to the side and down for an arm, forward for a knee), and the root joint is turned
// so upper and lower bone land on that triangle. Exact, every frame, no passes and no dead ends.
// Then the joints are clamped to angle limits measured on this rig (LIMITS), and the body is solid
// (BODY): a sphere stops at its surface, and a limb that would pass through it is solved instead
// toward a goal slid along the surface back toward the shoulder, so the hand stops as far toward
// the sphere as it can get. The panel can switch limits and solidity off to see the difference.

import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'
import { DragControls } from 'three/addons/controls/DragControls.js'

const CHARACTER = '/assets/models/pregnant.fbx'                 // the rig, used for its skeleton (and skin) only
const CHAINS = [                                           // links root → tip, then the joint the target is for, and where its elbow or knee should point
  { key: 'right hand', links: ['mixamorigRightArm', 'mixamorigRightForeArm'], effector: 'mixamorigRightHand', color: 0xff7a3d, limb: 'hands', pole: [-0.5, -0.5, 0.15] },
  { key: 'left hand',  links: ['mixamorigLeftArm', 'mixamorigLeftForeArm'],   effector: 'mixamorigLeftHand',  color: 0xffd27a, limb: 'hands', pole: [0.5, -0.5, 0.15] },
  { key: 'right foot', links: ['mixamorigRightUpLeg', 'mixamorigRightLeg'],   effector: 'mixamorigRightFoot', color: 0x9cc7ff, limb: 'feet',  pole: [0, -0.4, 0.6] },
  { key: 'left foot',  links: ['mixamorigLeftUpLeg', 'mixamorigLeftLeg'],     effector: 'mixamorigLeftFoot',  color: 0x7ad6ff, limb: 'feet',  pole: [0, -0.4, 0.6] },
]
const GRAB_REACH = 0.25                                    // m: how close a controller must be to pick a sphere up

// Angle limits in degrees about each joint's own axes, relative to its rest pose. Measured on this rig
// on 2026-10-08 by turning each joint 45° about one axis at a time and watching where the hand or
// foot went (model faces +Z, its right hand is at −X). Mixamo bones point local Y along the bone, so
// Y is always the twist; which of X and Z is the hinge, and which way is positive, differs per joint.
const LIMITS = {
  // elbows: hinges about local Z. The right one folds forward with a negative angle, the left with a
  // positive one. X would bend the elbow sideways, Y would twist the forearm: both held at 0.
  // Hinges never quite straighten (3°): a dead-straight limb is a dead end for any solver.
  mixamorigRightForeArm: { x: [0, 0], y: [0, 0], z: [-140, -3] },
  mixamorigLeftForeArm:  { x: [0, 0], y: [0, 0], z: [3, 140] },
  // knees: hinges about local X, folding (foot back and up) with a negative angle. Z swings the shin sideways.
  mixamorigRightLeg:     { x: [-140, -3], y: [0, 0], z: [0, 0] },
  mixamorigLeftLeg:      { x: [-140, -3], y: [0, 0], z: [0, 0] },
  // shoulders: ball joints, measured from the arm held level out to the side (not from the rest
  // pose, which droops 35° below that; a cone hung on a drooping axis climbs as it swings forward).
  // +X lowers the arm (90° down = hanging at the side, 100° up = past overhead), Z swings it forward
  // and back (130° forward, 25° back; + is backward on the right, forward on the left), Y twists.
  mixamorigRightArm:     { x: [-100, 90], y: [-90, 90], z: [-130, 25] },
  mixamorigLeftArm:      { x: [-100, 90], y: [-90, 90], z: [-25, 130] },
  // hips: ball joints. +X swings the leg forward (120° forward, 20° back), Z swings it across the body
  // or away (25° across, 45° away; + is across on the right, away on the left), Y twists.
  mixamorigRightUpLeg:   { x: [-20, 120], y: [-45, 45], z: [-45, 25] },
  mixamorigLeftUpLeg:    { x: [-20, 120], y: [-45, 45], z: [-25, 45] },
}
const DEG = Math.PI / 180

// The body as something solid: capsules on the bones, radii measured from the skin on 2026-10-08
// (belly 0.27 m to the front and 0.22 behind, chest 0.20, head 0.12, thighs 0.15, shins 0.08).
// A chain ignores the capsules on its own bones.
const BODY = [
  { from: 'mixamorigHips', to: 'mixamorigSpine2', r: 0.21, forward: 0.06 },   // the belly sits forward of the spine; a round capsule can only be thinner at the sides than it is in front
  { from: 'mixamorigSpine2', to: 'mixamorigNeck', r: 0.20 },
  { from: 'mixamorigHead', to: 'mixamorigHeadTop_End', r: 0.12 },
  { from: 'mixamorigRightUpLeg', to: 'mixamorigRightLeg', r: 0.15 },
  { from: 'mixamorigLeftUpLeg', to: 'mixamorigLeftLeg', r: 0.15 },
  { from: 'mixamorigRightLeg', to: 'mixamorigRightFoot', r: 0.08 },
  { from: 'mixamorigLeftLeg', to: 'mixamorigLeftFoot', r: 0.08 },
]
const HAND_R = 0.05                                        // m: a hand or foot stays this far off the body
const LIMB_R = 0.04                                        // m: so does an elbow or forearm
const SLIDE_ROUNDS = 10                                    // how many times a blocked limb's goal slides back toward the shoulder

const params = { skin: true, puppet: false, helper: false, feet: false, drift: false, limits: true, solid: true, showBody: false, showPoles: false }
let model, byName = new Map(), chains = [], targets = [], parts = [], helper, drag, grabbed = new Map(), sayHint, MathUtils, body = []
const tmp = {}

export async function setup({ THREE, scene, camera, renderer, controls, hint, gui }) {
  sayHint = hint; MathUtils = THREE.MathUtils
  for (const k of ['R', 'M', 'T', 'u', 'v', 'P', 'Mstar', 'a', 'b', 'u1', 'seg', 'cp', 'n', 'dv', 'eff', 'el', 'mid', 'goal', 'rootPos', 'axis', 'axis2', 'dir', 'cand']) tmp[k] = new THREE.Vector3()
  for (const k of ['q', 'q2', 'p', 'pInv', 'd', 'rel', 'tw', 'twInv', 'sw']) tmp[k] = new THREE.Quaternion()
  tmp.e = new THREE.Euler()
  scene.background = new THREE.Color(0x181a20)
  scene.add(new THREE.HemisphereLight(0xffffff, 0x334455, 1.2))
  const sun = new THREE.DirectionalLight(0xffffff, 1.5); sun.position.set(3, 5, 2); scene.add(sun)
  const floor = new THREE.Mesh(new THREE.CircleGeometry(4, 64), new THREE.MeshStandardMaterial({ color: 0x2a2d36, roughness: 0.9 }))
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.005; scene.add(floor)
  scene.add(new THREE.GridHelper(8, 16, 0x444a55, 0x30343d))
  controls.target.set(0, 1, 0)

  hint('loading the rig…')
  try { model = await new FBXLoader().loadAsync(CHARACTER) } catch (err) { hint(`no rig at public${CHARACTER.slice(1)}`); console.warn(err); return }
  const height = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3()).y      // file units
  model.scale.setScalar(height > 10 ? 0.01 : 1)
  model.traverse(o => {
    if (o.isSkinnedMesh) { o.frustumCulled = false; o.visible = params.skin; parts.skin = o }
    if (o.isBone) byName.set(o.name, o)
  })

  // ---- a body in code, like the puppet sketch, for when the skin is off ----------------------
  const jointR = height * 0.013, strutR = height * 0.007, up = new THREE.Vector3(0, 1, 0)
  const jointMat = new THREE.MeshStandardMaterial({ color: 0xffd27a, roughness: 0.4 }), strutMat = new THREE.MeshStandardMaterial({ color: 0x9cc7ff, roughness: 0.5 })
  for (const bone of byName.values()) {
    const joint = new THREE.Mesh(new THREE.SphereGeometry(jointR * (bone.name === 'mixamorigHips' ? 1.8 : /_End$/.test(bone.name) ? 0.5 : 1), 12, 8), jointMat)
    joint.visible = params.puppet; bone.add(joint); parts.push(joint)
    const len = bone.position.length()
    if (bone.parent?.isBone && len > 1e-6) {
      const strut = new THREE.Mesh(new THREE.CylinderGeometry(strutR, strutR, len, 8), strutMat)
      strut.quaternion.setFromUnitVectors(up, bone.position.clone().normalize()); strut.position.copy(bone.position).multiplyScalar(0.5)
      strut.visible = params.puppet; bone.parent.add(strut); parts.push(strut)
    }
  }
  scene.add(model)
  helper = new THREE.SkeletonHelper(model); helper.visible = params.helper; scene.add(helper)
  model.updateMatrixWorld(true)

  // ---- the chains and their targets, which start exactly where the hands and feet are ---------
  const hipsX = byName.get('mixamorigHips').getWorldPosition(new THREE.Vector3()).x
  for (const c of CHAINS) {
    const links = c.links.map(n => byName.get(n)), effector = byName.get(c.effector)
    if (links.some(l => !l) || !effector) { console.warn('chain skipped, joints missing:', c.key); continue }
    const target = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), new THREE.MeshStandardMaterial({ color: c.color, emissive: c.color, emissiveIntensity: 0.5, roughness: 0.4 }))
    effector.getWorldPosition(target.position)
    target.name = c.key + ' target'; target.userData.limb = c.limb; target.visible = c.limb === 'hands' || params.feet
    scene.add(target); targets.push(target)
    const rest = links.map(l => l.quaternion.clone())
    // how far the limb is already bent in the rest pose (the triangle works from straight), and which
    // local axis of the lower joint is its hinge, folding which way (from the limits table)
    const p0 = links[0].getWorldPosition(new THREE.Vector3()), p1 = links[1].getWorldPosition(new THREE.Vector3()), p2 = effector.getWorldPosition(new THREE.Vector3())
    const restFold = Math.PI - p0.clone().sub(p1).angleTo(p2.clone().sub(p1))
    const hl = LIMITS[links[1].name], key = hl ? ['x', 'y', 'z'].find(a => hl[a][0] !== hl[a][1]) : 'z'
    const hinge = { axis: new THREE.Vector3(key === 'x' ? 1 : 0, key === 'y' ? 1 : 0, key === 'z' ? 1 : 0), sign: hl && hl[key][1] <= 0 ? -1 : 1 }
    // the frame the root's limits are measured from: for a shoulder, the arm held level out to the side
    const neutral = rest.map(q => q.clone())
    if (c.limb === 'hands') {
      const restDir = p1.clone().sub(p0).normalize(), level = new THREE.Vector3(Math.sign(p0.x - hipsX) || 1, 0, 0)
      const pq = links[0].parent.getWorldQuaternion(new THREE.Quaternion())
      neutral[0] = pq.clone().invert().multiply(new THREE.Quaternion().setFromUnitVectors(restDir, level)).multiply(pq).multiply(rest[0])
    }
    const poleMarker = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), new THREE.MeshBasicMaterial({ color: c.color, wireframe: true }))
    poleMarker.visible = params.showPoles; scene.add(poleMarker)
    chains.push({ ...c, links, effector, target, rest: { links: rest, target: target.position.clone() }, restInv: rest.map(q => q.clone().invert()),
      limits: links.map(l => LIMITS[l.name] ?? null), restFold, hinge, pole: new THREE.Vector3().fromArray(c.pole), poleMarker, neutral, neutralInv: neutral.map(q => q.clone().invert()),
      bones: new Set([...c.links, c.effector]), side: Math.sign(p0.x - hipsX) || 1 })
  }

  // ---- the solid body: a capsule per bone segment, endpoints refreshed every frame -------------
  const capMat = new THREE.MeshStandardMaterial({ color: 0x9cc7ff, transparent: true, opacity: 0.25, roughness: 0.8, depthWrite: false })
  for (const b of BODY) {
    const from = byName.get(b.from), to = byName.get(b.to)
    if (!from || !to) continue
    const len = from.getWorldPosition(new THREE.Vector3()).distanceTo(to.getWorldPosition(new THREE.Vector3()))
    const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(b.r, len, 4, 12), capMat)
    mesh.visible = params.showBody; scene.add(mesh)
    body.push({ ...b, from, to, a: new THREE.Vector3(), b: new THREE.Vector3(), mesh, bones: new Set([b.from, b.to]) })
  }

  // ---- moving the targets: drag with a pointer, or carry with a controller in a headset --------
  const active = () => targets.filter(t => t.visible)
  drag = new DragControls(active(), camera, renderer.domElement)
  drag.addEventListener('dragstart', () => { controls.enabled = false })
  drag.addEventListener('dragend', () => { controls.enabled = true })
  for (let i = 0; i < 2; i++) {
    const ctrl = renderer.xr.getController(i)
    ctrl.addEventListener('selectstart', () => {
      ctrl.getWorldPosition(tmp.v)
      let best = null, bestD = GRAB_REACH
      for (const t of active()) { const d = t.position.distanceTo(tmp.v); if (d < bestD) { bestD = d; best = t } }
      if (best) grabbed.set(ctrl, best)
    })
    ctrl.addEventListener('selectend', () => grabbed.delete(ctrl))
  }

  // ---- panel ------------------------------------------------------------------------------------
  const resetPose = () => { for (const c of chains) { c.links.forEach((l, i) => l.quaternion.copy(c.rest.links[i])); c.target.position.copy(c.rest.target) } }
  gui.add(params, 'feet').name('feet too').onChange(v => { for (const t of targets) if (t.userData.limb === 'feet') t.visible = v; drag.objects = active() })
  gui.add(params, 'drift').name('targets drift (code)')
  gui.add(params, 'limits').name('joint limits')
  gui.add(params, 'solid').name('body is solid')
  gui.add(params, 'showBody').name('show the body capsules').onChange(v => body.forEach(b => { b.mesh.visible = v }))
  gui.add(params, 'showPoles').name('show the poles').onChange(v => chains.forEach(c => { c.poleMarker.visible = v }))
  gui.add({ resetPose }, 'resetPose').name('reset pose and targets')
  gui.add(params, 'skin').name('Mixamo skin').onChange(v => { if (parts.skin) parts.skin.visible = v })
  gui.add(params, 'puppet').name('body in code').onChange(v => parts.forEach(p => { p.visible = v }))
  gui.add(params, 'helper').name('bones as lines').onChange(v => { helper.visible = v })

  hint(`no clips · drag a sphere and that hand reaches for it · two-bone solve with a pole, within measured joint limits, around a solid body · in a headset, squeeze near a sphere to carry it`)
  window.__ik = { model, byName, chains, targets, params, resetPose, LIMITS, BODY, body, relativeEuler, insideBody, solve, limbClear, pushOut, updateBody, clampBall, turnInWorld, tmp, HAND_R }
}

// A joint's rotation relative to its rest pose, as angles about its own axes (degrees).
function relativeEuler(chain, i) {
  tmp.rel.copy(chain.restInv[i]).multiply(chain.links[i].quaternion)
  tmp.e.setFromQuaternion(tmp.rel, 'XYZ')
  return { x: tmp.e.x / DEG, y: tmp.e.y / DEG, z: tmp.e.z / DEG }
}

// ---- clamps --------------------------------------------------------------------------------------
// A hinge: measure it against its rest pose, clamp each axis, put it back.
function clampLink(link, rest, restInv, lim) {
  tmp.rel.copy(restInv).multiply(link.quaternion)
  tmp.e.setFromQuaternion(tmp.rel, 'XYZ')
  for (const a of ['x', 'y', 'z']) tmp.e[a] = MathUtils.clamp(tmp.e[a], lim[a][0] * DEG, lim[a][1] * DEG)
  link.quaternion.copy(rest).multiply(tmp.rel.setFromEuler(tmp.e))
}
// A ball joint: split its rotation from rest into a twist about the bone (local Y) and a swing that
// tilts the bone; clamp the twist to its range and the swing to an ellipse drawn through the four
// X and Z limits. Angles here grow smoothly from the rest pose, so a big swing never flips to a
// wrong-but-equivalent set of Euler angles the way a per-axis clamp can.
function clampBall(link, rest, restInv, lim) {
  tmp.rel.copy(restInv).multiply(link.quaternion)
  let ty = tmp.rel.y, tw = tmp.rel.w
  if (tw < 0) { ty = -ty; tw = -tw }                                   // the short way round
  const tn = Math.hypot(ty, tw) || 1
  tmp.tw.set(0, ty / tn, 0, tw / tn)                                   // the twist alone
  tmp.sw.copy(tmp.rel).multiply(tmp.twInv.copy(tmp.tw).invert())       // what is left is the swing
  let twist = 2 * Math.atan2(ty / tn, tw / tn)
  twist = MathUtils.clamp(twist, lim.y[0] * DEG, lim.y[1] * DEG)
  const swing = 2 * Math.acos(MathUtils.clamp(tmp.sw.w, -1, 1))
  tmp.axis.set(tmp.sw.x, 0, tmp.sw.z)
  if (swing > 1e-4 && tmp.axis.lengthSq() > 1e-12) {
    tmp.axis.normalize()
    const most = (ax, az) => DEG / Math.sqrt(ax ** 2 / Math.max(0.5, ax >= 0 ? lim.x[1] : -lim.x[0]) ** 2 + az ** 2 / Math.max(0.5, az >= 0 ? lim.z[1] : -lim.z[0]) ** 2)   // the ellipse's radius that way, radians
    if (swing > most(tmp.axis.x, tmp.axis.z)) {
      // Outside the cone. Shortening the swing along its own axis is wrong when the wanted direction
      // is nearly opposite the rest direction (an arm sent across the body): the axis is then
      // arbitrary and the clamp lands wherever it happens to point, usually straight down. Take
      // instead the direction on the cone's boundary closest to the wanted one.
      tmp.dir.set(0, 1, 0).applyQuaternion(tmp.sw)                      // the wanted bone direction, in the rest frame
      let bestDot = -2, bx = tmp.axis.x, bz = tmp.axis.z, bth = 0
      const consider = (ax, az) => {
        const th = most(ax, az)
        tmp.cand.set(0, 1, 0).applyQuaternion(tmp.q2.setFromAxisAngle(tmp.axis2.set(ax, 0, az), th))
        const dot = tmp.cand.dot(tmp.dir)
        if (dot > bestDot) { bestDot = dot; bx = ax; bz = az; bth = th }
      }
      consider(tmp.axis.x, tmp.axis.z)
      for (let k = 0; k < 36; k++) consider(Math.cos(k * Math.PI / 18), Math.sin(k * Math.PI / 18))
      tmp.sw.setFromAxisAngle(tmp.axis.set(bx, 0, bz), bth)
    }
  }
  tmp.tw.setFromAxisAngle(tmp.axis.set(0, 1, 0), twist)
  link.quaternion.copy(rest).multiply(tmp.rel.copy(tmp.sw).multiply(tmp.tw))
}

// ---- the solve -----------------------------------------------------------------------------------
// Turn a joint by a world-space rotation: the same rotation expressed in its parent's frame.
function turnInWorld(joint, qWorld) {
  joint.parent.getWorldQuaternion(tmp.p); tmp.pInv.copy(tmp.p).invert()
  tmp.d.copy(tmp.pInv).multiply(qWorld).multiply(tmp.p)
  joint.quaternion.premultiply(tmp.d)
  joint.updateWorldMatrix(false, true)
}

// Two-bone IK with a pole, for one chain and one goal.
function solve(chain, goal) {
  const { links: [root, mid], effector, hinge } = chain
  const hingeLim = params.limits ? chain.limits[1] : null, rootLim = params.limits ? chain.limits[0] : null
  root.getWorldPosition(tmp.R); mid.getWorldPosition(tmp.M); effector.getWorldPosition(tmp.T)
  const L1 = tmp.R.distanceTo(tmp.M), L2 = tmp.M.distanceTo(tmp.T)
  const d = MathUtils.clamp(tmp.R.distanceTo(goal), Math.abs(L1 - L2) + 1e-4, L1 + L2 - 1e-4)

  // 1. the elbow angle follows from the triangle root–elbow–tip
  const fold = Math.PI - Math.acos(MathUtils.clamp((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1))   // bend from straight
  mid.quaternion.copy(chain.rest.links[1]).multiply(tmp.q.setFromAxisAngle(hinge.axis, hinge.sign * (fold - chain.restFold)))
  if (hingeLim) clampLink(mid, chain.rest.links[1], chain.restInv[1], hingeLim)
  mid.updateWorldMatrix(false, true)

  // 2. where the elbow belongs: on the triangle, in the plane of root, goal and pole
  tmp.u.subVectors(goal, tmp.R).normalize()
  tmp.P.copy(tmp.R).add(chain.pole); chain.poleMarker.position.copy(tmp.P)
  tmp.v.subVectors(tmp.P, tmp.R); tmp.v.addScaledVector(tmp.u, -tmp.v.dot(tmp.u))         // the pole's part across the root→goal line
  if (tmp.v.lengthSq() < 1e-8) tmp.v.set(0, -1, 0).addScaledVector(tmp.u, -tmp.u.y)
  tmp.v.normalize()
  const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, L1 * L1 - a * a))
  tmp.Mstar.copy(tmp.R).addScaledVector(tmp.u, a).addScaledVector(tmp.v, h)

  // 3. swing the root so the upper bone points at that elbow
  mid.getWorldPosition(tmp.M)
  tmp.a.subVectors(tmp.M, tmp.R).normalize(); tmp.b.subVectors(tmp.Mstar, tmp.R).normalize()
  turnInWorld(root, tmp.q.setFromUnitVectors(tmp.a, tmp.b))

  // 4. roll the root about the upper bone so the folded lower bone lies toward the goal
  mid.getWorldPosition(tmp.M); effector.getWorldPosition(tmp.T)
  tmp.u1.subVectors(tmp.M, tmp.R).normalize()
  tmp.a.subVectors(tmp.T, tmp.M); tmp.a.addScaledVector(tmp.u1, -tmp.a.dot(tmp.u1))
  tmp.b.subVectors(goal, tmp.M); tmp.b.addScaledVector(tmp.u1, -tmp.b.dot(tmp.u1))
  if (tmp.a.lengthSq() > 1e-8 && tmp.b.lengthSq() > 1e-8) {
    const theta = Math.atan2(tmp.n.crossVectors(tmp.a, tmp.b).dot(tmp.u1), tmp.a.dot(tmp.b))
    turnInWorld(root, tmp.q.setFromAxisAngle(tmp.u1, theta))
  }

  // 5. the root's own limits
  if (rootLim) { clampBall(root, chain.neutral[0], chain.neutralInv[0], rootLim); root.updateWorldMatrix(false, true) }
}

// ---- the body as a solid ---------------------------------------------------------------------
function updateBody() {
  for (const b of body) {
    b.from.getWorldPosition(b.a); b.to.getWorldPosition(b.b)
    if (b.forward) { b.a.z += b.forward; b.b.z += b.forward }
    if (b.mesh.visible) {
      b.mesh.position.addVectors(b.a, b.b).multiplyScalar(0.5)
      b.mesh.quaternion.setFromUnitVectors(tmp.v.set(0, 1, 0), tmp.seg.subVectors(b.b, b.a).normalize())
    }
  }
}
// closest point on capsule b's axis to p → tmp.cp; returns the distance
function distToCapsule(p, b) {
  tmp.seg.subVectors(b.b, b.a)
  const t = MathUtils.clamp(tmp.dv.subVectors(p, b.a).dot(tmp.seg) / tmp.seg.lengthSq(), 0, 1)   // its own scratch: p may be another tmp
  tmp.cp.copy(b.a).addScaledVector(tmp.seg, t)
  return p.distanceTo(tmp.cp)
}
function insideBody(p, pad, skip) {
  for (const b of body) if (!skip || ![...b.bones].some(n => skip.has(n))) if (distToCapsule(p, b) < b.r + pad) return b
  return null
}
// move p to the surface of whatever capsule it is in (a few rounds, in case that lands it in another)
function pushOut(p, pad, skip) {
  for (let round = 0; round < 3; round++) {
    const b = insideBody(p, pad, skip); if (!b) return
    const d = distToCapsule(p, b)
    tmp.n.subVectors(p, tmp.cp); if (d < 1e-6) tmp.n.set(0, 0, 1); else tmp.n.divideScalar(d)
    p.copy(tmp.cp).addScaledVector(tmp.n, b.r + pad)
  }
}
// is the hand, the elbow or the forearm in the body?
function limbClear(chain) {
  const { links, effector } = chain
  effector.getWorldPosition(tmp.eff); if (insideBody(tmp.eff, LIMB_R, chain.bones)) return false
  links[1].getWorldPosition(tmp.el); if (insideBody(tmp.el, LIMB_R, chain.bones)) return false
  tmp.mid.addVectors(tmp.el, tmp.eff).multiplyScalar(0.5)
  return !insideBody(tmp.mid, LIMB_R, chain.bones)
}

export function draw(ctx, dt, t) {
  if (!model) return
  if (params.drift) chains.forEach((c, i) => { const r = c.rest.target; c.target.position.set(r.x + 0.25 * Math.sin(t * 1.3 + i), r.y + 0.2 * Math.sin(t * 0.9 + 2 * i), r.z + 0.25 * Math.cos(t * 1.1 + i)) })
  for (const [ctrl, target] of grabbed) ctrl.getWorldPosition(target.position)
  model.updateMatrixWorld(true)
  updateBody()
  for (const c of chains) {
    if (!c.target.visible) continue
    if (params.solid) pushOut(c.target.position, HAND_R, c.bones)        // the sphere itself sits on the body's surface at the closest
    tmp.goal.copy(c.target.position)                                      // what this frame solves toward (per frame, from the sphere, so nothing accumulates)
    solve(c, tmp.goal)
    if (params.solid) {                                                   // the limb may not pass through the body: slide the goal along the
      c.links[0].getWorldPosition(tmp.rootPos)                            // surface back toward the shoulder until the limb can get to it;
      const front = c.target.position.z > tmp.rootPos.z - 0.1              // a goal in front of the body escapes forward, not up over the chest
      for (let round = 1; round <= SLIDE_ROUNDS && !limbClear(c); round++) {   // nearer the shoulder the elbow folds and the pole takes it clear
        tmp.goal.lerp(tmp.rootPos, 0.15)
        if (front) tmp.goal.z += 0.04 * round
        pushOut(tmp.goal, HAND_R + 0.03 * round, c.bones)
        solve(c, tmp.goal)
      }
    }
  }
}
