# DECISIONS.md

Architecture decisions for Plate. Update this file whenever an architectural
choice is made or changed: what was chosen, what the alternative was, and why.

## 2026-08-09 — App shell and core screens

### Routing: react-router in HashRouter mode
**Decision:** `react-router` (v8, library mode — `<Routes>`/`<Route>`/`useNavigate`,
no SSR/framework features), mounted as `HashRouter` (`index.html#/food`, not
`index.html/food`).
**Alternative considered:** `BrowserRouter` (path-based URLs).
**Why:** Capacitor's Android WebView has no server-side SPA fallback. If
Android restores WebView navigation state after the OS kills and resumes
the app process (`Activity.onSaveInstanceState`/`onRestoreInstanceState`,
which Capacitor's bridge implements), a path like `/food` gets re-requested
from the bundled asset server, which 404s — there's no physical `/food/index.html`.
Hash-mode routes never ask the asset server to resolve a sub-path, so this
failure mode can't happen.

### Back button: tab switches replace, in-tab navigation pushes
**Decision:** `BottomTabBar`'s `NavLink`s use `replace`. Navigating from a
tab's list to a detail/edit screen (e.g. Food list → Food edit) uses normal
push navigation.
**Alternative considered:** Every navigation pushes a history entry.
**Why:** If tab taps pushed, casually tapping through all 5 tabs once would
take 5 back-presses just to undo — that reads as broken, not "sensible."
Once history is exhausted, Capacitor's default Android behavior (minimize
the app) takes over on its own; no custom back-button listener was needed.

### Only the Dashboard's selected date is lifted out of its screen
**Decision:** `SelectedDateProvider`/`useSelectedDate` hold just that one
piece of state above the router, in a context. Every other screen's local
state resets normally when its route unmounts.
**Alternative considered:** Keep all 5 tab route trees permanently mounted
(hidden via CSS instead of unmounted), so every tab's state and in-flight
effects persist automatically.
**Why:** The spec named exactly one thing that must survive tab switches.
Keep-alive-all-tabs is the more general fix, but it means every tab's data
fetches and effects stay live in the background at all times — a bigger
architectural commitment than one context for one value. Revisit if more
screens turn out to need this.

### Onboarding also collects a starting weight
**Decision:** `ProfileForm` asks for height/age/sex (`profile`) *and*
current weight, optionally body-fat % + method (seeds the first `body_log`
row on submit).
**Alternative considered:** Onboarding collects only `profile` fields,
literally matching "collects Profile"; Dashboard shows an empty TDEE state
until a future stage adds weight-logging UI.
**Why:** Mifflin-St Jeor and Katch-McArdle both require a current
`weight_kg`, which lives in `body_log`, not `profile`. With no other
weight-entry screen in this stage, staying literal would ship a Dashboard
whose headline feature (active TDEE) never works. Body-fat stays optional.

### `src/services/tdee.ts`: an orchestrator, not a calculation or a plain CRUD module
**Decision:** New module that reads `profile` + `body_log` + the new
`diaryEntry.listDailyCalorieTotals` query, and feeds them into
`selectFormulaTdee`/`computeObservedTdee`.
**Why:** It does real storage reads (disqualifying it from
`src/lib/calculations`, which must stay pure) but does no math of its own
(disqualifying it from being "just" a CRUD file like `food.ts`). It's the
seam CLAUDE.md's invariant 2 describes — service-layer code the UI calls,
that itself calls the pure calculation layer.

### Meals: empty shell this stage, same as Workouts/Recipes
**Decision:** `MealsPage` renders the same `ComingSoon` component as
Workouts/Recipes, despite `meal.ts`/`mealIngredient.ts` already existing.
**Why:** The stage spec detailed Onboarding/Food/Dashboard and explicitly
scoped Workouts+Recipes as shells, but never described a Meals UI (recipe
builder, ingredient picker) at all. Building one anyway would be inventing
a flow nobody specified, not implementing a given one.

## 2026-08-09 — TDEE calculation module

### `profile.activity_level` removed
**Decision:** Dropped the column from `SCHEMA.sql` (and `ProfileRow`,
`CreateProfileInput`).
**Alternative considered:** Keep the column and define explicit per-level
activity multipliers (light/moderate/active/very_active) that the formulas
would select between.
**Why:** Every TDEE formula in `src/lib/calculations` — Mifflin-St Jeor,
Katch-McArdle, both anchor cases — uses a fixed sedentary (1.2) multiplier;
none of them ever reads `activity_level`. A schema column no calculation
reads is dead weight, and adding real per-level multipliers would be a new
feature the spec never asked for, not an implementation of it. Edited
`SCHEMA.sql` directly rather than adding a migration, same as the earlier
UNIQUE-constraint fix — no real installs exist yet to migrate.

### Observed TDEE: fixed trailing 28-day window, not "all logged history"
**Decision:** `computeObservedTdee` always looks at exactly the 28 calendar
days ending at the most recent weight entry. Entries older than that are
ignored outright, not merged or weighted down.
**Alternative considered:** Use the full logging history, with start/end
groups being "the first 7 logged entries" / "the last 7 logged entries"
regardless of how far apart they are in time.
**Why:** An unbounded window means a user who logged heavily in month one
and sparsely since would get a comparison spanning many months, diluting how
"current" the estimate is. A fixed trailing window keeps the estimate
anchored to recent reality, which is the whole point of replacing formulas
with observed data (see the original TDEE spec: "supersedes the formula
estimate" because it reflects *actual*, *current* behavior).

### Group midpoint = mean of entry dates, not the median entry's date
**Decision:** Each 4-7 entry group's "midpoint" (used to compute `days`) is
the arithmetic mean of its entries' day-numbers, not the date of its middle
entry.
**Alternative considered:** Median entry's date (simpler when a group has
exactly 7 entries — just take the 4th).
**Why:** Groups can have anywhere from 4 to 7 entries depending on how
consistently the user logged, so there isn't always a single "middle"
entry. Mean-of-dates works uniformly at any group size from 4 to 7 and
degrades gracefully — this was specified explicitly rather than left for
me to infer.

### Full float precision from calculations; rounding is a display concern
**Decision:** No `Math.round`/`toFixed` anywhere in `src/lib/calculations`.
Tests assert with `toBeCloseTo(expected, 6)`.
**Why:** Rounding intermediate values (e.g. `dailyEnergyBalanceKcal` before
using it in `observedTdee`) would compound error through the pipeline.
Keeping full precision until a UI component formats a number for display
means the stored/computed values stay exact and reproducible.

See `TDEE_CALCULATIONS.md` for the full hand-verification record — every
formula's expected value alongside what the implementation actually
produced.

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

## 2026-08-09 — SQLite data layer

### @capacitor-community/sqlite for storage, driver interface as the seam
**Decision:** `src/services/db/driver.ts` defines a minimal `SqlDriver`
interface (execute/run/query/transaction/close). `capacitorDriver.ts`
implements it against `@capacitor-community/sqlite`. Entity modules
(`food.ts`, `diaryEntry.ts`, etc.) call `getDriver()` from
`db/connection.ts` and never import the Capacitor plugin directly.
**Alternative considered:** Entity modules import `@capacitor-community/sqlite`
directly.
**Why:** `@capacitor-community/sqlite` only runs inside an actual
Android/iOS/web webview — it cannot run under Vitest/Node. A driver
interface lets tests swap in a real SQLite engine (`better-sqlite3`, dev-only
dependency) that runs the exact same SQL, so snapshot/soft-delete/user_id
logic is tested against real SQLite instead of mocks.

### Migrations and "create schema on first launch" are the same code path
**Decision:** `schema_version` starts empty. Migration 1's `up` is the raw
text of `SCHEMA.sql` (imported via Vite's `?raw`, not duplicated). The
runner (`db/migrate.ts`) applies every migration with
`version > MAX(schema_version.version)`, in order, each wrapped in its own
transaction that also inserts its own `schema_version` row. On a brand-new
database that means just migration 1 runs — there's no separate "create
schema" step to keep in sync with the migration list.
**Alternative considered:** A dedicated "if no tables exist, run SCHEMA.sql"
bootstrap path, separate from the migration runner.
**Why:** Two code paths that both create schema (one for fresh installs, one
for upgrades) drift apart over time. One path, driven by `schema_version`,
can't drift because there's only one implementation to change.
**How to add a migration:** add a file to `db/migrations/` exporting
`{ version: N, up: '<sql>' }`, add it to the array in `db/migrations/index.ts`.
The runner picks it up automatically.
**schema_version shape:** one row appended per applied migration (never
updated in place), current version = `MAX(version)` — matches the
insert-only spirit of the rest of the schema (no `UPDATE`, no `DELETE`).

### Macro scaling: one function, one base, used everywhere
**Decision:** `src/lib/calculations/macros.ts` exports exactly two pure
functions: `scaleMacros(macros, quantity, base)` = `macros × (quantity / base)`,
and `sumMacros(list)`. Every place a snapshot gets computed uses the same
`scaleMacros` call, just with a different `base`:
- `meal_ingredient`: `base = food.serving_size`.
- `diary_entry` (source_type='food'): same rule, same base — `quantity` is
  an amount in `quantity_unit`, **not** a bare serving count.
- `diary_entry` (source_type='meal'): `base = meal.total_portions`, applied
  to `sumMacros()` of that meal's active ingredient snapshots.
- `quantity_unit` must equal `food.serving_unit` (food-sourced) or the
  literal string `'portion'` (meal-sourced); writes are rejected otherwise
  since there's no unit-conversion logic.
**Alternative considered:** A different scaling formula for food-logged
amounts vs. recipe ingredients (e.g. treating `diary_entry.quantity` as a
raw serving count multiplied directly, no division).
**Why:** With one rule, logging 150g of a food directly and logging 150g of
that food as a recipe ingredient produce the identical number — that
equality is the correctness check the tests assert. Two different formulas
for the "same" operation is exactly the kind of drift invariant 1 (snapshot
on write) exists to prevent.

### SCHEMA.sql's plain UNIQUE constraints changed to partial unique indexes
**Decision:** `food(user_id, code)`, `profile(user_id)`, and
`body_log(user_id, date)` are now `CREATE UNIQUE INDEX ... WHERE deleted_at
IS NULL` instead of table-level `UNIQUE`.
**Alternative considered:** Leave them as table-level `UNIQUE` and let
re-insertion attempts fail with a constraint error.
**Why:** SQLite's plain `UNIQUE` doesn't know about `deleted_at` — a
soft-deleted food would permanently block ever re-adding its barcode, a
soft-deleted profile would block ever creating a new one, a soft-deleted
body_log entry would block ever re-logging that date. That directly
contradicts what soft-delete is supposed to mean (invariant 5). The partial
index keeps uniqueness among active rows while letting deleted rows get out
of the way. `body_log`'s upsert (`ON CONFLICT (user_id, date) WHERE
deleted_at IS NULL DO UPDATE`) targets this same partial index.

### Snapshot re-derivation on every write, not just creation
**Decision:** `updateMealIngredient`/`updateDiaryEntry` re-fetch the current
active source (food or meal) and recompute the snapshot from it, rather than
proportionally rescaling the stored snapshot. If the source is no longer
active, the update throws.
**Alternative considered:** Rescale the existing snapshot in place
(`newSnapshot = oldSnapshot * newQuantity/oldQuantity`), never re-reading
the source.
**Why:** "Any dated log row copies the macro values at the moment it is
written" (invariant 1) reads naturally as applying to every write to that
row, not only its first one. This only affects deliberately editing a
specific log row's own quantity — it's unrelated to (and doesn't weaken)
the rule that editing the underlying `food` row must never retroactively
change existing snapshots.

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
