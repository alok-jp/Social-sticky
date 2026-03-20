import React from 'react';

// Shared tier system configuration (matches AuraRing)
const TIER_BANDS = [
  { label: 'RECRUIT',    icon: '🥉', color: '#94A3B8', accent: '#CBD5E1', min: 1,  max: 4  },
  { label: 'FRONTLINER', icon: '⚔️',  color: '#38BDF8', accent: '#7DD3FC', min: 5,  max: 9  },
  { label: 'MACHINE',    icon: '⚙️',  color: '#34D399', accent: '#6EE7B7', min: 10, max: 19 },
  { label: 'WARLORD',    icon: '🛡️',  color: '#FB923C', accent: '#FCD34D', min: 20, max: 34 },
  { label: 'OVERLORD',   icon: '👑',  color: '#C084FC', accent: '#F0ABFC', min: 35, max: 49 },
  { label: 'LEGEND',     icon: '🗿',  color: '#FBBF24', accent: '#FDE68A', min: 50, max: Infinity },
];

function getThreshold(l) {
  if (l <= 1) return 0;
  return Math.floor(120 * Math.pow(l - 1, 2.2));
}

function getTierBand(level) {
  if (level < 5)   return TIER_BANDS[0];
  if (level < 10)  return TIER_BANDS[1];
  if (level < 20)  return TIER_BANDS[2];
  if (level < 35)  return TIER_BANDS[3];
  if (level < 50)  return TIER_BANDS[4];

  const idx = Math.floor((level - 50) / 10) % TIER_BANDS.length;
  // Make a clone so we can update min/max visually for repeated bands
  const band = { ...TIER_BANDS[idx] };
  band.min = 50 + Math.floor((level - 50) / 10) * 10;
  band.max = band.min + 9;
  if(level >= 50) {
    band.label = `LEGEND ${Math.floor((level - 50) / 10) + 1}`;
  }
  return band;
}

export default function TierProgressBar({ user }) {
  const { aura = 0, level = 1 } = user || {};
  
  const currentTier = getTierBand(level);
  
  // To avoid dealing with "Infinity" directly in the UI if Legend, we look at the next tier band
  const nextLevelBound = currentTier.max + 1; 
  const nextTier = getTierBand(nextLevelBound);

  // We want the progress bar to show progress starting from the MINIMUM aura of the current tier 
  // to the MINIMUM aura of the NEXT tier.
  const tierStartAura = getThreshold(currentTier.min);
  const tierEndAura = getThreshold(nextLevelBound);
  
  const auraInTier = Math.max(0, aura - tierStartAura);
  const tierAuraNeeded = tierEndAura - tierStartAura;
  const progress = Math.min(100, Math.max(0, (auraInTier / tierAuraNeeded) * 100));

  return (
    <div style={{
      background: 'linear-gradient(145deg, rgba(20,20,35,0.6) 0%, rgba(10,10,20,0.8) 100%)',
      border: `1px solid ${currentTier.color}22`,
      borderRadius: 20,
      padding: '24px 28px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background glow */}
      <div style={{ position:'absolute', top:'-50%', left:`${progress}%`, width:100, height:'200%',
        background:`radial-gradient(circle, ${currentTier.color}15 0%, transparent 70%)`, pointerEvents:'none',
        transform: 'translateX(-50%)', transition: 'left 1s cubic-bezier(0.4,0,0.2,1)' }} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
        {/* Current Tier */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            fontSize: 24, width: 44, height: 44, borderRadius: 14,
            background: `${currentTier.color}15`, border: `1px solid ${currentTier.color}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 16px ${currentTier.color}20`
          }}>{currentTier.icon}</div>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2 }}>Current Tier</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: currentTier.color, letterSpacing: 1, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', background: `linear-gradient(90deg, ${currentTier.color}, ${currentTier.accent})`, backgroundClip: 'text' }}>
              {currentTier.label}
            </div>
          </div>
        </div>

        {/* Next Tier */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'right' }}>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2 }}>Next Tier</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'rgba(255,255,255,0.6)', letterSpacing: 1 }}>
              {nextTier.label}
            </div>
          </div>
          <div style={{
            fontSize: 18, width: 36, height: 36, borderRadius: 10,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: 0.5, filter: 'grayscale(100%)'
          }}>{nextTier.icon}</div>
        </div>
      </div>

      {/* Progress Bar Track */}
      <div style={{ position: 'relative', height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)' }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, bottom: 0,
          width: `${progress}%`,
          background: `linear-gradient(90deg, ${currentTier.color}, ${currentTier.accent})`,
          borderRadius: 99,
          boxShadow: `0 0 12px ${currentTier.color}AA`,
          transition: 'width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}>
          {/* Animated Sheen */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
            animation: 'sheen 2s linear infinite'
          }} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Lv {currentTier.min}</div>
        <div style={{ fontSize: 11, fontWeight: 900, color: currentTier.color, letterSpacing: 1 }}>{progress.toFixed(1)}% ({aura.toLocaleString()} Aura)</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Lv {nextLevelBound}</div>
      </div>
      
      <style>{`
        @keyframes sheen {
          0% { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(200%) skewX(-15deg); }
        }
      `}</style>
    </div>
  );
}
