// Tree: one author's texts as nodes on a root, laid out on a time axis with the oldest at the bottom.
// The author is the root; the trunk is the years; every text is a branch off the trunk at the height
// of its year, a sphere sized by its body words and coloured by kind (book, article, chapter,
// conversation). Below each text hang its cited sources as leaves, sized by how often it cites them.
// Two kinds of tie join texts to texts: text reuse (passages shared between two texts) and
// self-citation (a text citing one of the author's earlier texts). The root sits above the newest
// year by default, an inverted tree hanging down into the past; it can be moved below the oldest.
//
// Data: three tables from the litmap package (K:\ResearchRepository\litmap\outputs):
//   docs.csv                     one row per text: doc_id, author, coauthors, year, title, kind, words_body
//   citations/sources_summary.csv one row per cited work: cited_name, cited_year, cited_title, citations, docs
//   maps/text_reuse.csv           doc_a, doc_b, share_of_a, share_of_b
//   ?sketch=tree                                   the sample (Erin Manning, 18 texts)
//   ?sketch=tree&docs=<url>&sources=<url>&reuse=<url>   another author's tables
//
// The pieces, each on its own:
//   lib/csv.js         reading the tables                                               (section 1)
//   lib/treelayout.js  the time-axis layout and the leaf fan                            (section 2)
//   lib/labels.js      sprite labels                                                    (section 6)
//   this file          the data joins, trunk and branches, ties, leaves, hover and click, the panel

import { loadCsv, asNumber } from '../lib/csv.js'
import { layoutTree, fan } from '../lib/treelayout.js'
import { makeLabel } from '../lib/labels.js'

// ---- 1. DATA: the three tables, and the joins between them ---------------------------------------
const query = new URLSearchParams(location.search)
const URLS = {
  docs: query.get('docs') ?? './data/tree-sample-docs.csv',
  sources: query.get('sources') ?? './data/tree-sample-sources.csv',
  reuse: query.get('reuse') ?? './data/tree-sample-reuse.csv',
}
let author = '', works = [], sources = [], reuse = [], cites = []
const byId = new Map()

const yearOf = v => { const m = String(v ?? '').match(/\d{4}/); return m ? parseInt(m[0], 10) : null }
const words = s => (s ?? '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(w => w.length > 3)

async function loadAll() {
  const [d, s, r] = await Promise.all([loadCsv(URLS.docs), loadCsv(URLS.sources), loadCsv(URLS.reuse)])
  const isNote = row => /^(SOURCE_FILE|SOURCE|NOTES)$/.test(Object.values(row)[0] ?? '')
  works = d.rows.filter(row => row.doc_id && !isNote(row)).map(row => ({
    id: row.doc_id, author: row.author, coauthors: row.coauthors, year: yearOf(row.year), title: row.title,
    kind: (row.kind || 'text').toLowerCase(), words: asNumber(row.words_body) ?? 0, overlap: row.overlap ?? '',
    size: asNumber(row.words_body) ?? 0, sources: [], ties: [],
  }))
  byId.clear(); works.forEach(w => byId.set(w.id, w))
  // the author: the name most of the texts carry
  const count = new Map(); works.forEach(w => count.set(w.author, (count.get(w.author) ?? 0) + 1))
  author = [...count.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''
  sources = s.rows.filter(row => row.cited_name && !isNote(row)).map(row => ({
    name: row.cited_name, year: yearOf(row.cited_year), yearRaw: row.cited_year, title: row.cited_title,
    citations: asNumber(row.citations) ?? 0, docs: (row.docs ?? '').split(';').map(x => x.trim()).filter(Boolean),
  }))
  for (const src of sources) for (const id of src.docs) byId.get(id)?.sources.push(src)
  reuse = r.rows.filter(row => byId.has(row.doc_a) && byId.has(row.doc_b) && !isNote(row)).map(row => ({
    a: byId.get(row.doc_a), b: byId.get(row.doc_b), share: Math.max(asNumber(row.share_of_a) ?? 0, asNumber(row.share_of_b) ?? 0),
  }))
  cites = selfCitations()
}

// A cited work that is one of the author's own texts: the cited name carries the author's surname,
// the year matches, and the titles share words (or the cited title sits inside the text's title).
function selfCitations() {
  const surname = author.split(/\s+/).pop()?.toLowerCase() ?? ''
  const out = []
  for (const src of sources) {
    if (!surname || !src.name.toLowerCase().includes(surname)) continue
    const tw = words(src.title)
    const target = works.find(w => w.year === src.year && (
      (tw.length && words(w.title).filter(x => tw.includes(x)).length >= Math.min(2, tw.length)) ||
      (src.title && w.title.toLowerCase().includes(src.title.toLowerCase().replace(/[.:]+$/, '')))))
    if (!target) continue
    for (const id of src.docs) { const from = byId.get(id); if (from && from !== target) out.push({ from, to: target, n: src.citations, src }) }
  }
  return out
}

// ---- 2. LAYOUT -----------------------------------------------------------------------------------
const params = {
  rootAt: 'top', yearStep: 0.6, reach: 1.6, nodeScale: 1, leaves: false, leafScale: 1,   // leaves off: just the texts until asked
  ties: 'both', labels: 'texts and years', leafLabels: 12,
}
let layout = null
function relayout() { layout = layoutTree(works, { rootAt: params.rootAt, yearStep: params.yearStep, reach: params.reach }) }

// ---- 3. TRUNK, BRANCHES AND TEXT NODES ------------------------------------------------------------
const KIND_COLOUR = { book: 0xe8b04b, article: 0x7fa6d9, chapter: 0x9ab36b, conversation: 0xd97a4b }
const colourOf = kind => KIND_COLOUR[kind] ?? 0xb8b8b8
const radiusOf = w => 0.09 + 0.055 * Math.cbrt(w.words / 1000) * params.nodeScale

let THREE, scene, holder = null, group = null
const nodeMeshes = []                    // one sphere per text; mesh.userData.node = layout node
let rootMesh = null
// only the author, the texts and the leaves take a click or a hover; lines, ticks, rings and labels never do
const sealPicks = () => group.traverse(o => { if (!(o.userData.node || o.userData.leaf || o.userData.root)) o.raycast = () => {} })
function buildTree() {
  if (group) { holder.remove(group); group = null }
  group = new THREE.Group(); holder.add(group)
  nodeMeshes.length = 0; leafMeshes.length = 0; tieLines.length = 0; labels.length = 0
  const { root, trunk, years, nodes } = layout

  // the root: the author
  rootMesh = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 16), new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.6 }))
  rootMesh.position.set(root.x, root.y, root.z); rootMesh.userData.root = true; group.add(rootMesh)

  // the trunk: a thin cylinder from the root to the far end of the years
  const len = Math.abs(trunk.from.y - trunk.to.y)
  const trunkMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, len, 10), new THREE.MeshStandardMaterial({ color: 0xcfcfcf, roughness: 0.8 }))
  trunkMesh.position.set(0, (trunk.from.y + trunk.to.y) / 2, 0); group.add(trunkMesh)

  // a tick per year with a text
  const tickMat = new THREE.MeshStandardMaterial({ color: 0x9a9a9a })
  for (const y of years) {
    const tick = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.012, 6, 24), tickMat)
    tick.rotation.x = Math.PI / 2; tick.position.set(0, y.y, 0); group.add(tick)
  }

  // branches and the text nodes
  const branchMat = new THREE.LineBasicMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.8 })
  for (const n of nodes) {
    const w = n.work
    const pts = [new THREE.Vector3(n.anchor.x, n.anchor.y, n.anchor.z), new THREE.Vector3(n.x, n.y, n.z)]
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), branchMat))
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(radiusOf(w), 24, 16), new THREE.MeshStandardMaterial({ color: colourOf(w.kind), roughness: 0.55 }))
    mesh.position.set(n.x, n.y, n.z); mesh.userData.node = n; group.add(mesh); nodeMeshes.push(mesh)
    if (w.coauthors) {                   // co-authored: a ring round the sphere
      const ring = new THREE.Mesh(new THREE.TorusGeometry(radiusOf(w) * 1.45, 0.012, 6, 40), new THREE.MeshBasicMaterial({ color: 0xffffff }))
      ring.position.copy(mesh.position); ring.rotation.x = Math.PI / 2; group.add(ring)
    }
  }
  buildTies(); buildLeaves(); buildLabels(); sealPicks()
}

// ---- 4. TIES: text reuse, and a text citing an earlier text of the author's ----------------------
const tieLines = []
const nodeOf = w => layout.nodes.find(n => n.work === w)
const vec = n => new THREE.Vector3(n.x, n.y, n.z)
// a curve between two nodes, bowed away from the trunk so it clears the branches
function bow(a, b, out = 0.8) {
  const pa = vec(a), pb = vec(b), mid = pa.clone().add(pb).multiplyScalar(0.5)
  const away = new THREE.Vector3(mid.x, 0, mid.z); if (away.lengthSq() < 1e-4) away.set(1, 0, 0); away.normalize()
  const ctrl = mid.addScaledVector(away, out)
  return new THREE.QuadraticBezierCurve3(pa, ctrl, pb).getPoints(32)
}
function buildTies() {
  for (const l of tieLines) group.remove(l); tieLines.length = 0
  const showReuse = params.ties === 'both' || params.ties === 'reuse', showCites = params.ties === 'both' || params.ties === 'cites'
  if (showReuse) for (const t of reuse) {
    const a = nodeOf(t.a), b = nodeOf(t.b); if (!a || !b) continue
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(bow(a, b)), new THREE.LineBasicMaterial({ color: 0xf0d8a8, transparent: true, opacity: 0.25 + 0.7 * t.share }))
    line.userData.tie = { kind: 'reuse', ...t }; group.add(line); tieLines.push(line)
  }
  if (showCites) for (const c of cites) {
    const a = nodeOf(c.from), b = nodeOf(c.to); if (!a || !b) continue
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(bow(a, b, 0.5)), new THREE.LineDashedMaterial({ color: 0x9fd0ff, dashSize: 0.08, gapSize: 0.06, transparent: true, opacity: 0.9 }))
    line.computeLineDistances(); line.userData.tie = { kind: 'cites', ...c }; group.add(line); tieLines.push(line)
  }
  sealPicks()
}

// ---- 5. LEAVES: the cited sources under each text ------------------------------------------------
const leafMeshes = []                    // mesh.userData.leaf = { src, work }
const leafGeo = () => new THREE.SphereGeometry(1, 10, 8)
function leafRadius(src) { return (0.018 + 0.012 * Math.cbrt(src.citations)) * params.leafScale }
function buildLeaves() {
  for (const m of leafMeshes) group.remove(m); leafMeshes.length = 0
  if (!params.leaves) return
  const geo = leafGeo()
  for (const n of layout.nodes) {
    const w = n.work; if (!w.sources.length) continue
    const sorted = [...w.sources].sort((a, b) => b.citations - a.citations)
    const r = 0.3 + 0.06 * Math.sqrt(sorted.length)
    const spots = fan(n, sorted.length, { radius: r, drop: radiusOf(w) + 0.3 })
    const stem = new THREE.Line(new THREE.BufferGeometry().setFromPoints([vec(n), new THREE.Vector3(n.x, n.y - radiusOf(w) - 0.3, n.z)]), new THREE.LineBasicMaterial({ color: 0x777777, transparent: true, opacity: 0.6 }))
    group.add(stem); leafMeshes.push(stem)
    sorted.forEach((src, i) => {
      const own = cites.some(c => c.src === src)
      const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: own ? 0x9fd0ff : (src.docs.length > 1 ? 0xffe9a8 : 0xd8e4d0), roughness: 0.7 }))
      const s = leafRadius(src); m.scale.setScalar(s); m.position.set(spots[i].x, spots[i].y, spots[i].z)
      m.userData.leaf = { src, work: w }; group.add(m); leafMeshes.push(m)
    })
  }
  sealPicks()
}

// ---- 6. LABELS: the texts, the years, the author; leaf labels on focus and hover -----------------
const labels = []
let leafLabelGroup = null
const short = (s, n = 40) => s.length > n ? s.slice(0, n - 1) + '…' : s
function buildLabels() {
  for (const l of labels) group.remove(l); labels.length = 0
  if (params.labels === 'none') return
  const rootLabel = makeLabel(THREE, author || 'author', { height: 0.3 }); rootLabel.position.set(layout.root.x, layout.root.y + 0.45, layout.root.z); group.add(rootLabel); labels.push(rootLabel)
  for (const m of nodeMeshes) {
    const w = m.userData.node.work
    const l = makeLabel(THREE, short(w.title), { sub: `${w.year ?? 'no year'} · ${w.kind}${w.coauthors ? ' · with ' + w.coauthors : ''}`, height: 0.24 })
    l.position.set(m.position.x, m.position.y + radiusOf(w) + 0.2, m.position.z); group.add(l); labels.push(l)
  }
  if (params.labels === 'texts and years') for (const y of layout.years) {
    const l = makeLabel(THREE, String(y.year), { height: 0.16, backing: 'rgba(8,10,16,0.35)' }); l.position.set(-0.3, y.y, 0); group.add(l); labels.push(l)
  }
  sealPicks()
}
// leaf labels for one text (the most cited first) or one hovered leaf
function showLeafLabels(items) {
  if (leafLabelGroup) { group.remove(leafLabelGroup); leafLabelGroup = null }
  if (!items.length) return
  leafLabelGroup = new THREE.Group(); group.add(leafLabelGroup)
  // several labels (a focused text's most-cited sources): a ranked column beside the fan, each tied to
  // its leaf by a thin line; one label (a hovered leaf): right under the leaf
  const column = items.length > 1, base = column ? nodeOf(items[0].userData.leaf.work) : null
  const side = base ? (Math.cos(base.angle) >= 0 ? 1 : -1) : 1
  const lineMat = new THREE.LineBasicMaterial({ color: 0x8899aa, transparent: true, opacity: 0.5 })
  items.forEach((m, i) => {
    const { src } = m.userData.leaf
    const l = makeLabel(THREE, short(src.name, 30), { sub: `${src.yearRaw || ''} ${short(src.title, 36)} · ${src.citations}`.trim(), height: 0.14, backing: 'rgba(8,10,16,0.5)' })
    if (column) {
      l.position.set(base.x + side * 1.4, base.y - 0.1 - i * 0.17, base.z)
      leafLabelGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([m.position.clone(), l.position.clone()]), lineMat))
    } else l.position.set(m.position.x, m.position.y - 0.1, m.position.z)
    leafLabelGroup.add(l)
  })
  sealPicks()
}

// ---- 7. HOVER AND CLICK --------------------------------------------------------------------------
let hint, camera, controls, hovered = null, focused = null
let raycaster = null, pointer = null                 // made in setup, once THREE is in hand
function pickables() { return [...nodeMeshes, ...leafMeshes.filter(m => m.isMesh), rootMesh] }
function describe(m) {
  if (m.userData.root) return `${author}: ${works.length} texts, ${layout.years[0]?.year ?? '?'} to ${layout.years[layout.years.length - 1]?.year ?? '?'}; ${sources.length} cited works; ${reuse.length} reuse ties, ${cites.length} self-citations`
  if (m.userData.node) {
    const w = m.userData.node.work
    const ties = reuse.filter(t => t.a === w || t.b === w).map(t => `${t.share < 0.01 ? '<1' : Math.round(t.share * 100)}% shared with ${short((t.a === w ? t.b : t.a).title, 30)}`)
    const own = cites.filter(c => c.from === w).map(c => `cites ${c.to.year} ${short(c.to.title, 24)} ×${c.n}`)
    return `${w.title} (${w.year ?? 'no year'}, ${w.kind}${w.coauthors ? ', with ' + w.coauthors : ''}): ${w.words.toLocaleString()} body words, ${w.sources.length} cited works${ties.length ? '; ' + ties.join('; ') : ''}${own.length ? '; ' + own.join('; ') : ''}`
  }
  if (m.userData.leaf) { const { src, work } = m.userData.leaf; return `${src.name} ${src.yearRaw || ''} ${src.title} · cited ${src.citations}× in ${short(work.title, 30)}${src.docs.length > 1 ? ` and ${src.docs.length - 1} other text${src.docs.length > 2 ? 's' : ''}` : ''}` }
  return ''
}
function setHover(m) {
  if (m === hovered) return
  if (hovered?.material?.emissive) hovered.material.emissive.setHex(0)
  hovered = m
  if (hovered?.material?.emissive) hovered.material.emissive.setHex(0x333333)
  if (hovered) hint(describe(hovered))
  else hint(focused ? describe(focused) : overview())
  if (hovered?.userData.leaf && !focused) showLeafLabels([hovered])
  else if (!hovered && !focused) showLeafLabels([])
}
function overview() { return `${author}: ${works.length} texts as a tree, oldest at the bottom · hover a sphere, click a text to look closer, click empty space to see all · drag to turn, right-drag or arrow keys to pan, wheel to zoom` }
function focusOn(m) {
  focused = m
  if (!m) { showLeafLabels([]); hint(overview()); return }
  const n = m.userData.node
  const toCam = camera.position.clone().sub(controls.target).normalize()
  glideTo(m.position.clone().addScaledVector(toCam, 3.2), m.position)
  const own = leafMeshes.filter(l => l.isMesh && l.userData.leaf.work === n.work).slice(0, params.leafLabels)
  showLeafLabels(own); hint(describe(m))
}
export function onSelect(hit) {
  const m = hit?.object
  if (m?.userData.node) focusOn(m)
  else if (m?.userData.leaf) { showLeafLabels([m]); hint(describe(m)) }
  else focusOn(null)
}

// ---- 8. SETUP, THE PANEL, THE LOOK ----------------------------------------------------------------
function home(now = false) {
  focused = null; showLeafLabels([])
  const b = layout.bounds, mid = (b.minY + b.maxY) / 2 - 0.4, span = b.maxY - b.minY + 1.2   // room for the lowest leaves
  const to = new THREE.Vector3(0, mid, Math.max(6, span * 1.05)), at = new THREE.Vector3(0, mid, 0)
  if (now) { camera.position.copy(to); controls.target.copy(at); controls.update() } else glideTo(to, at)
  hint(overview())
}
const rebuild = () => { relayout(); buildTree(); home() }
export async function setup(ctx) {
  ({ THREE, scene, camera, controls } = ctx); hint = ctx.hint
  // concrete controls: no damping drift, zoom toward the cursor, arrow keys pan, and a drag cancels any glide
  controls.enableDamping = false; controls.zoomToCursor = true; controls.keyPanSpeed = 24
  controls.listenToKeyEvents(window); controls.addEventListener('start', () => { glide = null })
  scene.background = new THREE.Color(0x14161c)
  scene.add(new THREE.HemisphereLight(0xffffff, 0x40464f, 1.1))
  const sun = new THREE.DirectionalLight(0xffffff, 1.2); sun.position.set(3, 6, 5); scene.add(sun)
  const ground = new THREE.Mesh(new THREE.CircleGeometry(6, 48), new THREE.MeshStandardMaterial({ color: 0x1c1f27, roughness: 1 }))
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.6; scene.add(ground)
  try { await loadAll() } catch (err) { hint(`could not load the tables: ${err.message}`); return }
  holder = new THREE.Group(); scene.add(holder); ctx.selectable(holder)   // the harness's click goes through the whole tree
  relayout(); buildTree(); home(true)
  ground.position.y = layout.bounds.minY - 1.2      // under the lowest text and its leaves
  raycaster = new THREE.Raycaster(); pointer = new THREE.Vector2(2, 2)
  ctx.renderer.domElement.addEventListener('pointermove', e => {
    // measured on the canvas, not the window: the canvas is the whole window in
    // the sketch harness, but only part of it when this runs as a figure in the
    // dissertation pages (thesis/lib/embed.js)
    const r = ctx.renderer.domElement.getBoundingClientRect()
    pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
    raycaster.setFromCamera(pointer, camera)
    setHover(raycaster.intersectObjects(pickables(), false)[0]?.object ?? null)
  })
  const gui = ctx.gui
  gui.add(params, 'rootAt', { 'above the newest (inverted)': 'top', 'below the oldest': 'bottom' }).name('root').onChange(rebuild)
  gui.add(params, 'yearStep', 0.2, 1.5, 0.05).name('height per year').onFinishChange(rebuild)
  gui.add(params, 'reach', 0.6, 3, 0.1).name('branch length').onFinishChange(rebuild)
  gui.add(params, 'nodeScale', 0.4, 2, 0.1).name('text size').onFinishChange(rebuild)
  gui.add(params, 'ties', { 'reuse and self-citation': 'both', 'text reuse': 'reuse', 'self-citation': 'cites', 'none': 'none' }).onChange(buildTies)
  gui.add(params, 'leaves').name('cited sources').onChange(buildLeaves)
  gui.add(params, 'leafScale', 0.4, 3, 0.1).name('source size').onFinishChange(buildLeaves)
  gui.add(params, 'leafLabels', 0, 40, 1).name('label sources on click')
  gui.add(params, 'labels', ['texts and years', 'texts', 'none']).onChange(buildLabels)
  gui.add({ home }, 'home').name('see it all')
  window.__tree = { works, sources, reuse, cites, layout: () => layout, params, rebuild }
}
// ---- 9. CAMERA MOVES: a short glide to a text or to the whole tree, then the camera stays put ------
// The user's own drag, pan or zoom cancels a glide at once (the controls' 'start' event), so nothing
// pulls the view back after they move it.
let glide = null
function glideTo(position, target, seconds = 0.6) {
  glide = { p0: camera.position.clone(), p1: position.clone(), t0: controls.target.clone(), t1: target.clone(), t: 0, seconds }
}
export function draw(ctx, dt) {
  if (!glide) return
  glide.t = Math.min(1, glide.t + dt / glide.seconds)
  const s = glide.t * glide.t * (3 - 2 * glide.t)
  camera.position.lerpVectors(glide.p0, glide.p1, s); controls.target.lerpVectors(glide.t0, glide.t1, s)
  if (glide.t >= 1) glide = null
}
