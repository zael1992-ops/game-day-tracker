import Dialog from './Dialog.jsx';

// Yes/no pop-up. `danger` turns the confirm button red, for actions that
// lose something (ending or abandoning a game).
export default function ConfirmDialog({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = true, onConfirm, onCancel }) {
  return (
    <Dialog title={title} body={message}>
      <div className="dialog-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>{cancelLabel}</button>
        <button type="button" className={`btn ${danger ? 'btn-danger-solid' : 'btn-primary'}`} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
