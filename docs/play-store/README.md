# Google Play release

The Android app is a Trusted Web Activity: a thin app that opens spythegame.app full screen. Website updates reach the app at once; a new app upload is only needed when the Android wrapper itself changes.

## What's prepared

| What | Where |
|---|---|
| App bundle to upload (`app.spythegame`, 1.0.0, Android 7.0+) | `android/app-release-bundle.aab` (not in git, rebuild below) |
| Test APK to install on a phone | `android/app-release-signed.apk` (not in git) |
| Upload key + password | `C:\Users\Nathaniel Walser\.android-keys\spythegame\` (outside the repo) |
| App config | `android/twa-manifest.json` |
| Digital Asset Links | `public/.well-known/assetlinks.json` → https://spythegame.app/.well-known/assetlinks.json |
| Privacy policy | https://spythegame.app/privacy/ (`public/privacy/index.html`) |
| Store texts, 15 languages | `listing.json` (title ≤ 30, short ≤ 80, full ≤ 4000 characters) |
| Screenshots, 1080×1920 | `screenshots/` (8) |
| Feature graphic, 1024×500 | `feature-graphic.png` |
| App icon, 512×512 | `public/icon-512.png` |

## Your steps

1. **Developer account.** Create a Google Play Console account as an organisation for Lometics GmbH (25 USD one-time). Google asks for a D-U-N-S number (free from Dun & Bradstreet, takes a few days) and verifies identity. Organisation accounts can publish to production directly; new personal accounts would need a 14-day closed test with 12 testers first.
2. **Back up the upload key.** Put `upload-key.jks` and the password from `upload-key-password.txt` into your password manager. Without it you can't ship updates (Google can reset an upload key, but it takes days).
3. **Create the app.** Name "Spy – Party Word Game", default language English (US), Game, Free.
4. **App content** (Policy → App content):
   - Privacy policy: `https://spythegame.app/privacy/`
   - Ads: no. App access: all functionality is available without special access.
   - Target audience: 16 and over (matches the privacy policy, and keeps the app out of the Families programme).
   - Content rating: fill in the IARC questionnaire honestly. Note the built-in categories "Dark Humor", "Terror Attacks", "Tyrants & Despots", "Peoples", "Stereotypes", "Religions", and words for alcohol. Expect PEGI 12–16 / Teen–Mature.
   - Data safety: see the answers below.
   - Government, financial, health, news apps: no.
5. **Store listing.** Copy the texts from `listing.json` (add each language under "Translations"). Category: Games → Word. Contact email `info@lometics.com`, website `https://spythegame.app`. Upload the icon, the feature graphic and the 8 screenshots.
6. **Release.** Production → Create release → keep Play App Signing on (default) → upload `android/app-release-bundle.aab` → release notes "First release" → countries: all → send for review (usually 1–7 days).
7. **After the first upload:** Setup → App signing → copy the **App signing key certificate SHA-256 fingerprint** and send it to me (or add it to `public/.well-known/assetlinks.json` next to the existing one and deploy). Until it's there, the Play version shows a small browser bar at the top.

Optional before step 6: install `android/app-release-signed.apk` on an Android phone (allow installing unknown apps) to try it. It's signed with the upload key, which is already in assetlinks.json, so it should open full screen without a browser bar.

## Data safety answers

Data is collected: yes. Shared with third parties: no (Google and Vercel only process it for us). Encrypted in transit: yes. Users can ask for deletion: yes (email, or leave the room).

| Data type | Collected | Optional | Purpose | Notes |
|---|---|---|---|---|
| Personal info → Name | yes | yes (online rooms only) | App functionality | The name typed in for online rooms; deleted with the room after 30 days unused |
| Device or other IDs | yes | yes (online rooms only) | App functionality | Anonymous Firebase user ID |
| Location → Approximate | yes | no | Analytics | Country/region/city derived from the IP address by Vercel Analytics, not stored on the device |
| App activity → App interactions | yes | no | Analytics | Page views (Vercel Analytics, no cookies) |
| App info and performance → Crash logs | yes | no | App functionality | Error message, page, browser/device type |
| App info and performance → Diagnostics | yes | no | Analytics | Page-performance measurements |

Everything else (email, contacts, photos, messages, financial, health, files, precise location): not collected.

## Updating the app

Website changes need no new upload. For changes to the wrapper (name, icon, colours, Android version), edit `android/twa-manifest.json`, raise `appVersionCode` (and `appVersion`), then rebuild:

```bash
cd android
npx @bubblewrap/cli@1.27.0 update --skipVersionUpgrade --manifest ./twa-manifest.json
./gradlew bundleRelease assembleRelease
jarsigner -keystore <upload-key.jks> -signedjar app-release-bundle.aab app/build/outputs/bundle/release/app-release.aab upload
```

Needs JDK 17 (`JAVA_HOME`) and the Android SDK (`ANDROID_HOME`). Bubblewrap's own `build` command doesn't accept this machine's SDK layout, which is why Gradle runs directly.
