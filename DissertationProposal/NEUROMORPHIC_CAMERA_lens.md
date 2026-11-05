# Neuromorphic cameras and their algorithms

28 Oct 2026. Added to the body / computation / philosophy thread. A first pass, built from abstracts and open-access full texts, not from held PDFs. Nothing here is citable until it is logged against a full text.

## What the instrument is

A neuromorphic or event camera has no frames and no shutter. Each pixel works on its own and reports only a change in log brightness, as a timestamped event: x, y, time, and the sign of the change. There is no exposure, no frame rate, and no picture.

The consequence that matters here: **a body at rest produces nothing.** The sensor is silent about stillness. One pose-estimation paper states the limitation plainly, that networks trained on event data perform significantly worse because there is no event data recorded on still body parts ([arXiv 2309.09515](https://arxiv.org/pdf/2309.09515)). The body appears only where it moves, and only for as long as it is moving.

So this is a camera that cannot represent a body. It can only record the difference a body makes.

## Hardware lineage

The apparatus has a traceable genealogy, which is useful for 1.5 if the argument is that an apparatus produces its object.

| Item | What it is |
|---|---|
| **Mead, C. (1989), *Analog VLSI and Neural Systems*** | Cited across the reviews as the origin of the term and the programme, "neuromorphic" |
| **Mahowald, M. & Mead, C. (1991), "The Silicon Retina," *Scientific American* 264(5)** | The first silicon retina. Analog circuits modelling the functional behaviour of four retinal layers, with adaptive photoreceptors, a spatial smoothing network and self-timed communication. Described in the reviews as a demonstration of concept device |
| **Mahowald, PhD, Caltech, completed 1992** | The first neuromorphic chip to spike events from detected light-intensity change. The address-event representation (AER) comes from here |
| **Lichtsteiner, P., Posch, C. & Delbruck, T. (2008), "A 128x128 120 dB 15 us Latency Asynchronous Temporal Contrast Vision Sensor," *IEEE Journal of Solid-State Circuits* 43(2), 566-576** | **The DVS.** The first complete dynamic vision sensor: 128x128 pixels, AER, responds to relative light-intensity change and not to colour. A 2005 workshop paper (64x64) and a 2006 ISSCC version precede it |
| **Gallego, G. et al. (2022), "Event-based Vision: A Survey," *IEEE TPAMI* 44(1), 154-180** | The standard survey. Open preprint at [arXiv 1904.08405](https://arxiv.org/pdf/1904.08405v3.pdf). Covers the sensors, the processing techniques including learning-based ones, and spiking neural networks as the matched processor |
| **"Hardware, Algorithms, and Applications of the Neuromorphic Vision Sensor: a Review" (2025)** | Recent and open, [arXiv 2504.08588](https://arxiv.org/html/2504.08588v1). Where the lineage figures above came from |

Reported conflicts to resolve before citing: the latency figure in the 2008 title varies between secondary sources, and the Delbruck and Mead adaptive-photoreceptor paper is given as both 1994 and 1995.

## The algorithms, which are where the body comes back

Events on their own are not legible as a body. Three algorithmic layers sit on top, and each one is a second cut.

1. **Event-to-video reconstruction.** Networks that turn an event stream back into something that looks like film. This is the step that undoes the medium's apparent anonymity. The 2025 human-centred survey notes that reconstruction techniques can recover intensity-map images from event streams and expose personal identity information, which has prompted a counter-literature of event anonymisation ([arXiv 2502.18490](https://arxiv.org/pdf/2502.18490), citing Du et al. 2024, and "Event anonymization: privacy-preserving person re-identification and pose estimation in event-based vision," *IEEE Access* 2024, which I have only as a citation).
2. **Pose estimation.** Fits a skeleton to the events. Fails on the parts that are not moving, as above.
3. **Spiking neural networks.** The processor whose own architecture matches the sensor's: both run on asynchronous events rather than clocked frames.

The point worth holding: the privacy claim made for these cameras is a property of the **algorithm that has not yet been run**, not of the sensor. The sensor records enough. The question is which network is pointed at it. That is an apparatus argument with a live technical literature behind it, which is rare.

## Art practice with event cameras

Two precedents found. The field is close to empty.

| | |
|---|---|
| **TONUS (2025), "Neuromorphic human pose estimation for artistic sound co-creation"** | An installation. An event camera tracks visitors' movement and the tracked activity drives sound and light feedback. Its own description of the medium is the useful phrase: the camera transmits the signatures of movements rather than entire images. [arXiv 2507.15734](https://arxiv.org/pdf/2507.15734) |
| **Synaesthetic Strokes (2023), Collegium Helveticum; published as "A neuromorphic electronic artist for robotic painting," *Scientific Reports* (2025)** | A DVS camera plus a neuromorphic processor watches a human artist's brushstroke and makes a new stroke that is explicitly not a high-fidelity copy. An artist (credited as L.G.) designed the exhibition and wrote the artistic section of the paper. [PMC12137699](https://pmc.ncbi.nlm.nih.gov/articles/PMC12137699/) |

Neither is autistic first-person work, and neither hands the camera to the person being recorded. The absence has the same shape as the stim finding in `READING_PLAN_2026-10-27.md`: the gap is the contribution.

## Theory to read alongside

| | |
|---|---|
| **Parikka, J. (2023), *Operational Images: From the Visual to the Invisual*, University of Minnesota Press** | Images valued for their action and function rather than their representational value, and a culture he calls **invisual**. Extends Farocki past the military case into machine learning, autonomous driving and video practice. Open reading copy of the notes at [Manifold](https://manifold.umn.edu/read/operational-images/section/af994762-57e6-48ad-a453-c75cc307847d); publisher page [here](https://www.upress.umn.edu/9781517912116/operational-images/) |
| **Farocki, H., *Eye/Machine* I-III (2001-2003)** | Where "operative images" comes from. The reviews describe it as marking a shift from human perception of bodies and movement toward measurement, pattern, analysis and navigation |
| **Zylinska, J. (2017), *Nonhuman Photography*, MIT Press** | In Parikka's reference list. **Not read, not summarised here**, flagged only so it is on the list |

## A suggested connection, not a claim

Offered as a suggestion for acceptance or rejection, not written into anything:

Both instruments looked at today record differences rather than states. A stretch mark exists only where tissue was outrun by force, and an event exists only where a pixel was outrun by change. Neither records the body; both record the rate at which the body stopped keeping up. Steady state is invisible to both. See `PERMEABLE_BODIES_research_notes.md`, written the same day.

Also worth testing against Manning: the microsecond temporal resolution registers movement before it resolves into a recognisable gesture, which is the territory of preacceleration in *Relationscapes*; and the camera that activates rather than reproduces movement is close to what she says of Deligny's tracings in *Always More Than One* ch. 8.

## Hardware reality

Not a cheap instrument.

- **iniVation DAVIS346 mono.** A shop listing gives €4,400 at commercial rate with lens, tripod and case; an older post gives about €4,900 with roughly €500 off for academics. The figures conflict and the page may be stale. [shop.inivation.com](https://shop.inivation.com/products/davis346), [inivation.com/buy](https://inivation.com/buy/)
- **Prophesee EVK4 HD** (Sony IMX636 sensor, C-mount lens, tripod, Metavision SDK licence, two hours of onboarding). No published price; sold on quote. [prophesee.ai](https://www.prophesee.ai/event-camera-evk4/)
- I found nothing on a low-cost or hobbyist event sensor. That search is unfinished.

## Open and unfinished

- No price confirmed for the EVK4, and the DAVIS346 figures disagree.
- The *IEEE Access* 2024 event-anonymisation paper is held only as a citation in someone else's reference list.
- Whether the Gallego survey covers event-to-video reconstruction specifically is unconfirmed; the abstract-level text supports only general reconstruction coverage.
- Ars Electronica, ISEA and the ICCV 2025 NeVi workshop were named as places to look for more art practice and were not searched.
- Zylinska unread. Crary, *Techniques of the Observer*, was not searched and is a guess, so it stays off the list until checked.

---

SOURCE_FILE: K:\OneDrive\UNM\Dissertation\todo October 26\NEUROMORPHIC_CAMERA_lens.md
SOURCE: web searches run 2026-10-28 for the neuromorphic/event-camera hardware lineage, the processing literature, art-practice precedents, operational-image theory, and current hardware pricing. Bibliographic details come from publisher pages, arXiv preprints, PMC records and vendor shop pages listed inline; no full text of any item named here is held in this folder.
NOTES: Every figure, date and page range quoted above came from a secondary source or an abstract and is unverified against the item itself. Conflicts are flagged in place rather than resolved. Per the citation-discipline rule nothing here enters the draft until it is logged in a CITATION_CHECK file. The "suggested connection" section is my suggestion and is not a tag, code or theme on any of Amy's material.
