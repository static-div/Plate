import { useState, type FormEvent } from 'react'
import type { CreateMealInput } from '../../services/meal'

interface MealFormProps {
  initial?: Pick<CreateMealInput, 'name' | 'total_portions'>
  onSubmit: (values: Pick<CreateMealInput, 'name' | 'total_portions'>) => void
  submitLabel?: string
}

export function MealForm({ initial, onSubmit, submitLabel = 'Save' }: MealFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [totalPortions, setTotalPortions] = useState(initial ? String(initial.total_portions) : '')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const portionsNum = Number(totalPortions)
    if (!name.trim() || !totalPortions || portionsNum <= 0) {
      setError('Name and a positive portion count are required.')
      return
    }
    setError(null)
    onSubmit({ name: name.trim(), total_portions: portionsNum })
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <div className="field">
        <label className="field-label" htmlFor="mealName">
          Name
        </label>
        <input id="mealName" className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="mealPortions">
          Portions
        </label>
        <input
          id="mealPortions"
          className="input"
          type="number"
          inputMode="decimal"
          value={totalPortions}
          onChange={(e) => setTotalPortions(e.target.value)}
        />
      </div>
      {error && <p className="field-error">{error}</p>}
      <button type="submit" className="btn btn-primary btn-block">
        {submitLabel}
      </button>
    </form>
  )
}
