// The Family scene (K:\Unity\Family, saved 9 December 2018), rebuilt from scenes/family-scene.json.
//
// A surreal giants' landscape, every surface skinned with video: two 24 m figures of Flannery
// standing together playing Quilt2, a third at the origin, a 7.9 m Porta Romana lamp wearing two
// quilt renders, a three-times-size metal oven showing the same animation as the sky, a tipped
// washing machine, a 285 m hawk 220 m up showing a quilt render, a ten-times city house far off,
// and the whole sky an equirectangular video. The viewer starts where the Unity Main Camera was.
//
// Positions and scales are Unity's. Models are decimated GLBs of the original OBJ/3DS files; the
// 2018 videos are cut to 45 s loops. One clip was already missing in Unity (NewFlan); it gets quilt-d.
//
// The city house is a game asset: an outside only, doors painted on, hollow within, and Unity left it
// pitched 4.4° so its floor slab climbs from ground level at the back to 19 m up at the front porch.
// A doorway has been cut into it (tools/blender_cut_doorway.py) where the side veranda meets the main
// block, a hall floor is laid inside at the level of the decks (buildHallFloor, fitted to the walls by
// rays), so the hollow can be entered and walked on the level, and a projector hangs inside the hall
// throwing its picture out through that doorway onto the veranda deck. Its clip is TraylorAnimation.mp4, the one
// Family video nothing in the Unity scene used.

import { loadModel, prepareMeshes } from '../../lib/loaders.js'
import { applyTransform, unityColor, fetchScene, UNITY_SUN_TO_LUX, IMPORTED_MODEL_SPIN_Y } from '../../lib/unity.js'
import { createMedia, createProjector } from '../../lib/projector.js'
import { createTeleport } from '../../lib/teleport.js'
import { createWalkControls } from '../../lib/walk.js'

const SCENE_JSON = '/assets/scenes/family-scene.json'
const ASSETS = {                                                   // Unity asset → web model
  'Models/Model hawk WOAH 2/Model.obj': '/assets/models/family/hawk.glb',
  'Models/NewFlanneryStandingmitGame/untitled.obj': '/assets/models/family/flannery.glb',
  'Models/city_house_01_obj/city_house_01.obj': '/assets/models/family/cityhouse-door.glb',   // cityhouse.glb with the doorway cut
  'Models/Metal Oven/0005.3ds': '/assets/models/family/oven.glb',
  'Models/washing machine/washer.obj': '/assets/models/family/washer.glb',
  'Models/lamp/Porta romana Lens Lamp.obj': '/assets/models/family/lamp.glb',
}
const CLIPS = {                                                    // Unity clip → web clip
  'Video/anim3.mp4': '/assets/video/anim3-sky.mp4',
  'Video/Quilt.mp4': '/assets/video/quilt-a.mp4',
  'Video/Quilt2.mp4': '/assets/video/quilt-b.mp4',
  'Video/quilt-[1-4499].mp4': '/assets/video/quilt-c.mp4',
  'Video/quilt-[1-10799].mp4': '/assets/video/quilt-d.mp4',
}
const MISSING_CLIP = '/assets/video/quilt-d.mp4'
const PROJECTOR_CLIP = '/assets/video/traylor-animation.mp4'            // first 90 s, with its mono sound
// The lamp's two video players sat on two of its four parts (Unity child ids 100000 and 100006).
const LAMP_PARTS = { Base001: 'Video/quilt-[1-4499].mp4', Shade001: 'Video/quilt-[1-10799].mp4' }
const LAMP_SHADE_PHOTO = '/assets/models/family/lamp-shade.jpg'       // shipped with the model, never wired into its material

// The house's own geometry, measured in world metres (see the doorway notes above).
const HOUSE = {
  slab: (x, z) => 0.0092 * x + 0.076 * z - 16.6306,   // floor-slab height above the house's lowest corner (tilted 4.4°)
  door: { x: 182, z: 289.5 },                        // centre of the cut doorway, in the main block's front wall
  along: [0.12, 0, 0.99],                            // the veranda runs this way out from the doorway
  deckRise: 6,                                       // the veranda and porch decks sit 6 m above the slab
  deckLocalZ: -0.6,                                  // that deck level in the model's own frame, whose z runs downward (1 unit = 10 m)
  veranda: { x: 183, z: 362 },                       // a spot on the veranda deck, looking back at the doorway
}

const params = { view: 'orbit', eyeHeight: 1.6, solidWalls: true, exposure: 0.8, sky: true, playing: true, lampPhoto: false }
const projParams = { on: true, sound: false, lightPath: true, turn: 0, tilt: 0 }
let media = new Map(), objects = [], markers = [], teleport, walk, projector = null, lampShade = null, lampShadeVideoMaterial = null

function webClip(url) {                                            // one <video> per clip, shared
  if (!media.has(url)) media.set(url, createMedia(url))
  return media.get(url)
}
const clip = unityUrl => webClip(CLIPS[unityUrl] ?? MISSING_CLIP)

// Models without texture coordinates still need to wear video: give them a flat projection.
function ensureUVs(THREE, geometry) {
  if (geometry.attributes.uv) return
  geometry.computeBoundingBox()
  const b = geometry.boundingBox, p = geometry.attributes.position, uv = new Float32Array(p.count * 2)
  const sx = (b.max.x - b.min.x) || 1, sy = (b.max.y - b.min.y) || 1
  for (let i = 0; i < p.count; i++) { uv[2 * i] = (p.getX(i) - b.min.x) / sx; uv[2 * i + 1] = (p.getY(i) - b.min.y) / sy }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
}

// The house has no floor at the level of its doorway and decks, only the ground slab 6 m lower. Lay one:
// half-metre strips in the model's own frame, each running between the walls a ray finds 1 m above
// deck level, so the floor meets the walls exactly: the main hall, and the wing in front of it.
function buildHallFloor(THREE, mesh) {
  mesh.updateMatrixWorld(true)
  const inv = mesh.matrixWorld.clone().invert(), ray = new THREE.Raycaster()
  const toWorld = p => p.clone().applyMatrix4(mesh.matrixWorld), toLocal = p => p.clone().applyMatrix4(inv)
  const measure = (seed, dir) => {               // where a ray from a local point, along a local axis, meets the house (local coords)
    ray.set(toWorld(seed), dir.clone().transformDirection(mesh.matrixWorld)); ray.far = 400
    const h = ray.intersectObject(mesh, false)[0]
    return h ? toLocal(h.point) : null
  }
  const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0)
  const z = HOUSE.deckLocalZ - 0.002, probeZ = HOUSE.deckLocalZ - 0.1, step = 0.05
  const hallSeedY = 1.0, wingSeedY = -5.0                                       // rows known to lie inside the hall and inside the wing
  const hallX = [measure(new THREE.Vector3(0, hallSeedY, probeZ), X.clone().negate())?.x ?? -4.5, measure(new THREE.Vector3(0, hallSeedY, probeZ), X)?.x ?? 6.3]
  const wingX = [measure(new THREE.Vector3(0, wingSeedY, probeZ), X.clone().negate())?.x ?? 0, measure(new THREE.Vector3(0, wingSeedY, probeZ), X)?.x ?? 0]
  const front = measure(new THREE.Vector3(hallX[1] - 0.3, hallSeedY, probeZ), Y.clone().negate())?.y ?? -0.55   // the hall's front wall, beside the wing
  const strips = []
  for (let x = hallX[0]; x < hallX[1] - 1e-6; x += step) {
    const xc = x + step / 2, x1 = Math.min(x + step, hallX[1])
    const back = measure(new THREE.Vector3(xc, hallSeedY, probeZ), Y)?.y ?? hallSeedY
    strips.push([x, x1, front, back])
    if (xc > wingX[0] && xc < wingX[1]) {
      const far = measure(new THREE.Vector3(xc, wingSeedY, probeZ), Y.clone().negate())?.y ?? wingSeedY
      strips.push([x, x1, far, front])
    }
  }
  const pos = [], idx = []
  for (const [x0, x1, y0, y1] of strips) {
    const i = pos.length / 3
    pos.push(x0, y0, z, x1, y0, z, x1, y1, z, x0, y1, z)
    idx.push(i, i + 1, i + 2, i, i + 2, i + 3)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals()
  ensureUVs(THREE, geo)
  const floor = new THREE.Mesh(geo, mesh.material.clone())
  floor.name = 'hall floor'; floor.frustumCulled = false
  mesh.add(floor)
  console.log(`hall floor: ${strips.length} strips, hall x ${hallX.map(v => v.toFixed(2)).join('..')}, wing x ${wingX.map(v => v.toFixed(2)).join('..')}, front wall y ${front.toFixed(2)}`)
  return floor
}

export async function setup({ THREE, scene, renderer, camera, controls, rig, selectable, hint, gui }) {
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = params.exposure
  camera.near = 0.3; camera.far = 1500; camera.updateProjectionMatrix()       // the hawk and the house are 300–450 m out

  hint('loading the Family scene…')
  const data = await fetchScene(SCENE_JSON)

  // ---- sky: the Unity skybox was a Panoramic material fed by a VideoPlayer's render texture -----
  const skyPlayer = data.videoPlayers.find(v => v.renderMode === 2)
  const skyMedia = clip(skyPlayer?.clip ?? 'Video/anim3.mp4')
  skyMedia.texture.mapping = THREE.EquirectangularReflectionMapping
  scene.background = skyMedia.texture
  scene.backgroundIntensity = 1.0

  // ---- light: the one directional light, plus a soft fill since there is no environment ----------
  const l = data.lights.find(x => x.type === 'directional')
  const sun = new THREE.DirectionalLight(l ? unityColor(l.color) : 0xffffff, UNITY_SUN_TO_LUX * (l?.intensity ?? 1))
  if (l) sun.position.set(-l.direction[0] * 100, -l.direction[1] * 100, -l.direction[2] * 100)
  scene.add(sun, new THREE.HemisphereLight(0xd9e4ff, 0x4a3f3a, 0.9))

  // ---- objects: plain mesh objects and prefab instances, each wearing its video -----------------
  const records = [
    ...data.meshes.filter(m => m.active && ASSETS[m.mesh]).map(m => ({ ...m, asset: ASSETS[m.mesh], label: m.name })),
    ...data.prefabs.filter(p => p.active && ASSETS[p.source]).map(p => ({ ...p, asset: ASSETS[p.source], label: p.source.split('/').pop() })),
  ]
  const videoFor = rec => {
    const byName = data.videoPlayers.find(v => v.renderMode === 3 && v.name && v.name === rec.name)
    const byPrefab = data.videoPlayers.find(v => v.renderMode === 3 && v.path?.endsWith('prefab:' + rec.label))
    const v = byName ?? byPrefab
    return v ? clip(v.clip) : null
  }
  let triangles = 0
  for (const rec of records) {
    let model
    try { ({ object: model } = await loadModel(rec.asset)) } catch (err) { console.warn(rec.label, err.message); continue }
    const group = new THREE.Group(); group.name = rec.label
    const spin = new THREE.Group(); spin.rotation.y = IMPORTED_MODEL_SPIN_Y; spin.add(model); group.add(spin)
    applyTransform(group, rec)
    const vid = videoFor(rec)
    const isLamp = rec.label.startsWith('Porta'), isHouse = rec.label === 'c_h_01'
    model.traverse(o => {
      if (!o.isMesh) return
      const partVid = isLamp ? (LAMP_PARTS[o.name] ? clip(LAMP_PARTS[o.name]) : null) : vid
      if (partVid) {
        ensureUVs(THREE, o.geometry)
        o.material = new THREE.MeshStandardMaterial({ map: partVid.texture, roughness: 0.8, metalness: 0, emissiveMap: partVid.texture, emissive: 0xffffff, emissiveIntensity: 0.35 })
        if (isLamp && o.name === 'Shade001') { lampShade = o; lampShadeVideoMaterial = o.material }
      } else {
        const mats = Array.isArray(o.material) ? o.material : [o.material]
        o.material = mats.length === 1 ? new THREE.MeshStandardMaterial({ color: mats[0].color ?? 0xdddddd, roughness: 0.8 }) : mats.map(m => new THREE.MeshStandardMaterial({ color: m.color ?? 0xdddddd, roughness: 0.8 }))
      }
      if (isHouse) o.material.side = THREE.DoubleSide                 // the inside is a place now
      o.frustumCulled = false
    })
    triangles += prepareMeshes(model, { shadows: false })
    scene.add(selectable(group))
    objects.push({ rec, group, video: vid })
    console.log(`${rec.label}: scale ${rec.scale[0]} at ${rec.position.map(v => v.toFixed(1)).join(', ')} · video ${vid ? vid.src.split('/').pop() : 'none'}`)
  }

  // ---- the house: its one mesh is a floor (slab, decks, roof) and a wall at the same time ----------
  const house = objects.find(o => o.rec.label === 'c_h_01')
  let houseMesh = null
  house?.group.traverse(o => { if (o.isMesh) houseMesh = o })
  const houseBase = house ? new THREE.Box3().setFromObject(house.group).min.y : 0
  const slabY = (x, z) => houseBase + HOUSE.slab(x, z)                 // world height of the house's floor slab at (x, z)
  const hallFloor = houseMesh ? buildHallFloor(THREE, houseMesh) : null  // at deck level, 6 m above the slab, a child of the house mesh

  // ---- a ground under the house, so the scene can be walked ---------------------------------------
  const anchor = house ?? objects.find(o => /^NewFlan \(/.test(o.rec.label))
  const feetY = anchor ? new THREE.Box3().setFromObject(anchor.group).min.y : 0
  const floor = new THREE.Mesh(new THREE.CircleGeometry(600, 96), new THREE.MeshStandardMaterial({ color: 0x2b2a2e, roughness: 1, metalness: 0 }))
  floor.rotation.x = -Math.PI / 2; floor.position.y = feetY - 0.02; floor.name = 'floor'
  scene.add(selectable(floor))
  const floors = [floor, houseMesh].filter(Boolean)
  teleport = createTeleport({ renderer, camera, rig, controls, floors, markerRadius: 0.6, eyeHeight: () => params.eyeHeight })
  scene.add(teleport.marker)
  walk = createWalkControls({
    camera, domElement: renderer.domElement, controls, floors, eyeHeight: params.eyeHeight,
    obstacles: objects.map(o => o.group), solidWalls: params.solidWalls, floorReach: 40,
  })
  const setView = v => { params.view = v; v === 'walk' ? walk.enable() : walk.disable() }
  console.log(`ground at y = ${feetY.toFixed(2)} (the base of ${anchor?.rec.label})`)

  // ---- the projector inside the house, throwing out through the doorway ---------------------------
  let aimProjector = () => null
  if (houseMesh) {
    const d = HOUSE.door
    const along = new THREE.Vector3().fromArray(HOUSE.along).normalize()
    const pos = new THREE.Vector3(d.x, slabY(d.x, d.z - 12) + 19, d.z - 12)             // high in the hall, 12 m behind the doorway, like a cinema projector
    const landing = new THREE.Vector3(d.x, slabY(d.x, d.z) + HOUSE.deckRise, d.z).addScaledVector(along, 40)   // on the veranda deck, 40 m out
    projector = createProjector({
      scene, media: webClip(PROJECTOR_CLIP), position: pos.toArray(), quaternion: [0, 0, 0, 1],
      throwRatio: 1.4, aspect: 1342 / 720, brightness: 0.9, range: 400,
      surfaces: [houseMesh, floor], showLightPath: true, name: 'house projector',
    })
    aimProjector = () => {
      const dir = landing.clone().sub(pos).normalize()
      dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(projParams.turn))
      const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize()
      dir.applyAxisAngle(right, THREE.MathUtils.degToRad(projParams.tilt))
      projector.group.quaternion.setFromRotationMatrix(new THREE.Matrix4().lookAt(pos, pos.clone().add(dir), new THREE.Vector3(0, 1, 0)))
      const info = projector.aim()
      console.log(`projector: a ${info.width.toFixed(1)} m picture ${info.distance.toFixed(0)} m away on ${info.hit ?? 'nothing'}`)
      return info
    }
    aimProjector()
  }

  // ---- where the Unity Main Camera stood -----------------------------------------------------------
  const cam = data.cameras.find(c => c.name === 'Main Camera') ?? data.cameras[0]
  if (cam) {
    camera.position.fromArray(cam.position)
    const target = new THREE.Vector3().fromArray(cam.position).add(new THREE.Vector3().fromArray(cam.direction).multiplyScalar(40))
    controls.target.copy(target); camera.lookAt(target)
    camera.fov = cam.fov; camera.updateProjectionMatrix()
  }
  setView(params.view)

  // ---- the beginning, kept so anyone lost can get back to it ----------------------------------------
  const start = { position: camera.position.clone(), target: controls.target.clone(), fov: camera.fov }
  let viewCtl = null
  const reset = () => {
    walk.disable(); params.view = 'orbit'; viewCtl?.updateDisplay()
    camera.position.copy(start.position); controls.target.copy(start.target); camera.lookAt(start.target)
    camera.fov = start.fov; camera.updateProjectionMatrix()
  }
  window.addEventListener('keydown', e => { if (e.code === 'Home' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) reset() })

  // ---- two places to go: into the hall behind the doorway, and the veranda its picture lands on -----
  const standAt = (x, z, y, lookAt) => {                            // put the feet at (x, y, z), facing lookAt, in walk mode
    walk.disable(); params.view = 'walk'; viewCtl.updateDisplay()
    camera.position.set(x, y + params.eyeHeight, z); camera.lookAt(lookAt); controls.target.copy(lookAt)
    walk.enable()
  }
  const goInside = () => standAt(HOUSE.door.x, HOUSE.door.z - 30, slabY(HOUSE.door.x, HOUSE.door.z - 30) + HOUSE.deckRise, new THREE.Vector3(HOUSE.door.x, slabY(HOUSE.door.x, HOUSE.door.z) + HOUSE.deckRise + 2, HOUSE.door.z))
  const goVeranda = () => standAt(HOUSE.veranda.x, HOUSE.veranda.z, slabY(HOUSE.veranda.x, HOUSE.veranda.z) + HOUSE.deckRise, new THREE.Vector3(HOUSE.door.x, slabY(HOUSE.door.x, HOUSE.door.z) + 12, HOUSE.door.z))

  // ---- panel ----------------------------------------------------------------------------------------
  gui.add({ reset }, 'reset').name('reset to the start (Home)')
  viewCtl = gui.add(params, 'view', ['orbit', 'walk']).onChange(setView)
  gui.add(params, 'eyeHeight', 1.0, 2.1, 0.01).name('eye height m').onChange(v => { walk.state.eyeHeight = v })
  gui.add(params, 'solidWalls').name('solid objects').onChange(v => { walk.state.solidWalls = v })
  gui.add(params, 'playing').name('videos playing').onChange(v => media.forEach(m => v ? m.play() : m.pause()))
  if (houseMesh) {
    gui.add({ goInside }, 'goInside').name('go inside the house')
    gui.add({ goVeranda }, 'goVeranda').name('stand on the veranda')
  }
  if (projector) {
    const f = gui.addFolder('projector in the house')
    f.add(projParams, 'on').onChange(v => { projector.visible = v; v ? projector.media.play() : projector.media.pause() })
    f.add({ playPause: () => projector.media.toggle() }, 'playPause').name('play / pause')
    f.add(projParams, 'sound').onChange(v => { projector.media.muted = !v; if (v) projector.media.play() })
    f.add(projParams, 'lightPath').name('light path').onChange(v => { projector.lightPath = v })
    f.add(projParams, 'turn', -60, 60, 1).name('turn °').onChange(aimProjector)
    f.add(projParams, 'tilt', -30, 20, 1).name('tilt ° (+ is up)').onChange(aimProjector)
  }
  if (lampShade) {
    const photoMat = new THREE.MeshStandardMaterial({ map: new THREE.TextureLoader().load(LAMP_SHADE_PHOTO, t => { t.colorSpace = THREE.SRGBColorSpace }), roughness: 0.9 })
    gui.add(params, 'lampPhoto').name('lamp shade: its photo').onChange(v => { lampShade.material = v ? photoMat : lampShadeVideoMaterial })
  }
  gui.add(params, 'sky').name('video sky').onChange(v => { scene.background = v ? skyMedia.texture : new THREE.Color(0x0d0f16) })
  gui.add(params, 'exposure', 0.2, 2, 0.01).onChange(v => { renderer.toneMappingExposure = v })
  const fObj = gui.addFolder('objects'); fObj.close()
  for (const o of objects) { const st = { on: true }; fObj.add(st, 'on').name(o.rec.label).onChange(v => { o.group.visible = v }) }

  hint(`the Family scene, December 2018 · ${Math.round(triangles).toLocaleString()} triangles · drag to orbit, wheel to zoom · in walk: drag to look, W A S D or the wheel to move · "go inside the house" to walk its hall · click any floor, deck or roof to teleport · Home or the reset button brings you back here`)
  window.__family = { walk, teleport, objects, params, projector, projParams, aimProjector, goInside, goVeranda, reset, slabY, houseMesh, hallFloor, floor }
}

export function draw(ctx, dt) {
  walk?.update(dt, { xrPresenting: ctx.xr })
}

export function onSelect(hit, { THREE, scene }) {
  if (!hit) return
  if (hit.face) {                                                    // stand only on things that face up: floors, decks, the roof, not walls
    const n = hit.face.normal.clone().transformDirection(hit.object.matrixWorld)
    if (Math.abs(n.y) > 0.5 && teleport?.onSelect(hit)) return
  }
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 12), new THREE.MeshStandardMaterial({ color: 0xff7a3d, emissive: 0xff7a3d, emissiveIntensity: 0.6 }))
  m.position.copy(hit.point); scene.add(m); markers.push(m)
  if (markers.length > 12) scene.remove(markers.shift())
}
