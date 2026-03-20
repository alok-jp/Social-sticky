import React, { useRef, useEffect } from 'react';

const TIER_BANDS = [
  { label: 'RECRUIT',    icon: '🥉', color: '#94A3B8', accent: '#CBD5E1', min: 1,  max: 4  },
  { label: 'FRONTLINER', icon: '⚔️',  color: '#38BDF8', accent: '#7DD3FC', min: 5,  max: 9  },
  { label: 'MACHINE',    icon: '⚙️',  color: '#34D399', accent: '#6EE7B7', min: 10, max: 19 },
  { label: 'WARLORD',    icon: '🛡️',  color: '#FB923C', accent: '#FCD34D', min: 20, max: 34 },
  { label: 'OVERLORD',   icon: '👑',  color: '#C084FC', accent: '#F0ABFC', min: 35, max: 49 },
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
  const band = { ...TIER_BANDS[idx] };
  band.min = 50 + Math.floor((level - 50) / 10) * 10;
  band.max = band.min + 9;
  if(level >= 50) band.label = `LEGEND ${Math.floor((level - 50) / 10) + 1}`;
  return band;
}

export default function TierSlider({ user }) {
  const scrollRef = useRef(null);
  const currentLevel = user?.level || 1;
  const userAura = user?.aura || 0;

  useEffect(() => {
    // Scroll to center the active level on mount
    if (scrollRef.current) {
      const activeEl = scrollRef.current.querySelector('.active-tier');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [currentLevel]);

  // Generate levels visually (previous 3 up to next 15 for an expansive feeling)
  const startLevel = Math.max(1, currentLevel - 3);
  const levels = Array.from({ length: 20 }, (_, i) => startLevel + i);

  return (
    <div style={{ marginTop: 24, marginBottom: 32 }}>
      <div style={{ fontSize: 13, fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16 }}>
        🌍 Tier Progression
      </div>
      <div 
        ref={scrollRef}
        className="hide-scrollbar" 
        style={{ 
          display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16, padding: '10px 0' 
        }}
      >
        {levels.map(lvl => {
          const band = getTierBand(lvl);
          const threshold = getThreshold(lvl);
          const isActive = lvl === currentLevel;
          const isPassed = lvl < currentLevel;
          const isNext = lvl === currentLevel + 1;
          
          let progress = 0;
          if (isActive) {
            const currentReq = getThreshold(lvl);
            const nextReq = getThreshold(lvl + 1);
            progress = Math.min(100, Math.max(0, ((userAura - currentReq) / (nextReq - currentReq)) * 100));
          } else if (isPassed) {
            progress = 100;
          }

          return (
            <div 
              key={lvl}
              className={isActive ? 'active-tier' : ''}
              style={{
                flex: '0 0 auto',
                width: 140,
                padding: '20px 16px',
                borderRadius: 20,
                background: isActive ? `linear-gradient(145deg, ${band.color}18, rgba(20,20,35,0.8))` : 'rgba(255,255,255,0.02)',
                border: isActive ? `1px solid ${band.color}55` : '1px solid rgba(255,255,255,0.05)',
                boxShadow: isActive ? `0 8px 32px ${band.color}20` : 'none',
                transform: isActive ? 'translateY(-4px) scale(1.02)' : 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: isPassed ? 0.6 : 1,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {isActive && (
                <div style={{ position:'absolute', top:0, left:0, bottom:0, width:`${progress}%`, background:`linear-gradient(90deg, transparent, ${band.color}20)`, pointerEvents:'none' }} />
              )}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: isActive ? band.color : 'rgba(255,255,255,0.4)' }}>
                  LV {lvl}
                </div>
                {isActive && <div style={{ width:6, height:6, borderRadius:'50%', background: band.color, boxShadow:`0 0 10px ${band.color}` }} />}
              </div>

              <div style={{ 
                fontSize: 32, width: 44, height: 44, borderRadius: 14,
                background: isPassed ? 'rgba(255,255,255,0.05)' : `${band.color}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px',
                filter: isPassed ? 'grayscale(100%)' : 'none',
                boxShadow: isActive ? `0 0 20px ${band.color}20` : 'none'
              }}>{band.icon}</div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: isActive ? '#fff' : 'rgba(255,255,255,0.6)', letterSpacing: 0.5 }}>
                  {band.label}
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                  {threshold.toLocaleString()} Aura
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
