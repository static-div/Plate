import { sumMacros } from '../../lib/calculations/macros'
import { snapshotMacros, type DiaryEntryRow } from '../../services/db/types'

interface DiaryTotalsProps {
  entries: DiaryEntryRow[]
  activeTdee: number | null
}

export function DiaryTotals({ entries, activeTdee }: DiaryTotalsProps) {
  const totals = sumMacros(entries.map(snapshotMacros))
  const remaining = activeTdee != null ? activeTdee - totals.calories : null

  return (
    <div className="card stack">
      <div className="row-between">
        <span className="field-label">Consumed</span>
        <span className="text-lg">{Math.round(totals.calories)} kcal</span>
      </div>
      <div className="row-between text-sm text-muted">
        <span>{Math.round(totals.protein_g)}g protein</span>
        <span>{Math.round(totals.carbs_g)}g carbs</span>
        <span>{Math.round(totals.fat_g)}g fat</span>
      </div>
      {remaining != null && (
        <div className="row-between">
          <span className="field-label">Remaining</span>
          <span className={`text-lg${remaining < 0 ? ' text-danger' : ''}`}>{Math.round(remaining)} kcal</span>
        </div>
      )}
    </div>
  )
}
