import { useState } from 'react'
import type { FoodRow } from '../../services/db/types'
import { FoodPicker } from '../food/FoodPicker'

interface QuickAddSheetProps {
  foods: FoodRow[]
  onConfirm: (food: FoodRow, quantity: number) => void
  onClose: () => void
}

export function QuickAddSheet({ foods, onConfirm, onClose }: QuickAddSheetProps) {
  const [selected, setSelected] = useState<FoodRow | null>(null)
  const [quantity, setQuantity] = useState('')

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        {!selected ? (
          <>
            <span className="text-lg">Add food</span>
            <FoodPicker
              foods={foods}
              onSelect={(food) => {
                setSelected(food)
                setQuantity(String(food.serving_size))
              }}
            />
          </>
        ) : (
          <>
            <span className="text-lg">{selected.name}</span>
            <div className="field">
              <label className="field-label" htmlFor="quickAddQuantity">
                Quantity ({selected.serving_unit})
              </label>
              <input
                id="quickAddQuantity"
                className="input"
                type="number"
                inputMode="decimal"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="row">
              <button type="button" className="btn btn-secondary btn-block" onClick={() => setSelected(null)}>
                Back
              </button>
              <button
                type="button"
                className="btn btn-primary btn-block"
                disabled={!quantity || Number(quantity) <= 0}
                onClick={() => onConfirm(selected, Number(quantity))}
              >
                Add
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
