// The reading shell.
//
// What belongs to the document and is set up once: the room behind the pages,
// the windows cut through them, the navigator, the contents rail, how solid a
// page is, and the interception of links. What belongs to one chapter and is
// torn down and built again every time a chapter is swapped in: the book, the
// figures, the section list, the sidenotes.
//
// Chapters are swapped rather than loaded, which is the whole reason for that
// division: the room is a WebGL context that takes a second to start and holds
// a figure who is in the middle of doing something. Following a link the
// ordinary way would throw her away and begin again. So a link to another
// chapter is intercepted, the chapter is fetched, and only the text is
// replaced. If any of that fails the link is followed normally.

import { createBook } from './book.js'
import { createWorld } from './world.js'
import { createWindows } from './windows.js'
import { createNavigator } from './navigator.js'
import { mountFigures, resetFigures, setScrollRoot } from './figures.js'

/* ---- what is remembered about a reader ----------------------------------
 * localStorage can throw and can come back empty, so every touch is wrapped
 * and the page is correct without it. */
const read = key => { try { return localStorage.getItem(key) } catch { return null } }
const write = (key, v) => { try { v ? localStorage.setItem(key, v) : localStorage.removeItem(key) } catch {} }

const MODE = 'thesis-mode'
const ROOM = 'thesis-room'              // 0..4, dark to light; 1 is the default
const STILL = 'thesis-still'            // the reader stopped the room moving
const ALPHA = 'thesis-page-alpha'
const FILL = 'thesis-her-fill'
const PRESENCE = 'thesis-her-presence'
const FRAMING = 'thesis-her-framing'
const PANEL = 'thesis-panel'
const SKIN = 'thesis-skin-'              // one key per tuning value the body advertises
const TUNE = 'thesis-tune'               // whether the panel is here at all

const quiet = matchMedia('(prefers-reduced-motion: reduce)').matches

/* ---- stopping the room ---------------------------------------------------
 * WCAG 2.2.2, Pause Stop Hide: content that moves by itself for longer than
 * five seconds beside other content has to be stoppable. The room does, so it
 * is. Asking for reduced motion stops it to begin with, unless the reader has
 * since said otherwise. */
const stillKept = () => read(STILL)
const still = () => (stillKept() === null ? quiet : stillKept() === '1')
const paintStill = on => {
  const b = document.querySelector('[data-still]')
  if (!b) return
  b.textContent = on ? 'start the room' : 'stop the room'
  b.setAttribute('aria-pressed', String(on))
  b.title = on ? 'let the room behind the page move again' : 'hold the room behind the page still'
}

/* ---- which room ----------------------------------------------------------
 * Five steps, dark to light, the ramp in lib/world.js. The room behind the
 * page lightens the whole way; the page itself can only be read one way up or
 * the other, so it stays dark until the last step and turns over there. The
 * attribute on <html> is what the stylesheet's :root[data-theme="light"] block
 * waits for; the world is told separately, its background being WebGL. */
const ROOM_NAMES = ['black', 'dark', 'grey', 'pale', 'light']
const ROOM_PAGE = ['dark', 'dark', 'dark', 'light', 'light']
// The least solid the page may be in each room and still hold every ink at
// WCAG AA, 4.5:1. Measured rather than guessed, and it is --ink-faint that
// fails first: a translucent page over a mid-tone room leaves nothing to write
// on, which is why the middle of the range is nearly opaque.
const ROOM_FLOOR = [0.25, 0.48, 0.81, 0.88, 0.47]
const ROOM_DEFAULT = 1
const roomLevel = () => {
  const v = Math.round(+read(ROOM))
  return Number.isFinite(v) && v >= 0 && v < ROOM_NAMES.length ? v : ROOM_DEFAULT
}
const paintRoom = level => {
  document.documentElement.dataset.theme = ROOM_PAGE[level]
  for (const el of document.querySelectorAll('[data-page-alpha]')) {
    el.min = String(ROOM_FLOOR[level])
    if (+el.value < ROOM_FLOOR[level]) {
      el.value = String(ROOM_FLOOR[level])
      el.dispatchEvent(new Event('input', { bubbles: true }))
    }
  }
  for (const out of document.querySelectorAll('[data-out="room"]')) out.textContent = ROOM_NAMES[level]
  for (const el of document.querySelectorAll('[data-room]')) if (+el.value !== level) el.value = String(level)
}
paintRoom(roomLevel())

let config = { base: '/', world: {}, places: [] }
let world = null
let windows = null
let nav = null
let book = null
let modeButton = null
let renderedPath = location.pathname     // the chapter actually in the page: on a
                                         // popstate, location has already moved on
const railLinks = new Map()
let currentHeading = null

/* ---- the room ------------------------------------------------------------ */
function startWorld() {
  const w = createWorld({ ...(config.world ?? {}), quiet, room: roomLevel(), onBody: () => buildSkinControls() })
  if (!w.start()) { document.body.classList.add('no-world'); return null }
  if (still()) w.setPaused(true)
  window.__world = w          // a handle in DevTools, as the sketches have
  return w
}

/* ---- her panel -----------------------------------------------------------
 * The controls for the room behind the page: how solid the page is over her,
 * how much of a window she fills, how far back the mist starts, and whether
 * she is held at a window, left to the room, or left to herself.
 *
 * It lives outside .sheetbox, so it is wired once and survives every chapter
 * swap. Everything it sets is remembered, and everything it sets is clamped in
 * lib/world.js rather than here — a control sends a number, the world decides
 * what it is allowed to mean.
 */
const applyAlpha = v => document.documentElement.style.setProperty('--page-alpha', String(v))

const pct = v => `${Math.round(v * 100)}%`

/** A stored number, or the default when there is nothing stored or it is junk. */
function saved(key, fallback, lo, hi) {
  const v = parseFloat(read(key) ?? '')
  return Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback
}

/** One slider, its readout, and what it does. Several sliders may share a key. */
function wireSlider(selector, { value, lo, hi, store, apply }) {
  const sliders = [...document.querySelectorAll(selector)]
  const show = v => {
    for (const s of sliders) {
      s.value = String(v)
      const out = s.parentElement?.querySelector('output')
      if (out) out.textContent = pct(v)
    }
  }
  apply(value)
  show(value)
  for (const s of sliders) {
    s.addEventListener('input', () => {
      const v = parseFloat(s.value)
      if (!Number.isFinite(v)) return
      apply(v)
      show(v)
      write(store, String(v))
    })
  }
  return sliders.length > 0
}

/* ---- her surface ---------------------------------------------------------
 * What she is made of is hers to describe. A body module that advertises
 * `params` — the Bubbles displacement, the contrast, the point size and the
 * rest — gets a control each, built here from the description it gives and
 * sent back through `set`, which clamps. Nothing in the thesis knows what any
 * of them mean, so a later body with different knobs needs no change here.
 *
 * The body arrives a second or two after the page does, so this is called from
 * the world's onBody rather than at startup.
 */
const fmt = (p, v) => {
  const n = (v * (p.scale ?? 1)).toFixed(p.digits ?? 2)
  return p.unit === 'mm' ? `${n} mm` : `${n}${p.unit ?? ''}`
}

function skinRow(p) {
  const row = document.createElement('label')
  row.dataset.skinKey = p.key
  const name = document.createElement('span')
  name.className = 'panel-label'
  name.textContent = p.label

  if (p.kind === 'toggle') {
    row.className = 'panel-toggle'
    const box = document.createElement('input')
    box.type = 'checkbox'
    box.checked = !!p.value
    box.addEventListener('change', () => {
      world.setParam(p.key, box.checked)
      write(SKIN + p.key, box.checked ? '1' : '0')
    })
    row.append(box, name)
    return row
  }

  const slider = document.createElement('input')
  slider.type = 'range'
  slider.min = p.min; slider.max = p.max; slider.step = p.step
  slider.value = String(p.value)
  slider.setAttribute('aria-label', p.label)
  const out = document.createElement('output')
  out.textContent = fmt(p, p.value)
  slider.addEventListener('input', () => {
    const v = world.setParam(p.key, slider.value) ?? parseFloat(slider.value)
    out.textContent = fmt(p, v)
    write(SKIN + p.key, String(v))
  })
  row.append(name, slider, out)
  return row
}

/** Put the controls back in step with the body — after a reset, say. */
function refreshSkinControls() {
  const host = document.querySelector('[data-skin-controls]')
  if (!host || !world) return
  for (const p of world.params) {
    const row = host.querySelector(`[data-skin-key="${p.key}"]`)
    const input = row?.querySelector('input')
    if (!input) continue
    if (p.kind === 'toggle') input.checked = !!p.value
    else {
      input.value = String(p.value)
      const out = row.querySelector('output')
      if (out) out.textContent = fmt(p, p.value)
    }
  }
}

function buildSkinControls() {
  const host = document.querySelector('[data-skin-controls]')
  if (!host || !world) return
  // With the panel off she is as the thesis has her: a reader who once turned
  // the panel on and then off again must not be left with that tuning applied
  // out of their own browser, invisibly and with no way back.
  if (host.closest('[data-panel]')?.hidden !== false) return
  const params = world.params
  const box = host.closest('[data-skin]')
  if (box) box.hidden = !params.length
  if (!params.length) return

  host.textContent = ''
  let group = null
  for (const p of params) {
    // what she was last left at, before the control is drawn from her
    const kept = read(SKIN + p.key)
    if (kept !== null) world.setParam(p.key, p.kind === 'toggle' ? kept === '1' : parseFloat(kept))
    if (p.group && p.group !== group) {
      group = p.group
      const h = document.createElement('h4')
      h.textContent = group
      host.append(h)
    }
    host.append(skinRow(p))
  }

  const reset = document.createElement('button')
  reset.type = 'button'
  reset.className = 'panel-reset'
  reset.textContent = 'back to hers'
  reset.title = 'the values the module was built with'
  reset.addEventListener('click', () => {
    world.resetParams()
    for (const p of params) write(SKIN + p.key, null)
    refreshSkinControls()
  })
  host.append(reset)
}

/* ---- writing it down -----------------------------------------------------
 * The panel is a scratch pad: what it sets lives in this browser and nowhere
 * else. This is how a setting that turns out to be right leaves the browser
 * and becomes the thesis — the world block for thesis.json, carrying only
 * what has been moved away from what the body module itself shipped with.
 */
function settingsBlock() {
  const places = step => Math.min(5, Math.max(0, Math.ceil(-Math.log10(step || 0.01))))
  const num = (v, step) => String(+(+v).toFixed(places(step)))
  const lines = [
    `"framing": "${world.framing}"`,
    `"fill": ${num(world.fill, 0.01)}`,
    `"presence": ${num(world.presence, 0.01)}`,
  ]
  const moved = world.params.filter(p => p.value !== p.reset)
  if (moved.length) {
    const body = moved
      .map(p => `"${p.key}": ${p.kind === 'toggle' ? !!p.value : num(p.value, p.step)}`)
      .join(', ')
    lines.push(`"body": { ${body} }`)
  }
  return lines.join(',\n')
}

function copySettings(button) {
  const text = settingsBlock()
  const say = word => {
    const was = button.textContent
    button.textContent = word
    setTimeout(() => { button.textContent = was }, 1400)
  }
  if (!navigator.clipboard) { console.log(text); say('in the console'); return }
  navigator.clipboard.writeText(text).then(() => say('copied'), () => { console.log(text); say('in the console') })
}

/** The panel is in the dev preview and not on the published site, where ?tune
 *  turns it on and ?tune=off turns it off. The answer is remembered, because a
 *  soft chapter swap does not carry the query string with it. */
function tuneGate(panel) {
  const asked = new URLSearchParams(location.search).get('tune')
  if (asked !== null) {
    const on = asked !== 'off' && asked !== '0' && asked !== 'false'
    write(TUNE, on ? '1' : '0')
    panel.hidden = !on
  } else {
    const kept = read(TUNE)
    if (kept === '1') panel.hidden = false
    else if (kept === '0') panel.hidden = true
  }
  return !panel.hidden
}

function wirePanel() {
  // the reader's own control, which does not depend on the panel being here
  wireSlider('[data-page-alpha]', {
    value: saved(ALPHA, 0.86, 0.25, 1), lo: 0.25, hi: 1, store: ALPHA, apply: applyAlpha,
  })

  const panel = document.querySelector('[data-panel]')
  if (!panel) return
  if (!world) { document.body.classList.add('no-world'); panel.hidden = true; return }
  if (!tuneGate(panel)) return

  wireSlider('[data-her-fill]', {
    value: saved(FILL, world.fill, 0.3, 1), lo: 0.3, hi: 1, store: FILL,
    apply: v => world.setFill(v),
  })
  wireSlider('[data-her-presence]', {
    value: saved(PRESENCE, world.presence, 0, 1), lo: 0, hi: 1, store: PRESENCE,
    apply: v => world.setPresence(v),
  })

  // which part of her a window frames: her head by default, because a whole
  // figure in a 60 mm opening is a figure a long way off with no face in it
  const keptCrop = read(FRAMING)
  if (keptCrop) world.setFraming(keptCrop)
  const crops = [...panel.querySelectorAll('[data-crop]')]
  const markCrop = () => {
    for (const b of crops) b.setAttribute('aria-pressed', String(b.dataset.crop === world.framing))
  }
  markCrop()

  // where she is: three buttons, one of which is always the one in force
  const where = [...panel.querySelectorAll('[data-her="watch"], [data-her="auto"], [data-her="away"]')]
  const markWhere = () => {
    for (const b of where) {
      b.setAttribute('aria-pressed', String(b.dataset.her === (world.held ?? 'auto')))
    }
  }
  const playButton = panel.querySelector('[data-her="play"]')

  panel.addEventListener('click', e => {
    const c = e.target.closest('[data-crop]')
    if (c) {
      world.setFraming(c.dataset.crop)
      write(FRAMING, world.framing)
      markCrop()
      tick()
      return
    }
    const b = e.target.closest('[data-her]')
    if (!b) return
    switch (b.dataset.her) {
      case 'watch': world.hold('watch'); break
      case 'away': world.hold('away'); break
      case 'auto': world.hold(null); break
      case 'next': world.nextWindow(); break
      case 'play': world.playing ? world.stop() : world.play(); break
      case 'copy': copySettings(b); return        // nothing about her changed
    }
    markWhere()
    tick()
  })

  // the handle says what she is doing, so a reader who never opens it gets that much
  const dot = panel.querySelector('[data-her-dot]')
  const readout = panel.querySelector('[data-her-read]')
  const skinBox = panel.querySelector('[data-skin]')
  const skinNote = panel.querySelector('[data-skin-note]')
  let timer = null

  // Opening her surface is asking to look at her, so she is brought to a
  // window. One click on "let her be" undoes it. If the page has no window in
  // view there is nothing to bring her to, and the note says so: away and
  // behind the page she is drawn as a sparse whisper, and nothing retuned
  // would show.
  skinBox?.addEventListener('toggle', () => {
    if (skinBox.open && world.held !== 'watch') { world.hold('watch'); markWhere() }
    windows?.schedule()            // the panel changed size: it may now cover a window
    tick()
  })

  function tick() {
    if (document.hidden) return
    // retuning her surface is pointless if there is nowhere to watch it happen
    const seeable = world.windows.some(w => w.clear !== false)
    if (skinNote) skinNote.hidden = !(skinBox?.open && !seeable)
    const state = world.playing ? world.state : 'off'
    if (dot) dot.className = `panel-dot ${state}`
    if (playButton) playButton.textContent = world.playing ? 'pause' : 'play'
    if (!readout) return
    const px = world.info?.pixels
    readout.textContent = !world.ready ? 'waiting'
      : state === 'off' ? 'paused'
      : px ? `${state} · ${Math.round(px)} px` : state
  }

  // The closed handle is a readout too — the dot and what she is doing — so it
  // keeps ticking either way, just slowly enough to cost nothing.
  function watchPanel() {
    clearInterval(timer)
    tick()
    timer = setInterval(tick, panel.open ? 400 : 1500)
    windows?.schedule()            // opening or closing it changes what it covers
    write(PANEL, panel.open ? 'open' : '')
  }
  panel.addEventListener('toggle', watchPanel)
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick() })
  if (read(PANEL) === 'open') panel.open = true
  markWhere()
  watchPanel()
  buildSkinControls()          // in case she arrived before the panel was wired
}

/* ---- scrolling or a spread ----------------------------------------------- */
const roomForBook = () => matchMedia('(min-width: 64rem) and (min-height: 30rem)').matches
const prefersBook = () => (read(MODE) ?? 'book') === 'book'
const isChapter = () => document.body.classList.contains('chapter')

function setMode(mode) {
  write(MODE, mode)
  if (!book) return
  if (mode === 'book' && roomForBook()) book.enter()
  else book.leave()
  afterLayout()
}

function afterLayout() {
  setScrollRoot(book?.on ? book.viewport : null)
  modeLabel()
  position()
  windows?.schedule()
}

function modeLabel() {
  if (!modeButton) return
  const inBook = !!book?.on
  modeButton.hidden = !isChapter()
  modeButton.textContent = inBook ? 'scrolling' : 'book'
  modeButton.title = inBook ? 'read it as one scrolling column' : 'read it as a two-page spread'
  modeButton.setAttribute('aria-pressed', String(inBook))
}

/* ---- the contents rail ---------------------------------------------------
 * The chapter list and the drawer belong to the document and are wired once.
 * The section list belongs to the chapter and is rebuilt on every swap. */
function wireRail() {
  const rail = document.querySelector('.rail')
  if (!rail) return
  document.body.classList.add('has-rail')

  const open = document.querySelector('[data-rail-open]')
  const close = rail.querySelector('.rail-close')
  open?.addEventListener('click', () => document.body.classList.toggle('rail-open'))
  close?.addEventListener('click', () => document.body.classList.remove('rail-open'))
  rail.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]')
    document.body.classList.remove('rail-open')
    // In book mode a link to a section turns to the spread it is on, because
    // there is nothing to scroll.
    if (a && book?.on && book.goToElement(a.getAttribute('href').slice(1))) e.preventDefault()
  })
  addEventListener('keydown', e => { if (e.key === 'Escape') document.body.classList.remove('rail-open') })
}

function buildSections() {
  const here = document.querySelector('.rail [data-sections]')
  if (!here) return
  here.textContent = ''
  railLinks.clear()
  const headings = [...document.querySelectorAll('.page h2[id], .page h3[id]')]
  if (!headings.length) return
  const ol = document.createElement('ol')
  for (const h of headings) {
    const li = document.createElement('li')
    li.className = h.tagName === 'H3' ? 'lvl3' : 'lvl2'
    const a = document.createElement('a')
    a.href = '#' + h.id
    a.textContent = h.dataset.short || h.textContent.trim()
    railLinks.set(h.id, a)
    li.appendChild(a)
    ol.appendChild(li)
  }
  here.appendChild(ol)
}

function markRailChapter(pathname) {
  for (const a of document.querySelectorAll('.rail > ol a')) {
    const href = new URL(a.getAttribute('href'), location.href).pathname
    a.classList.toggle('here', href === pathname)
  }
}

/* ---- where you are -------------------------------------------------------
 * Scrolling: the last heading to have crossed the reading line. Book: the
 * heading the current spread sits under. Both end in the same place, and both
 * tell the navigator which cell the reader is in. */
const slugHere = () => {
  const name = location.pathname.slice(config.base.length).replace(/\.html$/, '')
  return name === '' || name === 'index' ? 'index' : name
}

/** Every heading of the chapter, in reading order, wherever it is being held:
 *  in the scrolling column, or spread across the pages of the book. */
const headingsHere = (sel = 'h2[id], h3[id]') => [
  ...document.querySelectorAll(sel.split(', ').flatMap(s => [`.sheetbox ${s}`, `.book-shell ${s}`]).join(', ')),
]

/** The place a heading belongs to: itself if it is a section, else the section
 *  above it. Walking previousElementSibling will not do: in book mode the
 *  section heading is usually on an earlier page, not an earlier sibling. */
function placeFor(h) {
  if (!h) return slugHere() === 'index' ? 'index' : null
  if (h.tagName === 'H2') return `${slugHere()}#${h.id}`
  const all = headingsHere()
  for (let i = all.indexOf(h); i >= 0; i--) {
    if (all[i].tagName === 'H2') return `${slugHere()}#${all[i].id}`
  }
  return null
}

function markHeading(h) {
  if (h !== currentHeading) {
    currentHeading = h
    for (const a of railLinks.values()) a.classList.remove('here')
    const where = document.querySelector('.topbar .where .section')
    if (h) {
      railLinks.get(h.id)?.classList.add('here')
      if (where) where.textContent = h.dataset.short || h.textContent.trim()
    } else if (where) where.textContent = ''
  }
  nav?.visit(placeFor(h))
}

function progress(fraction) {
  const bar = document.querySelector('.progress')
  if (bar) bar.style.width = `${Math.max(0, Math.min(1, fraction)) * 100}%`
}

function position() {
  if (book?.on) {
    const { index, count, heading } = book.current()
    markHeading(heading)
    progress(count > 1 ? (index + 1) / count : 1)
    windows?.schedule()                  // the spread moved: the holes moved with it
  } else {
    onScroll()
  }
}

function onScroll() {
  if (book?.on) return
  const headings = [...document.querySelectorAll('.page h2[id], .page h3[id]')]
  const line = innerHeight * 0.25
  let last = null
  for (const h of headings) if (h.getBoundingClientRect().top <= line) last = h
  markHeading(last)
  const max = document.documentElement.scrollHeight - innerHeight
  progress(max > 0 ? scrollY / max : 1)
}

/* ---- sidenotes ----------------------------------------------------------- */
function wireSidenotes() {
  for (const ref of document.querySelectorAll('.noteref')) {
    ref.addEventListener('click', e => {
      const note = document.getElementById(ref.getAttribute('href').slice(1))
      if (!note) return
      if (book?.on) { e.preventDefault(); book.goToElement(note); return }
      if (getComputedStyle(note).display === 'none' || note.classList.contains('open')) {
        e.preventDefault()
        note.classList.toggle('open')
        if (note.classList.contains('open')) note.scrollIntoView({ block: 'nearest' })
      }
    })
  }
}

/* ---- a link to every heading and figure --------------------------------- */
function wireAnchors() {
  document.addEventListener('click', e => {
    const a = e.target.closest('.anchor, .permalink')
    if (!a || !navigator.clipboard) return
    e.preventDefault()
    navigator.clipboard.writeText(new URL(a.getAttribute('href'), location.href).href).then(() => {
      const was = a.textContent
      a.textContent = 'copied'
      setTimeout(() => { a.textContent = was }, 1200)
    })
  })
}

/* ---- turning to another chapter without leaving the page ----------------- */
function wireLinks() {
  document.addEventListener('click', e => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const a = e.target.closest('a[href]')
    if (!a || a.target || a.hasAttribute('download')) return
    const url = new URL(a.getAttribute('href'), location.href)
    if (url.origin !== location.origin) return
    if (!url.pathname.startsWith(config.base)) return
    if (url.pathname !== config.base && !url.pathname.endsWith('.html')) return
    e.preventDefault()
    go(url.href)
  })
  addEventListener('popstate', () => go(location.href, false))
}

async function go(url, push = true) {
  const target = new URL(url, location.href)

  // somewhere in the chapter already shown: no fetch, just go there
  if (target.pathname === renderedPath) {
    if (push) history.pushState({}, '', target.href)
    const id = target.hash.slice(1)
    if (id) {
      if (book?.on) book.goToElement(id)
      else document.getElementById(id)?.scrollIntoView()
    }
    position()
    return
  }

  document.body.classList.add('turning')
  try {
    const res = await fetch(target.href, { credentials: 'same-origin' })
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
    const incomingDoc = new DOMParser().parseFromString(await res.text(), 'text/html')
    const incoming = incomingDoc.querySelector('.sheetbox')
    if (!incoming) throw new Error('no chapter in that page')

    unmountChapter()
    document.querySelector('.sheetbox').replaceWith(document.adoptNode(incoming))
    document.title = incomingDoc.title
    // the body class says which kind of page this is, but a few classes belong
    // to the document rather than to the chapter and have to survive the swap
    const keep = ['has-rail', 'no-world'].filter(c => document.body.classList.contains(c))
    document.body.className = incomingDoc.body.className
    document.body.classList.add(...keep)
    const whereB = document.querySelector('.topbar .where b')
    if (whereB) whereB.textContent = incomingDoc.querySelector('.topbar .where b')?.textContent ?? ''
    if (push) history.pushState({}, '', target.href)
    renderedPath = target.pathname
    markRailChapter(target.pathname)
    scrollTo(0, 0)
    mountChapter()
    const id = target.hash.slice(1)
    if (id) {
      if (book?.on) book.goToElement(id)
      else document.getElementById(id)?.scrollIntoView()
    }
  } catch (err) {
    console.warn('[thesis] could not swap the chapter, loading it instead:', err.message)
    location.href = target.href
  } finally {
    document.body.classList.remove('turning')
  }
}

/* ---- a chapter, in and out ----------------------------------------------- */
function mountChapter() {
  for (const host of document.querySelectorAll('[data-navigator]')) nav?.mount(host)
  buildSections()

  const host = document.querySelector('.book-shell')
  const page = document.querySelector('.page')
  if (isChapter() && host && page) {
    book = createBook({ page, host, onTurn: position })
    if (prefersBook() && roomForBook()) book.enter()
  }
  setScrollRoot(book?.on ? book.viewport : null)
  modeLabel()

  mountFigures(document, { onChange: () => windows?.schedule() })
  wireSidenotes()
  position()
  windows?.schedule()
}

function unmountChapter() {
  book?.leave()
  book = null
  resetFigures()
  setScrollRoot(null)
  railLinks.clear()
  currentHeading = null
}

/* ---- start ---------------------------------------------------------------- */
export function startReader() {
  const el = document.getElementById('thesis-config')
  if (el) { try { config = { ...config, ...JSON.parse(el.textContent) } } catch {} }

  world = startWorld()
  wirePanel()                              // after the world: the panel holds it
  windows = createWindows({ world })
  nav = createNavigator(config.places ?? [], url => go(url))
  window.__nav = nav                       // a handle in DevTools: __nav.forget() clears the marks

  wireRail()
  wireAnchors()
  wireLinks()

  modeButton = document.querySelector('[data-mode-toggle]')
  modeButton?.addEventListener('click', () => setMode(book?.on ? 'scroll' : 'book'))

  paintStill(still())
  document.querySelector('[data-still]')?.addEventListener('click', () => {
    const on = !still()
    write(STILL, on ? '1' : '0')      // '0' is a decision too, so reduced motion does not override it
    paintStill(on)
    world?.setPaused(on)
  })

  paintRoom(roomLevel())       // the slider exists by now, so it gets its value
  for (const el of document.querySelectorAll('[data-room]')) {
    el.addEventListener('input', () => {
      const level = Math.round(+el.value)
      write(ROOM, level === ROOM_DEFAULT ? '' : String(level))   // the default is stored as nothing
      paintRoom(level)
      world?.setRoom(level)
    })
  }

  // these belong to the document, not to a chapter, so they are wired once
  addEventListener('scroll', onScroll, { passive: true })
  addEventListener('resize', position)
  matchMedia('(min-width: 64rem) and (min-height: 30rem)').addEventListener('change', () => {
    if (!book) return
    if (!roomForBook() && book.on) book.leave()
    else if (roomForBook() && prefersBook() && !book.on) book.enter()
    afterLayout()
  })

  markRailChapter(location.pathname)
  mountChapter()

  // a link straight to a section or a figure opens on its page
  const id = location.hash.slice(1)
  if (id && book?.on) book.goToElement(id)

  return { go, get world() { return world }, get nav() { return nav } }
}
