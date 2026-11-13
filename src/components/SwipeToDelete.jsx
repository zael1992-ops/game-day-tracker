import { useRef, useState } from 'react';

// Wraps a card so it can be deleted two ways:
//   * swipe it left to reveal a red Delete button, then tap Delete
//   * press and hold it for about half a second
// Both call onDelete, which should ask for confirmation first.
// A normal tap still opens the card. Vertical scrolling is untouched.
const ACTION_WIDTH = 96;
const HOLD_MS = 550;

export default function SwipeToDelete({ children, onDelete, label = 'Delete' }) {
  const [offset, setOffset] = useState(0);
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const start = useRef(null);
  const swallowClick = useRef(false);
  const holdTimer = useRef(null);

  function close() {
    setOpen(false);
    setOffset(0);
  }

  function onPointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    start.current = { x: e.clientX, y: e.clientY, base: open ? -ACTION_WIDTH : 0, axis: null };
    swallowClick.current = false;
    clearTimeout(holdTimer.current);
    holdTimer.current = setTimeout(() => {
      // Held still long enough: treat as a delete request.
      start.current = null;
      swallowClick.current = true;
      close();
      if (navigator.vibrate) navigator.vibrate(15);
      onDelete();
    }, HOLD_MS);
  }

  function onPointerMove(e) {
    const s = start.current;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (!s.axis) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      clearTimeout(holdTimer.current);
      swallowClick.current = true;
      s.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (s.axis === 'x') {
        e.currentTarget.setPointerCapture?.(e.pointerId);
        setDragging(true);
      }
    }
    if (s.axis !== 'x') return;
    setOffset(Math.max(-ACTION_WIDTH * 1.4, Math.min(0, s.base + dx)));
  }

  function onPointerEnd() {
    clearTimeout(holdTimer.current);
    const s = start.current;
    start.current = null;
    setDragging(false);
    if (!s || s.axis !== 'x') return;
    const shouldOpen = offset < -ACTION_WIDTH / 2;
    setOpen(shouldOpen);
    setOffset(shouldOpen ? -ACTION_WIDTH : 0);
  }

  function onClickCapture(e) {
    // After a swipe or hold, or while the Delete button is showing,
    // a tap shouldn't open the card. When open, a tap just closes it.
    if (swallowClick.current || open) {
      e.preventDefault();
      e.stopPropagation();
      if (open && !swallowClick.current) close();
      swallowClick.current = false;
    }
  }

  return (
    <div className="swipe">
      <button
        type="button"
        className="swipe-action"
        style={{ visibility: offset < 0 ? 'visible' : 'hidden' }}
        tabIndex={open ? 0 : -1}
        onClick={() => { close(); onDelete(); }}
      >
        {label}
      </button>
      <div
        className="swipe-front"
        style={{ transform: `translateX(${offset}px)`, transition: dragging ? 'none' : 'transform 0.2s ease' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onPointerLeave={() => clearTimeout(holdTimer.current)}
        onClickCapture={onClickCapture}
        onContextMenu={(e) => e.preventDefault()}
      >
        {children}
      </div>
    </div>
  );
}
