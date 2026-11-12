// Round white badge with the team's logo, or its first letter in the
// team's color when there's no logo yet.
export default function TeamLogo({ name = '', logo, side = 'A', size = 40 }) {
  // "Team 1" / "Team 2" show their number, everyone else their first letter.
  const generic = name.trim().match(/^Team (\d+)$/);
  const letter = generic ? generic[1] : (name.trim()[0] || '?').toUpperCase();
  return (
    <span
      className={`team-logo team-logo-${side.toLowerCase()}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.45) }}
      aria-hidden="true"
    >
      {logo ? <img src={logo} alt="" /> : letter}
    </span>
  );
}
