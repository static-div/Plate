import { useState, type FormEvent } from 'react'
import type { CreateFoodInput } from '../../services/food'

interface FoodFormProps {
  initial?: CreateFoodInput
  onSubmit: (values: CreateFoodInput) => void
  submitLabel?: string
}

export function FoodForm({ initial, onSubmit, submitLabel = 'Save' }: FoodFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [brand, setBrand] = useState(initial?.brand ?? '')
  const [code, setCode] = useState(initial?.code ?? '')
  const [servingSize, setServingSize] = useState(initial ? String(initial.serving_size) : '')
  const [servingUnit, setServingUnit] = useState(initial?.serving_unit ?? 'g')
  const [calories, setCalories] = useState(initial ? String(initial.calories) : '')
  const [proteinG, setProteinG] = useState(initial ? String(initial.protein_g) : '')
  const [carbsG, setCarbsG] = useState(initial ? String(initial.carbs_g) : '')
  const [fatG, setFatG] = useState(initial ? String(initial.fat_g) : '')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const values: CreateFoodInput = {
      name: name.trim(),
      brand: brand.trim() || null,
      code: code.trim() || null,
      serving_size: Number(servingSize),
      serving_unit: servingUnit.trim(),
      calories: Number(calories),
      protein_g: Number(proteinG || 0),
      carbs_g: Number(carbsG || 0),
      fat_g: Number(fatG || 0),
      source: 'manual',
    }
    if (!values.name || !values.serving_unit || values.serving_size <= 0 || values.calories < 0) {
      setError('Name, serving unit, a positive serving size, and calories are required.')
      return
    }
    setError(null)
    onSubmit(values)
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <div className="field">
        <label className="field-label" htmlFor="foodName">
          Name
        </label>
        <input id="foodName" className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="foodBrand">
          Brand (optional)
        </label>
        <input id="foodBrand" className="input" value={brand} onChange={(e) => setBrand(e.target.value)} />
      </div>
      <div className="row">
        <div className="field">
          <label className="field-label" htmlFor="servingSize">
            Serving size
          </label>
          <input
            id="servingSize"
            className="input"
            type="number"
            inputMode="decimal"
            value={servingSize}
            onChange={(e) => setServingSize(e.target.value)}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="servingUnit">
            Unit
          </label>
          <input id="servingUnit" className="input" value={servingUnit} onChange={(e) => setServingUnit(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label className="field-label" htmlFor="calories">
          Calories (per serving)
        </label>
        <input id="calories" className="input" type="number" inputMode="decimal" value={calories} onChange={(e) => setCalories(e.target.value)} />
      </div>
      <div className="row">
        <div className="field">
          <label className="field-label" htmlFor="protein">
            Protein (g)
          </label>
          <input id="protein" className="input" type="number" inputMode="decimal" value={proteinG} onChange={(e) => setProteinG(e.target.value)} />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="carbs">
            Carbs (g)
          </label>
          <input id="carbs" className="input" type="number" inputMode="decimal" value={carbsG} onChange={(e) => setCarbsG(e.target.value)} />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="fat">
            Fat (g)
          </label>
          <input id="fat" className="input" type="number" inputMode="decimal" value={fatG} onChange={(e) => setFatG(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label className="field-label" htmlFor="code">
          Barcode (optional)
        </label>
        <input id="code" className="input" value={code} onChange={(e) => setCode(e.target.value)} />
      </div>
      {error && <p className="field-error">{error}</p>}
      <button type="submit" className="btn btn-primary btn-block">
        {submitLabel}
      </button>
    </form>
  )
}
