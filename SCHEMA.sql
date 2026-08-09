-- SCHEMA.sql
-- Offline-first nutrition/body-composition tracker.
--
-- Conventions (see CLAUDE.md for the full rationale):
-- - Primary keys: TEXT, UUIDv4, generated client-side. Never autoincrement —
--   they collide across devices once sync exists.
-- - Log dates (date columns): TEXT 'YYYY-MM-DD'. Plain calendar dates,
--   timezone-independent. Never a timestamp.
-- - Bookkeeping timestamps (created_at/updated_at/deleted_at): TEXT, ISO 8601
--   UTC, e.g. '2026-08-09T14:23:00Z'.
-- - Deletion: always set deleted_at. Never DELETE. Every read filters
--   deleted_at IS NULL.
-- - user_id: present on every table. Filter every query by it, even though
--   there is currently only one user.
-- - Units: metric only (kg, cm, g, ml).
-- - Snapshot columns (prefixed s_): copied from the source row at write time,
--   already scaled to the logged quantity. Historical totals read ONLY from
--   these — never recomputed by joining to the current food/meal row.

CREATE TABLE schema_version (
  version INTEGER NOT NULL
);
-- Insert the current version on init; check it on launch; drives migrations.

CREATE TABLE user (
  id          TEXT PRIMARY KEY,
  email       TEXT UNIQUE,           -- null until an online account exists
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  deleted_at  TEXT
);

-- No activity_level: every TDEE calculation in src/lib/calculations uses a
-- fixed sedentary (1.2) multiplier. A column no formula ever reads would be
-- dead schema; see DECISIONS.md.
CREATE TABLE profile (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL REFERENCES user(id),
  height_cm      REAL NOT NULL,
  age            INTEGER NOT NULL,
  sex            TEXT NOT NULL CHECK (sex IN ('male','female')),
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL,
  deleted_at     TEXT
);
-- Partial index, not a table-level UNIQUE: a soft-deleted profile must not
-- block creating a new active one for the same user.
CREATE UNIQUE INDEX ux_profile_user ON profile(user_id) WHERE deleted_at IS NULL;

-- Reference item / catalog. Mutable. Never read directly for historical totals.
CREATE TABLE food (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES user(id),
  code         TEXT,                 -- barcode; nullable for homemade foods
  name         TEXT NOT NULL,
  brand        TEXT,
  serving_size REAL NOT NULL,        -- macros below are PER THIS AMOUNT
  serving_unit TEXT NOT NULL,
  calories     REAL NOT NULL,
  protein_g    REAL NOT NULL,
  carbs_g      REAL NOT NULL,
  fat_g        REAL NOT NULL,
  source       TEXT NOT NULL DEFAULT 'manual'
               CHECK (source IN ('manual','openfoodfacts')),
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL,
  deleted_at   TEXT
);
CREATE INDEX idx_food_user_name ON food(user_id, name);
-- Partial index, not a table-level UNIQUE: a soft-deleted food must not
-- block re-adding the same barcode later.
CREATE UNIQUE INDEX ux_food_user_code ON food(user_id, code) WHERE deleted_at IS NULL;

-- meal IS the recipe model — do not create a separate recipes table.
CREATE TABLE meal (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL REFERENCES user(id),
  name           TEXT NOT NULL,
  total_portions REAL NOT NULL CHECK (total_portions > 0),
  method         TEXT,               -- written steps, nullable
  photo_path     TEXT,               -- filesystem path; NEVER base64 in DB
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL,
  deleted_at     TEXT
);
CREATE INDEX idx_meal_user ON meal(user_id);

CREATE TABLE meal_ingredient (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES user(id),
  meal_id       TEXT NOT NULL REFERENCES meal(id),
  food_id       TEXT REFERENCES food(id),  -- traceability only; may go stale
  quantity      REAL NOT NULL,
  quantity_unit TEXT NOT NULL,
  -- Snapshot, pre-scaled to quantity. Editing the food later never alters a
  -- saved recipe.
  s_name        TEXT NOT NULL,
  s_calories    REAL NOT NULL,
  s_protein_g   REAL NOT NULL,
  s_carbs_g     REAL NOT NULL,
  s_fat_g       REAL NOT NULL,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  deleted_at    TEXT
);
CREATE INDEX idx_meal_ingredient_meal ON meal_ingredient(meal_id);

-- One log table for both individually-logged foods and logged meal portions.
CREATE TABLE diary_entry (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES user(id),
  date          TEXT NOT NULL,       -- 'YYYY-MM-DD'
  source_type   TEXT NOT NULL CHECK (source_type IN ('food','meal')),
  source_id     TEXT,                -- traceability only; nullable, may go stale
  quantity      REAL NOT NULL,       -- servings, or portions if source_type='meal'
  quantity_unit TEXT NOT NULL,
  -- Snapshot, already scaled. ALL daily totals and empirical TDEE read ONLY
  -- from these columns — never recomputed from food/meal.
  s_name        TEXT NOT NULL,
  s_calories    REAL NOT NULL,
  s_protein_g   REAL NOT NULL,
  s_carbs_g     REAL NOT NULL,
  s_fat_g       REAL NOT NULL,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  deleted_at    TEXT
);
CREATE INDEX idx_diary_user_date ON diary_entry(user_id, date);

CREATE TABLE body_log (
  id               TEXT PRIMARY KEY,
  user_id          TEXT NOT NULL REFERENCES user(id),
  date             TEXT NOT NULL,    -- 'YYYY-MM-DD'
  weight_kg        REAL NOT NULL,
  body_fat_percent REAL,
  body_fat_method  TEXT CHECK (body_fat_method IN
                     ('visual_estimate','navy_tape','dexa','bioimpedance')),
  notes            TEXT,
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL,
  deleted_at       TEXT,
  CHECK (body_fat_percent IS NULL OR body_fat_method IS NOT NULL)
);
CREATE INDEX idx_body_log_user_date ON body_log(user_id, date);
-- Partial index, not a table-level UNIQUE: a soft-deleted entry must not
-- block re-logging the same date. This is the upsert target.
CREATE UNIQUE INDEX ux_body_log_user_date ON body_log(user_id, date) WHERE deleted_at IS NULL;
