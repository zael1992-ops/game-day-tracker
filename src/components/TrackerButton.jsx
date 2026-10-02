// A white button, 16px corner radius, with a thick colored edge on
// just the left side (border-left overrides the shorthand border's
// left side since it's declared after it) and a thin neutral border
// on the other three sides for definition.
export default function TrackerButton({ children, accent, onClick, style }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        boxSizing: 'border-box',
        borderRadius: 16,
        border: '1px solid var(--color-border)',
        borderLeft: `8px solid ${accent}`,
        background: '#fff',
        color: 'var(--color-text)',
        fontWeight: 700,
        padding: '10px 16px',
        ...style,
      }}
    >
      {children}
    </button>
  );
}
