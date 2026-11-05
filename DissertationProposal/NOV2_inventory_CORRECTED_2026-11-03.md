# The November 2 folder: corrected inventory

3 November 2026. **This file supersedes `NOV2_inventory_2026-11-02.md` on every count, three attributions and one read order.** That file is left exactly as it was written. It should not be used for term counts, for the Shildrick year, or for the authorship of two of its documents.

It also supersedes `NOV2_recount_2026-11-03.md` on the term counts only; that file's document counts and duplicate groups still stand and are carried forward here.

The folder's own markdown and CSV deliverables (the concatenation strategy, the support map, the notes-to-chase tables) are another window's work on the proposal and are not touched here.

---

## 1. Four faults in how I counted, and what each one cost

Every term count in the 2 November inventory was wrong, in four separate ways. All four are faults in my method, not in the documents. Per-document figures are now in `K:\OneDrive\UNM\Dissertation\November 2\NOV2_term_counts_2026-11-03.csv` (43 rows plus header, one per cached text).

**Fault one: unanchored stems caught word tails inside longer words.** A search for `crip` with a prefix but no leading word boundary matches the end of *des‑crip‑tion*, *trans‑crip‑t*, *manu‑scrip‑t*, *des‑crip‑tors*. This was already caught on 2 November for "crip" alone. It was never checked for the other stems, and two more were contaminated. Folder-wide:

| stem | unanchored | word-anchored | false positives |
|---|---:|---:|---:|
| `crip*` | 279 | 81 | **198** |
| `figur*` | 281 | 175 | **106** |
| `monstr*` | 116 | 44 | **72** |
| `metaphor*` | 156 | 156 | 0 |

`figur*` was catching **configuration** and **reconfiguration**; `monstr*` was catching **demonstrate**, **demonstrated**, **demonstration**. Nothing in English ends in "-metaphor", which is why that one stem was clean and why the error went unnoticed.

The worst single consequence: **Donnarumma 2025 was listed with "figuration 19". The true count of the word *figuration* in that article is 0.** The 19 were the tails of *configuration* and *reconfiguration*. My close read of that article, written later, says figuration 0, and the close read is right.

**Fault two: PDF line breaks split words with a hyphen.** `meta-` at the end of one line and `phor` at the start of the next matched nothing. Four documents were undercounted on "metaphor", all four upward. This is the fault recorded at the head of `..\todo October 26\LAST_SIX_read_2026-11-03.md`, and it is why I had to withdraw a sentence about Granek.

**Fault three, and this is the one that hid something that matters: the `fi` ligature.** Wiley and Taylor and Francis PDFs encode "fi" as the single character ﬁ (U+FB01), and "fl" as ﬂ. There are **457 ligature characters in this folder**. Any search for a word containing "fi" or "fl" silently returns nothing in those files. So:

- **Jackson 2013, "Posthumanist data analysis of mangling practices": figuration 0 → 2.** And those two occurrences are the article's central move: "Pickering's mangle and its potential as a both a **figuration** and a different tool for analysis", and "using the mangle as a **figuration** for post-humanist data analysis."
- **Shildrick 2015: figur- words 0 → 9**, including the sentence that appears twice, once in her abstract and once in her body: the disabled body understood "not as a less than perfect form of the normative, but as **figuring difference in a nonbinary sense**." Also "Haraway ... **figures** the cyborg", and "Where embodied anomaly has **figured** in modernist discourse as a lack of fully realized selfhood".
- **Mazzei 2013, "A voice without organs": figur- words 0 → 1**, and it is inside a quotation from Barad about Haraway: "Haraway focuses our attention on this **figurative** distinction to highlight important difficulties with the notion of reflection as a pervasive **trope** for knowing."

**Fault four: I never counted the word the sources actually use.** "Trope" appears **27 times** in this folder and was in none of my term sets. Fourteen of the 27 are in Shildrick's book. It is now in the CSV.

**What the measure is, from here on.** Every count in this file and in the CSV is: case-insensitive; line-break hyphens healed first; ligatures expanded to their letters first; word-anchored at the front. Exact-word counts are marked plain, stem counts are marked with an asterisk, and the two are never mixed in one column. The 2 November inventory mixed them without saying so, which is why a figure like "monster 24" could not be reproduced: the exact word is 7 and the stem is 35.

---

## 2. One correction to a file written earlier today

In `..\todo October 26\LAST_SIX_read_2026-11-03.md` I gave Mazher 2012's metaphor counts as "metaphor 4, metaphorical 1, metaphorically 1". That was a miscount from a hand check. The correct breakdown is **metaphor 3, metaphorically 2, metaphorical 1, metaphors 1, stem total 7**. The argument in that file is unaffected: his second theme still rests on a catalogue of metaphors, and the quotations given there are accurate. Only the tally was wrong. The 2 November inventory's "metaphor 7" for Mazher was the stem count and was the one number in it that came out right.

---

## 3. Three attributions that were wrong, and the pattern behind two of them

**3.1 The Shildrick year is 2015, not 2014.** The 2 November inventory calls it "Shildrick, Margrit (2014)" throughout and bases its read order on that. The source of the error is the filename, `Hypatia_-_2014_-_Shildrick_-_Why_Should_Our_Bodies_End_at_the_Skin...`, which is a Wiley download artefact carrying the online-first year.

The article of record is:

> Margrit Shildrick (2015), "'Why Should Our Bodies End at the Skin?': Embodiment, Boundaries, and Somatechnics", ***Hypatia* 30, no. 1 (Winter 2015), pp. 13-29**, doi 10.1111/hypa.12114.

Confirmed five times over: its own running head ("Hypatia vol. 30, no. 1 (Winter 2015)"); the Wiley footer stamped in its margins ("Hypatia 15272001, 2015, 1"); Shannon's reference list; Mittner et al's reference list ("Shildrick, M. (2015) ... *Hypatia*, 30(1), 13-29"); and the reference list of Gomes et al ("Hypatia, v.30, v. 1, p. 13-29, winter 2015").

**And it is not a standalone article.** It is the second item in a special issue, after Kim Hall's introduction at pages 1-12. The whole twenty-item table of contents of *Hypatia* 30(1) is reconstructed in `..\todo October 26\LAST_SIX_read_2026-11-03.md`, section 1, from the reference list of Gomes et al.

**3.2 The 2009 afterword is by Elizabeth Adams St.Pierre, not by Jackson and Mazzei.** The 2 November inventory lists "**Jackson and Mazzei (2009), 'Afterword: Decentering Voice in Qualitative Inquiry'**". The chapter's own first page reads:

> Afterword / Decentering voice in qualitative inquiry / **Elizabeth Adams St.Pierre**

Jackson and Mazzei are the editors of the volume. The filename, `AleciaYJacksonL_2009_AfterwordDecenteringv_VoiceinQualitativeInq.pdf`, is an EBSCO export whose own footer says so: "*Alecia Y Jackson, Lisa A Mazzei; Voice in Qualitative Inquiry: Challenging Conventional, Interpretive, and Critical Conceptions in Qualitative Research*". The correct citation is Elizabeth Adams St. Pierre (2009), "Afterword: Decentering voice in qualitative inquiry", in A. Y. Jackson and L. A. Mazzei (eds), *Voice in Qualitative Inquiry*, Routledge, pp. 221-236. Her name prints without a space after the period throughout, as "St.Pierre".

**3.3 `Mazzei.Jackson._LdF.LTP.Jan20.23.revised.pdf` is not mislabelled.** The 2 November inventory calls it "a filename that names the wrong authors" and puts it first among three things to fix. The authorship note was right; "mislabelled" was wrong. The filename names the **editors first, then the authors' initials**: Mazzei and Jackson are the editors, LdF is Liz de Freitas, LTP is Laura Trafí-Prats. That is a working shorthand, not an error.

**The pattern worth keeping, because it caught me twice in the same folder.** Two of these filenames name the volume's editors rather than the chapter's authors, and in both cases I read the filename as an attribution. Any file in this folder whose name carries two surnames and an abbreviation should be opened before it is cited.

**And one new find that came out of 3.3.** The forthcoming volume that chapter was accepted into is **L. Mazzei and A. Jackson (eds), *Postfoundational Approaches to Qualitative Inquiry*** — a third Jackson and Mazzei edited collection, after *Voice in Qualitative Inquiry* (2009) and *Thinking with Theory* (2012, 2023), and recorded nowhere in this folder before 3 November.

**3.4 Two smaller fixes.** Mazzei and Rath 2015 is a **book review**, five pages, of Ringrose's *Postfeminist Education?*, not a research article; the 2 November inventory lists it among the corpus without saying so. And Wilke et al, listed there as "(2022?)" with the fourth author as "Joanne Song", is **2024**, IJQSE 37(7), 1986-2003, and the fourth author is **Joanne Song Engler**.

---

## 4. Corrected headline counts

The 2 November inventory counted 42 PDFs because it ran before the zips were extracted into their own three folders. Amy extracted them on 3 November and added one new document.

| | 2 Nov inventory | corrected |
|---|---:|---:|
| PDF files on disk, all locations | 42 | **65** |
| Distinct documents by hash of extracted text | 37 | **38** |
| of those, journal front matter | 4 | **4** |
| **Substantive documents** | **33** | **34** |
| **Read end to end, with a close read written** | **1** | **34** |
| Still unread | 32 | **0** |

The jump from 42 files to 65 is duplication, not new material: the three zips now exist as three folders of their own alongside `Taylor_Francis_extracted`, which is my redundant folder from 2 November and can be deleted. One document is genuinely new, `jackson-mazzei-2008-experience-and-i-in-autoethnography.pdf`, added 3 November. Per-file hashes, page counts and word counts are in `NOV2_file_hashes_2026-11-03.csv`; the duplicate groups are in `NOV2_recount_2026-11-03.md`, which still stands on all of that.

**The folder is read out.** Eleven close-read files in `K:\OneDrive\UNM\Dissertation\todo October 26` cover all 34.

---

## 5. The documents, corrected

Citations are from each PDF's own "To cite this article" line, running head or title page. Word counts are from the extraction with line-break hyphens healed, so they differ by a few from the 2 November figures. Counts are exact-word unless marked with an asterisk.

**A transcription note before the table.** For items published before about 2004, Taylor and Francis's own cite-this-article line prints the journal's short form, "Qualitative Studies in Education", without "International Journal of". Both Jackson 2003 articles and Somerville 2004 come through that way. The journal is the same one. The 2 November inventory transcribed the short form faithfully; it is not an error in either file.

### 5.1 Skin, membrane, breath, prosthesis

| | words | corrected counts |
|---|---:|---|
| **Shildrick, Margrit (2022), *Visceral Prostheses: Somatechnics and Posthuman Embodiment***, Bloomsbury Academic, Theory in the New Humanities, CC BY-NC-ND, 273 pp. | 116,450 | prosthe\* 483, assemblage 65, Deleuze 61, Shildrick 45, Braidotti 45, Haraway 31, somatech\* 28, skin 17, **trope 14**, metaphor 10 (metaphor\* 26), figur\* 53, monster 3 (monstr\* 8), Barad 4 |
| **Shildrick, Margrit (2015), "'Why Should Our Bodies End at the Skin?': Embodiment, Boundaries, and Somatechnics", *Hypatia* 30(1), Winter 2015, 13-29**, doi 10.1111/hypa.12114 | 8,926 | assemblage 41, Deleuze 39, prosthe\* 31, Haraway 18, Shildrick 15, **figur\* 9**, somatech\* 8, skin 7, Braidotti 7, Barad 5, **trope 3**, metaphor 0, figuration 0 |
| **Nieuwenhuis, Marijn (2019), "Porous skin: Breathing through the prism of the holey body"**, *Emotion, Space and Society* | 9,065 | skin 137, porous 52, Shildrick 6, Deleuze 3, monster 2, trope 1, metaphor 0 |
| **Donnarumma, Marco (2025), "AI and corporeal knowledge: inventing and performing with prostheses and sonic organs", *Frontiers in Computer Science* 7:1575730**, 4 July 2025, CC BY | 10,588 | prosthe\* 45, figur\* 14 (**all *configuration* or *figure N*; figuration 0**), disabilit\* 9, Shildrick 4, skin 3, metaphor 0 |

### 5.2 Pregnancy, the maternal, the monstrous

| | words | corrected counts |
|---|---:|---|
| **Betterton, Rosemary (2006), "Promising Monsters: Pregnant Bodies, Artistic Subjectivity, and Maternal Imagination", *Hypatia* 21(1), 80-100**, Project MUSE 190559 | 8,175 | pregnan\* 86, **monstr\* 35, monster 7** (2 Nov file said 24), Braidotti 17, disabilit\* 10, metaphor 4 (metaphor\* 7), prosthe\* 5, Haraway 4, Shildrick 4, trope 3, metonym\* 1 |
| **Hallström, Ina (2024), "Endo Time: Endometriosis and the Flow of Recognition", *Hypatia* 39, 423-443**, doi 10.1017/hyp.2023.116, CC BY | 12,766 | endometrio\* 47, disabilit\* 12, crip\* 9 (crip 8), Shildrick 4, **metaphor 3** (2 Nov file gave none), Deleuze 1 |

### 5.3 The Jackson and Mazzei corpus

Complete, 2003 to 2024, plus the 2008 article added on 3 November. In publication order, with the pagination the 2 November file mostly lacked.

| | words |
|---|---:|
| **Jackson, Alecia Youngblood (2003), "Rhizovocality", *Qualitative Studies in Education* 16(5), 693-710** | 10,270 |
| **Jackson, Alecia Youngblood (2003), "Can I claim your roots and take credit for the shoots?", *QSE* 16(5), 731-735** | 2,614 |
| **Jackson, Alecia Y. and Lisa A. Mazzei (2008), "Experience and 'I' in Autoethnography: A Deconstruction", *International Review of Qualitative Research* 1(3), 299-318** | 9,043 |
| **St. Pierre, Elizabeth Adams (2009), "Afterword: Decentering voice in qualitative inquiry"**, in Jackson and Mazzei (eds), *Voice in Qualitative Inquiry*, Routledge, 221-236 | 7,956 |
| **Mazzei, Lisa A. and Kate McCoy (2010), "Thinking with Deleuze in qualitative research", *IJQSE* 23(5), 503-509** | 3,875 |
| **Mazzei, Lisa A. (2010), "Thinking data with Deleuze", *IJQSE* 23(5), 511-523** | 7,823 |
| **Jackson, Alecia Youngblood (2010), "Deleuze and the girl", *IJQSE* 23(5), 579-587** | 5,223 |
| **Mazzei, Lisa A. (2013), "A voice without organs: interviewing in posthumanist research", *IJQSE* 26(6), 732-740** | 5,175 |
| **Jackson, Alecia Youngblood (2013), "Posthumanist data analysis of mangling practices", *IJQSE* 26(6), 741-748** | 4,416 |
| **Mazzei, Lisa A. and Courtney L. Rath (2015), "Postfeminist education?: girls and the sexual politics of schooling", *IJQSE* 28(4), 496-500. A BOOK REVIEW.** | 2,232 |
| **Mazzei, Lisa A. and Alecia Y. Jackson (2017), "Voice in the agentic assemblage", *Educational Philosophy and Theory* 49(11), 1090-1098** | 5,972 |
| **Jackson, Alecia Y. and Lisa A. Mazzei (2024), "Thinking like a feminist and reading with love", *IJQSE* 37(6), 1611-1619** | 6,367 |

**Two of these are back to back in one issue**, which the 2 November file could not show without pagination: Mazzei's "A voice without organs" at 732-740 and Jackson's "mangling practices" at 741-748 are consecutive articles in *IJQSE* 26(6). Three more share one issue, *IJQSE* 23(5): Mazzei and McCoy's introduction at 503-509, Mazzei at 511-523, Jackson at 579-587. And both 2003 Jackson articles are in *QSE* 16(5).

Corrected counts for the three that carry the thread's key term:

| | metaphor | figuration | figur\* | trope |
|---|---:|---:|---:|---:|
| Jackson 2003, Rhizovocality | 1 | **6** | 7 | 0 |
| Mazzei 2013, A voice without organs | 0 | 0 | **1** (was 0) | **1** |
| **Jackson 2013, mangling practices** | 0 | **2** (was 0) | **3** (was 0) | 0 |

Alongside them, three separately authored pieces in the same journal:

- **Somerville, Margaret (2004), "Tracing bodylines: the body in feminist poststructural research", *QSE* 17(1), 47-65.** 9,167 words; Shildrick 8, skin 7, pregnan\* 5, metaphor 2, trope 0. The cite line prints her name run together with an honorific, "MargaretSomerville Dr (2004)".
- **Granek, Leeat (2013), "Putting ourselves on the line: the epistemology of the hyphen, intersubjectivity and social responsibility in qualitative research", *IJQSE* 26(2), 178-197.** 11,273 words; Haraway 5, skin 3, Shildrick 2, **metaphor 1** (was 0, hidden by a line-break hyphen).
- **Kairienė, Aida, Natalija Mažeikienė and Liudmila Rupšienė (2026), "Rhizomatic Learning Paths of Education Researchers: Assemblages and Becomings", *Journal of Education Culture and Society* 1/2026, 301-322.** 8,885 words; Deleuze 42, assemblage 27.

### 5.4 Disability, crip, neuroqueer

| | words | corrected counts |
|---|---:|---|
| **McKnight, Lucinda and Ben Whitburn (2017), "The fetish of the lens: persistent sexist and ableist metaphor in education research", *IJQSE* 30(9), 821-831**, CC BY | 7,312 | **metaphor 50, metaphor\* 93** (2 Nov file said 90), disabilit\* 14, Braidotti 8, Shildrick 4, Deleuze 3, trope 3, Barad 2, figuration 0 |
| **Shannon, David Ben (2025), "A/autisms: a 'queer labor of the incommensurate'...", *IJQSE* 38(5), 711-729**, online 23 Nov 2021, CC BY | 11,987 | autis\* 190, disabilit\* 31, neuroqueer 18, Barad 12, diffract\* 11, skin 8, figur\* 5, crip 3, porous 3, Shildrick 2, metaphor 0 (metaphor\* 2), figuration 1 |
| **Acevedo, Sara M. (2025), "Lifelines: a neuroqueer politics of non-arrival in an undergraduate disability studies classroom", *IJQSE* 38(5), 658-672**, online 21 Dec 2021 | 9,662 | autis\* 85, disabilit\* 54, neuroqueer 34, Deleuze 9, figur\* 5, Haraway 3, crip 2, Shildrick 2, metaphor 0, figuration 0 |
| **Wilke, Autumn K., Kirsten R. Brown, Dominique Crosby and Joanne Song Engler (2024), "Cripping grounded theory...", *IJQSE* 37(7), 1986-2003**, online 26 Sep 2023 | 10,334 | disabilit\* 175, **crip\* 41, crip 17**, figur\* 11, Shildrick 2, metaphor 1 |
| **Mazher, Waseem (2012), "A Foucaultian critique of learning disability discourses: personal narratives and science", *IJQSE* 25(6), 767-800**, online 1 Sep 2011 | 18,721 | disabilit\* 147, **metaphor 3, metaphor\* 7**, prosthe\* 3, crip\* 0, figuration 0 |
| **Gibson, Barbara E. et al (2025), "Differences as potentials: a posthuman re-envisioning of disability and mobility", *Health* 29(6), 838-856** | 8,847 | disabilit\* 72, assemblage 11, Deleuze 6, Braidotti 5, Shildrick 4, prosthe\* 4, crip 2, metaphor 1 |
| **Murray, Stuart (2022), "Disability, embodiment, speculative fiction and the testbed of futurity", *JLCDS* 16(1), 24-40**, CC BY, Wellcome 214963/Z/18/Z | 7,111 | disabilit\* 54, Shildrick 4, crip 3, Braidotti 2, metaphor 0 (metaphor\* 1) |
| **Gomes, Ruthie Bonan, Paula Helena Lopes, Marivete Gesser and Maria Juracy Filgueiras Toneli (2019), "New Dialogues in Feminist Disability Studies", *Revista Estudos Feministas* 27(1), e48155.** An integrative literature review, not a research article. | 9,290 | disabilit\* 221, crip\* 12 (crip 10), pregnan\* 6, Shildrick 4, metaphor 0 (metaphor\* 2) |
| **Olthof, Anne Marleen, Jouke Verlinden and Somaya Ben Allouch, "THE BODY CAN NOT BE THOUGHT..."**, conference paper, 232-235, no date or DOI on the copy held | 3,416 | disabilit\* 33, **Shildrick 13**, somatech\* 13, Braidotti 6, Deleuze 5 |
| **Olthof, Verlinden and Ben Allouch (2023), "The body gets the notion...", IASDR 2023 Milan**, doi 10.21606/iasdr.2023.667, CC BY-NC. A PhD-project abstract. | 1,404 | **Shildrick 8**, disabilit\* 7, Deleuze 3 |
| **Mittner, Lilli, Karoline Dalby and Rikke Gürgens Gjærum (2021), "Re-conceptualizing the gap as a potential space of becoming...", *Nordic Journal of Arts, Culture and Health* 3(1-2), 63-74**, CC BY-NC | 5,560 | disabilit\* 51, Shildrick 2, figur\* 2, metaphor 0 |
| **Trafí-Prats, Laura and Elizabeth de Freitas (2025), "New Possibilities for Spatial Research...", *Qualitative Inquiry* 31(2), 186-200**, © 2024, ESRC ES/V006436/1 | 8,892 | Haraway 3, skin 1, assemblage 1, metaphor 0 |
| **de Freitas, Elizabeth and Laura Trafí-Prats, "Atmospheric data and software arts...", accepted chapter in Mazzei and Jackson (eds), *Postfoundational Approaches to Qualitative Inquiry* (forthcoming).** Revised manuscript, 20 Jan 2023. | 5,456 | glitch 3, Braidotti 3, Deleuze 2, skin 2, porous 1, metaphor 0 |

**Shildrick is cited by eight documents in this folder**, across five of her texts (1997, 2009, 2015, 2022, and Shildrick and Söffner 2017). By its own internal citation network she is the folder's centre, and the two short Olthof papers cite her most densely of all.

### 5.5 Journal front matter, not documents

Four files, with the citations their own cite lines give, which the 2 November file did not record:

- "List of reviewers for 2010, Volume 23", *IJQSE* 24(1), 3-5 (2011), 808 words
- "List of reviewers for 2011, Volume 24", *IJQSE* 24(7), 763-765 (2011), 815 words
- "List of reviewers for 2012, Volume 25", *IJQSE* 26(4), 503-506 (2013), 1,066 words
- an issue contents page, *Qualitative Studies in Education* 16(6), 883-886 (2003), 954 words

---

## 6. Where each close read is

All in `K:\OneDrive\UNM\Dissertation\todo October 26`. Section 4 of the 2 November inventory was a recommended read order, and it is now spent: everything in it has been read, in close to the order it proposed.

| documents | close read |
|---|---|
| Shildrick 2015 | `SHILDRICK_2015_WhyShouldOurBodiesEndAtTheSkin_read_2026-11-02.md` |
| Nieuwenhuis 2019 | `NIEUWENHUIS_2019_PorousSkin_read_2026-11-02.md` |
| McKnight and Whitburn 2017 | `MCKNIGHT_WHITBURN_2017_FetishOfTheLens_read_2026-11-02.md` |
| Betterton 2006 | `BETTERTON_2006_PromisingMonsters_read_2026-11-02.md` |
| Jackson 2003 (Rhizovocality), Mazzei 2013 | `JACKSON_2003_MAZZEI_2013_voice_read_2026-11-02.md` |
| Shannon 2025 | `SHANNON_2021_2025_Aautisms_read_2026-11-02.md` |
| Donnarumma 2025 | `DONNARUMMA_2025_AIandCorporealKnowledge_read_2026-11-02.md` |
| Shildrick 2022, the book, in full | `SHILDRICK_2022_VisceralProstheses_read_in_full_2026-11-02.md` |
| Murray 2022, Gibson et al 2025 | `MURRAY_2022_GIBSON_2025_read_2026-11-02.md` |
| Mazzei and McCoy 2010, Mazzei 2010, Jackson 2013, Jackson and Mazzei 2024, St. Pierre 2009 | `JACKSON_MAZZEI_STPIERRE_five_read_2026-11-02.md` |
| Mazzei and Jackson 2017, Jackson 2010, Jackson 2003 (roots), Somerville 2004, Kairienė et al 2026 | `VOICE_THREAD_five_more_read_2026-11-03.md` |
| Jackson and Mazzei 2008, the two de Freitas/Trafí-Prats, the two Olthof, Mazzei and Rath 2015, Granek 2013 | `SEVEN_read_2026-11-03.md` |
| Mittner et al 2021, Hallström 2024, Gomes et al 2019, Acevedo 2025, Wilke et al 2024, Mazher 2012 | `LAST_SIX_read_2026-11-03.md` |

---

## 7. What the corrected counts change in the metaphor and figuration thread

The thread is recorded in full in `LAST_SIX_read_2026-11-03.md`, section 9, at twelve positions. The corrected counts change two of them and add one link.

**Position 3 is strengthened, not weakened.** The claim was that the Jackson and Mazzei lineage uses "figuration" and never "metaphor". The corrected counts support it harder than the old ones did: Jackson 2003 figuration 6, **Jackson 2013 figuration 2** (recorded as 0), against metaphor 1 and 0. And Jackson 2013's two are the article's governing term, the mangle "as a figuration for post-humanist data analysis".

**Position 5, Shildrick, needs one addition.** Her 2015 article uses figur- nine times, which my count gave as zero, and the usage is doubled in a specific way: **"figuring" for what the disabled body does to difference, "figured" for what discourse does to anomaly.** "Not as a less than perfect form of the normative, but as figuring difference in a nonbinary sense", against "Where embodied anomaly has figured in modernist discourse as a lack of fully realized selfhood".

**The link that follows from it.** Acevedo 2025 takes exactly that doubled sense from Yergeau: "autistic people figure and literalize their thereness, even in the midst of being clinically and rhetorically figured as absent." Same active/passive contrast, same word, ten years apart, in a folder where Acevedo cites Shildrick twice but not for this. **Recorded as a parallel, not as influence, and not adjudicated.**

**And one vocabulary finding.** "Trope" is the folder's unexamined fourth term, 27 uses, 14 of them Shildrick's. Mazzei's single figur- word arrives inside a Barad quotation that uses "trope" in the same sentence. If the thread is about what these writers call a figure, trope belongs in it alongside metaphor, figuration and figure.

---

SOURCE_FILE: `K:\OneDrive\UNM\Dissertation\November 2\NOV2_inventory_CORRECTED_2026-11-03.md`

SOURCE: the 65 PDFs under `K:\OneDrive\UNM\Dissertation\November 2`, walked recursively on 3 November 2026. Citations transcribed from each PDF's own "To cite this article" line, running head, cover sheet or title page, not from a catalogue. Term counts re-derived for this file by `C:\Users\Amy\AppData\Local\Temp\claude\K--BigData\aaa8b847-54bf-48e1-adf9-f5ea8ebb5b45\scratchpad\counts3.py` over the cached plain text in `...\scratchpad\nov2txt\`, and written to `K:\OneDrive\UNM\Dissertation\November 2\NOV2_term_counts_2026-11-03.csv` (43 rows plus header). Document and duplicate counts are carried from `NOV2_file_hashes_2026-11-03.csv` and `NOV2_recount_2026-11-03.md`.

NOTES:
- **Measure, stated once and applied everywhere in this file and in the CSV**: case-insensitive; line-break hyphens healed; the ligatures ﬀ ﬁ ﬂ ﬃ ﬄ expanded to their letters; word-anchored at the front. Plain = exact word. Asterisk = stem. The two measures are never combined in one figure.
- This file supersedes `NOV2_inventory_2026-11-02.md` on all term counts, on the Shildrick year, on the authorship of the 2009 afterword, on the `Mazzei.Jackson._LdF.LTP` filename, on the Wilke et al year and fourth author, on the status of Mazzei and Rath 2015, and on the document counts. That file has not been edited.
- It supersedes `NOV2_recount_2026-11-03.md` on term counts only. Its document counts, duplicate groups and locations table still stand.
- It corrects one figure in `..\todo October 26\LAST_SIX_read_2026-11-03.md` (Mazher's metaphor tally), stated in section 2. That file has not been edited.
- The 2 November inventory's own warning still applies to itself and is the reason it was always provisional: "**Nothing in section 3 has been read**; every description is from the title page, the abstract, the citation line and the term counts." Everything in this folder has now been read, so the characterisations here come from the reads, not from title pages.
- The superseded substring sweep at `...\scratchpad\nov2_sweep.csv` should not be used for any term.
- Still outstanding, unchanged: `Taylor_Francis_extracted` is my redundant folder and can be deleted; `Unconfirmed 605583.crdownload` in the October 31 folder is an unfinished Chrome download, not a readable file. Smaller remainders outside this folder: Fries's Appendices B and C beyond their opening, Kotzé's Appendices 1 and 2, Butler's index.
- Nothing in this file is logged as a citation. It goes to the dissertation lane's citation check before any of it is cited.
- No tag, code or theme has been applied to any of Amy's own material.
