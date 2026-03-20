import React from 'react';

export default function LevelRing({ xp = 0, level = 1, size = 120 }) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  // Exponential Thresholds: L1 starts at 0, L2 starts at 50, L3 at 107...
  // threshold(L) = 50 * (L-1)^1.1
  const getThreshold = (l) => l <= 1 ? 0 : Math.floor(50 * Math.pow(l - 1, 1.1));
  
  const currentThreshold = getThreshold(level);
  const nextThreshold = getThreshold(level + 1);
  const xpInLevel = xp - currentThreshold;
  const levelRange = nextThreshold - currentThreshold;
  
  const percent = Math.min(Math.max(xpInLevel / levelRange, 0), 1);
  const offset = circumference - percent * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <svg width={size} height={size}>
        <circle stroke="var(--border-color)" fill="transparent" strokeWidth={strokeWidth} r={radius} cx={size/2} cy={size/2} />
        <circle
          stroke="var(--brand-yellow)" fill="transparent" strokeWidth={strokeWidth} r={radius} cx={size/2} cy={size/2}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset: offset, transition: 'stroke-dashoffset 0.5s ease-in-out' }}
          strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
        />
      </svg>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontWeight: 900, fontSize: size*0.25, color: 'var(--text-primary)' }}>Lvl {level}</div>
        <div style={{ fontSize: size*0.1, color: 'var(--text-secondary)' }}>{xp}/{nextThreshold} XP</div>
      </div>
    </div>
  );
}
