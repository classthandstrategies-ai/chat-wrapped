<div align="center">

# 💬 Chat Wrapped

**Turn your exported WhatsApp chat into a Spotify-Wrapped-style story.**
100% local — your chat never leaves your browser.

[![CI](https://github.com/classthandstrategies-ai/chat-wrapped/actions/workflows/ci.yml/badge.svg)](https://github.com/classthandstrategies-ai/chat-wrapped/actions/workflows/ci.yml)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/classthandstrategies-ai/chat-wrapped)
[![License: MIT](https://img.shields.io/badge/License-MIT-1ed760.svg)](./LICENSE)

[Live demo](#-live-demo) · [Features](#-features) · [Quick start](#-quick-start) · [How to use](#-how-to-use)

</div>

---

## 📸 Screenshots

> **Add your media here.** Drop a screenshot or a short screen-recording GIF of the
> Wrapped story scroll + the downloadable share card into a `docs/` folder and link it,
> e.g. `![Chat Wrapped demo](docs/demo.gif)`. A 9:16 phone-frame capture looks best.

| Landing | Story cards | Share card |
| ------- | ----------- | ---------- |
| _add `docs/landing.png`_ | _add `docs/cards.png`_ | _add `docs/share.png`_ |

## 🔗 Live demo

> **Add your deployment link here** once deployed, e.g. `https://chat-wrapped.vercel.app`.

## ✨ Features

- **Drag & drop a `.txt` export** — or try it instantly with the built-in sample chats
  (one 1:1 chat, one group chat). No real export needed to play with it.
- **Universal parser** — auto-detects iOS (`[dd/mm/yyyy, h:mm:ss AM]`) and Android
  (`dd/mm/yyyy, hh:mm -`) formats, 12h/24h clocks, `DMY` / `MDY` / `YMD` date orders,
  multi-line messages, and skips system notices. Unicode-aware, so Hinglish and other
  scripts work too.
- **A full Wrapped story** with vibrant per-card gradients and scroll-snap:
  - Total messages, date range & total words
  - Who texted more (or a group leaderboard)
  - Busiest hour of day & busiest day of week (hand-rolled CSS bar charts)
  - Longest streak of consecutive days
  - Median reply time per person (overnight gaps excluded for believable numbers)
  - Who texts first after a lull
  - Top words per person (stopwords filtered, English + Hinglish)
  - Top emojis (grapheme-safe counting)
  - Longest message & busiest single day
  - Fun extras: longest silence, double-texting champ, peak month, and a "chat vibe"
- **Downloadable share card** rendered to PNG in-browser, in **Story (9:16)** or
  **Square (1:1)** format.
- **Group chats** show per-person breakdowns (top participants + a condensed "others" row).
- **Privacy by design** — no backend, no analytics, no network calls. Even fonts are
  system fonts, so nothing is requested from a third party. Everything runs client-side.

## 🛠️ Tech stack

| Area        | Choice                                                              |
| ----------- | ------------------------------------------------------------------ |
| Framework   | [React 19](https://react.dev/)                                     |
| Build tool  | [Vite 6](https://vitejs.dev/)                                      |
| Styling     | [Tailwind CSS v4](https://tailwindcss.com/) (`@theme` design tokens) |
| PNG export  | [html-to-image](https://github.com/bubkoo/html-to-image)           |
| Testing     | [Vitest](https://vitest.dev/)                                      |
| Lint/format | [ESLint 9](https://eslint.org/) + [Prettier](https://prettier.io/) |
| CI / Deploy | GitHub Actions + [Vercel](https://vercel.com/)                     |

The only runtime dependencies are `react`, `react-dom`, and `html-to-image`. Charts are
plain CSS — no chart library.

## 📋 Prerequisites

- **Node.js ≥ 18.18** (developed on Node 20+; works on current LTS and newer)
- **npm** (ships with Node)

## 🚀 Quick start

```bash
# 1. Clone
git clone https://github.com/classthandstrategies-ai/chat-wrapped.git
cd chat-wrapped

# 2. Install
npm install

# 3. Run the dev server
npm run dev          # → http://localhost:5173
```

### Other scripts

```bash
npm run build        # production build to dist/
npm run preview      # serve the production build locally
npm test             # run the parser + stats test suite (Vitest)
npm run lint         # ESLint
npm run format       # apply Prettier
```

## 🔐 Environment variables

**None required.** Chat Wrapped is fully client-side and needs no secrets, API keys, or
backend. A placeholder [`.env.example`](./.env.example) is included for convention only —
if you fork and add an optional integration, expose it via Vite's `import.meta.env.VITE_*`.

## 📖 How to use

1. On your phone, open WhatsApp → open the chat you want → tap **⋮ / chat name** →
   **More** → **Export chat** → **Without Media**.
2. Send the resulting `.txt` to yourself (email/Notes/Drive) and download it to your computer.
   _(If you receive a `.zip`, unzip it first and use the `.txt` inside.)_
3. Open Chat Wrapped, **drag the `.txt` onto the upload zone** (or click to choose it).
4. Scroll through your Wrapped story, then hit **Download PNG** on the final card to share.

Want to see it first? Click **Try with sample chat** or **Try a group chat** on the
landing screen — these load bundled demo files, nothing of yours required.

## 🗂️ Project structure

```
chat-wrapped/
├── public/
│   ├── sample-chat.txt          # demo 1:1 chat (loaded by "Try with sample chat")
│   └── sample-group-chat.txt    # demo group chat
├── src/
│   ├── components/
│   │   ├── Landing.jsx          # hero + export instructions + upload + demo buttons
│   │   ├── UploadZone.jsx       # drag & drop / file picker (reads file in-browser)
│   │   ├── WrappedReport.jsx    # scroll-snap story + final share slide
│   │   ├── StoryCard.jsx        # full-screen gradient slide wrapper
│   │   ├── cards.jsx            # the individual stat-card contents
│   │   ├── BarChart.jsx         # pure-CSS bar chart
│   │   ├── Leaderboard.jsx      # group rankings + "and N others" row
│   │   └── ShareableCard.jsx    # fixed-size card rendered to PNG
│   ├── lib/
│   │   ├── parser.js            # universal WhatsApp export parser
│   │   ├── stats.js             # all stat computations
│   │   ├── text.js              # Unicode tokenizer + grapheme-safe emoji extraction
│   │   ├── stopwords.js         # English + Hinglish stopword list
│   │   ├── format.js            # number / date / duration formatters
│   │   ├── theme.js             # gradient + per-sender color palette
│   │   ├── shareCard.js         # html-to-image PNG download
│   │   └── __tests__/           # parser + stats test suites
│   ├── App.jsx                  # landing → report state machine
│   ├── main.jsx                 # React entry
│   └── index.css                # Tailwind v4 theme tokens + utilities
├── design/                      # design-system reference (not shipped)
├── .github/workflows/ci.yml     # lint + format + test + build on push/PR
├── vercel.json                  # SPA deploy configuration
└── vite.config.js               # Vite + Tailwind + Vitest config
```

## ☁️ Deployment

Optimized for **Vercel** (zero-config via [`vercel.json`](./vercel.json) — framework
`vite`, build `npm run build`, output `dist/`). One-click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/classthandstrategies-ai/chat-wrapped)

It's a static SPA, so it deploys just as happily to Netlify, GitHub Pages, or Cloudflare
Pages — build command `npm run build`, publish directory `dist`.

## 🤝 Contributing

Contributions are very welcome — especially parser fixes for export formats/locales we
don't handle yet. Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for how to file issues,
branch naming, and the PR process. Be kind, and **never paste real personal chats into
public issues** — anonymize first.

## 📄 License

[MIT](./LICENSE) © 2026 classthandstrategies-ai

## 🙏 Acknowledgments

- Inspired by [Spotify Wrapped](https://www.spotify.com/wrapped/)'s story format.
- WhatsApp's native **Export Chat** feature is the only data source — no APIs, no scraping.
- Built with React, Vite, Tailwind CSS, and html-to-image.
- All sample chat data in `public/` is fictional and was written for the demo.
