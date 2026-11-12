import { useState } from 'react';
import Dialog from './Dialog.jsx';

// Jersey number entry. When the team has a roster, the matching player's
// name shows under the number so the tracker can confirm it's the right
// person before saving.
export default function NumberPad({ title, names = {}, teamName, onSubmit, onCancel }) {
  const [value, setValue] = useState('');

  function press(digit) {
    if (value.length < 3) setValue(value + digit);
  }

  const match = value && names[value];

  return (
    <Dialog title={title}>
      <div className="numpad-display" aria-live="polite">
        {value ? `#${value}` : <span className="numpad-placeholder">#</span>}
      </div>
      <p className="numpad-match">
        {match ? `${match}${teamName ? `, ${teamName}` : ''}` : value ? 'Not on the roster' : 'Enter the jersey number'}
      </p>
      <div className="numpad-grid">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => (
          <button key={n} type="button" className="numpad-key" onClick={() => press(n)}>{n}</button>
        ))}
        <button type="button" className="numpad-key numpad-key-small" onClick={() => setValue(value.slice(0, -1))}>Delete</button>
        <button type="button" className="numpad-key" onClick={() => press('0')}>0</button>
        <button type="button" className="numpad-key numpad-key-small" onClick={() => setValue('')}>Clear</button>
      </div>
      <button type="button" className="btn btn-primary" disabled={!value} onClick={() => onSubmit(value)}>
        {value ? `Confirm #${value}` : 'Confirm'}
      </button>
      <button type="button" className="dialog-link" onClick={onCancel}>Cancel</button>
    </Dialog>
  );
}
