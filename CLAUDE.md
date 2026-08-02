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

All API paths above are relative to `API_BASE_URL` in `api-client.ts`
(`http://localhost/main/public/api/app` in dev). None of these screens have per-item detail
routes yet (tapping an article/channel/show doesn't navigate anywhere) — that's next.

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

See `IMPLEMENTATION.md` for the full phase-by-phase status. Short version: no auth, no donation
flow, no push notifications, no offline downloads, no per-item detail screens, no native audio/
video player yet — all core *list* screens are live against real data; everything interactive
or personalized is still ahead.
