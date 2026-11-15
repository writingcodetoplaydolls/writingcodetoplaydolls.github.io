// Model viewer. Loads one OBJ, FBX, GLB or glTF, frames it, and gives you wireframe,
// flat shading and colour toggles so you can inspect a mesh before using it.
//
//   ?sketch=viewer&model=./models/pregnant.fbx
//
// In dev you can also open files that are not in the project, from the folders listed
// under server.fs.allow in vite.config.js, through Vite's /@fs/ prefix:
//
//   ?sketch=viewer&model=/@fs/C:/Users/Amy/Downloads/PregnantRetopo.obj

import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const params = { original: false, wireframe: false, flat: false, colour: '#b9bcc4', spin: false }
let material
const originals = new Map()      // mesh → the material(s) it arrived with

async function load(url) {
  const ext = url.split('?')[0].split('.').pop().toLowerCase()
  const loader = ext === 'obj' ? new OBJLoader() : ext === 'fbx' ? new FBXLoader() : new GLTFLoader()
  const result = await loader.loadAsync(url)
  return result.scene ?? result
}

export async function setup({ THREE, scene, hint, camera, controls, gui }) {
  scene.background = new THREE.Color(0x181a20)
  scene.add(new THREE.HemisphereLight(0xffffff, 0x334455, 1.0))
  const key = new THREE.DirectionalLight(0xffffff, 1.6)
  key.position.set(3, 5, 2)
  scene.add(key)
  const fill = new THREE.DirectionalLight(0xffffff, 0.5)
  fill.position.set(-3, 2, -2)
  scene.add(fill)
  scene.add(new THREE.GridHelper(8, 16, 0x444a55, 0x30343d))

  const url = new URLSearchParams(location.search).get('model')
  if (!url) { hint('add &model=<path> to the URL, for example &model=./models/pregnant.fbx'); return }

  hint(`loading ${url}…`)
  let model
  try { model = await load(url) }
  catch (err) { hint(`could not load ${url}: ${err.message}`); console.warn(err); return }

  // One neutral material for everything so the shape reads clearly.
  material = new THREE.MeshStandardMaterial({ color: params.colour, roughness: 0.75, metalness: 0, side: THREE.DoubleSide })
  let meshes = 0, triangles = 0
  model.traverse(o => {
    if (!o.isMesh) return
    meshes++
    triangles += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3
    originals.set(o, o.material)
    o.material = material
    o.frustumCulled = false
  })
  scene.add(model)

  // Frame it. Scale centimetre files to metres first.
  let box = new THREE.Box3().setFromObject(model)
  let size = box.getSize(new THREE.Vector3())
  if (size.y > 10) { model.scale.setScalar(0.01); box = new THREE.Box3().setFromObject(model); size = box.getSize(new THREE.Vector3()) }
  const center = box.getCenter(new THREE.Vector3())
  controls.target.copy(center)
  camera.position.set(center.x, center.y + size.y * 0.1, center.z + Math.max(size.x, size.y, size.z) * 1.6)

  hint(`${url.split('/').pop()} · ${meshes} mesh${meshes === 1 ? '' : 'es'} · ${Math.round(triangles).toLocaleString()} triangles · ${size.x.toFixed(2)} × ${size.y.toFixed(2)} × ${size.z.toFixed(2)} m`)

  gui.add(params, 'original').name('own materials').onChange(v => originals.forEach((m, mesh) => { mesh.material = v ? m : material }))
  gui.add(params, 'wireframe').onChange(v => { material.wireframe = v })
  gui.add(params, 'flat').onChange(v => { material.flatShading = v; material.needsUpdate = true })
  gui.addColor(params, 'colour').onChange(v => material.color.set(v))
  gui.add(params, 'spin').onChange(v => { controls.autoRotate = v })
}

export function draw() {}
