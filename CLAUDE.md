# CLAUDE.md

Read this before doing anything in this repo. These are project invariants, not
suggestions. If a request conflicts with something here, stop and flag it rather
than silently choosing.

## What this is

An offline-first Android nutrition and body-composition tracker. React + Vite,
wrapped with Capacitor, backed by on-device SQLite. Single user for now,
designed so that hosted accounts and sync can be added later without a rewrite.

There is no server. There is no REST API. Do not add Express, endpoints, HTTP
status codes, or CORS.

## Architecture invariants

**1. Snapshot on write.**
Any dated log row (`diary_entry`, `meal_ingredient`) copies the macro values at
the moment it is written, into its `s_*` columns, already scaled to the logged
quantity. Historical totals are read ONLY from these snapshots. Never recompute
a past total by joining to the current `food` or `meal` row. Editing a food must
never change what a past day shows.

**2. The service seam.**
UI components never touch SQLite. They call the data module (`src/services/`),
whose function signatures and return shapes are stable. Storage lives behind that
boundary so it can later be swapped for a hosted backend. Same pattern applies to
`scanner.js` and `foodLookup.js`.

**3. Calculations are pure.**
Everything in `src/lib/calculations/` is a pure function: no storage access, no
React, no side effects. Fully unit tested. Portable to a server unchanged.

**4. Multi-user ready, single-user now.**
Every table has `user_id`. Every query filters by it, even though there is only
one user. `user_id` comes from a single constant/helper, never hardcoded inline.

**5. Soft delete only.**
Never `DELETE`. Set `deleted_at`. Every read filters `deleted_at IS NULL`. This
exists so deletions can be synced later.

**6. IDs are client-generated UUIDs.**
TEXT primary keys, UUIDv4, generated in the app. Never autoincrement integers —
they collide across devices on sync.

## Data conventions

- Log dates: `TEXT` `'YYYY-MM-DD'`. Plain calendar dates, timezone-independent.
- Bookkeeping times (`created_at`, `updated_at`, `deleted_at`): ISO 8601 UTC,
  e.g. `'2026-08-09T14:23:00Z'`.
- Every write sets `updated_at`. Centralise this in the data module.
- Units are metric only: kg, cm, g, ml.
- Snapshot columns are pre-scaled to the logged quantity, not per-serving.
- `meal` IS the recipe model. Photos and method live on `meal`. Do not create a
  separate recipe table.
- Photos are stored as files on the device filesystem with the path in SQLite.
  Never base64 in the database.

## Styling rules

- All design values live in the token file as CSS variables.
- Components may only use semantic utilities (`bg-surface`, `text-muted`).
  Raw utilities (`bg-blue-500`, `p-4`) and hardcoded hex/px values are forbidden.
- Animate only `transform` and `opacity` — this runs in a webview and animating
  layout properties janks visibly on device.
- Touch targets minimum 44px. Respect safe-area insets.

## Working practices

- Before implementing anything non-trivial: state the plan, flag assumptions,
  and wait. Do not write code and explain afterwards.
- Stay in scope. If asked to change the Foods screen, change only the Foods
  screen. Do not opportunistically refactor.
- Existing tests must pass before a stage is considered done.
- Update `DECISIONS.md` when an architectural choice is made or changed —
  what was chosen, what the alternative was, and why.
- If a request contradicts this file, say so explicitly instead of complying.
- Never introduce a dependency without saying what it is and why it is needed.

## Testing priorities

In order:
1. Pure calculation functions, including spec edge cases (<14 days of data,
   weight-only days, missing days, duplicate dates).
2. Snapshot integrity: edit or delete a food after logging it, and confirm the
   diary entry's values are unchanged.
3. `user_id` filtering and `deleted_at` filtering on every read.

Tests that merely mirror current behaviour are worthless. Assert against
values verified by hand.
## Modularity rules

- No component over ~150 lines. Split into smaller components before that.
- One component per file. A screen is a container that composes small pieces
  (list, row, form, header), not one large file.
- The data module is split by entity (food, meal, diary, body, profile), not
  one monolithic file.
- Shared logic — validation, formatting, scaling — lives in a reusable function
  imported by every caller, never copy-pasted between screens.
- A component that's needed in two places (food search, macro display, date
  selector) is a shared component, not duplicated.
- If you find yourself pasting similar code a second time, stop and extract it.