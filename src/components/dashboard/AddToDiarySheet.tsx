import { useState } from 'react'
import { FoodPicker } from '../food/FoodPicker'
import { MealPicker } from '../meal/MealPicker'
import type { FoodRow, MealRow } from '../../services/db/types'

type Selection = { kind: 'food'; item: FoodRow } | { kind: 'meal'; item: MealRow }

interface AddToDiarySheetProps {
  foods: FoodRow[]
  meals: MealRow[]
  onConfirmFood: (food: FoodRow, quantity: number) => void
  onConfirmMeal: (meal: MealRow, portions: number) => void
  onClose: () => void
}

/** Dashboard's "add to today" entry point: choose a food (logged by
 * quantity) or a meal (logged by portion count — snapshotted the same way
 * as Meals' own "log to diary", via the same createDiaryEntry call). */
export function AddToDiarySheet({ foods, meals, onConfirmFood, onConfirmMeal, onClose }: AddToDiarySheetProps) {
  const [tab, setTab] = useState<'food' | 'meal'>('food')
  const [selection, setSelection] = useState<Selection | null>(null)
  const [amount, setAmount] = useState('')

  function handleConfirm() {
    const value = Number(amount)
    if (!selection || !amount || value <= 0) return
    if (selection.kind === 'food') onConfirmFood(selection.item, value)
    else onConfirmMeal(selection.item, value)
  }

  if (!selection) {
    return (
      <div className="sheet-overlay" onClick={onClose}>
        <div className="sheet" onClick={(e) => e.stopPropagation()}>
          <div className="row">
            <button
              type="button"
              className={`btn btn-block ${tab === 'food' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTab('food')}
            >
              Food
            </button>
            <button
              type="button"
              className={`btn btn-block ${tab === 'meal' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTab('meal')}
            >
              Meal
            </button>
          </div>
          {tab === 'food' ? (
            <FoodPicker
              foods={foods}
              onSelect={(food) => {
                setSelection({ kind: 'food', item: food })
                setAmount(String(food.serving_size))
              }}
            />
          ) : (
            <MealPicker
              meals={meals}
              onSelect={(meal) => {
                setSelection({ kind: 'meal', item: meal })
                setAmount('1')
              }}
            />
          )}
        </div>
      </div>
    )
  }

  const amountLabel = selection.kind === 'food' ? `Quantity (${selection.item.serving_unit})` : 'Portions'

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <span className="text-lg">{selection.item.name}</span>
        <div className="field">
          <label className="field-label" htmlFor="diaryAmount">
            {amountLabel}
          </label>
          <input
            id="diaryAmount"
            className="input"
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="row">
          <button type="button" className="btn btn-secondary btn-block" onClick={() => setSelection(null)}>
            Back
          </button>
          <button
            type="button"
            className="btn btn-primary btn-block"
            disabled={!amount || Number(amount) <= 0}
            onClick={handleConfirm}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
