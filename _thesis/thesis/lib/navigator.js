// Navigation as a dividing cell.
//
// Every place in the document is a circle. They sit on a triangular lattice
// whose spacing is the circle radius, so each circle passes through the centres
// of its neighbours — which is the construction of the Seed of Life, and then
// of the Flower, and then of whatever comes after it. The places fill the
// lattice outward from the middle, so the figure grows the way an embryo does:
//
//   1 place    one cell
//   2          the vesica: two circles through each other's centres
//   7          the Seed of Life, the first complete ring
//   19         the Flower of Life, the second
//   beyond     another ring, and another
//
// The reader keeps their place by two marks, both of which they fill in by
// reading:
//
//   the symbol node   the small disc at a circle's centre: one place
//   the between-area  the lens where two neighbouring circles overlap, filled
//                     once both of its places have been read — the membrane
//                     two cells share
//
// The circles for places not yet reached are drawn faintly, so the whole shape
// is there to be navigated into rather than hidden until it is earned. A node
// is a link: clicking one goes there.

const SQRT3 = Math.sqrt(3)
const AXIAL = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]]
const STORE = 'thesis-visited'

const read = () => { try { return new Set(JSON.parse(localStorage.getItem(STORE) ?? '[]')) } catch { return new Set() } }
const write = set => { try { localStorage.setItem(STORE, JSON.stringify([...set])) } catch {} }

/** Axial coordinates for n lattice cells, centre first, then ring by ring. */
function cells(n) {
  const out = [[0, 0]]
  for (let k = 1; out.length < n; k++) {
    let q = -k, s = k                           // the start of ring k
    for (let side = 0; side < 6; side++) {
      for (let i = 0; i < k && out.length < n + 6; i++) {
        out.push([q, s])
        q += AXIAL[side][0]
        s += AXIAL[side][1]
      }
    }
  }
  return out.slice(0, n)
}

const toXY = ([q, s], r) => [r * (q + s / 2), r * (s * SQRT3 / 2)]
const adjacent = (a, b) => AXIAL.some(d => a[0] + d[0] === b[0] && a[1] + d[1] === b[1])

/** The lens where two circles of radius r, centres r apart, overlap. */
function lens([ax, ay], [bx, by], r) {
  const dx = bx - ax, dy = by - ay
  const d = Math.hypot(dx, dy) || 1
  const mx = (ax + bx) / 2, my = (ay + by) / 2
  const h = Math.sqrt(Math.max(r * r - (d / 2) ** 2, 0))
  const ux = -dy / d, uy = dx / d
  const p1 = [mx + ux * h, my + uy * h]
  const p2 = [mx - ux * h, my - uy * h]
  const f = v => v.map(n => n.toFixed(2)).join(',')
  return `M${f(p1)} A${r},${r} 0 0,1 ${f(p2)} A${r},${r} 0 0,1 ${f(p1)} Z`
}

const svgEl = (name, attrs = {}) => {
  const el = document.createElementNS('http://www.w3.org/2000/svg', name)
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
  return el
}

/** A hover label. append() returns nothing, so the title is built then added. */
const titled = (el, text) => {
  const t = svgEl('title')
  t.textContent = text
  el.append(t)
  return el
}

/**
 * @param {{id:string,title:string,url:string,chapter?:string}[]} places in reading order
 * @param {(url:string)=>void} onGo  called when a node is clicked
 */
export function createNavigator(places, onGo) {
  const visited = read()
  let current = null
  const coords = cells(places.length)
  const mounted = []

  function draw(host) {
    const r = 40
    const xy = coords.map(c => toXY(c, r))
    const minX = Math.min(...xy.map(p => p[0])) - r
    const maxX = Math.max(...xy.map(p => p[0])) + r
    const minY = Math.min(...xy.map(p => p[1])) - r
    const maxY = Math.max(...xy.map(p => p[1])) + r
    const pad = r * 0.12

    const svg = svgEl('svg', {
      viewBox: `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`,
      class: 'nav-figure',
      role: 'navigation',
      'aria-label': 'where you have been',
    })

    // the between-areas first, so the nodes sit over them
    const lenses = svgEl('g', { class: 'nav-lenses' })
    for (let i = 0; i < coords.length; i++) {
      for (let j = i + 1; j < coords.length; j++) {
        if (!adjacent(coords[i], coords[j])) continue
        const path = svgEl('path', { d: lens(xy[i], xy[j], r), class: 'nav-lens' })
        path.dataset.a = places[i].id
        path.dataset.b = places[j].id
        titled(path, `${places[i].title} · ${places[j].title}`)
        lenses.append(path)
      }
    }
    svg.append(lenses)

    const rings = svgEl('g', { class: 'nav-rings' })
    const nodes = svgEl('g', { class: 'nav-nodes' })
    places.forEach((place, i) => {
      const [x, y] = xy[i]
      const ring = svgEl('circle', { cx: x.toFixed(2), cy: y.toFixed(2), r, class: 'nav-ring' })
      ring.dataset.place = place.id
      rings.append(ring)

      const a = svgEl('a', { class: 'nav-node' })
      a.dataset.place = place.id
      a.setAttribute('href', place.url)
      const hit = svgEl('circle', { cx: x.toFixed(2), cy: y.toFixed(2), r: (r * 0.3).toFixed(2), class: 'nav-hit' })
      const dot = svgEl('circle', { cx: x.toFixed(2), cy: y.toFixed(2), r: (r * 0.16).toFixed(2), class: 'nav-dot' })
      a.append(hit, dot)
      titled(a, place.title)
      a.addEventListener('click', e => {
        e.preventDefault()
        onGo?.(place.url)
      })
      nodes.append(a)
    })
    svg.append(rings, nodes)

    host.textContent = ''
    host.append(svg)
    mounted.push(svg)
    paint()
  }

  /** Put the marks where they belong: read, current, and the shared membranes. */
  function paint() {
    for (const svg of mounted) {
      for (const ring of svg.querySelectorAll('.nav-ring')) {
        ring.classList.toggle('seen', visited.has(ring.dataset.place))
        ring.classList.toggle('here', ring.dataset.place === current)
      }
      for (const a of svg.querySelectorAll('.nav-node')) {
        a.classList.toggle('seen', visited.has(a.dataset.place))
        a.classList.toggle('here', a.dataset.place === current)
      }
      for (const l of svg.querySelectorAll('.nav-lens')) {
        l.classList.toggle('seen', visited.has(l.dataset.a) && visited.has(l.dataset.b))
      }
    }
  }

  function mount(host) {
    if (!host) return
    draw(host)
  }

  /** The reader has reached a place: mark it, and make it the current one. */
  function visit(id) {
    if (!id) return
    const known = places.some(p => p.id === id)
    if (!known) return
    current = id
    if (!visited.has(id)) { visited.add(id); write(visited) }
    paint()
  }

  function forget() {
    visited.clear()
    write(visited)
    paint()
  }

  return { mount, visit, forget, get visited() { return new Set(visited) }, get count() { return places.length } }
}
