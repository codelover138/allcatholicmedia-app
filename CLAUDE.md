# CLAUDE.md

Guidance for Claude Code (or any future contributor) working in this repository.

## What this project is

**"Fr. Morson Livingston"** — an iOS/Android companion app for [allcatholicmedia.com](https://allcatholicmedia.com),
built with Expo + React Native. It is a **client app only**: all content (articles, saints,
live streams, podcasts, prayer requests) is served by the existing Laravel + Botble CMS
backend at the sibling repo `../main`. This app does not own any data — it consumes a REST/JSON
API and renders it natively.

The working name "Fr. Morson Livingston" (the ministry's founder) is provisional — using a real
person's name/likeness on the App Store/Play Store listing needs his and All Catholic Media's
explicit written sign-off before it's locked into `app.json` (bundle ID, display name) or store
metadata. Don't treat the current `main_app`/`main_app` naming in `app.json`/`package.json` as final.

## Repository relationship

```
D:\setup\xammp\htdocs\main       ← Laravel 12 + Botble CMS backend (allcatholicmedia.com)
D:\setup\xammp\htdocs\main_app   ← THIS repo — the Expo mobile app
```

They are separate git repos (separate GitHub remotes) developed side by side. When working on
the app, backend behavior/contracts live in `../main`; when an endpoint doesn't exist yet or
doesn't return what the app needs, that's backend work in `../main`, not something to fake here.

The full build plan (phases, stack rationale, what's already built on the backend vs. what's
missing) is `IMPLEMENTATION.md` in this directory — read that before picking up new work.

## Local dev environment

- **Backend**: XAMPP at `D:\setup\xammp` (note: **not** `C:\xampp`, which is a separate unused
  install on this machine). Apache serves `D:\setup\xammp\htdocs`, so the API is at
  `http://localhost/main/public/api/app/*`. Start via `D:\setup\xammp\apache_start.bat` and
  `D:\setup\xammp\mysql_start.bat` (or the XAMPP control panel).
- Botble has an admin-configurable **"Enable API" toggle** (`api_enabled` setting) — if every
  `/api/app/*` call returns `503 {"message":"API is currently disabled..."}`, that's this
  setting, not a bug. Toggle it at Admin > Settings > API, or:
  `php artisan tinker --execute="\Botble\Setting\Facades\Setting::forceSet('api_enabled', true)->save();"`
- **Node**: this project requires Node ≥20.19.4 (currently developed against 24.18 LTS). The
  Expo/RN toolchain will fail at runtime on Node 18 with cryptic errors (e.g.
  `configs.toReversed is not a function`) even though `npm install` appears to succeed —
  `npx expo-doctor` will catch this immediately if something feels off.
- **Run the app**: `npm run web` / `npm run ios` / `npm run android` (thin wrappers around
  `expo start`). Web is the fastest loop for UI work on this machine; native behavior (background
  audio, push, biometrics) can only be verified on device/simulator.

## Architecture

- **Expo Router**, file-based, rooted at `src/app` (see `tsconfig.json`'s `@/*` → `./src/*`
  alias and `app.json`'s router config — the root is `src/app`, *not* the top-level `app/`).
- **Tab shell has two implementations that must be kept in sync**:
  `src/components/app-tabs.tsx` (native, via `expo-router/unstable-native-tabs`) and
  `src/components/app-tabs.web.tsx` (web, via `expo-router/ui`'s `Tabs`/`TabTrigger`, since
  native tabs don't run on web). **If you add/rename/remove a tab route, update both files** —
  missing this is an easy, silent bug (the web tab bar will point at a dead route while native
  looks fine, or vice versa).
- **Data layer**: `src/lib/api-client.ts` (base `fetch` wrapper, env-aware base URL) +
  `src/lib/app-content.ts` (typed request functions + response types, mirrored 1:1 from
  `../main/app/Http/Controllers/Api/AppContentController.php` and `PrayerRequestController.php`
  — when the backend controller's response shape changes, update the types here to match, don't
  drift). Server state is fetched with **TanStack Query** (`src/lib/query-client.ts`,
  `QueryClientProvider` wired in `src/app/_layout.tsx`). Client-only state (player, auth session)
  is planned to use **Zustand** but nothing stateful has needed it yet.
- **Theming**: `src/constants/theme.ts` — a garnet/gold liturgical palette (`accent`, `gold`,
  `live`, etc.) with light/dark variants, consumed via `useTheme()` (`src/hooks/use-theme.ts`)
  and the `ThemedText`/`ThemedView` components. Don't hardcode colors in screens — add a token if
  one doesn't exist.
- **Icons**: tab icons use SF Symbols (`sf=`) / Material icons (`md=`) props directly on
  `NativeTabs.Trigger.Icon` — no custom icon assets needed for the tab bar.

## Current screens (`src/app/`)

| File | Tab | Wired to |
|---|---|---|
| `index.tsx` | Home | `GET /home` (section summary) + `GET /live-now` (banner) |
| `live.tsx` | Live | `GET /live-now` + `GET /channels` |
| `listen.tsx` | Listen | `GET /listen` (podcast shows) |
| `read.tsx` | Read | `GET /read` (articles) |
| `more.tsx` | More | `GET /saints` + static "coming soon" rows (Prayer Request, Donate, Account, Settings — blocked on backend Phase 0, see `IMPLEMENTATION.md`) |
| `profile.tsx` | Profile | `GET /api/v1/account/*` — guest invitation vs. signed-in dashboard |
| `sign-in` / `register` / `forgot-password` / `verify-email` | — | `POST /api/v1/auth/*` (Sanctum bearer tokens) |
| `account-edit` / `account-security` / `saved` / `giving` / `my-prayers` | — | `GET/PUT/DELETE /api/v1/account/*` |
| `pray.tsx` | Pray | hub → prayer request, Angelus, reminders |
| `prayer-request` | — | `POST /api/v1/app/prayer-requests` (public) |
| `donate` | — | `GET /donate/config` + `POST /donate/checkout` (native) / hosted PayPal fallback |
| `reminders` | — | local notifications only (`expo-notifications`), prefs in secure store |
| `listen.tsx` | Listen | `GET /listen` → pressable → `show/[slug]` |
| `show/[slug]` | — | `GET /api/v1/app/listen/{slug}` (paginated) → `audio-player` (`expo-audio`) |
| `live.tsx` | Live | `GET /live-now` + `/channels`; streams → `VideoPlayerHost`, channels → `channel/[slug]` |
| `channel/[slug]` | — | `GET /api/v1/app/channels/{slug}` (paginated) → `VideoPlayerHost` |

> **Native tab bar** is Home · Explore · Pray · Community · Profile (`src/components/app-tabs.tsx`
> and `app-tabs.web.tsx`); the older Live/Listen/Read/More routes still exist as pushable
> screens. The table above lists route files, not just tabs.

Content API paths are relative to `API_BASE_URL` in `api-client.ts`
(`http://localhost/main/public/api/app` in dev). Auth + member-account calls go to
`API_V1_ROOT_URL` (`…/api/v1`); the ambient bearer token is injected by `src/lib/auth-store.ts`.
Most content screens still have no per-item detail routes — that's next.

## Conventions

- Match existing file naming: lowercase-kebab (`app-tabs.web.tsx`, `query-state.tsx`), not
  PascalCase filenames.
- Reuse `LoadingState` / `ErrorState` / `EmptyState` from `src/components/query-state.tsx` for
  any new query-backed screen rather than writing ad-hoc spinners.
- Reuse `ThemedText` / `ThemedView` rather than raw `Text`/`View` + manual color lookups.
- No comments explaining *what* code does — only *why*, and only when non-obvious (matches the
  wider project's style).
- Types for API responses belong in `src/lib/app-content.ts`, kept honest to what the Laravel
  controller actually returns — don't add fields the backend doesn't send.

## Known rough edges (intentional, not bugs to silently "fix")

- `expo-router/unstable-native-tabs` is, as named, an unstable/new Expo API. It's what the
  scaffold shipped with and works fine so far, but keep an eye on Expo release notes if tabs
  misbehave after an SDK bump.
- Metro's dev server re-bundles per full-page navigation rather than doing instant fast-refresh
  in this "static output" Expo Router config — cold navigation between tabs can take 10–20s+ on
  this machine during `expo start --web`. Not a regression, just slow local iteration; native
  (`expo start --ios`/`--android`) doesn't have this specific symptom.
- `react-native-track-player` (installed for background/lock-screen audio) has not yet been
  verified against Expo SDK 57's New Architecture default — first person to wire up the Listen
  player should confirm compatibility before building on top of it.

## What's NOT done yet

See `IMPLEMENTATION.md` for the full phase-by-phase status. Short version: **Phases 3, 4, 5,
and 6 are done** (auth & account; Listen audio player; Live Mass playback; prayer request /
donate / push). That covers sign-in / register / forgot-password / verify-email, profile
dashboard, edit profile (+ avatar upload), account & security (password, sessions, biometric
app-lock, delete), saved / giving / my-prayers, the prayer-request form with 3-way visibility
(`prayer-request.tsx` + `pray.tsx` hub), donation checkout (`donate.tsx` — native PayPal flow
for members via `POST /api/v1/app/donate/checkout` + `PayPalCheckout` in `../allcatholicmedia`,
hosted-page fallback for guests), push-token registration, local Rosary/Mass reminders
(`reminders.tsx`), the **audio player** (`audio-player.tsx` — `expo-audio`, background +
lock-screen, mini + full-screen, speed / skip / seek) with `show/[slug].tsx`, and the rebuilt
`live.tsx` + `channel/[slug].tsx` (live streams reuse the WebView `VideoPlayerHost`).
Backend deploy still pending: `php artisan migrate` in `../allcatholicmedia`
(`add_visibility_to_prayer_requests`, `add_guest_token_to_donations`) + PayPal-sandbox-test the
checkout endpoint — see `IMPLEMENTATION.md` → Phase 0.
Still ahead: offline podcast downloads (Phase 4.3), picture-in-picture (5.3), a couple of
remaining content detail screens (article/saint already exist; video detail does not), the
Community tab, and Phase 7–8 polish / store submission.

> New native modules were added (`expo-local-authentication`, `expo-image-picker`;
> `expo-notifications` was already present) with config plugins in `app.json` — a **dev-client
> rebuild** (`npx expo run:ios` / `run:android`) is required before biometrics / image picker /
> push work on device; they no-op gracefully on web and in Expo Go.
