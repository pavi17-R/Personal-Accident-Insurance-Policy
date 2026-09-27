export default function RiskGauge({ score = 0, tier = 'Low', size = 180, label = 'AI Risk Score' }) {
  // Score clamped 0 - 100
  const validScore = Math.max(0, Math.min(100, Number(score) || 0));
  // Angle: -180 deg to 0 deg
  const angle = -180 + (validScore / 100) * 180;
  const radius = 70;
  const cx = 100;
  const cy = 90;

  // Calculate needle tip
  const rad = (angle * Math.PI) / 180;
  const needleX = cx + (radius - 12) * Math.cos(rad);
  const needleY = cy + (radius - 12) * Math.sin(rad);

  const getTierColor = (t) => {
    if (t === 'High') return '#EF4444';
    if (t === 'Medium') return '#F59E0B';
    return '#10B981';
  };

  const tierColor = getTierColor(tier);

  return (
    <div className="risk-gauge-container" style={{ width: size }}>
      <svg className="risk-gauge-svg" viewBox="0 0 200 115">
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="45%" stopColor="#F59E0B" />
            <stop offset="85%" stopColor="#EF4444" />
          </linearGradient>
        </defs>

        {/* Background Arc */}
        <path
          d="M 30 90 A 70 70 0 0 1 170 90"
          fill="none"
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth="14"
          strokeLinecap="round"
        />

        {/* Value Arc */}
        <path
          d="M 30 90 A 70 70 0 0 1 170 90"
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray="220"
          strokeDashoffset={220 - (validScore / 100) * 220}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />

        {/* Center Pivot */}
        <circle cx={cx} cy={cy} r="6" fill="#FFFFFF" />

        {/* Needle Line */}
        <line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke="#FFFFFF"
          strokeWidth="3"
          strokeLinecap="round"
          style={{ transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        />
      </svg>

      <div className="gauge-val-display">
        <div className="gauge-val-num">{validScore}</div>
        <div className={`gauge-val-tier ${tier}`} style={{ color: tierColor }}>
          {tier} Risk
        </div>
        <div style={{ fontSize: 11, color: '#93A9C2', marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}
