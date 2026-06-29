# Contributing to Chat Wrapped

First off — thanks for taking the time to contribute! 🎉 Chat Wrapped is a small,
friendly, privacy-first project and contributions of all sizes are welcome, whether
it's a bug fix, a new stat, better parsing for a locale we missed, or just a typo.

## Code of conduct

Be kind and constructive. Assume good intent. We want this to be a welcoming space
for first-time open-source contributors.

## Ways to contribute

- 🐛 **Report a bug** — especially parsing bugs for a WhatsApp export format/locale we
  don't handle yet.
- 💡 **Suggest a feature** — a new "Wrapped" stat, a design improvement, an accessibility fix.
- 🛠️ **Send a pull request** — see the workflow below.

## Filing issues

Open an issue on the GitHub **Issues** tab and include:

- **What happened** vs. **what you expected**.
- For **parsing bugs**: a few **anonymized** example lines from your export (replace real
  names/messages with fake ones — never paste private chats), your phone OS (iOS/Android)
  and locale/region, so we can reproduce the date/time format.
- Steps to reproduce, plus browser + OS if it's a UI bug.

> 🔒 **Never paste real personal chat content into a public issue.** Anonymize first.

## Development setup

```bash
# Fork & clone, then:
npm install
npm run dev      # http://localhost:5173
npm test         # run the parser/stats test suite
npm run lint     # lint
npm run build    # production build
```

All processing is client-side — there is no server to run and no environment variables
to set.

## Branch naming convention

Create a branch off `main` using:

- `feat/<short-description>` — new feature
- `fix/<short-description>` — bug fix
- `docs/<short-description>` — documentation only
- `chore/<short-description>` — tooling/config/maintenance

Example: `fix/ios-24h-timestamp-parsing`

## Pull request process

1. **Fork** the repo and create your branch from `main`.
2. Make your change. Add or update **tests** in `src/lib/__tests__/` for any parsing or
   stats logic.
3. Run the full check locally before pushing:
   ```bash
   npm run lint && npm run format:check && npm test && npm run build
   ```
4. Open a PR against `main` with a clear title and description of **what** and **why**.
   Link any related issue (e.g. "Closes #12").
5. CI must pass (lint, format, test, build). A maintainer will review and merge.

Small, focused PRs are much easier to review than large ones — when in doubt, split it up.

## Adding a new stat

Stats live in `src/lib/stats.js` and are rendered as story cards in
`src/components/`. The general flow:

1. Compute the new value inside `computeStats()` and add it to the returned `Stats` object.
2. Add a card (or extend an existing one) to display it.
3. Add a test asserting the computed value on the sample fixture.

Thanks again! 💬✨
