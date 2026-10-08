// The Mixamo movement with the Mixamo skin thrown away.
//
// Every joint in a Mixamo file is a plain THREE.Bone, an Object3D with a name (mixamorigHips,
// mixamorigRightHand…), and a clip is nothing but tracks addressed to those names. So the
// animation can be kept and the body written in code instead: here a figure of spheres and struts
// is hung on the bones, a lamp is held in the left hand, a trail is drawn from the right hand, and
// two joints can be bent further by sliders after the clip has posed them. Nothing goes back to
// Mixamo; these are the same files the mixamo sketch plays. Click the figure to switch clips.
//
// To write code against a joint: byName.get('mixamorigRightHand') (also window.__puppet.byName in
// dev). Attach children to it, read its world position, or set its quaternion after mixer.update().

import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'

const CHARACTER = '/assets/models/pregnant.fbx'                 // the rig: its bones are what everything hangs on
const CLIPS = ['/assets/models/ginga.fbx', '/assets/models/esquiva.fbx', '/assets/models/armada.fbx', '/assets/models/meia-lua-de-compasso.fbx', '/assets/models/martelo.fbx', '/assets/models/capoeira.fbx']
const FADE = 0.3                                           // seconds of crossfade when switching clips
const TRAIL_POINTS = 240                                   // frames of the right hand's path kept on screen
const OVERRIDES = [                                        // joints the sliders bend, about a local axis, after the clip
  { key: 'rightArm', bone: 'mixamorigRightArm', axis: [0, 0, 1], label: 'right arm +° by code' },
  { key: 'head', bone: 'mixamorigHead', axis: [0, 1, 0], label: 'head turn ° by code' },
]

const params = { clip: '', speed: 1, skin: false, puppet: true, helper: false, trail: true, lamp: true, rightArm: 0, head: 0 }
let THREE_, model, mixer, actions = [], current = 0, sayHint, clipControl
let bones = [], byName = new Map(), parts = [], helper, lamp, trail, trailHand, trailCount = 0
const tmp = {}

const nameOf = url => url.split('/').pop().replace(/\.\w+$/, '')

export async function setup({ THREE, scene, selectable, hint, controls, gui }) {
  THREE_ = THREE; sayHint = hint
  tmp.v = new THREE.Vector3(); tmp.q = new THREE.Quaternion(); tmp.axis = new THREE.Vector3()
  scene.background = new THREE.Color(0x181a20)
  scene.add(new THREE.HemisphereLight(0xffffff, 0x334455, 1.2))
  const sun = new THREE.DirectionalLight(0xffffff, 1.5); sun.position.set(3, 5, 2); scene.add(sun)
  const floor = new THREE.Mesh(new THREE.CircleGeometry(4, 64), new THREE.MeshStandardMaterial({ color: 0x2a2d36, roughness: 0.9 }))
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.005; scene.add(floor)
  scene.add(new THREE.GridHelper(8, 16, 0x444a55, 0x30343d))
  controls.target.set(0, 1, 0)

  hint('loading the rig…')
  const loader = new FBXLoader()
  let file
  try { file = await loader.loadAsync(CHARACTER) } catch (err) { hint(`no rig at public${CHARACTER.slice(1)}`); console.warn(err); return }
  model = file

  // units: this library is metres, Mixamo downloads are usually centimetres; measure and scale
  const height = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3()).y      // in file units
  model.scale.setScalar(height > 10 ? 0.01 : 1)
  model.traverse(o => { if (o.isSkinnedMesh) { o.frustumCulled = false; o.visible = params.skin; parts.skin = o } })
  scene.add(selectable(model))

  // ---- the joints: every Bone in the file, by name ------------------------------------------
  model.traverse(o => { if (o.isBone) { bones.push(o); byName.set(o.name, o) } })
  console.log(`${bones.length} joints: ${bones.map(b => b.name.replace('mixamorig', '')).join(', ')}`)

  // ---- a body in code: a sphere on every joint, a strut from each joint to its parent ---------
  // Sizes are in file units, like the bone positions, so they scale with the model.
  const jointR = height * 0.013, strutR = height * 0.007
  const jointMat = new THREE.MeshStandardMaterial({ color: 0xffd27a, roughness: 0.4, metalness: 0.1 })
  const strutMat = new THREE.MeshStandardMaterial({ color: 0x9cc7ff, roughness: 0.5, metalness: 0.2 })
  const up = new THREE.Vector3(0, 1, 0)
  for (const bone of bones) {
    const end = /_End$/.test(bone.name), hips = bone.name === 'mixamorigHips'
    const joint = new THREE.Mesh(new THREE.SphereGeometry(jointR * (hips ? 1.8 : end ? 0.5 : 1), 12, 8), jointMat)
    bone.add(joint); parts.push(joint)
    if (bone.parent?.isBone) {
      const len = bone.position.length()                                          // the strut runs parent → this joint, in the parent's space
      if (len > 1e-6) {
        const strut = new THREE.Mesh(new THREE.CylinderGeometry(strutR, strutR, len, 8), strutMat)
        strut.quaternion.setFromUnitVectors(up, bone.position.clone().normalize())
        strut.position.copy(bone.position).multiplyScalar(0.5)
        bone.parent.add(strut); parts.push(strut)
      }
    }
  }
  helper = new THREE.SkeletonHelper(model); helper.visible = params.helper; scene.add(helper)

  // ---- things hung on joints: a lamp in the left hand ----------------------------------------
  const leftHand = byName.get('mixamorigLeftHand')
  if (leftHand) {
    lamp = new THREE.Group()
    lamp.add(new THREE.PointLight(0xffc27a, 6, 0, 2))
    lamp.add(new THREE.Mesh(new THREE.SphereGeometry(height * 0.018, 12, 8), new THREE.MeshStandardMaterial({ color: 0xffc27a, emissive: 0xffa040, emissiveIntensity: 2 })))
    lamp.visible = params.lamp
    leftHand.add(lamp)
  }

  // ---- a joint read every frame: the right hand's path as a line ----------------------------
  trailHand = byName.get('mixamorigRightHand')
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(TRAIL_POINTS * 3), 3))
  geo.setDrawRange(0, 0)
  trail = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xff7a3d }))
  trail.frustumCulled = false; trail.visible = params.trail
  scene.add(trail)

  // ---- the clips, each addressed to the bones by name ---------------------------------------
  const hips = byName.get('mixamorigHips')
  const charHipY = hips ? Math.abs(hips.position.y) : 0
  const fitUnits = clip => {                                                      // a clip in other units would drive the hips into the floor
    const hipTrack = clip.tracks.find(t => t.name.endsWith('Hips.position'))
    if (!hipTrack || !charHipY) return clip
    const ratio = charHipY / Math.abs(hipTrack.values[1])
    if (ratio > 0.5 && ratio < 2) return clip
    for (const t of clip.tracks) if (t.name.endsWith('.position')) for (let i = 0; i < t.values.length; i++) t.values[i] *= ratio
    return clip
  }
  const clips = file.animations.filter(c => c.duration > 0.1).slice(0, 1)
  if (clips[0]) clips[0].name = nameOf(CHARACTER)
  for (const url of CLIPS) {
    try { const extra = await loader.loadAsync(url); if (extra.animations[0]) { extra.animations[0].name = nameOf(url); clips.push(fitUnits(extra.animations[0])) } }
    catch (err) { console.warn('clip skipped:', url, err.message) }
  }
  mixer = new THREE.AnimationMixer(model)
  actions = clips.map(clip => mixer.clipAction(clip))
  actions[0]?.play()

  // ---- panel ------------------------------------------------------------------------------------
  const names = clips.map(c => c.name); params.clip = names[current] ?? ''
  clipControl = gui.add(params, 'clip', names).onChange(n => switchTo(names.indexOf(n)))
  gui.add(params, 'speed', 0, 3, 0.05).onChange(v => { mixer.timeScale = v })
  gui.add(params, 'puppet').name('body in code').onChange(v => parts.forEach(p => { p.visible = v }))
  gui.add(params, 'skin').name('Mixamo skin').onChange(v => { if (parts.skin) parts.skin.visible = v })
  gui.add(params, 'helper').name('bones as lines').onChange(v => { helper.visible = v })
  gui.add(params, 'lamp').name('lamp in left hand').onChange(v => { if (lamp) lamp.visible = v })
  gui.add(params, 'trail').name('right hand trail').onChange(v => { trail.visible = v; if (!v) { trailCount = 0; trail.geometry.setDrawRange(0, 0) } })
  for (const o of OVERRIDES) gui.add(params, o.key, -90, 90, 1).name(o.label)
  showClip()
  window.__puppet = { model, bones, byName, mixer, params, actions }
}

function showClip() {
  const names = actions.map((a, i) => i === current ? `[${a.getClip().name}]` : a.getClip().name)
  sayHint(`${bones.length} joints, each a THREE.Bone you can address by name · ${names.join('  ')} · click the figure to switch`)
}

function switchTo(i) {
  if (i === current || !actions[i]) return
  const from = actions[current], to = actions[i]
  current = i
  to.enabled = true; to.setEffectiveTimeScale(1).setEffectiveWeight(1); to.reset().play()
  from.crossFadeTo(to, FADE, true)
  params.clip = to.getClip().name; clipControl?.updateDisplay()
  showClip()
}

export function draw(ctx, dt) {
  if (!mixer) return
  mixer.update(dt)                                                              // the clip poses every joint…
  for (const o of OVERRIDES) {                                                  // …then code bends some of them further
    const deg = params[o.key]; if (!deg) continue
    const bone = byName.get(o.bone); if (!bone) continue
    bone.quaternion.multiply(tmp.q.setFromAxisAngle(tmp.axis.fromArray(o.axis), THREE_.MathUtils.degToRad(deg)))
  }
  if (trail.visible && trailHand) {                                             // read a joint's world position this frame
    model.updateMatrixWorld(true)
    trailHand.getWorldPosition(tmp.v)
    const a = trail.geometry.attributes.position
    if (trailCount < TRAIL_POINTS) trailCount++
    else a.array.copyWithin(0, 3)                                               // drop the oldest point
    a.array.set([tmp.v.x, tmp.v.y, tmp.v.z], (trailCount - 1) * 3)
    a.needsUpdate = true
    trail.geometry.setDrawRange(0, trailCount)
  }
}

export function onSelect(hit) {
  if (!hit || actions.length < 2) return
  switchTo((current + 1) % actions.length)
}
