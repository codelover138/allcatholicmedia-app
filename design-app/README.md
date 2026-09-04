# Handoff: All Catholic Media — Mobile App

## Overview
A mobile app for allcatholicmedia.com (Fr. Morson Livingston's ministry). Lets members watch/listen/read content, browse saints, pray, join community discussion, and donate. This package hands off the clickable design prototype so it can be rebuilt as a real app (React Native / Flutter / native iOS+Android — your call based on your stack).

## About the Design Files
The included `All Catholic Media App.dc.html` is a **design reference**, not production code. It's an HTML/React-in-a-single-file prototype built to demonstrate layout, flows, and visual design at high fidelity. Do not embed this HTML in the shipped app — **recreate the screens natively** (or in your chosen mobile framework) using your project's existing component library and patterns. If no mobile codebase exists yet, choose the framework that best fits your team (React Native is a reasonable default for a content + auth + payments app like this).

To view the design: open the `.dc.html` file in a browser, or ask Claude to render it.

## Fidelity
**High-fidelity.** Colors, type, spacing, and copy are final per the attached brand guide. Recreate pixel-perfectly where feasible; native platform conventions (e.g. iOS safe areas, Android back gesture) should still take precedence over literal pixel values from the iPhone mock.

## Design Tokens
All values sourced from `BRAND_GUIDELINES.md` (included) — treat that file as the source of truth if anything here conflicts.

**Colors**
- Navy `#0D1F3C` — primary anchor: headings, app bar, nav text, dark surfaces
- Deep navy `#060E1D` — hero/live/immersive backgrounds
- Mid navy `#172B49` — secondary dark surfaces
- Catholic gold `#C9A227` — primary CTAs (navy text on gold, never white), active/selected states
- Gold hover `#A88520` — pressed state for gold controls
- Mission blue `#046BD2` — links, content-type labels, informational
- Crimson `#9B1C1C` — destructive/warning only
- Surface `#FFFFFF`, Soft surface `#F0F4FB`, Border `#DCE4F0`
- Body text `#475569`, Muted text `#718096`
- Dark theme surface `#131B2E` (not built in the prototype — same navy/gold identity, inverted)

**Type**
- Display/editorial: Playfair Display, bold/700 — page titles, saint names, reflection titles
- UI/body: Inter, 400–800 — nav, buttons, forms, body copy

**Shape**
- 8px spacing base (8/12/16/24/32/48)
- Radius: 8px controls, 12–14px cards, 16px large panels, 999px pills (buttons, chips, tab underlines)
- Cards: 1px `#DCE4F0` border + soft navy shadow (`0 2px 8px rgba(13,31,60,0.05)`), never glossy

## Screens / Views

### 1. Home (tab)
- Sticky header: cross glyph + "All Catholic Media" wordmark (Playfair, navy), bell icon right.
- **Live banner** (conditional on an active stream): deep-navy/mid-navy gradient pill, red pulsing dot + "LIVE" + title, gold chevron. Tappable → content detail.
- Greeting: "Peace be with you[, Name]" (Playfair 24px) + tagline.
- **Continue Watching** card: 140px thumbnail (neutral placeholder gradient), gold circular play button, thin progress bar (gold fill), title/source/duration below.
- Two side-by-side cards: **Daily Rosary** (soft surface, cross icon) and **Saint of the Day** (soft surface, star icon).
- **Latest** section: 3 rows, each a 44px icon tile (soft surface + type icon) + type label (blue, uppercase, 10.5px) + title + source/date.

### 2. Explore (tab)
- Title "Explore" (Playfair 22px).
- Search input with magnifying-glass icon, live-filters the list by title/source.
- Filter chips: All / Watch / Listen / Read / Saints — active = gold fill + navy text + navy... no: gold background, navy text; inactive = white + border.
- Content list: rows with 52px icon tile (type icon: play=watch gold, headphones=listen blue, doc=read navy, star=saints gold) + type label + title + source · date · duration + bookmark toggle (outline navy / filled gold).

### 3. Content Detail (opened by tapping any content row/card)
- Full-bleed hero placeholder (220px, neutral gradient) with back chevron (top-left, on a translucent navy pill) and type label overlay (gold, on a bottom navy gradient scrim for legibility).
- Title (Playfair 21px), source · date · duration (muted, 12.5px).
- Actions row: "Open" (gold pill, navy text, primary) + circular bookmark toggle button.
- Body copy paragraph.
- Discussion section: if logged in, a composer input ("Share a reflection, encouragement, or prayer."); if logged out, a tappable "Sign in to join the conversation" prompt (soft surface, blue text) that opens Auth.

### 4. Pray (tab) — intentionally minimal in v1
- Title + one-line intro.
- "Daily Prayer" card (soft surface, cross icon, "Pray Now" gold pill).
- Note card explaining prayer requests (private/prayer-team visibility) ship in a later release, per the brand guide's launch order.

### 5. Community (tab) — intentionally minimal in v1
- Title + one-line intro.
- One editorial-marked sample post (navy "Editorial" pill tag + Fr. Morson attribution + quote).
- Note card explaining member posts/comments/moderation ship in a later release.

### 6. Profile (tab)
- **Logged out**: centered card — cross glyph, "Welcome back to your faith community" (Playfair), one-line value prop, gold "Sign In" pill, soft-surface "Join the Family" pill, outline "Support the Mission" button below the card.
- **Logged in**: avatar (initial in a circle, gold ring) + name + join-date line; a grouped list card (Saved items, My posts, Donation history, Notifications — each with a leading icon and a trailing count/chevron); gold "Support the Mission" pill; crimson-text "Sign Out" below.

### 7. Auth (Login/Register overlay)
- Close (X) top-left.
- Segmented Sign In / Register tabs (active = navy text + gold underline).
- Login: email, password. Register: name, email, password + guidelines/privacy acknowledgment line.
- Primary submit: gold pill ("Sign In" / "Join the Family").
- Footer note: browsing Watch/Listen/Read/Saints doesn't require an account.

### 8. Donate overlay
- Back chevron top-left.
- "Support the Mission" title + one-line impact copy.
- One-time / Monthly segmented toggle (active = navy fill, white text).
- 2×2 grid of preset amounts ($10/$25/$50/$100 — active = gold fill, navy text) + custom-amount input.
- Secure-payment trust note (lock icon + copy) — actual payments must go through a PCI-compliant provider's hosted/native flow; this app should never touch raw card data.
- Gold "Give $X" submit → success state: navy circle + gold checkmark, "Thank you for supporting the mission", amount + receipt note, navy "Done" pill.

## Interactions & Behavior
- Bottom tab bar (Home/Explore/Pray/Community/Profile): 5 icon+label buttons, active = navy + bold, inactive = muted gray.
- All overlays (Auth, Donate, Content Detail) are full-screen, replacing the tab chrome; back/close returns to the previous tab state.
- Bookmark toggle is optimistic/local (no confirmation dialog).
- Filter chips and search combine (AND) in Explore.
- Donate: picking a preset clears any custom amount and vice versa; success state is a separate screen, not a toast.
- No animation timings were specified in the prototype — use 150–250ms fades/slides per the brand guide's motion guidance, and respect `prefers-reduced-motion`.

## State Management (as implemented in the prototype — mirror the shape, not the code)
- `tab`: 'home' | 'explore' | 'pray' | 'community' | 'profile'
- `loggedIn`, `userName`
- `showAuth`, `authMode`: 'login' | 'register', plus form fields
- `showDonate`, `donateAmount`, `donateCustom`, `donateRecurring`, `donateSuccess`
- `selectedContent` (drives the detail overlay)
- `savedIds`: bookmarked content ids
- `exploreFilter`, `searchQuery`

Real implementation needs: auth session (JWT/OAuth), content API (paginated, filterable by type), saved-items sync per user, prayer-request records with visibility enum, community post/comment models with moderation flags, and a payment-provider SDK integration (Stripe, etc.) — none of which exist in the prototype; it's UI-only with local state.

## Assets
No real photography/video/audio is embedded — all thumbnails are neutral placeholder gradients. Replace with actual media before shipping. Icons are hand-drawn inline SVGs (line icons, ~1.8–2px stroke); swap for your icon system of choice or keep the same shapes.

## Files
- `All Catholic Media App.dc.html` — the interactive prototype. **This file only renders inside the design tool it was built in** (it depends on that tool's runtime/custom tags) — don't try to run or embed it in your app. It's included for reference only; use the screenshots below plus this README to rebuild the UI.
- `screenshots/` — PNGs of each screen for visual reference: 01-home, 02-explore, 03-pray, 04-community, 05-profile-logged-out, 06-auth-signin, 07-auth-register. (Content-detail and donate screens aren't captured — see their written specs above.)
- `BRAND_GUIDELINES.md` — the complete brand/voice/UX guide this design implements; treat as the source of truth
