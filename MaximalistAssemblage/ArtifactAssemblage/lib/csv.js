// CSV in, rows out: a small reader for the files a sketch draws from. Handles quoted fields with
// commas and newlines inside them, CRLF line ends, a byte-order mark, and the SOURCE / NOTES rows
// this project's own spreadsheets carry at the bottom: any row whose number column is not a number
// is a note, not data, and is set aside. Columns are guessed by name (the term, its hit count, an
// optional parent it narrows, an optional group); pass `columns` to say otherwise.

export function parseCsv(text) {
  const rows = [], row = [], src = text.replace(/^﻿/, '')
  let field = '', quoted = false
  const endField = () => { row.push(field); field = '' }
  const endRow = () => { endField(); if (row.some(v => v !== '')) rows.push(row.slice()); row.length = 0 }
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (quoted) {
      if (ch === '"') { if (src[i + 1] === '"') { field += '"'; i++ } else quoted = false }
      else field += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') endField()
    else if (ch === '\n') endRow()
    else if (ch !== '\r') field += ch
  }
  if (field !== '' || row.length) endRow()
  const columns = rows.shift() ?? []
  return { columns, rows: rows.map(r => Object.fromEntries(columns.map((c, k) => [c, r[k] ?? '']))) }
}

// Which column is which. Names are matched loosely; the hits column must also hold numbers.
export function guessColumns(columns, rows = [], override = {}) {
  const find = (res) => columns.find(c => res.some(re => re.test(c)))
  const numeric = c => rows.some(r => /^\s*[\d,.]+\s*$/.test(r[c] ?? ''))
  const hits = override.hits ?? columns.filter(numeric).find(c => /hit|total|result|count|^n$|number|freq/i.test(c)) ?? columns.find(numeric)
  const term = override.term ?? find([/^term$/i, /search_term|term|query|search|phrase|keyword/i, /name|label|title/i]) ?? columns.find(c => c !== hits)
  const parent = override.parent ?? find([/parent|narrow|broader|refin|derived|from_term/i])
  const group = override.group ?? find([/^group$/i, /group|round|phase|set|category|dataset|source$/i])
  return { term, hits, parent, group }
}

const asNumber = v => { const n = parseFloat(String(v ?? '').replace(/,/g, '')); return Number.isFinite(n) ? n : null }

// The data rows (a term and a number) and the note rows, kept apart.
export function splitNotes(rows, cols) {
  const data = [], notes = []
  for (const r of rows) (asNumber(r[cols.hits]) === null ? notes : data).push(r)
  return { data, notes }
}
export { asNumber }

export async function loadCsv(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url}: ${res.status}`)
  return parseCsv(await res.text())
}

// A CSV dropped onto an element, or chosen with the file picker, arrives as text at onText(text, name).
export function acceptCsvFiles(element, onText) {
  const read = file => { if (!file) return; const fr = new FileReader(); fr.onload = () => onText(fr.result, file.name); fr.readAsText(file) }
  element.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' })
  element.addEventListener('drop', e => { e.preventDefault(); read(e.dataTransfer.files[0]) })
  const input = document.createElement('input'); input.type = 'file'; input.accept = '.csv,text/csv'; input.style.display = 'none'
  input.addEventListener('change', () => { read(input.files[0]); input.value = '' })
  document.body.appendChild(input)
  return { openPicker: () => input.click() }
}
