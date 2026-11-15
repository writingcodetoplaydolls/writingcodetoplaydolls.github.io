# Is anything missing from the proposal draft chain

**3 November 2026.** Checked because v5 looked as though it had lost text
added to an earlier version.

**Nothing written in any earlier version is absent from the current one.**
Every word of the 26 October original, the 29 October draft and the 30 October
draft is in `Dissertation_Proposal_Draft_2026-11-02_v6.md`, with one exception
that is a rewrite and not a loss, set out in section 3.

## 1. The chain, and which file is current

| file | written | bytes | words | blocks |
|---|---|---:|---:|---:|
| `C:\Users\Amy\Downloads\Dissertation Proposal Rough Draft.md` | 26 Oct 12:28 | 266,173 | 40,211 | 623 |
| `Dissertation_Proposal_Draft_2026-10-29.md` | 29 Oct 14:44 | 294,619 | 44,816 | 671 |
| `Dissertation_Proposal_Draft_2026-10-30.md` | 30 Oct 08:47 | 298,855 | 45,508 | 674 |
| `Dissertation_Proposal_Draft_2026-11-02.md` | 2 Nov 13:36 | 305,187 | | |
| `Dissertation_Proposal_Draft_2026-11-02_v2.md` | 2 Nov 13:42 | 305,294 | | |
| `Dissertation_Proposal_Draft_2026-11-02_v3.md` | 2 Nov 13:55 | 305,605 | | |
| `Dissertation_Proposal_Draft_2026-11-02_v4.md` | 2 Nov 14:06 | 305,799 | | 683 |
| `Dissertation_Proposal_Draft_2026-11-02_v5.md` | 2 Nov 14:16 | 307,946 | 46,673 | 690 |
| **`Dissertation_Proposal_Draft_2026-11-02_v6.md`** | **2 Nov 17:52** | **308,446** | **46,693** | **690** |

All files in `K:\OneDrive\UNM\Dissertation\todo October 26` except the first.
**v6 is current**, and v5 is one behind it: v5 to v6 changed two lines, the Su
reference entry and the paragraph of four cautions.

The document has grown at every step, 40,211 words to 46,693.

## 2. Why a line diff says the opposite

Two things make an ordinary diff report the whole file as changed when almost
nothing has:

**The line endings change at 2 November.** The 26, 29 and 30 October drafts
use bare LF. Every 2 November draft uses CRLF. `diff` compares bytes, so with
no `--strip-trailing-cr` it reports all 1,216 lines of the 30 October draft as
absent from v6, which is false: the correct count is **zero**.

**Eleven one-line blockquote rows were merged into single blocks.** Bennett's
storm-drain list in 2.5 was six rows and is now one block at line 837. The
Adrienne Rich attribution in 2.4 was its own row and is now inside the quote
at line 689. Three of her own quotes in 1.3 and 1.6 merged the same way. The
words are all present; the block count for `quote` falls from 26 to 15, which
is the whole of that change.

Measured block by block, 26 October against v6: **606 blocks word for word
identical, 6 reworded, 11 merged as above**, and 690 blocks in v6 against 623.

An eight-word sliding window over the whole text confirms it. Of 40,211 words
in the 26 October original, the only runs not found in v6 are **7 stretches of
14 words, every one of them spanning a section heading**, which is an artifact
of flattening headings into the word stream when a new block has been inserted
between. Against the 30 October draft there is **one** such stretch, also at a
heading.

## 3. The one real rewrite: the Braidotti science counts in 1.2

The 29 October draft is the only file with text that is genuinely not in v6 in
those words: **12 stretches, about 340 words**, almost all of it one passage.
It was rewritten on 30 October when the second Braidotti sweep replaced a
two-book count with a twelve-text count, and the numbers moved.

| | 29 October | v6 |
|---|---|---|
| basis | two books | **1,760 PDFs scanned, 12 texts she wrote, 324,041 words** |
| *Posthuman Feminism* total | **979** | **954** |
| its physics count | "physics named as a discipline 5" | "physics or physicist 7" |
| *Nomadic Theory* word count | **148,962** | **148,986** |
| its total | **520** | **518** |
| the qualifications | one note, "Two qualifications ... First ... Second" | two separate notes, one on Rovelli and one headed "A second qualification" |

The substance all survives: the per-term counts for both books, the physics
zeros, the 8,910-word reading of "Writing as a Nomadic Subject", the entropy
qualification with its Hegel, Freud and Lacan quotations, the Bohr-sentence
qualification, and the Hayles p. 55 join. v6 adds the ten shorter pieces, the
reading of all 16 physics occurrences in place, and the Rovelli note.

The counts changed because the method changed: v6 says it counts physics "with
a word boundary so that the adjective physical is excluded", which the 29
October version did not do.

**Nothing about this is recoverable-but-lost.** If the earlier figures are
wanted, the 29 October draft holds them and is untouched, as does
`Dissertation_Proposal_blocks_2026-10-29_v2.csv`.

## 4. The one thing that did disappear

The 29 October draft ended with a provenance note that no later file carries:

> 7 further blocks added 29 Oct 2026 at the end of 1.2, carrying the
> contribution claim about reading Braidotti through Bohr and the
> science-field counts behind it. This file is a new draft: the earlier
> patched sheet is kept as `Dissertation_Proposal_RoughDraft_blocks.csv` and
> the pre-insertion original as
> `Dissertation_Proposal_RoughDraft_blocks_BEFORE_2026-10-29.csv`. Nothing is
> overwritten. **Rebuild with to-md, not patch, because every added row has an
> empty line_num.**

It is housekeeping rather than dissertation text, but the last sentence is
worth keeping somewhere: it is the instruction that stops the blocks with no
`line_num` being dropped on a rebuild. That hazard is now gone from the
markdown anyway, because **all 690 blocks in v6 carry a line_num**, where the
30 October sheet had 51 that did not.

## 5. What was checked

Every block of every sheet in the folder was searched for text absent from v6:
`Dissertation_Proposal_RoughDraft_blocks_BEFORE_2026-10-29.csv` (623 rows),
`Dissertation_Proposal_RoughDraft_blocks.csv` (665),
`Dissertation_Proposal_blocks_2026-10-29_v2.csv` (672),
`Dissertation_Proposal_blocks_2026-10-30_v3.csv` (674) and
`Dissertation_Proposal_blocks_2026-11-02_v4.csv` (683). Only the 29 October
sheet holds anything not in v6, and it is the same rewritten passage.

None of the sheets carries a revision column, so there is no edited text
sitting in a spreadsheet that was never written back. No proposal copy exists
in any other format: no `.docx`, `.rtf`, `.odt` or exported `.pdf` of it under
`K:\OneDrive\UNM`, `C:\Users\Amy\Downloads`, `C:\Users\Amy\Documents` or
`C:\Users\Amy\Desktop` modified since 20 October.

---

**SOURCE_FILE:** `K:\OneDrive\UNM\Dissertation\November 2\PROPOSAL_VERSION_AUDIT_2026-11-03.md`
**SOURCE:** the nine draft files listed in section 1 and the five block sheets listed in section 5, all read on 3 November 2026. Block counts from `K:\BigData\Claude\MdCsv\md_csv.py to-csv`. Word counts after stripping markdown markup and punctuation. Line-ending counts from byte counts of CRLF against bare LF.
**NOTES:** three methods were used because each can be fooled on its own: a line diff with `--strip-trailing-cr`, a block-by-block comparison on normalised text, and an eight-word sliding window. The window method reports a false positive wherever a heading was inserted, because it flattens headings into the word stream; all 8 such stretches were checked by hand and each is a heading boundary. Modification times are file system write times, not when the writing was done. This audit covers the files named only; it cannot see text that was never saved to any of them.
**GENERATED:** 2026-11-03
