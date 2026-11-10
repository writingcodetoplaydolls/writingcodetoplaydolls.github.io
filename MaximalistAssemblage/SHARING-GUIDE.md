<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Author Voice &amp; Citation Analysis — A Guide</title>
<meta name="description" content="How a non-coder, working with an AI assistant, can build a voice profile and citation map of one author's writing.">
<style>
:root{
  --bg:#f6f7f4; --surface:#ffffff; --surface-2:#eef1ea; --fg:#1b2019; --muted:#5f6b5e;
  --line:#dde3d9; --accent:#6b7f4e; --accent-strong:#4f6136; --accent-soft:#e7eede;
  --code-bg:#f0f2ec; --code-fg:#384032; --pill:#eef1ea;
  --sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  --mono:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,"Liberation Mono",monospace;
  --maxw:760px;
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --bg:#12140f; --surface:#191c15; --surface-2:#20241b; --fg:#e7ebe1; --muted:#9caa98;
  --line:#2b311f; --accent:#a9c07e; --accent-strong:#c2d79a; --accent-soft:#232a18;
  --code-bg:#1d2116; --code-fg:#cdd6c1; --pill:#232a18; color-scheme:dark;
}}
:root[data-theme="dark"]{
  --bg:#12140f; --surface:#191c15; --surface-2:#20241b; --fg:#e7ebe1; --muted:#9caa98;
  --line:#2b311f; --accent:#a9c07e; --accent-strong:#c2d79a; --accent-soft:#232a18;
  --code-bg:#1d2116; --code-fg:#cdd6c1; --pill:#232a18; color-scheme:dark;
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--fg);font-family:var(--sans);
  line-height:1.62;font-size:17px;-webkit-font-smoothing:antialiased}
.wrap{max-width:var(--maxw);margin:0 auto;padding:0 16px}
header.top{padding:56px 0 18px}
h1{font-size:clamp(1.8rem,5vw,2.5rem);line-height:1.15;margin:0 0 .35em;letter-spacing:-.015em;
  text-wrap:balance}
.lede{color:var(--muted);font-size:1.08rem;margin:0;max-width:62ch}
.meta{margin-top:18px;color:var(--muted);font-size:.84rem;font-family:var(--mono)}
hr{border:none;border-top:1px solid var(--line);margin:34px 0}
h2{font-size:1.5rem;margin:2.2em 0 .5em;letter-spacing:-.01em;line-height:1.2;
  padding-bottom:.25em;border-bottom:1px solid var(--line)}
h3{font-size:1.12rem;margin:1.7em 0 .35em;color:var(--accent-strong)}
p{margin:.7em 0}
a{color:var(--accent-strong);text-decoration:underline;text-underline-offset:2px}
strong{color:var(--fg)}
ul,ol{margin:.6em 0;padding-left:1.35em}
li{margin:.4em 0}
code{font-family:var(--mono);font-size:.86em;background:var(--code-bg);color:var(--code-fg);
  padding:.12em .4em;border-radius:5px;overflow-wrap:anywhere}
pre{background:var(--code-bg);color:var(--code-fg);border:1px solid var(--line);
  border-radius:10px;padding:14px 16px;overflow-x:auto;font-family:var(--mono);
  font-size:.86rem;line-height:1.5}
pre code{background:none;padding:0;font-size:1em}
blockquote{margin:1em 0;padding:.6em 1em;border-left:3px solid var(--accent);
  background:var(--surface);border-radius:0 8px 8px 0;color:var(--fg)}
blockquote p{margin:.3em 0}
.tag{display:inline-block;font-family:var(--mono);font-size:.68rem;letter-spacing:.1em;
  text-transform:uppercase;color:var(--accent-strong);background:var(--accent-soft);
  border:1px solid var(--line);border-radius:999px;padding:3px 10px;margin-bottom:10px}
.card{background:var(--surface);border:1px solid var(--line);border-radius:14px;
  padding:4px 22px 20px;margin:22px 0}
.toc{background:var(--surface);border:1px solid var(--line);border-radius:12px;
  padding:14px 20px;margin:26px 0}
.toc h4{margin:.3em 0 .5em;font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;
  color:var(--muted);font-family:var(--mono)}
.toc ul{margin:0;padding-left:1.1em}
.toc a{text-decoration:none}
.toc a:hover{text-decoration:underline}
.callout{background:var(--surface-2);border:1px solid var(--line);border-radius:10px;
  padding:2px 18px;margin:18px 0}
.dl{display:inline-flex;align-items:center;gap:.5em;margin:4px 0 8px;
  font-family:var(--sans);font-size:.95rem;font-weight:600;text-decoration:none;
  color:#fff;background:var(--accent-strong);border:1px solid var(--accent-strong);
  border-radius:9px;padding:10px 16px;transition:background .15s,transform .05s}
.dl:hover{background:var(--accent);text-decoration:none}
.dl:active{transform:translateY(1px)}
.dl svg{width:16px;height:16px;flex:none}
.dl .hint{font-weight:400;opacity:.85;font-size:.85em}
:root[data-theme="dark"] .dl, :root:not([data-theme="light"]) .dl{color:#12140f}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .dl{color:#12140f}}
.deliverables{list-style:none;padding:0;margin:.8em 0}
.deliverables li{position:relative;padding-left:1.4em;margin:.55em 0}
.deliverables li::before{content:"";position:absolute;left:0;top:.62em;width:8px;height:8px;
  border-radius:50%;background:var(--accent)}
footer{color:var(--muted);font-size:.84rem;padding:30px 0 60px;margin-top:30px;
  border-top:1px solid var(--line)}
@media (max-width:480px){
  body{font-size:16px}
  header.top{padding:40px 0 14px}
  .card{padding:4px 16px 16px}
}
</style>
</head>
<body>
<div class="wrap">

<header class="top">
  <h1>Author Voice &amp; Citation Analysis</h1>
  <p class="lede">How to reproduce a "voice profile" and "citation map" of one author's
  writing — without being a programmer. You make the decisions and supply the texts; an AI
  assistant writes and runs the code.</p>
  <p class="meta">A guide in two parts · for a non-coder and their AI assistant</p>
</header>

<div class="toc">
  <h4>Contents</h4>
  <ul>
    <li><a href="#produce">What you'll end up with</a></li>
    <li><a href="#part1">Part 1 — For you (the human)</a></li>
    <li><a href="#part2">Part 2 — For your AI assistant</a></li>
  </ul>
</div>

<p>This explains how to reproduce the kind of analysis described here — a voice profile plus
a citation map of one author's writing — working in partnership with an AI assistant (such
as Claude Code, or any capable coding assistant). There are two parts: <strong>Part 1</strong>
is for you, the human; <strong>Part 2</strong> is the build specification you hand to your AI
assistant.</p>

<h2 id="produce">What you'll end up with</h2>
<ul class="deliverables">
  <li><strong>A voice profile</strong> — the words and phrases that recur across the author's
  work, and what makes each text distinctive (signature vocabulary, keyness, pivot phrases).</li>
  <li><strong>A citation map</strong> — who the author cites, how often, in which texts, over
  time, linked to canonical records of each cited work.</li>
  <li><strong>An index / concept layer</strong> — where books have back-of-book indexes, which
  concepts are most foregrounded.</li>
  <li><strong>A visual "root system"</strong> — an interactive page where each text is a node
  and its citations, terms, phrasing, and index terms hang beneath it.</li>
  <li><strong>A small database</strong> holding all of it, so later questions ("when did she
  start citing X?", "what vocabulary do these two books share?") can be answered without
  redoing the work.</li>
</ul>
<p>You don't need to understand the database. You need to supply good source files and make a
handful of judgment calls the assistant will ask you about.</p>

<hr>

<div class="card">
<span class="tag">Part 1</span>
<h2 id="part1" style="border:none;margin-top:.2em">For you (the human)</h2>

<h3>Step 1. Decide the author and the boundary</h3>
<p>Pick one author. Decide what counts as "their voice": usually their <strong>solo-written</strong>
books and essays. Co-authored pieces, interviews, and volumes they only <em>edited</em> (where
most of the words are other people's) should be tracked separately or left out. You'll confirm
these calls as you go — the assistant will show you its proposed list first.</p>

<h3>Step 2. Gather the texts as PDFs</h3>
<p>Collect the author's writings as PDF files in one folder. The single most important thing
about each file is: <strong>does the PDF have real, selectable text, or is it just a picture of
the page?</strong></p>
<ul>
  <li><strong>Searchable PDF</strong> (you can select/copy text in it) → usable as-is.</li>
  <li><strong>Image-only scan</strong> (text can't be selected) → needs "OCR." The assistant can
  try, but quality varies: dense running prose often OCRs poorly, while bibliographies and
  indexes OCR fairly well.</li>
</ul>
<p>Name files consistently so the assistant can read author/year/title automatically. A good
convention is:</p>
<pre><code>Lastname_Firstname_Year_Title.pdf</code></pre>
<p>for example <code>Braidotti_Rosi_2013_The Posthuman.pdf</code>. For co-authored work, join
authors with a double underscore: <code>Asberg_Cecilia__Braidotti_Rosi_2024_Title.pdf</code>.</p>

<h3>Step 3. Start the conversation with your AI assistant</h3>
<p>Open your source folder in the coding assistant, then paste something like this:</p>
<blockquote>
<p>I want to build an "author voice and citation" analysis of <strong>[AUTHOR NAME]</strong>.
My source PDFs are in <strong>[FOLDER PATH]</strong>. Please read Part 2 of the guide I'm
sharing and build the pipeline it describes, adapted to this author. First show me the proposed
list of texts (which are in the voice analysis, which are citation-only, which are excluded and
why) and let me confirm before you run everything.</p>
</blockquote>
<p>Then let it work. It will pause to ask you things.</p>

<h3>Step 4. Answer the judgment calls</h3>
<ul>
  <li><strong>"Is this file really by the author?"</strong> Files are often mislabeled. If a PDF
  titled for the author turns out to be a whole edited anthology (many contributors) or a book
  <em>about</em> them, say so — it should be excluded from the voice analysis.</li>
  <li><strong>"This PDF has no readable text."</strong> That's an image-only scan. Decide: skip
  it, or get a better scan. (A one-page cover scan is useless; a full chapter scan may be worth
  OCR.)</li>
  <li><strong>"These two files look like the same work."</strong> Keep one; drop duplicates
  (often named <code>... (2).pdf</code>).</li>
  <li><strong>Baseline for "keyness."</strong> To find the author's <em>distinctive</em> words,
  the assistant compares them against ordinary academic prose. If you have a pile of other
  scholars' PDFs, point the assistant at them as the comparison set.</li>
</ul>

<h3>Step 5. Verify the data in a spreadsheet — your main quality gate</h3>
<p>The assistant records its decisions and findings as <strong>CSV files</strong> (spreadsheets
you open in Excel, Numbers, or Google Sheets). You don't need code to check them — this is where
you catch mistakes before they spread downstream.</p>
<ul>
  <li><code>manifest.csv</code> is the master list: every file, how it was classified
  (<code>include_in_voice</code>, <code>include_in_citations</code>), its <code>doc_kind</code>,
  and an <code>exclude_reason</code>. Open it and read down those columns. Is anything
  miscategorized — an essay marked as a book, a real text wrongly excluded, an edited volume
  wrongly included?</li>
  <li>The <strong>findings CSVs</strong> (signature terms, keyness, citations, index terms) —
  skim the top rows.</li>
  <li><strong>Handing corrections back</strong>, either way works: (a) edit the cell, save, and
  say <em>"I edited manifest.csv — re-run using my version,"</em> or (b) just describe the fix in
  chat (<em>"Writing as a Nomadic Subject is an essay, not a book"</em>) and let it make the
  change. Then it re-runs and the reports update.</li>
</ul>
<p>While you're reading, sanity-check against your own knowledge of the author:</p>
<ul>
  <li>Do the top signature words and phrases <strong>sound like the author?</strong> If the list
  is bland ("social, political, process"), ask for the <em>keyness</em> layer, which filters out
  ordinary academic words.</li>
  <li>Is the <strong>most-cited list</strong> plausible? Many theorists cite themselves heavily —
  that's real.</li>
  <li>Are the <strong>excluded files</strong> the right ones to exclude?</li>
  <li>In the <strong>visual tree</strong>, open a book you know well and see if its roots match
  your sense of it.</li>
</ul>
<p>If something looks off, say exactly what and why ("she never cites X that much" / "this 1994
book is her most important and it's missing"). The assistant can fix it, re-run, and often track
down a missing text.</p>

<h3>Step 6. Keep your own notes (optional but recommended)</h3>
<p>Your reading is data too. Use the companion template
<code>author-voice-notes_TEMPLATE.csv</code> to record your own observations about key terms,
phrasing, and voice as you go — in the same spreadsheet-shaped form, so the assistant can merge
your notes into the reports and the visualization if you want. Columns:</p>
<pre><code>entry_type, term_or_phrase, your_note, example_quote, source_text, year, importance, also_found_by_pipeline</code></pre>
<ul>
  <li><code>entry_type</code> — key term · phrase · voice feature · concept · citation note</li>
  <li><code>your_note</code> — what it means / why it matters for <em>this</em> author</li>
  <li><code>also_found_by_pipeline</code> — yes/no: did the machine surface it too? (Agreements
  and disagreements between your ear and the data are both interesting.)</li>
</ul>
<p><a class="dl" download="author-voice-notes_TEMPLATE.csv"
  href="data:text/csv;charset=utf-8;base64,ZW50cnlfdHlwZSx0ZXJtX29yX3BocmFzZSx5b3VyX25vdGUsZXhhbXBsZV9xdW90ZSxzb3VyY2VfdGV4dCx5ZWFyLGltcG9ydGFuY2UsYWxzb19mb3VuZF9ieV9waXBlbGluZQprZXkgdGVybSwsIndoYXQgaXQgbWVhbnMgLyB3aHkgaXQgbWF0dGVycyBmb3IgdGhpcyBhdXRob3IiLCwsLCwKcGhyYXNlLCwidGhlIGV4YWN0IGNvbnN0cnVjdGlvbiBhbmQgd2hhdCBpdCBkb2VzIiwsLCwsCnZvaWNlIGZlYXR1cmUsLCJhIGhhYml0IG9mIHN0eWxlIG9yIHJoZXRvcmljICh0b25lLCBzZW50ZW5jZSBzaGFwZSwgcHVuY3R1YXRpb24sIHNlbGYtcmVmZXJlbmNlKSIsLCwsLApjb25jZXB0LCwiYSBiaWcgaWRlYSB0aGF0IG9yZ2FuaXplcyBhIHRleHQgb3IgdGhlIHdob2xlIGNvcnB1cyIsLCwsLApjaXRhdGlvbiBub3RlLCwiYSBzb3VyY2UgdGhhdCBtYXR0ZXJzIGFuZCBob3cgdGhlIGF1dGhvciB1c2VzIHRoZW0iLCwsLCwKa2V5IHRlcm0gKEVYQU1QTEUg4oCUIGRlbGV0ZSksbm9tYWRpYyBzdWJqZWN0LCJjZW50cmFsIGZpZ3VyZTogYSBub24tdW5pdGFyeSwgZW1ib2RpZWQgc3ViamVjdCBpbiBwcm9jZXNzIiwsTm9tYWRpYyBTdWJqZWN0cywxOTk0LGhpZ2gseWVzCnBocmFzZSAoRVhBTVBMRSDigJQgZGVsZXRlKSxiZWNvbWluZy13b21hbiwiRGVsZXV6aWFuIGJlY29taW5nIHJld29ya2VkIHRocm91Z2ggc2V4dWFsIGRpZmZlcmVuY2UiLCxNZXRhbW9ycGhvc2VzLDIwMDIsaGlnaCx5ZXMKdm9pY2UgZmVhdHVyZSAoRVhBTVBMRSDigJQgZGVsZXRlKSxhZmZpcm1hdGl2ZSB0dXJuLCJjb252ZXJ0cyBjcml0aXF1ZS9uZWdhdGl2aXR5IGludG8gYWZmaXJtYXRpdmUgZXRoaWNzIiwsVHJhbnNwb3NpdGlvbnMsMjAwNixtZWRpdW0sbm8K">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12m0 0l-4-4m4 4l4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>
  Download the notes template <span class="hint">· CSV</span></a></p>
<p>Fill a row whenever something strikes you; delete the example rows. Hand the file back and ask
the assistant to cross-reference it against what the pipeline found.</p>

<h3>Step 7. Fill gaps you can only partly scan</h3>
<p>For major books you own but can't get as full text, you can scan <strong>just the bibliography
and the index</strong>. Those still feed the citation map and the concept/foregrounding layer
(they won't contribute to the "voice" signature, which needs running prose). Tell the assistant
you're adding "bibliography/index-only" sources and where you put them.</p>

<div class="callout">
<h3 style="margin-top:.8em">What good looks like / common pitfalls</h3>
<ul>
  <li><strong>Thin corpus warning.</strong> If only a few texts have usable text, the profile
  skews to whatever you happened to have. More (clean) texts = truer profile. Ask the assistant
  what key works are missing.</li>
  <li><strong>Scans are the #1 problem.</strong> Expect some PDFs to be image-only. Budget for it.</li>
  <li><strong>"All of it" creep.</strong> Resolving every single cited source to a database ID is
  expensive and low-value in the long tail. Doing it for sources cited 2+ times is the sweet spot.</li>
</ul>
</div>
</div>

<div class="card">
<span class="tag">Part 2</span>
<h2 id="part2" style="border:none;margin-top:.2em">For your AI assistant</h2>

<p>You are building an <strong>author voice-and-citation analysis pipeline</strong> from a folder
of PDFs. Produce: (a) a voice profile, (b) a citation ledger, (c) index/concept data where
available, (d) a queryable store, (e) an interactive "inverted-tree" visualization. Work in plain
Python (PDF text extraction + pandas/regex + SQLite); no heavyweight NLP needed. Keep every stage
rerunnable from one command. <strong>Show the human the proposed corpus manifest and let them
confirm before processing.</strong> Be honest in reports about gaps (scans, truncation, unmatched
citations) rather than papering over them.</p>

<h3>Architecture — stages, each a small script writing reviewable output</h3>
<ol>
  <li><strong>manifest</strong> — Scan the source folder(s). Parse
  <code>Lastname_Firstname_Year_Title</code> from each filename. Select the author's files by an
  author token in the filename. Classify each: <code>include_in_voice</code> (solo running prose)
  and/or <code>include_in_citations</code>. Detect and drop: <strong>edited volumes</strong>
  (filename or front matter shows many contributors), <strong>image-only scans</strong> (0
  extractable text — note why), <strong>duplicates</strong> (same work after stripping
  <code> (2)</code> markers; keep one). Emit a human-readable <code>manifest.csv</code> and a
  printed summary grouped into solo / co-authored / excluded-with-reason.
  <strong>Stop and let the human confirm.</strong></li>
  <li><strong>extract</strong> — Per included PDF: pull text per page (keep a page map), strip
  boilerplate (download banners), split <strong>body</strong> from <strong>back-matter</strong>
  (detect a <code>References|Bibliography|Works Cited|Notes|Index</code> heading in the last
  ~45–55%). Save one JSON per file. De-hyphenate line-break splits; <strong>preserve hyphenated
  coinages</strong> (<code>becoming-world</code>) — they are the voice.</li>
  <li><strong>voice</strong> — Tokenize (keep hyphenated words). Build a term×work matrix for
  1–4-grams over the <strong>solo</strong> works. Two readings: <strong>signature</strong> = terms
  recurring across many works (document frequency); <strong>distinctiveness</strong> = per-work
  TF-IDF. Filter proper names / author surnames out of the voice layer (they belong to citations).
  Prune by frequency thresholds.</li>
  <li><strong>citations</strong> — Two parsers per doc: in-text author-date
  <code>(Surname Year: page)</code> with the page and the citing text's year; and back-matter
  reference/notes lists. Emit per-source counts.</li>
  <li><strong>store</strong> — Load everything into one SQLite DB (works, terms, term×work,
  signature, per-work top terms, in-text citations, reference entries, citation counts). Rebuild
  cleanly each run; design it comparison-first (by term / phrase / citation / year).</li>
  <li><strong>reports</strong> — Markdown: signature vocabulary, per-work profiles (distinctive
  phrasing + most-cited sources), citation map (most-cited sources with citing works/years), and a
  term-over-time view.</li>
  <li><strong>structure</strong> — Per-work prose metrics as a component of voice: sentence length
  &amp; variability, rhetorical-question rate, punctuation signature (em-dash, colon, semicolon,
  parenthetical), hyphen-compound coinage rate, gerund and first-person density. Store per work.</li>
  <li><strong>keyness</strong> — Distinctiveness <strong>vs. a baseline</strong> of comparable
  prose (sample ~100+ non-author texts; this beats "general English" for idiolect). Score each
  term/phrase by log-likelihood (G²) and a relative-frequency ratio. Phrases first. This is what
  separates true coinages from ordinary academic words.</li>
  <li><strong>pivots</strong> — For the author's key verbs/nouns, capture the
  <strong>modifier window</strong> (one and two words each side) and hyphen compounds — <em>no
  stopword filtering here</em>, because the modifiers (<code>with</code>, <code>always</code>,
  <code>already</code>, compounds) carry the meaning. Catches constructions that start with a
  stopword (e.g. "in the making") which fixed n-grams miss.</li>
  <li><strong>resolve</strong> — Merge in-text citation variants; send the top sources (prioritize
  those cited 2+ times) to a scholarly metadata service (OpenAlex is free, no key) to attach
  canonical IDs/titles with a <strong>confidence rating</strong>. Record unmatched honestly —
  famous monographs are often held only as reviews; don't force a match, and reject review-only or
  wrong-author hits. The long tail of cited-once sources is optional.</li>
  <li><strong>catalog</strong> — Consolidate into one <code>citations_master.csv</code> with a
  <code>layer</code> column (<code>intext</code> | <code>reference</code> | <code>note</code>),
  full (untruncated) reference entries, and a separate <code>index_terms.csv</code> (term + page
  list + page count) from any back-of-book index.</li>
  <li><strong>visualization</strong> — Export per-text node data (top resolved citations,
  distinctive terms, distinctive phrasing, top index terms) to JSON; render an interactive
  single-file HTML "inverted tree": time grows upward, each text is a node, open it to unfurl its
  roots. Resolve citation links to the metadata service. Support light/dark and mobile widths.</li>
</ol>

<h3>Design rules that matter (learned the hard way)</h3>
<ul>
  <li><strong>The manifest is the control point.</strong> Every inclusion/exclusion decision is
  explicit and reviewable there, with a reason string. A bad corpus silently ruins everything
  downstream.</li>
  <li><strong>Guard against zero-text scans</strong> — they produce empty "works" that quietly
  deflate the signature. Detect and exclude; never let a 0-word file sit in the voice set.</li>
  <li><strong>Edited volumes masquerade as single-author files.</strong> Check the front matter /
  contributor count, not just the filename. (One 466-page "co-authored" file turned out to be an
  edited companion with dozens of contributors; including it had swamped the citation map with
  other people's references.)</li>
  <li><strong>De-duplicate by work, not by filename</strong> (<code>Title (2).pdf</code> and a
  copy in a subfolder are the same work). When several files share a work id, make sure the
  <em>kept</em> one wins in the database.</li>
  <li><strong>Self-citation is a real signal</strong>, not noise.</li>
  <li><strong>Bibliography/index-only sources are first-class</strong> for the citation and index
  layers even with no body text — add an <code>include_in_citations</code>-only path for them.</li>
  <li><strong>Report gaps plainly</strong>: which texts are scans, which references were
  truncated, what share of citations resolved vs. attempted-unmatched vs. not-attempted.</li>
  <li><strong>Make it idempotent</strong>: clear stale intermediate files each run; one command
  runs the whole thing; the visualization rebuilds from the store.</li>
  <li><strong>The human verifies via CSV.</strong> <code>manifest.csv</code> is their review
  surface and corrections authority: write it as plain, readable CSV; on re-run, read it back and
  honor edits they made (flags, <code>doc_kind</code>, <code>exclude_reason</code>) rather than
  silently regenerating over them. Expose the key findings as CSVs they can open in a spreadsheet.</li>
  <li><strong>Support a human notes file.</strong> Provide
  <code>author-voice-notes_TEMPLATE.csv</code> (<code>entry_type, term_or_phrase, your_note,
  example_quote, source_text, year, importance, also_found_by_pipeline</code>). If the human fills
  it in, join it against the machine output: flag which of their terms the pipeline also surfaced,
  surface terms they missed, and optionally add their annotations to the per-work reports and the
  visualization nodes.</li>
</ul>

<h3>Suggested file layout</h3>
<pre><code>&lt;author&gt;-voice/
  pipeline/        one script per stage + a run.py that calls them in order + config.py (paths, author token)
  corpus/raw/      archival copies of the analyzed source PDFs
  corpus/biblio-index/   bibliography/index-only scans
  data/            manifest.csv, intermediate CSVs, text/*.json, db/&lt;author&gt;.sqlite
  data/reports/    the Markdown reports
  artifact/ dist/  the HTML visualization template and built page
  README.md</code></pre>

<h3>First message back to the human</h3>
<p>Before running everything, print the proposed corpus: solo voice works,
co-authored/interview, and excluded-with-reason. Ask them to confirm or correct the
classification. Then run, and in the final summary name the headline findings and every known
gap.</p>
</div>

<footer>
  A method guide for building an author voice-and-citation analysis in partnership with an AI
  assistant. Free to copy, adapt, and host.
</footer>

</div>
</body>
</html>
