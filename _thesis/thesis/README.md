# The dissertation pages

A reading layout for a dissertation whose figures are the works themselves:
sketches from `src/sketches/` running inside the prose, pages already published
(the Bouquet, the comps graph) embedded as they are, and a print path so the
same document can be handed to a committee on paper.

Nothing new was added to the stack. Three.js and lil-gui at the versions already
installed, plain ES modules, static HTML, no bundler and no framework — the same
arrangement `tools/export_site.mjs` uses for the sketch pages.

## The loop

```
npm run dev
```

```
node thesis/build.mjs
```

Then read it at <https://localhost:5173/thesis/preview/>. Edit a chapter, run the
build again, reload. (`npm run thesis` does the build; `npm run thesis:site`
does the published one.)

## What is where

| | |
|---|---|
| `thesis.json` | the document: title, author, and the chapters in order |
| `chapters/*.md` | the writing. One file per chapter |
| `posters/*.jpg` | a still per figure, for print and for a browser with no WebGL |
| `lib/thesis.css` | the scrolling layout: the grid, the palette, the sheets, print |
| `lib/world.js` | the room behind the pages and the figure in it |
| `lib/windows.js` | cutting the windows out of the sheets |
| `lib/navigator.js` | the dividing-cell figure: places, nodes and between-areas |
| `lib/book.css` | book mode: the spread, the spine, the columns, the plates |
| `lib/book.js` | the paginator and the page turning |
| `lib/embed.js` | the third harness — one sketch inside one element on a page |
| `lib/figures.js` | which figures run, when they stop, and how many at once |
| `lib/reader.js` | contents, where-you-are, progress, sidenotes, light and dark |
| `build.mjs` | markdown in, static HTML out |
| `preview/` | the dev build. Not committed, not copied anywhere |

`chapters/99-specimen.md` is a page showing every feature with the markdown that
made it. Keep it in the document while writing; take it out of `thesis.json`
before anyone else reads the thing.

## The room behind the pages

The document is dark on purpose and there is no light theme. The pages are
sheets of near-black laid over a room that runs the whole time the document is
open, with **windows** cut through them. The figure in the room is the floating
skin: she goes off and does what she does, and now and then comes and stands in
one of the windows, facing out, and watches the reader read.

| | |
|---|---|
| `lib/world.js` | the room: one canvas fixed under everything, her, and what she does |
| `lib/windows.js` | cutting the holes, and telling the room where its windows are |
| `--page-alpha` | how solid a page is over the room. The **page** slider in the top bar, 0.25 to 1, remembered per reader. The sheets cover the pages and nothing else: in the margin around them the room is at full strength |

**Placing her in a window** is the whole trick, and it is one function. A window
is a rectangle on the screen; there is exactly one point in front of the camera
that projects to its centre at the depth where the part of her being framed
fills it. `anchorFor()` computes that point, every frame while she watches, so
she stays in the window as the camera drifts, the page turns, or the reader
scrolls.

**How much of her** is the `framing` in `thesis.json`, and three buttons in the
panel. A 60 mm opening with a whole standing figure in it is a small figure a
long way off with no face in it, so the default is the portrait the twin-lens
frame is for:

| | |
|---|---|
| `head` | crown to upper chest — the default |
| `bust` | waist up |
| `figure` | all of her, as it was before there was a choice |

Both numbers of a crop are fractions of her measured height, so a head shot of
a 0.7 m bust and of a 1.7 m figure come out the same. A head shot stands her
about 2 m from the camera rather than 11, which is well inside the fog and
means she is crisp in the opening — and large behind the page, where she may
reach past the edge of the sheet into the margin, which is not veiled.

**She does not leave the room.** Away, her wander points are chosen on the
screen and back-projected, so she is always somewhere in frame behind the
sheet: a faint shape through the writing, 6 to 12 m back where the mist has
her. A window is where she stops being faint.

She has two states. **Away**: a capoeira clip at full speed, moving between
points in the room, mostly out of the windows. **Watching**: framed by a
window, facing the reader, doing the ginga at half speed — the step a
capoeirista keeps up between moves, which is the right thing to be doing while
waiting on someone.

**She stays.** She takes a window and holds it for as long as the page has one,
and is away only while she crosses to another, or while the page she is on has
none — turned to a plate, say. Away she is still in frame, a faint shape through
the sheet. `"stay": false` in the `world` block gives her back the old coming
and going: 14–26 seconds at a window, 10–20 away.

**She keeps to the windows cut for her.** Every opening is a hole in the sheet,
but only the ones written as `:::window` are offered to her. A figure's opening
belongs to its figure — her turning up inside a sketch, a still or a video reads
as a fault rather than as a visit. A spread with no `:::window` on it has
nowhere for her to stand, and she waits behind the page.

The room renders at half a screen's worth of frames (30fps) and at a pixel
ratio of 1.5: it is behind text, and the reading is the thing. It stops when
the tab is in the background. With `prefers-reduced-motion` she holds one
window and does not travel. With no WebGL there is no room, the pages sit on
flat dark grey, and the windows are empty openings onto it.

`window.__world` in DevTools: `__world.visit()` sends her to the first open
window now rather than waiting, which is how to check she frames well in an
opening you have just written. `__world.setFraming('bust')` changes the crop,
`__world.hold('watch')` keeps her at a window while you look.

### Which figure she is, and how the real one arrives

`lib/world.js` does not know what she is. It asks for a **body** and gets back
one object, which is the whole contract between the thesis and whatever is
making her:

```js
{
  object,              // THREE.Object3D: metres, Y up, feet near y = 0, facing +Z
  height,              // optional, metres. Measured off the object when absent
  update(dt, info),    // optional, once a frame
  rest(),              // optional: the gentle thing she does while being watched
  go(),                // optional: the thing she does when she is away
  dispose(),           // optional
}
```

`update` is given the seconds since the last frame and how big she is on the
screen at this moment, so a body that can trade detail for speed has a number
to trade against instead of a guess:

```js
{
  pixels,          // her height on screen now, in CSS pixels
  devicePixels,    // the same in real pixels — what fill rate actually costs
  framed,          // the height of the crop the window shows, in CSS pixels
  state,           // 'watching' | 'coming' | 'going' | 'away'
  inWindow,        // is the framed part of her inside a window, or behind the page
}
```

Measured in the specimen chapter at 1440×900: seen through a 60 mm window she
is **180 CSS pixels tall, 225 device pixels**, `inWindow: true`; wandering, 149
and `inWindow: false`. Her whole silhouette is on the order of twenty thousand
device pixels. A point cloud of a hundred thousand points therefore has several
points to every pixel it can possibly fill, and only the body knows which ones
to drop. `__world.info` in DevTools reads the same numbers live.

`object` can be anything Three can put in a scene — a skinned mesh, a cloud of
points, a shader. The world only moves it, turns it to face the reader, and
asks how tall it is.

Two ways to give it one, both named in `thesis.json` under `world`:

```json
"world": {
  "framing": "head",
  "figure": "pregnant.fbx",
  "clips": ["ginga.fbx", "esquiva.fbx", "armada.fbx", "meia-lua-de-compasso.fbx", "martelo.fbx"],
  "waiting": "ginga",
  "colour": "#2b2b2b"
}
```

a **model file and its clips**, which `loadFigure()` loads and wraps into the
body above — this is the stand-in running now, and it is the pattern to copy; or

```json
"world": { "module": "floating-skin/skin.js" }
```

an **ES module** exporting `createBody({ THREE, assets, models, quiet })` that
returns the body. **`assets` is the module's own directory**, not the models
folder — a body module ships beside its payload, and that is the base it needs
to resolve it against (`new URL('my-data.bin', assets)`). The project's models
folder is passed separately as `models`. Both are absolute URLs.

Two things make a module in `public/` work in both places. The dev server
refuses to import JavaScript from `public/` — Vite copies those files as-is and
says they "should not be imported from source code" — so the
`thesis-preview-assets` plugin in `vite.config.js` serves them raw, exactly as
Pages will. And `tools/export_site.mjs` copies every folder under `public/` to
`site/assets/`, which is why the path has to be written relative.

Write that path **relative to `public/`**. Everything in `public/` is served at
the root by the dev server but copied to `site/assets/<folder>` on export, so
the module lives at `/floating-skin/skin.js` here and
`/assets/floating-skin/skin.js` on the site; the build resolves it per mode.
An absolute path or a full URL is left alone.

`rotate` (degrees) and `offset` (metres) correct a body not authored Y-up with
its feet at its origin, so nobody edits code over an axis convention; `scale`
forces a scale if the metres-or-centimetres guess would go wrong. None of the
three is needed for a body that already follows the convention.

Facing **+Z** is the load-bearing part: `Object3D.lookAt` aims a non-camera
object's +Z at its target, which is how she turns to face the reader.

The placement is scale-invariant, so the body does not have to be a whole
figure. She is put at whatever depth makes her cover `FILL` of the window's
height — a 0.70 m bust stands 4.5 m from the camera where a 1.68 m figure
stands 10.9 m, and both frame identically. An upper-body bust in a 60 mm
square is the twin-lens portrait the windows are for. Note that the fog starts
at 9 m, so a figure placed far enough back to fit a small window is slightly
hazed; a bust is not.

The module is the way in for the real floating skin, because it is not a model
file. `tools/export_points_web.py` in
`K:\ResearchRepository\FloatingSkinProjectDScanning` writes a points
payload — `position`, `color`, `normal`, `alpha`, `size` per point, plus
`tether_j` and `tether_w` tying each point to K joints — driven by SMPL-X pose
clips (`{name, fps, T, poses, trans}`) and drawn as `THREE.Points` with its own
shader. That skinning lives in that project and should stay there. What the
thesis needs from it is one file:

- an ES module exporting `createBody(...)` that builds the points, loads its
  own payload (relative to its own URL, or from `assets`), and returns
  `{ object, height, update, rest, go }`
- `rest()` set to whatever she does while standing still and being looked at,
  `go()` to whatever she does when she is not
- the payload and the module dropped anywhere under `public/`, and the path put
  in `thesis.json`

The module is called **once per document**, not once per window. There is one
room behind all the pages and she walks between the windows; she is not
instanced into each. So it should not assume it owns a canvas, a camera,
lights or a render loop — all of those are here — and its motion should be
driven by the `dt` handed to `update()` rather than by its own
`requestAnimationFrame`, or it will run at a different rate from the rest and
keep running when the tab is hidden.

**It has landed.** `public/floating-skin/` holds `skin.js` and a 2.8 MB
`skin-data.bin`; `thesis.json` points at it. She is the pregnant photogrammetry
scan skinned through SMPL-X and drawn as a point cloud whose colour and
displacement come from the embryo bubbles image, 1.662 m measured off the
skinned bbox. Her level of detail follows `info.devicePixels`: measured at
22,714 points while watching from a 60 mm window, and 2,500 when she is away
and out of frame. `rest()` is the held bust with the figure-8 gaze; `go()` is
procedural for now, not mocap.

The rigged scan at `public/models/pregnant.fbx` with the capoeira clips remains
the fallback — set `figure` instead of `module` in `thesis.json` to go back to
it. It is the same body, through `src/sketches/mixamo.js`, `puppet` and `ik`.

### Notes on the stand-in

She is 1.7 m or so, measured rather than assumed, and that measurement is what
decides the depth she stands at to fill a window. A body with no clips at all
is fine: she stands, and she travels.

### Windows

```
:::window width=wide aspect="21 / 9"
An optional caption.
:::
```

**The aperture is 60 by 60 mm, square** — a twin-lens reflex frame, written in
real units so it is that size on paper and near enough on screen, with the
finder's corner marks. `size=` changes it; `aspect=` or `height=` abandon the
square for the one that has to be a place rather than a window.

**A window is set into the writing, not laid across it.** In book mode it is a
float in its column and the text runs beside it; `side=left` puts it on the
other edge. In the scrolling layout it goes out into the sidenote gutter, which
is 15rem to its 60 mm, and the measure runs past it — a float cannot be used
there, because the scrolling page is a grid and a grid item ignores `float`.
Either way it never interrupts the column.

Give it a width — `wide`, `full`, `spread` — and it stops being an opening and
becomes a place: a block in the flow, taking that width and whatever `aspect=`
says, spanning the columns in book mode the way a figure does. **A figure is an opening too**: while its sketch is not running there is
nothing in it but the room, which is why no still sits in it on screen. She
does not stand in those, though — they belong to their figures. Press **start** and the piece takes the opening over; scroll far enough
away that the figure gives its context up and the room comes back.

The hole is cut with `clip-path: path(evenodd, …)` on the sheet — the sheet's
own rectangle followed by a rounded rectangle per window, so the inner
subpaths are holes. The sheet is a sibling behind the text, so only the black
is cut and nothing of the writing is clipped. The sheet lives in a plain
`.sheetbox` wrapper rather than inside `.page`, because an absolutely
positioned child of a grid is sized to its grid area and would come out one
column wide and no pixels tall.

## Navigation as a dividing cell

Every place in the document is a circle. They sit on a triangular lattice whose
spacing is the circle radius, so each circle passes through the centres of its
neighbours — the construction of the Seed of Life, then the Flower, then
whatever comes after. Places fill the lattice outward from the middle, so the
figure grows the way an embryo divides:

| places | figure |
|---|---|
| 1 | one cell |
| 2 | the vesica: two circles through each other's centres |
| 7 | the Seed of Life, the first complete ring |
| 19 | the Flower of Life, the second |
| more | another ring, and another |

A **place** is a section — one `##` heading — and the contents page is the first
cell at the centre. `lib/navigator.js` draws it; the build writes the list of
places into the page's config block.

The reader keeps their place by two marks, both filled in by reading:

- the **symbol node**, the disc at a circle's centre: one place, read
- the **between-area**, the lens where two neighbouring circles overlap, filled
  once both of its places have been read — the membrane two cells share

Circles for places not yet reached are drawn faintly, so the whole shape is
there to navigate into rather than hidden until it is earned. A node is a link.
The figure is in the contents rail on every page and at full size on the
contents page. What has been read is kept per reader in `localStorage`;
`__nav.forget()` in DevTools clears the marks.

## Turning a page without leaving the page

The room is a WebGL context that takes a second to start and holds a figure in
the middle of doing something. Following a link the ordinary way would throw
her away and begin again, so a link to another chapter is intercepted, the
chapter is fetched, and only `.sheetbox` — the text — is replaced. The room,
the windows, the navigator and the contents all belong to the document and are
set up once; the book, the figures, the section list and the sidenotes belong
to a chapter and are torn down and built again on every swap. Back and forward
work. If any of it fails the link is followed normally and you lose nothing but
the continuity.

## Two ways of reading a chapter

**Book** is the default where there is room for it: a two-page spread, two
columns on each page, turned a spread at a time. **Scrolling** is the single
column with sidenotes in the margin. The button in the top bar switches, and
the choice is remembered; a window too small for a spread falls back to
scrolling by itself and goes back when there is room again.

The text is the text — nothing is written twice. `lib/book.js` moves the blocks
the build produced out of the scrolling column and pours them into pages, and
moves them back if the book is turned off.

The division of labour is the part worth knowing. The browser typesets better
than any script, so each page is simply a two-column box of a fixed height and
the browser breaks the paragraphs across its two columns itself, justifying and
hyphenating. The script only decides which blocks land on which page: it pours
one block at a time and asks after each whether the page still fits.

- a page overflows → the block goes back, a new page starts, the block goes there
- a heading left alone at the foot of a page goes forward with it
- a `width=wide` figure spans both columns of its page. It does not have text
  flowing round it: a spanning figure cuts the page into bands, the text above
  it reading across the two columns and then the text below doing the same. It
  also ends the page early — a spanning block cannot be poured into the second
  column, so whatever will not fit above it leaves that column empty. Both are
  reasons to prefer `column` or a `:::window`, which float
- a `width=full` figure takes a page of its own, usually the one facing the text that introduces it
- a `width=spread` figure is a **plate**: the whole two-page spread, nothing else on it
- a block taller than a whole page has its foot cut off, and the console says which

Turning: the chevrons either side, `←` `→`, PageUp/PageDown, space, Home/End,
or a swipe. The keys are left alone whenever the pointer is over a figure,
because a sketch in walk mode uses the arrows itself. A section in the contents,
a link to a figure and a footnote marker all turn to the page they are on
instead of scrolling.

In book mode the contents become a drawer rather than a fixed rail: four
columns across a window is a narrow enough measure without giving 15rem of it
away. The measure lands near 45 characters at 1440px.

Print does not use any of this: the stylesheet flattens the pages back into one
flow. A page's blocks are in reading order inside it and the pages are in order,
so the flattened document reads correctly either way.

## Writing in the sheet

The writing is in a Google Sheet and `thesis/sheet.mjs` turns it into the
markdown below. Five columns are needed and three more are read if they are
there, under any capitalisation:

| Column | |
|---|---|
| `Chapter` | its number. Chapters are ordered by it, so moving one is a change to a column rather than to four hundred rows |
| `Chapter Title` | written once, on the chapter's first row |
| `Section Heading` | `##`, written once |
| `Section Subheading` | `###`, written once |
| `Section text` | one paragraph of markdown. Alt+Enter inside the cell starts another |
| `Page` | a new page starts wherever this number changes |
| `Figure` | this row is that figure; the `Section text` beside it is its caption |
| `Notes` | `inline` joins this row to the paragraph above; `quote` makes it an inset quotation. Anything else written here is a note to yourself |

Row order is the order of the writing. A blank `Chapter Title`, `Section
Heading` or `Section Subheading` means "the same as the row above".

### Page

Type a number in `Page` and keep typing it until you want the page to turn.
Where it changes, a page begins; where it repeats, the rows stay together.

It is a break and not an address, because there is nothing stable for an
address to point at: how many pages a chapter has depends on the window, the
type size, and whether the reader has the book on at all. So the number says
*start here*, and a page that fills up still turns on its own before the next
one is asked for. A break asked for on a row that also starts a section is
moved above that section's heading, so the heading leads its page instead of
being stranded at the foot of the one before.

In print it is a new sheet of paper. In the scrolling column it does nothing —
there are no pages there to break.

### Figure

Put a sketch's name in `Figure` and the caption in `Section text`:

| Figure | Section text |
|---|---|
| `embryos` | What the cells are doing. |
| `embryos width=full` | A page to itself. |
| `image=plan.jpg` | A photograph instead. |

A cell whose first word already has an `=` is figure attributes written out, so
anything in the table under **Figures** below can be written there. A name on
its own is one of **The Processing sketches**.

### Notes

The parser reads two words from this column and ignores the rest, so it stays a
column to think in.

**`inline`** joins the row to the paragraph above instead of starting a new
one, which is what the sorted blocks mostly need: they were cut as fragments,
and two rows next to each other are often two halves of one paragraph.

**`quote`** makes the row an inset quotation. The quotation goes in `Section
text`, and anything written after the word is the attribution — all on one
line, so there is nothing to remember:

| Section text | Notes |
|---|---|
| The apparatus does not merely detect, it enacts the cut. | `quote Barad, 2007, p. 141` |
| An unattributed one. | `quote` |

In the book it stands in a box at the top of the right-hand page. One page
offers a box; a second quotation falling on the same spread sets in the column
where it was written instead, and so does every quotation when the book is off,
or in v1, or on paper — there are no pages there for a box to be on.

A page that has nothing in its box has no box. Both pages used to show a dashed
placeholder, a draft instrument from when there was nothing to put in them; the
box is drawn now only when something is standing in it, and takes up no room
when it is empty. Filling one is done before any text is poured onto that page,
which is what keeps the measuring honest: a box that appeared afterwards would
push the foot of the text off the bottom.

## Writing a chapter

Front matter, then markdown:

```
---
title: Maximalist Methods
abstract: One sentence for the contents page and the chapter head.
---
```

Headings `##` and `###` get ids and appear in the contents rail. `## Heading {#chosen-id}`
sets the id by hand, which is what to do once a section has been cited somewhere
and its wording changes. Footnotes `[^a]` become sidenotes in the margin, fold
under the paragraph on a narrow screen, and print as numbered notes. There are
`:::aside`, `:::method`, `:::caution` and `:::epigraph` blocks, tables, and
fenced code (` ```js:src/lib/thing.js ` puts a filename above the block).

### Figures

```
:::figure sketch=bouquet width=full height=70vh autoplay=false weight="reads the search records"
The caption, which takes inline markdown.
:::
```

| Attribute | |
|---|---|
| `sketch=` | a file in `src/sketches/` — run inline, sharing the page |
| `embed=` | a finished page of its own, in an iframe |
| `processing=` | one of the Processing sketches by name -- see below |
| (`:::window`) | an opening with nothing in it — see **Windows** above |
| `video=` / `image=` | a video file, or a still |
| `site-embed=` | use this page instead of the module once published (see below) |
| `dev-embed=` | the reverse: this page on the dev server, the module on the site |
| `width=` | `column`, `wide` (default), `full` or `spread` |
| `height=` / `aspect=` | `70vh`, `480px` … or `16 / 9` |
| `autoplay=false` | wait for a click; use it for anything with a large download |
| `weight=` | what the wait is for, shown on the start plate |
| `title=`, `label=`, `id=`, `poster=`, `params=` | the rest |

`params=` is JSON, handed to the sketch as `ctx.params`; nothing reads it yet.

## The Processing sketches

Sixteen of Amy's Processing sketches, ported to p5.js, live in
`thesis/processing/`. Each is a folder with its own `index.html`, so each is a
small page that runs on its own, and a figure holds it in a frame.

A figure asks for one by name:

```
:::figure processing=embryos
The caption.
:::
```

The name, the title and the shape come from `thesis/processing/sketches.json`.
Nothing else knows the list: add a folder, add a line, and it can be asked for.
Written attributes still win, so `width=full` or a `title=` of your own
overrides what the registry says.

Written in the sheet, that is three lines in one Section text cell --
Alt+Enter between them. The line of three colons matters: without it the build
warns and treats everything after it as the chapter rather than the caption.

The build copies the folders to
`MaximalistAssemblage/ArtifactAssemblage/processing/` and lists them in the
manifest, so they are published and pruned like everything else it writes.
They are not uploaded by hand.

### A pause on every one

Each folder carries `motion.js`, loaded before the sketch. It wraps the p5
constructor to get hold of the instance and gives the page a **Pause / Play**
button, which stops the drawing, any video used as a texture, and the audio
context. A sketch that does not animate gets no button -- the four L-systems
draw once and stop.

WCAG 2.2.2 is the reason: content that moves by itself for more than five
seconds beside other content has to be stoppable, and a sketch in a window
beside a page of prose is exactly that. The figure's own start plate covers the
reader who has asked for reduced motion; the button covers the one who has not
but wants it still now.

### Still open

- **traylorcinema** does not run. It wants 465 frames in
  `assets/images/housePlay0.png ...`, which are rendered output from the
  PlayHouse sketch and were not in the zip. `ready: false` in the registry, so
  the build says so rather than publishing a blank frame.
- **Flashing is not measured.** `blackholestars`, both black-hole shaders and
  `entanglement` flicker. WCAG 2.3.1 allows no more than three flashes a second
  over a large enough area; nobody has sat through one with a meter.
- **The keyboard controls are undocumented on the page.** The arrow keys in the
  shaders, `space` in `switchscenes`: they only reach a sketch once the frame
  has focus, and the page does not say they exist. `weight=` shows a line on the
  start plate and could carry them.

## How a sketch runs inside a page

`lib/embed.js` is a third harness beside `src/main.js` (the dev picker) and
`src/site-harness.js` (the published sketch pages). The contract is identical —
a sketch exports `setup` / `draw` / `afterRender?` / `onSelect?` / `onEnterXR?` /
`onExitXR?` and receives the same `ctx` — so **every sketch in `src/sketches/`
runs here with no changes**. What differs is that nothing is measured against
the window: the renderer is sized to the figure, a pointer ray is cast from the
canvas's own rectangle, `ctx.hint` writes into the figure's bar, `ctx.gui` is a
lil-gui mounted inside the figure, and the XR button belongs to that figure.

`ctx` gains three keys a sketch may ignore: `ctx.container`, `ctx.params` and
`ctx.embedded`.

Writing a sketch that will be embedded, the one rule is **measure against
`renderer.domElement`, never against `window`**. (`src/sketches/tree.js` was the
only one that did not, and was changed.)

### Starting and stopping

A page of 3D figures would otherwise melt a laptop, so:

- a figure starts when the reader comes within 400 px of it,
- it stops — frames, audio and video — as soon as it leaves the window, and
  again whenever the tab is in the background,
- at most **four** WebGL contexts are alive at once; past that the figure
  furthest from the reader gives its context back and falls to its poster.
  Browsers allow about eight before killing one themselves, which looks like a
  bug and is hard to find.
- `prefers-reduced-motion` and Save Data turn autoplay off everywhere.

`window.__figures` in DevTools is the list, with each figure's state.

## Posters, and print

Every figure needs a still. Three readers depend on it: the one printing, the
one whose browser has no WebGL, and the one who scrolled far enough that the
figure gave up its context.

1. Open the chapter on the dev server.
2. Set the figure up the way it should be seen.
3. Press **poster** in the figure's bar (only there on the dev server).
4. Move the file into `thesis/posters/` and build again.

The **poster** button is only on a `sketch=` figure, which runs in the page
where the build can reach its canvas. A `processing=` or `embed=` figure is an
iframe, so its still is a screenshot: open the sketch's own page, size the
window to the figure's shape, and save it as `thesis/posters/fig-<name>.jpg`.
All fifteen runnable Processing sketches have one.

The build lists every figure that has no poster yet. In print, the poster
replaces the figure and the live address is printed under the caption, so
nothing in the argument is reachable only on a screen. **print** in the top bar
is the browser's print dialog; "save as PDF" there is what a committee gets.

## Publishing

The document goes to three places in the Pages repository, named in
`thesis.json` under `site`:

```
MaximalistAssemblage/
  ThesisTemplate/lib/             the engine: reader.js, book.js, the CSS
  Dissertation/                   the rendered pages, where a reader lands
    writing_chapters_sections/    the markdown, as the writing of record
  ArtifactAssemblage/figures/     the posters
```

The reader's URL is `/MaximalistAssemblage/Dissertation/`.

**Push, and it publishes.** `.github/workflows/publish-thesis.yml` fetches the
sheet, builds, and commits the result. It also runs daily, because the writing
lives in a Google Sheet and a sheet cannot say that it changed.

```
git push
```

GitHub Pages cannot do this itself: it runs Jekyll and only Jekyll, so it will
never run `build.mjs`, and a chapter's markdown committed over there is
rendered raw at a URL nobody meant to publish. That is why the markdown this
build publishes carries `published: false` in its front matter — the file stays
in the repository, readable and diffable, and Jekyll leaves it alone.

### Why a publish never empties a folder

None of those three folders belongs to this build alone. `Dissertation/` also
holds `drafts/` and `notes/`; `writing_chapters_sections/` holds hand-written
markdown; `figures/` holds hand-made figures. Emptying any of them would delete
work the build did not make and cannot put back.

So the build writes `MaximalistAssemblage/ThesisTemplate/published-files.json`, listing every
file it produced, and a publish removes the files the **previous** publish left
and nothing else. A file the build has never written is one it will never
remove. Renaming a chapter therefore takes the old page and the old markdown
with it, and leaves everything else where it is.

### What the workflow needs, once

A token that may write to the Pages repository, stored in **this** repository
as the secret `PAGES_TOKEN`. `GITHUB_TOKEN`, which Actions provides for free,
is scoped to the repository it runs in and cannot push to another one.

1. github.com → Settings → Developer settings → Personal access tokens →
   Fine-grained tokens → **Generate new token**
2. Repository access: **Only select repositories** →
   `writingcodetoplaydolls.github.io`
3. Permissions → Repository permissions → **Contents: Read and write**
4. Copy the token. It is shown once.
5. In this repository: Settings → Secrets and variables → Actions →
   **New repository secret**, named `PAGES_TOKEN`.

Set an expiry you will notice. When it lapses the workflow fails loudly rather
than publishing something stale.

### Building it by hand

```
npm run thesis:sheet
```

```
node thesis/build.mjs --site
```

That writes `site\MaximalistAssemblage\`, which mirrors the repository folder
for folder — so it is what the workflow commits, and what to copy by hand if
the workflow is not running.

### The sketches and the models

The workflow publishes the document and nothing else. The sketches the figures
load, and the models and the floating-skin module behind the pages, are
published separately and change far less often:

```
node tools/export_site.mjs
```

Then copy `site\MaximalistAssemblage\ArtifactAssemblage\` and `site\assets\`
into the Pages repository by hand. The room behind the pages is
`assets/floating-skin/` — `skin.js` and `skin-data.bin`, about 2.9 MB. Without
it the windows are empty.

## Not done yet

- **Folios start again at 1 in every chapter.** Each chapter paginates on its
  own, so there are nine page 1s. In a book read front to back that is only a
  little odd; in one meant to be read in any order it is worse than odd,
  because a page cannot be referred to. "Page 12" names nine places. The fix is
  to qualify the folio with the chapter -- 1.1, 1.2, 4.7 -- which also survives
  repagination at a different window size better than a running count would,
  since only the chapter's own pages move. Numbering straight through instead
  would mean paginating every chapter at once, which is a different build; the
  qualified folio does not.

- **Citations.** Footnotes work. Pandoc-style `[@key]` citations against
  `apa.csl` do not: the build has no CSL processor. The methodology document
  still goes through `build.bat` for the APA `.docx`.
- **A figure cannot stand in a page's box, only a quotation can.** Both are
  written in the sheet now -- `Figure` puts a figure in the flow, `quote` in
  `Notes` lifts a quotation into the box on the right-hand page -- but a figure
  asked for in the writing always sets in the column. Giving a figure the box
  would mean deciding what happens when the one on that spread is taken and the
  figure is a running sketch that cannot be moved cheaply. The slot addresses
  are generated -- `node thesis/build.mjs --slots=x.csv` writes one row per
  window and figure, keyed by an address that survives the sections being
  rearranged -- and the sheet tab to paste them into is still not written.

- **One figure has no poster.** The comps graph: it is an iframe to a page in
  the Pages repository, so it is blank on the dev server and there is nothing to
  capture. Every other figure has one.
- **One figure, one room.** She is the only thing in it. No floor, no horizon,
  no other bodies: just the dark grey, the fog and her.
- **The comps graph figure** points at `/MaximalistAssemblage/CompsGraph/`, which
  is in the Pages repository and not in this project, so it is blank on the dev
  server until it is given a `dev-embed=` of its own.
- **Editable code in the page.** The embed harness already compiles and runs a
  module per figure, so a code panel that re-runs an edited `draw()` is a small
  addition — not built, because nothing asked for it yet.
- **Book mode does not carry across chapters.** Each chapter paginates on its
  own and its folios start at 1. Numbering the whole document through would
  mean paginating every chapter at once, which is a different build.
