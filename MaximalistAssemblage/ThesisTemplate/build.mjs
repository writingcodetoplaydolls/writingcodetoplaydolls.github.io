// Build the dissertation pages from the chapters in thesis/chapters/.
//
//   node thesis/build.mjs            → thesis/preview/   (read at https://localhost:5173/thesis/preview/)
//   node thesis/build.mjs --site     → site/MaximalistAssemblage/   (for the GitHub Pages repo)
//
// Markdown in, static HTML out: no bundler, no framework, no dependencies.
// The pages are plain files with an import map, exactly like the sketch pages
// tools/export_site.mjs writes, so they work the same whether they are served
// by Vite here or by GitHub Pages after being copied into the repo by hand.
//
// The difference between the two modes is only where things are:
//
//                     dev                             site
//   pages             thesis/preview/                 site/MaximalistAssemblage/
//   three, lil-gui    /node_modules/… (offline)       jsdelivr, pinned to the installed versions
//   a sketch          /src/sketches/<name>.js         /MaximalistAssemblage/ArtifactAssemblage/<Tests|Works>/<name>/sketch.js
//   assets            /models/… (Vite serves public/) /assets/models/… (rewritten by export_site)
//
// A sketch asks for its models with a page-relative path ('./models/room.glb'),
// and a chapter page does not sit at the root. On the site that is already
// handled: export_site.mjs rewrites those paths to '/assets/models/…'. On the
// dev server the small 'thesis-preview-assets' plugin in vite.config.js sends
// /thesis/preview/<public folder>/… back to /<public folder>/…, which is where
// Vite serves public/. Neither mode needs a <base> element, so in-page anchors
// (#a-section, #fig-cube) stay what they say they are.
//
// Run export_site.mjs BEFORE this in site mode: it clears site/ wholesale, and
// it is what puts the sketch modules where the figures here import them from.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SITE_MODE = process.argv.includes('--site')
const TUNE_MODE = process.argv.includes('--tune')   // build the tuning panel into the pages
const THESIS = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(THESIS, '..')
const OUT = SITE_MODE
  ? path.join(ROOT, 'site', 'MaximalistAssemblage')
  : path.join(THESIS, 'preview')
const BASE = SITE_MODE ? '/MaximalistAssemblage/' : '/thesis/preview/'

const doc = JSON.parse(fs.readFileSync(path.join(THESIS, 'thesis.json'), 'utf8'))
// Everything in public/ is served at the root by Vite and copied to
// site/assets/<folder> by tools/export_site.mjs, so a path into it differs
// between the two modes. Anything the world is given — the models, and the
// body module when there is one — is resolved against this.
const PUBLIC_BASE = SITE_MODE ? '/assets/' : '/'
const ASSETS = PUBLIC_BASE + 'models/'

/** A path into public/, written relative in thesis.json, made absolute for
 *  this mode. A path that is already absolute, or a URL, is left alone. */
const inPublic = p => (!p || /^([a-z]+:)?\/\//i.test(p) || p.startsWith('/'))
  ? p
  : PUBLIC_BASE + p.replace(/^\.?\//, '')
let PLACES = []        // every place in the document, in reading order (lib/navigator.js)
const warnings = []
const warn = m => { warnings.push(m); }

/* ---- where a sketch lives ------------------------------------------------
 * tools/export_site.mjs is the one place that decides whether a sketch is a
 * Test or a Work and whether it goes to the site at all. Importing it would
 * run it (it clears site/ at the top level), so its table is read as text.
 * A sketch it keeps off the site (site: false) has no module to import on the
 * published page: embed its standalone page instead, with embed=… */
function readSketchTable() {
  const file = path.join(ROOT, 'tools', 'export_site.mjs')
  const table = {}
  if (!fs.existsSync(file)) return table
  const src = fs.readFileSync(file, 'utf8')
  const block = src.slice(src.indexOf('const SKETCHES'), src.indexOf('// The notes in docs/'))
  for (const m of block.matchAll(/^\s*'?([\w-]+)'?:\s*\{([^\n]*)$/gm)) {
    const [, name, rest] = m
    const kind = /kind:\s*'(test|work)'/.exec(rest)?.[1]
    if (!kind) continue
    table[name] = { kind, onSite: !/site:\s*false/.test(rest) }
  }
  return table
}
const SKETCHES = readSketchTable()
const SECTION_DIR = { test: 'Tests', work: 'Works' }

function sketchModule(name) {
  const file = path.join(ROOT, 'src', 'sketches', name + '.js')
  const folder = path.join(ROOT, 'src', 'sketches', name, 'index.js')
  if (!fs.existsSync(file) && !fs.existsSync(folder)) {
    warn(`no sketch called "${name}" in src/sketches/`)
    return null
  }
  if (!SITE_MODE) return `/src/sketches/${name}${fs.existsSync(file) ? '.js' : '/index.js'}`
  const spec = SKETCHES[name]
  if (!spec) { warn(`"${name}" is not in SKETCHES in tools/export_site.mjs, so it is not on the site`); return null }
  if (!spec.onSite) {
    warn(`"${name}" is marked site: false in export_site.mjs — on the published page use embed=<its own page> instead of sketch=${name}`)
    return null
  }
  return `/MaximalistAssemblage/ArtifactAssemblage/${SECTION_DIR[spec.kind]}/${name}/sketch.js`
}

function sketchPage(name) {
  const spec = SKETCHES[name]
  if (!spec) return ''
  return SITE_MODE
    ? `/MaximalistAssemblage/ArtifactAssemblage/${SECTION_DIR[spec.kind]}/${name}/`
    : `/?sketch=${name}`
}

/* ---- the import map ------------------------------------------------------
 * Dev points at node_modules so the dev server needs no network, as the rest
 * of this project does not. Site points at the CDN, pinned to the versions
 * installed here, which is what export_site.mjs does for the sketch pages. */
const version = pkg => {
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'node_modules', pkg, 'package.json'), 'utf8')).version }
  catch { warn(`${pkg} is not installed; run npm install`); return null }
}
const THREE_V = version('three'), GUI_V = version('lil-gui')
const importMap = SITE_MODE
  ? {
      three: `https://cdn.jsdelivr.net/npm/three@${THREE_V}/build/three.module.js`,
      'three/addons/': `https://cdn.jsdelivr.net/npm/three@${THREE_V}/examples/jsm/`,
      'lil-gui': `https://cdn.jsdelivr.net/npm/lil-gui@${GUI_V}/dist/lil-gui.esm.min.js`,
    }
  : {
      three: '/node_modules/three/build/three.module.js',
      'three/addons/': '/node_modules/three/examples/jsm/',
      'lil-gui': '/node_modules/lil-gui/dist/lil-gui.esm.min.js',
    }

/* ======================================================================== *
 * markdown
 * ======================================================================== */

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const attr = s => esc(s).replace(/"/g, '&quot;')
const slug = s => String(s).toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 60)

/** Inline markdown: code, strong, em, links, images, footnote references. */
function inline(text, notes) {
  // code spans first and kept aside, so nothing below rewrites what is inside them
  const spans = []
  let s = String(text).replace(/`([^`]+)`/g, (_, code) => `\u0000${spans.push(`<code>${esc(code)}</code>`) - 1}\u0000`)
  s = esc(s)
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, src) => `<img src="${attr(src)}" alt="${attr(alt)}" loading="lazy">`)
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => `<a href="${attr(href)}">${label}</a>`)
  s = s.replace(/\[\^([\w-]+)\]/g, (_, id) => {
    if (!notes) return ''
    const n = notes.cite(id)
    return n ? `<a class="noteref" id="ref-${n.id}" href="#note-${n.id}" title="note ${n.n}">${n.n}</a>` : ''
  })
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  s = s.replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>')
  s = s.replace(/(^|[\s(])_([^_\n]+)_/g, '$1<em>$2</em>')
  s = s.replace(/--/g, '&mdash;')
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => spans[+i])
}

/** Front matter: the `---` fenced key: value block at the top of a chapter. */
function frontMatter(src) {
  const meta = {}
  if (!/^---\r?\n/.test(src)) return { meta, body: src }
  const end = src.indexOf('\n---', 4)
  if (end < 0) return { meta, body: src }
  for (const line of src.slice(4, end).split(/\r?\n/)) {
    const m = /^([\w-]+):\s*(.*)$/.exec(line.trim())
    if (m) meta[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
  return { meta, body: src.slice(src.indexOf('\n', end + 1) + 1) }
}

/** The footnotes of one chapter, numbered in the order they are first cited. */
function makeNotes(definitions) {
  const used = new Map()
  return {
    cite(id) {
      if (!definitions.has(id)) { warn(`footnote [^${id}] has no definition`); return null }
      if (!used.has(id)) used.set(id, { id, n: used.size + 1, text: definitions.get(id) })
      return used.get(id)
    },
    /** The notes cited since the last call, as sidenote markup. */
    flush() {
      const out = [...used.values()].filter(n => !n.done)
      out.forEach(n => { n.done = true })
      return out.map(n =>
        `<div class="sidenote" id="note-${n.id}"><span class="n">${n.n}</span>${inline(n.text, null)}</div>`).join('\n')
    },
  }
}

/* ---- directives ----------------------------------------------------------
 * :::figure sketch=bouquet width=wide height=60vh autoplay=false
 * caption, inline markdown
 * :::
 */
function parseAttrs(line) {
  const attrs = {}
  for (const m of line.matchAll(/([\w-]+)=(?:"([^"]*)"|'([^']*)'|([^\s]+))/g)) {
    attrs[m[1]] = m[2] ?? m[3] ?? m[4]
  }
  return attrs
}

let figureCount = 0
function figure(attrs, caption, chapter) {
  // A figure can be a module here and a finished page there. The Bouquet is the
  // case: in src/sketches it is a sketch, but it is published as a one-file page
  // of its own (tools/build_bouquet_page.py --site) and kept out of the sketch
  // export, so on the site the figure has to be that page in an iframe.
  // The id is taken before that swap, so a figure keeps the same id — the thing
  // it is linked, cited and named its poster by — in both modes.
  const named = attrs.sketch || attrs.title || ''
  if (SITE_MODE && attrs['site-embed']) { attrs = { ...attrs, embed: attrs['site-embed'] }; delete attrs.sketch }
  if (!SITE_MODE && attrs['dev-embed']) { attrs = { ...attrs, embed: attrs['dev-embed'] }; delete attrs.sketch }
  const kind = attrs.sketch ? 'sketch' : attrs.embed ? 'embed' : attrs.video ? 'video' : 'image'
  const name = attrs.sketch || ''
  chapter.figures++
  // Ids have to be unique on the page: they are what a figure is linked and
  // cited by, and what its poster is named after. A second figure of the same
  // sketch gets a number.
  let id = attrs.id || `fig-${slug(named || `${++figureCount}`)}`
  if (chapter.ids.has(id)) {
    let n = 2
    while (chapter.ids.has(`${id}-${n}`)) n++
    id = `${id}-${n}`
  }
  chapter.ids.add(id)
  const label = attrs.label ?? `Figure ${chapter.number ? chapter.number + '.' : ''}${chapter.figures}`
  const title = attrs.title || (name ? name.replace(/-/g, ' ') : label)
  // column: inside the measure. wide: the measure and the gutter, and in book
  // mode both columns of its page. full: edge to edge, and a page of its own in
  // book mode. spread: the same, but a whole two-page spread in book mode.
  const width = {
    column: '',
    wide: 'wide fig--wide',
    full: 'full fig--full',
    spread: 'full fig--full fig--spread',
  }[attrs.width || 'wide'] ?? 'wide fig--wide'

  // The shape of the stage, as custom properties rather than as width and
  // height directly: the stylesheet reads them, so book mode can give a figure
  // the shape of a column, a page or a spread without fighting an inline style.
  const style = attrs.height
    ? `--fig-height:${esc(attrs.height)}`
    : `--fig-aspect:${esc(attrs.aspect || '16 / 10')}`

  const poster = attrs.poster || `${id}.jpg`
  const posterOnDisk = fs.existsSync(path.join(THESIS, 'posters', poster))
  if (!posterOnDisk && kind !== 'image') {
    warn(`${chapter.slug}: ${id} has no poster — start the figure on the dev server and press "poster" (looked for thesis/posters/${poster})`)
  }

  const data = { fig: kind, title }
  if (kind === 'sketch') {
    const module = sketchModule(name)
    if (!module) {
      // Nothing to run: keep the figure as its poster so the argument still reads.
      data.fig = 'image'
    } else {
      data.module = module
      const own = sketchPage(name)
      if (own) data.fullpage = own
    }
  }
  if (kind === 'embed') data.src = attrs.embed
  if (attrs.autoplay) data.autoplay = attrs.autoplay
  if (attrs.weight) data.weight = attrs.weight
  if (attrs.params) data.params = attrs.params
  const dataAttrs = Object.entries(data).map(([k, v]) => ` data-${k}="${attr(v)}"`).join('')

  const inner = []
  if (posterOnDisk) inner.push(`      <img class="fig-poster" src="${BASE}posters/${attr(poster)}" alt="${attr(title)}">`)
  if (kind === 'video') {
    inner.push(`      <video src="${attr(attrs.video)}" controls playsinline preload="none" poster="${posterOnDisk ? BASE + attr(poster) : ''}"></video>`)
  }
  if (data.fig === 'sketch') {
    inner.push(`      <div class="fig-fallback">This figure is drawn with WebGL, which this browser is not offering. The still above is what it looks like.</div>`)
  }

  const live = SITE_MODE && data.fullpage ? `https://writingcodetoplaydolls.github.io${data.fullpage}` : ''
  // A figure with no still cannot print as a picture. It is marked so that on
  // paper the empty frame is dropped and the caption stands on its own, rather
  // than printing a hairline box with nothing in it.
  const noPoster = posterOnDisk ? '' : ' fig--noposter'
  return `<figure id="${attr(id)}" class="${width}${noPoster}"${dataAttrs}>
    <div class="fig-stage" style="${style}">
${inner.join('\n')}
    </div>
    <figcaption><span class="label">${esc(label)}</span>${caption ? inline(caption, null) : (attrs.title ? esc(attrs.title) : '')}<a class="permalink" href="#${attr(id)}" title="a link to this figure">#</a>${live ? `<span class="liveat">${esc(live)}</span>` : ''}</figcaption>
  </figure>`
}

/* An opening in the page with nothing in it: the reader sees the room behind,
 * and the floating skin figure may come and stand in it. Written as
 *   :::window width=wide aspect="16 / 9"
 *   An optional caption.
 *   :::
 * It is marked up as a figure because it is the same opening a figure makes —
 * the same widths, the same plate behaviour in book mode — but it carries no
 * label and is not counted among the figures.
 *
 * With no width it is a float and the writing runs beside it: `side=left` puts
 * it on the other edge. A width makes it a block, for the opening that has to
 * be a place rather than a window. */
let windowCount = 0
function windowBlock(attrs, caption) {
  const id = attrs.id || `win-${++windowCount}`
  const width = {
    column: '',
    wide: 'wide fig--wide',
    full: 'full fig--full',
    spread: 'full fig--full fig--spread',
  }[attrs.width || 'column'] ?? ''
  // The aperture is 60 by 60 mm — a twin-lens reflex frame, in real units, so
  // it is that size on paper and near enough on screen. An explicit size still
  // wins, for the one that has to be a place rather than a window.
  const style = attrs.height ? `--fig-height:${esc(attrs.height)}`
    : attrs.aspect ? `--fig-aspect:${esc(attrs.aspect)}`
    : attrs.size ? `--win-size:${esc(attrs.size)}` : ''
  const side = attrs.side === 'left' ? ' win--left' : ''
  return `<figure id="${attr(id)}" class="window ${width}${side}" data-fig="window" data-title="${attr(attrs.title || 'a window')}">
    <div class="fig-stage" style="${style}"></div>
${caption ? `    <figcaption>${inline(caption, null)}</figcaption>` : ''}
  </figure>`
}

const ASIDE_KINDS = { aside: '', note: '', method: 'method', caution: 'caution' }

/** Markdown → HTML for one chapter. */
function render(body, chapter) {
  // footnote definitions are pulled out first: they may be written anywhere
  const definitions = new Map()
  const lines = []
  let pending = null
  for (const raw of body.split(/\r?\n/)) {
    const def = /^\[\^([\w-]+)\]:\s*(.*)$/.exec(raw)
    if (def) { pending = def[1]; definitions.set(def[1], def[2]); continue }
    if (pending && /^\s+\S/.test(raw)) { definitions.set(pending, definitions.get(pending) + ' ' + raw.trim()); continue }
    pending = null
    lines.push(raw)
  }
  const notes = makeNotes(definitions)

  const out = []
  let para = [], list = null, listTag = 'ul', quote = null, table = null
  let fence = null, fenceLang = '', fenceLines = []
  let block = null, blockLines = []

  const flushPara = () => {
    if (!para.length) return
    out.push(`<p>${inline(para.join(' '), notes)}</p>`)
    para = []
    const sn = notes.flush()
    if (sn) out.push(sn)
  }
  const flushList = () => {
    if (!list) return
    out.push(`<${listTag}>${list.map(i => `<li>${inline(i, notes)}</li>`).join('')}</${listTag}>`)
    list = null
    const sn = notes.flush()
    if (sn) out.push(sn)
  }
  const flushQuote = () => {
    if (!quote) return
    const cite = quote.cite ? `<cite>${inline(quote.cite, notes)}</cite>` : ''
    out.push(`<blockquote><p>${inline(quote.lines.join(' '), notes)}</p>${cite}</blockquote>`)
    quote = null
  }
  const flushTable = () => {
    if (!table) return
    const [head, ...rows] = table
    out.push(`<div class="tablewrap"><table><thead><tr>${head.map(c => `<th>${inline(c, notes)}</th>`).join('')}</tr></thead>` +
      `<tbody>${rows.map(r => `<tr>${r.map(c => `<td>${inline(c, notes)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`)
    table = null
  }
  const flushAll = () => { flushPara(); flushList(); flushQuote(); flushTable() }
  const cells = l => l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim())

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '')

    // fenced code, verbatim
    if (fence) {
      if (line.trim().startsWith('```')) {
        const name = fenceLang.includes(':') ? fenceLang.split(':').slice(1).join(':') : ''
        out.push(`<div class="codeblock">${name ? `<span class="filename">${esc(name)}</span>` : ''}` +
          `<pre><code class="lang-${esc((fenceLang.split(':')[0] || 'text').trim())}">${esc(fenceLines.join('\n'))}</code></pre></div>`)
        fence = null; fenceLines = []
      } else fenceLines.push(raw)
      continue
    }
    if (line.trim().startsWith('```')) { flushAll(); fence = true; fenceLang = line.trim().slice(3).trim(); continue }

    // a directive block, ended by a line of three colons
    if (block) {
      if (line.trim() === ':::') {
        if (block.name === 'figure') out.push(figure(block.attrs, blockLines.join(' ').trim(), chapter))
        else if (block.name === 'window') out.push(windowBlock(block.attrs, blockLines.join(' ').trim()))
        else if (block.name === 'epigraph') {
          const [text, ...rest] = blockLines.join('\n').split(/^--\s*/m)
          out.push(`<div class="epigraph"><p>${inline(text.trim(), notes)}</p>${rest.length ? `<cite>${inline(rest.join(' ').trim(), notes)}</cite>` : ''}</div>`)
        } else {
          const cls = ASIDE_KINDS[block.name] ?? ''
          const title = block.attrs.title || (block.name === 'aside' ? '' : block.name)
          out.push(`<div class="aside ${cls}">${title ? `<span class="aside-title">${esc(title)}</span>` : ''}` +
            `${render(blockLines.join('\n'), chapter)}</div>`)
        }
        block = null; blockLines = []
      } else blockLines.push(raw)
      continue
    }
    const open = /^:::\s*([\w-]+)(.*)$/.exec(line.trim())
    if (open) {
      flushAll()
      block = { name: open[1], attrs: parseAttrs(open[2]) }
      if (!(block.name === 'figure' || block.name === 'window' || block.name === 'epigraph' || block.name in ASIDE_KINDS)) {
        warn(`${chapter.slug}: unknown block ":::${block.name}" — treated as an aside`)
      }
      continue
    }

    // headings, with an optional {#id}
    const h = /^(#{1,4})\s+(.*)$/.exec(line)
    if (h) {
      flushAll()
      const level = h[1].length
      let text = h[2]
      let id = ''
      const custom = /\{#([\w-]+)\}\s*$/.exec(text)
      if (custom) { id = custom[1]; text = text.slice(0, custom.index).trim() }
      id ||= slug(text)
      const anchor = level <= 3 ? `<a class="anchor" href="#${id}" aria-label="link to this section">#</a>` : ''
      // data-short is the heading without its anchor mark, for the contents
      // rail and the running head, which read the text and not the markup
      out.push(`<h${level} id="${attr(id)}" data-short="${attr(text.replace(/[*`_]/g, ''))}">${anchor}${inline(text, notes)}</h${level}>`)
      if (level === 2) chapter.sections.push({ id, text })
      continue
    }

    if (/^(\*{3,}|-{3,}|_{3,})$/.test(line.trim())) { flushAll(); out.push('<hr>'); continue }

    // blockquote, with an em-dash attribution line as its cite
    const q = /^>\s?(.*)$/.exec(line)
    if (q) {
      flushPara(); flushList(); flushTable()
      quote ??= { lines: [], cite: '' }
      const who = /^--\s*(.*)$/.exec(q[1].trim())
      if (who) quote.cite = who[1]
      else if (q[1].trim()) quote.lines.push(q[1].trim())
      continue
    }
    if (quote && !line.trim()) { flushQuote(); continue }

    if (/^\|/.test(line.trim())) {
      flushPara(); flushList(); flushQuote()
      if (/^:?-{2,}/.test(cells(line)[0])) continue       // the ---|--- rule under a header row
      ;(table ??= []).push(cells(line))
      continue
    }

    const bullet = /^\s*[-*]\s+(.*)$/.exec(line)
    // A numbered list only where a paragraph is not already running, or every
    // sentence that happens to wrap onto a line beginning "2026. Two figures…"
    // becomes a list item.
    const number = para.length ? null : /^\s*\d{1,3}[.)]\s+(.*)$/.exec(line)
    if (bullet || number) {
      flushPara(); flushQuote(); flushTable()
      const tag = bullet ? 'ul' : 'ol'
      if (list && tag !== listTag) flushList()
      listTag = tag
      ;(list ??= []).push((bullet || number)[1])
      continue
    }

    if (!line.trim()) { flushAll(); continue }
    if (list) { list[list.length - 1] += ' ' + line.trim(); continue }   // a wrapped bullet
    flushTable()
    para.push(line.trim())
  }
  flushAll()
  if (block) warn(`${chapter.slug}: a ":::${block.name}" block was never closed`)
  if (fence) warn(`${chapter.slug}: a code fence was never closed`)

  // any note cited but never flushed (inside a heading, say)
  const left = notes.flush()
  if (left) out.push(left)
  return out.join('\n')
}

/* ======================================================================== *
 * pages
 * ======================================================================== */

const head = (title, { description = '' } = {}) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${esc(title)}</title>
  ${description ? `<meta name="description" content="${attr(description)}">` : ''}
  <meta name="author" content="${attr(doc.author)}">
  <link rel="stylesheet" href="${BASE}lib/thesis.css">
  <link rel="stylesheet" href="${BASE}lib/book.css">
  <script type="importmap">
  { "imports": ${JSON.stringify(importMap, null, 6).replace(/\n/g, '\n  ')} }
  </script>
  <script type="application/json" id="thesis-config">${JSON.stringify({
    base: BASE,
    world: (() => {
      const w = { assets: ASSETS, ...(doc.world ?? {}) }
      if (w.module) w.module = inPublic(w.module)
      return w
    })(),
    places: PLACES,
  })}</script>
  <script>
    /* the page's own opacity over the room, before the first paint */
    try { var a = localStorage.getItem('thesis-page-alpha'); if (a) document.documentElement.style.setProperty('--page-alpha', a) } catch (e) {}
  </script>
</head>`

const railHtml = (chapters, current) => `<nav class="rail" aria-label="Contents">
  <button class="rail-close" aria-label="close contents">&times;</button>
  <h2>${esc(doc.shortTitle || doc.title)}</h2>
  <div class="nav-host" data-navigator></div>
  <ol>
    <li><a href="${BASE}"${current === 'index' ? ' class="here"' : ''}>Contents</a></li>
${chapters.map(c => `    <li><a href="${BASE}${c.slug}.html"${c.slug === current ? ' class="here"' : ''}>` +
    `${c.number ? `<span class="num">${esc(c.number)}</span>` : ''}${esc(c.title)}</a></li>`).join('\n')}
  </ol>
  <h2>This chapter</h2>
  <div data-sections></div>
</nav>`

const topbar = (where, extra = '') => `<header class="topbar">
  <button data-rail-open aria-label="contents">&#9776; contents</button>
  <div class="where"><b>${esc(where)}</b> <span class="section"></span></div>
  <span class="spacer"></span>
  ${extra}
  <button data-mode-toggle>book</button>
  <label class="alpha" title="how light the room behind the page is: a floor and her shadow appear partway up">room<input type="range" min="0" max="4" step="1" data-room aria-label="how light the room is"><output data-out="room"></output></label>
  <label class="alpha" title="how solid the page is over the room behind it">page<input type="range" min="0.25" max="1" step="0.01" data-page-alpha aria-label="page opacity"></label>
  <button data-still aria-pressed="false" title="hold the room behind the page still">stop the room</button>
  <button onclick="window.print()" title="print, or save as PDF: every figure prints as its still with its address">print</button>
  <div class="progress"></div>
</header>
${panel}`

/* The tuning panel: an instrument for setting her up, not a feature of the
   document. No build writes it out unless it is asked for with --tune, so
   ?tune has nothing to turn on in an ordinary build. The reader's own control,
   how solid the page is, stays in the top bar, where it never depended on any
   of this.

   <details> rather than a button and a class, so the open state, the keyboard
   and the screen reader all come with it. */
const panelHtml = `<details class="panel" data-panel>
  <summary title="the room behind the page, and her">
    <span class="panel-dot" data-her-dot aria-hidden="true"></span>
    <span class="panel-name">her</span>
    <span class="panel-read" data-her-read></span>
  </summary>
  <div class="panel-body">
    <div class="panel-her">
      <h3>where she is</h3>
      <div class="panel-row" role="group" aria-label="where she is">
        <button data-her="watch" title="keep her at a window, watching you read">at a window</button>
        <button data-her="auto" title="let her come and go as she does">let her be</button>
        <button data-her="away" title="leave her to the room">away</button>
      </div>
      <div class="panel-row" role="group" aria-label="how much of her a window frames">
        <button data-crop="head" title="her head in the window: the portrait the frame is for">head</button>
        <button data-crop="bust" title="waist up">bust</button>
        <button data-crop="figure" title="all of her, which puts her a long way off">whole</button>
      </div>
      <label title="how much of the window she fills">fills<input type="range" min="0.3" max="1" step="0.01" data-her-fill aria-label="how much of the window she fills"><output data-out="fill"></output></label>
      <label title="where the mist begins: low and she is a rumour behind the page">presence<input type="range" min="0" max="1" step="0.02" data-her-presence aria-label="how far back the mist begins"><output data-out="presence"></output></label>
      <div class="panel-row">
        <button data-her="next" title="move her to the next window on this page">next window</button>
        <button data-her="play" title="stop the room moving">pause</button>
      </div>
      <details class="panel-sub" data-skin hidden>
        <summary>her surface</summary>
        <p class="panel-note" data-skin-note hidden>Nowhere here to see her: scroll to a window this panel is not covering.</p>
        <div data-skin-controls></div>
      </details>
    </div>
    <h3>the page over her</h3>
    <label title="how solid the page is over the room behind it">page<input type="range" min="0.25" max="1" step="0.01" data-page-alpha aria-label="page opacity"><output data-out="alpha"></output></label>
    <div class="panel-row panel-keep">
      <button data-her="copy" title="the world block for thesis.json, with everything you have changed">copy settings</button>
    </div>
  </div>
</details>`

// No build carries it unless it is asked for: `node thesis/build.mjs --tune`.
// It is an instrument for setting her up, and the rest of the time it is not
// part of the document, in the preview any more than on the site.
const panel = TUNE_MODE ? panelHtml : ''

const foot = `<script type="module">
  import { startReader } from '${BASE}lib/reader.js'
  startReader()
</script>
</body>
</html>
`

function chapterPage(chapter, chapters, i) {
  const prev = chapters[i - 1], next = chapters[i + 1]
  const nav = `<nav class="chapter-nav">
  ${prev ? `<a class="prev" href="${BASE}${prev.slug}.html"><span>previous</span>${esc(prev.title)}</a>` : ''}
  ${next ? `<a class="next" href="${BASE}${next.slug}.html"><span>next</span>${esc(next.title)}</a>` : ''}
</nav>`
  return `${head(`${chapter.title} — ${doc.title}`, { description: chapter.abstract })}
<body class="chapter" data-mode="${SITE_MODE ? 'site' : 'dev'}">
${topbar(chapter.title)}
${railHtml(chapters, chapter.slug)}
<main class="sheetbox">
  <div class="sheet"></div>
  <div class="page">
  <div class="chapter-head">
    ${chapter.number ? `<div class="kicker">Chapter ${esc(chapter.number)}</div>` : chapter.kicker ? `<div class="kicker">${esc(chapter.kicker)}</div>` : ''}
    <h1>${esc(chapter.title)}</h1>
    ${chapter.abstract ? `<p class="abstract">${inline(chapter.abstract, null)}</p>` : ''}
  </div>
${chapter.html}
${nav}
  </div>
</main>
<div class="book-shell" aria-label="the chapter as a two-page spread"></div>
${foot}`
}

function indexPage(chapters) {
  const list = chapters.map(c => `    <li>
      <a class="ch" href="${BASE}${c.slug}.html">${c.number ? `<span class="num">${esc(c.number)}</span>` : ''}${esc(c.title)}</a>
      ${c.abstract ? `<p class="blurb">${inline(c.abstract, null)}</p>` : ''}
      <div class="figs">${c.figures ? `${c.figures} figure${c.figures === 1 ? '' : 's'}` : 'no figures'}${c.sections.length ? ` · ${c.sections.length} section${c.sections.length === 1 ? '' : 's'}` : ''}</div>
    </li>`).join('\n')

  return `${head(doc.title, { description: doc.abstract })}
<body class="front" data-mode="${SITE_MODE ? 'site' : 'dev'}">
${topbar(doc.shortTitle || doc.title)}
${railHtml(chapters, 'index')}
<main class="sheetbox">
  <div class="sheet"></div>
  <div class="page">
  <div class="titlepage">
    <div class="kicker">${esc(doc.kicker || '')}</div>
    <h1>${esc(doc.title)}</h1>
    ${doc.subtitle ? `<p class="subtitle">${esc(doc.subtitle)}</p>` : ''}
    <p class="byline">${esc(doc.author)}${doc.affiliation ? `<br>${esc(doc.affiliation)}` : ''}${doc.date ? `<br>${esc(doc.date)}` : ''}</p>
  </div>
  ${doc.abstract ? `<p class="lead">${inline(doc.abstract, null)}</p>` : ''}
  ${doc.howToRead ? `<div class="aside"><span class="aside-title">How to read this</span>${render(doc.howToRead, { slug: 'index', sections: [], figures: 0, ids: new Set() })}</div>` : ''}
  <h2 id="contents">Contents</h2>
  <div class="nav-host nav-host--large" data-navigator></div>
  <p class="nav-key">One circle to a place. The disc at a centre is a place you have read; the lens between two circles fills once you have read both. Click a centre to go there.</p>
  <ol class="toc-list">
${list}
  </ol>
  <p class="colophon">${esc(doc.colophon || '')}</p>
  </div>
</main>
<div class="book-shell" aria-label="the chapter as a two-page spread"></div>
${foot}`
}

/* ======================================================================== *
 * run
 * ======================================================================== */

const chapters = []
for (const entry of doc.chapters) {
  const file = path.join(THESIS, 'chapters', entry.file)
  if (!fs.existsSync(file)) { warn(`chapters/${entry.file} is missing`); continue }
  const { meta, body } = frontMatter(fs.readFileSync(file, 'utf8'))
  const chapter = {
    ...meta, ...entry,
    slug: entry.slug || meta.slug || slug(meta.title || entry.file.replace(/\.md$/, '')),
    title: entry.title || meta.title || entry.file,
    number: entry.number ?? meta.number ?? '',
    abstract: entry.abstract || meta.abstract || '',
    kicker: meta.kicker || '',
    sections: [], figures: 0, ids: new Set(),
  }
  chapter.html = render(body, chapter)
  chapters.push(chapter)
}

// Every place in the document, in reading order: the contents page is the
// first cell, and each section of each chapter is another. lib/navigator.js
// lays them on the lattice.
PLACES = [
  { id: 'index', title: 'Contents', url: BASE },
  ...chapters.flatMap(c => c.sections.map(sec => ({
    id: `${c.slug}#${sec.id}`,
    title: sec.text.replace(/[*`_]/g, ''),
    url: `${BASE}${c.slug}.html#${sec.id}`,
    chapter: c.slug,
  }))),
]

fs.mkdirSync(OUT, { recursive: true })
for (const [i, chapter] of chapters.entries()) {
  fs.writeFileSync(path.join(OUT, chapter.slug + '.html'), chapterPage(chapter, chapters, i))
}
fs.writeFileSync(path.join(OUT, 'index.html'), indexPage(chapters))

fs.mkdirSync(path.join(OUT, 'lib'), { recursive: true })
for (const f of fs.readdirSync(path.join(THESIS, 'lib'))) {
  fs.copyFileSync(path.join(THESIS, 'lib', f), path.join(OUT, 'lib', f))
}
const posters = fs.existsSync(path.join(THESIS, 'posters'))
  ? fs.readdirSync(path.join(THESIS, 'posters')).filter(f => /\.(jpe?g|png|webp|avif)$/i.test(f))
  : []
if (posters.length) {
  fs.mkdirSync(path.join(OUT, 'posters'), { recursive: true })
  for (const f of posters) fs.copyFileSync(path.join(THESIS, 'posters', f), path.join(OUT, 'posters', f))
}

console.log(`${SITE_MODE ? 'site' : 'dev'} build → ${OUT}`)
console.log(`  three ${THREE_V}, lil-gui ${GUI_V}  (${SITE_MODE ? 'jsdelivr' : 'node_modules'})`)
for (const c of chapters) {
  console.log(`  ${c.slug}.html  ${c.figures} figure(s), ${c.sections.length} section(s)`)
}
console.log(`  index.html, lib/ (${fs.readdirSync(path.join(OUT, 'lib')).length} files), posters/ (${posters.length})`)
if (!SITE_MODE) console.log(`  read it at https://localhost:5173/thesis/preview/`)
else console.log(`  copy site\\MaximalistAssemblage\\ into the Pages repo (run tools/export_site.mjs first: it clears site\\)`)
if (warnings.length) {
  console.log(`\n${warnings.length} thing(s) to look at:`)
  for (const w of warnings) console.log(`  ! ${w}`)
}
