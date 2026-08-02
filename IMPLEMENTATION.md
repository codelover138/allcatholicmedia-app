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
| Token auth (Sanctum) | ❌ Missing | No `api` guard, no `HasApiTokens` on the `Member` model. Web login is session-only. Blocks Account/sign-in, saved items, personalized push. |
| Donation checkout as JSON | ❌ Missing | Existing `DonationController` does a full PayPal Orders v2 flow but via `redirect()->away()` — not callable from a mobile app. Needs a JSON-returning sibling endpoint. |
| Push token registration | ❌ Missing | No table, no endpoint. |
| Search | ❌ Missing | No `/search` route in app scope. |
| Live stream playback | ⚠️ Constrained | `LiveStream` model only stores an `embed_url` (YouTube/Vimeo), rewritten to an iframe embed — **no raw HLS/RTMP field**. Mobile playback must use a WebView, not a native HLS player. |
| Saved articles / continue-listening / per-saint notify | ❌ Missing | No tables. Device-local (AsyncStorage) is enough for v1; server sync is v1.1. |
| Community (activity feed/groups/forums) | Exists, web-only | Explicitly out of scope for this app. |

---

## Phase tracker

| Phase | Title | Status |
|---|---|---|
| Phase 1 | Project scaffolding | `[x] DONE` |
| Phase 2 | Core content screens (Home, Live+Channels, Listen, Read, Saints) | `[x] DONE` |
| Phase 0 | Backend gap-fill (auth, push registration, donation JSON checkout) | `[ ] NOT STARTED` |
| Phase 3 | Auth & Account | `[ ] BLOCKED on Phase 0.1` |
| Phase 4 | Listen & audio player (background playback, offline downloads) | `[ ] NOT STARTED` |
| Phase 5 | Live Mass playback (WebView player) | `[ ] NOT STARTED` |
| Phase 6 | Prayer Request, Donate, Push | `[ ] PARTIAL — Prayer Request form not built; Donate/Push blocked on Phase 0` |
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

## PHASE 0 — Backend gap-fill (in `../main`)

**Status: not started.** Unblocks Phase 3 (Auth) and the Donate/Push parts of Phase 6.

- [ ] 0.1 Install Sanctum: publish config, add `api` guard, add `HasApiTokens` to
      `platform/plugins/member/src/Models/Member.php`, migrate `personal_access_tokens`.
      Add `POST /api/app/auth/login`, `POST /api/app/auth/logout`, `GET /api/app/auth/me`,
      reusing the Member plugin's existing credential-check logic.
- [ ] 0.2 `device_tokens` migration + `POST /api/app/push/register` (token, platform, nullable
      member_id for guests).
- [ ] 0.3 Refactor `DonationController`'s PayPal order logic into a shared service; add
      `POST /api/app/donate/checkout` returning the PayPal approval URL as JSON so the app can
      open it via `expo-web-browser` (existing `/donate/return` and `/donate/cancel` routes stay
      as-is).
- [ ] 0.4 *(v1.1, not a v1 blocker)* `GET /api/app/search`, saved-articles/notify-me endpoints.

Also operationally: **the Botble `api_enabled` setting must stay ON** in the target environment
(Admin > Settings > API) — it was found OFF during initial local testing and manually re-enabled;
make sure it's on in staging/production before app store submission too.

---

## PHASE 3 — Auth & Account

**Status: blocked on Phase 0.1.**

- [ ] 3.1 Sign-in / sign-up screens
- [ ] 3.2 Secure token storage (`expo-secure-store`)
- [ ] 3.3 Biometric unlock (Face ID / fingerprint) after first login
- [ ] 3.4 Account tab — profile, saved articles, listening history

---

## PHASE 4 — Listen & audio player

**Status: not started.** No backend blocker — `listen`/`listen/{slug}` already return
`audio_url`/`embed_url`.

- [ ] 4.1 Episode list → detail navigation (currently Listen only shows the show list, not
      episodes or a player)
- [ ] 4.2 Expanded player screen — background playback via `react-native-track-player`
      (**compatibility with Expo SDK 57 New Architecture not yet verified — check this before
      building further on it**)
- [ ] 4.3 Offline download queue (`expo-file-system`)
- [ ] 4.4 Playback speed control, lock-screen/CarPlay/Android Auto controls

---

## PHASE 5 — Live Mass playback

**Status: not started.**

- [ ] 5.1 WebView-embedded player (`react-native-webview`) for the `embed_url` returned by
      `live-now` — **not** a native HLS player, since the backend has no raw stream URL (see
      backend audit above)
- [ ] 5.2 "Next Mass" countdown fallback when nothing is live
- [ ] 5.3 Picture-in-picture where platform-supported

---

## PHASE 6 — Prayer Request, Donate, Push

**Status: partially started (0/3 sub-areas built).**

- [ ] 6.1 Prayer Request form (`react-hook-form` + `zod`) → `POST /prayer-requests` — **no
      backend blocker, this can be built now**, just hasn't been yet
- [ ] 6.2 Donate screen — blocked on Phase 0.3 (JSON checkout endpoint)
- [ ] 6.3 Push registration + Rosary/Mass reminder scheduling — blocked on Phase 0.2

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
