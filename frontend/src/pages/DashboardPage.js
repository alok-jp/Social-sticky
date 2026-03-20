import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Common/Navbar';
import KanbanBoard from '../components/Tasks/KanbanBoard';
import GroupCard from '../components/Groups/GroupCard';
import CreateGroupModal from '../components/Groups/CreateGroupModal';
import api from '../utils/api';
import PendingInvites from '../components/Groups/PendingInvites';
import AuraRing from '../components/User/AuraRing';
import StreakFire from '../components/User/StreakFire';
import TierSlider from '../components/User/TierSlider';
import { useToast } from '../components/Common/ToastContext';

const QUOTES = [
  { text: "The pain you feel today is the strength you feel tomorrow.", emoji: "⚡" },
  { text: "Do it tired. Do it scared. Just do it.", emoji: "🗿" },
  { text: "You're one focused session away from everything changing.", emoji: "🔥" },
  { text: "Stop waiting for Friday. Your legend starts today.", emoji: "👑" },
  { text: "Main character energy isn't given. It's built.", emoji: "🎬" },
];

export default function DashboardPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [tab, setTab] = useState('tasks');
  const [quote, setQuote] = useState(null);
  const [claimLoading, setClaimLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const { show } = useToast();
  const canvasRef = useRef(null);
  const auraRippleTrigger = useRef(null);

  const fetchQuote = useCallback(() => {
    api.get('/ai/motivate').then(res => setQuote(res.data.message)).catch(() => setQuote("Do it tired. 🗿"));
  }, []);

  useEffect(() => {
    api.get('/groups').then(res => setGroups(res.data));
    fetchQuote();
    const iv = setInterval(() => setQuoteIdx(i => (i + 1) % QUOTES.length), 8000);
    return () => clearInterval(iv);
  }, [fetchQuote]);

  // 24h Timer
  useEffect(() => {
    if (!user?.lastClaimAt) return;
    const interval = setInterval(() => {
      const waitTime = 24 * 60 * 60 * 1000;
      const diff = new Date() - new Date(user.lastClaimAt);
      setTimeLeft(diff < waitTime ? Math.ceil((waitTime - diff) / 1000) : 0);
    }, 1000);
    return () => clearInterval(interval);
  }, [user?.lastClaimAt]);

  // Subtle grain canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const img = ctx.createImageData(canvas.width, canvas.height);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random() * 15;
        img.data[i] = img.data[i+1] = img.data[i+2] = v;
        img.data[i+3] = 18;
      }
      ctx.putImageData(img, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const claimAura = async () => {
    setClaimLoading(true);
    try {
      const res = await api.post('/users/ritual');
      setUser(prev => ({ ...prev, aura: res.data.aura, lastClaimAt: res.data.lastClaimAt }));
      // Fire Aura Ripple + Surge on the ring
      if (auraRippleTrigger.current) auraRippleTrigger.current();
      show('Aura Ritual Complete. The Architect is proud. 🗿🔥', { type: 'celebrate' });
    } catch (err) {
      show(err.response?.data?.message || 'Wait for the next ritual, Alpha.', { type: 'info' });
    } finally { setClaimLoading(false); }
  };

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}h ${m}m ${sec}s`;
  };

  const hour = new Date().getHours();
  const greetingText = hour < 5 ? "Still up?" : hour < 12 ? "Rise and Grind" : hour < 17 ? "Stay Locked In" : hour < 21 ? "Evening Grind" : "Night Shift";
  const greetingEmoji = hour < 5 ? "🌒" : hour < 12 ? "🌅" : hour < 17 ? "☀️" : hour < 21 ? "🌆" : "🌙";
  const firstName = user?.name?.split(' ')[0] || 'Operative';

  const fallbackQuote = QUOTES[quoteIdx];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', position: 'relative', overflow: 'hidden' }}>
      {/* Grain overlay */}
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 1 }} />

      {/* Large ambient blobs */}
      <div style={{ position:'fixed', top:'-20vh', left:'-10vw', width:'60vw', height:'60vw', borderRadius:'50%',
        background:'radial-gradient(circle, rgba(255,215,0,0.04) 0%, transparent 70%)', pointerEvents:'none', zIndex:0 }} />
      <div style={{ position:'fixed', bottom:'-20vh', right:'-10vw', width:'50vw', height:'50vw', borderRadius:'50%',
        background:'radial-gradient(circle, rgba(56,189,248,0.04) 0%, transparent 70%)', pointerEvents:'none', zIndex:0 }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <Navbar />

        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '32px 24px' }} className="page-enter">

          {/* ═══════════════════════════════════════════════ HERO ══ */}
          <div className="hero-grid" style={{ alignItems:'stretch' }}>

            {/* Left — Welcome card */}
            <div style={{
              borderRadius: 28,
              padding: '36px 36px 28px',
              position: 'relative',
              overflow: 'hidden',
              background: 'linear-gradient(145deg, #0F0F1E 0%, #12122A 60%, #0A0A16 100%)',
              border: '1px solid rgba(255,215,0,0.1)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.03), 0 30px 80px rgba(0,0,0,0.5)',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
            }}>
              {/* Top accent line */}
              <div style={{ position:'absolute', top:0, left:0, right:0, height:2,
                background:'linear-gradient(90deg, transparent, #FFD700, #FF8C00, transparent)', opacity:0.6 }} />

              {/* Background grid pattern */}
              <div style={{ position:'absolute', inset:0, opacity:0.025, pointerEvents:'none',
                backgroundImage:'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
                backgroundSize:'32px 32px' }} />

              {/* Subtle animated aura glow inside card */}
              <div style={{ position:'absolute', top:'-20%', right:'-10%', width:'70%', height:'80%', borderRadius:'50%',
                background:'radial-gradient(circle, rgba(255,215,0,0.06) 0%, transparent 60%)', filter:'blur(40px)', 
                animation:'pulseGlow 4s ease-in-out infinite alternate', pointerEvents:'none' }} />

              {/* Corner watermark */}
              <div style={{ position:'absolute', bottom:-20, right:-10, fontSize:140, opacity:0.025, pointerEvents:'none',
                filter:'blur(2px)', lineHeight:1 }}>🗿</div>

              {/* Content */}
              <div>
                {/* Greeting pill */}
                <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 14px',
                  background:'rgba(255,215,0,0.08)', border:'1px solid rgba(255,215,0,0.18)',
                  borderRadius:999, marginBottom:20 }}>
                  <span style={{ fontSize:14 }}>{greetingEmoji}</span>
                  <span style={{ fontSize:10, fontWeight:900, letterSpacing:3, textTransform:'uppercase',
                    color:'rgba(255,215,0,0.8)' }}>{greetingText}</span>
                </div>

                {/* Name heading */}
                <h1 style={{ fontFamily:"'Fredoka One',cursive", fontSize: 'clamp(36px, 5vw, 52px)',
                  lineHeight:1, margin:'0 0 6px', color:'white',
                  textShadow:'0 2px 30px rgba(255,215,0,0.15)' }}>
                  Hey, {firstName} 👋
                </h1>
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.3)', fontWeight:700, marginBottom:24, letterSpacing:1 }}>
                  OPERATIVE • {user?.uid || 'ID NOT SET'}
                </div>

                {/* Quote block */}
                <div style={{
                  padding:'16px 18px',
                  background:'rgba(255,255,255,0.025)',
                  borderLeft:'3px solid rgba(255,215,0,0.5)',
                  borderRadius:'0 14px 14px 0',
                  marginBottom:28
                }}>
                  <div style={{ fontSize:11, color:'rgba(255,215,0,0.6)', fontWeight:900, letterSpacing:2,
                    textTransform:'uppercase', marginBottom:6 }}>
                    {quote ? '🤖 AI MESSAGE' : `${fallbackQuote.emoji} DAILY INTEL`}
                  </div>
                  <div style={{ fontSize:15, fontWeight:800, lineHeight:1.55, color:'rgba(255,255,255,0.85)',
                    fontStyle:'italic', transition:'opacity 0.5s ease' }}>
                    &ldquo;{quote || fallbackQuote.text}&rdquo;
                  </div>
                </div>
              </div>

              {/* CTA row */}
              <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                <StreakFire streak={user?.currentStreak} />

                <button
                  onClick={claimAura}
                  disabled={claimLoading || (timeLeft > 0)}
                  style={{
                    display:'flex', alignItems:'center', gap:8,
                    padding:'12px 22px',
                    borderRadius:14,
                    border:'none',
                    fontWeight:900, fontSize:13, letterSpacing:1.5, textTransform:'uppercase',
                    cursor: timeLeft > 0 ? 'not-allowed' : 'pointer',
                    background: timeLeft > 0
                      ? 'rgba(255,255,255,0.04)'
                      : 'linear-gradient(135deg, #FFD700, #FF8C00)',
                    color: timeLeft > 0 ? 'rgba(255,255,255,0.2)' : '#000',
                    boxShadow: timeLeft > 0 ? 'none' : '0 4px 20px rgba(255,215,0,0.35)',
                    transition:'all 0.2s',
                  }}
                  onMouseEnter={e => { if (!(timeLeft > 0)) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {timeLeft > 0 ? `⏳ ${formatTime(timeLeft)}` : '🔥 Claim Aura'}
                </button>

                <button
                  onClick={() => navigate('/focus-mode')}
                  style={{
                    display:'flex', alignItems:'center', gap:8,
                    padding:'12px 20px',
                    borderRadius:14,
                    border:'1px solid rgba(56,189,248,0.25)',
                    fontWeight:900, fontSize:13, letterSpacing:1.5, textTransform:'uppercase',
                    cursor:'pointer',
                    background:'rgba(56,189,248,0.07)',
                    color:'rgba(56,189,248,0.9)',
                    transition:'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background='rgba(56,189,248,0.14)'; e.currentTarget.style.transform='translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background='rgba(56,189,248,0.07)'; e.currentTarget.style.transform='translateY(0)'; }}
                >
                  🧘 Focus Mode
                </button>
              </div>
            </div>

            {/* Right — Aura Ring */}
            <AuraRing user={user} onAuraClaim={fn => { auraRippleTrigger.current = fn; }} />
          </div>

          {/* Tier Tracker (Horizontal Slide Visualization) */}
          <TierSlider user={user} />

          {/* ═══════════════════════════════════════════ TABS ══ */}
          <div style={{ display:'flex', gap:8, marginBottom:24, borderBottom:'1px solid rgba(255,255,255,0.05)', paddingBottom:0 }}>
            {[['tasks','📌 My Notes'],['groups','👥 Study Circles']].map(([val, label]) => (
              <button key={val} onClick={() => setTab(val)} style={{
                padding:'12px 22px',
                fontSize:13, fontWeight:900, letterSpacing:1, textTransform:'uppercase',
                border:'none', cursor:'pointer',
                background:'transparent',
                color: tab === val ? 'var(--primary-glow)' : 'rgba(255,255,255,0.35)',
                borderBottom: tab === val ? '2px solid var(--primary-glow)' : '2px solid transparent',
                borderRadius:0,
                marginBottom: -1,
                transition:'all 0.2s ease',
              }}>{label}</button>
            ))}
          </div>

          {/* Tab panels */}
          {tab === 'tasks' && <KanbanBoard />}

          {tab === 'groups' && (
            <div className="page-enter">
              <PendingInvites />
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, marginTop:16 }}>
                <div>
                  <h2 style={{ fontSize:22, color:'white', margin:0, fontWeight:900 }}>Study Circles 👥</h2>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.3)', fontWeight:700, marginTop:3 }}>
                    {groups.length} {groups.length === 1 ? 'circle' : 'circles'} active
                  </div>
                </div>
                <button onClick={() => setShowGroupModal(true)} style={{
                  padding:'11px 22px', borderRadius:14, border:'none',
                  background:'linear-gradient(135deg, #FFD700, #FF8C00)',
                  color:'#000', fontWeight:900, fontSize:12, letterSpacing:1.5,
                  textTransform:'uppercase', cursor:'pointer',
                  boxShadow:'0 4px 16px rgba(255,215,0,0.3)'
                }}>➕ New Circle</button>
              </div>

              {groups.length === 0 ? (
                <div style={{
                  textAlign:'center', padding:'56px 32px',
                  background:'rgba(255,255,255,0.01)',
                  border:'1px dashed rgba(255,255,255,0.07)',
                  borderRadius:24
                }}>
                  <div style={{ fontSize:56, marginBottom:16 }}>🎓</div>
                  <div style={{ fontSize:22, fontWeight:900, marginBottom:8, color:'white' }}>No tribes found. 🗿</div>
                  <div style={{ fontSize:14, marginBottom:24, color:'rgba(255,255,255,0.3)', maxWidth:320, margin:'0 auto 24px' }}>
                    Build your own elite study circle and conquer. ⚔️
                  </div>
                  <button onClick={() => setShowGroupModal(true)} style={{
                    padding:'13px 28px', borderRadius:14, border:'none',
                    background:'linear-gradient(135deg, #FFD700, #FF8C00)',
                    color:'#000', fontWeight:900, fontSize:13,
                    cursor:'pointer', letterSpacing:1
                  }}>✨ Found a Circle</button>
                </div>
              ) : (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px, 1fr))', gap:20 }}>
                  {groups.map(g => <GroupCard key={g._id} group={g} />)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showGroupModal && <CreateGroupModal onClose={() => setShowGroupModal(false)} onCreated={g => setGroups(gs => [g, ...gs])} />}

      <style>{`
        .hero-grid {
          display: grid;
          grid-template-columns: minmax(0,1.4fr) minmax(0,1fr);
          gap: 20px;
          margin-bottom: 28px;
          align-items: start;
        }
        @media (max-width: 860px) {
          .hero-grid { grid-template-columns: 1fr; }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0% { opacity: 0.5; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
