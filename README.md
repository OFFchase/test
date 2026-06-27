# 💚 green flags

A tiny, mobile-first presentation website with cool transitions — a swipeable
deck of "green flags" making the (very serious) case for why someone should date me.

Built with React + Vite. No animation libraries — every transition is hand-rolled CSS.

## Run it

```bash
npm install
npm run dev
```

Then open it **on your phone** (or your browser's mobile/device view — it's designed
for portrait phone screens). Vite runs with `--host`, so it prints a network URL you
can open from a phone on the same Wi-Fi.

## How to use it

- **Swipe up / down** to move between slides (left / right also works)
- **Tap** the right side to advance, the left side to go back
- Arrow keys / space work too (handy on desktop)
- Hit the button on the last slide for a little surprise 🎉

## Make it yours

All the content lives in [`src/slides.js`](src/slides.js): edit the `intro`,
the `flags` array (each entry is one slide — emoji, headline, detail, and a
color `theme`), and the `outro`. Available themes: `aurora`, `mint`, `sky`,
`peach`, `lilac`, `sunset`.
