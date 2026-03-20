import React, { useState, useEffect } from 'react';
import Navbar from '../components/Common/Navbar';
import api from '../utils/api';
import { useSocket } from '../context/SocketContext';
import ConfirmModal from '../components/Common/ConfirmModal';

export default function FriendsPage() {
  const [friends, setFriends]   = useState([]);
  const [received, setReceived] = useState([]);
  const [sent, setSent]         = useState([]);
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState([]);
  const [tab, setTab]           = useState('friends');
  const [msg, setMsg]           = useState('');
  const socketRef = useSocket();
  const [leaderboard, setLeaderboard] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    api.get('/users/friends').then(res => {
      setFriends(res.data.friends);
      setReceived(res.data.received);
      setSent(res.data.sent);
    });
    // load leaderboard
    api.get('/users/leaderboard').then(res => setLeaderboard(res.data)).catch(()=>{});
  }, []);

  // Listen for real-time leaderboard updates
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;
    const handler = (payload) => {
      // Refresh leaderboard from server to keep correct ordering
      api.get('/users/leaderboard').then(res => setLeaderboard(res.data)).catch(()=>{});
    };
    socket.on('leaderboard_update', handler);
    return () => socket.off('leaderboard_update', handler);
  }, [socketRef]);

  const search = async (q) => {
    setQuery(q);
    if (q.trim().length < 3) {
      setResults([]);
      return;
    }
    try {
      const res = await api.get(`/users/search?q=${encodeURIComponent(q)}`);
      setResults(res.data);
    } catch (err) { console.error('Search failed'); }
  };

  const sendRequest = async (userId) => {
    try {
      await api.post(`/users/friend-request/${userId}`);
      setMsg('✅ Friend request sent!');
      setResults(r => r.filter(u => u._id !== userId));
      setTimeout(() => setMsg(''), 3000);
    } catch (err) { setMsg('❌ ' + (err.response?.data?.message || 'Error')); }
  };

  const accept = async (userId) => {
    await api.post(`/users/friend-request/accept/${userId}`);
    const accepted = received.find(u => u._id === userId);
    setReceived(r => r.filter(u => u._id !== userId));
    setFriends(f => [...f, accepted]);
  };

  const decline = async (userId) => {
    await api.post(`/users/friend-request/decline/${userId}`);
    setReceived(r => r.filter(u => u._id !== userId));
  };

  const removeFriend = async () => {
    if (!confirmDelete) return;
    const id = confirmDelete;
    setConfirmDelete(null);
    try {
      await api.delete(`/users/friends/${id}`);
      setFriends(cur => cur.filter(f => f._id !== id));
      setMsg('✅ Friend removed');
      setTimeout(()=>setMsg(''), 3000);
    } catch (err) {
      setMsg('❌ Could not remove friend');
      setTimeout(()=>setMsg(''), 3000);
    }
  };


  return (
    <div className="animated-bg" style={{ minHeight:'100vh', paddingBottom:60 }}>
      <Navbar />
      <div style={{ maxWidth:1000, margin:'0 auto', padding:'40px 24px' }} className="page-enter">
        <h1 style={{ fontSize:36, margin:0 }}>The Fellowship 👥</h1>
        <p style={{ color:'var(--text-muted)', fontWeight:700, marginTop:10, marginBottom:32 }}>Connect with the elite. Crush goals together. 🤝</p>

        {/* Search bar */}
        <div className="glass-card" style={{ padding:28, marginBottom:32 }}>
          <div style={{ fontWeight:900, fontSize:16, marginBottom:16, letterSpacing:1, textTransform:'uppercase' }}>🔍 Seek Allies</div>
          {msg && <div style={{ marginBottom:16, fontWeight:800, color: msg.startsWith('✅') ? 'var(--accent-neon)' : 'var(--accent-hot)', fontSize:14 }}>{msg}</div>}
          <div style={{ display:'flex', gap:12 }}>
            <input type="text" value={query} onChange={e=>search(e.target.value)} placeholder="Enter precise UID (e.g. #ABC123)..." style={{ flex:1 }} />
          </div>
          {results.length > 0 && (
            <div style={{ marginTop:20, display:'flex', flexDirection:'column', gap:12 }}>
              {results.map(u => (
                <div key={u._id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', background:'rgba(255,255,255,0.03)', borderRadius:16, border:'1px solid var(--border-glass)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                    <div style={{ width:40, height:40, borderRadius:12, background:'var(--primary-glow)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, color:'#000' }}>{u.avatarIcon || '👤'}</div>
                    <div>
                      <div style={{ fontWeight:800, fontSize:15, color:'#fff' }}>{u.name}</div>
                      <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:800, letterSpacing:1, marginTop:2 }}>{u.uid}</div>
                    </div>
                  </div>
                  <button onClick={()=>sendRequest(u._id)} className="btn btn-yellow" style={{ padding:'8px 20px', fontSize:12 }}>➕ SEND REQUEST</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:12, marginBottom:32 }}>
          {[
            ['friends', `👫 Friends (${friends.length})`],
            ['requests', `📬 Requests (${received.length})`],
            ['sent', `📤 Sent (${sent.length})`],
          ].map(([val,label]) => (
            <button key={val} onClick={()=>setTab(val)} className="btn" style={{ background: tab===val ? 'var(--primary-glow)' : 'rgba(255,255,255,0.05)', color: tab===val ? '#000' : 'var(--text-muted)', border:'none', fontSize:13, padding:'12px 24px', borderRadius:14 }}>
              {label}
            </button>
          ))}
        </div>

        <div className="glass-card" style={{ padding:32 }}>
          {/* Leaderboard */}
          <div style={{ marginBottom:40, paddingBottom:32, borderBottom:'1px solid var(--border-glass)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h3 style={{ fontSize:22, margin:0 }}>🏆 Leaderboard</h3>
              <div style={{ display:'flex', gap:8 }}>
                {['aura', 'streak', 'level'].map(s => (
                  <button key={s} onClick={()=>api.get(`/users/leaderboard?sortBy=${s}`).then(r=>setLeaderboard(r.data))} style={{ padding:'6px 12px', fontSize:11, borderRadius:10, border:'1px solid var(--border-glass)', background: 'rgba(255,255,255,0.03)', color:'var(--text-muted)', cursor:'pointer', fontWeight:800, textTransform:'uppercase' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            {leaderboard.length === 0 ? <div style={{ color:'var(--text-muted)', textAlign:'center' }}>No legends yet. 🗿</div> : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {leaderboard.map((u, idx) => (
                  <div key={u._id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 18px', background:'rgba(255,255,255,0.02)', borderRadius:16, border:'1px solid var(--border-glass)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                      <div style={{ width:32, height:32, borderRadius:10, background: idx === 0 ? 'var(--primary-glow)' : 'rgba(255,215,0,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, color: idx===0 ? '#000' : 'var(--primary-glow)', fontSize:14 }}>{idx+1}</div>
                      <div>
                        <div style={{ fontWeight:900, fontSize:15, color:'#fff' }}>{u.name || 'ANONYMOUS'}</div>
                        <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:800 }}>
                          Lv {u.level || 1} • {u.streak || 0} Streak
                        </div>
                      </div>
                    </div>
                    <div style={{ fontWeight:900, color:'var(--primary-glow)', fontSize:18, letterSpacing:0.5 }}>{u.aura || 0} AURA</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {tab === 'friends' && (
            friends.length === 0
              ? <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}><div style={{ fontSize:40, marginBottom:16 }}>🤝</div>No allies found. Seek them out.</div>
              : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
                  {friends.map(f => (
                    <div key={f._id} style={{ display:'flex', flexDirection:'column', background:'rgba(255,255,255,0.02)', borderRadius:18, border:'1px solid var(--border-glass)', padding:20 }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                          <div style={{ width:44, height:44, borderRadius:12, background:'var(--primary-glow)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{f.avatarIcon || '👤'}</div>
                          <div>
                            <div style={{ fontWeight:900, fontSize:15, color:'#fff' }}>{f.name}</div>
                            <div style={{ fontSize:11, color:'var(--primary-glow)', fontWeight:800, marginTop:2 }}>Lv {f.level || 1} • 🔥 {f.currentStreak || 0}</div>
                          </div>
                        </div>
                      </div>
                      <button onClick={()=>setConfirmDelete(f._id)} className="btn btn-ghost" style={{ width:'100%', color:'var(--accent-hot)', fontSize:12, padding:'10px' }}>REMOVE ALLY</button>
                    </div>
                  ))}
                </div>
          )}
  
          {confirmDelete && (
            <ConfirmModal 
              title="TERMINATE ALLIANCE?"
              message="Are you sure you want to remove this ally from your fellowship? ⚔️"
              confirmText="REMOVE"
              onConfirm={removeFriend}
              onCancel={() => setConfirmDelete(null)}
            />
          )}
          {tab === 'requests' && (
            received.length === 0
              ? <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}><div style={{ fontSize:40, marginBottom:16 }}>📬</div>No incoming requests.</div>
              : <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {received.map(u => (
                    <div key={u._id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', background:'rgba(255,255,255,0.02)', borderRadius:18, border:'1px solid var(--border-glass)' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                        <div style={{ width:44, height:44, borderRadius:12, background:'var(--accent-hot)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>👤</div>
                        <div>
                          <div style={{ fontWeight:900, fontSize:15, color:'#fff' }}>{u.name}</div>
                          <div style={{ fontSize:12, color:'var(--text-muted)', fontWeight:800 }}>{u.uid}</div>
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:10 }}>
                        <button onClick={()=>accept(u._id)} className="btn btn-yellow" style={{ padding:'10px 20px', fontSize:12 }}>ACCEPT</button>
                        <button onClick={()=>decline(u._id)} className="btn btn-ghost" style={{ padding:'10px 16px', fontSize:12 }}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
          )}

          {tab === 'sent' && (
            sent.length === 0
              ? <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}><div style={{ fontSize:40, marginBottom:16 }}>📤</div>No sent requests. Keep hunting!</div>
              : <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {sent.map(u => (
                    <div key={u._id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', background:'rgba(255,255,255,0.02)', borderRadius:18, border:'1px solid var(--border-glass)' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                        <div style={{ width:44, height:44, borderRadius:12, background:'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>👤</div>
                        <div>
                          <div style={{ fontWeight:900, fontSize:15, color:'#fff' }}>{u.name}</div>
                          <div style={{ fontSize:12, color:'var(--text-muted)', fontWeight:800 }}>{u.uid}</div>
                        </div>
                      </div>
                      <div style={{ fontSize:11, color:'var(--primary-glow)', fontWeight:900, textTransform:'uppercase', letterSpacing:1 }}>⏳ PENDING</div>
                    </div>
                  ))}
                </div>
          )}
        </div>
      </div>
    </div>
  );
}
