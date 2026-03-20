import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Common/ToastContext';
import api from '../utils/api';
import Navbar from '../components/Common/Navbar';

const PRESETS = [
  { label: '25 MIN', value: 25, emoji: '⚡' },
  { label: '50 MIN', value: 50, emoji: '🔥' },
  { label: '90 MIN', value: 90, emoji: '🗿' },
];

const VICTORY_CHIME_URL = 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3';

const MOTIVATIONS = [
  "The noise is temporary. Your legacy is permanent. 🗿",
  "Stay locked in. Every second compounds. ⚡",
  "Champions are made in sessions nobody sees. 👑",
  "You started. Don't you dare stop now. 🛡️",
];

export default function FocusModePage() {
  const { user, setUser } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();

  const [customMinutes, setCustomMinutes] = useState(25);
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [results, setResults] = useState(null);
  const [auraChange, setAuraChange] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [motIdx, setMotIdx] = useState(0);

  const audioRef = useRef(new Audio(VICTORY_CHIME_URL));

  useEffect(() => {
    let iv = null;
    if (isActive && !isPaused && (minutes > 0 || seconds > 0)) {
      iv = setInterval(() => {
        if (seconds === 0) { setMinutes(m => m - 1); setSeconds(59); }
        else { setSeconds(s => s - 1); }
      }, 1000);
    } else if (isActive && minutes === 0 && seconds === 0) {
      handleComplete();
      clearInterval(iv);
    }
    return () => clearInterval(iv);
  }, [isActive, isPaused, minutes, seconds]);

  // Rotate motivations while active
  useEffect(() => {
    if (!isActive || isPaused) return;
    const iv = setInterval(() => setMotIdx(i => (i + 1) % MOTIVATIONS.length), 12000);
    return () => clearInterval(iv);
  }, [isActive, isPaused]);

  const stopAudio = useCallback(() => {
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
  }, []);

  const startSession = (m) => {
    setMinutes(m); setSeconds(0); setTotalSeconds(m * 60);
    setIsActive(true); setIsPaused(false); setSessionStarted(true);
    setResults(null); setAuraChange(null);
  };

  const handlePause = () => { setIsPaused(p => !p); stopAudio(); };

  const handleStop = async () => {
    stopAudio();
    if (minutes === 0 && seconds === 0) return;
    setIsActive(false);
    try {
      const minutesSpent = Math.floor((totalSeconds - (minutes * 60 + seconds)) / 60);
      const res = await api.post('/users/focus/abandon', { minutesSpent });
      setResults(res.data);
      setAuraChange({ type: 'loss', amount: res.data.penalty });
      setUser(prev => ({ ...prev, aura: res.data.aura, level: res.data.level }));
      show(res.data.aiMessage, { type: 'info', duration: 5000 });
    } catch {
      show('Aura deduction failed, but discipline is still disappointed. 💀', { type: 'error' });
      navigate('/dashboard');
    }
  };

  const handleComplete = async () => {
    setIsActive(false);
    audioRef.current.play().catch(() => {});
    try {
      const durationInMinutes = totalSeconds / 60;
      const res = await api.post('/users/focus/complete', { minutes: durationInMinutes });
      setResults(res.data);
      setAuraChange({ type: 'gain', amount: res.data.auraGain + (res.data.bonus || 0) });
      setUser(prev => ({ ...prev, aura: res.data.aura, level: res.data.level }));
      show(res.data.aiMessage, { type: 'celebrate', duration: 5000 });
    } catch {
      show('Session recorded. The grind is real. 🗿', { type: 'success' });
    }
  };

  const remainingSeconds = minutes * 60 + seconds;
  const progress = totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 0;

  // SVG ring params — responsive
  const RING_SIZE = 300;
  const CENTER = RING_SIZE / 2;
  const R = 128;
  const CIRC = 2 * Math.PI * R;

  // ── Results Screen ──────────────────────────────────────────────
  if (results) {
    const isGain = auraChange?.type === 'gain';
    return (
      <div style={{ minHeight:'100vh', background:'var(--bg-dark)', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 16px' }}>
        <div style={{
          maxWidth:460, width:'100%', textAlign:'center', padding:'clamp(28px,6vw,48px)',
          borderRadius:28, animation:'scaleIn 0.5s ease',
          background:'linear-gradient(145deg,#0C0C1E,#10102A)',
          border:`2px solid ${isGain ? 'rgba(251,191,36,0.25)' : 'rgba(255,64,118,0.25)'}`,
          boxShadow:`0 40px 80px rgba(0,0,0,0.6), 0 0 60px ${isGain ? 'rgba(251,191,36,0.08)' : 'rgba(255,64,118,0.08)'}`
        }}>
          <div style={{ fontSize:72, marginBottom:16, animation:'bounce 1.6s infinite' }}>{isGain ? '🔥' : '💀'}</div>
          <h2 style={{ fontSize:'clamp(22px,6vw,32px)', fontWeight:950, color:'white', marginBottom:8 }}>
            {isGain ? 'MISSION ACCOMPLISHED' : 'MISSION ABANDONED'}
          </h2>
          <p style={{ color:'rgba(255,255,255,0.35)', fontSize:15, marginBottom:28, fontWeight:700 }}>
            {isGain ? 'Your discipline is legendary. 🗿' : 'You bailed on the grind. Aura suffers. 📉'}
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:28 }}>
            {[
              { label: isGain ? 'Aura Gained' : 'Aura Lost', val: isGain ? `+${auraChange.amount}` : `-${auraChange.amount}`, color: isGain ? '#FBBF24' : '#FF4076' },
              { label:'Time Spent', val:`${Math.floor((totalSeconds - remainingSeconds)/60)}m`, color:'#38BDF8' },
            ].map(s => (
              <div key={s.label} style={{ padding:'18px 12px', borderRadius:18, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontSize:10, fontWeight:900, color:s.color, textTransform:'uppercase', letterSpacing:1.5 }}>{s.label}</div>
                <div style={{ fontSize:28, fontWeight:950, color:'white', marginTop:4 }}>{s.val}</div>
              </div>
            ))}
          </div>
          <button onClick={() => { stopAudio(); navigate('/dashboard'); }} style={{
            width:'100%', padding:16, borderRadius:16, border:'none', cursor:'pointer',
            background: isGain ? 'linear-gradient(135deg,#FFD700,#FF9500)' : '#FF4076',
            color: isGain ? '#000' : '#fff', fontWeight:900, fontSize:13, letterSpacing:2, textTransform:'uppercase',
            boxShadow: isGain ? '0 4px 24px rgba(255,215,0,0.35)' : '0 4px 24px rgba(255,64,118,0.35)'
          }}>↩ Return to Command Center</button>
        </div>
        <style>{`
          @keyframes scaleIn { from { transform:scale(0.9); opacity:0; } to { transform:scale(1); opacity:1; } }
          @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        `}</style>
      </div>
    );
  }

  // ── Main Focus Screen ───────────────────────────────────────────
  return (
    <div style={{
      minHeight:'100vh',
      background: isActive ? '#060608' : 'var(--bg-dark)',
      color:'white', display:'flex', flexDirection:'column',
      position:'relative', overflow:'hidden',
      transition:'background 1.2s ease'
    }}>
      {/* Ambient glow blob */}
      {isActive && !isPaused && (
        <div style={{
          position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
          width:'80vw', height:'80vw', maxWidth:600, maxHeight:600,
          borderRadius:'50%', pointerEvents:'none',
          background:'radial-gradient(circle, rgba(255,215,0,0.04) 0%, transparent 70%)',
          animation:'ambientPulse 4s infinite alternate ease-in-out'
        }} />
      )}

      {!sessionStarted && <Navbar />}

      {/* Main content */}
      <div style={{
        flex:1, display:'flex', flexDirection:'column', alignItems:'center',
        justifyContent:'center', padding:'clamp(16px,4vw,32px)',
        position:'relative', zIndex:1
      }}>

        {/* Focus label */}
        {sessionStarted && (
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'clamp(24px,4vw,40px)', animation:'fadeIn 0.4s ease' }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background: isPaused ? 'rgba(255,255,255,0.2)' : '#FFD700',
              boxShadow: isPaused ? 'none' : '0 0 10px #FFD700', animation: isPaused ? 'none' : 'blink 1.5s infinite' }} />
            <span style={{ fontSize:10, fontWeight:900, letterSpacing:4, textTransform:'uppercase',
              color: isPaused ? 'rgba(255,255,255,0.2)' : 'rgba(255,215,0,0.7)' }}>
              {isPaused ? 'Session Paused' : 'Focus Active'}
            </span>
          </div>
        )}

        {/* ── SVG Ring Clock ── */}
        <div style={{
          position:'relative',
          width: RING_SIZE, height: RING_SIZE,
          maxWidth:'min(300px, 80vw)', maxHeight:'min(300px, 80vw)',
          display:'flex', alignItems:'center', justifyContent:'center',
          marginBottom:'clamp(32px,5vw,56px)'
        }}>
          <svg viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`} style={{ position:'absolute', inset:0, width:'100%', height:'100%', transform:'rotate(-90deg)' }}>
            <defs>
              <linearGradient id="focusGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFD700" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#FF9500" />
              </linearGradient>
              <filter id="ringGlow">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            {/* Track */}
            <circle cx={CENTER} cy={CENTER} r={R} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="12" />
            {/* Glow arc */}
            {isActive && (
              <circle cx={CENTER} cy={CENTER} r={R} fill="none"
                stroke={isPaused ? 'rgba(255,255,255,0.06)' : '#FFD700'} strokeWidth="12"
                strokeDasharray={CIRC} strokeDashoffset={CIRC - (CIRC * progress) / 100}
                strokeLinecap="round" filter="url(#ringGlow)"
                style={{ transition:'stroke-dashoffset 1s linear', opacity:0.3 }}
              />
            )}
            {/* Sharp arc */}
            <circle cx={CENTER} cy={CENTER} r={R} fill="none"
              stroke={isActive ? (isPaused ? 'rgba(255,255,255,0.12)' : 'url(#focusGrad)') : 'rgba(255,255,255,0.06)'}
              strokeWidth="10" strokeDasharray={CIRC}
              strokeDashoffset={isActive ? CIRC - (CIRC * progress) / 100 : CIRC}
              strokeLinecap="round"
              style={{ transition:'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
            />
            {/* Tip dot */}
            {isActive && progress > 2 && (() => {
              const angle = ((progress / 100) * 360 - 90) * (Math.PI / 180);
              const cx2 = CENTER + R * Math.cos(angle);
              const cy2 = CENTER + R * Math.sin(angle);
              return <circle cx={cx2} cy={cy2} r="7" fill="#FFD700" filter="url(#ringGlow)" style={{ transition:'cx 1s linear,cy 1s linear' }} />;
            })()}
          </svg>

          {/* Centre */}
          <div style={{ textAlign:'center', zIndex:2, position:'relative' }}>
            <div style={{
              fontSize: 'clamp(52px,12vw,80px)', fontWeight:950,
              fontFamily:"'Fredoka One',cursive", letterSpacing:-2, lineHeight:1,
              opacity: isPaused ? 0.3 : 1, transition:'opacity 0.4s ease',
              textShadow: isActive && !isPaused ? '0 0 40px rgba(255,215,0,0.3)' : 'none'
            }}>
              {String(minutes).padStart(2,'0')}:{String(seconds).padStart(2,'0')}
            </div>
            <div style={{ fontSize:9, fontWeight:900, letterSpacing:4, textTransform:'uppercase', marginTop:10,
              color: isPaused ? 'rgba(255,255,255,0.2)' : isActive ? 'rgba(255,215,0,0.8)' : 'rgba(255,255,255,0.2)' }}>
              {isPaused ? '— PAUSED —' : isActive ? 'UNSTOPPABLE' : 'READY'}
            </div>
          </div>
        </div>

        {/* ── Controls ── */}
        {!isActive ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'clamp(20px,4vw,32px)', width:'100%', maxWidth:480, animation:'fadeIn 0.5s ease' }}>
            {/* Presets */}
            <div style={{ width:'100%' }}>
              <div style={{ fontSize:9, fontWeight:900, color:'rgba(255,255,255,0.2)', textTransform:'uppercase', letterSpacing:3, textAlign:'center', marginBottom:12 }}>
                Elite Duration Presets
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
                {PRESETS.map(p => (
                  <button key={p.value} onClick={() => { setSelectedPreset(p.value); setCustomMinutes(p.value); }}
                    style={{
                      flex:1, minWidth:80, maxWidth:140, padding:'14px 8px', borderRadius:16, border:'none', cursor:'pointer',
                      background: selectedPreset === p.value ? 'linear-gradient(135deg,rgba(255,215,0,0.2),rgba(255,149,0,0.1))' : 'rgba(255,255,255,0.03)',
                      border: selectedPreset === p.value ? '1.5px solid rgba(255,215,0,0.4)' : '1px solid rgba(255,255,255,0.07)',
                      color: selectedPreset === p.value ? '#FFD700' : 'rgba(255,255,255,0.5)',
                      fontWeight:900, fontSize:12, letterSpacing:1, textTransform:'uppercase',
                      transition:'all 0.2s', textAlign:'center'
                    }}>
                    <div style={{ fontSize:18, marginBottom:4 }}>{p.emoji}</div>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom + CTA */}
            <div style={{ width:'100%', display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
              <div style={{ fontSize:9, fontWeight:900, color:'rgba(255,255,255,0.2)', textTransform:'uppercase', letterSpacing:3 }}>
                Custom Duration (minutes)
              </div>
              <div style={{ display:'flex', gap:10, width:'100%', maxWidth:320 }}>
                <input type="number" min="1" max="480" value={customMinutes}
                  onChange={e => { setCustomMinutes(Number(e.target.value)); setSelectedPreset(null); }}
                  style={{ flex:1, textAlign:'center', fontSize:20, fontWeight:900, borderRadius:14, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.1)', color:'white' }}
                />
                <button onClick={() => startSession(customMinutes)} style={{
                  flex:2, padding:'14px 20px', borderRadius:14, border:'none', cursor:'pointer',
                  background:'linear-gradient(135deg,#FFD700,#FF9500)', color:'#000',
                  fontWeight:900, fontSize:13, letterSpacing:1.5, textTransform:'uppercase',
                  boxShadow:'0 4px 24px rgba(255,215,0,0.35)'
                }}>🚀 Start Focus</button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center', animation:'fadeIn 0.5s ease' }}>
            <button onClick={handlePause} style={{
              minWidth:120, padding:'14px 24px', borderRadius:16, border:'none', cursor:'pointer',
              background: isPaused ? 'linear-gradient(135deg,#FFD700,#FF9500)' : 'rgba(255,255,255,0.06)',
              color: isPaused ? '#000' : 'white', fontWeight:900, fontSize:12, letterSpacing:2, textTransform:'uppercase',
              border: isPaused ? 'none' : '1.5px solid rgba(255,255,255,0.12)', transition:'all 0.2s'
            }}>{isPaused ? '▶ Resume' : '⏸ Pause'}</button>
            <button onClick={handleStop} style={{
              minWidth:120, padding:'14px 24px', borderRadius:16, cursor:'pointer',
              background:'rgba(255,64,118,0.08)', color:'#FF4076',
              border:'1.5px solid rgba(255,64,118,0.25)',
              fontWeight:900, fontSize:12, letterSpacing:2, textTransform:'uppercase',
              transition:'all 0.2s'
            }}>⛔ Abandon</button>
          </div>
        )}

        {/* Motivation quote */}
        {isActive && !isPaused && (
          <div style={{
            position:'absolute', bottom:'clamp(20px,4vw,48px)', left:0, right:0,
            textAlign:'center', padding:'0 clamp(16px,4vw,40px)'
          }}>
            <p style={{
              color:'rgba(255,255,255,0.15)', fontStyle:'italic',
              fontSize:'clamp(12px,2vw,15px)', fontWeight:700, lineHeight:1.6,
              margin:0, transition:'opacity 0.5s ease'
            }}>&ldquo;{MOTIVATIONS[motIdx]}&rdquo;</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes ambientPulse { from { opacity:0.4; transform:translate(-50%,-50%) scale(0.9); } to { opacity:1; transform:translate(-50%,-50%) scale(1.1); } }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scaleIn { from{transform:scale(0.9);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
      `}</style>
    </div>
  );
}
