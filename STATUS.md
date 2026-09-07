# Project status — read this first

_Last updated: 2026-09-07. Living snapshot for picking the project up on another machine._
_Companion docs: `CLAUDE.md` (conventions + gotchas), `IMPLEMENTATION.md` (phase-by-phase detail)._

---

## Repos

| Repo | Path here | Branch | Remote |
|---|---|---|---|
| Mobile app (Expo / React Native, SDK 57) | `allcatholicmedia-app` | `main` | `codelover138/allcatholicmedia-app` |
| Backend (Laravel 12 + Botble CMS) | `allcatholicmedia` (a.k.a. `../main` in older notes) | `main` | `abdul-kader138/allcatholicmedia` |

Both are **fully committed and pushed** as of the date above. The app points at
**production** by default: `.env` → `EXPO_PUBLIC_API_BASE_URL=https://allcatholicmedia.com/api/app`.
Auth/account calls derive `https://allcatholicmedia.com/api/v1`; content calls use `/api/v1/app`.

---

## What works (done)

### Phase 3 — Auth & account  ✅
- `sign-in`, `register`, `forgot-password`, `verify-email` → `POST /api/v1/auth/*` (Sanctum bearer tokens).
- Session: `src/lib/auth-store.ts` (zustand + `expo-secure-store`, `localStorage` on web). Ambient
  token + global 401 sign-out wired into `src/lib/api-client.ts`. Restored on cold start in `_layout`.
- Profile tab: guest invitation vs. signed-in **dashboard** (identity card, Saved/Prayers/Gifts
  tiles, menu, recent activity).
- `account-edit` (profile fields + **avatar upload** via `expo-image-picker` → `POST /account/avatar`).
- `account-security` (change password, active sessions/revoke, **biometric app-lock** via
  `expo-local-authentication` + `src/components/lock-gate.tsx`, delete account).
- `saved`, `giving`, `my-prayers` — paginated `useInfiniteQuery` lists.

### Phase 4 — Listen / audio  ✅ (offline downloads too)
- `src/components/audio-player.tsx` — **`expo-audio`** (NOT react-native-track-player). Module-store
  player, mounted in `_layout`: docked mini-player + full-screen modal, background playback
  (`setAudioModeAsync({ shouldPlayInBackground: true, … })`) + lock-screen controls
  (`setActiveForLockScreen`), speed 1–2×, skip ±15/30s, tap-to-seek. `ios.infoPlist.UIBackgroundModes: ["audio"]`.
- `src/app/show/[slug].tsx` — episode list (v1 `listen/{slug}`, paginated).
- `listen.tsx` rebuilt (pressable rows, category chips).
- **Offline downloads** — `src/lib/downloads.ts` (zustand + `expo-file-system` `File`/`Directory`/`Paths`),
  files under `<documents>/acm-downloads/` + a `manifest.json` re-verified on launch. ⤓ control on
  each episode; `src/app/downloads.tsx` lists them (size + delete). Player prefers the local file.

### Phase 5 — Live Mass  ✅
- `live.tsx` rebuilt: streams open the existing WebView `VideoPlayerHost`
  (`playVideo(stream.embed_url)` — the YouTube IFrame-API player handles `youtube.com/live/…`);
  "Starts in 2 hr / 3 days" countdown for upcoming.
- `src/app/channel/[slug].tsx` — paginated channel video list → `playVideo`.
- PiP enabled on the WebView (`allowsPictureInPictureMediaPlayback`).

### Phase 6 — Prayer request / Donate / Push  ✅
- `src/app/prayer-request.tsx` → `POST /api/v1/app/prayer-requests`, **3-way visibility**
  (Only me / Prayer team / Community; "Only me" hidden for guests). Backend has a new `visibility`
  column kept in sync with legacy `is_private`. Reached from the rebuilt `pray.tsx` hub.
- `src/app/donate.tsx` — **members**: native flow via `POST /api/v1/app/donate/checkout` →
  `WebBrowser.openAuthSessionAsync` on the PayPal approval URL → catches
  `mainapp://donate-return?status=…`. **Guests / any failure**: hosted PayPal page fallback.
- `src/lib/push.ts` — Expo push token → `POST /api/v1/account/devices` on sign-in, `DELETE` on
  sign-out.
- `src/lib/reminders.ts` + `src/app/reminders.tsx` — local Rosary (DAILY) + Sunday Mass (WEEKLY)
  notifications, prefs in secure store.

### Earlier fixes
- In-app **YouTube video player** (`src/components/video-player.tsx`) — uses the YouTube IFrame
  Player API inside a `baseUrl`'d WebView so embed-restricted channels (Vatican News, Daily Rosary)
  play in-app instead of bouncing to youtube.com.
- **Routing restructure** (important — see gotchas).
- **`expo-notifications` Expo-Go crash** fix (see gotchas).
- **Google / Apple sign-in** wired (see "needs config").

---

## Architecture gotchas a new session MUST know

1. **Routing**: `src/app/_layout.tsx` is a **`<Stack>`**. The 5 tabs live in `src/app/(tabs)/`
   under `(tabs)/_layout.tsx` (renders `<AppTabs/>`). Every non-tab screen (auth, `show/[slug]`,
   `channel/[slug]`, `donate`, `reminders`, `downloads`, `account-*`, `saved`/`giving`/`my-prayers`,
   `prayer-request`, legacy `live`/`listen`/`read`/`more`) is a **root-level sibling of `(tabs)`**.
   Do NOT move them next to the tab layout — NativeTabs only renders its declared triggers, so a
   non-tab route there silently fails to appear on native (this was the "sign-in screen won't open" bug).

2. **`expo-notifications` must never be imported statically** — its native code *throws on load*
   in Expo Go (SDK 53+). Everything goes through `src/lib/notifications.ts` (lazy `require` in
   try/catch + `notificationsSupported`). Push + reminders no-op in Expo Go / web.

3. **Audio** = `expo-audio` (SDK 57). `react-native-track-player` is NOT installed.

4. **API envelopes**:
   - v1 success `{ data, meta? }`, error `{ error: { code, message, details? } }`. `api-client.ts`
     parses both plus legacy `{ message, errors }`.
   - Auth + account live at the `/api/v1` **root** (`API_V1_ROOT_URL`), content at `/api/v1/app`
     (`API_V1_BASE_URL`), legacy frozen API at `/api/app` (`API_BASE_URL`).
   - Botble Social Login plugin uses its own `{ error: bool, data, message }` shape.
   - `listen/{slug}` and `channels/{slug}` return **top-level** `meta.pagination` (not inside `data`).

5. **Native modules added this session** (all degrade gracefully on web / Expo Go, but need a
   **dev-client rebuild** to actually work): `expo-local-authentication`, `expo-image-picker`,
   `@react-native-google-signin/google-signin` (+ `expo-audio` background mode, `expo-file-system`,
   `expo-notifications` which was already present). Config plugins for the first two + notifications
   are in `app.json`; **google-signin's plugin is deliberately NOT in `app.json`** (it throws at
   prebuild without `iosUrlScheme`).

---

## Pending / blocked

### Backend deploy (in `allcatholicmedia`, before the app's new features fully work)
```
php artisan migrate          # add_visibility_to_prayer_requests, add_guest_token_to_donations
php artisan route:clear && php artisan config:clear && php artisan optimize
```
Then **PayPal sandbox-test** `POST /api/v1/app/donate/checkout` end-to-end (open approval_url,
approve, confirm redirect → `mainapp://donate-return?status=completed` and the Donation row flips
to `completed`). The donation controller + `App\Services\PayPalCheckout` are **untested against a
real PayPal sandbox** (no local sandbox creds, local DB was behind prod).

### Google / Apple sign-in — wired in the app, needs turning on
App side is done: `src/lib/google-auth.ts`, `authApi.googleLogin` / `authApi.appleLogin`
(`auth-api.ts`), `src/components/google-button.tsx` (on `sign-in` + `register`). The button stays
**hidden** until:
1. Google Cloud Console → OAuth client IDs (Web + iOS + Android).
2. `allcatholicmedia` admin → Settings → Social Login → enable Google, `google_app_id` = the **Web**
   client id + secret.
3. `allcatholicmedia` → `config/plugins/social-login/general.php` → add the `member` guard to
   `'supported'` (currently `[]`, so the API returns "invalid guard configuration").
4. App `.env`: `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=…` (+ `_IOS_CLIENT_ID` for iOS).
5. iOS: add `["@react-native-google-signin/google-signin", { "iosUrlScheme": "com.googleusercontent.apps.<IOS_CLIENT_ID>" }]` to `app.json` plugins.
6. Rebuild the dev client. (Apple Sign-In has `authApi.appleLogin` + `/api/v1/auth/apple` stubbed but no button — Apple requires it on iOS if Google ships there.)

### Still to build
- **Community tab** — `community.tsx` is a placeholder. `/api/v1/community/*` exists, but the
  brand guide (§5) requires report / block / moderation-queue tooling before enabling posts.
  Needs a product decision on scope.
- Video-detail screen (minor — videos already play in the modal).
- Download-progress bar (currently just a spinner).
- Phase 7: Sentry (needs a DSN), full accessibility audit, app icon / splash / store copy,
  final `app.json` `name` + `bundleIdentifier` (blocked on Fr. Morson name/likeness sign-off).
- Phase 8: EAS Build config, TestFlight / Play internal, Apple ($99) + Google ($25) accounts,
  APNs / FCM credentials.
- **Device pass** — nothing has been run on an iOS/Android simulator yet. Verify features on a
  dev build.

---

## How to run / verify

```bash
cd allcatholicmedia-app
npm install
npx tsc --noEmit                    # expect exit 0
npx expo lint                       # only pre-existing errors in (tabs)/community.tsx + use-color-scheme.web.ts
npx expo export --platform web      # bundles all routes, no errors

npx expo start -c                   # Expo Go — most UI + video + avatar + downloads + biometrics
                                    #   (push + reminders + Google sign-in are inert here by design)
npx expo run:android                # dev build — everything, incl. background audio + notifications
npx expo run:ios
```

---

## Housekeeping

- Smoke tests created real rows on **production**: prayer-request ids **1 & 2** (intentions marked
  "automated smoke test") and a few QA member accounts (`acm.qa.*@mailinator.com`, most deleted via
  the account-delete endpoint). Clear the prayer rows from the Botble admin if desired.
- The user's tooling auto-commits app changes as "Working on registration flow".
