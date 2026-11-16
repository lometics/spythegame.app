# Development

Vite + React + TypeScript + Tailwind + Zustand. Online rooms use Firebase (Realtime Database + Anonymous Auth).

Signing in with Google is optional: the home screen, Settings and a tip under your own word lists lead to the account page (`/account`), which shows the sync status and lets you sign out or delete the saved data. Signed in, `src/account/` keeps the game settings and own word lists at `users/<uid>` and syncs them between devices: newest settings win as a block, lists merge one by one (newest copy wins) and deleted lists leave a tombstone so they don't come back. An anonymous user who signs in is upgraded in place, so they stay in their room. Google sign-in has to be enabled in the Firebase console (Authentication → Sign-in method), and every domain the app runs on must be listed under Authentication → Settings → Authorized domains.

## Run locally

```bash
npm install
npm run dev
```

The one-phone mode works without any setup. For online rooms, create `.env.local` with the Firebase web app config (Firebase Console → Project settings → Your apps):

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
```

`npm test` runs the tests, `npm run lint` the linter, `npm run build` type-checks and builds `dist/`. `npm run test:rules` checks the database rules in the Firebase emulator (needs Java 21+).

## Deploy

- **Site**: Vercel builds every push to `main` (`vercel.json`). The Firebase values above are set as Vercel environment variables.
- **Database rules**: `src/online/rules.json`, deployed by the GitHub workflow on every push to `main`. They keep each player's word private, let only the owner read or write their account data in `users/`, hide the answer until the round ends, let any device delete rooms nobody used for 30 days, and accept write-only crash reports in `errors/`.

## Words

The word bank and how it's written, reviewed and graded: [word-bank.md](word-bank.md). Categories it doesn't cover still use `src/data/pairs.<lang>.json`.

## Search pages

After the app build, `scripts/gen-seo.mjs` writes static pages for search engines: a landing page per language, every word category with the spy's words, and the guides in `content/guides/<id>/<lang>.md` (frontmatter: `slug`, `title`, `description`, optional `category` to link it from that category page). It also writes `sitemap.xml` and `404.html`. Only the app routes listed in `vercel.json` get the app; every other URL is a real 404, so a new route needs a rewrite there too (a test checks this).

## Icons

`node scripts/gen-icons.mjs` regenerates every icon, the favicons and the share image from `public/favicon.svg`.
