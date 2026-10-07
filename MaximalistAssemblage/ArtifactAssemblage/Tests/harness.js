// Standalone harness for the published site. Same contract as src/main.js in the dev project
// (a sketch exports setup / draw / onSelect / onEnterXR / onExitXR and receives the same ctx),
// but with no sketch picker and no bundler: the page's import map supplies 'three',
// 'three/addons/' and 'lil-gui' from a CDN. Exported to the site by tools/export_site.mjs.

import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { XRButton } from 'three/addons/webxr/XRButton.js'
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js'
import { XRHandModelFactory } from 'three/addons/webxr/XRHandModelFactory.js'
import GUI from 'lil-gui'

const HAND_MODEL = 'spheres'

export async function run(sketch, { title = 'Sketch' } = {}) {
  document.title = title
  const hintEl = document.getElementById('hint') ?? document.body.appendChild(Object.assign(document.createElement('div'), { id: 'hint' }))

  // ---- renderer / scene / camera ----------------------------------------
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.xr.enabled = true
  document.body.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.05, 200)
  camera.position.set(0, 1.6, 3)

  const rig = new THREE.Group()
  rig.add(camera)
  scene.add(rig)

  const listener = new THREE.AudioListener()
  camera.add(listener)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.target.set(0, 1.2, 0)
  controls.enableDamping = true

  // ---- XR entry, only on browsers that can ------------------------------
  const supported = async mode => navigator.xr ? navigator.xr.isSessionSupported(mode).catch(() => false) : false
  Promise.all([supported('immersive-ar'), supported('immersive-vr')]).then(([ar, vr]) => {
    if (ar || vr) document.body.appendChild(XRButton.createButton(renderer, {
      optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking', 'layers'],
    }))
  })
  let savedBackground = null
  renderer.xr.addEventListener('sessionstart', () => {
    const blend = renderer.xr.getSession()?.environmentBlendMode
    if (blend && blend !== 'opaque') { savedBackground = scene.background; scene.background = null }
    sketch.onEnterXR?.(ctx)
  })
  renderer.xr.addEventListener('sessionend', () => {
    if (savedBackground !== null) { scene.background = savedBackground; savedBackground = null }
    sketch.onExitXR?.(ctx)
  })

  // ---- the one interaction primitive --------------------------------------
  const raycaster = new THREE.Raycaster()
  const selectables = []
  const pointer = new THREE.Vector2()
  const rot = new THREE.Matrix4()
  const select = (origin, direction) => {
    raycaster.set(origin, direction)
    sketch.onSelect?.(raycaster.intersectObjects(selectables, true)[0] ?? null, ctx)
  }
  let downX = 0, downY = 0
  renderer.domElement.addEventListener('pointerdown', e => { downX = e.clientX; downY = e.clientY })
  renderer.domElement.addEventListener('pointerup', e => {
    if (listener.context.state === 'suspended') listener.context.resume()
    if (renderer.xr.isPresenting) return
    if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return
    pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1)
    raycaster.setFromCamera(pointer, camera)
    sketch.onSelect?.(raycaster.intersectObjects(selectables, true)[0] ?? null, ctx)
  })
  const controllerModels = new XRControllerModelFactory()
  const handModels = new XRHandModelFactory()
  for (let i = 0; i < 2; i++) {
    const controller = renderer.xr.getController(i)
    controller.addEventListener('select', () => {
      rot.identity().extractRotation(controller.matrixWorld)
      select(new THREE.Vector3().setFromMatrixPosition(controller.matrixWorld), new THREE.Vector3(0, 0, -1).applyMatrix4(rot))
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

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  })

  // ---- context handed to the sketch --------------------------------------
  let gui = null
  const ctx = {
    THREE, scene, camera, renderer, rig, controls, listener,
    selectable(obj) { selectables.push(obj); return obj },
    hint(text) { hintEl.textContent = text },
    get gui() { return gui ??= new GUI({ title }) },
    get xr() { return renderer.xr.isPresenting },
  }
  window.ctx = ctx

  const timer = new THREE.Timer()
  await sketch.setup(ctx)
  renderer.setAnimationLoop(timestamp => {
    timer.update(timestamp)
    const dt = Math.min(timer.getDelta(), 0.1)
    if (!renderer.xr.isPresenting) controls.update()
    sketch.draw?.(ctx, dt, timer.getElapsed())
    renderer.render(scene, camera)
  })
}
