// Shared pop-up: dims the screen and shows a white card with a title,
// optional body text, and whatever actions are passed as children.
export default function Dialog({ title, body, children, labelledBy = 'dialog-title' }) {
  return (
    <div className="dialog-overlay">
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
        {title && <h2 className="dialog-title" id={labelledBy}>{title}</h2>}
        {body && <p className="dialog-body">{body}</p>}
        {children}
      </div>
    </div>
  );
}
