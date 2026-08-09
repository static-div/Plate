# DECISIONS.md

Architecture decisions for Plate. Update this file whenever an architectural
choice is made or changed: what was chosen, what the alternative was, and why.

## 2026-08-09 — Initial project setup

### Stack: React + Vite + TypeScript, wrapped with Capacitor for Android
**Alternative considered:** Native Kotlin/Jetpack Compose; React Native.
**Why:** The project needs a single codebase that can plausibly grow toward a
hosted-sync future without a rewrite, and the team's working language is
TypeScript. Capacitor gives a thin native shell around a standard web app
rather than committing to a cross-platform runtime (React Native) the project
doesn't otherwise need for a single-screen-at-a-time offline app.

### No server, no REST API
**Alternative considered:** A local Express/Fastify server inside the app, or
designing around HTTP semantics from day one.
**Why:** The app is offline-first and single-device for now. Modeling storage
as HTTP calls (status codes, endpoints, CORS) would be complexity with no
current payoff. Storage is reached through a plain function-call service
seam instead (see below); it can be swapped for a real network client later
without the UI knowing the difference.

### Snapshot on write for dated log rows
**Decision:** `diary_entry` and `meal_ingredient` (once they exist) copy macro
values at write time into `s_*` columns, pre-scaled to the logged quantity.
Historical totals read only from snapshots, never by joining to the current
`food`/`meal` row.
**Alternative considered:** Always join to the live food/meal table for
totals (normalized, no duplication).
**Why:** Editing a food must never change what a past day shows. The
normalized approach silently rewrites history any time a food's macros are
corrected or a recipe changes.

### The service seam: UI never touches SQLite directly
**Decision:** All storage access goes through `src/services/`. Component code
calls stable function signatures; nothing above that boundary knows SQLite is
the backing store. Same pattern applies to `scanner.js` and `foodLookup.js`.
**Alternative considered:** Query SQLite (or call `capacitor-community/sqlite`)
directly from components/hooks.
**Why:** This is the seam that lets storage be swapped for a hosted backend
later without touching UI code, and it's the only place `user_id` filtering,
`deleted_at` filtering, and `updated_at` bookkeeping need to be enforced.

### Calculations are pure functions in `src/lib/calculations`
**Decision:** No storage access, no React, no side effects. Fully unit
tested. Portable to a server unchanged.
**Alternative considered:** Compute derived values inline in
components/hooks as needed.
**Why:** Nutrition/body-composition math needs to be independently testable
against hand-verified values, and portable if calculations ever need to run
server-side (e.g. for a future sync/consistency check).

### Multi-user-ready schema, single-user now
**Decision:** Every table gets a `user_id` column and every query filters by
it, sourced from a single constant/helper — never hardcoded inline. Only one
user exists today.
**Alternative considered:** Add `user_id` only when a second user actually
shows up.
**Why:** Retrofitting a `user_id` filter onto every existing query later is
far riskier than filtering by a constant from day one.

### Soft delete only
**Decision:** Never `DELETE`; set `deleted_at` and filter `deleted_at IS
NULL` on every read.
**Alternative considered:** Hard deletes, since there's no sync yet to worry
about.
**Why:** Sync (planned, not yet built) needs to know what was deleted and
when. A hard delete today would need to be undone architecturally later.

### Client-generated UUIDv4 primary keys
**Decision:** `TEXT` primary keys, UUIDv4, generated in the app. No
autoincrement integers.
**Alternative considered:** Autoincrement integer IDs (simpler, smaller).
**Why:** Autoincrement IDs collide across devices once sync exists. Client
UUIDs avoid a future migration.

### Styling: CSS custom-property tokens + semantic classes, no Tailwind
**Decision:** `src/styles/tokens.css` defines all design values as CSS
variables; `src/styles/semantic.css` defines the only classes components are
allowed to use (`bg-surface`, `text-muted`, etc.). No raw hex/px in
component code, no raw utility classes.
**Alternative considered:** Tailwind CSS, restricted to semantic aliases via
`@apply`.
**Why:** At this stage (one placeholder screen, no design system yet) plain
CSS variables give the same "only semantic classes allowed" guarantee
without adding a build-pipeline dependency. This can be revisited — noted as
an open question, not a permanent decision — once real screens make the
semantic class list large enough that Tailwind's authoring ergonomics start
to pay for themselves.

### Android target: API 34 (Android 14), min SDK 24
**Decision:** `compileSdkVersion`/`targetSdkVersion` set to 34 to match the
primary test device (Samsung A55, Android 14). `minSdkVersion` left at
Capacitor's default (24).
**Alternative considered:** Target the latest available SDK (36, Capacitor's
default at scaffold time).
**Why:** The only device this app currently needs to run correctly on is a
Samsung A55 on Android 14. Targeting exactly that avoids being surprised by
newer-SDK behavior changes the test device doesn't exhibit; this should be
revisited if the target device's OS is upgraded or a second device is added.
