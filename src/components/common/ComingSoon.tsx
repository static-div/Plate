export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="empty-state">
      <p className="heading">{title}</p>
      <p className="text-muted">Coming soon.</p>
    </div>
  )
}
