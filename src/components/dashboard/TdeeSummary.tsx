import type { ActiveTdee } from '../../services/tdee'

interface TdeeSummaryProps {
  tdee: ActiveTdee | null
}

export function TdeeSummary({ tdee }: TdeeSummaryProps) {
  if (!tdee) {
    return (
      <div className="card stack-tight">
        <span className="field-label">TDEE</span>
        <span className="text-muted">Log your weight to see this.</span>
      </div>
    )
  }

  const { observed } = tdee

  return (
    <div className="card stack-tight">
      <span className="field-label">
        {observed.status === 'ok' ? 'Your TDEE (based on your actual data)' : 'Your TDEE (formula estimate)'}
      </span>
      <span className="text-xl">{Math.round(tdee.activeTdee)} kcal</span>
      <span className="text-sm text-muted">
        Formula estimate: {Math.round(tdee.formula.anchorTdee)} kcal
        {tdee.formula.secondary &&
          ` · ${Math.round(tdee.formula.secondary.tdee)} kcal ${tdee.formula.secondary.label}`}
      </span>
      {observed.status !== 'ok' && <span className="text-sm text-muted">{observed.reason}</span>}
    </div>
  )
}
