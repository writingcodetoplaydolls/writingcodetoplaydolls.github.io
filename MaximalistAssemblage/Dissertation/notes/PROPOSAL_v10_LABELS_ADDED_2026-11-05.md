# The 13 provenance labels added in v10

**5 November 2026.** `Dissertation_Proposal_Draft_2026-11-05_v10.md` is
`Dissertation_Proposal_Draft_2026-11-03_v9.md` with 13 italic provenance labels inserted and
nothing else changed.

## Why

39 blocks of the draft carried a `pasted_from` value in every block sheet since 30 October that
could not be derived from the draft itself. The provenance line governing them had only ever been
typed into `Dissertation_Proposal_blocks_2026-10-30_v3.csv` and carried from sheet to sheet by text
match, so a sheet built from the markdown lost it. The labels put the line in the draft, where the
derivation reads it like any other label.

## What was inserted

| v10 line | section | label | blocks | v9 lines |
|---:|---|---|---:|---|
| 138 | Hayles: the point from which to view, and Braidotti | Hayles, The Cosmic Web | 4 | 138 140 142 144 |
| 150 | The contribution: reading Braidotti through Bohr | Hayles, The Cosmic Web | 1 | 148 |
| 154 | The contribution: reading Braidotti through Bohr | Second Braidotti sweep | 7 | 150 152 154 156 158 160 162 |
| 240 | Hayles: a form and a language adequate to the field | Hayles, The Cosmic Web | 2 | 234 236 |
| 290 | Bohr's viewpoint theory (Hayles, pp. 52 to 55) | Hayles, The Cosmic Web | 5 | 282 284 286 288 290 |
| 304 | Becoming rather than Being (Hayles, p. 49 n. 32) | Hayles, The Cosmic Web | 2 | 294 296 |
| 312 | The arbitrarily chosen frame (Hayles, p. 46) | Hayles, The Cosmic Web | 3 | 300 302 304 |
| 322 | The cut is something somebody does (Hayles, p. 40) | Hayles, The Cosmic Web | 3 | 308 310 312 |
| 584 | Heisenberg's microscope and Trinh's camera (Hayles, p. 51) | Hayles, The Cosmic Web | 3 | 568 570 572 |
| 594 | Imagination in theory (Hayles, pp. 45 to 46) | Hayles, The Cosmic Web | 2 | 576 578 |
| 602 | Arbitrary restrictions (Hayles, p. 45) | Hayles, The Cosmic Web | 4 | 582 584 586 588 |
| 614 | To revisit: the top of Hayles p. 54 through Sapir-Whorf | Hayles, The Cosmic Web | 2 | 592 594 |
| 910 | Sources for this section | Hayles, The Cosmic Web | 1 | 886 |

The full label text is one of two lines, both verbatim from the earlier sheets:

- `*Hayles, The Cosmic Web (1984), via HAYLES_ch1_additions_for_the_proposal.md, 29 Oct 2026*`
- `*Second Braidotti sweep over all 1,760 PDFs under K:\OneDrive\UNM, 29-30 Oct 2026, via BRAIDOTTI_texts_held_2026-10-29.csv and NOTES_to_chase.md section 15*`

## The one formatting change to the label text

The carried string reads `Hayles, *The Cosmic Web* (1984), ...`, with the title in emphasis. An
emphasis pair inside an italic line breaks the italics in every renderer and prints stray asterisks,
so the two asterisks around the title are dropped in the draft. No word is changed. The original
strings are kept in `PROPOSAL_v9_PROVENANCE_NOT_IN_MARKDOWN_2026-11-05.csv`.

## The one block left unlabelled

40 blocks had a carried label; 39 are now covered. The 40th is v9 line 968, the reference entry
`Horowitz, F. A., & Danilowitz, B. (2006). *Josef Albers: To open eyes*. Phaidon.`, which held the
string `Sources for this subsection`. That is not a provenance statement, and the carry-forward
matched it on block text alone. The entry sits inside an alphabetical reference list under a heading
that already reads *Sources for this section*, so a label there would state nothing. It is left
unlabelled.

## What did not change

| | v9 | v10 |
|---|---:|---:|
| blocks | 694 | 707 |
| body blocks | 504 | 504 |
| note blocks | 57 | 57 |
| italic source labels | 55 | 68 |
| body and note words | 44,911 | 44,911 |
| blocks a label governs | 286 | 325 |
| body and note blocks under no label | 275 | 236 |

Verified 2026-11-05: 26 lines added to the file (13 labels and 13 blank lines), 0 lines removed, 0 of
the 694 existing blocks changed text, 0 existing labels changed, and all 39 new values match the
held strings once the two asterisks are set aside. `md_csv.py check` on v10 reports text, line_num,
re-parse and patch all IDENTICAL, and `add_proposal_block_columns.py --check` on the new sheet
reports 0 differing cells in all four derived columns.

---

**SOURCE_FILE:** `K:\OneDrive\UNM\Dissertation\todo October 26\PROPOSAL_v10_LABELS_ADDED_2026-11-05.md`
**SOURCE:** `K:\OneDrive\UNM\Dissertation\todo October 26\Dissertation_Proposal_Draft_2026-11-03_v9.md` and `K:\OneDrive\UNM\Dissertation\todo October 26\Dissertation_Proposal_Draft_2026-11-05_v10.md`, both read 2026-11-05. Block figures from `K:\OneDrive\UNM\Dissertation\todo October 26\Dissertation_Proposal_blocks_2026-11-03_v9_r3_2026-11-05.csv` and `K:\OneDrive\UNM\Dissertation\todo October 26\Dissertation_Proposal_blocks_2026-11-05_v10.csv`. The carried strings from `K:\OneDrive\UNM\Dissertation\todo October 26\PROPOSAL_v9_PROVENANCE_NOT_IN_MARKDOWN_2026-11-05.csv`, which took them from `Dissertation_Proposal_blocks_2026-11-02_v4.csv` and ultimately from `Dissertation_Proposal_blocks_2026-10-30_v3.csv`.
**NOTES:** the insertion points were chosen per run of affected blocks, not per section, because a
label governs every block after it until the next heading or the next label. Eleven of the twelve
affected subsections contained affected blocks and nothing else, so one label at the top of each
covers them exactly; 1.2 needed two labels because the Hayles run and the Braidotti run sit under
one heading; and the note at v9 line 886 took its own label because it is the last block before the
next heading. Nothing here is a citation check: it records what the earlier sheets said a block came
from, not whether that is right.
**GENERATED:** 2026-11-05
