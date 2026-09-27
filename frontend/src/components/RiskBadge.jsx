// Small colored pill for a Low/Medium/High risk or fraud level, used on
// policy and claim screens (distinct from StatusBadge, which is for
// workflow statuses like Active/Approved/etc).
export default function RiskBadge({ level, label }) {
  if (!level) return <span className="risk-badge Low">Not assessed</span>;
  return <span className={`risk-badge ${level}`}>{label ? `${label}: ${level}` : level}</span>;
}
