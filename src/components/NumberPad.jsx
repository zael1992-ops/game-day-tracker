import { useState } from 'react';

export default function NumberPad({ title, onSubmit, onCancel }) {
  const [value, setValue] = useState('');

  function press(digit) {
    if (value.length < 3) setValue(value + digit);
  }

  return (
    <div style={overlayStyle}>
      <div style={modalStyle} className="stack">
        <h3 style={{ margin: 0 }}>{title}</h3>
        <input value={value} readOnly placeholder="Enter player #" style={{ textAlign: 'center', fontSize: 24 }} />
        <div style={gridStyle}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button key={n} onClick={() => press(String(n))}>{n}</button>
          ))}
          <button onClick={() => setValue(value.slice(0, -1))} aria-label="Backspace">&larr;</button>
          <button onClick={() => press('0')}>0</button>
          <button onClick={onCancel}>Cancel</button>
        </div>
        <button disabled={!value} onClick={() => onSubmit(value)}>
          Confirm #{value || '_'}
        </button>
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

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 8,
};
