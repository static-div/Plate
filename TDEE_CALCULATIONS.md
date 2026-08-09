# TDEE calculation record

Verification record for `src/lib/calculations/{bmr,formulaTdee,observedTdee}.ts`.
Every value below was hand-derived before the code was written, then checked
against the actual implementation's output. All 20 tests in this record
passed on first run — see the exact commands at the bottom to reproduce.

Formulas implemented exactly as specified — not approximated, not "improved":

```
Mifflin-St Jeor BMR:
  male:   10*weight_kg + 6.25*height_cm - 5*age + 5
  female: 10*weight_kg + 6.25*height_cm - 5*age - 161
  TDEE_sedentary = BMR * 1.2

Katch-McArdle (requires body_fat_percent):
  LBM = weight_kg * (1 - body_fat_percent/100)
  BMR = 370 + 21.6 * LBM
  TDEE_sedentary = BMR * 1.2
```

The activity multiplier is fixed at 1.2 for every case above — `profile`
has no `activity_level` column (removed; see DECISIONS.md).

## Anchor selection (`selectFormulaTdee`)

| Case | Inputs | Expected (hand) | Actual (implementation) | Test |
|---|---|---|---|---|
| No body-fat entry | 80kg/180cm/30/male | anchor=2136, katch=null | `anchorTdee: 2136, katchTdee: null` | `formulaTdee.test.ts` "anchors on Mifflin-St Jeor alone..." |
| `visual_estimate`, 20% BF | same + 20% BF | anchor=2136, secondary=2102.88 | `anchorTdee: 2136, katchTdee: 2102.88, secondary: {tdee: 2102.88, label: 'based on an unmeasured estimate'}` | "...shows Katch as a labeled secondary..." |
| `navy_tape`, 20% BF | same + 20% BF | anchor=(2136+2102.88)/2=2119.44 | `anchorTdee: 2119.44` | "...average of Mifflin and Katch..." |
| `dexa` / `bioimpedance` | same + 20% BF | anchor=2119.44 (same as navy_tape) | `anchorTdee: 2119.44` for both | "treats dexa and bioimpedance the same..." |

## BMR / Katch-McArdle

| Case | Inputs | Expected (hand) | Actual (implementation) |
|---|---|---|---|
| Mifflin, male | 80kg, 180cm, 30y | BMR=1780, TDEE=2136 | `1780`, `2136` |
| Mifflin, female | 65kg, 165cm, 28y | BMR=1380.25, TDEE=1656.3 | `1380.25`, `1656.3` |
| Katch-McArdle | 80kg, 20% BF | LBM=64, BMR=1752.4, TDEE=2102.88 | `1752.4`, `2102.88` |

## Observed TDEE (`computeObservedTdee`) — trailing 28-day window

Algorithm: window = 28 calendar days ending at the most recent weight entry
(day 28); start group = entries falling in days 1-7, end group = days 22-28;
each group needs >=4 entries; group midpoint = mean of the group's day
numbers; `days` = end midpoint − start midpoint; calorie coverage over the
full 28-day window must be >=50%; `dailyEnergyBalanceKcal = (endAvg −
startAvg) × 7700 / days`; `observedTdee = avgLoggedCalories −
dailyEnergyBalanceKcal`.

### Happy path

Window = Jan 1–28, 2026. Start group (days 1-7, 5 entries, gaps on Jan 3/5):
`80.0, 79.9, 79.8, 79.7, 79.6`. End group (days 22-28, 4 entries — the
minimum, gaps on Jan 23/25/27): `79.0, 78.9, 78.8, 78.7`. Calories logged on
14 of 28 days (exactly the 50% floor), sum=27800.

| Value | Hand-derived | Actual (implementation) |
|---|---|---|
| `startAvgWeightKg` | 399.0/5 = **79.8** | `79.8` |
| `endAvgWeightKg` | 315.4/4 = **78.85** | `78.85` |
| start midpoint (day #) | (1+2+4+6+7)/5 = **4** | — |
| end midpoint (day #) | (22+24+26+28)/4 = **25** | — |
| `days` | 25−4 = **21** | `21` |
| `dailyEnergyBalanceKcal` | −7315/21 = **−348.333333…** | `-348.3333333333344` (float noise at digit 13, within tolerance) |
| `avgLoggedCalories` | 27800/14 = **1985.714286…** | `1985.7142857142858` |
| `observedTdee` | 49015/21 = **2334.047619…** | `2334.04761904762` |

### Edge cases

| Case | Setup | Expected | Result |
|---|---|---|---|
| No weight entries | `computeObservedTdee([], [])` | `insufficient_data` | ✅ pass |
| Start group < 4 entries | drop Jan 6 & 7 from the start group (3 left) | `insufficient_data` | ✅ pass |
| Calorie coverage < 50% | only 10 of 28 window days have calories (~35.7%) | `insufficient_data` | ✅ pass |
| Max lookback | add a weight entry (Dec 15, 2025, `999.0`) and calorie entry (Dec 20, 2025, `5000`) far before the window | identical to happy-path result — pre-window entries fully ignored | ✅ pass |
| Duplicate date, overwrite | insert a stale `999.0` for Jan 1 *before* the real `80.0` entry | identical to happy-path result — last occurrence wins, group stays at 5 entries not 6 | ✅ pass |

## Reproducing this record

```
npx vitest run --reporter=verbose src/lib/calculations
```

Result at time of writing: **20 tests, 20 passed** (`bmr.test.ts`: 3,
`formulaTdee.test.ts`: 4, `observedTdee.test.ts`: 6, `macros.test.ts`: 5,
`roundTo.test.ts`: 2). Full project suite: **57 tests, 57 passed**
(`npx vitest run`).
