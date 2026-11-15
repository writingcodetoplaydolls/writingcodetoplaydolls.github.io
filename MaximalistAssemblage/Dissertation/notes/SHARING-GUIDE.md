# Author Voice & Citation Analysis — A Guide You Can Hand to Someone Else

This explains how to reproduce the kind of analysis we built (a "voice profile" + a
"citation map" of one author's writing) **without being a programmer**. You work in
partnership with an AI assistant (Claude Code, or any capable coding assistant). You
make the decisions and supply the texts; the assistant writes and runs the code.

There are two parts:

- **PART 1 — For you (the human).** What to gather, what to say, what to check.
- **PART 2 — For your AI assistant.** The method and build spec. Paste it to them or
  point them at it.

---

## What you'll end up with

- **A voice profile** — the words and phrases that recur across the author's work, and
  what makes each text distinctive. ("Signature vocabulary," "keyness," "pivot phrases.")
- **A citation map** — who the author cites, how often, in which texts, over time, with
  links to canonical records of each cited work.
- **An index/concept layer** — if the books have back-of-book indexes, which concepts
  are most foregrounded.
- **A visual "root system"** — an interactive page where each text is a node and its
  citations, terms, phrasing, and index terms "hang" beneath it.
- **A small database** holding all of it, so any question ("when did she start citing X?",
  "what vocabulary do these two books share?") can be answered later without redoing the work.

You don't need to understand the database. You need to supply good source files and make
a handful of judgment calls the assistant will ask you about.

---

# PART 1 — For you (the human)

### Step 1. Decide the author and the boundary
Pick one author. Decide what counts as "their voice": usually their **solo-written**
books and essays. Co-authored pieces, interviews, and volumes they only *edited* (where
most words are other people's) should be tracked separately or left out. You'll confirm
these calls as you go — the assistant will show you its proposed list first.

### Step 2. Gather the texts as PDFs
Collect the author's writings as PDF files in one folder. For each file, the single most
important thing is: **does the PDF have real, selectable text, or is it just a picture of
the page?**
- **Searchable PDF** (you can select/copy text in it) → usable as-is.
- **Image-only scan** (text can't be selected) → needs "OCR" (the assistant can try, but
  quality varies; dense running prose often OCRs poorly, while bibliographies and indexes
  OCR fairly well).

Name files consistently so the assistant can read author/year/title automatically. A good
convention is:

```
Lastname_Firstname_Year_Title.pdf
```

e.g. `Braidotti_Rosi_2013_The Posthuman.pdf`. For co-authored work, join authors with a
double underscore: `Asberg_Cecilia__Braidotti_Rosi_2024_Title.pdf`.

### Step 3. Start the conversation with your AI assistant
Open your source folder in the coding assistant, then paste something like this:

> I want to build an "author voice and citation" analysis of **[AUTHOR NAME]**. My source
> PDFs are in **[FOLDER PATH]**. Please read PART 2 of the guide file I'm sharing and build
> the pipeline it describes, adapted to this author. First show me the proposed list of
> texts (which are in the voice analysis, which are citation-only, which are excluded and
> why) and let me confirm before you run everything.

Then let it work. It will pause to ask you things. The important questions and how to
answer them:

### Step 4. Answer the judgment calls
- **"Is this file really by the author?"** Files are often mislabeled. If a PDF titled for
  the author turns out to be a whole edited anthology (many contributors) or a book *about*
  them, say so — it should be excluded from the voice analysis.
- **"This PDF has no readable text."** That's an image-only scan. Decide: skip it, or get a
  better scan. (A one-page cover scan is useless; a full chapter scan may be worth OCR.)
- **"These two files look like the same work."** Keep one; drop duplicates (often named
  `... (2).pdf`).
- **Baseline for 'keyness.'** To find the author's *distinctive* words, the assistant
  compares them against ordinary academic prose. If you have a pile of other scholars' PDFs,
  point the assistant at them as the comparison set.

### Step 5. Sanity-check the results (you don't need code for this)
When it produces the first reports, read them with your own knowledge of the author:
- Do the top signature words and phrases **sound like the author**? (If the list is bland —
  "social, political, process" — ask for the *keyness* layer, which filters out ordinary
  academic words.)
- Is the **most-cited list** plausible? (Many theorists cite themselves heavily — that's
  real, not a bug.)
- Are the **excluded files** the right ones to exclude? Skim the exclusion list.
- In the **visual tree**, open a book you know well and see if its roots (citations, terms)
  match your sense of it.

If something looks off, say exactly what and why ("she never cites X that much" / "this
1994 book is her most important and it's missing"). The assistant can fix classification,
re-run, and often track down the missing text.

### Step 6. Fill gaps you can only partly scan
For major books you own but can't get as full text, you can scan **just the bibliography
and the index**. Those still feed the citation map and the concept/foregrounding layer
(they just won't contribute to the "voice" signature, which needs running prose). Tell the
assistant you're adding "bibliography/index-only" sources and where you put them.

### What good looks like / common pitfalls
- **Thin corpus warning.** If only a few texts have usable text, the profile will skew to
  whatever you happened to have. More (clean) texts = truer profile. Ask the assistant what
  key works are missing.
- **Scans are the #1 problem.** Expect some PDFs to be image-only. Budget for it.
- **"All of it" creep.** Resolving every single cited source to a database ID is expensive
  and low-value in the long tail. Doing it for sources cited 2+ times is the sweet spot.

---

# PART 2 — For your AI assistant

You are building an **author voice-and-citation analysis pipeline** from a folder of PDFs.
Produce: (a) a voice profile, (b) a citation ledger, (c) index/concept data where available,
(d) a queryable store, (e) an interactive "inverted-tree" visualization. Work in plain
Python (PDF text extraction + pandas/regex + SQLite); no heavyweight NLP needed. Keep every
stage rerunnable from one command. **Show the human the proposed corpus manifest and let
them confirm before processing.** Be honest in reports about gaps (scans, truncation,
unmatched citations) rather than papering over them.

### Architecture (stages, each a small script writing reviewable output)
1. **manifest** — Scan the source folder(s). Parse `Lastname_Firstname_Year_Title` from each
   filename. Select the author's files by an author token in the filename. Classify each:
   `include_in_voice` (solo running prose) and/or `include_in_citations`. Detect and drop:
   **edited volumes** (filename or front-matter shows many contributors — exclude from both),
   **image-only scans** (0 extractable text — exclude, note why), **duplicates** (same
   work after stripping ` (2)` markers; keep one). Emit a human-readable `manifest.csv`
   and a printed summary grouped into solo / co-authored / excluded-with-reason. **Stop and
   let the human confirm.**
2. **extract** — For each included PDF: pull text per page (keep a page map), strip
   boilerplate (JSTOR/download banners), and split **body** from **back-matter** (detect a
   `References|Bibliography|Works Cited|Notes|Index` heading in the last ~45–55%). Save one
   JSON per file. De-hyphenate line-break splits; **preserve hyphenated coinages**
   (`becoming-world`) — they are the voice.
3. **voice** — Tokenize (keep hyphenated words). Build a term×work matrix for 1–4-grams over
   the **solo** works. Two readings: **signature** = terms recurring across many works
   (document frequency); **distinctiveness** = per-work TF-IDF. Filter proper names/author
   surnames out of the voice layer (they belong to citations). Prune by frequency thresholds.
4. **citations** — Two parsers per doc: in-text author-date `(Surname Year: page)` with the
   page and the citing text's year; and back-matter reference/notes lists. Emit per-source
   counts.
5. **store** — Load everything into one SQLite DB (works, terms, term×work, signature,
   per-work top terms, in-text citations, reference entries, citation counts). Rebuild
   cleanly each run; design it comparison-first (by term / phrase / citation / year).
6. **reports** — Markdown: signature vocabulary, per-work profiles (distinctive phrasing +
   most-cited sources), citation map (most-cited sources with citing works/years), and a
   term-over-time view.
7. **structure** — Per-work prose metrics as a component of voice: sentence length + variability,
   rhetorical-question rate, punctuation signature (em-dash, colon, semicolon, parenthetical),
   hyphen-compound coinage rate, gerund and first-person density. Store per work.
8. **keyness** — Distinctiveness **vs. a baseline** of comparable prose (sample ~100+
   non-author texts from the library; this beats "general English" for idiolect). Score each
   term/phrase by log-likelihood (G²) and a relative-frequency ratio. Phrases first. This is
   what separates true coinages from ordinary academic words.
9. **pivots** — For the author's key verbs/nouns, capture the **modifier window** (one and two
   words on each side) and hyphen compounds — *no stopword filtering here*, because the
   modifiers (`with`, `always`, `already`, compounds) carry the meaning. Catches constructions
   that start with a stopword (e.g. "in the making") which fixed n-grams miss.
10. **resolve** — Merge in-text citation variants; send the top sources (prioritize those
    cited 2+ times) to a scholarly metadata service (OpenAlex is free, no key) to attach
    canonical IDs/titles with a **confidence rating**. Record unmatched honestly — famous
    monographs are often held only as reviews; don't force a match, and reject review-only or
    wrong-author hits. The long tail of cited-once sources is optional.
11. **catalog** — Consolidate into one `citations_master.csv` with a `layer` column
    (`intext` | `reference` | `note`), full (untruncated) reference entries, and a separate
    `index_terms.csv` (term + page list + page count) from any back-of-book index.
12. **visualization** — Export per-text node data (top resolved citations, distinctive terms,
    distinctive phrasing, top index terms) to JSON; render an interactive single-file HTML
    "inverted tree": time grows upward, each text is a node, open it to unfurl its roots.
    Resolve citation links to the metadata service. Support light/dark, mobile widths.

### Design rules that matter (learned the hard way)
- **The manifest is the control point.** Every inclusion/exclusion decision is explicit and
  reviewable there, with a reason string. A bad corpus silently ruins everything downstream.
- **Guard against zero-text scans** — they produce empty "works" that quietly deflate the
  signature. Detect and exclude; never let a 0-word file sit in the voice set.
- **Edited volumes masquerade as single-author files.** Check the front matter / contributor
  count, not just the filename. One 466-page "co-authored" file was actually an edited companion
  with dozens of contributors; including it had swamped the citation map with other people's
  references.
- **De-duplicate by work, not by filename** (`Title (2).pdf` and a copy in a subfolder are the
  same work). When several files share a work id, make sure the *kept* one wins in the database.
- **Self-citation is a real signal**, not noise.
- **Bibliography/index-only sources are first-class** for the citation and index layers even
  with no body text — add an `include_in_citations`-only path for them.
- **Report gaps plainly**: which texts are scans, which references were truncated, what share
  of citations resolved vs. attempted-unmatched vs. not-attempted.
- **Make it idempotent**: clear stale intermediate files each run; one command runs the whole
  thing; the visualization rebuilds from the store.

### Suggested file layout
```
<author>-voice/
  pipeline/        one script per stage + a run.py that calls them in order + a config.py (paths, author token)
  corpus/raw/      archival copies of the analyzed source PDFs
  corpus/biblio-index/   bibliography/index-only scans
  data/            manifest.csv, intermediate CSVs, text/*.json, db/<author>.sqlite
  data/reports/    the Markdown reports
  artifact/ dist/  the HTML visualization template and built page
  README.md
```

### First message back to the human
Before running everything, print the proposed corpus: solo voice works, co-authored/interview,
and excluded-with-reason. Ask them to confirm or correct the classification. Then run, and in
the final summary name the headline findings and every known gap.
