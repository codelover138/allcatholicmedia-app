# Fr. Morson Livingston — Mobile App Implementation Plan

> **Project:** iOS/Android companion app for allcatholicmedia.com
> **Stack:** Expo (React Native) + TypeScript, consuming the Laravel + Botble backend at `../main`
> **Backend reference:** `D:\setup\xammp\htdocs\main` (see its own `IMPLEMENTATION.md` for the CMS side)
> **Last updated:** 2026-08-02

---

## Where this plan comes from

A standalone proposal (artifact: "Fr. Morson Livingston — Mobile App Proposal") specced this app
assuming the backend had **no** API layer yet. That assumption was wrong by the time build started:
`../main` already had a working `/api/app/*` REST layer covering most v1 content screens. This
plan corrects for that — it reflects what's actually true of the codebase, not the original
proposal's discovery section. See the backend audit table below for specifics.

---

## Backend audit (what `../main` gives us vs. what's still missing)

| Capability | Status | Detail |
|---|---|---|
| Content read APIs (home/channels/listen/read/saints/live-now) | ✅ Done | `AppContentController.php` in `../main` |
| Prayer request submission | ✅ Done | `PrayerRequestController::store()` |
| Donate config (presets/currency) | ✅ Done, GET only | `AppContentController::donateConfig()` |
| Token auth (Sanctum) | ✅ Done | `/api/v1/auth/*` (register, login, forgot/reset-password, resend-verification, me, logout, change-password) + `/api/v1/account/*` (profile, avatar, activities, donations, prayer-requests, bookmarks, sessions, devices, delete). Sanctum bearer tokens on the Member model. Standard `{data}` / `{error:{code,message,details}}` envelope. |
| Donation checkout as JSON | ✅ Code done, needs deploy + PayPal sandbox test | New `App\Services\PayPalCheckout` + `App\Http\Controllers\Api\V1\DonationController` in `../allcatholicmedia`: `POST /api/v1/app/donate/checkout` (guest or member) returns a PayPal `approval_url`; `GET /api/v1/app/donate/{return,cancel}/{donation}/{token}` capture and bounce to the app deep link with `?status=…`. The existing web `DonationController` is untouched. `donate.tsx` uses this for signed-in members (`WebBrowser.openAuthSessionAsync`) and falls back to the hosted page for guests / if the endpoint 404s. **Not yet run against a live PayPal sandbox.** |
| Push token registration | ✅ Done | `POST/DELETE /api/v1/account/devices` (token, platform, app_version). App wiring (expo-notifications) not built yet. |
| Search | ✅ Done | `GET /api/v1/app/search` (used by Explore). |
| Live stream playback | ⚠️ Constrained | `LiveStream` model only stores an `embed_url` (YouTube/Vimeo), rewritten to an iframe embed — **no raw HLS/RTMP field**. Mobile playback must use a WebView, not a native HLS player. |
| Saved articles / continue-listening / per-saint notify | ❌ Missing | No tables. Device-local (AsyncStorage) is enough for v1; server sync is v1.1. |
| Community (activity feed/groups/forums) | Exists, web-only | Explicitly out of scope for this app. |

---

## Phase tracker

| Phase | Title | Status |
|---|---|---|
| Phase 1 | Project scaffolding | `[x] DONE` |
| Phase 2 | Core content screens (Home, Live+Channels, Listen, Read, Saints) | `[x] DONE` |
| Phase 0 | Backend gap-fill (auth, push registration, donation JSON checkout) | `[x] Code complete — auth + push-device + search live; donation JSON checkout + prayer visibility added (need: run migrations + PayPal sandbox test)` |
| Phase 3 | Auth & Account | `[x] DONE (client) — sign-in / register / forgot-password / verify-email / profile dashboard / edit profile (+ avatar upload) / account & security (change password, sessions, biometric app-lock, delete).` |
| Phase 4 | Listen & audio player (background playback, offline downloads) | `[x] DONE — expo-audio player (background + lock-screen), show detail, offline downloads (expo-file-system)` |
| Phase 5 | Live Mass playback (WebView player) | `[x] DONE — WebView player + countdown + channel detail; PiP enabled on the WebView` |
| Phase 6 | Prayer Request, Donate, Push | `[x] DONE — Prayer Request form, Donate (hosted checkout), push-token registration, local Rosary/Mass reminders` |
| Phase 7 | Polish (accessibility, crash/analytics, store assets) | `[ ] NOT STARTED` |
| Phase 8 | Beta & store submission | `[ ] NOT STARTED` |

(Phase numbering follows the original plan; Phase 1/2 were done first since they had no backend
dependency, ahead of Phase 0.)

---

## PHASE 1 — Project scaffolding

**Goal:** A working Expo + TypeScript app pointed at the real backend.

- [x] 1.1 Scaffolded with `create-expo-app` (TypeScript + Expo Router template, SDK 57)
- [x] 1.2 Node upgraded to 24.18 LTS (SDK 57/RN 0.86 require Node ≥20.19.4; the environment
      started on Node 18.18, which fails at runtime, not just at install)
- [x] 1.3 Core dependencies installed: `@tanstack/react-query`, `zustand`, `expo-secure-store`,
      `expo-notifications`, `react-native-webview`, `expo-audio`, `expo-video`,
      `react-hook-form`, `zod`, `react-native-track-player`
- [x] 1.4 `npx expo-doctor` — 20/20 checks passing
- [x] 1.5 Typed API client (`src/lib/api-client.ts`) with env-switchable base URL
      (`EXPO_PUBLIC_API_BASE_URL`, defaults to `http://localhost/main/public/api/app`,
      Android-emulator-aware via `10.0.2.2`)
- [x] 1.6 Theme tokens (`src/constants/theme.ts`) — garnet/gold liturgical palette, light + dark
- [x] 1.7 Tab shell — Home · Live · Listen · Read · More, both native
      (`src/components/app-tabs.tsx`) and web (`app-tabs.web.tsx`) variants

**Completion check:** ✅ `npx tsc --noEmit` clean (pre-existing template CSS-module type warnings
aside), `npx expo export --platform web` builds all 5 routes successfully.

---

## PHASE 2 — Core content screens

**Goal:** Every v1 list screen rendering real backend data.

- [x] 2.1 Home (`src/app/index.tsx`) — section summary cards from `GET /home`, live-now banner
- [x] 2.2 Live (`src/app/live.tsx`) — live/upcoming streams from `GET /live-now` + channel
      directory from `GET /channels`, combined into one tab
- [x] 2.3 Listen (`src/app/listen.tsx`) — podcast shows from `GET /listen`
- [x] 2.4 Read (`src/app/read.tsx`) — articles from `GET /read`
- [x] 2.5 More (`src/app/more.tsx`) — saints from `GET /saints`, plus static "coming soon" rows
      for Prayer Request / Donate / Account / Settings
- [x] 2.6 Shared `LoadingState` / `ErrorState` / `EmptyState` components
      (`src/components/query-state.tsx`)

**Completion check:** ✅ Verified live end-to-end on 2026-08-02 with a headless-browser pass
(`expo start --web` + Playwright) against the real local API — confirmed real data rendering
(live Vatican Mass banner, 12 channels with logos, 6 real podcast shows, real article headlines,
real saints) and zero console errors. **Not yet verified on iOS/Android simulators** — web only
so far.

> Simplification note: Saints and Channels are rendered as sections *within* the More/Live tabs
> rather than as their own dedicated routes with per-item detail pages. Individual saint/channel/
> article/episode detail screens are still to be built (see "Not started" below).

---

## PHASE 0 — Backend gap-fill (in `../allcatholicmedia`)

**Status: code complete.** Auth / account / push-device / search were already live. This pass
added the donation JSON checkout and 3-way prayer visibility.

- [x] 0.1 Sanctum auth — `/api/v1/auth/*` + `/api/v1/account/*` (already live before this work).
- [x] 0.2 Push-device registration — `/api/v1/account/devices` (already live).
- [x] 0.3 Donation JSON checkout — **new, additive** (existing web `DonationController`
      untouched):
      - `app/Services/PayPalCheckout.php` — `createOrder()` / `capture()` around PayPal Orders v2.
      - `app/Http/Controllers/Api/V1/DonationController.php` — `checkout` (guest or member) →
        `{ data: { donation_id, approval_url } }`; `return` / `cancel` capture and
        `redirect()->away()` to the app deep link with `?status=completed|cancelled|error`.
        `return_url` is scheme-whitelisted (`mainapp://`, `exp://`, `http://localhost`).
      - `routes/api.php` — `POST v1/app/donate/checkout`, `GET v1/app/donate/{return,cancel}/{donation}/{token}`.
      - `database/migrations/2026_09_08_000002_add_guest_token_to_donations.php` — guarded with
        `Schema::hasColumn` (no-op on prod, which already has the column).
- [x] 0.5 3-way prayer visibility —
      `database/migrations/2026_09_08_000001_add_visibility_to_prayer_requests.php` (adds
      `visibility` string, backfilled from `is_private`), `PrayerRequest::VISIBILITIES`,
      `V1\PrayerRequestController::store` (accepts `visibility`, keeps `is_private` in sync),
      `V1\Account\AccountController::prayerRequests` (returns `visibility`).
- [ ] 0.4 *(v1.1)* saved-articles/notify-me endpoints. Search already exists.

### To deploy this backend pass
```
# in ../allcatholicmedia, on the target environment
php artisan migrate            # runs add_visibility_to_prayer_requests + add_guest_token_to_donations
php artisan route:clear && php artisan config:clear && php artisan optimize
# ensure PayPal creds are set for the environment:
#   PAYPAL_MODE=live  PAYPAL_LIVE_CLIENT_ID=...  PAYPAL_LIVE_CLIENT_SECRET=...
# then smoke-test with a sandbox order:
#   POST /api/v1/app/donate/checkout {"amount":5,"return_url":"mainapp://donate-return"}  (+ Bearer token)
#   open approval_url, approve, confirm the redirect lands on mainapp://donate-return?status=completed
#   and that the Donation row flips to status=completed
```

Also operationally: **the Botble `api_enabled` setting must stay ON** in the target environment
(Admin > Settings > API) — it was found OFF during initial local testing and manually re-enabled;
make sure it's on in staging/production before app store submission too.

---

## PHASE 3 — Auth & Account

**Status: client done (2026-09-07). Backend endpoints live in `../main` (`/api/v1/auth/*`,
`/api/v1/account/*`).**

- [x] 3.1 Sign-in / sign-up screens — `src/app/sign-in.tsx`, `register.tsx`,
      `forgot-password.tsx`, `verify-email.tsx`. Shared form kit in `src/components/form.tsx`
      + `form-screen.tsx`; lightweight validation in `src/lib/form-errors.ts` (no
      `@hookform/resolvers` installed, so RHF+zod was not used).
- [x] 3.2 Secure token storage — `src/lib/auth-store.ts` (zustand + `expo-secure-store`,
      `localStorage` fallback on web). Token + global 401 handling wired into
      `src/lib/api-client.ts` via `setAuthTokenProvider` / `setUnauthorizedHandler`.
      Session restored on cold start from `src/app/_layout.tsx`.
- [x] 3.3 Biometric app-lock — `src/lib/biometrics.ts` (`expo-local-authentication`) +
      `src/components/lock-gate.tsx` (full-screen gate mounted in `_layout`, auto-prompts on
      cold start and on return from background). Opt-in toggle in `account-security.tsx`;
      preference persisted in secure store, mirrored on the auth store as `biometricEnabled`
      / `locked`.
- [x] 3.4 Profile tab (`src/app/profile.tsx`) — guest invitation vs. signed-in dashboard
      (identity card, Saved/Prayers/Gifts stat tiles, menu, recent activity). Sub-screens:
      `account-edit.tsx` (profile fields via `PUT /account`), `account-security.tsx`
      (change password, active sessions, app lock, delete account), `saved.tsx`, `giving.tsx`,
      `my-prayers.tsx` (paginated `useInfiniteQuery` lists).
- [x] 3.5 Avatar upload — `src/lib/image-pick.ts` (`expo-image-picker`, square crop) →
      `POST /account/avatar` (multipart) from `account-edit.tsx`; identity card shows the
      photo or initials.

---

## PHASE 4 — Listen & audio player

**Status: player + navigation done; offline downloads still open.** Built on **`expo-audio`**
(SDK 57), not `react-native-track-player` (which turned out not to be installed and whose New
Arch status was unverified).

- [x] 4.1 Episode list → detail — `src/app/show/[slug].tsx` (paginated `useInfiniteQuery` on
      the v1 `listen/{slug}`), reached from `listen.tsx` (rebuilt: pressable rows, category
      filter chips) and Explore.
- [x] 4.2 Player — `src/components/audio-player.tsx`: module store + `AudioPlayerHost` mounted
      in `_layout` (a docked mini-player + a full-screen modal). `setAudioModeAsync({
      shouldPlayInBackground: true, playsInSilentMode: true, interruptionMode: 'doNotMix' })`
      + `player.setActiveForLockScreen(...)` for lock-screen controls; `app.json` gains
      `ios.infoPlist.UIBackgroundModes: ["audio"]` (Android already had the media
      foreground-service permissions).
- [x] 4.4 Playback speed (1–2× cycle), skip ±15/30 s, tap-to-seek scrubber, lock-screen
      metadata.
- [x] 4.3 Offline downloads — `src/lib/downloads.ts` (zustand + `expo-file-system` `File`/
      `Directory`/`Paths`): files under `<documents>/acm-downloads/` with a `manifest.json`,
      manifest re-verified against disk on launch (`hydrate` in `_layout`). Per-episode
      download / remove control in `show/[slug].tsx`; `src/app/downloads.tsx` lists saved
      episodes with total size + delete; the player prefers the local file when present
      (`localAudioFor`). No-op on web. (Live progress bar not shown — just a downloading
      spinner.)

---

## PHASE 5 — Live Mass playback

**Status: done (except PiP).**

- [x] 5.1 WebView player — `live.tsx` (rebuilt) opens live streams in the existing
      `VideoPlayerHost` (`playVideo(stream.embed_url)`; the YouTube IFrame API player already
      handles `youtube.com/live/…` URLs). Channel rows now navigate to
      `src/app/channel/[slug].tsx` (paginated video list → `playVideo`).
- [x] 5.2 "Next Mass" countdown — upcoming streams show `Starts in 2 hr / 3 days` from
      `scheduled_at`.
- [x] 5.3 Picture-in-picture — `allowsPictureInPictureMediaPlayback` on the WebView, so the
      YouTube player's PiP button works on iOS. (A true native swipe-to-PiP would need a
      native video component.)

---

## PHASE 6 — Prayer Request, Donate, Push

**Status: all three sub-areas built.**

- [x] 6.1 Prayer Request form — `src/app/prayer-request.tsx` → `POST /api/v1/app/prayer-requests`
      (public). Intention + **3-way visibility** (Only me / Prayer team / Community prayer wall
      — "Only me" hidden for guests). Backend now has a `visibility` column
      (`add_visibility_to_prayer_requests` migration) kept in sync with the legacy `is_private`
      boolean; `V1\PrayerRequestController` + `V1\Account\AccountController` accept / return it.
      Name/email prefilled from the member, phone/location optional, follow-up consent, an
      "app is not an emergency service" notice, confirmation state that invalidates
      `['account','prayer-requests']`. Reached from the Pray tab (`src/app/pray.tsx`, rebuilt
      as a hub).
- [x] 6.2 Donate screen — `src/app/donate.tsx`. Reads `GET /donate/config` for currency /
      presets / limits / prayer-message flag. **Signed-in members**: fully native — `POST
      /donate/checkout` → `WebBrowser.openAuthSessionAsync` on the PayPal approval URL →
      catches the `mainapp://donate-return?status=…` redirect → shows the outcome and refreshes
      giving history. **Guests / fallback**: the hosted PayPal page in an in-app browser. Card
      data never touches the app. "Support the mission" buttons across Profile route here.
- [x] 6.3 Push registration — `src/lib/push.ts` (`expo-notifications`): permission prompt,
      Android channel, Expo push token → `POST /api/v1/account/devices` on sign-in,
      `DELETE` on sign-out (wired through `auth-store`).
- [x] 6.4 Local prayer reminders — `src/lib/reminders.ts` + `src/app/reminders.tsx`. Daily
      Rosary (DAILY trigger) and Sunday Mass (WEEKLY trigger) local notifications, time chosen
      from preset chips, prefs in secure store, whole schedule re-applied on every change,
      forced off if notification permission is denied. Reached from the Pray tab and the
      Profile menu.

---

## PHASE 7 — Polish

**Status: not started.**

- [ ] 7.1 Accessibility pass — dynamic text sizing, screen-reader labels, 44×44pt touch targets
- [ ] 7.2 Sentry crash reporting
- [ ] 7.3 App icon, splash screen, store listing copy
- [ ] 7.4 Replace placeholder `app.json` name/bundle ID (`com.allcatholicmedia.frmorsonlivingston`
      per the original proposal) — **blocked on written sign-off** from Fr. Morson Livingston and
      All Catholic Media to use his name/likeness in store metadata

---

## PHASE 8 — Beta & store submission

**Status: not started.**

- [ ] 8.1 EAS Build configuration
- [ ] 8.2 TestFlight + Google Play internal testing
- [ ] 8.3 Apple Developer Program ($99/yr) + Google Play Console ($25 one-time) accounts —
      **needs the user**, not something to set up unilaterally
- [ ] 8.4 APNs / FCM push credentials
- [ ] 8.5 Store submission

---

## Key file locations

| Purpose | Path |
|---|---|
| API client + typed endpoints | `src/lib/api-client.ts`, `src/lib/app-content.ts` |
| Query client setup | `src/lib/query-client.ts` |
| Theme tokens | `src/constants/theme.ts` |
| Tab shell (native / web) | `src/components/app-tabs.tsx` / `app-tabs.web.tsx` |
| Screens | `src/app/index.tsx`, `live.tsx`, `listen.tsx`, `read.tsx`, `more.tsx` |
| Shared loading/error/empty UI | `src/components/query-state.tsx` |
| Backend (separate repo) | `D:\setup\xammp\htdocs\main` |

## Local dev commands

```bash
npm run web       # expo start --web — fastest loop for UI work
npm run ios        # expo start --ios
npm run android     # expo start --android
npx expo-doctor      # environment sanity check
npx tsc --noEmit      # type-check
npx expo export --platform web   # static build smoke-test
```

Backend must be running first (see `CLAUDE.md` → "Local dev environment") — start XAMPP Apache +
MySQL under `D:\setup\xammp`, confirm `Botble > Settings > API` has "Enable API" on.

---

## Non-technical blockers (need a human decision, not code)

- Written sign-off from Fr. Morson Livingston / All Catholic Media to use his name/likeness in
  the app store listing.
- Apple Developer Program and Google Play Console accounts.
- Brand assets (logo, style guide beyond the directional palette in `theme.ts`).
- Confirm PayPal is the sole donation processor going forward (no Stripe exists in the backend
  today) — affects Phase 0.3 scope.

---

*Reading this file: Phase 1/2 are done. Phase 0 (backend) is the critical path — it unblocks
Auth (Phase 3) and two of three Phase 6 sub-areas. Phases 4/5/6.1 have no backend dependency and
can be picked up in parallel with Phase 0. Update the checkboxes here as work lands; don't let
this drift from reality.*
