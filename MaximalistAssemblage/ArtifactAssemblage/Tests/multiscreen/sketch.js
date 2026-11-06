// Screens: one sketch across several windows on several displays. The window this opens in is the
// controller: it finds the computer's screens, opens an output window on any of them (a projector on
// HDMI, a second monitor), fullscreen, and keeps every output in step with its own clock. Each output
// is the same scene seen from its own fixed camera: a wall-sized front view for a projector, the side,
// the top, a wide low throw. Only a few numbers travel between windows, twenty times a second; every
// window builds the scene itself and draws its own frames.
//
//   ?sketch=multiscreen                         the controller: a panel of screens, outputs and the state
//   ?sketch=multiscreen&role=output&view=side   an output (the controller opens these for you)
//
// With no second display attached, "simulated screens" opens movable, resizable frames on this page,
// all at once, one per view, each drawn as its own viewport: several windows open at the same time
// on one screen, as Processing did it, for composing the piece before the hardware is there.
//
// The pieces, each on its own:
//   lib/screens.js   finding the displays, opening a window on one, going fullscreen     (section 5)
//   lib/sync.js      the channel between windows, who is on it, publishing / following   (section 4)
//   lib/panels.js    simulated screens: movable frames, and drawing a view into each      (section 8)
//   this file        the scene every window builds (2), the named views (3), the two roles (6, 7)

import { listScreens, openOnScreen, fullscreenHere, hasMoreScreens } from '../../lib/screens.js'
import { createBus, trackPeers, publishState, followState } from '../../lib/sync.js'
import { createPanels, renderPanels } from '../../lib/panels.js'

// ---- 1. ROLE: which window is this? -----------------------------------------------------------
// The controller has no role in its URL; an output has role=output and the view it shows. The output
// URL is this page's own URL with those two added, so it works in dev and on the exported site alike.
const query = new URLSearchParams(location.search)
const ROLE = query.get('role') === 'output' ? 'output' : 'controller'
const VIEW = query.get('view') ?? 'front'
const outputUrl = view => { const u = new URL(location.href); u.searchParams.set('role', 'output'); u.searchParams.set('view', view); return u.href }

// ---- 2. SCENE: the same scene in every window -------------------------------------------------
// A floor grid, a slowly turning sculpture, a satellite on a wire orbit and a ring of pillars whose
// colours follow a hue. The shared state is just these numbers; every window must build this alike.
const state = { angle: 0, speed: 0.6, hue: 0.58, playing: true }
let sculpture, satellite, pillarMats = []
function buildScene(THREE, scene) {
  scene.background = new THREE.Color(0x0b0d12)
  scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x201810, 1.2))
  const key = new THREE.DirectionalLight(0xffffff, 2.5); key.position.set(4, 8, 3); scene.add(key)
  scene.add(new THREE.GridHelper(12, 24, 0x334455, 0x223344))
  sculpture = new THREE.Mesh(new THREE.TorusKnotGeometry(0.7, 0.22, 160, 24), new THREE.MeshStandardMaterial({ color: 0xd9d2c5, roughness: 0.35, metalness: 0.2 }))
  sculpture.position.y = 1.4; scene.add(sculpture)
  satellite = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 16), new THREE.MeshStandardMaterial({ color: 0xffb347, emissive: 0xff8c1a, emissiveIntensity: 0.6 }))
  scene.add(satellite)
  for (let i = 0; i < 8; i++) {
    const m = new THREE.MeshStandardMaterial({ roughness: 0.7 }); pillarMats.push(m)
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.4, 16), m)
    const a = i / 8 * Math.PI * 2; p.position.set(Math.cos(a) * 3.6, 1.2, Math.sin(a) * 3.6); scene.add(p)
  }
}
function applyState() {
  sculpture.rotation.y = state.angle; sculpture.rotation.x = state.angle * 0.3
  satellite.position.set(Math.cos(state.angle * 2) * 2.2, 1.3 + Math.sin(state.angle * 3) * 0.35, Math.sin(state.angle * 2) * 2.2)
  pillarMats.forEach((m, i) => m.color.setHSL((state.hue + i / pillarMats.length) % 1, 0.55, 0.5))
}

// ---- 3. VIEWS: a named camera placement per output --------------------------------------------
const VIEWS = {
  front: { position: [0, 1.6, 7],   target: [0, 1.2, 0], fov: 50, note: 'wall-sized, for a projector facing the scene' },
  side:  { position: [7, 1.6, 0],   target: [0, 1.2, 0], fov: 50, note: 'from the right' },
  back:  { position: [0, 1.6, -7],  target: [0, 1.2, 0], fov: 50, note: 'from behind' },
  top:   { position: [0, 9, 0.01],  target: [0, 0, 0],   fov: 50, note: 'straight down' },
  low:   { position: [0, 0.4, 4],   target: [0, 1.4, 0], fov: 90, note: 'a wide, low throw, for a projector on the floor' },
}
function placeCamera(THREE, camera, controls, name) {
  const v = VIEWS[name] ?? VIEWS.front
  camera.position.fromArray(v.position); controls.target.fromArray(v.target); camera.lookAt(controls.target)
  camera.fov = v.fov; camera.updateProjectionMatrix(); controls.update()
}

// ---- 4. SYNC: the controller publishes the state, the outputs follow it -----------------------
// The controller runs the clock and sends { angle, speed, hue, playing } twenty times a second with
// the time it was sent. An output keeps the last message and, between messages, carries the angle
// forward at the sent speed from the sent moment, so every window shows the same instant.
const bus = createBus('multiscreen')
let last = null                                                    // the output's latest state and when it was sent
let peers = []                                                     // the controller's list of outputs

// ---- 5. SCREENS: finding displays and opening an output on each (controller) ------------------
// listScreens() asks the browser for the permission the first time (so it is called from a button);
// each screen gets a row in the panel with a view to show and a button that opens an output there,
// fullscreen where the browser allows. Without the permission there is one row, this screen, and the
// window opens on it; the output's first click makes it fullscreen anyway (section 6).
let screenRows = null
async function refreshScreens(gui, hint) {
  const screens = await listScreens()
  screenRows?.destroy()
  screenRows = gui.addFolder(`screens (${screens.length}${hasMoreScreens() && screens.length === 1 ? ', more if you allow it' : ''})`)
  screens.forEach((s, i) => {
    const row = { view: Object.keys(VIEWS)[i % 5], open: () => {
      const w = openOnScreen(outputUrl(row.view), s, { fullscreen: true })
      hint(w ? `opened the ${row.view} view on ${s.label}` : 'the browser blocked the window: allow pop-ups for this page and try again')
    } }
    const f = screenRows.addFolder(`${s.label} · ${s.width}×${s.height}${s.current ? ' · this one' : ''}${s.isInternal ? ' · built in' : ''}`)
    f.add(row, 'view', Object.keys(VIEWS))
    f.add(row, 'open').name('open an output here, fullscreen')
  })
}

// ---- 6. OUTPUT: a bare full-window view --------------------------------------------------------
// No panel, no navigation; the camera fixed on its view, the orbit controls off; a click toggles
// fullscreen (the browser only allows that from a click), and the corner text fades after a moment.
function setupOutput({ THREE, scene, camera, controls, hint }) {
  placeCamera(THREE, camera, controls, VIEW)
  controls.enabled = false
  document.querySelector('#overlay nav')?.remove()
  hint(`${VIEW} view · ${VIEWS[VIEW]?.note ?? ''} · click for fullscreen · waiting for the controller`)
  const overlay = document.getElementById('overlay')
  let fade = setTimeout(() => { overlay.style.opacity = 0 }, 6000)
  window.addEventListener('pointermove', () => { overlay.style.opacity = 1; clearTimeout(fade); fade = setTimeout(() => { overlay.style.opacity = 0 }, 3000) })
  followState(bus, (data, at) => { if (!last) hint(`${VIEW} view · in step with the controller · click for fullscreen`); last = { ...data, at } })
  trackPeers(bus, { role: 'output', view: VIEW }, () => {})
}

// ---- 7. CONTROLLER: the panel -------------------------------------------------------------------
function setupController({ THREE, camera, controls, hint, gui }) {
  placeCamera(THREE, camera, controls, 'front'); camera.position.set(5, 3.5, 7); controls.update()
  gui.add(state, 'speed', 0, 3, 0.05).name('turn speed')
  gui.add(state, 'hue', 0, 1, 0.01)
  gui.add(state, 'playing')
  gui.add({ find: () => refreshScreens(gui, hint) }, 'find').name('find screens (asks permission)')
  gui.add({ here: () => { const w = window.open(outputUrl('front'), '_blank', 'popup=1,width=960,height=540'); hint(w ? 'opened a front view in a window' : 'the browser blocked the window: allow pop-ups for this page') } }, 'here').name('open an output window here')
  gui.add({ link: () => { navigator.clipboard?.writeText(outputUrl('front')); hint('output link copied: ' + outputUrl('front')) } }, 'link').name('copy an output link')
  const status = () => hint(peers.length
    ? `${peers.length} output${peers.length > 1 ? 's' : ''} in step: ${peers.map(p => p.view).join(', ')} · drag to orbit here; the outputs hold their views`
    : `no outputs yet · "find screens" lists the displays, each row opens an output on one${hasMoreScreens() ? ' · more than one screen is attached' : ''}`)
  trackPeers(bus, { role: 'controller' }, list => { peers = list.filter(p => p.role === 'output'); status() })
  publishState(bus, () => state, 20)
  status()
  refreshScreens(gui, hint)                                         // the one screen known without asking; the button asks for the rest
  setupSimulated(ctx_, gui)
}

// ---- 8. SIMULATED SCREENS: several movable displays on this one page, all open at once ----------
// Each frame stands for a display and shows one view through its own camera; drag it by its bar,
// resize it by its corner, change its view in its bar, close it with the ✕. "open all views" opens
// one frame per view at the same time, tiled; the frames are drawn after the main view (afterRender),
// each as a scissored viewport of the same renderer, so they cost a render pass each, nothing more.
let panels = null, ctx_ = null
const panelCameras = new Map()                                      // panel → its camera
function cameraForPanel(THREE, controls, panel) {
  let cam = panelCameras.get(panel)
  if (!cam || cam.userData.view !== panel.data.view) {
    cam = new THREE.PerspectiveCamera(50, 16 / 9, 0.05, 200); cam.userData.view = panel.data.view
    const v = VIEWS[panel.data.view] ?? VIEWS.front
    cam.position.fromArray(v.position); cam.lookAt(new THREE.Vector3().fromArray(v.target)); cam.fov = v.fov; cam.updateProjectionMatrix()
    panelCameras.set(panel, cam)
  }
  return cam
}
function openSimulated(view, at = {}) {
  const select = document.createElement('select')
  Object.keys(VIEWS).forEach(v => { const o = document.createElement('option'); o.value = o.textContent = v; select.appendChild(o) })
  select.value = view
  const panel = panels.open({ title: 'screen', controls: [select], data: { view }, ...at })
  select.addEventListener('change', () => { panel.data.view = select.value })
  panel.onClose = p => panelCameras.delete(p)
  return panel
}
function setupSimulated({ hint }, gui) {
  panels = createPanels()
  const f = gui.addFolder('simulated screens')
  const tile = () => panels.tile({ right: 270 })                   // clear of the panel on the right
  f.add({ all: () => { panels.closeAll(); Object.keys(VIEWS).forEach(v => openSimulated(v)); tile(); hint(`${Object.keys(VIEWS).length} simulated screens open: drag by the bar, resize by the corner, pick a view in the bar`) } }, 'all').name('open all views at once')
  f.add({ one: () => { const n = panels.list().length; openSimulated(Object.keys(VIEWS)[n % 5], { x: 40 + n * 30, y: 70 + n * 30 }) } }, 'one').name('open one more')
  f.add({ tile }, 'tile').name('tile them')
  f.add({ close: () => panels.closeAll() }, 'close').name('close all')
}

export async function setup(ctx) {
  ctx_ = ctx
  buildScene(ctx.THREE, ctx.scene)
  ROLE === 'output' ? setupOutput(ctx) : setupController(ctx)
  if (import.meta.env?.DEV) window.__multiscreen = { role: ROLE, view: VIEW, state, bus, get last() { return last }, get peers() { return peers }, outputUrl, get panels() { return panels }, openSimulated }
}

export function afterRender({ renderer, scene, THREE, controls }) {
  if (panels) renderPanels(renderer, scene, panels.list(), p => cameraForPanel(THREE, controls, p))
}

export function draw(ctx, dt) {
  if (ROLE === 'controller') { if (state.playing) state.angle += state.speed * dt }
  else if (last) {                                                  // carry the clock forward from the last message
    Object.assign(state, { speed: last.speed, hue: last.hue, playing: last.playing })
    state.angle = last.angle + (last.playing ? last.speed * (Date.now() - last.at) / 1000 : 0)
  }
  applyState()
}

export function onSelect(hit, ctx) {
  if (ROLE === 'output') fullscreenHere().catch(err => ctx.hint('fullscreen refused: ' + err.message))
}
