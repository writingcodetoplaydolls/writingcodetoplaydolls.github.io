// Search terms and their narrowings, as a tree. A row is a term with a hit count. A term narrows
// another when the file says so (a parent column), or, failing that, when its words contain the
// other's whole phrase: "new materialism art education" narrows "new materialism", and
// "positionality AND intersectionality" narrows "positionality". The longest such phrase is taken
// as the parent (more hits breaks a tie), so a term sits under the nearest broader one. Nodes are
// { term, hits, group, parent, children, depth, row }; roots are the terms that narrow nothing.

import { asNumber } from './csv.js'

const words = s => String(s).toLowerCase().replace(/["'*()\[\]]/g, ' ').replace(/\b(and|or|not)\b/g, ' ').split(/\s+/).filter(Boolean)
const phraseIn = (phrase, inWords) => {                           // the phrase's words appear in order, whole, somewhere in inWords
  if (!phrase.length || phrase.length >= inWords.length) return false
  outer: for (let i = 0; i + phrase.length <= inWords.length; i++) {
    for (let k = 0; k < phrase.length; k++) if (inWords[i + k] !== phrase[k]) continue outer
    return true
  }
  return false
}

export function buildTermTree(rows, cols, { minHits = 0 } = {}) {
  const nodes = []
  for (const row of rows) {
    const hits = asNumber(row[cols.hits]); const term = String(row[cols.term] ?? '').trim()
    if (hits === null || !term || hits < minHits) continue
    nodes.push({ term, hits, group: cols.group ? String(row[cols.group] ?? '').trim() : '', parent: null, children: [], depth: 0, row, words: words(term) })
  }
  const byTerm = new Map(nodes.map(n => [n.term.toLowerCase(), n]))
  for (const n of nodes) {
    let parent = null
    if (cols.parent && row_has(n.row, cols.parent)) parent = byTerm.get(String(n.row[cols.parent]).trim().toLowerCase()) ?? null
    else {
      const candidates = nodes.filter(m => m !== n && phraseIn(m.words, n.words))
      candidates.sort((a, b) => b.words.length - a.words.length || b.hits - a.hits)
      parent = candidates[0] ?? null
    }
    if (parent && parent !== n) { n.parent = parent; parent.children.push(n) }
  }
  const roots = nodes.filter(n => !n.parent)
  const walk = (n, d) => { n.depth = d; n.children.sort((a, b) => b.hits - a.hits); n.children.forEach(c => walk(c, d + 1)) }
  roots.sort((a, b) => b.hits - a.hits); roots.forEach(r => walk(r, 0))
  const groups = [...new Set(nodes.map(n => n.group))].sort()
  return { roots, nodes, groups }
}
const row_has = (row, col) => String(row[col] ?? '').trim() !== ''
