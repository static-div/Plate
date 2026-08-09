import type { FoodRow } from '../../services/db/types'

interface FoodListItemProps {
  food: FoodRow
  onSelect: () => void
  onDelete: () => void
}

export function FoodListItem({ food, onSelect, onDelete }: FoodListItemProps) {
  return (
    <div
      className="list-row"
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
    >
      <div className="stack-tight">
        <span>{food.name}</span>
        {food.brand && <span className="text-sm text-muted">{food.brand}</span>}
      </div>
      <div className="row">
        <span className="text-sm text-muted">
          {food.calories} kcal / {food.serving_size}
          {food.serving_unit}
        </span>
        <button
          type="button"
          className="btn btn-icon btn-secondary"
          aria-label={`Delete ${food.name}`}
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
