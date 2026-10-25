# Development

Vite + React + TypeScript + Tailwind + Zustand. Online rooms use Firebase (Realtime Database + Anonymous Auth).

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

`npm test` runs the tests, `npm run lint` the linter, `npm run build` type-checks and builds `dist/`.

## Deploy

- **Site**: Vercel builds every push to `main` (`vercel.json`). The Firebase values above are set as Vercel environment variables.
- **Database rules**: `src/online/rules.json`, deployed by the GitHub workflow on every push to `main`. They keep each player's word private and hide the answer until the round ends.

## Words

The word bank and how it's written, reviewed and graded: [word-bank.md](word-bank.md). Categories it doesn't cover still use `src/data/pairs.<lang>.json`.

## Icons

`node scripts/gen-icons.mjs` regenerates every icon, the favicons and the share image from `public/favicon.svg`.
