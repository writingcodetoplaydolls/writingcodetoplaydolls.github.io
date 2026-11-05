# Eleven additions from Hayles chapter 1, keyed to the proposal, plus where Heisenberg's philosophy book is

Written 29 Oct 2026 in answer to this request, recorded as hers, not rewritten:

> Find Heisenbergs philosophy b9ok, add as part of my primary goal the quote on page 59 of Hayle, that literary strategies are forged by the desire to find a form, and a language, adequate to determine its human meaning. It being a dynamic, mutually interacting field. Add a note to revisit the top paragraph of page 54 thru the reading of Sapir Whorf. Add Bohr's viewpoint theory from pages 52 to 55. Add a connect8on to Braidotti in the first full paragraph of page 55. Add connection to Trinh via Heisenberg on page 51. Add rhe footnote from 49 about Becoming rather than Being. The top of page 46 connects to agential realism. Add the role of imagination in theory page 45-46, and on page 45 Winsteins belief that fundamental postulates should not be the result of arbitrary restrictions but should flow naturally from the initial conception. Read this thru premature optimization in computing and my belief that academic writing/research/text sets out arbitrary restrictions that do not allow us to explore the wholeness of the field. The restrictions recreate a world we dont claim to not believe in/dualism. Add Pirsigs sifting grains of sand as exercises in arbitrary cuts on page 40.

All page references are to Hayles, *The Cosmic Web* (Cornell, 1984), chapter 1, "Spinning the Web," pp. 31-59, read in full 29 Oct. The PDF's page numbers match the printed ones, so every page named below opens directly in `K:\OneDrive\UNM\Dissertation\todo October 26\Hayles_N_Katherine_The_Cosmic_Web_Scientific_Field_Models_and_Literary_Strategies_in_the_Twentieth_Century_1984.pdf`.

**Nothing in this file has been written into the proposal draft.** The draft is `K:\OneDrive\UNM\Dissertation\todo October 26\Dissertation_Proposal_RoughDraft_blocks.csv`, 632 rows, and the target section for each item is named below so it can be patched by line number when wanted.

---

## 0. The eleven items and where each one goes

| # | Hayles | What it is | Proposal section |
|---|---|---|---|
| 1 | **p. 59** | form and language adequate to the human meaning of a dynamic, mutually interacting field | **1.4 Research questions** (rows 186-202), as part of the primary goal |
| 2 | **p. 54, top paragraph** | the deep structure of Indo-European languages posits actee and actant | **note to revisit**, through Sapir-Whorf |
| 3 | **pp. 52-55** | Bohr's viewpoint theory, in five steps | **1.5 Ontological commitments** and **2.2 Methodology** |
| 4 | **p. 55, first full paragraph** | shifting mutually exclusive viewpoints all in some sense true | **1.2 Location: nomadic subjectivities**, to Braidotti |
| 5 | **p. 51** | Heisenberg's gamma-ray microscope and the potentia | **2.2**, to Trinh |
| 6 | **p. 49, n. 32** | Becoming rather than Being | **1.5** |
| 7 | **p. 46, top** | the frame is arbitrarily chosen, and that is what makes invariance possible | **1.5**, to agential realism |
| 8 | **pp. 45-46** | the role of imagination in theory | **2.2**, and 1.4 |
| 9 | **p. 45** | postulates should not be arbitrary restrictions but should flow from the initial conception | **her claim**, read through premature optimization |
| 10 | **p. 40** | Pirsig's knife, concealed by the passive voice | **1.5** and **2.5**, with the arbitrary cut |
| 11 | n/a | Heisenberg, *Physics and Philosophy* | **not held**, see section 1 |

---

## 1. Heisenberg's philosophy book: what it is, and what is held instead

> **Werner Heisenberg, *Physics and Philosophy: The Revolution in Modern Science*. New York: Harper & Row, 1958.**

That is Hayles's own reference (chapter 1, note 23), and she cites **pp. 41, 56 and 58** from it. It is the book her chapter 1 epigraph comes from, and it is the only passage in her book about art, style and the spirit of the time.

**It is not on the drives.** Searched `K:\OneDrive\UNM`, `K:\ResearchRepository` and the three extracted corpora (1,117 documents): no copy, and no filename containing Heisenberg. Heisenberg appears 987 times across the corpora, but always as someone being quoted.

**What is held, and it is a good deal more than a substitute.**

> **Michael Epperson, *Quantum Mechanics and the Philosophy of Alfred North Whitehead*. Fordham University Press, American Philosophy Series.**

Held in full, 91,359 words, in the `todo` corpus, **plus seven separate page-extracts** already filed in `K:\OneDrive\UNM\Comps\Used texts` under "Epperson on Whitehead." It quotes *Physics and Philosophy* eleven times **with page numbers**, including every passage Hayles uses, and it develops the potentia argument at length: potentia 300 occurrences in the full text.

Its citations give the page numbers Hayles does not always supply: **Heisenberg, *Physics and Philosophy* (New York: Harper and Row, 1958), 185**; and **(New York: Harper Torchbooks, 1958), 54-55**; and **41**; and **55**. Same year, two imprint names, which is worth knowing when the citation is built.

And Epperson quotes the potentia sentence Hayles quotes on her p. 51, with the argument around it:

> "Heisenberg, in his analysis of the ontological significance of quantum mechanics, insists upon the fundamental reality and function of potentia in this regard. For him, **potentia are not merely epistemic, statistical approximations of an underlying veiled reality of predetermined facts; potentia are, rather, ontologically fundamental constituents of nature.** They are things 'standing in the middle between the idea of an event and the actual event, a strange kind of physical reality just in the middle between possibility and reality.' Elsewhere, Heisenberg writes that the correct interpretation of quantum mechanics requires that one consider the concept of '**probability as a new kind of "objective" physical reality. This probability concept is closely related to the concept of natural philosophy of the ancients such as Aristotle; it is, to a certain extent, a transformation of the old "potentia" concept from a qualitative** . . .'"

So the potentia thread runs: Aristotle, Heisenberg, Whitehead, Epperson, and it is already in Comps. That is also the bridge to the Whitehead "climate of opinion" thread in `NOTES_to_chase.md` section 9, and Epperson is a Whitehead book.

**To fetch the Heisenberg itself.** Two commands, to run rather than click:

```bash
curl -s "https://archive.org/advancedsearch.php?q=title%3A%28physics+and+philosophy%29+AND+creator%3A%28Heisenberg%29&fl%5B%5D=identifier&fl%5B%5D=title&fl%5B%5D=year&rows=20&output=json" | python -m json.tool
```

```bash
curl -s "https://openlibrary.org/search.json?q=physics+and+philosophy+heisenberg&fields=title,author_name,first_publish_year,edition_count,ia" | python -m json.tool
```

The first lists archive.org items with their identifiers so a specific copy can be chosen; the second gives Open Library editions and any archive.org identifiers attached to them. Hayles's edition is the 1958 Harper, reissued as a Harper Torchbook and later by Penguin Classics with an Introduction by Paul Davies, so the year is the thing to match.

---

## 2. Item 1. Page 59, for the primary goal

Her wording, kept as hers, is at the head of this file: "literary strategies are forged by the desire to find a form, and a language, adequate to determine its human meaning. It being a dynamic, mutually interacting field."

The sentence as printed, p. 59, is the last sentence of chapter 1:

> "The authors to whom we now turn have their own perspective and insights to bring to this problem. Whereas the scientific theories are created through the attempt to express the field view in rigorously exact models, **the literary strategies are forged by the desire to find a form, and a language, adequate to interpret its human meaning.**"

One word differs between her note and the page: the printed verb is **interpret**, not determine. Flagged here only so the quotation can be set either way deliberately.

And the sentence two sentences earlier, which is the "it" the possessive refers to:

> "Because the task of articulation requires that **a vision of a dynamic, mutually interacting field** be represented through a medium that is inherently linear, fragmented, and unidirectional, the novelist's concern with language will have much in common with these scientific concerns."

**Where it goes.** Section 1.4 already states the goal across rows 186 to 202: "Through/with the paradigm of art practice as research," then the virtual and the real, then "With the support of interwoven/kaleidoscopic methods," then "With the realization of transcorporeality, while situated in the ethico-onto-epistemological web/womb/magnetic field/structure created by the diffraction patterns/transpositions of Braidotti/Trinh Minh Ha/Bennett/Barad/Alaimo/Deleuze via multiple transpositive voices/Leibniz via Merleau-Ponty." The Hayles sentence names the same task in 1984 and from inside literary studies, and it supplies the word **adequate**, which is a standard the project can be held to.

Two things worth knowing before it is used as a warrant (mine, not hers). **Hayles says "literary strategies," not artistic ones**: her five case studies are all novels, and there is no visual art in the book. And **she does not say the desire succeeds**: the same chapter ends in "the problem of articulation is intrinsic to this view of reality," and p. 21 says the prey always escapes. So the sentence is a statement of what the strategies are **forged by**, not of what they achieve.

---

## 3. Item 2. Top paragraph of page 54, to revisit through Sapir-Whorf

**A note to revisit, as asked.** The paragraph runs from the foot of p. 53 onto p. 54, and the part at the top of p. 54 is:

> "Although Bohr does not rely on linguistics in making this argument, it is possible to recapitulate his reasoning in these terms, through a consideration of the deep structure of Indo-European languages. To make a well-formed utterance in English, for example, is implicitly to acknowledge a structural division between **actee and actant**, as well as [p. 54] **the temporal progression implicit in verb tenses. Thus not only is a speaking subject posited in opposition to an 'outside' world, but that relationship is further defined as occurring at a particular place in time and space.** Hence Bohr's point, that to speak requires a subject-object dichotomy, is true not only in the general sense that to speak is to assume a separation between the speaker and the object of speech, **but also in the more specific linguistic sense that to speak is to use a linguistic structure built on such distinctions.**"

**What to know before reading it through Sapir-Whorf.** Hayles has already put Whorf in the book twice and attached her own caveat to him both times, so the revisit does not start from zero.

- **Her Introduction epigraph** is Whorf: "the grammatical background of our mother tongue . . . includes not only our way of constructing propositions but the way we dissect nature and break up the flux of experience into objects and entities to construct propositions about."
- **Her p. 16** uses him for the same claim this p. 54 paragraph makes: the obviousness of the Newtonian view "is no doubt reinforced, as Benjamin Whorf has suggested, by the deep structure of Indo-European languages, which embodies its fundamental assumptions: the separation between subject and object, the duration of objects through time, and the uniform, unidirectional flow of time."
- **Her own footnote 1, p. 16**, is the caveat, and it is the reason the revisit is worth doing: "**The problem with Whorf's thesis is that in some strains of European culture (for example, alchemical thought in sixteenth- and seventeenth-century England), very different world views have emerged, even though the language was essentially the same as that Newton spoke.** Clearly other cultural factors, in addition to the deep structure of language, are responsible for the dominance of the Newtonian world view."
- Her reference is **Benjamin Whorf, *Collected Papers on Metalinguistics* (Washington, D.C.: Foreign Service Institute, 1952), pp. 3-8, 27-52.** Not held.

**What the corpora hold on this.** Thin. **Whorf 14 occurrences, Sapir 150, "linguistic relativity" 2, across 1,117 documents**, and almost all the Sapir hits are in two copies of one journal issue (JAAAS on soundscapes). Neither Sapir's nor Whorf's own writing is held. So this is a revisit that needs a fetch, and the fetch list is: Whorf's *Collected Papers* or *Language, Thought and Reality* (1956), and Sapir. **In the Hayles text the name is printed "Wharf" in both the p. 16 paragraph and footnote 1, which is a ClearScan slip for Whorf and should not be reproduced.**

---

## 4. Item 3. Bohr's viewpoint theory, pages 52 to 55

Hayles gives it in five moves. The whole of it, in order, because the sequence is the argument.

**One. The Uncertainty Relation is about language, not disturbance.** p. 52: "Bohr never endorsed the 'disturbance' concept of Heisenberg. Rather, in his view, **the Uncertainty Relation was deeply bound up with the limitations of language**. Bohr's long-time colleague Aage Petersen recounts how Bohr loved to repeat that '**we are suspended in language**.'"

**Two. Complementarity, in Bohr's own words.** p. 52: "The fundamental postulate of the indivisibility of the quantum of action . . . **forces us to adopt a new mode of description designated as complementary in the sense that any given application of classical concepts precludes the simultaneous use of other classical concepts which in a different connection are equally necessary for the elucidation of the phenomena.**"

**Three. Why the classical terms cannot simply be dropped.** p. 53: the classical concepts "evolved as a consequence of our experience in the world; they reflect the essential distinction between subject and object that is the absolute prerequisite for the process of observation to begin." And Bohr: "From the division into subject and object . . . **follows the meaning of every concept, or rather every word, the meaning depending upon our arbitrary choice of viewpoint.**"

**Four. The core of it, and the part to quote.** p. 53: "**To speak is to speak from a position that is defined as separate and distinct from that which is spoken about. Language thus implies a viewpoint, a specific place at which the subject-object split is made.** But because of the Uncertainty Relation, this viewpoint will always result in an incomplete and partial description. To complete the description, another viewpoint is necessary which makes the subject-object split in a different place. **But these viewpoints will be mutually exclusive, because the subject-object split can only be made in one place at a time. Hence no matter which viewpoint is chosen, there will always be aspects of reality that can only be understood from another, mutually exclusive viewpoint. To switch to that new viewpoint will render indistinct and hence indeterminate aspects that may have been clear in the former viewpoint.**" With Bohr's conclusion: "**we must, in general, be prepared to accept the fact that a complete elucidation of one and the same object may require diverse points of view which defy a unique description.**" And: "The classical concepts cannot simply be abandoned, because **any concept whatever, that is, any definition of reality that is external to us, will have the same built-in limitations of viewpoint.**"

**Five. And this is the move that makes it a method rather than a lament.** pp. 54-55: "For Bohr, the fact that we remain 'suspended in language' does not mean that we cannot make progress . . . **according to Bohr, we progressively refine our viewpoints not by attempting the impossible, that is, observing without a viewpoint, but by recognizing the ways in which our description of reality depends on the viewpoint we have chosen.**" With Bohr on the regress: "The development of physics has taught us that . . . even the most elementary concepts [are] based on assumptions initially unnoticed," and when an "explicit consideration" of them is undertaken we "obtain a classification of more extended domains of experience," which will in turn rest on other concepts containing "unrecognized presuppositions." Then Hayles's sentence: "**Thus progress is made not by ignoring or underplaying limitations of viewpoint, but by systematically examining and exploiting them.**"

**Where it goes, and what it already connects to.** 1.5 and 2.2. The reading plan's 1.5 already carries **Barad's complementarity note** ("by 'complementarity' he means simultaneously 'mutually exclusive' and 'mutually necessary'"), and this is the same claim arriving from Bohr through Hayles rather than through Barad. It also gives the methodological version of the standing rule about divergent readings: Bohr's "diverse points of view which defy a unique description" is that rule stated in 1930s physics, and his "progress is made by systematically examining and exploiting them" is the instruction.

---

## 5. Item 4. First full paragraph of page 55, to Braidotti

The paragraph:

> "**It would be possible to write the history of the modern novel using similar terms, starting from a Jamesian theory of point of view and progressing to post-modern literature in which the assumption that there is a 'point' from which to 'view' is called into question. Shifting viewpoints that are mutually exclusive but all in some sense true; experiments that involve making the subject-object split in different places; the radical questioning of what it means to be 'objective'** - these are familiar to literary readers as the central issues of modernism, just as the problem of self-referentiality is the central issue of post-modernism. If we follow Bohr's advice (and Pynchon's example), the next step is to examine the underlying assumptions behind these literary strategies, thereby preparing the way for yet another enlargement of our understanding."

**The connection, from the held Braidotti** (`BRAIDOTTI_WritingAsANomadicSubject_deepread.md`, the 2014 essay read in full on 29 Oct):

- "**style is a navigational tool**. It negotiates our path across sets of material ('matter-real') coordinates," which is Hayles's shifting viewpoint described as a way of moving rather than as a limit.
- "the accuracy of the cartographer with the hyper-sensitivity of the sensualist," which is the viewpoint owned rather than apologised for.
- "**the folding in and out of perception**," which is Hayles's switching between mutually exclusive viewpoints.
- "A **figuration** is a living map, a transformative account of the self; it's no metaphor," which is the answer to "the assumption that there is a 'point' from which to 'view'": for Braidotti there is a point, it is a located body, and locating it is the work.
- "**Artistic genres are variables co-existing along a continuum**," against Hayles's "canonical genre classifications."

So the paragraph is a literary-historical version of what Braidotti makes into a method: Hayles narrates the loss of the single viewpoint as modernism's central issue, Braidotti takes the loss as the starting condition and asks how to navigate from inside it. **Hayles has Braidotti 0 and Braidotti has Hayles 0 in the texts held**; the pairing is one to make.

### Her note on this passage, 29 Oct, recorded as hers

> Add that the Bohr passage connects Braidotti to quantum physics, which I have never seen her explicitly do.

**The counts bear it out, and more sharply than expected.** Hayles reaches this paragraph straight out of four pages on Bohr, so the Braidotti material arrives attached to complementarity whether or not Braidotti ever touched it. Across Braidotti's **own single-authored books held here, she names Bohr once and quantum twice**, and the single Bohr sentence attributes the engagement to other people:

> "**Karen Barad (2007) takes on the physics of the universe as a whole by engaging with the theories of physicist Niels Bohr; Vicky Kirby also refers to quantum anthropology (2011).**" (*Posthuman Feminism*, 2022)

| Braidotti text, held | words | Bohr | quantum | Barad | Heisenberg | complementarity |
|---|---|---|---|---|---|---|
| *Posthuman Feminism* (2022) | 107,208 | **1** | **2** | 6 | 0 | 2, **neither of them Bohr's** |
| *Nomadic Theory* (2011) | 148,962 | **0** | **0** | 7 | 0 | 0 |
| "Writing as a Nomadic Subject" (2014) | 8,925 | 0 | 0 | **0** | 0 | 0 |
| "Nomadic Ethics" (2013), from the OCR | 7,378 | 0 | 0 | 0 | 0 | 0 |

The other "quantum" in *Posthuman Feminism* is a reference-list entry for Kirby's *Quantum Anthropologies*. **Both occurrences of "complementarity" in that book are somebody else's term**: Sylvia Wynter's "paradox of the complementarity of European modernity and colonialism," and Ingold's "essential complementarity of the biogenetic and socio-cultural dimensions of human existence." Her one Einstein is the Freud and Einstein *Why War?* correspondence, which is about the death drive. The Barad-heavy and quantum-heavy counts in the *Posthuman Glossary* (Barad 117, quantum 56) are its other contributors' entries, not her prose.

So the observation holds: **Braidotti does not do this join, and the one time Bohr is in her prose she is reporting that Barad does it.** Two consequences worth stating. The connection through Bohr is one to make and cannot be cited to her. And it cannot be made by citing Barad either, since Barad's route to Bohr is agential realism, which Braidotti names from outside rather than adopts.

**One thing found in passing in the same Braidotti paragraph**, which belongs with the Trinh and clarity material rather than here: in the complementarity passage she quotes Spivak on the "**clarity fetishists**" of Western rationalism (Spivak, 1989: 206).

### The contribution claim, 29 Oct, recorded as hers

> Reading Braidotti through Bohr and quantum physics is mine. It is novel because she never made the claim explicitly herself. She talks about other sci3nce fields extensively but never veers into physics.

**The second half of that is checkable, and it checks out.** Braidotti's engagement with the sciences is wide and sustained, and physics is not in it. Counts over her own single-authored held books, hyphenation repaired, whitespace collapsed:

| | *Posthuman Feminism* (2022), 107,208 words | *Nomadic Theory* (2011), 148,962 words | "Writing as a Nomadic Subject" (2014), 8,910 words |
|---|---|---|---|
| species | 154 | 60 | 0 |
| technoscience | 124 | 3 | 0 |
| biology | 107 | 28 | 0 |
| ecology | 96 | 44 | 0 |
| genetics, genomics | 73 | 98 | 0 |
| climate | 73 | 12 | 0 |
| evolution | 71 | 95 | 0 |
| cognition | 61 | 97 | 0 |
| reproductive technologies | 40 | 2 | 0 |
| bacteria, microbes | 24 | 3 | 0 |
| immunity | 24 | 1 | 0 |
| medicine, clinical | 24 | 10 | 0 |
| neuro, neural | 23 | 14 | 0 |
| molecular | 20 | 50 | 0 |
| geology | 18 | 2 | 0 |
| algorithms, computation | 18 | 0 | 0 |
| hormones, endocrine | 14 | 1 | 0 |
| **other sciences, total** | **979** | **520** | **0** |
| | | | |
| **physics, as a discipline** | **5** | **3** | **0** |
| **quantum** | **2** | **0** | **0** |
| **Bohr** | **1** | **0** | **0** |
| **Heisenberg** | **0** | **0** | **0** |
| **field theory** | **0** | **0** | **0** |
| relativity | 0 | 1 | 0 |
| thermodynamics | 0 | 1 | 0 |
| Einstein | 1, the *Why War?* letters with Freud | 0 | 0 |
| entropy, entropic | 1 | 10, **none of them physics** | 0 |
| particle | 2 | 3 | 0 |
| spacetime | 2 | 2 | 1 |
| Barad | 6 | 7 | **0** |

**Two qualifications, and both strengthen the claim rather than weakening it.**

**One. The ten entropies in *Nomadic Theory* are not thermodynamic.** Every single one is psychoanalytic or economic: "the entropic and negative theory of desire in Hegel, Freud, and Lacan"; "Desire is deployed along an entropic curve for Freud and is equated with lack in Lacan"; "from entropic to generative notions of desire"; advanced capitalism as "all-consuming entropic energy"; "the entropic model built into psychoanalytic theory"; "the entropic state to which the body is supposed to 'return'." She borrows the word as a figure for lack. The one place in her corpus where a physics term appears ten times is the place where it is least about physics.

**Two. The counts for "physics" are smaller than they first look.** A search on the stem returns 24 in *Posthuman Feminism* and 23 in *Nomadic Theory*, but almost all of those are **physical**, the adjective, as in "physical training," "the physical self," "both physical, material, and yet speculative." With a word boundary, physics the discipline is **5** and **3**.

So: she surveys biology, genetics, evolution, ecology, climate, neuroscience, immunology, reproductive technology, hormones, microbiology, geology and computation, at 979 and 520 occurrences, and names physics eight times across a quarter of a million words, once in order to say that Barad is the one engaging Bohr. **The claim stands, the route cannot be cited to her, and it cannot be routed through Barad either**, since Barad gets to Bohr by way of agential realism, which Braidotti names from outside rather than adopts.

One limit on this evidence, stated plainly: these are counts of string patterns in the texts held here, which are two books and two essays. They do not cover *Transpositions* (2006), *Metamorphoses* (2002), *The Posthuman* (2013) or *Posthuman Knowledge* (2019), none of which is held. **Before the novelty claim goes into a proposal it should be run against those four as well**, and that is a fetch list rather than a search.

---

## 6. Item 5. Page 51, to Trinh via Heisenberg

Hayles, p. 51, on the gamma-ray microscope:

> "By closely analyzing how a very small particle, for example an electron, is 'seen,' Heisenberg showed that **the quantum of light used to observe the electron is sufficient to change the particle's momentum**. Therefore, by the time the image is reflected back to the microscope lens, **the particle is no longer following the same path it was because observing it has also disturbed it.** If light of a lower frequency (and hence less energy) is used so as to disturb the particle less, the longer wavelength means that the reflected image will not be as sharply localized."

> "Heisenberg's analysis had a revolutionary impact because it made clear that the indeterminacy set forth by the Uncertainty Relation **is not just a result of limitations in the measuring instruments, but fundamental to the process of measurement itself. It implies that there is no way to measure a system without interacting with it, and no way to interact with it without disturbing it.**"

> And Heisenberg, quoted: "in any physical experiment, '**what we observe is not nature in itself but nature exposed to our method of questioning**.'" With the potentia: "something standing in the middle between the idea of an event and the actual event, a strange kind of physical reality just in the middle between possibility and reality."

**Trinh, from the held Chen interview (1992), p. 86:**

> "**Truth never yields itself in anything said or shown. One cannot just point a camera at it to catch it: the very effort to do so will kill it.** It is worth quoting here again Walter Benjamin for whom, 'nothing is poorer than a truth expressed as it was thought.' **Truth can only be approached indirectly if one does not want to lose it.**"

That is the gamma-ray microscope with a camera in it. Heisenberg's light disturbs the electron; Trinh's camera kills the truth. Both say the instrument alters what it is pointed at, and both conclude that the alteration is not a defect of the instrument but a condition of the act.

**Where they go apart, recorded and not settled.** Heisenberg's conclusion is a quantitative limit, the Uncertainty Relation, and a replacement ontology, the potentia. Trinh's conclusion is a practice, indirection and speaking nearby: "A speaking that reflects on itself and **can come very close to a subject without, however, seizing or claiming it**." Heisenberg measures what cannot be measured together; Trinh declines to seize. The held Trinh material is listed in `K:\OneDrive\UNM\Dissertation\todo October 26\TRINH_reference_form_and_clarity.md`, and the two-column scan warning applies to every quotation from the interview.

---

## 7. Item 6. Footnote 32 on page 49, Becoming rather than Being

The whole footnote, because its first half is the setup:

> "The partiality of our own perspective should not be confused with the absolute spacetime projected through the Minkowski diagrams. **David Bohm, in *The Special Theory of Relativity*, comments that when viewing Minkowski diagrams, 'almost unconsciously, one is led to adopt the point of view of an observer who is, as it were, standing outside of space and time . . . surveying the whole cosmos from beginning to end' (p. 173). But as Bohm points out, the feeling is an illusion. Any human observer is necessarily in space and time, and so always in fact occupies a point *within* the diagram.** Similarly, the timeless nature of the Minkowski diagrams (timeless in the sense that time is encompassed in the spacetime matrix) should not lead us to think that this reality already pre-exists. **Relativity theory, insofar as it says anything about the future, is fully consonant with seeing it as a Becoming rather than a Being.** Milic Capek discusses this point extensively (pp. 214-243)."

**Why the footnote and not the body.** The claim that the physics is consonant with becoming is made in small type, as a correction to a way of reading a diagram, and the body text never says it. Two sources for it are named and neither is held: **Bohm, *The Special Theory of Relativity*, p. 173**, and **Milic Capek, *The Philosophical Impact of Contemporary Physics* (Princeton: D. Van Nostrand, 1961), pp. 214-243**, which Hayles cites elsewhere at pp. 122 and 319.

**For 1.5.** Becoming is already load-bearing in the proposal: section 1.4 ends on "a continuous trajectory of becoming," and the Braidotti and Deleuze material is all on that side. This footnote is a 1984 statement that relativity does not require the opposite, written by a literary critic citing two physicists, and it is the kind of claim that usually has to be argued rather than cited.

---

## 8. Item 7. Top of page 46, to agential realism

> "When he was sixteen, Einstein tried to imagine how a light wave would look to someone traveling at the speed of light. He decided that to such an observer, the light beam would appear as a standing wave, oscillating back and forth without forward movement. This result puzzled Einstein not only because it was contradicted by Maxwell's equations, which implied that nonpropagating light was impossible, but more fundamentally because **it implied that phenomena can appear different from different vantage points**. Einstein decided that if he had to choose between the laws of physics being universal or phenomena appearing invariant, he would choose the laws of physics. In the Special Theory, Einstein begins by assuming that the laws of physics should not depend on whether one is at rest or in uniform motion. He also assumes that the velocity of light in a vacuum is constant, regardless of the motion of its source. **In order to preserve these invariances, Einstein reasoned that motion could only be defined relative to some arbitrarily chosen reference frame.** With this reasoning, Einstein arrived at the now-familiar predictions that **measurements of time, mass, and length are not absolute quantities but subject to change, depending on the reference frame from which they are made.** Paradoxically, **these quantities are made relative so that others may become absolute.**"

**The connection, with the held Barad.** From `BARAD_pages_pulled.md` and the comps draft: the apparatus is not a passive instrument but part of what it measures, "there are no pre-measurable properties of matter that precede their experimentation" (Bohr via Barad, 2007: 18-20), and determinacy is set by "the specificity of the experimental apparatus" and not by the experimenter's will. Einstein's frame is **arbitrarily chosen** and the measurement is relative **to that frame**, which is the structure of an agential cut: the choice is not forced by the world, the result is not a property the object had beforehand, and the cut is what makes a determinate value possible at all.

**And the guard, in Hayles's own footnote 26 on the same page**, which is why this is not subjectivism: "It should be emphasized that **the relativity of these quantities is not merely a perceptual ambiguity in the observer. The most sensitive instruments (for example, nuclear decay clocks) will record a time that is not absolute, but relative to the reference frame to which they are attached.**" That is the same guard Barad gives at pp. 18-20 and the same one the 1.5 row in the reading plan already records.

**One difference to keep rather than smooth over.** Einstein makes some quantities relative **in order that others become absolute**, and he spends the rest of his life resisting the more radical implications; Hayles says so at p. 48, that he "deeply believed in causality, in an objective world that exists independently of human perception, and in the universal truth of scientific law." Agential realism does not trade relativity for a preserved absolute. The structures match; the purposes do not.

---

## 9. Item 8. The role of imagination in theory, pages 45-46

Three pieces, in the order Hayles gives them.

**The criterion is aesthetic before it is empirical,** p. 45: "In his *Autobiographical Notes* Einstein says that he believes scientific theories should possess what he calls '**logical simplicity**'" (the rest of this sentence is item 9 below). And: "What Einstein found '**particularly ugly**' about Newtonian mechanics was that it gave special priority to stationary or nonaccelerating systems over all other kinds of rigid systems, **without it being obvious why this should be so**."

**Not common sense, and not experiment,** p. 45: "Relativity theory, by contrast, derives many results that are startlingly at odds with everyday experience. **Rather than beginning with 'common sense,' Einstein's thought was guided by a search for harmony among fundamental principles.** It is this, rather than its extraordinary predictions, that struck Cornelius Lanczos, a physicist of Einstein's generation, as the most revolutionary aspect of relativity theory." Lanczos, quoted: "To him science did not mean the primacy of the experiment or the primacy of the theory, but **the primacy of a deep reverence for the all-embracing lawfulness which manifests itself in the universe**."

**And the method is a thought experiment performed by a sixteen-year-old,** p. 46, the passage in item 7: Einstein "tried to imagine how a light wave would look to someone traveling at the speed of light." The Special Theory starts in an act of imagination about a vantage point nobody can occupy.

**Why this matters for 2.2 (mine, not hers).** The proposal's methods are imaginative and material, and the usual objection to them is that they are not rigorous. These three pages are a case, from inside physics, in which **the aesthetic criterion came first, the common-sense check was refused, and the generative act was imagining an impossible position.** Hayles also keeps the counterweight in view: Martin Gardner's flat dismissal, quoted at p. 44, that "in the ordinary sense of the word 'philosophical,' relativity has no consequences," which she calls an overstatement and then partly concedes.

---

## 10. Item 9. Page 45, arbitrary restrictions, read through premature optimization

**Hayles, p. 45**, the full sentence:

> "In his *Autobiographical Notes* Einstein says that he believes scientific theories should possess what he calls 'logical simplicity,' that is, **that their fundamental postulates should not be the result of arbitrary restrictions but should flow naturally from the initial conception.**"

And the example of a restriction and what it was for, same page: "Similarly, it had been hypothesized that it was possible to define absolute motion by regarding all motion as taking place within an 'ether' . . . **In retrospect it is evident that these restrictions were necessary to preserve congruity with everyday experience.**" So in Hayles's own account the arbitrary restriction was not an error of reasoning. It was there to keep the theory agreeing with what already seemed obvious.

**Her claim, recorded as hers and not developed, applied, or assessed:**

> "Read this thru premature optimization in computing and my belief that academic writing/research/text sets out arbitrary restrictions that do not allow us to explore the wholeness of the field. The restrictions recreate a world we dont claim to not believe in/dualism."

**The computing source, with the citation problem attached to it.** The sentence usually quoted is:

> "We should forget about small efficiencies, say about 97% of the time: **premature optimization is the root of all evil**."

The locator to check is **Donald E. Knuth, "Structured Programming with go to Statements," *ACM Computing Surveys* 6, no. 4 (December 1974): 261-301**, with the sentence on **p. 268**. **The attribution is contested and must not be stated flatly in either direction**: Knuth has elsewhere credited the remark to C. A. R. Hoare, and Hoare has said he believes it was Knuth's. Until the 1974 page is seen and the attribution question is logged in `CITATION_CHECK_InteractiveProcess.md`, this is a quotation to paraphrase or to attribute carefully. **Neither Knuth's paper nor Hoare is held**: Knuth 3 occurrences across 1,117 documents, "premature optimization" **0**, Hoare 7.

**What is held that bears on the same move.** Two things, both already read.

- **The positivist programme, Hayles pp. 37-40**, which is a restriction set in advance on what may count as meaningful, and which failed not because it was wrong about any particular statement but because "**the terms that comprise it already contain assumptions that cannot be validated independently of the language**" (p. 40). With Trinh on the same operation from the other side, in `HAYLES_CosmicWeb_ch2_ch4_ch5_ch6_closeread.md` section 6.
- **Bohr's method, pp. 54-55**, item 3 above, which is the procedural alternative: not observing without a viewpoint, but "**systematically examining and exploiting**" the limitations of the one chosen. Bohr's regress, where examining the unnoticed assumptions behind a concept yields "a classification of more extended domains of experience" which then rests on further unrecognized presuppositions, is a description of deferring the restriction rather than removing it.

**Where this goes.** It is an argument about method, so 2.2, and it bears on 2.0 (the literature review method) because the restriction being described is partly a restriction on what a literature review may contain.

---

## 11. Item 10. Page 40, Pirsig's grains of sand as arbitrary cuts

> "In *Zen and the Art of Motorcycle Maintenance* Robert Pirsig develops a similar argument by pointing out that **any analytical hierarchy is created by an observer wielding a knife, even though the passive constructions of Aristotelian rhetoric work to conceal both the knife and, behind it, the observer who determines where the cuts will be made.** In trying to find a rhetoric that will acknowledge that '**part of the landscape, inseparable from it . . . is a figure in the middle of it, sorting sands into piles**,' Pirsig involves himself in the same paradoxes that the positivists encountered, for he himself is also 'in the landscape,' sorting into 'piles' the different levels of narrative within his text."

Note where this sits: **p. 40 is the last paragraph of the positivism section**, so Hayles puts Pirsig's knife immediately after the purification of language as the same problem in a different idiom. The cut and the purification are the same operation in her layout.

**The fuller version of the passage is in her chapter 2, p. 71**, and it is the one with the selection in it: "The application of this knife, the division of the world into parts . . . **is something somebody does. From all this awareness we must select, and what we select and call consciousness is never the same as the awareness because the process of selection mutates it. We take a handful of sand from the endless landscape of awareness around us and call that handful of sand the world.**" And the italicised insistence: "it is necessary to see that part of the landscape, inseparable from it, which must be understood, is **a figure in the middle of it, sorting sand into piles**. To see the landscape without seeing this figure is not to see the landscape at all."

**Small thing to decide before quoting.** Hayles prints Pirsig's phrase as "sorting **sands** into piles" on p. 40 and "sorting **sand** into piles" on p. 71. One of the two is wrong, and the Pirsig page (Bantam, p. 70) settles it.

**For 1.5 and 2.5.** The proposal's 1.5 already says "**Each decision is a cut that together produces a locally determinate diffractive pattern**" and makes accountability for constitutive exclusions the point. Pirsig gives the same claim three ways: the cut is **done by somebody**, the passive voice is what hides both the cut and the cutter, and the selector has to stay visible inside the picture. The third is the one Barad's apparatus does not quite say, and it is also where Pirsig differs from Bateson, who dissolves the cutter into a circuit (`HAYLES_BORGES_fold_PYNCHON_Bateson.md` section B4). Three positions on the cutter, recorded and not reconciled: **concealed by grammar** (Pirsig's diagnosis), **visible in the landscape** (Pirsig's demand), **dissolved into the circuit** (Bateson).

---

## 12. To chase, from these eleven items

| # | What | Status |
|---|---|---|
| 1 | **Heisenberg, *Physics and Philosophy*** (Harper, 1958), Hayles's pp. 41, 56, 58 | not held; two fetch commands in section 1; **Epperson is held and quotes it with page numbers** |
| 2 | **Whorf, *Collected Papers on Metalinguistics*** (1952), pp. 3-8, 27-52, or *Language, Thought and Reality* (1956) | not held; Whorf 14 and Sapir 150 across 1,117 documents, neither author's own writing among them |
| 3 | **Knuth, "Structured Programming with go to Statements,"** *ACM Computing Surveys* 6.4 (1974): 261-301, p. 268 | not held; **the Knuth or Hoare attribution must be settled and logged before the sentence is quoted** |
| 4 | **Bohm, *The Special Theory of Relativity*, p. 173**, and **Capek, *The Philosophical Impact of Contemporary Physics* (1961), pp. 214-243** | not held; both are the sources for the Becoming footnote |
| 5 | **Pirsig, Bantam edition, p. 70**, to settle "sands" against "sand" | not held |
| 6 | **Epperson, *Quantum Mechanics and the Philosophy of Alfred North Whitehead*** | **HELD in full** in `todo`, plus seven page-extracts in `Comps\Used texts`; unread, and it is the Whitehead-plus-potentia route |

---

SOURCE: Hayles, N. Katherine. *The Cosmic Web: Scientific Field Models and Literary Strategies in the Twentieth Century*. Ithaca: Cornell University Press, 1984, read from K:\OneDrive\UNM\Dissertation\todo October 26\Hayles_N_Katherine_The_Cosmic_Web_Scientific_Field_Models_and_Literary_Strategies_in_the_Twentieth_Century_1984.pdf, text extracted with PyMuPDF 29 Oct 2026; chapter 1 pp. 31-59 and the Introduction read in full, page numbers are the printed page numbers, which match the PDF page numbers exactly. Proposal section numbers and row numbers are from K:\OneDrive\UNM\Dissertation\todo October 26\Dissertation_Proposal_RoughDraft_blocks.csv, 632 rows, read 29 Oct. Epperson quotations and the Heisenberg page numbers are from the held copy of Quantum Mechanics and the Philosophy of Alfred North Whitehead in the todo corpus (91,359 words). Braidotti quotations are from BRAIDOTTI_WritingAsANomadicSubject_deepread.md; Trinh quotations from the held Chen interview in K:\OneDrive\UNM\Comps\Used texts; Barad page references from BARAD_pages_pulled.md. Corpus counts are over the three extracted corpora used throughout these notes, base 1,117 documents: Heisenberg 987, "Physics and Philosophy" 54, Sapir 150, Whorf 14, "linguistic relativity" 2, Knuth 3, "premature optimization" 0, Hoare 7, potentia 1,388. Amy's request of 29 Oct 2026 is quoted verbatim at the head and her claim is quoted verbatim in section 10.

NOTES: the Hayles PDF's text layer is a 2013 Acrobat ClearScan reconstruction rather than native text, so **every quotation in this file must be checked against the page image before it goes into the proposal**; known slips in the passages quoted here include "Wharf" for Whorf (p. 16 and n. 1), "Lancws" for Lanczos (pp. 48-49) and "Capek" printed without its diacritic. Ligatures and the en and em dash characters were normalised during extraction, so dashes here are plain hyphens. The Knuth sentence in section 10 is given as a locator to check, not as a verified quotation, and its attribution is contested; nothing in this file should be cited from it until the 1974 page is seen. Nothing here has been written into Dissertation_Proposal_RoughDraft_blocks.csv or into any other draft. The "where it goes" column, the three "mine, not hers" observations, the three positions on the cutter at the end of section 11, and the chase table are mine, offered as suggestions on her material rather than as tags or codes on it; her own wording in the request and in section 10 is reproduced and not elaborated, applied or assessed. Where two sources read the same object differently (Heisenberg's limit against Trinh's refusal in section 6, Einstein's preserved absolute against agential realism in section 8, the three positions on the cutter in section 11) the difference is recorded and left standing.
