# Maryam Aasia — Portfolio

Built with [Astro](https://astro.build) + plain CSS. Figma is the single
source of truth for all design decisions.

## Status

Landing page is built (desktop, from Figma node 206:175). Work and About
pages are not built yet. Landing still needs a tablet/mobile responsive
pass.

## Running it locally

```
npm install
npm run dev
```

Then open the local address it prints (usually `http://localhost:4321`)
in your browser. Leave the terminal window open while you're viewing the
site — closing it stops the server. Press `Ctrl+C` in the terminal to
stop it manually.

## Folder guide

- `src/pages/` — one file per page/URL on the site.
- `src/layouts/` — shared page shell (`BaseLayout.astro`).
- `src/components/` — reusable pieces (nav, footer, cards, etc.).
- `src/styles/` — `tokens.css` (colors/fonts/spacing as variables) and
  `global.css` (base styles).
- `src/data/` — shared content, e.g. the project list.
- `public/fonts/` — self-hosted font files.
- `public/images/` — assets exported from Figma, sorted by type.
