// One call to load a model by file extension: .glb/.gltf, .fbx, .obj (with an optional .mtl).
// Returns { object, animations }. Unity-style component modules build on this.

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js'

export async function loadModel(url, { mtl } = {}) {
  const ext = url.split('?')[0].split('.').pop().toLowerCase()
  if (ext === 'glb' || ext === 'gltf') {
    const r = await new GLTFLoader().loadAsync(url)
    return { object: r.scene, animations: r.animations ?? [] }
  }
  if (ext === 'fbx') {
    const r = await new FBXLoader().loadAsync(url)
    return { object: r, animations: r.animations ?? [] }
  }
  const loader = new OBJLoader()
  if (mtl) {
    const dir = mtl.slice(0, mtl.lastIndexOf('/') + 1)
    const materials = await new MTLLoader().setPath(dir).loadAsync(mtl.slice(dir.length))
    materials.preload(); loader.setMaterials(materials)
  }
  const r = await loader.loadAsync(url)
  return { object: r, animations: [] }
}

// Count triangles and make every mesh cast and receive shadows.
export function prepareMeshes(object, { shadows = true } = {}) {
  let triangles = 0
  object.traverse(o => {
    if (!o.isMesh) return
    triangles += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3
    if (shadows) o.castShadow = o.receiveShadow = true
  })
  return triangles
}
