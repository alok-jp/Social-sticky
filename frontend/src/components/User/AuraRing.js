import React, { useEffect, useRef, useState, useCallback } from 'react';

// ── 6-Band Tier System (repeating palette across 1000 levels) ──────────────
const TIER_BANDS = [
  { label: 'RECRUIT',    icon: '🥉', color: '#94A3B8', accent: '#CBD5E1', range: '1-4'   },
  { label: 'FRONTLINER',icon: '⚔️',  color: '#38BDF8', accent: '#7DD3FC', range: '5-9'   },
  { label: 'MACHINE',   icon: '⚙️',  color: '#34D399', accent: '#6EE7B7', range: '10-19' },
  { label: 'WARLORD',   icon: '🛡️',  color: '#FB923C', accent: '#FCD34D', range: '20-34' },
  { label: 'OVERLORD',  icon: '👑',  color: '#C084FC', accent: '#F0ABFC', range: '35-49' },
  { label: 'LEGEND',    icon: '🗿',  color: '#FBBF24', accent: '#FDE68A', range: '50+'   },
];

// ── Exponential threshold formula: grows steeply after lvl 50 ──────────────
// Threshold(l) = 100 * (l-1)^2.2  → requires millions of Aura at lvl 1000
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
  // 50+: cycle through bands every 10 levels, scaling up
  const idx = Math.floor((level - 50) / 10) % TIER_BANDS.length;
  return TIER_BANDS[idx];
}

// ── Generate visible level range for the slider ────────────────────────────
// Function removed to simplify UI

export default function AuraRing({ user, onAuraClaim }) {
  const canvasRef  = useRef(null);
  const sliderRef  = useRef(null);
  const animRef    = useRef(null);
  const rippleRef  = useRef(null);

  const { aura = 0, level = 1 } = user || {};

  const currentThreshold = getThreshold(level);
  const nextThreshold    = getThreshold(level + 1);
  const auraInLevel      = aura - currentThreshold;
  const auraNeeded       = nextThreshold - currentThreshold;
  const progress         = Math.min(100, Math.max(0, (auraInLevel / auraNeeded) * 100));

  const tier = getTierBand(level);
  const R    = 72;
  const C    = 2 * Math.PI * R;
  const strokeOffset = C - (C * progress) / 100;

  const [rippleActive, setRippleActive] = useState(false);
  const [surgeActive,  setSurgeActive]  = useState(false);
  const [prevAura, setPrevAura]         = useState(aura);
  const [shakeActive, setShakeActive]   = useState(false);

  useEffect(() => {
    if (aura < prevAura) {
      setShakeActive(true);
      setTimeout(() => setShakeActive(false), 800);
    }
    setPrevAura(aura);
  }, [aura, prevAura]);

  // Sparkle canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const particles = Array.from({ length: 30 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.4 + 0.3,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.006 + 0.002,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.phase += p.speed;
        const alpha = (Math.sin(p.phase) + 1) / 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `${tier.color}${Math.floor(alpha * 180).toString(16).padStart(2, '0')}`;
        ctx.fill();
      });
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [tier.color]);

  // Aura Ripple + Surge effect trigger (called externally via ref or prop)
  const triggerAuraEffect = useCallback(() => {
    setRippleActive(true);
    setSurgeActive(true);
    setTimeout(() => setRippleActive(false), 1800);
    setTimeout(() => setSurgeActive(false), 2400);
  }, []);

  // Expose trigger to parent via onAuraClaim callback mount
  useEffect(() => {
    if (onAuraClaim) onAuraClaim(triggerAuraEffect);
  }, [onAuraClaim, triggerAuraEffect]);

  return (
    <div style={{
      position: 'relative',
      borderRadius: 28,
      padding: '24px 20px 20px',
      background: 'linear-gradient(160deg, rgba(10,10,20,0.97) 0%, rgba(15,15,30,0.93) 100%)',
      border: shakeActive ? `1px solid rgba(255,50,50,0.5)` : `1px solid ${tier.color}28`,
      boxShadow: shakeActive 
        ? `0 0 0 1px rgba(255,50,50,0.2), 0 24px 60px rgba(255,0,0,0.3), 0 0 80px rgba(255,0,0,0.2)`
        : `0 0 0 1px rgba(255,255,255,0.03), 0 24px 60px rgba(0,0,0,0.55), 0 0 80px ${tier.color}10`,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 16,
      animation: shakeActive ? 'shake 0.5s ease-in-out' : 'none',
      transition: 'border 0.3s, box-shadow 0.3s'
    }}>

      {/* Sparkle canvas */}
      <canvas ref={canvasRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', opacity:0.55 }} />

      {/* Aura Ripple effect */}
      {rippleActive && (
        <div style={{
          position: 'absolute', top:'50%', left:'50%',
          transform: 'translate(-50%,-50%)',
          width: 20, height: 20, borderRadius: '50%', pointerEvents: 'none',
          background: `radial-gradient(circle, ${tier.color}60 0%, transparent 70%)`,
          animation: 'auraRipple 1.8s ease-out forwards',
          zIndex: 20
        }} />
      )}

      {/* Top stripe */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2,
        background:`linear-gradient(90deg, transparent, ${tier.color}, ${tier.accent}, transparent)`, opacity:0.75 }} />

      {/* ── Tier badge ── */}
      <div style={{
        display:'flex', alignItems:'center', gap:7, padding:'5px 16px 5px 10px',
        background:`${tier.color}14`, border:`1px solid ${tier.color}35`,
        borderRadius:999, zIndex:1,
      }}>
        <span style={{ fontSize:13 }}>{tier.icon}</span>
        <span style={{
          fontSize:10, fontWeight:900, letterSpacing:3, textTransform:'uppercase',
          background:`linear-gradient(90deg,${tier.color},${tier.accent})`,
          WebkitBackgroundClip:'text', backgroundClip:'text', WebkitTextFillColor:'transparent'
        }}>{tier.label}</span>
        <span style={{ fontSize:9, color:'rgba(255,255,255,0.2)', fontWeight:700 }}>Lv {level}</span>
      </div>

      {/* ── SVG Ring ── */}
      <div style={{ position:'relative', width:'100%', maxWidth:190, aspectRatio:'1', zIndex:1 }}>
        {/* Dashed orbit */}
        <svg viewBox="0 0 190 190" style={{ position:'absolute', inset:0, width:'100%', height:'100%', animation:'spinSlow 30s linear infinite', opacity:0.13 }}>
          <circle cx="95" cy="95" r="91" fill="none" stroke={tier.color} strokeWidth="1" strokeDasharray="4 8" strokeLinecap="round" />
        </svg>

        {/* Main ring */}
        <svg viewBox="0 0 190 190" style={{ position:'absolute', inset:0, width:'100%', height:'100%', transform:'rotate(-90deg)' }}>
          <defs>
            <linearGradient id={`rg-${tier.label}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={tier.color} stopOpacity="0.3" />
              <stop offset="60%" stopColor={tier.color} />
              <stop offset="100%" stopColor={tier.accent} />
            </linearGradient>
            <filter id="rGlow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          {/* Track */}
          <circle cx="95" cy="95" r={R} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="12" />
          <circle cx="95" cy="95" r={R} fill="none" stroke={tier.color} strokeWidth="12" strokeOpacity="0.06" />
          {/* Glow arc */}
          <circle cx="95" cy="95" r={R} fill="none" stroke={tier.color} strokeWidth="12"
            strokeDasharray={C} strokeDashoffset={strokeOffset} strokeLinecap="round"
            filter="url(#rGlow)" style={{ transition:'stroke-dashoffset 1.8s cubic-bezier(0.4,0,0.2,1)', opacity:0.32 }} />
          {/* Sharp arc */}
          <circle cx="95" cy="95" r={R} fill="none" stroke={`url(#rg-${tier.label})`} strokeWidth="11"
            strokeDasharray={C} strokeDashoffset={strokeOffset} strokeLinecap="round"
            style={{ transition:'stroke-dashoffset 1.8s cubic-bezier(0.4,0,0.2,1)' }} />
          {/* Tip dot */}
          {progress > 3 && (() => {
            const angle = ((progress / 100) * 360 - 90) * (Math.PI / 180);
            return <circle cx={95 + R * Math.cos(angle)} cy={95 + R * Math.sin(angle)} r="6"
              fill={tier.accent} filter="url(#rGlow)" style={{ transition:'cx 1.8s,cy 1.8s' }} />;
          })()}
        </svg>

        {/* Centre */}
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2 }}>
          <div style={{ fontSize:'clamp(32px,7vw,48px)', fontWeight:950, lineHeight:1, color:'white',
            letterSpacing:-3, textShadow:`0 0 30px ${tier.color}88`, fontFamily:"'Fredoka One',cursive" }}>{level}</div>
          <div style={{ fontSize:8, fontWeight:900, letterSpacing:3, color:`${tier.color}cc`, textTransform:'uppercase' }}>TIER</div>
        </div>
      </div>

      {/* ── Aura numbers ── */}
      <div style={{ textAlign:'center', zIndex:1 }}>
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'center', gap:6 }}>
          <span style={{ fontSize:'clamp(20px,5vw,28px)', fontWeight:950, color:'white', letterSpacing:-1,
            textShadow:`0 0 20px ${tier.color}55` }}>{aura.toLocaleString()}</span>
          <span style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.2)' }}>/ {nextThreshold.toLocaleString()}</span>
        </div>
        <div style={{ fontSize:9, fontWeight:900, letterSpacing:3, textTransform:'uppercase', marginTop:3,
          background:`linear-gradient(90deg,${tier.color},${tier.accent})`,
          WebkitBackgroundClip:'text', backgroundClip:'text', WebkitTextFillColor:'transparent' }}>Aura</div>

        {/* Surge bar */}
        <div style={{ position:'relative', width:140, height:4, background:'rgba(255,255,255,0.05)', borderRadius:99, margin:'10px auto 0', overflow:'hidden' }}>
          <div style={{
            height:'100%', borderRadius:99,
            width:`${progress}%`,
            background:`linear-gradient(90deg,${tier.color}88,${tier.accent})`,
            boxShadow:`0 0 8px ${tier.color}`,
            transition:'width 1.8s cubic-bezier(0.4,0,0.2,1)'
          }} />
          {surgeActive && (
            <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0,
              background:`linear-gradient(90deg, transparent, ${tier.accent}88, transparent)`,
              animation:'surgeWave 1.2s ease-out forwards' }} />
          )}
        </div>
        <div style={{ fontSize:9, color:'rgba(255,255,255,0.2)', fontWeight:800, marginTop:4 }}>
          {progress.toFixed(1)}% to next tier
        </div>
      </div>

      {/* ── Footer: streak ── */}
      <div style={{
        zIndex:1, width:'100%',
        borderTop:`1px solid ${tier.color}18`, paddingTop:12,
        display:'flex', justifyContent:'center', gap:8, alignItems:'center'
      }}>
        <span style={{ fontSize:13 }}>🔥</span>
        <span style={{ fontSize:14, fontWeight:900, color:'white' }}>{user?.currentStreak || 0}</span>
        <span style={{ fontSize:9, color:'rgba(255,255,255,0.2)', fontWeight:800, textTransform:'uppercase', letterSpacing:1 }}>Day Streak</span>
      </div>

      <style>{`
        @keyframes spinSlow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes auraRipple {
          0%   { width:20px; height:20px; opacity:1; }
          100% { width:500px; height:500px; opacity:0; }
        }
        @keyframes surgeWave {
          0%   { transform:translateX(-100%); opacity:1; }
          100% { transform:translateX(200%); opacity:0; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
