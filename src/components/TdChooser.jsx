import Dialog from './Dialog.jsx';

// Touchdown type. Pick-6 only shows right after an interception by the
// same team, with the returner's number already filled in.
export default function TdChooser({ pick6Number, onRun, onPass, onPick6, onCancel }) {
  return (
    <Dialog title="Touchdown Type" body="How was it scored?">
      <button type="button" className="btn btn-secondary" onClick={onRun}>Run TD</button>
      <button type="button" className="btn btn-secondary" onClick={onPass}>Pass TD</button>
      {pick6Number && (
        <button type="button" className="btn btn-secondary" onClick={onPick6}>Pick-6 by #{pick6Number}</button>
      )}
      <button type="button" className="dialog-link" onClick={onCancel}>Cancel</button>
    </Dialog>
  );
}
