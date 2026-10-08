// Helpers for scenes described by tools/unity_scene_to_json.py. The JSON is already in
// Three's frame (x, y, -z and the matching quaternion), so these only apply values and
// reproduce a few Unity conventions.

import * as THREE from 'three'

// Apply a {position, quaternion, scale} record to any Object3D.
export function applyTransform(obj, t) {
  if (t.position) obj.position.fromArray(t.position)
  if (t.quaternion) obj.quaternion.fromArray(t.quaternion)
  if (t.scale) obj.scale.fromArray(t.scale)
  return obj
}

// Unity's built-in Plane is 10 x 10 units in XZ, facing +Y. Three's PlaneGeometry is in XY.
export function unityPlaneGeometry(width = 10, height = 10) {
  return new THREE.PlaneGeometry(width, height).rotateX(-Math.PI / 2)
}

// Unity material colours are stored in gamma space.
export function unityColor([r, g, b]) {
  return new THREE.Color().setRGB(r, g, b, THREE.SRGBColorSpace)
}

// Unity turns a right-handed model file into its left-handed world by mirroring X. The scene JSON
// turns Unity's world into Three's right-handed one by mirroring Z. Two mirrors on different axes
// add up to a half-turn about Y, so a model file loaded straight into Three has to be rotated by
// this much inside its Unity placement for the scene's positions to land on it.
export const IMPORTED_MODEL_SPIN_Y = Math.PI

// Unity reads the FBX's own unit (centimetres, inches…) when "Use File Scale" is on. Three's
// FBXLoader leaves the file units alone but records the factor. This returns metres per file unit.
export function fbxUnitScale(fbxObject) {
  const f = fbxObject.userData?.unitScaleFactor
  return f ? f / 100 : 0.01
}

// Rough translation of Unity light intensities into Three's physically based units.
export const UNITY_POINT_TO_CANDELA = 25      // Unity point intensity 1 ≈ a 25 cd bulb, with decay 2
export const UNITY_SUN_TO_LUX = 3.0            // Unity directional intensity 1 → DirectionalLight 3 under ACES at exposure 0.45

export async function fetchScene(url) {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`${url}: ${r.status}`)
  return r.json()
}
