// Cutting the windows.
//
// A page is a sheet of near-black laid over the world. A window is a hole in
// that sheet: the reader sees straight through to the room behind, and the
// floating skin figure can come and stand in it. A figure is a window too —
// while its sketch is not running there is nothing in the opening but the
// world, and when it starts, its canvas fills the opening. She does not stand
// in those: a hole is cut for every opening, and only the ones written as
// :::window are offered to her.
//
// The hole is cut with clip-path: one path made of the sheet's own rectangle
// followed by a rounded rectangle per window, filled even-odd, so the inner
// subpaths are holes. The sheet is a sibling behind the page's text, so only
// the black is cut; nothing of the writing is clipped.
//
// Everything is measured from getBoundingClientRect, which reports where things
// actually are after the book's transform, so the same code serves the scrolling
// column and a spread sliding sideways.

const RADIUS = 6
const rect = (x, y, w, h) => `M${x},${y} H${x + w} V${y + h} H${x} Z`

function roundRect(x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2))
  return `M${x + r},${y} H${x + w - r} A${r},${r} 0 0 1 ${x + w},${y + r}` +
         ` V${y + h - r} A${r},${r} 0 0 1 ${x + w - r},${y + h}` +
         ` H${x + r} A${r},${r} 0 0 1 ${x},${y + h - r}` +
         ` V${y + r} A${r},${r} 0 0 1 ${x + r},${y} Z`
}

const overlaps = (a, b) => a.right > b.left && a.left < b.right && a.bottom > b.top && a.top < b.bottom
const onScreen = r => r.width > 0 && r.height > 0 && r.right > 0 && r.left < innerWidth && r.bottom > 0 && r.top < innerHeight

export function createWindows({ world = null } = {}) {
  let queued = false

  /** Recompute every hole and tell the world where its windows are. */
  function refresh() {
    const stages = [...document.querySelectorAll('.fig-stage')]
    const boxes = stages.map(el => ({ el, rect: el.getBoundingClientRect() }))

    for (const sheet of document.querySelectorAll('.sheet')) {
      const sr = sheet.getBoundingClientRect()
      if (sr.width < 2 || sr.height < 2) { sheet.style.clipPath = 'none'; continue }
      const holes = boxes
        .filter(b => b.rect.width > 8 && b.rect.height > 8 && overlaps(b.rect, sr))
        .map(b => roundRect(b.rect.left - sr.left, b.rect.top - sr.top, b.rect.width, b.rect.height, RADIUS))
      sheet.style.clipPath = holes.length
        ? `path(evenodd, "${rect(0, 0, sr.width, sr.height)} ${holes.join(' ')}")`
        : 'none'
    }

    // Every opening is a hole in the sheet, but only the ones cut for her are
    // hers to stand in. A figure's opening belongs to the figure: her turning
    // up inside a sketch, a still or a video reads as a fault rather than as a
    // visit, so the world is told about :::window openings and nothing else.
    // Of those it wants the ones the reader can actually see, and not one the
    // panel is sitting over -- which matters most when the panel is open
    // precisely to retune how she looks.
    const panel = document.querySelector('[data-panel]')
    const pr = panel && panel.getClientRects().length ? panel.getBoundingClientRect() : null
    world?.setWindows(
      boxes
        .filter(b => onScreen(b.rect) && b.el.closest('figure.window'))
        .map(b => ({
          rect: b.rect,
          open: !b.el.querySelector('canvas, iframe'),
          clear: !(pr && overlaps(b.rect, pr)),
        })),
    )
  }

  /** Ask for a refresh; several asks in one frame cost one recompute. */
  function schedule() {
    if (queued) return
    queued = true
    requestAnimationFrame(() => { queued = false; refresh() })
  }

  addEventListener('resize', schedule)
  addEventListener('scroll', schedule, { passive: true })

  return { refresh, schedule }
}
