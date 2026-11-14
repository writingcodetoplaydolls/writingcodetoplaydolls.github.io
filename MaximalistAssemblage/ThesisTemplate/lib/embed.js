// The third harness.
//
// src/main.js runs one sketch in the whole window with a picker (development).
// src/site-harness.js runs one sketch in the whole window on the published site.
// This one runs a sketch inside an element in the middle of a page of prose,
// as many of them as a chapter needs, and starts and stops them as the reader
// scrolls. The contract is the same in all three: a sketch module exports
//
//   setup(ctx)                 once, may be async
//   draw(ctx, dt, elapsed)     every frame
//   afterRender?(ctx, dt)      extra passes over the finished frame
//   onSelect?(hit, ctx, ray)   a click, a tap, a trigger, a pinch
//   onEnterXR?(ctx) / onExitXR?(ctx)
//
// and receives the same ctx: THREE, scene, camera, renderer, rig, controls,
// listener, selectable(obj), hint(text), gui, xr. So every sketch already in
// src/sketches runs here unchanged. What differs is that nothing is measured
// against the window: the renderer is sized to the figure, pointer rays come
// from the canvas's own rectangle, the hint writes into the figure's bar, and
// lil-gui is mounted inside the figure rather than fixed to the page corner.
//
// Three extra keys are added to ctx, which a sketch may ignore:
//   ctx.container   the element the figure is drawn in
//   ctx.params      whatever the figure's directive passed in the chapter
//   ctx.embedded    true, for a sketch that wants to behave differently inline
//
// Lifecycle, because a page of these would otherwise melt a laptop:
//   start()    build the renderer, run setup, begin the loop
//   pause()    stop the loop, silence the audio and any video (still resident)
//   resume()   begin again where it stopped
//   dispose()  give the WebGL context back; the figure falls back to its poster
//
// A browser allows only a handful of live WebGL contexts, so figures.js keeps
// a budget and disposes the ones furthest from the reader. That is why dispose
// here is thorough: geometries, materials, textures, render targets.

import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js'
import { XRHandModelFactory } from 'three/addons/webxr/XRHandModelFactory.js'
import GUI from 'lil-gui'

const HAND_MODEL = 'spheres'            // as in the other two harnesses: no download
const XR_FEATURES = ['local-floor', 'bounded-floor', 'hand-tracking', 'layers']

/** Does this browser draw WebGL at all? Asked once; a figure with no WebGL
 *  shows its poster and says so rather than showing an empty box. */
let webglOk = null
export function hasWebGL() {
  if (webglOk !== null) return webglOk
  try {
    const canvas = document.createElement('canvas')
    webglOk = !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch { webglOk = false }
  return webglOk
}

/** Which immersive modes this browser offers. Asked once per page. */
let xrModes = null
export async function xrSupport() {
  if (xrModes) return xrModes
  if (!navigator.xr) return (xrModes = { ar: false, vr: false })
  const supported = mode => navigator.xr.isSessionSupported(mode).catch(() => false)
  const [ar, vr] = await Promise.all([supported('immersive-ar'), supported('immersive-vr')])
  return (xrModes = { ar, vr })
}

/* Sketches build their video elements with document.createElement and never
 * put them in the page (a video is only a texture source), so there is no way
 * to find them afterwards. We watch createElement while setup runs and keep
 * what it made, which is what lets a figure fall silent when it scrolls away.
 * Figures boot one at a time, so nothing else is caught in the window. */
function watchMedia(run) {
  const found = []
  const real = document.createElement.bind(document)
  document.createElement = function (tag, ...rest) {
    const el = real(tag, ...rest)
    if (/^(video|audio)$/i.test(String(tag))) found.push(el)
    return el
  }
  return Promise.resolve()
    .then(run)
    .finally(() => { document.createElement = real })
    .then(() => found)
}

/**
 * Make an embedded sketch. Nothing is created until start() is called.
 *
 * @param {object} sketch  the sketch module (setup/draw/…)
 * @param {object} opts
 * @param {HTMLElement} opts.stage      the element to draw in (position: relative)
 * @param {string}  [opts.title]        shown in the figure bar and as the gui title
 * @param {object}  [opts.params]       passed through as ctx.params
 * @param {Function}[opts.onHint]       called with the sketch's hint text
 * @param {Function}[opts.onState]      called with 'loading' | 'running' | 'paused' | 'error' | 'gone'
 */
export function createEmbed(sketch, { stage, title = 'Figure', params = {}, onHint, onState } = {}) {
  let renderer, scene, camera, rig, controls, listener, gui = null, timer
  let ro = null, media = [], wasPlaying = []
  let state = 'idle', ctx = null, canvas = null
  const selectables = []
  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  const rot = new THREE.Matrix4()
  const teardown = []                     // listeners and observers to undo

  const say = s => { state = s; onState?.(s) }
  const size = () => {
    const r = stage.getBoundingClientRect()
    return { w: Math.max(1, Math.round(r.width)), h: Math.max(1, Math.round(r.height)) }
  }

  // --- the one interaction primitive, measured on the canvas --------------
  // Identical to the other harnesses except that the pointer is turned into
  // normalised device coordinates against the canvas rectangle, not the window.
  function selectFromPointer(e) {
    const r = canvas.getBoundingClientRect()
    pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
    raycaster.setFromCamera(pointer, camera)
    sketch.onSelect?.(raycaster.intersectObjects(selectables, true)[0] ?? null, ctx, raycaster.ray)
  }
  function selectFromRay(origin, direction) {
    raycaster.set(origin, direction)
    sketch.onSelect?.(raycaster.intersectObjects(selectables, true)[0] ?? null, ctx, raycaster.ray)
  }

  async function start() {
    if (state === 'running' || state === 'loading') return
    if (state === 'paused') return resume()
    say('loading')

    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    const { w, h } = size()
    renderer.setSize(w, h, false)                 // false: the stylesheet owns the canvas box
    renderer.xr.enabled = true
    canvas = renderer.domElement
    canvas.setAttribute('aria-label', title)
    stage.appendChild(canvas)

    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera(60, w / h, 0.05, 200)
    camera.position.set(0, 1.6, 3)

    rig = new THREE.Group()                       // carries camera, controllers, hands in XR
    rig.add(camera)
    scene.add(rig)

    listener = new THREE.AudioListener()
    camera.add(listener)

    controls = new OrbitControls(camera, canvas)
    controls.target.set(0, 1.2, 0)
    controls.enableDamping = true

    // --- XR, per figure --------------------------------------------------
    let savedBackground = null
    const onSessionStart = () => {
      const blend = renderer.xr.getSession()?.environmentBlendMode
      if (blend && blend !== 'opaque') { savedBackground = scene.background; scene.background = null }
      sketch.onEnterXR?.(ctx)
    }
    const onSessionEnd = () => {
      if (savedBackground !== null) { scene.background = savedBackground; savedBackground = null }
      sketch.onExitXR?.(ctx)
    }
    renderer.xr.addEventListener('sessionstart', onSessionStart)
    renderer.xr.addEventListener('sessionend', onSessionEnd)
    teardown.push(() => {
      renderer.xr.removeEventListener('sessionstart', onSessionStart)
      renderer.xr.removeEventListener('sessionend', onSessionEnd)
    })

    // --- pointer, controllers, hands -------------------------------------
    let downX = 0, downY = 0
    const onDown = e => { downX = e.clientX; downY = e.clientY }
    const onUp = e => {
      if (listener.context.state === 'suspended') listener.context.resume()
      if (renderer.xr.isPresenting) return
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return    // a drag, not a tap
      selectFromPointer(e)
    }
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointerup', onUp)
    teardown.push(() => {
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointerup', onUp)
    })

    const controllerModels = new XRControllerModelFactory()
    const handModels = new XRHandModelFactory()
    for (let i = 0; i < 2; i++) {
      const controller = renderer.xr.getController(i)
      controller.addEventListener('select', () => {
        rot.identity().extractRotation(controller.matrixWorld)
        selectFromRay(
          new THREE.Vector3().setFromMatrixPosition(controller.matrixWorld),
          new THREE.Vector3(0, 0, -1).applyMatrix4(rot),
        )
      })
      const ray = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -1)]),
        new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 }),
      )
      ray.scale.z = 3
      controller.add(ray)
      rig.add(controller)

      const grip = renderer.xr.getControllerGrip(i)
      grip.add(controllerModels.createControllerModel(grip))
      rig.add(grip)

      const hand = renderer.xr.getHand(i)
      hand.add(handModels.createHandModel(hand, HAND_MODEL))
      rig.add(hand)
    }

    // --- resize: the figure, not the window ------------------------------
    ro = new ResizeObserver(() => {
      if (!renderer || renderer.xr.isPresenting) return
      const { w, h } = size()
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h, false)
    })
    ro.observe(stage)

    // --- the context handed to the sketch --------------------------------
    ctx = {
      THREE, scene, camera, renderer, rig, controls, listener,
      selectable(obj) { selectables.push(obj); return obj },
      hint(text) { onHint?.(text) },
      get gui() { return gui ??= new GUI({ title, container: stage, width: 240 }) },
      get xr() { return renderer.xr.isPresenting },
      container: stage, params, embedded: true,
    }

    timer = new THREE.Timer()
    try {
      media = await watchMedia(() => sketch.setup(ctx))
    } catch (err) {
      say('error')
      onHint?.(`this figure failed to load: ${err.message}`)
      console.error(`[figure ${title}]`, err)
      return
    }
    if (state !== 'loading') return            // disposed while setup was running

    renderer.setAnimationLoop(frame)
    say('running')
  }

  function frame(timestamp) {
    timer.update(timestamp)
    const dt = Math.min(timer.getDelta(), 0.1)   // clamp, so a figure resumed after a scroll does not jump
    if (!renderer.xr.isPresenting) controls.update()
    sketch.draw?.(ctx, dt, timer.getElapsed())
    renderer.render(scene, camera)
    sketch.afterRender?.(ctx, dt)
  }

  function pause() {
    if (state !== 'running' || renderer?.xr.isPresenting) return
    renderer.setAnimationLoop(null)
    wasPlaying = media.filter(m => !m.paused)
    wasPlaying.forEach(m => m.pause())
    if (listener?.context.state === 'running') listener.context.suspend()
    say('paused')
  }

  function resume() {
    if (state !== 'paused') return
    renderer.setAnimationLoop(frame)
    wasPlaying.forEach(m => m.play().catch(() => {}))
    wasPlaying = []
    say('running')
  }

  /** Hand the WebGL context back. The figure can be started again from scratch. */
  function dispose() {
    if (state === 'idle' || state === 'gone') { say('gone'); return }
    try { renderer?.setAnimationLoop(null) } catch {}
    try { sketch.dispose?.(ctx) ?? sketch.onDispose?.(ctx) } catch (err) { console.warn(`[figure ${title}] dispose:`, err) }
    media.forEach(m => { try { m.pause(); m.removeAttribute('src'); m.load() } catch {} })
    media = []; wasPlaying = []
    try { listener?.context.suspend() } catch {}
    ro?.disconnect(); ro = null
    while (teardown.length) { try { teardown.pop()() } catch {} }
    gui?.destroy(); gui = null
    controls?.dispose()
    scene?.traverse(obj => {
      obj.geometry?.dispose?.()
      const mats = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : []
      for (const m of mats) {
        for (const v of Object.values(m)) if (v && v.isTexture) v.dispose()
        m.dispose?.()
      }
    })
    selectables.length = 0
    renderer?.dispose()
    try { renderer?.forceContextLoss() } catch {}
    canvas?.remove()
    renderer = scene = camera = rig = controls = listener = ctx = canvas = null
    say('gone')
  }

  return {
    get state() { return state },
    get ctx() { return ctx },
    get renderer() { return renderer },
    start, pause, resume, dispose,
  }
}

/**
 * An XR entry button for one figure. Written out rather than taken from
 * three/addons/webxr/XRButton.js because that one styles itself as a bar fixed
 * to the bottom of the window, which is wrong in the middle of a page. The
 * behaviour is the same: ask for AR if the device offers it, else VR.
 *
 * @returns {HTMLButtonElement|null} null when the browser offers no immersive mode
 */
export async function createXRButton(getRenderer) {
  const { ar, vr } = await xrSupport()
  if (!ar && !vr) return null
  const mode = ar ? 'immersive-ar' : 'immersive-vr'
  const label = ar ? 'enter AR' : 'enter VR'

  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'fig-xr'
  button.textContent = label
  let session = null

  button.addEventListener('click', async () => {
    const renderer = getRenderer()
    if (!renderer) return
    if (session) { session.end(); return }
    button.disabled = true
    try {
      session = await navigator.xr.requestSession(mode, { optionalFeatures: XR_FEATURES })
      session.addEventListener('end', () => { session = null; button.textContent = label })
      await renderer.xr.setSession(session)
      button.textContent = 'exit'
    } catch (err) {
      button.textContent = 'XR refused'
      console.warn('XR session refused:', err.message)
      setTimeout(() => { button.textContent = label }, 2500)
    } finally {
      button.disabled = false
    }
  })
  return button
}
