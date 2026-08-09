export interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ title, message, confirmLabel = 'Confirm', onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="stack">
          <p className="text-lg">{title}</p>
          <p className="text-muted">{message}</p>
        </div>
        <div className="row">
          <button type="button" className="btn btn-secondary btn-block" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger btn-block" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
