// The Unity house scene (K:\Unity\TryTeleportAgain, MainScene) rebuilt from its parts:
//   house        NewHouseGroups.fbx placed as the scene had it, with its Floor / Walls / Ceiling colours
//   sun          DayNightController: one day per minute, sunrise 0.25, sunset 0.75, interior lights at night
//   props        the rock (a 90× boulder out in the yard) and Greg on his table, with the spotlight over him
//   projector    the Cell Division video on the living-room wall, as a screen or as a thrown beam
//   teleport     click or pinch at a floor to go there (Teleporter.cs), elsewhere to leave a marker
// Positions come from scenes/house-scene.json, produced by tools/unity_scene_to_json.py.

import { Sky } from 'three/addons/objects/Sky.js'
import { loadModel, prepareMeshes } from '../../lib/loaders.js'
import { applyTransform, unityPlaneGeometry, unityColor, fbxUnitScale, fetchScene, UNITY_POINT_TO_CANDELA, UNITY_SUN_TO_LUX, IMPORTED_MODEL_SPIN_Y } from '../../lib/unity.js'
import { createDayNight } from '../../lib/daynight.js'
import { createMedia, createScreen, createProjector } from '../../lib/projector.js'
import { createTeleport } from '../../lib/teleport.js'
import { createWalkControls } from '../../lib/walk.js'

const SCENE_JSON = '/assets/scenes/house-scene.json'
// What each device plays. In Unity the wall played anim333hole.mp4 and the BR projector
// anim333holechair.mp4, but those files are gone (only their .meta remain), so they get the
// other clips from the same folder. The DR projector keeps Cell Division, as it had.
const CLIPS = {
  'Plane': '/assets/video/green.mp4',                    // the VideoPlayer on the living-room wall
  'VideoProjector DR': '/assets/video/cell-division.mp4',
  'VideoProjector BR': '/assets/video/sunsets.mp4',
}
const ASSETS = {                                   // Unity asset path → file in public/
  'Models/NewHouseGroups.fbx': '/assets/models/house/NewHouseGroups.fbx',
  'Models/rock/model_mesh.obj': '/assets/models/props/rock.glb',
  'Models/gregontable/model_mesh.obj': '/assets/models/props/gregontable.glb',
}
const MATERIALS = {                                // Unity .mat colours (gamma space) from the project
  'Materials/Floor.mat': [0.38679248, 0.34192756, 0.10034712],
  'Materials/Walls.mat': [0.8915094, 1.0, 0.9905601],
  'Materials/Ceiling.mat': [0.9622642, 0.9622642, 0.9622642],
}

const params = { view: 'walk', eyeHeight: 1.6, solidWalls: true, time: 0.35, dayLength: 60, paused: false, exposure: 0.45, greg: true, gregSpot: false, rock: true, edges: false }
let T, scene_, renderer_, camera_, controls_, hint_
let sky, sun, hemi, dayNight, teleport, walk, houseCenter, markers = [], edgeLines = []
const devices = []                                  // the wall screen and the projectors
let gregObj, rockObj, gregSpot
let lastClock = ''

export async function setup(ctx) {
  const { THREE, scene, renderer, camera, controls, selectable, hint, gui, rig } = ctx
  T = THREE; scene_ = scene; renderer_ = renderer; camera_ = camera; controls_ = controls; hint_ = hint

  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = params.exposure
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  // Depth precision: the sky shader pins itself to the far plane whatever its size, so the far
  // plane only needs to reach the ground disc. A 5 km far plane made nearby surfaces flicker.
  camera.near = 0.1; camera.far = 450; camera.updateProjectionMatrix()

  // ---- sky, sun, fill, ground --------------------------------------------
  sky = new Sky(); sky.scale.setScalar(2000); sky.frustumCulled = false
  Object.assign(sky.material.uniforms.turbidity, { value: 3.5 }); sky.material.uniforms.rayleigh.value = 2.2
  sky.material.uniforms.mieCoefficient.value = 0.004; sky.material.uniforms.mieDirectionalG.value = 0.8
  scene.add(sky)
  const envScene = new THREE.Scene(); envScene.add(sky.clone())
  const pmrem = new THREE.PMREMGenerator(renderer)
  let envOld = null
  const refreshEnvironment = () => {
    const rt = pmrem.fromScene(envScene)
    scene.environment = rt.texture
    envOld?.dispose(); envOld = rt                 // free the previous one only after the swap
  }
  scene.environmentIntensity = 0.25            // the sky lights interiors as if they were outdoors; keep it a fill, not a flood

  sun = new THREE.DirectionalLight(0xfff2e0, 2.5)
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004
  Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 1, far: 200 })
  scene.add(sun, sun.target)
  hemi = new THREE.HemisphereLight(0xbfd4ff, 0x5a5040, 0.35)
  scene.add(hemi)

  const ground = new THREE.Mesh(new THREE.CircleGeometry(400, 96), new THREE.MeshStandardMaterial({ color: 0x6b6f5e, roughness: 1 }))
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; ground.name = 'Ground'
  scene.add(selectable(ground))
  scene.fog = new THREE.Fog(0xc9d6e6, 60, 260)

  hint('loading the scene…')
  const data = await fetchScene(SCENE_JSON)
  const prefab = name => data.prefabs.find(p => p.name === name)

  // ---- house -------------------------------------------------------------
  const houseRec = prefab('NewHouseGroups')
  const { object: houseFbx } = await loadModel(ASSETS[houseRec.source])
  const house = new THREE.Group(); house.name = 'house'
  house.add(houseFbx)
  applyTransform(house, houseRec)
  houseFbx.scale.setScalar(fbxUnitScale(houseFbx))                 // file units → metres; the prefab's 2.75 is on the group
  houseFbx.rotation.y = IMPORTED_MODEL_SPIN_Y                      // see unity.js: Unity mirrored X on import, we mirror Z
  const floors = []
  // SketchUp exported every face twice, front and back, in the same plane, and the ceiling exists
  // in two meshes (the painted Mesh3 and an unnamed duplicate in Mesh8). So: single-sided
  // materials, since the back copies are already there, and the painted surfaces pulled a hair
  // toward the camera so they win over the duplicates instead of flickering against them.
  houseFbx.traverse(o => {
    if (!o.isMesh) return
    const override = houseRec.materialOverrides[o.name]
    if (override && MATERIALS[override]) {
      o.material = new THREE.MeshStandardMaterial({
        color: unityColor(MATERIALS[override]), roughness: 0.9, side: THREE.FrontSide,
        polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
      })
      if (override.includes('Floor')) floors.push(o)
    } else {
      const mats = Array.isArray(o.material) ? o.material : [o.material]
      const conv = mats.map(m => new THREE.MeshStandardMaterial({ color: m.color ?? 0xffffff, roughness: 0.9, side: THREE.FrontSide }))
      o.material = Array.isArray(o.material) ? conv : conv[0]
    }
    const lines = new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry, 25), new THREE.LineBasicMaterial({ color: 0x1a1a1a, transparent: true, opacity: 0.4 }))
    lines.visible = params.edges; lines.raycast = () => {}; o.add(lines); edgeLines.push(lines)   // lines must never catch a click
  })
  const triangles = prepareMeshes(houseFbx)
  scene.add(selectable(house))
  const houseBox = new THREE.Box3().setFromObject(house)
  houseCenter = houseBox.getCenter(new THREE.Vector3())
  sun.target.position.copy(houseCenter)

  // ---- interior lights: the point lights that sit inside this house ------
  const inside = houseBox.clone().expandByScalar(1.5)
  const interior = []
  for (const l of data.lights) {
    const p = new THREE.Vector3().fromArray(l.position)
    if (l.type !== 'point' || !l.active || !inside.containsPoint(p)) continue
    const light = new THREE.PointLight(unityColor(l.color), l.intensity * UNITY_POINT_TO_CANDELA, l.range * 1.5, 2)
    light.position.copy(p); light.name = l.name
    scene.add(light); interior.push(light)
  }
  // the spotlight the scene had over Greg (switched off there; a toggle here)
  const spotRec = data.lights.find(l => l.type === 'spot')
  if (spotRec) {
    gregSpot = new THREE.SpotLight(0xffffff, 60, spotRec.range * 3, THREE.MathUtils.degToRad(spotRec.spotAngle / 2), 0.3, 1.5)
    gregSpot.position.fromArray(spotRec.position)
    gregSpot.target.position.copy(gregSpot.position).add(new THREE.Vector3().fromArray(spotRec.direction))
    gregSpot.castShadow = true; gregSpot.visible = params.gregSpot
    scene.add(gregSpot, gregSpot.target)
  }

  // ---- props -------------------------------------------------------------
  const placeProp = async (rec, name) => {
    if (!rec) return null
    const { object } = await loadModel(ASSETS[rec.source])
    const group = new THREE.Group(); group.name = name
    const inner = new THREE.Group(); inner.add(object); group.add(inner)   // group: prefab root · inner: the mesh node Unity moved · object: the file
    applyTransform(group, rec)
    const child = rec.childTransforms && Object.values(rec.childTransforms)[0]
    if (child) applyTransform(inner, child)
    object.rotation.y = IMPORTED_MODEL_SPIN_Y
    prepareMeshes(object)
    scene.add(selectable(group))
    return group
  }
  rockObj = await placeProp(prefab('rock'), 'rock')
  gregObj = await placeProp(prefab('greg'), 'greg')
  if (gregObj) gregObj.visible = params.greg
  if (rockObj) rockObj.visible = params.rock

  // ---- the video on the wall (Unity: VideoPlayer rendering into a Plane's material) --------
  const plane = data.videoPlayers[0]
  const screen = createScreen({ scene, media: createMedia(CLIPS[plane.name]), geometry: unityPlaneGeometry(), transform: plane })
  devices.push({ name: 'wall screen', api: screen, on: plane.active })

  // ---- the ProjectorSimulator projectors, with their own throw ratio, aspect and clip ---------
  const surfaces = [house, ground]
  for (const rec of data.prefabs.filter(p => /VideoProjector/.test(p.name ?? ''))) {
    const s = rec.settings
    const proj = createProjector({
      scene, media: createMedia(CLIPS[rec.name] ?? CLIPS['VideoProjector DR']),
      position: rec.position, quaternion: rec.quaternion,
      throwRatio: +(s.throwRatio ?? 1), aspect: +(s.aspectRatio ?? 1.6), brightness: +(s.brightness ?? 1), range: +(s.range ?? 20),
      surfaces, showLightPath: s.showLightPath !== '0', lightPathExtra: +(s.lightPathRange ?? 0), name: rec.name,
    })
    const info = proj.aim()
    proj.visible = rec.active
    console.log(`${rec.name}: throws a ${info.width.toFixed(2)} m image at ${info.distance.toFixed(2)} m onto ${info.hit ?? 'nothing'}`)
    devices.push({ name: rec.name.replace('VideoProjector ', 'projector '), api: proj, on: rec.active })
  }

  // ---- teleport, walking, sun cycle ------------------------------------------
  teleport = createTeleport({ renderer, camera, rig, controls, floors: [ground, ...floors] })
  scene.add(teleport.marker)
  walk = createWalkControls({
    camera, domElement: renderer.domElement, controls, floors: [ground, ...floors], eyeHeight: params.eyeHeight,
    obstacles: [house, rockObj, gregObj].filter(Boolean), solidWalls: params.solidWalls,
  })
  const setView = v => { params.view = v; v === 'walk' ? walk.enable() : walk.disable() }
  dayNight = createDayNight({
    sun, sky, hemisphere: hemi, interiorLights: interior,
    secondsInFullDay: params.dayLength, time: params.time, azimuthDeg: 170,
    sunIntensity: UNITY_SUN_TO_LUX * 0.83, hemisphereIntensity: 0.35, target: houseCenter,
  })
  dayNight.update(0); refreshEnvironment()

  // ---- start outside the front at eye level, looking at the house ------------
  const start = { position: new THREE.Vector3(houseCenter.x + 6, params.eyeHeight, houseBox.max.z + 9), target: houseCenter.clone().setY(params.eyeHeight), view: params.view }
  let viewCtl = null
  const reset = () => {                                               // the beginning, for anyone who gets lost
    walk.disable(); camera.position.copy(start.position); controls.target.copy(start.target); camera.lookAt(start.target)
    params.view = start.view; viewCtl?.updateDisplay(); setView(start.view)
  }
  reset()
  window.addEventListener('keydown', e => { if (e.code === 'Home' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) reset() })
  const goInside = () => teleport.onSelect({ object: floors[0] ?? ground, point: new THREE.Vector3(4.2, 0.03, -2.2) })

  // ---- panel ---------------------------------------------------------------
  gui.add({ reset }, 'reset').name('reset to the start (Home)')
  viewCtl = gui.add(params, 'view', ['walk', 'orbit']).name('view').onChange(setView)
  gui.add(params, 'eyeHeight', 1.0, 2.1, 0.01).name('eye height m').onChange(v => { walk.state.eyeHeight = v })
  gui.add(params, 'solidWalls').name('solid walls').onChange(v => { walk.state.solidWalls = v })
  const fSun = gui.addFolder('sun')
  fSun.add(params, 'time', 0, 1, 0.001).name('time of day').listen().onChange(v => { dayNight.time = v; refreshEnvironment() })
  fSun.add(params, 'dayLength', 10, 600, 1).name('seconds per day').onChange(v => { dayNight.state.secondsInFullDay = v })
  fSun.add(params, 'paused').onChange(v => { dayNight.state.paused = v })
  for (const dev of devices) {
    const f = gui.addFolder(dev.name); f.close()
    const st = { on: dev.on, sound: false, lightPath: dev.api.lightPath ?? false }
    dev.api.visible = dev.on
    if (!dev.on) dev.api.media.pause()                                  // a hidden projector should not keep decoding video
    f.add(st, 'on').onChange(v => { dev.api.visible = v; v ? dev.api.media.play() : dev.api.media.pause() })
    f.add({ playPause: () => dev.api.media.toggle() }, 'playPause').name('play / pause')
    f.add(st, 'sound').onChange(v => { dev.api.media.muted = !v; if (v) dev.api.media.play() })
    if ('lightPath' in dev.api && dev.api.spot) f.add(st, 'lightPath').name('light path').onChange(v => { dev.api.lightPath = v })
  }
  const fProps = gui.addFolder('props')
  fProps.add(params, 'greg').name('Greg on his table').onChange(v => { if (gregObj) gregObj.visible = v })
  fProps.add(params, 'gregSpot').name('spotlight over Greg').onChange(v => { if (gregSpot) gregSpot.visible = v })
  fProps.add(params, 'rock').name('the rock').onChange(v => { if (rockObj) rockObj.visible = v })
  gui.add(params, 'edges').name('SketchUp edges').onChange(v => edgeLines.forEach(l => { l.visible = v }))
  gui.add(params, 'exposure', 0.2, 1.5, 0.01).onChange(v => { renderer.toneMappingExposure = v })
  gui.add({ goInside }, 'goInside').name('go inside')

  hint(`${dayNight.clock()} · ${Math.round(triangles).toLocaleString()} triangles · drag to look · W A S D or the wheel to walk · click a floor to teleport · Home resets`)
  window.__protoAssemblage = { walk, teleport, dayNight, devices, params, reset }   // for poking from DevTools
  // Re-bake the sky environment as the sun moves: often enough that each step is invisible,
  // and only while there is daylight to change.
  let envTimer = 0, envDay = dayNight.daylight
  draw.tick = dt => {
    envTimer += dt
    const d = dayNight.daylight
    if (envTimer > 0.75 && !params.paused && (d > 0 || envDay > 0)) { envTimer = 0; envDay = d; refreshEnvironment() }
  }
}

export function draw(ctx, dt) {
  if (!dayNight) return
  walk.update(dt, { xrPresenting: ctx.xr })
  const d = dayNight.update(dt)
  params.time = dayNight.time
  draw.tick?.(dt)
  scene_.fog.color.setHex(0x0b0d14).lerp(new T.Color(0xc9d6e6), d)
  const clock = dayNight.clock()
  if (clock !== lastClock) {
    lastClock = clock
    hint_(params.view === 'walk'
      ? `${clock} · drag to look · W A S D to walk, Shift to hurry · click a floor to teleport`
      : `${clock} · drag to orbit, wheel to zoom · click a floor to teleport, anything else to mark it`)
  }
}

export function onSelect(hit, { THREE, scene }) {
  if (!hit) return
  if (teleport.onSelect(hit)) return
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), new THREE.MeshStandardMaterial({ color: 0xff7a3d, emissive: 0xff7a3d, emissiveIntensity: 0.6 }))
  m.position.copy(hit.point); scene.add(m); markers.push(m)
  if (markers.length > 12) scene.remove(markers.shift())
}
