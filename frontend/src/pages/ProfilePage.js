import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Navbar from '../components/Common/Navbar';
import { useToast } from '../components/Common/ToastContext';
import AuraRing from '../components/User/AuraRing';
import TierProgressBar from '../components/User/TierProgressBar';

const TIERS = [
  { min:0,  max:5,  label:'RECRUIT',    icon:'🥉', color:'#94A3B8' },
  { min:5,  max:10, label:'FRONTLINER', icon:'⚔️',  color:'#38BDF8' },
  { min:10, max:20, label:'MACHINE',    icon:'⚙️',  color:'#34D399' },
  { min:20, max:35, label:'WARLORD',    icon:'🛡️',  color:'#FB923C' },
  { min:35, max:50, label:'OVERLORD',   icon:'👑',  color:'#C084FC' },
  { min:50, max:Infinity, label:'LEGEND', icon:'🗿', color:'#FBBF24' },
];
const getTier = (lv) => TIERS.find(t => lv >= t.min && lv < t.max) || TIERS[TIERS.length - 1];

const getMotivationalMessage = (level, gender) => {
  const isHigh = level >= 20;
  if (gender === 'female') return isHigh ? "Queen energy only. Keep ruling. 👑✨" : "Hot girls don't skip the grind. Fetch that Aura! 💅🔥";
  if (gender === 'male') return isHigh ? "Absolute unit. The bloodline is proud. 🗿🦍" : "Get your money up, not your funny up. Let's work! 💼🔥";
  return isHigh ? "Top 1% mindset. You're unstoppable. 🚀💫" : "Main character energy activated. Time to level up! 🎬⚡";
};

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const { show } = useToast();
  const [canClaim, setCanClaim] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [claimLoading, setClaimLoading] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({});

  const level = user?.level || 1;
  const tier  = getTier(level);

  // 24h claim timer
  useEffect(() => {
    if (!user?.lastClaimAt) { setCanClaim(true); return; }
    const tick = () => {
      const diff = new Date() - new Date(user.lastClaimAt);
      const wait = 24 * 60 * 60 * 1000;
      if (diff >= wait) { setCanClaim(true); setTimeLeft(''); return; }
      setCanClaim(false);
      const rem = Math.ceil((wait - diff) / 1000);
      setTimeLeft(`${Math.floor(rem/3600)}h ${Math.floor((rem%3600)/60)}m ${rem%60}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [user?.lastClaimAt]);

  const handleEditProfile = () => {
    setProfileForm({
      name: user?.name || '',
      statusMessage: user?.statusMessage || '',
      avatarIcon: user?.avatarIcon || '😎',
      dreams: user?.dreams || '',
      motivations: user?.motivations || '',
      gender: user?.gender || 'male'
    });
    setEditingProfile(true);
  };

  const saveProfile = async () => {
    try {
      const res = await api.put('/users/profile', profileForm);
      setUser(res.data);
      setEditingProfile(false);
      show('Profile saved! ✨', { type: 'success' });
    } catch { show('Error updating profile', { type: 'info' }); }
  };

  const claimDaily = async () => {
    setClaimLoading(true);
    try {
      const res = await api.post('/users/ritual');
      setUser(prev => ({ ...prev, aura: res.data.aura, lastClaimAt: res.data.lastClaimAt }));
      show('Aura Ritual Complete. 🗿⚡', { type: 'celebrate' });
    } catch (err) {
      show(err.response?.data?.message || 'Wait for it...', { type: 'info' });
    } finally { setClaimLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', paddingBottom: 60 }}>
      <Navbar />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }} className="page-enter">

        {/* ── Page header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--primary-glow)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 3, marginBottom: 6 }}>
              Operative File
            </div>
            <h1 style={{ fontFamily: "'Fredoka One',cursive", fontSize: 'clamp(28px,5vw,44px)', color: 'white', margin: 0, letterSpacing: -1 }}>
              The Command Center
            </h1>
          </div>
          <button onClick={handleEditProfile} style={{
            padding: '12px 22px', borderRadius: 14, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg,#FFD700,#FF9500)', color: '#000',
            fontWeight: 900, fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase',
            boxShadow: '0 4px 20px rgba(255,215,0,0.3)', flexShrink: 0
          }}>⚙️ Edit Identity</button>
        </div>

        {/* ── Main grid ── */}
        <div className="profile-grid">

          {/* ════ LEFT COL ════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Identity card */}
            <div style={{
              borderRadius: 28, padding: '36px 36px', position: 'relative', overflow: 'hidden',
              background: 'linear-gradient(145deg, #0C0C1E 0%, #10102A 100%)',
              border: `1px solid ${tier.color}28`,
              boxShadow: `0 0 0 1px rgba(255,255,255,0.03), 0 30px 80px rgba(0,0,0,0.5), 0 0 60px ${tier.color}0A`
            }}>
              {/* Accent stripe */}
              <div style={{ position:'absolute', top:0, left:0, right:0, height:2,
                background:`linear-gradient(90deg, transparent, ${tier.color}, ${tier.color}88, transparent)`, opacity:0.7 }} />

              {/* Subtle animated aura glow inside card */}
              <div style={{ position:'absolute', top:'-20%', left:'-10%', width:'70%', height:'80%', borderRadius:'50%',
                background:`radial-gradient(circle, ${tier.color}15 0%, transparent 60%)`, filter:'blur(40px)', 
                animation:'pulseGlowProfile 4s ease-in-out infinite alternate', pointerEvents:'none' }} />

              {/* Watermark */}
              <div style={{ position:'absolute', bottom:-24, right:-14, fontSize: 130, opacity:0.025, pointerEvents:'none', lineHeight:1 }}>
                {tier.icon}
              </div>

              {editingProfile ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: tier.color, textTransform:'uppercase', letterSpacing:2, marginBottom:4 }}>
                    ✏️ Edit Identity
                  </div>
                  <div className="form-row-2">
                    <div>
                      <label className="field-label">Display Name</label>
                      <input value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} placeholder="Your name" />
                    </div>
                    <div>
                      <label className="field-label">Aura Icon</label>
                      <input value={profileForm.avatarIcon} onChange={e => setProfileForm({...profileForm, avatarIcon: e.target.value})} placeholder="😎" />
                    </div>
                  </div>
                  <div>
                    <label className="field-label">Status Transmission</label>
                    <input value={profileForm.statusMessage} onChange={e => setProfileForm({...profileForm, statusMessage: e.target.value})} placeholder="Living my best life..." />
                  </div>
                  <div>
                    <label className="field-label">Identity</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {['male','female','other','custom'].map(g => (
                        <button key={g} onClick={() => setProfileForm({...profileForm, gender: g})} style={{
                          padding: '8px 18px', borderRadius: 10, border: 'none', cursor:'pointer', fontWeight:900, fontSize:11, letterSpacing:1,
                          background: profileForm.gender === g ? `linear-gradient(135deg,${tier.color},${tier.color}99)` : 'rgba(255,255,255,0.04)',
                          color: profileForm.gender === g ? '#000' : 'rgba(255,255,255,0.5)',
                          textTransform: 'uppercase', transition: 'all 0.2s'
                        }}>{g}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 900, color: tier.color, letterSpacing:2, textTransform:'uppercase', marginBottom:12 }}>
                      🧠 Neural Context (AI)
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                      <input value={profileForm.dreams} onChange={e => setProfileForm({...profileForm, dreams: e.target.value})} placeholder="Your big dream..." />
                      <textarea value={profileForm.motivations} onChange={e => setProfileForm({...profileForm, motivations: e.target.value})} placeholder="Why do you grind?" style={{ minHeight: 72 }} />
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:10 }}>
                    <button onClick={saveProfile} style={{
                      flex:1, padding:'13px', borderRadius:14, border:'none', cursor:'pointer',
                      background:`linear-gradient(135deg,${tier.color},${tier.color}99)`, color:'#000', fontWeight:900, fontSize:12, letterSpacing:1
                    }}>✓ Save Identity</button>
                    <button onClick={() => setEditingProfile(false)} style={{
                      flex:1, padding:'13px', borderRadius:14, border:'1px solid rgba(255,255,255,0.09)',
                      background:'transparent', color:'rgba(255,255,255,0.5)', cursor:'pointer', fontWeight:900, fontSize:12
                    }}>✕ Abort</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap: 'clamp(16px,3vw,28px)', flexWrap:'wrap' }}>
                    {/* Avatar */}
                    <div style={{
                      width: 96, height: 96, borderRadius: 26, flexShrink: 0,
                      background: `${tier.color}14`, border: `2px solid ${tier.color}44`,
                      display:'flex', alignItems:'center', justifyContent:'center', fontSize: 52,
                      boxShadow: `0 0 30px ${tier.color}30`
                    }}>{user?.avatarIcon || '😎'}</div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:4 }}>
                        <h2 style={{ fontSize:'clamp(22px,4vw,30px)', margin:0, fontWeight:900, color:'white', whiteSpace:'nowrap' }}>
                          {user?.name}
                        </h2>
                        <div style={{
                          padding:'4px 10px', borderRadius:8, fontSize:10, fontWeight:950, letterSpacing:1.5,
                          background: `${tier.color}18`, color: tier.color, border:`1px solid ${tier.color}40`
                        }}>{user?.uid}</div>
                      </div>
                      <div style={{ fontSize:14, color:'rgba(255,255,255,0.4)', fontWeight:700, fontStyle:'italic', marginBottom:6 }}>
                        &ldquo;{user?.statusMessage || 'Built Different. 🗿'}&rdquo;
                      </div>
                      <div style={{ fontSize:12, color:'rgba(255,255,255,0.6)', fontWeight:800, marginBottom:12, background:'rgba(255,255,255,0.05)', padding:'6px 10px', borderRadius:8, display:'inline-block' }}>
                        {getMotivationalMessage(level, user?.gender)}
                      </div>
                      <br/>
                      {/* Tier pill */}
                      <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 14px',
                        background:`${tier.color}14`, border:`1px solid ${tier.color}35`, borderRadius:999 }}>
                        <span style={{fontSize:13}}>{tier.icon}</span>
                        <span style={{ fontSize:10, fontWeight:900, letterSpacing:2, color:tier.color, textTransform:'uppercase' }}>{tier.label}</span>
                        <span style={{ fontSize:10, color:'rgba(255,255,255,0.25)', fontWeight:700 }}>Lv {level}</span>
                      </div>
                    </div>
                  </div>

                  {user?.dreams && (
                    <div style={{
                      marginTop: 20, padding:'14px 16px',
                      background:'rgba(255,255,255,0.02)', borderRadius:14,
                      borderLeft:`3px solid ${tier.color}88`
                    }}>
                      <span style={{ fontSize:10, fontWeight:900, color:tier.color, letterSpacing:2, textTransform:'uppercase' }}>Dream: </span>
                      <span style={{ fontSize:13, color:'rgba(255,255,255,0.75)', fontWeight:700 }}>{user.dreams}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tier Tracker (Horizontal) */}
            <TierProgressBar user={user} />

            {/* Elite Medals */}
            <div style={{ borderRadius:22, padding:'22px 20px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize:10, fontWeight:900, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:2, marginBottom:14 }}>🏅 Elite Medals</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {['🏅 Citizen', '✨ Initiated', '🔥 Consistent', '🗿 Chad'].map(b => (
                  <div key={b} style={{
                    padding:'7px 14px', background:'rgba(255,255,255,0.03)',
                    border:'1px solid rgba(255,255,255,0.07)', borderRadius:10,
                    fontSize:12, fontWeight:800, color:'rgba(255,255,255,0.6)'
                  }}>{b}</div>
                ))}
              </div>
            </div>
          </div>

          {/* ════ RIGHT COL ════ */}
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

            {/* Aura Ring */}
            <AuraRing user={user} />

            {/* Stats tiles */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {[
                { emoji:'🔥', label:'Streak', val:`${user?.currentStreak||0}d`, color:'#FB923C' },
                { emoji:'⚡', label:'Level',  val:level, color:'#38BDF8' },
                { emoji:'✨', label:'Aura',   val:(user?.aura||0).toLocaleString(), color:tier.color },
                { emoji:'🎯', label:'Gender', val:(user?.gender||'N/A').toUpperCase(), color:'#C084FC' },
              ].map(s => (
                <div key={s.label} style={{
                  padding:'18px 14px', borderRadius:18, textAlign:'center',
                  background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)'
                }}>
                  <div style={{ fontSize:22, marginBottom:4 }}>{s.emoji}</div>
                  <div style={{ fontSize:9, color:'rgba(255,255,255,0.25)', fontWeight:900, textTransform:'uppercase', letterSpacing:1 }}>{s.label}</div>
                  <div style={{ fontSize:18, fontWeight:950, color:s.color, lineHeight:1, marginTop:2 }}>{s.val}</div>
                </div>
              ))}
            </div>

            {/* Aura Ritual */}
            <div style={{
              borderRadius:22, padding:'24px 20px',
              background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)'
            }}>
              <div style={{ fontSize:10, fontWeight:900, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:2, marginBottom:16 }}>
                🔮 Daily Ritual
              </div>
              <button onClick={claimDaily} disabled={!canClaim || claimLoading} style={{
                width:'100%', padding:'16px', borderRadius:16, border:'none', cursor: canClaim ? 'pointer' : 'not-allowed',
                background: canClaim ? `linear-gradient(135deg,${tier.color},${tier.color}99)` : 'rgba(255,255,255,0.04)',
                color: canClaim ? '#000' : 'rgba(255,255,255,0.2)',
                fontWeight:900, fontSize:13, letterSpacing:1.5, textTransform:'uppercase',
                boxShadow: canClaim ? `0 4px 20px ${tier.color}40` : 'none',
                transition:'all 0.3s'
              }}>
                {canClaim ? '🔮 Claim Aura Ritual' : `⏳ ${timeLeft}`}
              </button>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.2)', fontWeight:800, textAlign:'center', marginTop:10 }}>
                {canClaim ? 'Aura calibration ready. 🗿' : 'Patience is a weapon. 🧘‍♂️'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .profile-grid {
          display: grid;
          grid-template-columns: 1.3fr 1fr;
          gap: 20px;
          align-items: start;
        }
        .form-row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .field-label {
          display: block;
          font-size: 10px;
          font-weight: 900;
          color: rgba(255,255,255,0.3);
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 7px;
        }
        @media (max-width: 860px) {
          .profile-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 480px) {
          .form-row-2 {
            grid-template-columns: 1fr;
          }
        }
        @keyframes pulseGlowProfile {
          0% { opacity: 0.6; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
