import { useState, type FormEvent } from 'react'
import type { BodyFatMethod } from '../../lib/calculations/formulaTdee'

export interface ProfileFormResult {
  heightCm: number
  age: number
  sex: 'male' | 'female'
  weightKg: number
  bodyFat: { percent: number; method: BodyFatMethod } | null
}

interface ProfileFormProps {
  onSubmit: (values: ProfileFormResult) => void
  submitLabel?: string
  submitting?: boolean
}

const BODY_FAT_METHODS: { value: BodyFatMethod; label: string }[] = [
  { value: 'visual_estimate', label: 'Visual estimate' },
  { value: 'navy_tape', label: 'Navy tape measurement' },
  { value: 'dexa', label: 'DEXA scan' },
  { value: 'bioimpedance', label: 'Bioimpedance scale' },
]

export function ProfileForm({ onSubmit, submitLabel = 'Save', submitting = false }: ProfileFormProps) {
  const [heightCm, setHeightCm] = useState('')
  const [age, setAge] = useState('')
  const [sex, setSex] = useState<'male' | 'female'>('male')
  const [weightKg, setWeightKg] = useState('')
  const [bodyFatPercent, setBodyFatPercent] = useState('')
  const [bodyFatMethod, setBodyFatMethod] = useState<BodyFatMethod | ''>('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (submitting) return
    const heightNum = Number(heightCm)
    const ageNum = Number(age)
    const weightNum = Number(weightKg)

    if (!heightCm || !age || !weightKg || heightNum <= 0 || ageNum <= 0 || weightNum <= 0) {
      setError('Height, age, and weight are required and must be positive numbers.')
      return
    }
    if (bodyFatPercent && !bodyFatMethod) {
      setError('Choose how the body-fat % was measured, or leave both blank.')
      return
    }
    if (bodyFatMethod && !bodyFatPercent) {
      setError('Enter a body-fat percentage, or leave both blank.')
      return
    }

    setError(null)
    onSubmit({
      heightCm: heightNum,
      age: ageNum,
      sex,
      weightKg: weightNum,
      bodyFat: bodyFatPercent ? { percent: Number(bodyFatPercent), method: bodyFatMethod as BodyFatMethod } : null,
    })
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <div className="field">
        <label className="field-label" htmlFor="height">
          Height (cm)
        </label>
        <input id="height" className="input" type="number" inputMode="decimal" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="age">
          Age
        </label>
        <input id="age" className="input" type="number" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="sex">
          Sex
        </label>
        <select id="sex" className="select" value={sex} onChange={(e) => setSex(e.target.value as 'male' | 'female')}>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </div>
      <div className="field">
        <label className="field-label" htmlFor="weight">
          Current weight (kg)
        </label>
        <input id="weight" className="input" type="number" inputMode="decimal" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="bodyFatPercent">
          Body fat % (optional)
        </label>
        <input
          id="bodyFatPercent"
          className="input"
          type="number"
          inputMode="decimal"
          value={bodyFatPercent}
          onChange={(e) => setBodyFatPercent(e.target.value)}
        />
      </div>
      {bodyFatPercent && (
        <div className="field">
          <label className="field-label" htmlFor="bodyFatMethod">
            How was it measured?
          </label>
          <select
            id="bodyFatMethod"
            className="select"
            value={bodyFatMethod}
            onChange={(e) => setBodyFatMethod(e.target.value as BodyFatMethod)}
          >
            <option value="">Select a method</option>
            {BODY_FAT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      )}
      {error && <p className="field-error">{error}</p>}
      <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
        {submitting ? 'Saving…' : submitLabel}
      </button>
    </form>
  )
}
