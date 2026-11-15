# The build

The pages under `MaximalistAssemblage/Dissertation/` are built from a Google
Sheet by the workflow in `.github/workflows/thesis.yml`. This folder is what
it runs.

Jekyll ignores directories whose names begin with an underscore, so nothing
here is served.

**To rebuild the site after changing the sheet:** Actions → "rebuild the
dissertation pages" → Run workflow. It also runs once a day, because a
spreadsheet cannot say that it changed.

Nothing here needs to be edited to publish new writing. The writing is in the
sheet; this only turns it into pages. See `thesis/README.md`.
