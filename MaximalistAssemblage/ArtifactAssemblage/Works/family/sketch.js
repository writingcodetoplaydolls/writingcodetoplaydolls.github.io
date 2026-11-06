// The Family scene (K:\Unity\Family, saved 9 December 2018), rebuilt from scenes/family-scene.json.
//
// A surreal giants' landscape, every surface skinned with video: two 24 m figures of Flannery
// standing together playing Quilt2, a third at the origin, a 7.9 m Porta Romana lamp wearing two
// quilt renders, a three-times-size metal oven showing the same animation as the sky, a (once tipped)
// washing machine, a 285 m hawk 220 m up showing a quilt render, a ten-times city house far off,
// and the whole sky an equirectangular video. The viewer starts where the Unity Main Camera was.
//
// Positions and scales are Unity's. Models are decimated GLBs of the original OBJ/3DS files; the
// 2018 videos are cut to 45 s loops. One clip was already missing in Unity (NewFlan); it gets quilt-d.
//
// The city house is a game asset: an outside only, doors painted on, hollow within, and Unity left it
// pitched 4.4° so its floor slab climbs from ground level at the back to 19 m up at the front porch.
// A doorway has been cut into it (tools/blender_cut_doorway.py) where the side veranda meets the main
// block; at load time its window glass and its three door panels are taken out (openUp) and a floor
// is laid over the whole inside at the level of the decks (buildInteriorFloor, a flood fill between
// the walls), so the hollow can be entered by any door, walked on the level and looked out of; and a
// projector hangs inside the hall throwing its picture out through the cut doorway onto the veranda
// deck. Its clip is TraylorAnimation.mp4, the one Family video nothing in the Unity scene used.

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
  'Models/washing machine/washer.obj': '/assets/models/family/washer-parts.glb',   // the OBJ's parts kept apart, so the room around the machine can be dropped
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
// The washing machine file came with the corner of a room around it (a floor, two walls, a ceiling),
// and Unity left it at scale 0.01, a 30 cm thing beside a 10 m oven and 24 m figures. The room parts
// are dropped and the machine is scaled to a scene-sized height.
const DROP_PARTS = { 'washer.obj': /^(floor_|walls_|tavani_)/ }     // tavani: the ceiling, in the modeller's Greek
const FIT_HEIGHT = { 'washer.obj': 10 }                             // metres
const UPRIGHT = ['washer.obj']                                      // Unity had it tipped on its side; its own frame stands it up

// The washer came without textures. Enamel, a dark control panel with a display, glass in the
// door and steel for the drum and trim are made here, by part name, on small canvases.
function canvasTexture(THREE, paint, repeat = 1) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 512
  paint(cv.getContext('2d'))
  const t = new THREE.CanvasTexture(cv)
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat)
  return t
}
function speckle(g, amount) {                                      // grain, so the enamel is not a flat colour
  const img = g.getImageData(0, 0, 512, 512), d = img.data
  for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 255 * amount; d[i] += n; d[i + 1] += n; d[i + 2] += n }
  g.putImageData(img, 0, 0)
}
function dressWasher(THREE, model) {
  const enamel = canvasTexture(THREE, g => { g.fillStyle = '#f0efe9'; g.fillRect(0, 0, 512, 512); speckle(g, 0.07); g.strokeStyle = 'rgba(0,0,0,0.05)'; for (let y = 0; y < 512; y += 3) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke() } }, 2)
  const panel = canvasTexture(THREE, g => {
    g.fillStyle = '#2b2e34'; g.fillRect(0, 0, 512, 512); speckle(g, 0.05)
    g.fillStyle = '#5fd8cf'; g.fillRect(40, 190, 150, 110)                                       // the display
    g.strokeStyle = '#b8bcc2'; g.lineWidth = 6
    for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(260 + i * 65, 245, 22, 0, Math.PI * 2); g.stroke() }   // dials
  })
  const mats = {
    enamel: new THREE.MeshStandardMaterial({ map: enamel, roughness: 0.45, metalness: 0.05 }),
    panel: new THREE.MeshStandardMaterial({ map: panel, roughness: 0.55, metalness: 0.1 }),
    display: new THREE.MeshStandardMaterial({ color: 0x9fe8e2, emissive: 0x3fd0c8, emissiveIntensity: 0.6, roughness: 0.3 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x7f949c, transparent: true, opacity: 0.45, roughness: 0.08, metalness: 0, side: THREE.DoubleSide }),
    steel: new THREE.MeshStandardMaterial({ color: 0xc9cdd1, roughness: 0.3, metalness: 0.9 }),
    drum: new THREE.MeshStandardMaterial({ color: 0x74787d, roughness: 0.4, metalness: 0.85, side: THREE.DoubleSide }),
  }
  const pick = name => /^door_Loft01_2/.test(name) ? 'glass' : /^door_Loft01_3|^handle_/.test(name) ? 'steel' : /^inside_/.test(name) ? 'drum'
    : /^panel_Line01_2/.test(name) ? 'display' : /^panel_/.test(name) ? 'panel' : 'enamel'
  model.traverse(o => { if (o.isMesh) { o.material = mats[pick(o.name)]; o.userData.dressed = true } })
}
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

const params = { view: 'orbit', eyeHeight: 1.6, solidWalls: true, exposure: 0.8, lighting: 1, sky: true, playing: true, lampPhoto: false }
const projParams = { on: true, volume: 0, lightPath: true, turn: 0, tilt: 0 }
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

// The ground. Unity had none; the objects hang in the air at heights 30 m apart. This lays a terrain
// that comes up to meet each object at its base and slopes between them: at any point the height is
// the bases of all the grounded objects averaged, each weighted by the cube of its nearness (distance
// to the object's footprint), so near an object the ground is that object's base, and between two it
// crosses over gradually. The hawk flies and is left out. Walking then rises and falls with the land.
const GROUND = { radius: 600, cell: 5, airborne: ['Hawk woah'] }
const PATH = { width: 14, every: 12, points: [[22, -8], [60, 60], [95, 140], [115, 220], [122, 292], [145, 328], [166, 330]] }   // x, z: from the figures round the main block's west side to the veranda's edge

// Sites along a line, their bases running evenly from the first height to the last, so the terrain
// carries a road; and a ribbon laid on the finished terrain to show it.
function pathAlong(THREE, points, startBase, endBase) {
  const pts = points.map(p => new THREE.Vector2(p[0], p[1]))
  const seg = pts.slice(1).map((p, i) => p.distanceTo(pts[i])), total = seg.reduce((a, b) => a + b, 0)
  const sites = []
  let done = 0
  for (let i = 0; i + 1 < pts.length; i++) {
    for (let s = 0; s < seg[i]; s += PATH.every) {
      const t = (done + s) / total, p = pts[i].clone().lerp(pts[i + 1], s / seg[i])
      sites.push({ label: 'path', base: startBase + (endBase - startBase) * t, cx: p.x, cz: p.y, hx: PATH.width / 2, hz: PATH.width / 2, r: PATH.width / 2 })
    }
    done += seg[i]
  }
  const last = pts[pts.length - 1]
  sites.push({ label: 'path end', base: endBase, cx: last.x, cz: last.y, hx: PATH.width / 2, hz: PATH.width, r: PATH.width / 2 })
  return sites
}
function buildPathRibbon(THREE, points, heightAt) {
  const pts = points.map(p => new THREE.Vector2(p[0], p[1]))
  const pos = [], idx = [], half = PATH.width / 2
  const samples = []
  for (let i = 0; i + 1 < pts.length; i++) {
    const n = Math.ceil(pts[i].distanceTo(pts[i + 1]) / 4)
    for (let k = 0; k < n; k++) samples.push(pts[i].clone().lerp(pts[i + 1], k / n))
  }
  samples.push(pts[pts.length - 1].clone())
  for (let i = 0; i < samples.length; i++) {
    const a = samples[Math.max(0, i - 1)], b = samples[Math.min(samples.length - 1, i + 1)]
    const dir = b.clone().sub(a).normalize(), side = new THREE.Vector2(-dir.y, dir.x).multiplyScalar(half)
    for (const sgn of [-1, 1]) {
      const x = samples[i].x + side.x * sgn, z = samples[i].y + side.y * sgn
      pos.push(x, heightAt(x, z) + 0.06, z)
    }
    if (i > 0) { const j = 2 * i; idx.push(j - 2, j - 1, j, j - 1, j + 1, j) }
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals()
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x9c8a6a, roughness: 1, metalness: 0, side: THREE.DoubleSide }))
  mesh.name = 'path'; mesh.frustumCulled = false
  return mesh
}
function buildTerrain(THREE, objects, extraSites = []) {
  const sites = objects.filter(o => !GROUND.airborne.includes(o.rec.label)).map(o => {
    const b = new THREE.Box3().setFromObject(o.group), c = b.getCenter(new THREE.Vector3()), s = b.getSize(new THREE.Vector3())
    return { label: o.rec.label, base: b.min.y, cx: c.x, cz: c.z, hx: s.x * 0.4, hz: s.z * 0.4, r: Math.hypot(s.x, s.z) / 2 }
  }).concat(extraSites)
  const heightAt = (x, z) => {
    let num = 0, den = 0
    for (const s of sites) {
      const dx = Math.max(0, Math.abs(x - s.cx) - s.hx), dz = Math.max(0, Math.abs(z - s.cz) - s.hz)   // distance to the footprint, 0 on it
      const d = Math.hypot(dx, dz) + 0.05 * s.r + 0.5
      const w = 1 / (d * d * d)
      num += w * s.base; den += w
    }
    return num / den
  }
  const n = Math.round(2 * GROUND.radius / GROUND.cell)
  const geo = new THREE.PlaneGeometry(2 * GROUND.radius, 2 * GROUND.radius, n, n); geo.rotateX(-Math.PI / 2)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) pos.setY(i, heightAt(pos.getX(i), pos.getZ(i)) - 0.02)   // a hair under every base
  geo.computeVertexNormals()
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x2b2a2e, roughness: 1, metalness: 0 }))
  mesh.name = 'floor'
  console.log('ground: ' + sites.map(s => `${s.label} ${s.base.toFixed(1)}`).join(' · '))
  return { mesh, heightAt, sites }
}

// The house's windows are glazed units set in holes in the walls, and its three doors are panels hung
// in frames over open doorways (rays from inside through each meet nothing behind). Take the glass and
// the door panels out, so the inside looks out and the doors can be walked through. The mesh's loose
// parts are found by welding its vertices and joining triangles that share one; in the model's units
// a window unit is 1.0 × 1.75 and 0.06 thick, a door panel 1.2 × 2.2 and 0.05 thick, and the glass is
// a unit's larger triangles facing the way the unit does. The 0.75 × 1.26 box on the wing's west wall
// has wall behind it and is left alone.
function openUp(THREE, mesh) {
  const geo = mesh.geometry, pos = geo.attributes.position, index = geo.index
  if (!index) return
  const nv = pos.count, nt = index.count / 3
  const key = new Map(), weld = new Int32Array(nv)
  for (let i = 0; i < nv; i++) { const k = `${pos.getX(i).toFixed(5)},${pos.getY(i).toFixed(5)},${pos.getZ(i).toFixed(5)}`; if (!key.has(k)) key.set(k, i); weld[i] = key.get(k) }
  const parent = Int32Array.from({ length: nv }, (_, i) => i)
  const find = i => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i] } return i }
  const union = (a, b) => { a = find(a); b = find(b); if (a !== b) parent[a] = b }
  for (let t = 0; t < nt; t++) { const a = weld[index.getX(3 * t)], b = weld[index.getX(3 * t + 1)], c = weld[index.getX(3 * t + 2)]; union(a, b); union(b, c) }
  const parts = new Map()
  for (let t = 0; t < nt; t++) { const r = find(weld[index.getX(3 * t)]); if (!parts.has(r)) parts.set(r, []); parts.get(r).push(t) }
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3(), box = new THREE.Box3(), size = new THREE.Vector3()
  const drop = new Set()
  let windows = 0, doors = 0
  for (const tris of parts.values()) {
    if (tris.length > 60) continue
    box.makeEmpty()
    for (const t of tris) for (let k = 0; k < 3; k++) box.expandByPoint(a.fromBufferAttribute(pos, index.getX(3 * t + k)))
    box.getSize(size)
    const thin = Math.min(size.x, size.y), wide = Math.max(size.x, size.y), facing = size.x < size.y ? 'x' : 'y'
    const isWindow = thin < 0.1 && Math.abs(wide - 1.0) < 0.05 && Math.abs(size.z - 1.75) < 0.05
    const isDoor = thin < 0.1 && Math.abs(wide - 1.2) < 0.05 && Math.abs(size.z - 2.2) < 0.05 && tris.length <= 12
    if (isDoor) { tris.forEach(t => drop.add(t)); doors++; continue }
    if (!isWindow) continue
    for (const t of tris) {
      a.fromBufferAttribute(pos, index.getX(3 * t)); b.fromBufferAttribute(pos, index.getX(3 * t + 1)); c.fromBufferAttribute(pos, index.getX(3 * t + 2))
      n.crossVectors(b.sub(a), c.sub(a))
      const area = n.length() / 2
      if (area < 1e-9) continue
      n.divideScalar(area * 2)
      if (Math.abs(facing === 'x' ? n.x : n.y) > 0.9 && area > 0.05) drop.add(t)
    }
    windows++
  }
  if (!drop.size) return
  const kept = []
  for (let t = 0; t < nt; t++) if (!drop.has(t)) kept.push(index.getX(3 * t), index.getX(3 * t + 1), index.getX(3 * t + 2))
  geo.setIndex(kept)
  geo.computeBoundingBox(); geo.computeBoundingSphere()
  console.log(`house opened up: ${windows} windows unglazed, ${doors} door panels taken out, ${drop.size} of ${nt} triangles dropped`)
}

// The house has no floor at the level of its doorway and decks, only the ground slab 6 m lower, and
// no rooms: it is an outside only. Lay a floor over the whole inside at deck level. On a 20 cm grid
// in the model's own frame (z runs downward there), every triangle is painted into a map: WALL where
// it crosses the heights 0.5 m and 1.2 m above deck level (the walk's own chest and knee probes),
// DECK where it lies within 0.3 m of deck level (the veranda and porch decks, which already exist),
// ROOF where it lies more than 1.5 m above. Inside is then what a flood from a cell behind the
// doorway reaches under a roof without crossing a wall or a deck; widened one cell all round so the
// floor meets the walls and laps onto the decks and door sills (a 15 cm crack at the front door's
// sill once dropped the walker 6 m to the slab). The flood walks out through a doorway only as far as the deck.
function buildInteriorFloor(THREE, mesh) {
  const geo = mesh.geometry, pos = geo.attributes.position, index = geo.index
  const z0 = HOUSE.deckLocalZ, cell = 0.02
  geo.computeBoundingBox()
  const b = geo.boundingBox
  const nx = Math.ceil((b.max.x - b.min.x) / cell) + 3, ny = Math.ceil((b.max.y - b.min.y) / cell) + 3
  const ix = x => Math.floor((x - b.min.x) / cell) + 1, iy = y => Math.floor((y - b.min.y) / cell) + 1
  const WALL = 1, DECK = 2, ROOF = 4, IN = 8
  const map = new Uint8Array(nx * ny)
  const mark = (i, j, flag) => { if (i >= 0 && j >= 0 && i < nx && j < ny) map[j * nx + i] |= flag }
  const segment = (ax, ay, bx, by, flag) => {                      // every cell a segment passes through
    const n = Math.ceil(Math.hypot(bx - ax, by - ay) / (cell / 2)) + 1
    for (let k = 0; k <= n; k++) { const t = k / n; mark(ix(ax + (bx - ax) * t), iy(ay + (by - ay) * t), flag) }
  }
  const filled = (p, q, r, flag) => {                              // every cell whose centre a triangle covers, and its edges
    const i0 = ix(Math.min(p.x, q.x, r.x)), i1 = ix(Math.max(p.x, q.x, r.x)), j0 = iy(Math.min(p.y, q.y, r.y)), j1 = iy(Math.max(p.y, q.y, r.y))
    const d = (q.x - p.x) * (r.y - p.y) - (r.x - p.x) * (q.y - p.y)
    if (Math.abs(d) > 1e-12) {
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const x = b.min.x + (i - 0.5) * cell, y = b.min.y + (j - 0.5) * cell
        const u = ((q.x - p.x) * (y - p.y) - (x - p.x) * (q.y - p.y)) / d, v = ((x - p.x) * (r.y - p.y) - (r.x - p.x) * (y - p.y)) / d
        if (u >= -0.02 && v >= -0.02 && u + v <= 1.02) mark(i, j, flag)
      }
    }
    segment(p.x, p.y, q.x, q.y, flag); segment(q.x, q.y, r.x, r.y, flag); segment(r.x, r.y, p.x, p.y, flag)
  }
  const tri = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]
  const count = index ? index.count : pos.count
  for (let t = 0; t < count; t += 3) {
    for (let k = 0; k < 3; k++) tri[k].fromBufferAttribute(pos, index ? index.getX(t + k) : t + k)
    const [p, q, r] = tri
    if (tri.every(v => Math.abs(v.z - z0) < 0.03)) filled(p, q, r, DECK)
    else if (tri.every(v => v.z < z0 - 0.15)) filled(p, q, r, ROOF)
    for (const zp of [z0 - 0.05, z0 - 0.12]) {                     // where the triangle crosses this height: a segment
      const pts = []
      for (let k = 0; k < 3; k++) {
        const a = tri[k], c = tri[(k + 1) % 3]
        if ((a.z - zp) * (c.z - zp) < 0) { const s = (zp - a.z) / (c.z - a.z); pts.push([a.x + (c.x - a.x) * s, a.y + (c.y - a.y) * s]) }
      }
      if (pts.length === 2) segment(pts[0][0], pts[0][1], pts[1][0], pts[1][1], WALL)
    }
  }
  // the flood, from a cell known to lie inside the hall (or the nearest open one)
  const open = k => (map[k] & ROOF) && !(map[k] & (WALL | DECK))
  let seed = iy(1.0) * nx + ix(0), found = -1
  for (let r = 0; r < 20 && found < 0; r++) for (let dj = -r; dj <= r && found < 0; dj++) for (let di = -r; di <= r; di++) { const k = seed + dj * nx + di; if (k >= 0 && k < map.length && open(k)) { found = k; break } }
  const queue = found >= 0 ? [found] : []
  if (found >= 0) map[found] |= IN
  while (queue.length) {
    const k = queue.pop(), i = k % nx
    for (const n of [k - 1, k + 1, k - nx, k + nx]) {
      if (n < 0 || n >= map.length || (map[n] & IN)) continue
      if ((n === k - 1 && i === 0) || (n === k + 1 && i === nx - 1)) continue
      if (open(n)) { map[n] |= IN; queue.push(n) }
    }
  }
  // one cell wider all round, so the floor runs into the walls and laps onto the decks and sills
  // (2 cm above them) with no crack between; then strips along x
  const grown = new Uint8Array(map)
  for (let k = 0; k < map.length; k++) if (!(map[k] & IN)) {
    const i = k % nx
    if ((i > 0 && (map[k - 1] & IN)) || (i < nx - 1 && (map[k + 1] & IN)) || (k >= nx && (map[k - nx] & IN)) || (k + nx < map.length && (map[k + nx] & IN))) grown[k] |= IN
  }
  const verts = [], idx = [], z = z0 - 0.002
  let quads = 0, cells = 0
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      if (!(grown[j * nx + i] & IN)) continue
      let i1 = i; while (i1 + 1 < nx && (grown[j * nx + i1 + 1] & IN)) i1++
      const x0 = b.min.x + (i - 1) * cell, x1 = b.min.x + i1 * cell, y0 = b.min.y + (j - 1) * cell, y1 = b.min.y + j * cell
      const v = verts.length / 3
      verts.push(x0, y0, z, x1, y0, z, x1, y1, z, x0, y1, z); idx.push(v, v + 1, v + 2, v, v + 2, v + 3)
      quads++; cells += i1 - i + 1; i = i1
    }
  }
  const floorGeo = new THREE.BufferGeometry()
  floorGeo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3)); floorGeo.setIndex(idx); floorGeo.computeVertexNormals()
  ensureUVs(THREE, floorGeo)
  const floor = new THREE.Mesh(floorGeo, new THREE.MeshStandardMaterial({ color: 0x6b5a47, roughness: 0.95, metalness: 0, side: THREE.DoubleSide }))   // a wood-dark floor, not the video
  floor.name = 'interior floor'; floor.frustumCulled = false
  floor.userData.grid = { map, grown, nx, ny, cell, min: [b.min.x, b.min.y], flags: { WALL, DECK, ROOF, IN } }   // for checking the fill from DevTools
  mesh.add(floor)
  console.log(`interior floor: ${quads} strips over ${(cells * cell * cell * 100).toFixed(0)} m², grid ${nx}×${ny} at ${cell * 10} m`)
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
  const hemi = new THREE.HemisphereLight(0xd9e4ff, 0x4a3f3a, 0.9), ambient = new THREE.AmbientLight(0xffffff, 0.35)
  scene.add(sun, hemi, ambient)
  const lamps = []                                                   // the lights inside the house, added once the hall exists

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
    if (DROP_PARTS[rec.label]) { const gone = []; model.traverse(o => { if (o.isMesh && DROP_PARTS[rec.label].test(o.name)) gone.push(o) }); gone.forEach(o => o.removeFromParent()) }
    if (UPRIGHT.includes(rec.label)) group.quaternion.identity()
    if (FIT_HEIGHT[rec.label]) { const h = new THREE.Box3().setFromObject(group).getSize(new THREE.Vector3()).y; if (h > 0) group.scale.multiplyScalar(FIT_HEIGHT[rec.label] / h) }
    if (rec.label === 'washer.obj') dressWasher(THREE, model)
    const vid = videoFor(rec)
    const isLamp = rec.label.startsWith('Porta'), isHouse = rec.label === 'c_h_01'
    model.traverse(o => {
      if (!o.isMesh) return
      if (o.userData.dressed) { o.frustumCulled = false; return }    // already given its own materials
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
  if (houseMesh) openUp(THREE, houseMesh)                             // glass and door panels out, before the floor is fitted and the inside copied
  const hallFloor = houseMesh ? buildInteriorFloor(THREE, houseMesh) : null  // at deck level, 6 m above the slab, a child of the house mesh
  if (houseMesh) {
    // The inside gets its own surface: a copy of the house drawn back-faces only, plaster-coloured,
    // pulled a hair toward the camera so it wins over the video skin from indoors. It is not raycast,
    // so walking, teleporting and the projector still meet the house itself.
    const inside = houseMesh.clone()
    inside.material = new THREE.MeshStandardMaterial({ color: 0xd9cdb6, roughness: 1, metalness: 0, side: THREE.BackSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })
    inside.raycast = () => {}; inside.frustumCulled = false; inside.name = 'house inside'
    houseMesh.parent.add(inside)
    // lamps in the hall and the wing, high up, warm
    for (const [x, z] of [[190, 262], [225, 335]]) {
      const lamp = new THREE.PointLight(0xffe2b8, 900, 160, 2)
      lamp.position.set(x, slabY(x, z) + HOUSE.deckRise + 24, z); scene.add(lamp); lamps.push(lamp)
    }
  }

  // ---- the ground: a terrain that meets every object at its base and slopes between them ----------
  // A way in on foot: a path from the figures' feet to the veranda's west edge, between the posts
  // (the rail there is 1.5 m up, over your head). The terrain carries it as a causeway that drops
  // only 14 m over 350 m, and a sand-coloured ribbon shows where it runs.
  const figures = objects.find(o => /^NewFlan \(/.test(o.rec.label))
  const pathSites = houseMesh && figures ? pathAlong(THREE, PATH.points, new THREE.Box3().setFromObject(figures.group).min.y, slabY(176, 330) + HOUSE.deckRise) : []
  const { mesh: floor, heightAt } = buildTerrain(THREE, objects, pathSites)
  scene.add(selectable(floor))
  const path = pathSites.length ? buildPathRibbon(THREE, PATH.points, heightAt) : null
  if (path) scene.add(selectable(path))
  const feetY = heightAt(0, 0)
  const floors = [floor, path, houseMesh].filter(Boolean)
  teleport = createTeleport({ renderer, camera, rig, controls, floors, markerRadius: 0.6, eyeHeight: () => params.eyeHeight })
  scene.add(teleport.marker)
  walk = createWalkControls({
    camera, domElement: renderer.domElement, controls, floors, eyeHeight: params.eyeHeight,
    obstacles: objects.filter(o => !GROUND.airborne.includes(o.rec.label)).map(o => o.group), solidWalls: params.solidWalls, floorReach: 40,   // the hawk flies: no bumping into its wing
  })
  const setView = v => { params.view = v; v === 'walk' ? walk.enable() : walk.disable() }
  console.log(`ground at the origin y = ${feetY.toFixed(2)}; under the house ${heightAt(HOUSE.door.x, HOUSE.door.z).toFixed(2)}`)

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
  gui.add(params, 'eyeHeight', 0.3, 40, 0.1).name('eye height m').onChange(v => { walk.state.eyeHeight = v; walk.state.speed = 1.8 * v / 1.6 })   // a giant walks a giant's stride
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
    f.add(projParams, 'volume', 0, 1, 0.05).onChange(v => { projector.media.volume = v })   // 0 is silent; the only clip with sound
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
  gui.add(params, 'lighting', 0, 3, 0.05).name('lighting').onChange(v => { hemi.intensity = 0.9 * v; ambient.intensity = 0.35 * v; lamps.forEach(l => { l.intensity = 900 * v }) })
  const fObj = gui.addFolder('objects'); fObj.close()
  for (const o of objects) { const st = { on: true }; fObj.add(st, 'on').name(o.rec.label).onChange(v => { o.group.visible = v }) }

  hint(`the Family scene, December 2018 · ${Math.round(triangles).toLocaleString()} triangles · left drag turns, right drag pans, wheel zooms · W A S D walk (Q E up and down when not walking), the wheel steps too · the sand path runs from the figures to the veranda · "go inside the house" to walk its hall · click any floor, deck or roof to teleport · Home brings you back here`)
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
