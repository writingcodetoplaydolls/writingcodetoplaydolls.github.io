// A house under an open sky: a physically based sky shader (no textures, works offline), a sun
// that casts shadows, a ground plane, and the sky baked into an environment map that lights the
// model. The panel picks the model and the time of day. Click or tap the model to leave a marker.
//
// Models live in public/models/. The SketchUp house files are in inches and have no material
// file, so they get a palette by material name below. The treehouse is a textured scan in
// arbitrary units, so it is fitted to a height instead.

import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js'
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'
import { Sky } from 'three/addons/objects/Sky.js'

// The SketchUp house originals live in K:\Unity\House\Assets\Scenes (House.skp) and
// K:\Unity\New Unity Project\Assets\Models. The FBX exports carry SketchUp's materials
// (red metal roof, carpet floor, white walls, the "Marc" scale figure); the OBJ exports lost
// theirs because the .mtl files were never written. All are in inches.
const MODELS = {
  'house':          { file: '/assets/models/house/House_edit2.fbx',    unit: 0.0254, edges: true },
  'house (groups)': { file: '/assets/models/house/NewHouseGroups.fbx', unit: 0.0254, edges: true },   // later rebuild, white only
  'house (obj)':    { file: '/assets/models/HouseBlender.obj',         unit: 0.0254, edges: true },   // no materials
  'treehouse':      { file: '/assets/models/treehouse/treehouse.obj', mtl: '/assets/models/treehouse/treehouse.mtl', height: 2.0 },
}

// Colours for materials that arrive plain white with only a name. SketchUp's defaults are
// FrontColor/BackColor; the Marc_* ones are its scale figure.
const PALETTE = {
  FrontColor: 0xe9e3d6, BackColor: 0xd6d0c3,
  Marc_Skin: 0xd8a98c, Marc_Wrist: 0xd8a98c, Marc_Hair: 0x3a2a1f,
  Marc_Shirt: 0x4b6fa6, Marc_Shirt2: 0x3d5b8c, Marc_Pants: 0x363a40,
  Marc_Shoes: 0x202020, Marc_Shoes2: 0x202020, Marc_Shoes3: 0x202020, Marc_Shoes4: 0x202020,
}

const params = { model: 'house', size: 1.0, elevation: 32, azimuth: 150, exposure: 0.45, edges: true, wireframe: false }

let T, scene_, renderer_, camera_, controls_, hint_, selectable_
let model, edgeLines = [], sky, sunLight, pmrem, envScene, markers = []

function placeSun() {
  const phi = T.MathUtils.degToRad(90 - params.elevation)
  const theta = T.MathUtils.degToRad(params.azimuth)
  const dir = new T.Vector3().setFromSphericalCoords(1, phi, theta)
  sky.material.uniforms.sunPosition.value.copy(dir)
  sunLight.position.copy(dir).multiplyScalar(60)
  renderer_.toneMappingExposure = params.exposure
  const rt = pmrem.fromScene(envScene)             // the sky is also the environment light
  if (scene_.environment) scene_.environment.dispose()
  scene_.environment = rt.texture
}

function fitModel() {
  if (!model) return
  const spec = MODELS[params.model]
  model.scale.setScalar(1)
  let box = new T.Box3().setFromObject(model)
  let size = box.getSize(new T.Vector3())
  const s = (spec.unit ?? (spec.height / size.y)) * params.size
  model.scale.setScalar(s)
  box = new T.Box3().setFromObject(model); size = box.getSize(new T.Vector3())
  const center = box.getCenter(new T.Vector3())
  model.position.x -= center.x; model.position.z -= center.z; model.position.y -= box.min.y   // feet on the ground, centred
  // shadow frustum and fog sized to the model
  const half = Math.max(size.x, size.z) * 0.6 + 2
  Object.assign(sunLight.shadow.camera, { left: -half, right: half, top: half, bottom: -half, near: 1, far: 200 })
  sunLight.shadow.camera.updateProjectionMatrix()
  scene_.fog.near = Math.max(size.x, size.z) * 2.5; scene_.fog.far = scene_.fog.near * 4
  return size
}

async function loadModel(name) {
  const spec = MODELS[name]
  if (model) { scene_.remove(model); edgeLines.forEach(l => l.parent?.remove(l)); edgeLines = []; model = null }
  hint_(`loading ${name}…`)
  let obj
  try {
    if (/\.fbx$/i.test(spec.file)) {
      obj = await new FBXLoader().loadAsync(spec.file)
    } else {
      const loader = new OBJLoader()
      if (spec.mtl) {
        const dir = spec.mtl.slice(0, spec.mtl.lastIndexOf('/') + 1)
        const materials = await new MTLLoader().setPath(dir).loadAsync(spec.mtl.slice(dir.length))
        materials.preload(); loader.setMaterials(materials)
      }
      obj = await loader.loadAsync(spec.file)
    }
  } catch (err) { hint_(`could not load ${spec.file}: ${err.message}`); console.warn(err); return }

  let triangles = 0
  obj.traverse(o => {
    if (o.isLineSegments) { o.visible = false; return }                  // stray OBJ 'l' records
    if (!o.isMesh) return
    triangles += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3
    const mats = Array.isArray(o.material) ? o.material : [o.material]
    const replaced = mats.map(m => {
      const map = m.map ?? null
      if (map) map.colorSpace = T.SRGBColorSpace
      // keep a colour the file supplied; fall back to the palette for plain-white named materials
      const own = m.color && m.color.getHex() !== 0xffffff
      const color = map ? 0xffffff : own ? m.color.getHex() : (PALETTE[m.name] ?? 0xdcdcdc)
      // SketchUp exports already carry a back copy of every face, so those render single-sided; scans do not
      return new T.MeshStandardMaterial({ map, color, roughness: 0.9, metalness: 0, side: spec.edges ? T.FrontSide : T.DoubleSide })
    })
    o.material = Array.isArray(o.material) ? replaced : replaced[0]
    o.castShadow = o.receiveShadow = true
    if (spec.edges) {
      const lines = new T.LineSegments(new T.EdgesGeometry(o.geometry, 25), new T.LineBasicMaterial({ color: 0x1a1a1a, transparent: true, opacity: 0.45 }))
      lines.visible = params.edges; lines.raycast = () => {}; o.add(lines); edgeLines.push(lines)
    }
  })
  model = obj
  scene_.add(selectable_(model))
  const size = fitModel()
  controls_.target.set(0, size.y * 0.4, 0)
  const d = Math.max(size.x, size.y, size.z)
  camera_.position.set(d * 0.9, Math.max(size.y * 0.9, d * 0.35), d * 1.1)
  hint_(`${name} · ${Math.round(triangles).toLocaleString()} triangles · ${size.x.toFixed(1)} × ${size.y.toFixed(1)} × ${size.z.toFixed(1)} m · drag to look · click to leave a marker`)
}

export async function setup({ THREE, scene, renderer, camera, controls, selectable, hint, gui }) {
  T = THREE; scene_ = scene; renderer_ = renderer; camera_ = camera; controls_ = controls; hint_ = hint; selectable_ = selectable

  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = params.exposure
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  camera.near = 0.1; camera.far = 450; camera.updateProjectionMatrix()   // the sky pins itself to the far plane, so this only needs to reach the ground

  sky = new Sky(); sky.scale.setScalar(2000); sky.frustumCulled = false
  const u = sky.material.uniforms
  u.turbidity.value = 3.5; u.rayleigh.value = 2.2; u.mieCoefficient.value = 0.004; u.mieDirectionalG.value = 0.8
  scene.add(sky)
  envScene = new THREE.Scene(); envScene.add(sky.clone())       // clone shares the shader, so same sun
  pmrem = new THREE.PMREMGenerator(renderer)

  sunLight = new THREE.DirectionalLight(0xfff2e0, 2.0)
  sunLight.castShadow = true
  sunLight.shadow.mapSize.set(2048, 2048)
  sunLight.shadow.bias = -0.0004
  scene.add(sunLight, sunLight.target)
  scene.add(new THREE.HemisphereLight(0xbfd4ff, 0x5a5040, 0.35))

  const ground = new THREE.Mesh(new THREE.CircleGeometry(150, 96), new THREE.MeshStandardMaterial({ color: 0x55634a, roughness: 1, metalness: 0 }))
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true
  scene.add(ground)
  scene.fog = new THREE.Fog(0xc9d6e6, 60, 240)

  await loadModel(params.model)
  placeSun()

  gui.add(params, 'model', Object.keys(MODELS)).onChange(loadModel)
  gui.add(params, 'size', 0.1, 3, 0.05).name('size ×').onChange(fitModel)
  gui.add(params, 'elevation', 2, 90, 1).name('sun elevation').onChange(placeSun)
  gui.add(params, 'azimuth', 0, 360, 1).name('sun azimuth').onChange(placeSun)
  gui.add(params, 'exposure', 0.2, 1.5, 0.01).onChange(placeSun)
  gui.add(params, 'edges').onChange(v => edgeLines.forEach(l => { l.visible = v }))
  gui.add(params, 'wireframe').onChange(v => model?.traverse(o => { if (o.isMesh) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { m.wireframe = v }) }))
}

export function draw() {}

export function onSelect(hit, { THREE, scene }) {
  if (!hit || !model) return
  const r = 0.01 * Math.max(...new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3()).toArray())
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), new THREE.MeshStandardMaterial({ color: 0xff7a3d, emissive: 0xff7a3d, emissiveIntensity: 0.6 }))
  m.position.copy(hit.point)
  scene.add(m); markers.push(m)
  if (markers.length > 12) scene.remove(markers.shift())
}
