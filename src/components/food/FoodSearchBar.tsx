interface FoodSearchBarProps {
  value: string
  onChange: (value: string) => void
}

export function FoodSearchBar({ value, onChange }: FoodSearchBarProps) {
  return (
    <input
      type="search"
      className="input"
      placeholder="Search foods…"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Search foods"
    />
  )
}
