export default function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={overlayStyle}>
      <div style={modalStyle} className="stack">
        <p style={{ margin: 0 }}>{message}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} style={{ flex: 1 }}>Cancel</button>
          <button
            onClick={onConfirm}
            style={{ flex: 1, background: 'var(--color-danger)', color: '#fff', borderColor: 'var(--color-danger)' }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
  zIndex: 10,
};

const modalStyle = {
  background: 'var(--color-surface)',
  borderRadius: 'var(--radius)',
  width: '100%',
  maxWidth: 320,
};
