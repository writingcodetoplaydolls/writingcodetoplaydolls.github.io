// Export sketches to the static site layout used by writingcodetoplaydolls.github.io.
//
//   node tools/export_site.mjs            → writes K:\OneDrive\WebXR\site\
//
// site/assets/<folder>/…                                 copy of public/<folder> (models, video, scenes)
// site/MaximalistAssemblage/ArtifactAssemblage/
//   harness.js, lib/                                      shared by every page below
//   Tests/<name>/, Tests/index.html                       tests: small scripts, each recreating one feature in Three.js
//   Works/<name>/, Works/index.html                       works: free-standing pieces, entire previous works and proto-assemblages
//   docs/                                                 the project notes and timelines from docs/, rendered to HTML, plus their CSVs
//
// Each sketch folder gets the sketch source with './models/' rewritten to '/assets/models/' (root-anchored:
// the repo is a user site, so /assets/ is the live path) and '../lib/' to '../../lib/', plus an index.html
// whose import map pulls Three and lil-gui from a CDN at the exact versions installed here.
// Copy the two top-level folders (assets, MaximalistAssemblage) into the repo root to publish.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SITE = path.join(ROOT, 'site')
const BASE = path.join(SITE, 'MaximalistAssemblage', 'ArtifactAssemblage')

// A sketch is a test (one feature, isolated) or a work (a free-standing piece).
// The published viewer carries the works and nothing else: the tests are how
// the works were arrived at, and a reader given all of them reads a workshop
// rather than a thesis. They stay here, and in the dev picker, marked site: false.
// site: false keeps a sketch out of the export and the nav; nav: false exports it
// but leaves it off the index, for one that is a figure in the document rather
// than a piece to browse. The bouquet is published as a one-file page
// under MaximalistAssemblage/Bouquet/ (tools/build_bouquet_page.py --site), beside the methods document.
// The terms timeline is another one-file page there, under MaximalistAssemblage/QuacksLikeADuck/
// (tools/build_terms_timeline.py --site; not a sketch, so not listed here). The tree is not published yet.
const SECTIONS = {
  test: { dir: 'Tests', title: 'Tests', intro: 'Small scripts, each recreating one feature in Three.js.' },
  work: { dir: 'Works', title: 'Works', intro: 'Free-standing pieces: entire previous works and proto-assemblages.' },
}
const SKETCHES = {
  mixamo:             { kind: 'test', site: false, title: 'Capoeira',         blurb: 'A scanned figure, rigged in Mixamo, running capoeira clips. Click her to switch moves.' },
  house:              { kind: 'test', site: false, title: 'House',            blurb: 'The SketchUp house and the scanned treehouse under a physically based sky with sun shadows.' },
  ik:                 { kind: 'test', site: false, title: 'Reach',            blurb: 'No clips: drag a sphere and the hand reaches for it, solved on the joints every frame by a two-bone solve with a pole, within joint limits measured on the rig and around a solid body; feet too if you like, and in a headset the controllers carry the spheres.' },
  puppet:             { kind: 'test', site: false, title: 'Puppet',           blurb: 'The capoeira movement with the Mixamo skin thrown away: every joint is a plain object addressed by name, and a body of spheres and struts, a lamp in one hand, a trail from the other and two sliders that bend joints are written in code on top of it.' },
  multiscreen:        { kind: 'test', site: false, title: 'Screens',          blurb: 'One sketch on several displays: the controller finds the screens attached (a projector on HDMI, a second monitor), opens a fullscreen output on any of them, and keeps every output in step with its clock; each output is the same scene from its own camera.' },
  bouquet:            { kind: 'test', site: false, title: 'Bouquet', blurb: 'Search-term hits from a CSV as a bouquet of balloons with fireflies: every term a balloon sized by its hits, each narrower term a smaller balloon on its parent\'s string, and a blinking swarm round each; drop your own CSV on the page.' },
  tree:               { kind: 'test', nav: false, title: 'Tree',    blurb: 'One author\'s texts as nodes on a root: the trunk is the years, oldest at the bottom; every text a sphere on a branch at its year, its cited sources hanging below it as leaves; ties for text reuse and self-citation. Reads the litmap tables.' },
  'proto-assemblage': { kind: 'work', title: 'Proto-assemblage', blurb: 'The Unity house scene rebuilt: day-night sun, interior lights, the rock and Greg, a video projector on the living-room wall, teleport by clicking a floor.' },
  family:             { kind: 'work', title: 'Family',           blurb: 'The December 2018 Unity scene: giant figures, a lamp, an oven and a hawk all wearing quilt animations under a video sky, and the city house with a doorway cut in, a hall inside and a projector throwing out of it.' },
}
// The notes in docs/: markdown rendered to pages (not copied as .md, which Jekyll would also try to render), CSVs served as they are
const DOCS = [
  { file: 'PROJECTS.md',              slug: 'projects',              title: 'Projects and sketches' },
  { file: 'unity_house_timeline.md',  slug: 'unity-house-timeline',  title: 'When the Unity house was written' },
  { file: 'family_scene_timeline.md', slug: 'family-scene-timeline', title: 'The Family scene: where its pieces came from' },
]
const DOC_FILES = ['family_scene_lineage.csv', 'unity_house_timeline.csv', 'fbx_catalog.csv']

// public/<folder>/… is served as /assets/<folder>/… on the site; sketch paths are rewritten to match
const ASSET_FOLDERS = fs.readdirSync(path.join(ROOT, 'public'), { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name)

const ver = pkg => JSON.parse(fs.readFileSync(path.join(ROOT, 'node_modules', pkg, 'package.json'), 'utf8')).version
const THREE_V = ver('three'), GUI_V = ver('lil-gui')
// site: false is not published at all; nav: false is published but not listed,
// for a sketch that is a figure in the document rather than a piece to browse
const ofKind = kind => Object.entries(SKETCHES).filter(([, s]) => s.kind === kind && s.site !== false && s.nav !== false)
const otherKind = kind => kind === 'test' ? 'work' : 'test'
// a section with nothing published in it is not a section: no directory, no
// index, and no link to it from anywhere else
const liveKinds = Object.keys(SECTIONS).filter(k => ofKind(k).length)

const page = (name, { title, kind }) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${title}</title>
  <style>
    html, body { margin: 0; height: 100%; background: #111; overflow: hidden; }
    canvas { display: block; touch-action: none; }
    #overlay {
      position: fixed; left: 16px; top: 16px; color: #eee; font: 14px system-ui, sans-serif;
      user-select: none; text-shadow: 0 1px 3px rgba(0,0,0,.9), 0 0 8px rgba(0,0,0,.5);
    }
    #overlay a { color: #9cc7ff; text-decoration: none; margin-right: 12px; }
    #overlay a:hover { text-decoration: underline; }
    #overlay .group { margin-right: 18px; } #overlay .group > a:first-child { color: #ddd; } #overlay b { margin-right: 12px; }
    #hint { margin-top: 6px; pointer-events: none; }
  </style>
  <script type="importmap">
  { "imports": {
      "three": "https://cdn.jsdelivr.net/npm/three@${THREE_V}/build/three.module.js",
      "three/addons/": "https://cdn.jsdelivr.net/npm/three@${THREE_V}/examples/jsm/",
      "lil-gui": "https://cdn.jsdelivr.net/npm/lil-gui@${GUI_V}/dist/lil-gui.esm.min.js"
  } }
  </script>
</head>
<body>
  <div id="overlay">
    <nav>${[kind, otherKind(kind)].filter(k => ofKind(k).length).map(k => `<span class="group"><a href="../../${SECTIONS[k].dir}/">${SECTIONS[k].title}:</a> ${ofKind(k).map(([n, s]) => n === name ? `<b>${s.title}</b>` : `<a href="../../${SECTIONS[k].dir}/${n}/">${s.title}</a>`).join('')}</span>`).join('')}<a href="../../docs/">Notes</a></nav>
    <div id="hint">loading…</div>
  </div>
  <script type="module">
    import { run } from '../../harness.js'
    import * as sketch from './sketch.js'
    run(sketch, { title: ${JSON.stringify(title)} })
  </script>
</body>
</html>
`

const indexPage = kind => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${SECTIONS[kind].title}</title>
  <style>
    body { max-width: 48rem; margin: 0 auto; padding: 2rem 1.5rem; font: 16px/1.5 system-ui, sans-serif; background: #111; color: #ddd; }
    a { color: #9cc7ff; } h1 { font-size: 1.4rem; } h2 { font-size: 1.1rem; margin-top: 2.2rem; } li { margin: .6rem 0; } p { margin: .2rem 0 0; color: #aaa; } .intro { margin-bottom: 1.2rem; }
  </style>
</head>
<body>
  <h1>${SECTIONS[kind].title}</h1>
  <p class="intro">${SECTIONS[kind].intro}</p>
  <ul>
${ofKind(kind).map(([n, s]) => `    <li><a href="${n}/">${s.title}</a><p>${s.blurb}</p></li>`).join('\n')}
  </ul>
  <p><a href="../docs/">Notes: project pages and timelines &rarr;</a></p>
${ofKind(otherKind(kind)).length ? `  <h2><a href="../${SECTIONS[otherKind(kind)].dir}/">${SECTIONS[otherKind(kind)].title}</a></h2>
  <p class="intro">${SECTIONS[otherKind(kind)].intro}</p>
  <ul>
${ofKind(otherKind(kind)).map(([n, s]) => `    <li><a href="../${SECTIONS[otherKind(kind)].dir}/${n}/">${s.title}</a><p>${s.blurb}</p></li>`).join('\n')}
  </ul>` : ''}
</body>
</html>
`

// A notes page: the same look as the section indexes, plus tables and code.
const docPage = (title, body) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <style>
    body { max-width: 60rem; margin: 0 auto; padding: 2rem 1.5rem; font: 16px/1.5 system-ui, sans-serif; background: #111; color: #ddd; }
    a { color: #9cc7ff; } h1 { font-size: 1.5rem; } h2 { font-size: 1.2rem; margin-top: 2.2rem; } h3 { font-size: 1.05rem; margin-top: 1.6rem; }
    li { margin: .4rem 0; } p { margin: .6rem 0; } .intro { color: #aaa; } hr { border: 0; border-top: 1px solid #333; margin: 2rem 0; }
    code { background: #222; padding: 0 .3em; border-radius: 3px; font-size: .92em; }
    .t { overflow-x: auto; margin: 1rem 0; } table { border-collapse: collapse; font-size: .92rem; }
    th, td { border: 1px solid #333; padding: .35rem .55rem; vertical-align: top; text-align: left; } th { background: #1b1d24; }
    nav a { margin-right: 14px; } nav { margin-bottom: 1.5rem; }
  </style>
</head>
<body>
  <nav><a href="./">Notes</a><a href="../Tests/">Tests</a><a href="../Works/">Works</a></nav>
${body}
</body>
</html>
`

// Enough markdown for the notes: headings, paragraphs, bullets, tables, rules, bold, code, links.
function md2html(md) {
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const inline = s => esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
  const out = []
  let para = [], list = null, table = null
  const flushPara = () => { if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = [] } }
  const flushList = () => { if (list) { out.push(`<ul>${list.map(i => `<li>${inline(i)}</li>`).join('')}</ul>`); list = null } }
  const flushTable = () => {
    if (!table) return
    const [head, ...rows] = table
    out.push(`<div class="t"><table><thead><tr>${head.map(c => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`)
    table = null
  }
  const cells = l => l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim())
  for (const raw of md.split(/\r?\n/)) {
    const line = raw.replace(/\s+$/, '')
    const h = line.match(/^(#{1,3}) (.*)/)
    if (h) { flushPara(); flushList(); flushTable(); out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); continue }
    if (/^-{3,}$/.test(line.trim())) { flushPara(); flushList(); flushTable(); out.push('<hr>'); continue }
    if (/^\|/.test(line.trim())) { flushPara(); flushList(); if (/^-{2,}/.test(cells(line)[0])) continue; (table ??= []).push(cells(line)); continue }
    if (/^- /.test(line)) { flushPara(); flushTable(); (list ??= []).push(line.slice(2)); continue }
    if (!line.trim()) { flushPara(); flushList(); flushTable(); continue }
    if (list) { list[list.length - 1] += ' ' + line.trim(); continue }          // a wrapped bullet
    flushTable(); para.push(line.trim())
  }
  flushPara(); flushList(); flushTable()
  return out.join('\n')
}

fs.rmSync(SITE, { recursive: true, force: true })
fs.mkdirSync(BASE, { recursive: true })

// assets: every folder under public/
for (const folder of ASSET_FOLDERS) fs.cpSync(path.join(ROOT, 'public', folder), path.join(SITE, 'assets', folder), { recursive: true })

// shared: the component modules (src/lib) and the page harness, one level above the sections
fs.cpSync(path.join(ROOT, 'src', 'lib'), path.join(BASE, 'lib'), { recursive: true })
fs.copyFileSync(path.join(ROOT, 'src', 'site-harness.js'), path.join(BASE, 'harness.js'))

// sketches, each in its section
const pathRe = new RegExp(`'\\./(${ASSET_FOLDERS.join('|')})/`, 'g')
const libRe = /'\.\.\/lib\//g
for (const [name, spec] of Object.entries(SKETCHES)) {
  if (spec.site === false) continue
  const dir = path.join(BASE, SECTIONS[spec.kind].dir, name)
  fs.mkdirSync(dir, { recursive: true })
  const src = fs.readFileSync(path.join(ROOT, 'src', 'sketches', name + '.js'), 'utf8')
  const rewritten = src.replace(pathRe, (_, folder) => `'/assets/${folder}/`).replace(libRe, "'../../lib/")
  fs.writeFileSync(path.join(dir, 'sketch.js'), rewritten)
  fs.writeFileSync(path.join(dir, 'index.html'), page(name, spec))
  const refs = [...rewritten.matchAll(/'(\/assets\/[^']+)'/g)].map(m => m[1])
  for (const r of refs) {
    const local = path.join(SITE, r.replace(/^\//, '').split('/').join(path.sep))
    const optional = /pregnant_v2|ginga-forward|au\.fbx/.test(r)
    if (!fs.existsSync(local) && !(r.endsWith('/') || optional)) console.warn(`  ! ${name}: ${r} is referenced but not in the export`)
  }
}
for (const kind of liveKinds) fs.writeFileSync(path.join(BASE, SECTIONS[kind].dir, 'index.html'), indexPage(kind))

// docs: markdown → pages, CSVs copied
const DOCS_DIR = path.join(BASE, 'docs')
fs.mkdirSync(DOCS_DIR, { recursive: true })
for (const d of DOCS) {
  const src = path.join(ROOT, 'docs', d.file)
  if (!fs.existsSync(src)) { console.warn(`  ! docs/${d.file} not found`); continue }
  fs.writeFileSync(path.join(DOCS_DIR, d.slug + '.html'), docPage(d.title, md2html(fs.readFileSync(src, 'utf8'))))
}
const served = []
for (const f of DOC_FILES) {
  const src = path.join(ROOT, 'docs', f)
  if (!fs.existsSync(src)) { console.warn(`  ! docs/${f} not found`); continue }
  fs.copyFileSync(src, path.join(DOCS_DIR, f)); served.push({ f, kb: Math.round(fs.statSync(src).size / 1024) })
}
fs.writeFileSync(path.join(DOCS_DIR, 'index.html'), docPage('Notes', `  <h1>Notes</h1>
  <p class="intro">What each sketch is, where it came from and when, and the timelines behind the Unity projects.</p>
  <ul>
${DOCS.map(d => `    <li><a href="${d.slug}.html">${d.title}</a></li>`).join('\n')}
  </ul>
  <h2>Data</h2>
  <ul>
${served.map(s => `    <li><a href="${s.f}">${s.f}</a> (${s.kb} KB)</li>`).join('\n')}
  </ul>`))

const count = dir => fs.readdirSync(dir, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? count(path.join(dir, e.name)) : 1), 0)
console.log(`three ${THREE_V}, lil-gui ${GUI_V}`)
console.log(`site → ${SITE}`)
console.log(`  assets/models: ${count(path.join(SITE, 'assets', 'models'))} files`)
for (const kind of liveKinds) console.log(`  ${SECTIONS[kind].dir}: ${ofKind(kind).map(([n]) => n).join(', ')} + index.html`)
console.log(`  docs: ${DOCS.map(d => d.slug + '.html').join(', ')} + index.html + ${DOC_FILES.join(', ')}`)
console.log(`  shared: harness.js + lib/`)
