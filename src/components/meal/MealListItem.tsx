import type { MealRow } from '../../services/db/types'

interface MealListItemProps {
  meal: MealRow
  onSelect: () => void
  onDelete: () => void
}

export function MealListItem({ meal, onSelect, onDelete }: MealListItemProps) {
  return (
    <div
      className="list-row"
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
    >
      <span>{meal.name}</span>
      <div className="row">
        <span className="text-sm text-muted">{meal.total_portions} portions</span>
        <button
          type="button"
          className="btn btn-icon btn-secondary"
          aria-label={`Delete ${meal.name}`}
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        >
          ×
        </button>
      </div>
    </div>
  )
}
