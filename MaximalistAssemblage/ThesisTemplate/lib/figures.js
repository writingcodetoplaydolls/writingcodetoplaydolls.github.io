// Figures in the text.
//
// A chapter's markdown asks for a figure with a directive; the build turns that
// into a <figure> carrying everything needed to run it, and this module finds
// them and runs them. Four kinds:
//
//   sketch   a module from src/sketches, run inline through lib/embed.js, so it
//            shares the page's grid, its own lil-gui and its own XR button
//   embed    a page that is already finished and published on its own (the
//            Bouquet, the comps graph, a p5 sketch): an iframe, lazily loaded
//   video    a video element with the page's controls
//   image    a still, for the figure that is only a picture
//
// Nothing runs until the reader is near it, nothing keeps running once they
// have scrolled past, and only a few WebGL contexts are alive at a time
// (browsers allow about eight; past that the oldest is silently killed, which
// looks like a bug). The figure furthest from the reader is given up first and
// falls back to its poster, which is also what print and a browser with no
// WebGL show.

import { createEmbed, createXRButton, hasWebGL } from './embed.js'

// Live WebGL contexts for figures at once. The room behind the pages
// (lib/world.js) holds one of its own for as long as the document is open, and
// a browser gives out about eight before it starts killing them silently.
const MAX_LIVE = 3
const NEAR = '400px'               // start a figure this far before it reaches the viewport
const registry = []                // every figure on the page, in document order
let queue = Promise.resolve()      // figures boot one at a time
let ioRoot = null                  // the element figures are watched inside, if not the window
let nearIO = null, screenIO = null
let notify = null                  // called when a figure starts or stops, so the holes are re-cut

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
const saveData = !!navigator.connection?.saveData
const isDev = () => document.body.dataset.mode === 'dev'

/** Start every figure on the page. Called once, by the chapter page. */
export function mountFigures(root = document, { onChange } = {}) {
  notify = onChange ?? null
  for (const el of root.querySelectorAll('figure[data-fig]')) register(el)
  observe()
  window.__figures = registry        // a handle in DevTools, as the sketches have

  // A figure linked to directly should come up without waiting for a scroll.
  if (location.hash) {
    const target = registry.find(f => '#' + f.el.id === location.hash)
    if (target) boot(target)
  }
  return registry
}

function register(el) {
  const stage = el.querySelector('.fig-stage')
  if (!stage) return
  // A window is an opening and nothing else: no bar, no boot, no budget. The
  // hole in the page is cut by lib/windows.js, which reads the DOM directly.
  if (el.dataset.fig === 'window') return
  const fig = {
    el, stage,
    id: el.id,
    kind: el.dataset.fig,
    module: el.dataset.module || '',
    src: el.dataset.src || '',
    title: el.dataset.title || 'Figure',
    weight: el.dataset.weight || '',
    fullpage: el.dataset.fullpage || '',
    params: el.dataset.params ? safeJson(el.dataset.params) : {},
    // autoplay=always starts the figure whatever the reader's machine asks
    // for. It is the author's call, figure by figure, and it stays within AA:
    // WCAG 2.2.2 wants moving content to be stoppable, which the figure's own
    // pause is. Waiting for a click under reduced motion is a courtesy beyond
    // that, and a sketch that is the argument rather than decoration loses
    // more by sitting still than it gains by waiting.
    autoplay: el.dataset.autoplay === 'always'
      || (el.dataset.autoplay !== 'false' && !reducedMotion && !saveData),
    poster: stage.querySelector('.fig-poster'),
    hintEl: null, embed: null, iframe: null,
    seenAt: 0, booted: false,
  }
  registry.push(fig)

  if (fig.kind === 'sketch' && !hasWebGL()) {
    stage.classList.add('no-webgl')
    return                                   // poster and the fallback line stand in
  }
  if (fig.kind === 'sketch' || fig.kind === 'embed') chrome(fig)
}

function safeJson(s) {
  try { return JSON.parse(s) } catch { return {} }
}

/* ---- the bar across the top of a figure, and the start plate ------------- */
function chrome(fig) {
  const bar = document.createElement('div')
  bar.className = 'fig-bar'
  bar.innerHTML = `<span class="fig-title"></span><span class="fig-hint"></span><span class="spacer"></span>`
  bar.querySelector('.fig-title').textContent = fig.title
  fig.hintEl = bar.querySelector('.fig-hint')

  if (fig.kind === 'sketch') {
    createXRButton(() => fig.embed?.renderer).then(btn => btn && bar.appendChild(btn))
    if (isDev()) bar.appendChild(button('poster', () => savePoster(fig), 'save a still for print and for the fallback'))
  }
  if (document.fullscreenEnabled) bar.appendChild(button('expand', () => toggleFullscreen(fig.stage), 'fill the window'))
  if (fig.fullpage) {
    const a = document.createElement('a')
    a.href = fig.fullpage
    a.target = '_blank'
    a.rel = 'noopener'
    a.textContent = 'own page'
    a.title = 'open this figure on its own page'
    bar.appendChild(a)
  }
  fig.stage.appendChild(bar)

  if (!fig.autoplay) {
    const plate = document.createElement('button')
    plate.type = 'button'
    plate.className = 'fig-start'
    plate.innerHTML = `<span class="play">&#9654;</span><span class="what"></span><span class="weight"></span>`
    plate.querySelector('.what').textContent = fig.title
    plate.querySelector('.weight').textContent = fig.weight
      ? fig.weight
      : reducedMotion ? 'starts on a click (you asked for less motion)' : 'starts on a click'
    plate.addEventListener('click', () => { plate.hidden = true; boot(fig, true) })
    fig.stage.appendChild(plate)
    fig.plate = plate
  }
}

function button(label, onClick, title = '') {
  const b = document.createElement('button')
  b.type = 'button'
  b.textContent = label
  if (title) b.title = title
  b.addEventListener('click', onClick)
  return b
}

function toggleFullscreen(stage) {
  if (document.fullscreenElement === stage) document.exitFullscreen()
  else stage.requestFullscreen?.().catch(err => console.warn('fullscreen refused:', err.message))
}

/* ---- who runs and who sleeps -------------------------------------------- */
/** Give every figure up and forget them: a chapter is being swapped out from
 *  under us by a soft navigation (lib/reader.js). The room behind the pages is
 *  not touched — that is the point of navigating this way. */
export function resetFigures() {
  nearIO?.disconnect()
  screenIO?.disconnect()
  nearIO = screenIO = null
  for (const fig of [...registry]) release(fig)
  registry.length = 0
  queue = Promise.resolve()
}

/** Watch figures inside this element instead of inside the window. Book mode
 *  keeps every spread in the page, moved sideways, so "on screen" means inside
 *  the book's viewport; scrolling mode passes null and means the window. */
export function setScrollRoot(el) {
  if (el === ioRoot) return
  ioRoot = el ?? null
  if (registry.length) observe()
}

function observe() {
  if (!registry.length) return
  nearIO?.disconnect()
  screenIO?.disconnect()

  // near the viewport: worth having ready
  nearIO = new IntersectionObserver(entries => {
    for (const e of entries) {
      const fig = registry.find(f => f.el === e.target)
      if (!fig) continue
      if (e.isIntersecting) { fig.seenAt = performance.now(); if (fig.autoplay) boot(fig) }
      else retire(fig)
    }
  }, { root: ioRoot, rootMargin: ioRoot ? '0px' : NEAR })

  // actually on screen: worth spending frames on
  screenIO = new IntersectionObserver(entries => {
    for (const e of entries) {
      const fig = registry.find(f => f.el === e.target)
      if (!fig) continue
      if (e.isIntersecting) { fig.seenAt = performance.now(); fig.embed?.resume() }
      else fig.embed?.pause()
    }
  }, { root: ioRoot, rootMargin: '0px', threshold: 0 })

  for (const fig of registry) { nearIO.observe(fig.el); screenIO.observe(fig.el) }
  if (observe.wired) return
  observe.wired = true

  // A tab in the background should cost nothing at all.
  document.addEventListener('visibilitychange', () => {
    for (const fig of registry) {
      if (document.hidden) fig.embed?.pause()
      else if (isOnScreen(fig.el)) fig.embed?.resume()
    }
  })
}

function isOnScreen(el) {
  const r = el.getBoundingClientRect()
  if (!ioRoot) return r.bottom > 0 && r.top < innerHeight
  const v = ioRoot.getBoundingClientRect()
  return r.bottom > v.top && r.top < v.bottom && r.right > v.left && r.left < v.right
}

/** Start a figure, waiting its turn so two never load at once. */
function boot(fig, force = false) {
  if (fig.booted) { fig.embed?.resume(); return queue }
  if (fig.kind !== 'sketch' && fig.kind !== 'embed') return queue
  if (!fig.autoplay && !force) return queue
  fig.booted = true
  makeRoom(fig)
  queue = queue.then(() => (fig.kind === 'sketch' ? bootSketch(fig) : bootEmbed(fig))).catch(err => {
    console.error(`[figure ${fig.title}]`, err)
    fig.booted = false
    setHint(fig, `this figure could not start: ${err.message}`)
  })
  return queue
}

async function bootSketch(fig) {
  setHint(fig, 'loading…')
  const sketch = await import(/* @vite-ignore */ fig.module)
  fig.embed = createEmbed(sketch, {
    stage: fig.stage,
    title: fig.title,
    params: fig.params,
    onHint: text => setHint(fig, text),
    onState: s => {
      fig.el.dataset.state = s
      if (fig.poster) fig.poster.hidden = s === 'running' || s === 'paused'
      if (s === 'gone' && fig.plate) fig.plate.hidden = false
      notify?.()
    },
  })
  await fig.embed.start()
  if (!isOnScreen(fig.el)) fig.embed.pause()
}

async function bootEmbed(fig) {
  setHint(fig, 'loading…')
  const iframe = document.createElement('iframe')
  iframe.src = fig.src
  iframe.title = fig.title
  iframe.loading = 'lazy'
  iframe.allow = 'xr-spatial-tracking; fullscreen; autoplay'
  iframe.allowFullscreen = true
  iframe.addEventListener('load', () => { setHint(fig, ''); if (fig.poster) fig.poster.hidden = true })
  fig.stage.appendChild(iframe)
  fig.iframe = iframe
  fig.el.dataset.state = 'running'
  notify?.()
}

/** Pause what has scrolled away; give up the context of what is far away. */
function retire(fig) {
  fig.embed?.pause()
  const live = registry.filter(isLive)
  if (live.length > MAX_LIVE) release(fig)
}

/** Before booting, make sure there is a context free for it. */
function makeRoom(incoming) {
  const live = registry.filter(f => f !== incoming && isLive(f))
  if (live.length < MAX_LIVE) return
  live.sort((a, b) => a.seenAt - b.seenAt)                       // least recently seen first
  for (const fig of live.slice(0, live.length - MAX_LIVE + 1)) release(fig)
}

const isLive = f => (f.embed && f.embed.state !== 'gone') || !!f.iframe

function release(fig) {
  if (fig.embed) { fig.embed.dispose(); fig.embed = null }
  if (fig.iframe) { fig.iframe.remove(); fig.iframe = null }
  if (fig.poster) fig.poster.hidden = false
  if (fig.plate) fig.plate.hidden = false
  fig.booted = false
  fig.el.dataset.state = 'gone'
  setHint(fig, '')
  notify?.()
}

function setHint(fig, text) {
  if (fig.hintEl) fig.hintEl.textContent = text ?? ''
}

/* ---- posters -------------------------------------------------------------
 * Print needs a still of every figure, and so does a browser with no WebGL.
 * Rather than a headless-browser capture step, the figure itself offers a
 * "poster" button while the dev server is running: set the figure up the way it
 * should be seen and press it. The frame is drawn again immediately before
 * reading the canvas, because a WebGL drawing buffer is not kept after it has
 * been composited.
 *
 * The still goes to the dev server, which writes it into thesis/posters/ for
 * the next build (the thesis-posters plugin in vite.config.js). With no server
 * to take it — the published site, a page opened off the disk — it falls back
 * to a download, which is then a file to move by hand. */
async function savePoster(fig) {
  const ctx = fig.embed?.ctx
  if (!ctx) { setHint(fig, 'start the figure first'); return }
  ctx.renderer.render(ctx.scene, ctx.camera)
  const url = ctx.renderer.domElement.toDataURL('image/jpeg', 0.82)
  const name = `${fig.id || 'figure'}.jpg`
  try {
    const res = await fetch(`/__poster/${name}`, { method: 'POST', body: url })
    if (!res.ok) throw new Error(await res.text())
    setHint(fig, `saved into thesis/posters/${name} — build again to use it`)
  } catch (err) {
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    setHint(fig, `saved ${name} to downloads — move it into thesis/posters/`)
  }
}
