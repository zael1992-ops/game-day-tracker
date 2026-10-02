// Parses a pasted block of roster text into [{ number, name }] pairs.
// Tolerant of whatever line breaks or spacing a real copy-paste
// happens to produce - built and tested against an actual roster
// page's copied text, which came through as "104 Name 103 Name2 ..."
// with no reliable line breaks between entries.
//
// Strategy: find every jersey number (1-3 digits, an optional
// leading # is fine), then take everything up to the next number as
// that player's name, collapsing any internal whitespace/newlines
// into single spaces.
export function parseRosterPaste(text) {
  const matches = [...text.matchAll(/#?(\d{1,3})\s+([^\d#]+)/g)];
  return matches
    .map((m) => ({
      number: m[1],
      name: m[2].replace(/\s+/g, ' ').trim(),
    }))
    .filter((r) => r.name.length > 0);
}
