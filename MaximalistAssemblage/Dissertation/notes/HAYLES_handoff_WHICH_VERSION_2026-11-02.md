# Which Hayles handoff to use, and a check of what it claims

**2 November 2026.** There are three `HANDOFF_Hayles_deep_read_2026-10-30*.md`
files in this folder. This is a pointer to the right one and a record of a
check, not a fourth version.

## The one to use is v3

`HANDOFF_Hayles_deep_read_2026-10-30_v3.md`, 25,608 bytes, written 30 Oct at
18:00. It says so itself in its own first line, and it says what changed:

| file | written | what it is |
|---|---|---|
| `HANDOFF_Hayles_deep_read_2026-10-30.md` | 17:42 | v1. Superseded |
| `HANDOFF_Hayles_deep_read_2026-10-30_v2.md` | 17:53 | adds section 9: the thirteenth book arrived, the attempt to replace the corrupt *Cosmic Web* failed. Superseded |
| `HANDOFF_Hayles_deep_read_2026-10-30_v3.md` | 18:00 | adds section 10: a better *Cosmic Web* file arrived and the verification route is open again. Trap 1 in section 6 is rewritten accordingly. **Use this one** |

No collapsed fourth version was written. v3 already states which file is
current and keeps v1 and v2 in place, which is the same convention as the
dated drafts, and a fourth file would be a fourth thing to choose between.

## What was checked, 2 November 2026

Every file section 2 of v3 lists was opened with PyMuPDF and its page count
and text read.

| checked | result |
|---|---|
| all 16 files present at the paths given | **yes**, including *How We Became Posthuman* in `K:\OneDrive\UNM\Comps\Used texts` |
| the 13 monographs' page counts | **every one matches**, and the total is **3,621 pages**, exactly as section 2 says |
| replacement characters | **zero in all 16**, as section 2 says |
| the Cornell *Cosmic Web* file | `9781501722974.pdf`, **8,913,696 bytes**, sha256 begins **`31c7964e260c0e4e5a8b81ea`**, both as section 10 records |

One difference, and it is not a defect. The word totals read slightly higher
than section 2 reports: **1,346,403 against about 1,345,172** over the
thirteen, with the two differences in *The Cosmic Web* (79,035 against 78,985)
and *Comparative Textual Media* (121,722 against 120,674). Section 2's counts
were made with hyphenation across line breaks repaired first; this check split
on whitespace without that repair, which counts a hyphen-broken word twice.
The page counts, which are what the citations rest on, agree exactly.

So nothing in v3 has gone stale, and the brief can be handed to a fresh
session as it stands.

---

**SOURCE_FILE:** `K:\OneDrive\UNM\Dissertation\todo October 26\HAYLES_handoff_WHICH_VERSION_2026-11-02.md`
**SOURCE:** the three handoff files in this folder, their sizes and modification times from the file system; the 16 held files opened with PyMuPDF on 2 November 2026 and checked against section 2 and section 10 of `HANDOFF_Hayles_deep_read_2026-10-30_v3.md`.
**NOTES:** this check reads page counts, byte sizes, one sha256 and the extracted text. It does not re-verify any quotation against a page image, and it does not revisit the back-matter OCR slips that section 10 of v3 records as surviving in the Cornell file. The word-count difference is explained above and is a counting method, not a change to the files.
**GENERATED:** 2026-11-02
