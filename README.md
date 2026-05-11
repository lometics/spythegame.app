# Spy — The Word Game

A web app for the party game where everyone gets a word and one secret **spy** gets a *similar* word. Players take turns dropping clues, then vote out who they think the spy is.

Two play modes:

- **Pass-and-play** — one device, friends in the same room. Zero setup, fully offline once loaded.
- **Online rooms** — host creates a room with a code, friends join from their own phones. Powered entirely by Firebase (Realtime Database + Anonymous Auth).

## Run locally

```bash
npm install
npm run dev
```

Pass-and-play works immediately, no config needed.

## Enable online mode

Online mode needs a Firebase project.

1. Go to [Firebase Console](https://console.firebase.google.com/) → create a new project.
2. Add a **Web app** to the project. Copy the config snippet.
3. In the Firebase project, enable **Realtime Database** (any region; start in test mode if you want to play before deploying rules).
4. In **Authentication → Sign-in method**, enable **Anonymous**.
5. Copy `.env.example` to `.env.local` and fill in:
   ```env
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_APP_ID=...
   ```
6. Restart `npm run dev`.

## Deploy

Build once: `npm run build`. The `dist/` folder is a plain static site — host it on Vercel, Netlify, GitHub Pages, or Firebase Hosting.

For Firebase Hosting:

```bash
npm install -g firebase-tools
firebase login
firebase init   # pick Hosting (dist) + Realtime Database (use src/online/rules.json)
firebase deploy
```

## Security rules

The RTDB rules in [`src/online/rules.json`](src/online/rules.json) make sure each player can only read their own secret word, and the full word pair is hidden until the round ends. Deploy them with `firebase deploy --only database` or paste into the Firebase Console rules tab.

## Word pairs

Curated pairs live in [`src/data/pairs.json`](src/data/pairs.json). Add your own — each pair has `civilian`, `spy`, and `category`. Pairs do **not** need to live in the same conceptual category; the **Tricky / Mixed** category is specifically for ones that cross buckets.

The host can also type a **custom** pair before any round, no JSON edit required.

## Tech

Vite + React + TypeScript + Tailwind + Zustand + Firebase.
