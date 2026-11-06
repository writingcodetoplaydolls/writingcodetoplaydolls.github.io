// Bouquet: the hits for each search term, and for each narrower term under it, read from a CSV.
// Every single hit is a firefly, a point blinking to its own rhythm. All the hits of a term gather
// into a sphere of fireflies, sized so they fill it evenly (the radius grows with the cube root of
// the hits), and the spheres float together, bobbing and bouncing off each other like balloons. A
// term that narrows another is a smaller sphere held against its parent. The whole scene floats in
// the side of an old glass soda bottle: pale blue-green glass behind everything, white boxes for
// the text and controls, navy text.
//
// The states, from a states file (one row per term, one number column per state):
//   all hits              every result returned under a keyword term
//   distinct hits         the same with repeats of one work within a term removed
//   overlapping hits      the term's distinct works also returned under another keyword term; lines
//                         join the spheres that share works, heavier for more
//   forward citations     the two citing-works sweeps (Barad, Shlain), a different instrument; the
//                         works that cite both drawn as a tie between the two spheres
//   texts on disk         the term's works actually held as files under OneDrive\UNM
//   used in the comps     the term's works whose title is in the reference list of the comprehensive
//                         exam (April 22, 2026), out of the texts held
//   (snowball)            in those last two states, a sphere of its own for the texts held or cited that
//                         no search returned: the row with kind "snowball" in the states file
// Any CSV with a term column and a number column still works as a single state.
//   ?sketch=bouquet                                      the sample file
//   ?sketch=bouquet&csv=<url>&overlaps=<url>&works=<url> another states file, its term pairs, its shared works
//
// The pieces, each on its own:
//   lib/csv.js        reading the file, guessing the columns, drop and file picker      (section 1)
//   lib/terms.js      terms and their narrowings as a tree                               (section 2)
//   lib/balloons.js   the floating, bouncing bodies: lift, ceiling, walls, tethers      (section 3)
//   lib/fireflies.js  one point per hit, filling each body's sphere, blinking, visiting  (section 4)
//   lib/labels.js     a sprite label per sphere                                          (section 5)
//   lib/floorcurve.js the floor as a spiral, Hilbert, triangle or honeycomb line        (section 7)
//   lib/bottle.js     the bottle-glass background                                        (section 8)
//   this file         the states, hits to radius and colour, the ties, picking, hover, click, the panel, the look

import { loadCsv, parseCsv, guessColumns, splitNotes, acceptCsvFiles } from '../../lib/csv.js'
import { buildTermTree } from '../../lib/terms.js'
import { createBalloons } from '../../lib/balloons.js'
import { createFireflies } from '../../lib/fireflies.js'
import { makeLabel } from '../../lib/labels.js'
import { createFloorCurve } from '../../lib/floorcurve.js'
import { createBottle } from '../../lib/bottle.js'

// ---- 1. DATA: the states file and the overlaps file ---------------------------------------------
const DEFAULT_CSV = '/assets/data/bouquet-sample.csv', DEFAULT_OVERLAPS = '/assets/data/bouquet-sample-overlaps.csv', DEFAULT_WORKS = '/assets/data/bouquet-sample-works.csv'
const query = new URLSearchParams(location.search)
// Each state: its number column, what that number is out of (base), and, where the file has a `kind`
// column, which kind of row it shows (the two forward-citation sweeps are a different instrument
// from the keyword searches and get a state of their own).
const STATES = {
  'all hits (keyword searches)': { col: 'hits_all', kind: 'keyword' },
  'distinct hits': { col: 'hits_distinct', base: 'hits_all', kind: 'keyword' },
  'overlapping hits': { col: 'hits_overlapping', base: 'hits_distinct', kind: 'keyword' },
  'forward citations (Barad, Shlain)': { col: 'hits_distinct', base: 'hits_all', kind: 'forward citation', unit: 'citing works' },
  'texts on disk': { col: 'on_disk', base: 'hits_distinct', unit: 'texts held' },
  'used in the comps': { col: 'used_in_comps', base: 'on_disk', unit: 'used in the comps' },
}
const params = { state: 'all hits (keyword searches)', minHits: 0, scale: 0.055, colourBy: 'group', ties: 'works', lift: 0.45, breeze: 0.3, bounce: 0.5, blink: 1, glow: 0.25, disperse: 0, pointSize: 0.14, smallBoost: 1.5, skin: 0, labels: 'broad terms', labelTop: 16, floorOn: true, floor: 'spiral', floorAlpha: 0.22, glassFloor: false, reach: 0.35, undulate: 0.1, bottle: true, curve: 0.6, sides: 8, bend: 0.7, tint: '#BFDCE8' }
let data = null, cols = null, notes = [], fileName = '', pairs = [], works = []
function takeCsv(parsed, name) {
  cols = guessColumns(parsed.columns, parsed.rows)
  const split = splitNotes(parsed.rows, cols)
  data = split.data; notes = split.notes; fileName = name
  console.log(`bouquet: ${name}: ${data.length} rows, columns term="${cols.term}" hits="${cols.hits}" group="${cols.group ?? '-'}"; states: ${stateNames().join(', ') || 'one (' + cols.hits + ')'}; ${notes.length} note rows set aside`)
}
const hasKind = () => data && data.length && 'kind' in data[0]
const stateRows = () => {                                            // the rows the current state shows
  const st = STATES[params.state]
  return !data ? [] : st && st.kind && hasKind() ? data.filter(r => (r.kind || '').trim() === st.kind) : data
}
function takeOverlaps(parsed) {                                     // term_a, term_b, shared_works
  const ca = parsed.columns.find(c => /term_a|^a$|from/i.test(c)), cb = parsed.columns.find(c => /term_b|^b$|^to$/i.test(c)), cn = parsed.columns.find(c => /shared|count|n$|works/i.test(c))
  pairs = parsed.rows.map(r => ({ a: (r[ca] ?? '').trim(), b: (r[cb] ?? '').trim(), n: parseFloat(r[cn]) })).filter(p => p.a && p.b && Number.isFinite(p.n))
}
function takeWorks(parsed) {                                        // term_a, term_b, title: the pairs opened up, one row per shared work
  const ca = parsed.columns.find(c => /term_a/i.test(c)), cb = parsed.columns.find(c => /term_b/i.test(c)), ct = parsed.columns.find(c => /title|work/i.test(c))
  works = parsed.rows.map(r => ({ a: (r[ca] ?? '').trim(), b: (r[cb] ?? '').trim(), title: (r[ct] ?? '').trim() })).filter(w => w.a && w.b && w.title && !/^(SOURCE|NOTES)/.test(w.a))
}
const stateColumn = () => data && STATES[params.state] && data.length && STATES[params.state].col in data[0] ? STATES[params.state].col : cols.hits
const stateNames = () => data && data.length ? Object.keys(STATES).filter(s => STATES[s].col in data[0] && (!STATES[s].kind || !hasKind() || data.some(r => (r.kind || '').trim() === STATES[s].kind))) : []
const unitOf = () => STATES[params.state]?.unit ?? (params.state.startsWith('all hits') ? 'hits' : params.state)

// ---- 2. TREE: terms and their narrowings, in the chosen state ------------------------------------
let tree = { roots: [], nodes: [], groups: [] }
function rebuildTree() { tree = data ? buildTermTree(stateRows(), { ...cols, hits: stateColumn() }, { minHits: Math.max(1, params.minHits) }) : { roots: [], nodes: [], groups: [] } }

// ---- 3. SPHERES: a term is a floating sphere of its hits, a narrower term a smaller one on it ----
// Colours are Amy's palette, the darker ones first since the glass behind is light.
const PALETTE = ['#6777B6', '#849E15', '#D8560E', '#B28622', '#E1903E', '#D17089', '#92A2A6', '#CBD183', '#EFCE7B', '#D3C2CD', '#F8CABA']
const NAVY = '#1B2A4A', NAVY_SOFT = '#3E5577', LINE = '#4A6A8A'
let balloons = null, flies = null, floor = null, bottle = null, byNode = new Map(), labels = []
const radiusFor = hits => 0.08 + params.scale * Math.cbrt(hits)
function colourFor(node) {
  if (params.colourBy === 'group') return PALETTE[Math.max(0, tree.groups.indexOf(node.group)) % PALETTE.length]
  if (params.colourBy === 'parent') { let r = node; while (r.parent) r = r.parent; return PALETTE[tree.roots.indexOf(r) % PALETTE.length] }
  let h = 0; for (const ch of node.term) h = (h * 31 + ch.charCodeAt(0)) % 997; return PALETTE[h % PALETTE.length]
}
const labelsOn = node => params.labels === 'all' || (params.labels === 'broad terms' && !node.parent && tree.roots.indexOf(node) < params.labelTop)
function build(THREE, scene) {
  balloons.clear(); labels.forEach(l => scene.remove(l)); labels = []; byNode = new Map()
  const place = (node, tether) => {
    const b = balloons.add({ radius: radiusFor(node.hits), color: colourFor(node), tether, userData: { node } })
    byNode.set(node, b)
    const label = makeLabel(THREE, node.term.length > 34 ? node.term.slice(0, 33) + '…' : node.term, { sub: `${node.hits.toLocaleString()} ${unitOf()}`, height: tether ? 0.26 : 0.34, color: NAVY, subColor: NAVY_SOFT, backing: 'rgba(255,255,255,0.72)' })
    label.visible = labelsOn(node); label.userData.balloon = b; label.userData.node = node; scene.add(label); labels.push(label)
    node.children.forEach(c => place(c, b))
  }
  tree.roots.forEach(r => place(r, null))
  // ---- 4. FIREFLIES: one per hit, filling each sphere -------------------------------------------
  flies.set(balloons.balloons.map(b => ({ position: b.pos, radius: b.radius, color: b.color, count: b.userData.node.hits, size: sizeFor(b.userData.node.hits) })))
  flies.size = params.pointSize
  buildLinks(); buildWorkLines()
}
function sizeFor(hits) {                                            // bigger fireflies in spheres with fewer hits
  const maxHits = Math.max(2, ...tree.nodes.map(n => n.hits))
  return 1 + params.smallBoost * (1 - Math.log(hits + 1) / Math.log(maxHits + 1))
}

// ---- 5. LABELS: kept above their spheres each frame ---------------------------------------------
function placeLabels() { for (const l of labels) { const b = l.userData.balloon; l.position.set(b.pos.x, b.pos.y + b.radius + 0.18, b.pos.z) } }

// ---- 6. TIES: lines for the works two spheres share -------------------------------------------------
// In the overlapping state and the forward-citation state (Barad and Shlain: the works that cite both).
// Two kinds, chosen by `ties`. Between spheres: one segment per term pair in the overlaps file, both
// ends following the spheres, the colour fading toward the glass for pairs that share few works so the
// heavy ties stand out. Work to work: one segment per shared work in the shared-works file, from the
// firefly that stands for it in one sphere to the firefly that stands for it in the other (a sphere's
// k-th shared work is its k-th firefly), following the fireflies wherever they fly.
const LINK_STATES = new Set(['overlapping hits', 'forward citations (Barad, Shlain)'])
const statePairs = () => { const have = new Set(tree.nodes.map(n => n.term.toLowerCase())); return pairs.filter(p => have.has(p.a.toLowerCase()) && have.has(p.b.toLowerCase())) }
let links = null, linkPairs = []
function buildLinks() {
  if (links) { links.parent.remove(links); links.geometry.dispose(); links = null }
  linkPairs = []
  if (!LINK_STATES.has(params.state) || !pairs.length || !['spheres', 'both'].includes(params.ties)) return
  const byTerm = new Map(tree.nodes.map(n => [n.term.toLowerCase(), byNode.get(n)]))
  const max = Math.max(1, ...pairs.map(p => p.n))
  const THREE = links_THREE, pos = [], col = [], c = new THREE.Color(), strong = new THREE.Color(NAVY), faint = new THREE.Color('#9FB8CA')
  for (const p of pairs) {
    const a = byTerm.get(p.a.toLowerCase()), b = byTerm.get(p.b.toLowerCase())
    if (!a || !b) continue
    linkPairs.push([a, b])
    c.copy(faint).lerp(strong, Math.sqrt(p.n / max))
    pos.push(0, 0, 0, 0, 0, 0); col.push(c.r, c.g, c.b, c.r, c.g, c.b)
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  links = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.7 })); links.frustumCulled = false; links.raycast = () => {}
  links_scene.add(links)
}
let workSeg = null, workEnds = []                                   // per line: host a, its k-th fly, host b, its k-th fly
function buildWorkLines() {
  if (workSeg) { workSeg.parent.remove(workSeg); workSeg.geometry.dispose(); workSeg = null }
  workEnds = []
  if (!LINK_STATES.has(params.state) || !works.length || !['works', 'both'].includes(params.ties)) return
  const hostIndex = new Map(balloons.balloons.map((b, i) => [b.userData.node.term.toLowerCase(), i]))
  const slots = new Map()                                             // term -> (title -> k)
  const slotOf = (term, title) => { let m = slots.get(term); if (!m) { m = new Map(); slots.set(term, m) } if (!m.has(title)) m.set(title, m.size); return m.get(title) }
  for (const w of works) {
    const a = hostIndex.get(w.a.toLowerCase()), b = hostIndex.get(w.b.toLowerCase())
    if (a === undefined || b === undefined) continue
    const ka = slotOf(w.a.toLowerCase(), w.title), kb = slotOf(w.b.toLowerCase(), w.title)
    if (flies.flyAt(a, ka) < 0 || flies.flyAt(b, kb) < 0) continue
    workEnds.push(a, ka, b, kb)
  }
  if (!workEnds.length) return
  const THREE = links_THREE, geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(workEnds.length / 4 * 6), 3))
  workSeg = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: NAVY, transparent: true, opacity: 0.35 })); workSeg.frustumCulled = false; workSeg.raycast = () => {}
  links_scene.add(workSeg)
}
let links_THREE = null, links_scene = null
function placeLinks() {
  if (links) {
    const p = links.geometry.attributes.position
    linkPairs.forEach(([a, b], i) => { p.setXYZ(2 * i, a.pos.x, a.pos.y, a.pos.z); p.setXYZ(2 * i + 1, b.pos.x, b.pos.y, b.pos.z) })
    p.needsUpdate = true
  }
  if (workSeg) {
    const p = workSeg.geometry.attributes.position, P = flies.positions
    for (let i = 0, j = 0; i < workEnds.length; i += 4, j += 2) {
      const ia = 3 * flies.flyAt(workEnds[i], workEnds[i + 1]), ib = 3 * flies.flyAt(workEnds[i + 2], workEnds[i + 3])
      p.setXYZ(j, P[ia], P[ia + 1], P[ia + 2]); p.setXYZ(j + 1, P[ib], P[ib + 1], P[ib + 2])
    }
    p.needsUpdate = true
  }
}

// ---- 7. PICKING, HOVER AND CLICK -------------------------------------------------------------------
// The skins are drawn back-side (the far inner wall of each sphere), so a ray cast at them lands on a
// sphere's far surface, and a small sphere nested in or just behind a big one took the click meant for
// the big one. Picking is done here instead, against the spheres as spheres. A pointer picks, in order:
// the sphere whose near surface the ray meets first; over empty glass, a visible label under it (the
// labels of the biggest terms would otherwise cover the small spheres behind them); failing both, the
// sphere whose edge is nearest the pointer within PICK_PX, so a one-work sphere (a single firefly, no
// skin) can still be hovered and clicked. In a headset only the ray applies; the harness's own hit is
// used only when it gives no ray.
const PICK_PX = 14
let pick = null, hovered = null, focused = null
const balloonOf = obj => obj?.userData.balloon ?? null
function makePicker(THREE) {
  const rc = new THREE.Raycaster(), ndc = new THREE.Vector2(), q = new THREE.Quaternion()
  const oc = new THREE.Vector3(), c = new THREE.Vector3(), e = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3()
  let cam = null
  const onScreen = v => { v.applyMatrix4(cam.matrixWorldInverse); if (v.z >= 0) return false; v.applyMatrix4(cam.projectionMatrix); return true }   // false when behind the eye
  const pxX = (v, x) => (v.x - x) * innerWidth / 2, pxY = (v, y) => (v.y - y) * innerHeight / 2
  const halfPx = (at, axis, half, centre, px) => { e.copy(at).addScaledVector(axis, half); onScreen(e); return Math.abs(px(e, centre)) }
  function alongRay(ray) {                                            // the sphere whose near surface the ray meets first
    let best = null, bestT = Infinity
    for (const b of balloons.balloons) {
      oc.subVectors(b.pos, ray.origin)
      const along = oc.dot(ray.direction), off2 = oc.lengthSq() - along * along, r2 = b.radius * b.radius
      if (along < 0 || off2 > r2) continue
      const t = along - Math.sqrt(r2 - off2)
      if (t >= 0 && t < bestT) { bestT = t; best = b }
    }
    return best
  }
  function underLabel(x, y) {                                         // the pointer inside a visible label's box, the topmost (last drawn) first
    for (let i = labels.length - 1; i >= 0; i--) { const l = labels[i]
      if (!l.visible || !onScreen(c.copy(l.position))) continue
      if (Math.abs(pxX(c, x)) <= halfPx(l.position, right, l.scale.x / 2, c.x, pxX) && Math.abs(pxY(c, y)) <= halfPx(l.position, up, l.scale.y / 2, c.y, pxY)) return l.userData.balloon
    }
    return null
  }
  function nearest(x, y) {                                            // the sphere whose edge is nearest the pointer, within PICK_PX
    let best = null, bestD = PICK_PX
    for (const b of balloons.balloons) {
      if (!onScreen(c.copy(b.pos))) continue
      const d = Math.hypot(pxX(c, x), pxY(c, y)) - halfPx(b.pos, right, b.radius, c.x, pxX)
      if (d < bestD) { bestD = d; best = b }
    }
    return best
  }
  function at(x, y, camera) {                                         // flat: the pointer in normalised device coordinates
    cam = camera; cam.updateMatrixWorld(); cam.matrixWorldInverse.copy(cam.matrixWorld).invert()
    cam.getWorldQuaternion(q); right.set(1, 0, 0).applyQuaternion(q); up.set(0, 1, 0).applyQuaternion(q)
    rc.setFromCamera(ndc.set(x, y), cam)
    return alongRay(rc.ray) ?? underLabel(x, y) ?? nearest(x, y)
  }
  return { at, alongRay, pointer: new THREE.Vector2(2, 2) }           // pointer: where it last pointed, off screen until it moves
}
function describe(b) {
  const n = b.userData.node, kids = n.children.map(c => `${c.term} (${c.hits.toLocaleString()})`).join(', ')
  const baseCol = STATES[params.state]?.base, base = baseCol && n.row[baseCol]
  const shared = LINK_STATES.has(params.state) ? pairs.filter(p => p.a === n.term || p.b === n.term).sort((x, y) => y.n - x.n).slice(0, 4).map(p => `${p.a === n.term ? p.b : p.a} (${p.n})`).join(', ') : ''
  const baseName = { hits_all: 'returned', hits_distinct: 'distinct', on_disk: 'texts held' }[baseCol] ?? baseCol
  return `${n.term} · ${n.hits.toLocaleString()} ${unitOf()}${base ? ` of ${(+base).toLocaleString()} ${baseName}` : ''}${n.group ? ' · ' + n.group : ''}${n.parent ? ' · narrows "' + n.parent.term + '"' : ''}${kids ? ' · narrowed by: ' + kids : ''}${shared ? ' · shares works with: ' + shared : ''}`
}
function setHover(b, hint) {
  if (hovered === b) return
  if (hovered) { hovered.skin.material.opacity = params.skin; labels.forEach(l => { if (l.userData.balloon === hovered) l.visible = labelsOn(l.userData.node) }) }
  hovered = b
  if (b) { b.skin.material.opacity = Math.max(0.12, params.skin); labels.forEach(l => { if (l.userData.balloon === b) l.visible = params.labels !== 'none' }); hint(describe(b)) }
  else if (!focused) hint(overview())
}
// The corner text states the state's totals against the whole: the numbers shown, and what they are out of.
const tieText = () => {
  if (!LINK_STATES.has(params.state)) return ''
  const sp = statePairs(), shared = sp.reduce((s, p) => s + p.n, 0), drawn = workEnds.length / 4
  const what = params.state.startsWith('forward') ? `${shared.toLocaleString()} works cite both` : `${sp.length} term pairs share ${shared.toLocaleString()} works`
  const how = params.ties === 'none' ? '' : params.ties === 'spheres' ? `, ${linkPairs.length} ties between spheres` : `, ${drawn.toLocaleString()} lines work to work${params.ties === 'both' ? ` and ${linkPairs.length} ties between spheres` : ''}`
  return ` · ${what}${how}`
}
const overview = () => {
  const rows = stateRows(), col = stateColumn(), baseCol = STATES[params.state]?.base
  const sum = c => rows.reduce((s, r) => s + (parseFloat(r[c]) || 0), 0)
  const shown = sum(col), hasBase = baseCol && rows.length && baseCol in rows[0], total = hasBase ? sum(baseCol) : shown, withAny = rows.filter(r => (parseFloat(r[col]) || 0) > 0).length
  const baseName = { hits_all: 'returned', hits_distinct: 'distinct hits', on_disk: 'texts held' }[baseCol] ?? baseCol
  const spheres = rows.some(r => (r.kind || '').trim() === 'snowball') ? 'spheres (one the snowball)' : 'terms'
  const base = !hasBase ? `${shown.toLocaleString()} ${unitOf()} across ${withAny} ${spheres}` : `${shown.toLocaleString()} ${unitOf()} of ${total.toLocaleString()} ${baseName}, across ${withAny} of ${rows.length} ${spheres}`
  return `${params.state}: ${base} · ${tree.roots.length} broad, ${tree.nodes.length - tree.roots.length} narrowed · ${flies.count.toLocaleString()} fireflies${flies.perPoint > 1 ? ` (one per ${flies.perPoint.toFixed(1)})` : ', one each'}${tieText()} · ${fileName} · hover a sphere · click to look closer`
}

// ---- 8. THE LOOK: the bottle behind, white boxes, navy text -----------------------------------------
// The harness's overlay and panel are dark by default; this sketch restyles them for the glass.
const LOOK = `
  #overlay { color: ${NAVY}; text-shadow: none; }
  #overlay #hint { display: inline-block; background: rgba(255,255,255,.72); color: ${NAVY}; padding: 8px 12px; border-radius: 8px; max-width: 68ch; line-height: 1.4; pointer-events: none; }
  #overlay #sketches, #overlay nav { background: rgba(255,255,255,.6); border-radius: 8px; padding: 4px 10px; display: inline-block; }
  #overlay #sketches a, #overlay nav a { color: #2F5C9C; } #overlay #sketches b, #overlay nav b { color: ${NAVY}; }
  .lil-gui { --background-color: rgba(255,255,255,.74); --text-color: ${NAVY}; --title-background-color: rgba(255,255,255,.55); --title-text-color: ${NAVY}; --widget-color: rgba(27,42,74,.08); --hover-color: rgba(27,42,74,.14); --focus-color: rgba(27,42,74,.2); --number-color: #2F5C9C; --string-color: #2F5C9C; --font-size: 12px; --input-font-size: 12px; }
  .lil-gui.root { --width: 300px; --name-width: 48%; backdrop-filter: blur(6px); border-radius: 10px; }
  .lil-gui .controller.option select { color: ${NAVY}; }
`

// ---- 9. THE PANEL --------------------------------------------------------------------------------
let rebuildAll = () => {}
export async function setup(ctx) {
  const { THREE, scene, camera, controls, renderer, hint, gui, selectable } = ctx
  links_THREE = THREE; links_scene = scene
  const style = document.createElement('style'); style.textContent = LOOK; document.head.appendChild(style)
  scene.background = new THREE.Color(params.tint); scene.fog = null
  bottle = createBottle(THREE, scene, { tint: params.tint, deep: '#8FB8C8', light: '#F2F8FA', curve: params.curve, sides: params.sides, bend: params.bend })
  floor = createFloorCurve(THREE, scene, { kind: params.floor, radius: 7, spacing: 0.3, color: LINE, opacity: params.floorAlpha, glass: params.glassFloor, tint: '#9CC2A0' })
  camera.position.set(0, 5.5, 10); controls.target.set(0, 5.6, 0); controls.update()

  balloons = createBalloons(THREE, scene, { ceiling: 7.5, floor: 0.6, walls: 6 })
  flies = createFireflies(THREE, scene, { max: 200000, size: params.pointSize, onLight: true })
  selectable(balloons.root)

  let stateCtl = null
  rebuildAll = () => { rebuildTree(); build(THREE, scene); hint(overview()) }
  const take = (parsed, name) => {
    const isOverlaps = parsed.columns.some(c => /term_a/i.test(c))
    if (isOverlaps && parsed.columns.some(c => /title/i.test(c))) { takeWorks(parsed); buildWorkLines(); hint(`${works.length} shared works loaded from ${name}`); return }
    if (isOverlaps) { takeOverlaps(parsed); buildLinks(); hint(`${pairs.length} term pairs loaded from ${name}`); return }
    takeCsv(parsed, name); focused = null
    const names = stateNames(); if (!names.includes(params.state)) params.state = names[0] ?? 'all hits (keyword searches)'
    stateCtl?.options(names.length ? names : ['all hits (keyword searches)']); rebuildAll()
  }
  const picker = acceptCsvFiles(renderer.domElement, (text, name) => take(parseCsv(text), name))
  try {
    const url = query.get('csv') ?? DEFAULT_CSV
    takeCsv(await loadCsv(url), url.split('/').pop())
    try { takeOverlaps(await loadCsv(query.get('overlaps') ?? DEFAULT_OVERLAPS)) } catch (e) { console.warn('bouquet: no overlaps file: ' + e.message) }
    try { takeWorks(await loadCsv(query.get('works') ?? DEFAULT_WORKS)) } catch (e) { console.warn('bouquet: no shared-works file: ' + e.message) }
    rebuildAll()
  } catch (err) { hint(`could not load the CSV: ${err.message} · drop one on the page or "open a CSV…"`) }

  stateCtl = gui.add(params, 'state', stateNames().length ? stateNames() : ['all hits (keyword searches)']).name('state').onChange(rebuildAll)
  gui.add({ open: () => picker.openPicker() }, 'open').name('open a CSV…')
  gui.add(params, 'minHits', 0, 1000, 10).name('hide terms under').onFinishChange(rebuildAll)
  gui.add(params, 'scale', 0.02, 0.12, 0.005).name('sphere size').onFinishChange(rebuildAll)
  gui.add(params, 'colourBy', ['group', 'parent', 'term']).name('colour by').onChange(rebuildAll)
  gui.add(params, 'ties', { 'work to work': 'works', 'between spheres': 'spheres', 'both': 'both', 'none': 'none' }).name('ties (overlap states)').onChange(() => { buildLinks(); buildWorkLines(); hint(overview()) })
  gui.add(params, 'pointSize', 0.03, 0.4, 0.01).name('firefly size').onChange(v => { flies.size = v })
  gui.add(params, 'smallBoost', 0, 4, 0.1).name('bigger in small spheres').onChange(() => flies.rescale(h => sizeFor(h.count)))
  gui.add(params, 'blink', 0, 3, 0.05).name('blink speed')
  gui.add(params, 'glow', 0, 1, 0.05).name('glow when off')
  gui.add(params, 'disperse', 0, 1, 0.01).name('dispersed')
  gui.add(params, 'lift', 0, 1, 0.01).name('lift (how high they float)')
  gui.add(params, 'breeze', 0, 1.5, 0.05)
  gui.add(params, 'bounce', 0, 1, 0.05)
  gui.add(params, 'skin', 0, 0.5, 0.01).name('faint skin').onChange(v => balloons.setSkin(v))
  const relabel = () => labels.forEach(l => { l.visible = labelsOn(l.userData.node) })
  gui.add(params, 'labels', ['broad terms', 'all', 'none']).onChange(relabel)
  gui.add(params, 'labelTop', 0, 80, 1).name('label the largest').onChange(relabel)
  const f = gui.addFolder('floor and glass')
  f.add(params, 'floorOn').name('floor').onChange(v => { floor.group.visible = v })
  f.add(params, 'floor', ['spiral', 'hilbert', 'triangles', 'honeycomb', 'none']).name('floor line').onChange(k => floor.setKind(k))
  f.add(params, 'floorAlpha', 0, 1, 0.01).name('floor line opacity').onChange(v => { floor.material.opacity = v })
  f.add(params, 'reach', 0, 1, 0.01).name('reach for the spheres')
  f.add(params, 'undulate', 0, 0.5, 0.01).name('swell')
  f.add(params, 'glassFloor').name('glass floor too').onChange(v => floor.setGlass(v))
  f.add(params, 'bottle').name('the bottle behind').onChange(v => { bottle.visible = v })
  f.add(params, 'curve', 0, 1, 0.01).name('bottle curve').onChange(v => bottle.setCurve(v))
  f.add(params, 'sides', { round: 0, six: 6, eight: 8, ten: 10, twelve: 12 }).name('bottle sides').onChange(v => bottle.setSides(v))
  f.add(params, 'bend', 0, 1, 0.01).name('line bend').onChange(v => bottle.setBend(v))
  f.addColor(params, 'tint').name('glass tint').onChange(v => { bottle.setTint(v); scene.background.set(v) })
  gui.add({ home: () => { focused = null; camera.position.set(0, 5.5, 10); controls.target.set(0, 5.6, 0); hint(overview()) } }, 'home').name('see them all')

  pick = makePicker(THREE)
  const point = e => pick.pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1)
  renderer.domElement.addEventListener('pointermove', e => { point(e); setHover(pick.at(pick.pointer.x, pick.pointer.y, camera), hint) })
  renderer.domElement.addEventListener('pointerdown', point)          // a tap may never move, so the click knows where it landed
  if (import.meta.env?.DEV) window.__bouquet = { params, get tree() { return tree }, get balloons() { return balloons }, get flies() { return flies }, get floor() { return floor }, get bottle() { return bottle }, get pairs() { return pairs }, get links() { return linkPairs }, get works() { return works }, get workLines() { return workEnds.length / 4 }, get pick() { return pick }, get labels() { return labels }, get cols() { return cols }, get data() { return data }, rebuild: rebuildAll, takeCsv: take, describe, byNode: () => byNode, stateNames }
}

export function draw(ctx, dt) {
  if (!balloons) return
  balloons.update(dt, { lift: params.lift, breeze: params.breeze, bounce: params.bounce, damping: 0.5 })
  flies.update(dt, { blink: params.blink, glow: params.glow, disperse: params.disperse })
  if (params.floorOn) floor.update(dt, { hosts: balloons.balloons.map(b => ({ position: b.pos, radius: b.radius })), reach: params.reach, undulate: params.undulate })
  bottle.update(dt)
  placeLabels(); placeLinks()
  if (focused) ctx.controls.target.lerp(focused.pos, Math.min(1, dt * 3))
}

export function onSelect(hit, { controls, camera, hint, xr }, ray) {
  const b = xr ? (ray ? pick.alongRay(ray) : balloonOf(hit?.object)) : pick.at(pick.pointer.x, pick.pointer.y, camera)
  if (!b) { focused = null; hint(overview()); return }
  focused = b
  const toCam = camera.position.clone().sub(controls.target).normalize()
  camera.position.copy(b.pos).addScaledVector(toCam, Math.max(2.5, b.radius * 5))
  controls.target.copy(b.pos)
  hint(describe(b))
}
