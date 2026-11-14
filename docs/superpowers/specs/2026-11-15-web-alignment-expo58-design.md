# Design Document: All Catholic Media Mobile App — Web Alignment & Expo 58 Upgrade

**Date:** 2026-11-15  
**Author:** Antigravity & User  
**Status:** In Review  
**Target Branches:** `development` (active work & verification), `main` (production-ready merges)  
**References:** 
- Web App: https://allcatholicmedia.com/
- API Docs / OpenAPI: https://allcatholicmedia.com/api-docs/ (and `openapi.json`)
- Brand Guidelines: [`BRAND_GUIDELINES.md`](file:///d:/Personal/allcatholicmedia/BRAND_GUIDELINES.md)
- Architecture Notes: [`CLAUDE.md`](file:///d:/Personal/allcatholicmedia/CLAUDE.md), [`STATUS.md`](file:///d:/Personal/allcatholicmedia/STATUS.md)

---

## 1. Intent & The Why

All Catholic Media (`allcatholicmedia.com`) serves as a comprehensive spiritual and media hub for Catholics globally, providing Daily Mass, Gospel reflections, Saint biographies, liturgical podcasts, pastoral announcements, prayer intercession, and community fellowship.

The mobile app must deliver a native, first-class Catholic media experience faithful to the web portal's features and devotional depth. The user experience must reflect sacred elegance—solemn dark backgrounds, liturgical gold accents, sacred typography, and bespoke layouts—deliberately steering clear of generic AI templates, cheap badge clutter, or flat corporate SaaS aesthetics.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
1. **Expo SDK 58 Stability**: Maintain 100% clean compilation, zero TypeScript errors (`npx tsc --noEmit`), and verified web and native bundling under Expo SDK 58 / React 19.3 / React Native 0.88.
2. **Complete Web Feature Parity**: Implement all active endpoints exposed in the official OpenAPI specification:
   - **Prayer Wall & Intercessions**: Public prayer requests with the "I Prayed for This" (`/pray`) counter and category filters.
   - **Community Hub**: Forum topics with threaded replies, active interest groups (join/leave), and community activity feed with likes.
   - **Galleries & Sacred Art**: Curated photo and event galleries with high-resolution lightbox views.
   - **Reflections & Saint Comments**: Interactive comment sections on articles and saint biographies with authenticated submission.
   - **Pastoral Announcements & Pages**: Dynamic alert banners, about/mission pages, and newsletter subscription.
3. **Branching & Delivery Governance**: All features, bug fixes, and spikes are developed and verified in `development`. Changes are merged into `main` only after verified tests, lint, and end-to-end bundling.
4. **Bespoke Liturgical UI**: Design every screen in harmony with the church's aesthetic tradition (garnet `#8B1E3F`, liturgical gold `#D4AF37`, midnight ground `#081524`, Marian blue/cream highlights, elegant serif/sans typography, subtle church backdrop scrim).

### Non-Goals
- Altering the backend Laravel CMS (`../main` / `allcatholicmedia.com`). The app consumes existing API contracts without mocking or inventing undocumented backend routes.
- Web payment gateways requiring server-side webhooks (native PayPal approval deep-linking is used as configured in Phase 6).

### Anti-Goals
- **No Generic AI Clichés**: Avoid ubiquitous AI card templates, random bright badges, cookie-cutter floating action pills, and low-contrast generic corporate components.
- **No Regressions**: Existing high-value modules (such as background audio playback via `expo-audio`, offline downloads via `expo-file-system`, and biometric lock via `expo-local-authentication`) must never be broken or swapped for unvetted third-party packages.

---

## 3. Approaches Considered

### Approach 1: Incremental Phase-by-Phase Upgrade (Selected)
- **Concept**:
  1. Complete Expo 58 dependency reconciliation and run dev server verification.
  2. Implement missing API clients & typed queries incrementally (`prayer-wall`, `community`, `galleries`, `comments`, `announcements`).
  3. Build dedicated screens and components respecting the existing stack (`src/app/`, TanStack Query, Zustand).
  4. Perform rigorous end-to-end testing on web and simulator builds before promotion to `main`.
- **Trade-offs**: Requires methodical testing per module, but ensures rock-solid stability and zero regressions.

### Approach 2: Monolithic Redesign / Complete Screen Overhaul
- **Concept**: Rewrite all navigation and routes at once to mimic the website DOM structure.
- **Trade-offs**: High risk of breaking working native features (background audio, biometric lock, native tabs), high chance of routing bugs, difficult to test incrementally. (Rejected).

---

## 4. Architecture & Technical Design

### 4.1 Dependency & Runtime Stack
- **Expo SDK**: 58.0.0 (Expo Router ~58.0.31)
- **React / React Native**: React 19.3.0, React Native 0.88.1
- **Node**: ≥ 20.19.4 (Current environment: Node v24.20.0 LTS)
- **State & Data Layer**: TanStack Query (`@tanstack/react-query`) with infinite queries for paginated lists, Zustand for lightweight client states (audio playback, auth session, offline downloads).
- **Styling & Theming**: `useTheme()` hook connected to liturgical palette tokens (`Colors.light` & `Colors.dark`).

### 4.2 Data Layer & API Extensions (`src/lib/app-content.ts` & `src/lib/api-client.ts`)
New typed endpoints mapped 1:1 to OpenAPI:
1. **Prayer Wall**:
   - `GET /api/v1/app/prayer-wall` (paginated list of approved public prayers)
   - `POST /api/v1/app/prayer-wall/{id}/pray` (increment prayer count)
2. **Community**:
   - `GET /api/v1/community/forum/categories`
   - `GET /api/v1/community/forum/categories/{slug}/topics`
   - `GET /api/v1/community/forum/topics/{slug}`
   - `POST /api/v1/community/forum/topics/{slug}/replies`
   - `GET /api/v1/community/groups` & `GET /api/v1/community/groups/{slug}`
   - `POST /api/v1/community/groups/{slug}/join` & `/leave`
   - `GET /api/v1/community/feed` & `POST /api/v1/community/feed/{id}/like`
3. **Galleries**:
   - `GET /api/v1/app/galleries`
   - `GET /api/v1/app/galleries/{slug}`
4. **Comments**:
   - `GET /api/v1/app/read/{slug}/comments` & `POST /api/v1/app/read/{slug}/comments`
   - `GET /api/v1/app/saints/{slug}/comments` & `POST /api/v1/app/saints/{slug}/comments`
5. **Announcements & Static Pages**:
   - `GET /api/v1/app/announcements`
   - `GET /api/v1/app/pages/{slug}`
   - `POST /api/v1/app/newsletter/subscribe`

### 4.3 UI & Navigation Structure (Builder Decisions)
- **Community Tab Architecture**:
  - Segmented top controller with 3 tabs: **Feed** (community activity stream), **Forums** (categories & discussion topics), and **Groups** (parish/ministry groups with join/leave).
  - Scope: Focused on safe engagement (reading feeds, liking, joining groups, browsing forum topics, and posting replies). Arbitrary top-level public post creation is gated until backend moderation endpoints are live to satisfy Apple Guideline 1.2 and brand safety.
- **Prayer Wall Architecture**:
  - `(tabs)/pray.tsx` remains the devotional sanctuary (Angelus, Daily Rosary, Prayer Request submission).
  - A prominent, elegant liturgical card "Community Prayer Wall" navigates to a dedicated `/prayer-wall` screen with intention categories, pull-to-refresh, and live "I Prayed for This" intercession counters.
- **Galleries Discovery**:
  - A dedicated "Sacred Galleries" browse section in `Explore` and `/galleries` screen, pushing into high-resolution photo viewer `/gallery/[slug]`.
- **Announcements & Static Pages**:
  - Dismissible liturgical gold notice banner on `Home` (`index.tsx`), with a link to view full notices in `/announcements`.
  - Static pages (About Us, Mission, Privacy Policy, Terms) accessible via `Profile` tab menu, navigating to `/page/[slug]`.

---

## 5. Verification & Quality Gates

Before merging any code to `main` or presenting work as complete:
1. `npx tsc --noEmit` must pass with zero errors.
2. `npx expo export --platform web` must successfully bundle all routes.
3. Dev server verification: live check on `http://localhost:8081`.
4. Visual inspection: verify layouts, dark/light contrast, tap targets, and clean error/empty states.
5. Git discipline: commit only well-scoped changes to `development`, review diff, and merge into `main` cleanly.
