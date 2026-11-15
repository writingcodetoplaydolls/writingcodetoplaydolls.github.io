// The open book.
//
// The same chapter, set as a two-page spread with two columns on each page and
// turned a spread at a time, instead of scrolled. The text is the text: nothing
// is written twice. The blocks the build produced are moved out of the scrolling
// column and poured into pages, and moved back if the reader turns the book off.
//
// The division of labour is the part worth knowing. The browser is better at
// typesetting than any script: each page is a two-column block of a fixed
// height, so the browser breaks paragraphs across the two columns itself,
// hyphenating and justifying as it goes. This file only decides *which blocks
// land on which page*, by pouring one block at a time into a page and asking
// after each whether it still fits:
//
//   a page overflows  →  take the block back, start a new page, put it there
//   a heading is left alone at the foot of a page  →  it goes forward with it
//   a figure the width of a page  →  spans both columns, text flows round it
//   a figure the width of a spread  →  a plate: a spread of its own
//
// Nothing is measured in advance and no height is hard-coded, so the same code
// sets a window of any shape, and re-sets it when the window changes.
//
// Print does not use any of this: the stylesheet flattens the pages back into
// one flow, and because a page's blocks are in reading order inside it, and the
// pages are in order, the flattened document reads correctly.

const isHeading = el => /^H[1-4]$/.test(el.tagName)
const isPagePlate = el => el.classList?.contains('fig--full') && !el.classList.contains('fig--spread')
const isSpreadPlate = el => el.classList?.contains('fig--spread')
const SLACK = 2            // px: sub-pixel layout noise, not a real overflow

export function createBook({ page, host, onTurn }) {
  const blocks = []        // every block, in reading order, whoever is holding it
  let spreads = []
  let index = 0
  let on = false
  let track, viewport, foot, prevBtn, nextBtn
  let resizeTimer = null
  let settleTimer = null

  /* ---- the furniture ---------------------------------------------------- */
  function build() {
    host.innerHTML = `
      <button class="turn prev" type="button" aria-label="previous page">&#8249;</button>
      <div class="book-viewport"><div class="book-track"></div></div>
      <button class="turn next" type="button" aria-label="next page">&#8250;</button>
      <div class="book-foot"><span class="folios"></span><span class="of"></span></div>`
    viewport = host.querySelector('.book-viewport')
    track = host.querySelector('.book-track')
    foot = host.querySelector('.book-foot')
    prevBtn = host.querySelector('.turn.prev')
    nextBtn = host.querySelector('.turn.next')
    prevBtn.addEventListener('click', () => turn(-1))
    nextBtn.addEventListener('click', () => turn(1))
    wireSwipe()
  }

  // .sheet is the page's black, behind its text: lib/windows.js cuts the
  // windows out of it so the room behind shows through.
  const leafHtml = `<div class="sheet"></div><div class="leaf-head"></div><div class="leaf-body"></div><div class="leaf-foot"><span class="folio"></span></div>`

  function makeSpread() {
    const el = document.createElement('div')
    el.className = 'spread'
    el.innerHTML = `<div class="pages"><div class="leaf leaf--verso">${leafHtml}</div><div class="spine"></div><div class="leaf leaf--recto">${leafHtml}</div></div>`
    const leaves = [...el.querySelectorAll('.leaf')].map(leaf => ({
      el: leaf,
      body: leaf.querySelector('.leaf-body'),
      head: leaf.querySelector('.leaf-head'),
      folio: leaf.querySelector('.folio'),
    }))
    track.appendChild(el)
    return { el, leaves, plate: false }
  }

  function makePlate(figure) {
    const el = document.createElement('div')
    el.className = 'spread spread--plate'
    const pages = document.createElement('div')
    pages.className = 'pages'
    pages.appendChild(figure)
    el.appendChild(pages)
    track.appendChild(el)
    return { el, leaves: [], plate: true, figure }
  }

  /* ---- pouring ----------------------------------------------------------- */
  function overflows(body) {
    return body.scrollWidth > body.clientWidth + SLACK || body.scrollHeight > body.clientHeight + SLACK
  }

  function paginate() {
    if (!on) return                 // a repagination queued before the book was turned off
    host.classList.add('book--setting')
    track.textContent = ''
    spreads = []

    let spread = null, leafIndex = 0
    const newSpread = () => { spread = makeSpread(); spreads.push(spread); leafIndex = 0 }
    const leaf = () => spread.leaves[leafIndex]
    const body = () => leaf().body
    const spreadEmpty = () => spread.leaves.every(l => !l.body.firstChild)
    const dropIfEmpty = () => {
      if (!spread || !spreadEmpty()) return false
      spread.el.remove()
      spreads.pop()
      spread = null
      return true
    }
    const nextLeaf = () => { if (leafIndex === 0) leafIndex = 1; else newSpread() }
    const leafEmpty = () => !leaf().body.firstChild

    newSpread()
    for (const block of blocks) {
      // a figure asking for the whole spread: a plate, with nothing else on it
      if (isSpreadPlate(block)) {
        dropIfEmpty()
        spreads.push(makePlate(block))
        newSpread()
        continue
      }
      // a figure asking for the width of the page: it takes a page to itself,
      // usually the one facing the text that introduces it
      if (isPagePlate(block)) {
        if (!leafEmpty()) nextLeaf()
        leaf().el.classList.add('leaf--plate')
        leaf().body.appendChild(block)
        nextLeaf()
        continue
      }
      body().appendChild(block)
      if (!overflows(body())) continue

      // It does not fit. Take it back, and take a heading with it rather than
      // leave the heading alone at the foot of a page.
      body().removeChild(block)
      const last = body().lastElementChild
      const orphan = last && isHeading(last) && last.previousElementSibling ? last : null
      if (orphan) orphan.remove()
      nextLeaf()
      if (orphan) body().appendChild(orphan)
      body().appendChild(block)
      if (overflows(body())) {
        console.warn('[book] this block is taller than a page, so its foot is cut off — split it:', block)
      }
    }
    dropIfEmpty()

    // running heads and page numbers, once the pages are settled
    let folio = 1
    for (const s of spreads) {
      if (s.plate) { s.el.dataset.folio = `${folio}–${folio + 1}`; folio += 2; continue }
      for (const l of s.leaves) {
        l.folio.textContent = folio++
        l.head.textContent = headingFor(l.body) ?? ''
      }
    }
    host.classList.remove('book--setting')
    index = Math.min(index, Math.max(0, spreads.length - 1))
    show()
  }

  /** The section a page is in: its own first heading, or the last one before it. */
  function headingFor(body) {
    const own = body.querySelector('h2, h3')
    if (own) return own.dataset.short || own.textContent.trim()
    const first = body.firstElementChild
    if (!first) return null
    for (let i = blocks.indexOf(first) - 1; i >= 0; i--) {
      const b = blocks[i]
      if (b.tagName === 'H2' || b.tagName === 'H3') return b.dataset.short || b.textContent.trim()
    }
    return null
  }

  /* ---- turning ------------------------------------------------------------ */
  function show() {
    track.style.transform = `translateX(${-index * 100}%)`
    prevBtn.disabled = index === 0
    nextBtn.disabled = index >= spreads.length - 1
    const here = spreads[index]
    foot.querySelector('.folios').textContent = here
      ? here.plate ? here.el.dataset.folio : here.leaves.map(l => l.folio.textContent).join('–')
      : ''
    foot.querySelector('.of').textContent = spreads.length ? `spread ${index + 1} of ${spreads.length}` : ''
    onTurn?.(current())

    // ...and again once the spread has stopped sliding. The track moves by a
    // transform over a third of a second, so anything measured now is at its
    // old place on the screen. The page's own layout does not care — a page
    // and the windows cut in it move together — but the room behind does: it
    // is handed absolute screen rectangles, and it would stand her in front
    // of where the window used to be. A timer rather than transitionend,
    // because with reduced motion there is no transition and no event.
    clearTimeout(settleTimer)
    settleTimer = setTimeout(() => onTurn?.(current()), 380)
  }

  function turn(by) { go(index + by) }

  function go(n) {
    const next = Math.max(0, Math.min(spreads.length - 1, n))
    if (next === index) return
    index = next
    show()
  }

  /** What is on the spread now: its blocks, and the heading it sits under. */
  function current() {
    const s = spreads[index]
    if (!s) return { index, count: spreads.length, blocks: [], heading: null }
    const inside = s.plate ? [s.figure] : s.leaves.flatMap(l => [...l.body.children])
    let heading = [...inside].reverse().find(b => b.tagName === 'H2' || b.tagName === 'H3') ?? null
    if (!heading) {
      const first = inside[0]
      for (let i = blocks.indexOf(first) - 1; first && i >= 0; i--) {
        if (blocks[i].tagName === 'H2' || blocks[i].tagName === 'H3') { heading = blocks[i]; break }
      }
    }
    return { index, count: spreads.length, blocks: inside, heading }
  }

  /** Turn to whatever spread holds this element (or this id). */
  function goToElement(target) {
    const el = typeof target === 'string' ? document.getElementById(target) : target
    if (!el) return false
    const spread = spreads.findIndex(s => s.el.contains(el))
    if (spread < 0) return false
    go(spread)
    return true
  }

  /* ---- keys, swipe, resize ------------------------------------------------ */
  // A sketch in a figure uses the arrow keys to walk, so the book keeps its
  // hands off them whenever the pointer is over a figure.
  function onKey(e) {
    if (!on || e.metaKey || e.ctrlKey || e.altKey) return
    if (document.querySelector('.fig-stage:hover')) return
    if (e.target.closest?.('input, textarea, [contenteditable], .lil-gui')) return
    const back = e.key === 'ArrowLeft' || e.key === 'PageUp'
    const fwd = e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' '
    if (back) { e.preventDefault(); turn(-1) }
    else if (fwd) { e.preventDefault(); turn(1) }
    else if (e.key === 'Home') { e.preventDefault(); go(0) }
    else if (e.key === 'End') { e.preventDefault(); go(spreads.length - 1) }
  }

  function wireSwipe() {
    let x0 = null, y0 = null
    viewport.addEventListener('pointerdown', e => {
      if (e.target.closest('.fig-stage')) return          // dragging a scene, not turning a page
      x0 = e.clientX; y0 = e.clientY
    })
    viewport.addEventListener('pointerup', e => {
      if (x0 === null) return
      const dx = e.clientX - x0, dy = e.clientY - y0
      x0 = null
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) turn(dx < 0 ? 1 : -1)
    })
  }

  function onResize() {
    if (!on) return
    clearTimeout(resizeTimer)
    // hold the reader's place: the first block of the spread they are on
    const anchor = current().blocks[0] ?? null
    resizeTimer = setTimeout(() => {
      paginate()
      if (anchor) goToElement(anchor)
    }, 180)
  }

  /* ---- on and off --------------------------------------------------------- */
  function enter() {
    if (on) return
    if (!track) build()
    if (!blocks.length) blocks.push(...[...page.children].filter(el => !el.classList.contains('sheet')))
    on = true
    document.body.classList.add('book')
    paginate()
    addEventListener('keydown', onKey)
    addEventListener('resize', onResize)
  }

  function leave() {
    if (!on) return
    on = false
    clearTimeout(resizeTimer)                          // or it would pour the blocks back out again
    clearTimeout(settleTimer)
    resizeTimer = settleTimer = null
    for (const b of blocks) page.appendChild(b)        // back into the scrolling column, in order
    track.textContent = ''
    spreads = []
    document.body.classList.remove('book')
    removeEventListener('keydown', onKey)
    removeEventListener('resize', onResize)
    onTurn?.({ index: 0, count: 0, blocks: [], heading: null })
  }

  return {
    enter, leave, go, turn, goToElement, paginate, current,
    get on() { return on },
    get viewport() { return viewport },
    get count() { return spreads.length },
  }
}
