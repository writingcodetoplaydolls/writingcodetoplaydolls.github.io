# Read Along

A reading app that follows a text as a voice reads it, with highlights, notes and bookmarks.
It installs to a phone or computer and then works with no internet.

## What goes in this folder

Only these files:

- `index.html`
- `sw.js`
- `manifest.webmanifest`
- `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`

**Do not put books here.** No reading scripts, audio, timings or marks files. A GitHub Pages site is
public, so anything in this folder can be downloaded by anyone. Books are added inside the app, from
files on your own device, and stay on that device.

## Publishing

Put this folder in a GitHub Pages site, for example as `readalong/`, so the app opens at
`https://<your-name>.github.io/readalong/`.

## Updating

Replace the files and change `VERSION` in `sw.js` (for example `readalong-v2`), so installed copies
pick up the new version the next time they are opened with internet.
