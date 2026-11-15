// The world behind the pages.
//
// One WebGL canvas fixed under everything, running the whole time the document
// is open: a dark grey room with the floating skin figure in it. The pages are
// sheets of near-black laid over the top, with windows cut through them, so she
// is visible wherever a window is. She spends her time between two things:
//
//   away      off doing what she does, moving between points in the room,
//             always still in frame, a faint shape through the sheet
//   watching  framed by one of the windows, facing the reader, at rest
//
// By default she stays: she takes a window and holds it, and is only away
// when the page has no window on it for her -- when it is turned, or while she
// crosses to the next one. `stay: false` gives her back the coming and going.
// Either way it is hers to decide, unless the reader decides it for her: the panel in lib/reader.js can hold her at a window or leave her
// to the room, and can move the two settings that say how she is seen — how
// much of a window she fills, which part of her it frames, and how far back
// the mist starts. Everything a control can send is clamped here rather than
// there.
//
// Placing her *in* a window is the whole trick. A window is a rectangle on the
// screen; given that rectangle, there is exactly one point in front of the
// camera that projects to its centre at a depth where she fills it. That is
// what anchorFor() computes, every frame while she watches, so she stays in the
// window as the camera drifts, the page turns or the reader scrolls.
//
// ---- what "she" is -------------------------------------------------------
//
// This file does not know, and does not need to. It asks for a *body* and gets
// back one object:
//
//   { object, height?, update?(dt), rest?(), go?(), dispose?() }
//
//   object   a THREE.Object3D for the scene: metres, Y up, feet near y = 0,
//            facing +Z. Anything — a skinned mesh, a cloud of points, a shader.
//   height   metres, head to foot. Measured off the object when not given.
//   update   called once a frame with the seconds since the last one, and with
//            how big she currently is on the screen — see bodyInfo().
//   rest     the gentle thing she does while watching someone read.
//   go       the thing she does when she is away.
//
// Two kinds of body can be named in thesis.json under `world`:
//
//   figure: "pregnant.fbx", clips: [...]   a rigged model and its clips,
//                                          loaded and wrapped by loadFigure()
//   module: "/floating-skin/skin.js"       an ES module exporting
//                                          createBody({ THREE, assets, quiet })
//                                          which returns the object above
//
// The module is the way in for the real floating skin, which is not a model
// file at all: it is a cloud of points tethered to joints, driven by pose
// clips, drawn with its own shader (tools/export_points_web.py in
// K:\ResearchRepository\FloatingSkinProject\3DScanning). Nothing here needs to
// understand any of that — only to be handed something with an `object`, and
// to be told, or able to measure, how tall she is.

import * as THREE from 'three'
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const FILL = 0.74          // how much of a window's height she is asked to fill

// How much of her a window shows. The aperture is 60 mm square -- a twin-lens
// frame -- and a whole standing figure in one is a small figure a long way off
// with nothing of her face in it, so the crop is a portrait by default. Both
// numbers are fractions of her height, so they hold for any body however tall:
// `span` is how much of her the window frames, `centre` is where the middle of
// that frame sits above her feet.
const CROPS = {
  head:   { span: 0.26, centre: 0.90 },   // crown to upper chest: the head shot
  bust:   { span: 0.45, centre: 0.78 },   // waist up
  figure: { span: 1,    centre: 0.5 },    // all of her, as it was
}
const CROP = 'head'

// The two rooms. Dark is the document's own and takes its colour from
// thesis.json. Light is the one the floating-skin viewers use -- the same
// background and floor they do -- and it is the one with a floor, because a
// shadow needs something to fall on.
// Five rooms, dark to light. `bg: null` is the colour thesis.json set, so the
// document's own dark stays the document's own. A floor only appears once
// there is light for it to be seen in; below that it would be a black plane in
// a black room. The page's own colours are the stylesheet's business
// (lib/reader.js decides which way up it goes) — this is only what is behind.
const ROOMS = [
  { name: 'black', bg: 0x0e0f13, floor: 0x0b0c0f, floorOn: false, ground: 0x0b0c0f, shade: 0 },
  { name: 'dark',  bg: null,     floor: 0x14161b, floorOn: false, ground: 0x1a1a1a, shade: 0 },
  { name: 'grey',  bg: 0x6e7178, floor: 0x5c5f66, floorOn: true,  ground: 0x5c5f66, shade: 0.46 },
  { name: 'pale',  bg: 0xb9bec7, floor: 0xa9aeb8, floorOn: true,  ground: 0xa9aeb8, shade: 0.62 },
  { name: 'light', bg: 0xeef1f6, floor: 0xdfe3ea, floorOn: true,  ground: 0xdfe3ea, shade: 0.72 },
]
const ROOM = 1                                  // the document's own dark
const roomAt = v => ROOMS[Math.min(ROOMS.length - 1, Math.max(0, Math.round(+v)))] ?? ROOMS[ROOM]

// Where the key light stands, in the same relation to her that the
// floating-skin viewers use: 1.5 across, 3 up, 2 toward the reader. Named once
// because the shadow is worked out from it rather than guessed — a shadow that
// disagrees with the light is worse than no shadow.
const KEY = { x: 3, y: 6, z: 4 }
const KEY_REACH = Math.hypot(KEY.x, KEY.z) / KEY.y     // how far a shadow reaches per metre of height
const PRESENCE = 0.5       // where the mist starts: 0.5 is fog from 9 m to 26 m
const FADE = 0.6           // crossfade between clips, seconds
const MAX_FPS = 30         // the pages are the thing being read; she gets half a screen's worth
const WATCH = [14, 26]     // seconds she stays at a window
const AWAY = [10, 20]      // seconds she stays away
const TRAVEL = 2.8         // seconds to cross between the two
const DEG = Math.PI / 180

const rand = (a, b) => a + Math.random() * (b - a)
const ease = t => t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
const isFBX = url => /\.fbx$/i.test(url)

export function createWorld(config = {}) {
  const {
    assets = '/models/',
    figure = 'pregnant.fbx',
    module: bodyModule = null,
    clips: clipFiles = [],
    colour = '#2b2b2b',
    waiting = 'ginga',             // the clip she waits in at a window
    rotate = null,                 // [x, y, z] degrees, for a body not authored Y-up facing +Z
    offset = null,                 // [x, y, z] metres, if its feet are not at its origin
    scale = 0,                     // 0 measures and decides between metres and centimetres
    quiet = false,                 // reduced motion: she stays put
    room: roomIn = ROOM,           // 0..4, dark to light: which room, see ROOMS
    stay = true,                   // hold a window rather than coming and going
    onBody = null,                 // called once she is in the room: the panel waits on this
    // What the panel finds, once it is written down in thesis.json. `body` is
    // whatever the body module itself calls its tuning: this file passes the
    // names straight through without knowing one from another, and the module
    // clamps them. Anything left out keeps the module's own default, so a
    // later module that improves a default she never touched still wins.
    fill: fillAt = FILL,
    presence: presenceAt = PRESENCE,
    framing: framingAt = CROP,     // 'head' | 'bust' | 'figure': the part of her a window frames
    body: bodyParams = null,
  } = config

  let renderer, scene, camera, hemi
  let body = null                  // { object, height, update, rest, go, dispose }
  let rig = null                   // the group that is moved and turned; the body sits inside it
  let raf = null, last = 0, carry = 0, running = false
  let paused = false               // the reader stopped the room; stronger than stop(), which is the tab going away
  let windows = []                 // { rect, open } in screen coordinates
  let state = 'away', until = 0, from = null, target = null, progress = 0
  let fill = fillAt                // how much of a window she fills: the panel moves this
  let presence = presenceAt        // how far back the mist starts
  let framing = CROPS[framingAt] ? framingAt : CROP   // which part of her a window frames
  let room = roomAt(roomIn)
  let floor = null, shade = null
  let held = stay ? 'watch' : null // 'watch' | 'away' | null: held at a window, left to the room, or her own mind
  const tmp = new THREE.Vector3()
  const toHer = new THREE.Vector3()
  const forward = new THREE.Vector3()
  const screen = new THREE.Vector3()
  const info = { pixels: 0, devicePixels: 0, framed: 0, state: 'away', inWindow: false }
  const canvas = document.createElement('canvas')
  canvas.className = 'world'
  canvas.setAttribute('aria-hidden', 'true')

  /* ---- set up ----------------------------------------------------------- */
  function start() {
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'low-power' })
    } catch (err) {
      console.warn('[world] no WebGL:', err.message)
      return false
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))   // she is behind text; she can be soft
    renderer.setSize(innerWidth, innerHeight, false)
    document.body.prepend(canvas)

    scene = new THREE.Scene()
    scene.background = new THREE.Color(colour)
    scene.fog = new THREE.Fog(colour, 9, 26)
    setPresence(presence)

    camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 60)
    camera.position.set(0, 1.5, 0)
    camera.lookAt(0, 1.4, -5)

    hemi = new THREE.HemisphereLight(0xdfe3ea, 0x1a1a1a, 1.1)
    scene.add(hemi)
    const key = new THREE.DirectionalLight(0xfff4e6, 1.5)
    key.position.set(KEY.x, KEY.y, KEY.z)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0x9aa6dd, 1.1)            // the periwinkle, to lift her off the grey
    rim.position.set(-3, 2, -4)
    scene.add(rim)

    // The floor, and the shadow she drops on it. Both belong to the light
    // room and are hidden in the dark one, where there is nothing for a floor
    // to be. The floor is large enough that its edge never shows through a
    // window; it is unlit flat colour rather than a lit surface, because the
    // room has no sun and a lit plane under a fog this shallow bands badly.
    floor = new THREE.Mesh(
      new THREE.PlaneGeometry(160, 160),
      new THREE.MeshBasicMaterial({ color: ROOMS[ROOMS.length - 1].floor, fog: true }),
    )
    floor.rotation.x = -Math.PI / 2
    floor.visible = false
    scene.add(floor)

    shade = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: shadeTexture(), transparent: true, opacity: 0, depthWrite: false, fog: false }),
    )
    shade.rotation.x = -Math.PI / 2
    shade.visible = false
    shade.renderOrder = 1
    scene.add(shade)

    setRoom(ROOMS.indexOf(room))

    addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : play()))
    play()
    load().catch(err => console.warn('[world] the figure did not load:', err.message))
    return true
  }

  /** A soft disc, dark in the middle and gone at the rim: what she drops on
   *  the floor. It is drawn, not cast — she is a cloud of points, and a point
   *  cloud writes nothing into a shadow map, so there is no shadow to catch.
   *  The disc follows her, widening and fading as she rises off the floor,
   *  which is what a real one would do. */
  function shadeTexture() {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const g = c.getContext('2d')
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64)
    grad.addColorStop(0, 'rgba(22,22,18,0.95)')
    grad.addColorStop(0.42, 'rgba(22,22,18,0.6)')
    grad.addColorStop(0.78, 'rgba(22,22,18,0.18)')
    grad.addColorStop(1, 'rgba(22,22,18,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, 128, 128)
    return new THREE.CanvasTexture(c)
  }

  /** Lay the shadow down the way the key light throws it: away from the light,
   *  reaching KEY_REACH metres along the ground for every metre of her height,
   *  anchored at her feet and stretched toward the far end. Off the floor it
   *  slides further out and softens, which is what a real one does. */
  function updateShade() {
    const on = room.shade > 0 && !!rig && !!body
    if (!shade) return
    shade.visible = on
    if (!on) return
    const her = body.height ?? 1.7
    const lift = Math.max(0, rig.position.y)
    // the direction the light throws, flattened onto the floor
    const ax = -KEY.x, az = -KEY.z
    const alen = Math.hypot(ax, az) || 1
    const ux = ax / alen, uz = az / alen
    const reach = (her + lift) * KEY_REACH
    const wide = her * 0.40
    const long = Math.max(wide, reach)
    shade.position.set(
      rig.position.x + ux * (long * 0.5 - her * 0.1),
      0.004,
      rig.position.z + uz * (long * 0.5 - her * 0.1),
    )
    shade.rotation.set(-Math.PI / 2, 0, -Math.atan2(ux, uz))
    shade.scale.set(wide, long, 1)
    shade.material.opacity = room.shade / (1 + lift * 1.1)
  }

  function onResize() {
    if (!renderer) return
    camera.aspect = innerWidth / innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(innerWidth, innerHeight, false)
  }

  /** Whichever body is configured, put it in the room and start her off. */
  async function load() {
    body = bodyModule ? await loadModule() : await loadFigure()
    if (!body?.object) throw new Error('the body came back without an object')

    // The body goes inside a rig, and the rig is what moves and turns. A body
    // authored Z-up, or with its feet off its origin, is corrected once here
    // and never thought about again.
    rig = new THREE.Group()
    const inner = body.object
    if (rotate) inner.rotation.set(rotate[0] * DEG, rotate[1] * DEG, rotate[2] * DEG)
    if (offset) inner.position.set(...offset)
    rig.add(inner)
    scene.add(rig)

    // Her height decides the depth she is placed at, so it is measured rather
    // than assumed, and her feet are brought down to the floor of the rig.
    const box = new THREE.Box3().setFromObject(rig)
    const measured = box.getSize(tmp).y
    body.height = body.height ?? (Number.isFinite(measured) && measured > 0.1 ? measured : 1.7)
    if (!offset && Number.isFinite(box.min.y)) inner.position.y -= box.min.y

    // her tuning as the thesis has it, over whatever the module shipped with
    if (bodyParams && body.set) {
      for (const [key, value] of Object.entries(bodyParams)) {
        if (body.set(key, value) === undefined) console.warn(`[world] the body has no "${key}" to set`)
      }
    }

    goAway(true)
    try { onBody?.(body) } catch (err) { console.warn('[world] onBody:', err.message) }
  }

  /** A body from an ES module: the way the real floating skin arrives.
   *
   *  `assets` here is the module's OWN directory, not the models folder: a body
   *  module ships beside its payload, and that is the base it needs to resolve
   *  it against. The models folder is passed separately as `models` for a
   *  module that wants something out of the project's own assets. Both are
   *  absolute URLs, so `new URL(file, assets)` works. */
  async function loadModule() {
    const mod = await import(/* @vite-ignore */ bodyModule)
    const make = mod.createBody ?? mod.default
    if (typeof make !== 'function') throw new Error(`${bodyModule} exports no createBody`)
    const here = new URL('.', new URL(bodyModule, location.href)).href
    const models = new URL(assets, location.href).href
    return await make({ THREE, assets: here, models, here, quiet })
  }

  /** A body from a rigged model file and its clips: the stand-in that is in
   *  the project now, and the shape a module should hand back. */
  async function loadFigure() {
    const open = async url => {
      const loader = isFBX(url) ? new FBXLoader() : new GLTFLoader()
      const r = await loader.loadAsync(url)
      return { object: r.scene ?? r, animations: r.animations ?? [] }
    }
    const her = await open(assets + figure)
    const object = her.object

    // Mixamo exports centimetres; everything in this project is metres.
    // Measure and decide, as src/sketches/mixamo.js does.
    if (scale) object.scale.setScalar(scale)
    else {
      const raw = new THREE.Box3().setFromObject(object).getSize(new THREE.Vector3()).y
      object.scale.setScalar(raw > 10 ? 0.01 : 1)
    }
    object.traverse(o => { if (o.isSkinnedMesh) o.frustumCulled = false })

    const clips = her.animations.filter(c => c.duration > 0.1).slice(0, 1)
    for (const file of clipFiles) {
      try {
        const extra = await open(assets + file)
        const clip = extra.animations[0]
        if (clip) { clip.name = file.replace(/\.\w+$/, ''); clips.push(clip) }
      } catch (err) { console.warn('[world] clip skipped:', file, err.message) }
    }

    // No clips at all is a perfectly good body: she stands, and she travels.
    if (!clips.length) return { object }

    const mixer = new THREE.AnimationMixer(object)
    const actions = clips.map(c => mixer.clipAction(c))
    let current = -1
    // The clip she waits in is named, not positional: the ginga is the step a
    // capoeirista keeps up between moves, which is the right thing to be doing
    // while watching someone read.
    const calm = Math.max(0, clips.findIndex(c => c.name.toLowerCase().includes(waiting)))

    const playClip = (i, fade = FADE, speed = 1) => {
      if (!actions[i]) return
      if (i === current) { actions[i].setEffectiveTimeScale(speed); return }
      const next = actions[i]
      next.enabled = true
      next.setEffectiveTimeScale(speed).setEffectiveWeight(1)
      next.reset().play()
      if (actions[current] && fade) actions[current].crossFadeTo(next, fade, true)
      else if (actions[current]) actions[current].stop()
      current = i
    }
    playClip(calm, 0)

    return {
      object,
      update: dt => mixer.update(dt),
      rest: () => playClip(calm, FADE, 0.45),          // the ginga, slowed: she is waiting on you
      go: () => {
        const others = actions.map((_, i) => i).filter(i => i !== calm)
        playClip(others.length ? others[Math.floor(Math.random() * others.length)] : calm, FADE, 1)
      },
    }
  }

  /* ---- where a window is, in the world -----------------------------------
   * A rectangle on the screen, back-projected. Two things decide where she
   * stands: which part of her the window is to frame (CROPS, above) and how
   * much of the rectangle that part should fill. Given those there is exactly
   * one depth at which the crop fills the rectangle, and one point at that
   * depth that lands on the rectangle's centre. */

  /** The crop in metres off her measured height, so a head shot of a 0.7 m
   *  bust and of a 1.7 m figure both come out as a head shot. */
  function crop() {
    const her = body?.height ?? 1.7
    const c = CROPS[framing] ?? CROPS[CROP]
    return { span: Math.max(0.05, c.span * her), centre: c.centre * her }
  }

  /** The rig position that puts a point `centre` metres above her feet at the
   *  given place on the screen, `depth` metres in front of the camera. */
  function placeAt(ndcX, ndcY, depth, centre, out = new THREE.Vector3()) {
    out.set(ndcX, ndcY, 0.5).unproject(camera)
    out.sub(camera.position).normalize()
      .multiplyScalar(Math.min(24, Math.max(1.2, depth)))      // never inside the reader's face
      .add(camera.position)
    out.y -= centre          // the anchor is her feet; the screen point is the crop's middle
    return out
  }

  function anchorFor(rect, out = new THREE.Vector3()) {
    const { span, centre } = crop()
    const wantedFraction = (rect.height / innerHeight) * fill
    const visible = span / Math.max(wantedFraction, 0.001)     // metres visible at that depth
    const depth = visible / (2 * Math.tan((camera.fov * Math.PI / 180) / 2))
    const ndcX = ((rect.left + rect.width / 2) / innerWidth) * 2 - 1
    const ndcY = -(((rect.top + rect.height / 2) / innerHeight) * 2 - 1)
    return placeAt(ndcX, ndcY, depth, centre, out)
  }

  /* ---- how big she is, right now -----------------------------------------
   * Handed to the body every frame as the second argument to update(), so a
   * body that can trade detail for speed has a number to trade against
   * instead of a guess. She is usually seen through a 60 mm window, which is
   * about 170 screen pixels of her: a cloud of a hundred thousand points has
   * more points than there are pixels to put them in, and only the body knows
   * what to do about that.
   *
   *   pixels        her height on screen now, in CSS pixels
   *   devicePixels  the same in real pixels, which is what fill rate costs
   *   state         watching | coming | going | away
   *   inWindow      is her middle inside a window, or behind the page
   */
  function bodyInfo() {
    camera.getWorldDirection(forward)
    toHer.copy(rig.position).sub(camera.position)
    const depth = Math.max(0.1, toHer.dot(forward))
    const metresVisible = 2 * depth * Math.tan((camera.fov * Math.PI / 180) / 2)
    info.pixels = (body.height / metresVisible) * innerHeight
    info.devicePixels = info.pixels * renderer.getPixelRatio()
    // framed: the height of the crop the window shows, in CSS pixels. All of
    // her is on the screen; only this much of her is through the opening.
    info.framed = (crop().span / metresVisible) * innerHeight
    info.state = state
    screen.copy(rig.position)
    screen.y += crop().centre        // the part the window frames, not her middle
    screen.project(camera)
    const sx = (screen.x * 0.5 + 0.5) * innerWidth
    const sy = (-screen.y * 0.5 + 0.5) * innerHeight
    info.inWindow = screen.z < 1 && windows.some(w =>
      sx >= w.rect.left && sx <= w.rect.right && sy >= w.rect.top && sy <= w.rect.bottom)
    return info
  }

  /** Somewhere in the room that is not a window: off doing what she does.
   *
   *  She stays inside the room the reader is looking into rather than leaving
   *  it. A page is a translucent sheet, so a figure in frame but behind it is
   *  a faint shape through the writing, which is the point: she is always
   *  there, and a window is only where she stops being faint. The point is
   *  chosen on the screen and back-projected, so she is in frame whatever
   *  shape the window is, and far enough back for the mist to have her. */
  function wanderPoint(out = new THREE.Vector3()) {
    const her = body?.height ?? 1.7
    const depth = rand(6.5, 12)
    const halfV = depth * Math.tan((camera.fov * Math.PI / 180) / 2)
    const room = Math.max(0, 1 - (her / 2) / halfV)   // how far her middle can go before she is cut off
    return placeAt(rand(-0.78, 0.78), rand(-room, room) * 0.55, depth, her / 2, out)
  }

  const face = at => rig.lookAt(at.x, rig.position.y + (body?.height ?? 1.7) * 0.5, at.z)

  /* ---- the two things she does -------------------------------------------- */
  function goWatch(rect) {
    state = 'coming'
    target = { rect }
    from = rig.position.clone()
    progress = 0
    body.rest?.()
  }

  function goAway(immediate = false) {
    state = immediate ? 'away' : 'going'
    target = { point: wanderPoint() }
    from = rig ? rig.position.clone() : new THREE.Vector3()
    progress = 0
    body?.go?.()
    if (immediate && rig) {
      rig.position.copy(target.point)
      until = performance.now() / 1000 + rand(...AWAY)
    }
  }

  /** Pick a window she is not already at. Prefers one with nothing in it. */
  function chooseWindow() {
    const clear = windows.filter(w => w.clear !== false)      // not under the panel
    const open = clear.filter(w => w.open)                    // nothing running in it
    const pool = open.length ? open : clear.length ? clear : windows
    if (!pool.length) return null
    return pool[Math.floor(Math.random() * pool.length)]
  }

  function behave(now, dt) {
    if (!rig) return
    if (quiet) {                                   // reduced motion: she holds one window, barely moving
      const w = windows.find(x => x.open) ?? windows[0]
      if (w) rig.position.copy(anchorFor(w.rect, tmp))
      face(camera.position)
      return
    }

    if (state === 'coming' || state === 'going') {
      progress = Math.min(1, progress + dt / TRAVEL)
      const end = target.rect ? anchorFor(target.rect, tmp) : target.point
      rig.position.lerpVectors(from, end, ease(progress))
      if (progress >= 1) {
        state = target.rect ? 'watching' : 'away'
        until = now + rand(...(target.rect ? WATCH : AWAY))
      }
    } else if (state === 'watching') {
      rig.position.copy(anchorFor(target.rect, tmp))     // stay in the window as the page moves
      if (now > until && held !== 'watch') goAway()
    } else if (state === 'away') {
      if (held === 'away') {
        // kept away: she goes on wandering rather than waiting to be let back
        if (now > until) { target = { point: wanderPoint() }; from = rig.position.clone(); progress = 0; state = 'going' }
      } else if (now > until || held === 'watch') {
        // held at a window, she takes the first one to appear rather than
        // waiting out a timer she was never going to finish
        const w = chooseWindow()
        if (w) goWatch(w.rect)
        else if (now > until) { target = { point: wanderPoint() }; from = rig.position.clone(); progress = 0; state = 'going' }
      }
    }

    // At or heading to a window she faces the reader; otherwise the way she is going.
    if (state === 'watching' || state === 'coming') face(camera.position)
    else if (target?.point) face(target.point)
  }

  /* ---- the loop ----------------------------------------------------------- */
  function frame(t) {
    raf = requestAnimationFrame(frame)
    const now = t / 1000
    const dt = Math.min(now - last, 0.1)
    last = now
    carry += dt
    if (carry < 1 / MAX_FPS) return
    const step = carry
    carry = 0
    if (body && rig) body.update?.(step, bodyInfo())
    behave(now, step)
    updateShade()
    renderer.render(scene, camera)
  }

  function play() {
    if (running || !renderer || paused) return
    running = true
    last = performance.now() / 1000
    raf = requestAnimationFrame(frame)
  }

  function stop() {
    running = false
    if (raf) cancelAnimationFrame(raf)
    raf = null
  }

  /** One frame, for a paused room whose page has moved underneath it: she
   *  belongs in the window that is there now. A journey cannot be shown in a
   *  single frame, so she arrives rather than setting off — being frozen
   *  halfway to somewhere reads as a fault, not as a pause. */
  function renderOnce() {
    if (!renderer || !rig) return
    const now = performance.now() / 1000
    if (state === 'coming' && target?.rect) {
      rig.position.copy(anchorFor(target.rect, tmp))
      progress = 1; state = 'watching'; until = now + rand(...WATCH)
    } else if (state === 'going' && target?.point) {
      rig.position.copy(target.point)
      progress = 1; state = 'away'; until = now + rand(...AWAY)
    }
    behave(now, 0)
    updateShade()
    renderer.render(scene, camera)
  }

  /** Stop the room, or start it again. This is the reader's own switch, so it
   *  outranks play(): coming back to the tab does not undo it. */
  function setPaused(v) {
    paused = !!v
    if (paused) { stop(); renderOnce() }
    else play()
    return paused
  }

  /**
   * Tell the world where the windows are now.
   * @param {{rect: DOMRect|{left,top,width,height}, open: boolean}[]} list
   */
  function setWindows(list) {
    windows = list.filter(w => w.rect.width > 40 && w.rect.height > 40)
    // if she is watching a window that has gone (a page turned), send her off —
    // unless the reader is holding her at a window, in which case she moves to
    // whatever window this page has instead of leaving
    if (state === 'watching' || state === 'coming') {
      const still = windows.find(w => near(w.rect, target?.rect))
      if (!still) {
        const w = held === 'watch' ? chooseWindow() : null
        if (w) goWatch(w.rect)
        else goAway()
      } else if (still.clear === false) {
        // the panel has opened over the window she is in: step aside to a
        // clear one if the page has one, and stay put if it has not
        const w = windows.find(x => x.clear !== false && x.open) ?? windows.find(x => x.clear !== false)
        if (w) goWatch(w.rect)
      }
    }
    if (paused) renderOnce()        // the page moved; she should be where its windows are
  }

  const near = (a, b) => !!a && !!b && Math.abs(a.left - b.left) < 2 && Math.abs(a.top - b.top) < 2

  /** Send her to a window now, rather than waiting for her to choose one.
   *  Useful while writing: check she frames well in a particular opening.
   *  __world.visit() takes the first open one, __world.visit(2) the third. */
  function visit(i = 0) {
    const open = windows.filter(w => w.open)
    const w = (open.length ? open : windows)[i]
    if (w && rig) goWatch(w.rect)
    return !!w
  }

  /* ---- what the reader can decide ----------------------------------------
   * Three settings and two commands, which is the whole of the panel in
   * lib/reader.js. Each is clamped here rather than there, so nothing a
   * control sends can put her somewhere she cannot be.
   *
   *   fill      how much of the window's height the crop is asked to fill
   *   framing   which part of her the window frames: her head, her bust, or
   *             the whole figure, as it was before there was a choice
   *   presence  where the mist begins: low and she is a rumour behind the
   *             page, high and she is as crisp as the room allows
   *   hold      'watch' keeps her at a window, 'away' leaves her to the room,
   *             null gives her back her own mind
   */
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, Number.isFinite(+v) ? +v : lo))

  function setFill(v) {
    fill = clamp(v, 0.3, 1)
    return fill
  }

  /** 0 → fog from 1 m, 1 → from 17 m. The default, 0.5, is 9 m to 26 m. */
  function setPresence(v) {
    presence = clamp(v, 0, 1)
    if (scene?.fog) {
      scene.fog.near = 1 + presence * 16
      scene.fog.far = scene.fog.near + 17
    }
    return presence
  }

  /** Which part of her a window frames: 'head', 'bust' or the whole 'figure'.
   *  She is re-placed at once if she is standing in one already. */
  function setFraming(name) {
    if (CROPS[name]) framing = name
    if (rig && target?.rect && (state === 'watching' || state === 'coming')) {
      rig.position.copy(anchorFor(target.rect, tmp))
    }
    return framing
  }

  /** Which of the five rooms she is in, 0 dark to 4 light. The page's own
   *  colours are the stylesheet's business; this is only what is behind them. */
  function setRoom(level) {
    room = roomAt(level)
    const bg = new THREE.Color(room.bg ?? colour)
    if (scene) {
      scene.background = bg
      if (scene.fog) scene.fog.color.copy(bg)
    }
    if (floor) { floor.visible = room.floorOn; floor.material.color.setHex(room.floor) }
    if (hemi) hemi.groundColor.setHex(room.ground)
    updateShade()
    return ROOMS.indexOf(room)
  }

  /** Hold her at a window, or away, or hand her back to herself. */
  function hold(mode = null) {
    held = mode === 'watch' || mode === 'away' ? mode : null
    if (held === 'watch' && state !== 'watching' && state !== 'coming') visit()
    if (held === 'away' && (state === 'watching' || state === 'coming')) goAway()
    return held
  }

  /** The next window along from the one she is at: for finding the framing. */
  function nextWindow() {
    if (!windows.length) return false
    const at = windows.findIndex(w => near(w.rect, target?.rect))
    const w = windows[(at + 1) % windows.length]
    if (w && rig) goWatch(w.rect)
    return !!w
  }

  return {
    start, stop, play, setWindows, visit,
    setFill, setPresence, setFraming, setRoom, setPaused, hold, nextWindow,
    away: () => goAway(),
    // What she is made of is hers to describe: a body that advertises `params`
    // and `set` gets controls in the panel, and this file never learns what any
    // of them mean. A body that advertises nothing simply has none.
    get params() { return body?.params ?? [] },
    setParam: (key, v) => body?.set?.(key, v),
    resetParams: () => body?.reset?.(),
    get canvas() { return canvas },
    get ready() { return !!rig },
    get state() { return state },
    get held() { return held },
    get playing() { return running },
    get paused() { return paused },
    get fill() { return fill },
    get presence() { return presence },
    get framing() { return framing },
    get room() { return ROOMS.indexOf(room) },
    get rooms() { return ROOMS.map(r => r.name) },
    get crops() { return Object.keys(CROPS) },
    get height() { return body?.height ?? null },
    get body() { return body },          // a handle on whatever she is, for DevTools
    get info() { return rig ? { ...bodyInfo() } : null },
    get windows() { return windows },
  }
}
