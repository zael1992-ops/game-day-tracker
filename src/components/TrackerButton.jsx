// Scoring button: white, 16px corners, 2px stroke all the way around in
// the team's color, bold centered label.
export default function TrackerButton({ children, accent, onClick, style }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        boxSizing: 'border-box',
        borderRadius: 16,
        border: `2px solid ${accent}`,
        background: '#fff',
        color: 'var(--color-text)',
        fontWeight: 700,
        fontSize: 16,
        padding: '14px 12px',
        textAlign: 'center',
        ...style,
      }}
    >
      {children}
    </button>
  );
}
