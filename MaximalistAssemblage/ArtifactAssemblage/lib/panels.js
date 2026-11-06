// Simulated screens: movable, resizable frames on this page, each standing in for a display, so a
// piece can be composed across several screens with none attached (what Processing's several
// windows gave). A frame is a small window laid over the canvas: a title bar to drag it by, a grip
// in its corner to resize it, a close box, and room in the bar for a control or two. Its rectangle
// is where that screen's picture goes: renderPanels() draws each frame's camera into that rectangle
// as a scissored viewport of the one renderer, after the main view has been drawn, every frame.
//
//   const panels = createPanels()
//   const p = panels.open({ title: 'side', x: 40, y: 80, width: 480, height: 270, controls: [selectEl] })
//   ... in afterRender:  renderPanels(renderer, scene, panels.list(), panel => cameraFor(panel))
//
// Frames know nothing about three.js beyond that; they are DOM. Positions are CSS pixels in the page.

const CSS = `
.vp { position: fixed; box-sizing: border-box; border: 2px solid #9cc7ff; border-radius: 4px; box-shadow: 0 6px 24px rgba(0,0,0,.6); background: transparent; font: 12px system-ui, sans-serif; color: #eee; user-select: none; z-index: 20; }
.vp.active { border-color: #ffd27a; z-index: 21; }
.vp .bar { position: absolute; left: 0; right: 0; top: 0; height: 24px; display: flex; align-items: center; gap: 8px; padding: 0 6px 0 8px; background: rgba(20,24,32,.88); cursor: move; border-radius: 2px 2px 0 0; }
.vp .bar b { font-weight: 600; } .vp .bar .size { color: #aab; margin-left: auto; }
.vp .bar select { font: 11px system-ui, sans-serif; background: #1d2230; color: #eee; border: 1px solid #445; border-radius: 3px; }
.vp .close { cursor: pointer; padding: 0 4px; color: #ccd; } .vp .close:hover { color: #fff; }
.vp .body { position: absolute; inset: 24px 0 0 0; cursor: default; }
.vp .grip { position: absolute; right: 0; bottom: 0; width: 16px; height: 16px; cursor: nwse-resize; background: linear-gradient(135deg, transparent 50%, #9cc7ff 50%); border-radius: 0 0 2px 0; }
`

export function createPanels({ container = document.body, minWidth = 160, minHeight = 110 } = {}) {
  if (!document.getElementById('vp-style')) { const s = document.createElement('style'); s.id = 'vp-style'; s.textContent = CSS; document.head.appendChild(s) }
  const panels = []
  let zTop = 21

  // Dragging: the bar moves the frame, the grip resizes it; both by pointer capture so a fast drag never slips off.
  const drag = (handle, onMove) => {
    handle.addEventListener('pointerdown', e => {
      if (e.button !== 0 || e.target.tagName === 'SELECT' || e.target.classList.contains('close')) return
      e.preventDefault(); e.stopPropagation()
      handle.setPointerCapture(e.pointerId)
      const start = { x: e.clientX, y: e.clientY }
      const move = ev => onMove(ev.clientX - start.x, ev.clientY - start.y)
      const up = () => { handle.removeEventListener('pointermove', move); handle.removeEventListener('pointerup', up) }
      handle.addEventListener('pointermove', move); handle.addEventListener('pointerup', up)
      onMove.begin?.()
    })
  }

  function open({ title = 'screen', x = 40, y = 60, width = 480, height = 270, controls = [], data = null } = {}) {
    const el = document.createElement('div'); el.className = 'vp'
    el.innerHTML = `<div class="bar"><b></b><span class="size"></span><span class="close" title="close">✕</span></div><div class="body"><div class="grip"></div></div>`
    const bar = el.querySelector('.bar'), label = el.querySelector('b'), size = el.querySelector('.size'), body = el.querySelector('.body')
    controls.forEach(c => bar.insertBefore(c, size))
    const panel = {
      el, data, get title() { return label.textContent }, set title(t) { label.textContent = t },
      rect() { return el.getBoundingClientRect() },                 // the whole frame; the picture fills it under the bar
      place(nx, ny, w, h) {
        Object.assign(el.style, { left: Math.max(0, nx) + 'px', top: Math.max(0, ny) + 'px', width: Math.max(minWidth, w) + 'px', height: Math.max(minHeight, h) + 'px' })
        const r = el.getBoundingClientRect(); size.textContent = `${Math.round(r.width)}×${Math.round(r.height - 24)}`
      },
      close() { el.remove(); const i = panels.indexOf(panel); if (i >= 0) panels.splice(i, 1); panel.onClose?.(panel) },
      onClose: null,
    }
    panel.title = title
    panel.place(x, y, width, height)
    let from = null
    const mover = (dx, dy) => panel.place(from.left + dx, from.top + dy, from.width, from.height)
    mover.begin = () => { from = el.getBoundingClientRect(); raise() }
    drag(bar, mover)
    const sizer = (dx, dy) => panel.place(from.left, from.top, from.width + dx, from.height + dy)
    sizer.begin = () => { from = el.getBoundingClientRect(); raise() }
    drag(el.querySelector('.grip'), sizer)
    const raise = () => { panels.forEach(p => p.el.classList.remove('active')); el.classList.add('active'); el.style.zIndex = ++zTop }
    el.addEventListener('pointerdown', e => { raise(); e.stopPropagation() })   // a click inside a frame never reaches the canvas behind
    el.querySelector('.close').addEventListener('click', () => panel.close())
    body.addEventListener('wheel', e => e.stopPropagation(), { passive: true })
    container.appendChild(el)
    panels.push(panel); raise()
    return panel
  }

  // Lay every frame out in a grid across the page (leaving `right` pixels free for a panel), at one aspect.
  function tile({ margin = 16, top = 56, right = 0, aspect = 16 / 9 } = {}) {
    const n = panels.length; if (!n) return
    const cols = Math.ceil(Math.sqrt(n)), rows = Math.ceil(n / cols)
    const w = (innerWidth - right - margin * (cols + 1)) / cols, h = Math.min(w / aspect + 24, (innerHeight - top - margin * (rows + 1)) / rows)
    panels.forEach((p, i) => p.place(margin + (i % cols) * (w + margin), top + Math.floor(i / cols) * (h + margin), w, h))
  }

  return { open, tile, list: () => panels.slice(), closeAll: () => panels.slice().forEach(p => p.close()) }
}

// Draw each frame's view into its rectangle, after the main render. cameraFor(panel) returns the
// camera to use; its aspect is set to the frame's. The viewport is restored afterwards.
export function renderPanels(renderer, scene, panels, cameraFor) {
  if (!panels.length) return
  const canvas = renderer.domElement.getBoundingClientRect()
  const width = renderer.domElement.clientWidth, height = renderer.domElement.clientHeight
  renderer.setScissorTest(true)
  for (const p of panels) {
    const r = p.rect()
    const x = r.left - canvas.left, w = r.width, h = r.height - 24, y = height - (r.bottom - canvas.top)   // GL counts y from the bottom; the bar is left out
    if (w < 4 || h < 4) continue
    const cam = cameraFor(p)
    if (cam.aspect !== w / h) { cam.aspect = w / h; cam.updateProjectionMatrix() }
    renderer.setViewport(x, y, w, h); renderer.setScissor(x, y, w, h)
    renderer.render(scene, cam)
  }
  renderer.setScissorTest(false)
  renderer.setViewport(0, 0, width, height)
}
