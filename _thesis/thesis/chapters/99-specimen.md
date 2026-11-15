---
kicker: Reference
title: Layout specimen
abstract: Every part of the layout on one page, with the markdown that made it. Keep this chapter in the document while writing and drop it from thesis.json before anyone else reads the thing.
---

This page is the reference. Each section shows a feature and the markdown
beneath it, so nothing has to be remembered.

## Prose {#prose}

A paragraph is a run of lines with a blank line after it. `code`, **bold**,
*italic*, [a link](https://writingcodetoplaydolls.github.io/), and a footnote
marker that becomes a sidenote.[^one] A second marker, to show the numbering.[^two]

[^one]: Wide enough for a gutter and this sits beside the paragraph that cites it. Narrower and it folds away until the marker is tapped. Either way it prints as a numbered note.
[^two]: Notes are numbered in the order they are first cited, not the order they are written, so they can be defined anywhere in the chapter.

> A block quotation is a run of lines each beginning with a greater-than sign,
> and a line beginning with a double dash becomes its attribution.
> -- Author, *Title* (year)

A rule is three or more asterisks or dashes on their own line.

***

### Headings

`## Section` and `### Sub-section` get an id from their text and appear in the
contents rail on the left. `## Section {#chosen-id}` chooses the id instead,
which is what to do once a heading has been cited somewhere and its wording
changes. Hovering a heading shows a `#` that copies its address.

### Lists and tables

- a bullet list
- a second bullet, which may wrap onto
  as many lines as it needs
1. a numbered list
2. the second item

| Column | What goes here |
|---|---|
| `sketch=` | the name of a file in `src/sketches` |
| `embed=` | the address of a page that is finished already |
| `width=` | `column`, `wide`, `full` or `spread` |

### Code

```js:src/lib/example.js
// A fenced block. The word after the backticks is the language; anything
// after a colon is shown above the block as a filename.
export function setup(ctx) {
  ctx.hint('a sketch gets the same ctx here as it does full-screen')
}
```

### Asides

:::aside title="An aside"
`:::aside title="..."` for something beside the argument.
:::

:::method title="A method note"
`:::method` for how something was done — olive, to tell it apart.
:::

:::caution title="A caution"
`:::caution` for a limit, a warning, or something not yet true.
:::

## Figures {#figures}

A figure is a block with attributes on the opening line and its caption inside.
Four kinds: a **sketch** run inline, an **embed** of a page already published, a
**video**, or an **image**.

```
:::figure sketch=cube width=wide height=50vh title="A cube" label="Figure 3.1"
The caption, which takes inline markdown.
:::
```

:::figure sketch=cube width=wide height=46vh title="A cube" label="Figure 3.1"
A sketch inside the text. It is the same `src/sketches/cube.js` that the dev server runs full-screen: nothing was changed to put it here. Its lil-gui panel is inside the figure; the bar across the top carries its hint line, **expand**, and a link to its **own page**.
:::

### Widths

`width=column` keeps a figure inside the text measure.

:::figure sketch=particles width=column aspect="4 / 3" title="Particles" label="Figure 3.2"
`width=column`: as wide as a paragraph. Good for something small and definite.
:::

`width=wide` is the default: the measure plus the sidenote gutter, and in book
mode both columns of its page, with the text flowing round it. `width=full`
goes edge to edge, which suits anything that is a place rather than a picture,
and takes a page of its own in the book. `width=spread` is the same but takes
the whole two-page spread: a plate, with nothing else on it.

:::figure sketch=particles width=full height=44vh title="Particles, full width" label="Figure 3.3"
`width=full`. Use `height=` for a viewport-relative height such as `70vh`, or `aspect=` for a ratio like `16 / 9`.
:::

### Starting and stopping

A figure starts when the reader comes near it and stops when they leave, and only
four WebGL contexts stay alive at once — the figure furthest from the reader
gives its context up and falls back to its still. Add `autoplay=false` to a
figure with a large download behind it, and `weight="..."` to say what the wait
is for:

```
:::figure sketch=family width=full height=80vh autoplay=false
           weight="about 40 MB of models and video — starts on a click"
```

### A page that is already finished

Some pieces are published as whole pages of their own — the Bouquet, the comps
graph, an old p5 sketch. Those go in as an iframe and are not touched:

```
:::figure embed=/MaximalistAssemblage/Bouquet/ width=full height=70vh
:::figure sketch=bouquet site-embed=/MaximalistAssemblage/Bouquet/
```

The second line is the useful one: the module while writing on the dev server,
the published page once it is on the site. `dev-embed=` does the reverse.

## The two ways of reading {#reading}

The button in the top bar switches between them, and remembers the choice.

**Book** is the default where there is room: this spread, two columns to a
page, turned with the chevrons either side, the arrow keys, PageUp and
PageDown, space, Home and End, or a swipe. The keys are left alone whenever the
pointer is over a figure, because a sketch in walk mode uses the arrows itself.
A section in the contents, a link to a figure and a footnote marker all turn to
the page they are on.

**Scrolling** is one column with the notes out in the margin. A window too
small for a spread falls back to it by itself, and goes back to the book when
there is room again.

The same markdown makes both, and the same markdown prints: the pages are
flattened back into one flow, so nothing has to be written twice and nothing
can be true on screen and not on paper.

:::method title="Where a page break falls"
Each page is a two-column box of a fixed height and the browser breaks the
paragraphs across its two columns itself. `lib/book.js` only decides which
blocks land on which page: it pours one block at a time and asks after each
whether the page still fits. A heading left alone at the foot of a page goes
forward with the paragraph under it. A `width=wide` figure spans both columns;
a `width=full` figure takes a page of its own, usually the one facing the text
that introduces it, and a `width=spread` figure takes the whole spread.
:::

## Windows {#windows}

The pages are sheets of near-black laid over a room that runs the whole time
the document is open. A **window** is a hole cut in the sheet: the reader looks
straight through to the room, and the floating skin figure comes and stands in
one now and then to watch them read, then goes off again.

```
:::window width=wide aspect="21 / 9"
An optional caption.
:::
```

:::window
The aperture is 60 by 60 mm and square, the frame of a twin-lens reflex, in real units so it is that size on paper too. `size=` changes it; `aspect=` or `height=` abandon the square.
:::

**A figure is a window too.** While its sketch is not running there is nothing
in the opening but the room — which is why there is no still sitting in it on
screen. Press **start** and the piece takes the opening over; give the figure
up (scroll far enough away) and the room comes back.

The **page** slider in the top bar sets how solid the sheet is, from a quarter
opaque to a wall. The windows stay windows at every setting.

## Finding your way {#navigation}

The contents are a figure, not a list. Every section of the document is a
circle, laid on a lattice whose spacing is the radius, so each circle passes
through its neighbours' centres: one place is a cell, seven is the Seed of
Life, nineteen the Flower. The disc at a centre fills when you have read that
place; the lens between two circles fills once you have read both, which is the
membrane the two cells share. Click a centre to go there.

Turning to another chapter does not leave the page: the chapter is fetched and
only the text is replaced, so the room behind the pages — and whatever she is
in the middle of — carries on.

## Posters and print {#posters}

Every figure needs a still, for three readers: the one printing it, the one whose
browser has no WebGL, and the one who has scrolled far enough that the figure has
given up its context.

1. Run the dev server and open the chapter.
2. Set the figure up the way it should be seen.
3. Press **poster** in the figure's bar — it is only there on the dev server.
4. Move the downloaded `fig-….jpg` into `thesis/posters/` and build again.

The build names the poster it wants for every figure that has none. In print the
poster replaces the figure and the live address is printed beneath the caption,
so nothing in the argument is reachable only on a screen. **print** in the top
bar is the same as the browser's own print, and saving as PDF from that dialog is
what to hand a committee.
