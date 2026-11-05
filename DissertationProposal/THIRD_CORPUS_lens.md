# The third corpus: ResearchRepository and Leonardo

27 Oct 2026.

---

## 1. First, what "already catalogued" meant

I said it from a memory note, not from looking. Having now looked, it was right, and it matters more than I made it sound.

`K:\ResearchRepository\Dissertation_Hub\Leonardo_Spoke` holds a built SQLite database, `leonardo.db`:

| | |
|---|---|
| articles | **9,685** |
| authors, de-duplicated | 6,276 |
| issues | 280 |
| author-to-article links | 10,932 |
| **extracted full texts in `text/`** | **9,685 files** |

Your README: "100% parsed, zero OCR needed (every PDF had a text layer)."

So the 9,718 Leonardo PDFs did not need extracting. The full text was already sitting there, **23,005,071 words**, and I could run the lenses straight over it.

---

## 2. Section 2.6 is not unsupported. It is in a folder I had never searched.

`K:\ResearchRepository\Black Mountain College`, 64 files with text, 747,804 words.

| | hits | docs |
|---|---|---|
| **Albers** | **953** | 36 |
| **Black Mountain College** | **799** | **49** |
| **John Cage** | 523 | 36 |
| Charles Olson | 115 | 12 |
| Rauschenberg | 80 | 36 |
| Motherwell | 33 | 29 |
| **Appalachia** | **22** | 6 |
| Whitehead | 4 | 2 |
| Duchamp | 10 | 4 |

Your 2.6 names Albers, Rauschenberg, Motherwell and Whitehead's process. **Three of the four are here in quantity. Whitehead is not** — 4 hits in 2 documents. So the artists are covered and the Whitehead link is still the thing to build, which is what Epperson and Manning are for.

Every "Black Mountain College appears twice in 4.76 million words" figure I gave you was measured against two folders that do not contain this one.

---

## 3. The Duchamp and pataphysics cluster

`K:\ResearchRepository` root, 9 files, 554,011 words.

| | hits |
|---|---|
| **Duchamp** | **2,842** |
| **pataphysics** | **1,286** |
| Motherwell | 119 |
| quantum | 124 |
| Whitehead | 91 |
| infrathin | 13 |
| Bohr | 9 |

Titles there include **"Pata or Quantum: Duchamp and the End of Determinist Physics"** (*Tout-Fait*), ***Marcel Duchamp and the Architecture of Desire*** (twice), ***Pataphysics Unrolled***, and *Flesh and Circuit: Rethinking Performance and Technology*.

That is the Duchamp-and-physics join as its own small library, separate from Molderings.

---

## 4. Leonardo: 9,668 files, 23,005,071 words

| | hits | docs |
|---|---|---|
| **quantum** | **1,800** | **514** |
| **Duchamp** | **1,578** | **500** |
| assemblage | 797 | 377 |
| Albers | 469 | 152 |
| diffraction | 398 | 164 |
| John Cage | 369 | 240 |
| **Bohr** | **228** | **106** |
| Rauschenberg | 225 | 140 |
| pataphysics | 201 | 43 |
| **autism / neurodiversity** | **194** | **70** |
| nexus | 180 | 139 |
| Barad | 154 | 46 |
| Whitehead | 150 | 62 |
| monstrous | 143 | 95 |
| proprioception | 109 | 43 |
| Manning | 95 | 46 |
| Motherwell | 71 | 50 |
| transmogrification | 61 | 8 |
| Black Mountain College | 37 | 23 |
| Braidotti | 38 | 18 |
| Appalachia | 23 | 14 |
| Trinh | 13 | 3 |

**Quantum across 514 articles and Bohr across 106.** Your round-five searches went looking for art-and-quantum; this is a 58-year run of an art-science journal with it throughout.

Three specific things:

- **"Crip-Techno-Tinkering," *Leonardo* 57(2), 2024, 173-178.** An **artist's article**, 25 autism and neurodiversity hits. Crip, technology, making, in Leonardo, last year.
- **"TRANSMOGRIFIER: Fictional Narratives as Catalyst for Experimental Instrument-Building."** 54 of Leonardo's 61 transmogrification hits are in this one article, used for instrument-building.
- **Bohr's densest articles** are art-and-science pieces: an *Aesthetics, Representation and Creativity in Art and Science* special section (17), **Kenneth Snelson** the sculptor (12), and a 2000 article at 9.

---

## 5. One check that saved a wrong claim

Leonardo returned "stim" 35 times across 30 articles, which would have overturned the standing finding. **All of the first twelve are line-break artefacts**: "stim-ulation" and "stim-uli" hyphenated across the two-column layout.

**The stimming absence holds.** Across all four corpora now, roughly 51 million words, it appears substantively only in Yergeau.

---

## 6. Shildrick 1996

`Shildrick_Margrit_1996_Posthumanism and the Monstrous Body` is image-only; I OCR'd it. 15 pages, 7,097 words.

Its first move is the one your framing turns on:

> "The issue, as I understand it, is one of **leaky boundaries**, wherein the leakiness of the logos, that failure to hold the still centre of meaning and authority against its margins, is mirrored by **the collapse of the human itself as a bounded category**."

> "insofar as their difference is specified, women are the non-subject other, the excluded, the embodied, **the monstrous**."

> "in the face of posthumanism, it is not possible to be, as modernist philosophy has so often claimed to be, disinterested: **we are all implicated, we are all subjects**."

Your filename note says "add to mother". It sits with the Shildrick "Monstering the (M)Other" chapter already in the folder, and "monstrous" has 143 hits across 95 Leonardo articles if you want the art-side company.

---

SOURCE_FILE: K:\OneDrive\UNM\Dissertation\todo October 26\THIRD_CORPUS_lens.md
SOURCE: pdftotext -layout extraction of the PDFs under K:\ResearchRepository\Black Mountain College, K:\ResearchRepository\Dissertation_Hub and the K:\ResearchRepository root on 2026-10-27; plus the pre-existing extracted text of the Leonardo spoke at K:\ResearchRepository\Dissertation_Hub\Leonardo_Spoke\text (9,685 files). Leonardo database figures are from leonardo.db and the spoke's own README. Shildrick 1996 OCR'd at 250 dpi with Tesseract, 15 pages.
NOTES: counts are case-insensitive occurrence counts including reference lists. **Leonardo's two-column layout hyphenates across line breaks, which produces false positives for short stems**; the "stim" hits were checked for this and are artefacts, and other short stems in the Leonardo column should be treated with the same suspicion until checked. The Dissertation_Hub figures include this project's own working files, so Barad 191, Braidotti 164, diffraction 264 and Trinh 127 there are partly my own and your output, not sources. None of the documents named has been read beyond the quoted passages. Leonardo articles were not de-duplicated against the other corpora.
