// Build the chapters from the Google Sheet instead of from hand-written files.
//
//   node thesis/sheet.mjs              fetch the sheet and write thesis/generated/
//   node thesis/sheet.mjs --offline    use the last fetch, do not go to the network
//   node thesis/sheet.mjs --if-changed write nothing unless the sheet has moved
//
// The proposal is written in a spreadsheet, one row per block, and that is the
// document: thesis/chapters/*.md is a different one, not a copy of this. Rather
// than teach the build a second input language, this writes markdown — the
// language it already reads — so everything downstream (figures, windows, book
// mode, the navigator, print) works without knowing where the text came from,
// and the generated files can be read to see exactly what the sheet became.
//
// Five columns are needed:
//
//   Chapter              1 … 5            one chapter each, and its number
//   Chapter Title        The Ground       the chapter's title
//   Section Heading      Ontological …    ##
//   Section Subheading                    ###
//   Section text         the prose        a paragraph of markdown
//
// and three more are read if they are there, by any capitalisation:
//
//   Page                 7                a new page starts where this changes
//   Figure               embryos          this row is that figure; the text
//                                         beside it is its caption
//   Notes                inline           "inline" joins this row to the
//                                         paragraph above; anything else in
//                                         this column is a note to yourself
//
// Row order is document order. There is no type column: a row with a Figure is
// a figure and every other row is a paragraph. The text is markdown and goes
// through untouched, so a cell that begins "- " is a bullet and one that begins
// "> " is a quotation — the marker lives in the cell rather than in a column
// beside it.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const THESIS = path.dirname(fileURLToPath(import.meta.url))
const OFFLINE = process.argv.includes('--offline')
const CACHE = path.join(THESIS, '.cache')
const OUT = path.join(THESIS, 'generated')

const doc = JSON.parse(fs.readFileSync(path.join(THESIS, 'thesis.json'), 'utf8'))
const sheet = doc.sheets
if (!sheet?.id || !sheet?.tabs?.blocks) {
  console.error('thesis.json has no sheets.id / sheets.tabs.blocks — nothing to fetch')
  process.exit(1)
}

const warnings = []
const warn = m => warnings.push(m)
const unchanged = []        // tabs whose fetch matched the cached copy exactly
// --if-changed: write nothing when every tab came back the same. The dev
// server polls with this so that reading the page is not interrupted by a
// rebuild every time round.
const IF_CHANGED = process.argv.includes('--if-changed')

/* ---- getting the CSV -----------------------------------------------------
 * The cache is what makes this usable on a train. A fetch that fails falls
 * back to it and says so; only a first run with no cache is fatal. */
async function tab(gid, name) {
  const cached = path.join(CACHE, `${gid}.csv`)
  const url = `https://docs.google.com/spreadsheets/d/${sheet.id}/export?format=csv&gid=${gid}`
  if (!OFFLINE) {
    try {
      const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(20000) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const text = await res.text()
      // A sheet that is not shared answers 200 with a sign-in page, so the
      // status alone does not say the fetch worked.
      if (/^\s*<!DOCTYPE html/i.test(text)) throw new Error('got a sign-in page: the sheet is not link-viewable')
      fs.mkdirSync(CACHE, { recursive: true })
      // Did this fetch bring anything new? The caller uses it to decide
      // whether to write the chapters out again, which is what makes the
      // browser reload.
      if (fs.existsSync(cached) && fs.readFileSync(cached, 'utf8') === text) unchanged.push(name)
      fs.writeFileSync(cached, text, 'utf8')
      return text
    } catch (err) {
      if (!fs.existsSync(cached)) throw new Error(`could not fetch the ${name} tab, and there is no cached copy: ${err.message}`)
      warn(`could not fetch the ${name} tab (${err.message}); using the copy from ${fs.statSync(cached).mtime.toLocaleString()}`)
    }
  }
  if (!fs.existsSync(cached)) throw new Error(`no cached copy of the ${name} tab to work from`)
  return fs.readFileSync(cached, 'utf8')
}

/** RFC 4180 enough for Sheets: quoted fields, doubled quotes, CRLF inside. */
function parseCsv(text) {
  const rows = []
  let row = [], field = '', quoted = false
  const s = text.replace(/^﻿/, '')
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (quoted) {
      if (c === '"') { if (s[i + 1] === '"') { field += '"'; i++ } else quoted = false }
      else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else if (c !== '\r') field += c
  }
  if (field || row.length) { row.push(field); rows.push(row) }
  const head = rows.shift() ?? []
  return rows
    .filter(r => r.some(c => c.trim()))
    .map(r => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] ?? '').trim()])))
}

const slug = s => s.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
// "Chapter 1: The Ground" under chapter "Chapter 1:" is just "The Ground"
// The Chapter column has been written both ways while the sheet is being
// reorganised -- "Chapter 3:" and plain "3" -- so the number is taken from
// either, and the prefix comes off the heading whichever way it was written.
// Without this a heading tidied in one place looks like a renumbering.
/* ---- a row ---------------------------------------------------------------
 * Only the five columns. A row that names no chapter cannot be placed on a
 * page, and a row with no text is an outline entry: a section that exists and
 * has not been written yet, which is worth showing as an empty heading. */
const COLUMNS = ['Chapter', 'Chapter Title', 'Section Heading', 'Section Subheading', 'Section text']

function checkColumns(rows) {
  if (!rows.length) throw new Error('that tab is empty')
  const missing = COLUMNS.filter(c => !(c in rows[0]))
  if (missing.length) {
    throw new Error(`that tab has no ${missing.map(c => `"${c}"`).join(', ')} column`
      + ` — it has ${Object.keys(rows[0]).filter(Boolean).map(c => `"${c}"`).join(', ')}`)
  }
}

// Page, Figure and Notes are looked up without regard to case or spacing,
// because "Page" and "page" are the same column to anyone typing it, and a
// column that is only read when it happens to be there should not also insist
// on a capital letter.
const pick = (r, name) => {
  const key = Object.keys(r).find(k => k.trim().toLowerCase() === name)
  return key ? (r[key] ?? '').trim() : ''
}

const read = r => ({
  chapter: (r.Chapter ?? '').trim(),
  title: (r['Chapter Title'] ?? '').trim(),
  heading: (r['Section Heading'] ?? '').trim(),
  subheading: (r['Section Subheading'] ?? '').trim(),
  text: (r['Section text'] ?? '').trim(),
  page: pick(r, 'page'),
  figure: pick(r, 'figure'),
  notes: pick(r, 'notes'),
})

// A page break, written as the directive the build reads. It closes itself —
// there is nothing to put inside a page break — and it is one string so that
// it travels as a block and can be recognised and lifted above a heading.
const NEWPAGE = ':::newpage'

/* ---- the chapters --------------------------------------------------------
 * Chapter Title, Section Heading and Section Subheading are written once, on
 * the first row of what they cover; the rows under them leave the cell blank.
 * So a blank cell means "the same as above", and the walk carries the last
 * value forward.
 *
 * The resets are the part that has to be right. A new chapter clears the
 * title, the heading and the subheading; a new heading clears the subheading;
 * a new subheading clears nothing. Without the middle one a heading inherits
 * the subheading of the heading before it, and its first paragraphs end up
 * filed under a section they have nothing to do with.
 *
 * Only a change resets: a cell that repeats the value above it is still the
 * same section. */
function chaptersFrom(rows) {
  checkColumns(rows)
  const chapters = new Map()
  let chapter = null, heading = null, subheading = null
  let pageNo = null, seenPages = new Set()
  let placed = 0, orphaned = 0, breaks = 0, figures = 0, inlined = 0

  for (const raw of rows) {
    const r = read(raw)

    if (r.chapter && r.chapter !== chapter?.number) {
      chapter = chapters.get(r.chapter) ?? { number: r.chapter, title: '', titles: new Set(), sections: new Map() }
      chapters.set(r.chapter, chapter)
      heading = subheading = null
      // A chapter is its own document and starts on its own page, so the page
      // numbering starts again with it rather than carrying a break across.
      pageNo = null
      seenPages = new Set()
    }
    if (!chapter) {
      if (r.text) orphaned++        // text above the first chapter is text on no page
      continue
    }
    if (r.title) { chapter.titles.add(r.title); if (!chapter.title) chapter.title = r.title }

    if (r.heading && r.heading !== heading) { heading = r.heading; subheading = null }
    if (r.subheading && r.subheading !== subheading) subheading = r.subheading
    if (r.subheading && !heading && !chapter.warnedLoose) {
      chapter.warnedLoose = true
      warn(`chapter ${chapter.number}: "${r.subheading}" is a Section Subheading with no Section`
        + ' Heading above it, so it has nothing to sit under')
    }

    /* ---- Page: where a new page starts ---------------------------------
     * The pages are measured in the browser. How many there are depends on
     * the window, the type size, and whether the reader has the book on at
     * all, so a page number cannot be an address -- there is nothing stable
     * for it to address. A *change* in it can be an instruction, and this is
     * that: start a new page here. Rows that repeat the number stay on it,
     * and the page still breaks on its own if it fills up first. */
    if (r.page && r.page !== pageNo) {
      const first = pageNo === null
      pageNo = r.page
      if (!first) section(chapter, heading, subheading).push(NEWPAGE)
      if (seenPages.has(r.page)) {
        warn(`chapter ${chapter.number}: page "${r.page}" is started again further down the sheet`
          + ' — the rows of one page have to be together, because row order is the order of the writing')
      }
      seenPages.add(r.page)
      breaks++
    }

    /* ---- Figure: a figure of its own, in the flow ------------------------
     * The cell names one of the Processing sketches -- "embryos" -- and may
     * add attributes after it, "embryos width=full". A cell whose first word
     * already has an = is written out in full and goes through as it is, so
     * "image=plan.jpg" and "video=room.mp4" work too. The Section text beside
     * it is the caption, not a paragraph. */
    if (r.figure) {
      const [head, ...rest] = r.figure.split(/\s+/)
      const attrs = [head.includes('=') ? head : `processing=${head}`, ...rest].join(' ')
      const lines = [`:::figure ${attrs}`, ...(r.text ? [r.text] : []), ':::']
      section(chapter, heading, subheading).push(lines.join('\n'))
      figures++
      continue
    }

    if (!r.text) {
      // An outline entry: a section that exists and has not been written yet.
      // Naming it is enough to make the heading appear, empty.
      section(chapter, heading, subheading)
      continue
    }
    // A line break inside the cell starts a new paragraph. That is the only
    // way to break one -- a row is a row -- and it is what Alt+Enter does in
    // Sheets. Blank lines are dropped, so pressing it twice is the same as
    // once, and a trailing one leaves no empty paragraph behind.
    const paras = r.text.split(/\r?\n/).map(t => t.trim()).filter(Boolean)
    const list = section(chapter, heading, subheading)

    /* ---- Notes: "inline" runs the row on --------------------------------
     * These blocks were sorted as fragments, so two rows next to each other
     * are often two halves of one paragraph. "inline" in the Notes column
     * joins this row onto the one above instead of starting a paragraph of
     * its own. That one word is all the parser takes from this column:
     * anything else written there is a note to yourself and is ignored. */
    if (/\binline\b/i.test(r.notes)) {
      const prev = list.length ? list[list.length - 1] : ''
      if (prev && !prev.startsWith(':::')) {
        list[list.length - 1] = `${prev} ${paras.join(' ')}`
        inlined++
        continue
      }
      warn(`chapter ${chapter.number}: a row marked "inline" has no paragraph above it to join, so`
        + ` it starts one of its own — "${r.text.slice(0, 48)}${r.text.length > 48 ? '…' : ''}"`)
    }

    for (const para of paras) list.push(para)
    placed += paras.length
  }

  if (orphaned) warn(`${orphaned} row(s) have text before any Chapter, so they are on no page`)
  for (const ch of chapters.values()) {
    if (!ch.title) warn(`chapter ${ch.number} has no Chapter Title`)
    else if (ch.titles.size > 1) {
      warn(`chapter ${ch.number} is given ${ch.titles.size} different titles: `
        + [...ch.titles].map(t => `"${t}"`).join(', ') + ' — only the first is used')
    }
  }
  console.log(`  ${placed} block(s) placed`
    + (figures ? `, ${figures} figure(s)` : '')
    + (breaks ? `, ${breaks} page(s)` : '')
    + (inlined ? `, ${inlined} row(s) run on` : ''))

  // The Chapter column decides the order of the chapters, so that moving one
  // is a change to a column rather than to four hundred rows. Row order still
  // decides everything within a chapter. Numbers sort as numbers; if they are
  // not all numbers, the order they were found in stands.
  const ordered = [...chapters.values()]
  if (ordered.every(c => /^\d+$/.test(c.number))) {
    ordered.sort((a, b) => Number(a.number) - Number(b.number))
  } else {
    warn('not every Chapter is a number, so the chapters are in the order their rows are in: '
      + ordered.map(c => `"${c.number}"`).join(', '))
  }

  // A page break asked for on the row that also starts a section belongs
  // *above* that section's heading, not under it — otherwise the heading is
  // left alone at the foot of the page the break was meant to end. The break
  // was pushed into the section's blocks, so it is lifted back out here.
  const liftBreak = (blocks, lines) => {
    if (blocks[0] === NEWPAGE) lines.push('', blocks.shift())
  }

  return ordered.map(ch => {
    const lines = []
    for (const [name, subs] of ch.sections) {
      if (name) liftBreak(subs.values().next().value ?? [], lines)
      if (name) lines.push('', `## ${name}`)
      for (const [sub, blocks] of subs) {
        if (sub) liftBreak(blocks, lines)
        if (sub) lines.push('', `### ${sub}`)
        for (const b of blocks) lines.push('', b)
      }
    }
    return { number: ch.number, title: ch.title || `Chapter ${ch.number}`, lines }
  })
}

/** The list of paragraphs under one heading and subheading, made if new.
 *  Keyed in the order first seen, so a heading that comes back further down
 *  the sheet carries on rather than starting a second section of that name. */
function section(chapter, heading, subheading) {
  const key = heading ?? ''
  if (!chapter.sections.has(key)) chapter.sections.set(key, new Map())
  const subs = chapter.sections.get(key)
  const subKey = subheading ?? ''
  if (!subs.has(subKey)) subs.set(subKey, [])
  return subs.get(subKey)
}

/* ---- write it out -------------------------------------------------------- */
const blocksCsv = await tab(sheet.tabs.blocks, 'blocks')
if (IF_CHANGED && unchanged.includes('blocks') && fs.existsSync(path.join(OUT, 'chapters.json'))) {
  process.exit(0)        // nothing new in the sheet, and the chapters are already written
}
const rows = parseCsv(blocksCsv)
const chapters = chaptersFrom(rows)

// Written beside the real folder and moved into place at the end. The dev
// server watches thesis/generated/ and rebuilds when it changes, so emptying
// it and refilling it leaves a window in which the build runs against an
// empty folder and fails -- which the poll would walk into every time.
const TMP = OUT + '.writing'
fs.rmSync(TMP, { recursive: true, force: true })
fs.mkdirSync(TMP, { recursive: true })

const manifest = chapters.map((c, i) => {
  const name = `${String(i + 1).padStart(2, '0')}-${slug(c.title)}.md`
  const body = c.lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n'
  fs.writeFileSync(path.join(TMP, name), `---\ntitle: ${c.title}\n---\n\n${body}`, 'utf8')
  return { file: name, slug: slug(c.title), number: c.number, title: c.title }
})

fs.writeFileSync(path.join(TMP, 'chapters.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8')

// One move, rather than a delete and a slow refill.
fs.rmSync(OUT, { recursive: true, force: true })
fs.renameSync(TMP, OUT)

console.log(`sheet → ${OUT}`)
for (const c of manifest) {
  const words = fs.readFileSync(path.join(OUT, c.file), 'utf8').split(/\s+/).length
  console.log(`  ${c.file.padEnd(34)} ${String(words).padStart(6)} words`)
}
if (warnings.length) {
  console.log(`\n${warnings.length} thing(s) to fix in the sheet:`)
  for (const w of warnings) console.log(`  ! ${w}`)
}
