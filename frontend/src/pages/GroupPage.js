import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Common/Navbar';
import TaskBoard from '../components/Tasks/TaskBoard';
import GroupChat from '../components/Chat/GroupChat';
import ConfirmModal from '../components/Common/ConfirmModal';
import api from '../utils/api';
import { useToast } from '../components/Common/ToastContext';

export default function GroupPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();
  const [group, setGroup]   = useState(null);
  
  const toggleReaction = async (taskId, emoji) => {
    try {
      const res = await api.post(`/tasks/${taskId}/react`, { emoji });
      setActivity(act => act.map(t => t._id === taskId ? { ...t, reactions: res.data.reactions } : t));
    } catch(e) { console.error(e); }
  };
  const [loading, setLoading] = useState(true);
  const [tab, setTab]       = useState('tasks');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteSearch, setInviteSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [inviteMsg, setInviteMsg] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null); // { type, targetId, title, message }

  const handleRemoveMember = async (targetId) => {
    try {
      await api.delete(`/groups/${id}/members/${targetId}`);
      setGroup(prev => ({
        ...prev,
        members: prev.members.filter(m => m.user._id !== targetId)
      }));
      setConfirmDelete(null);
    } catch (err) { show(err.response?.data?.message || 'Ejection failed! 🛡️', { type: 'error' }); }
  };

  const handleDeleteCircle = async () => {
    try {
      await api.delete(`/groups/${id}`);
      window.location.href = '/dashboard';
    } catch (err) { show(err.response?.data?.message || 'Purge failed! 🗑️', { type: 'error' }); }
  };

  const handleCancelInvite = async (targetId) => {
    try {
      await api.delete(`/groups/${id}/invite/${targetId}`);
      setGroup(prev => ({
        ...prev,
        pendingInvites: prev.pendingInvites.filter(u => u._id !== targetId)
      }));
    } catch (err) { show(err.response?.data?.message || 'Signal lost! 📡', { type: 'error' }); }
  };
  const [activity, setActivity] = useState([]);
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    api.get(`/groups/${id}`)
      .then(res => setGroup(res.data))
      .catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false));
      
    api.get(`/tasks/group/${id}/activity`).then(res => setActivity(res.data)).catch(()=>{});
    api.get('/users/friends').then(res => setFriends(res.data.friends || [])).catch(()=>{});
  }, [id]);

  const searchFriends = async (q) => {
    setInviteSearch(q);
    if (q.length < 2) { setSearchResults([]); return; }
    const res = await api.get(`/users/search?q=${q}`);
    setSearchResults(res.data);
  };

  const sendInvite = async (userId) => {
    try {
      await api.post(`/groups/${id}/invite`, { userId });
      setInviteMsg('✅ Invite sent!');
      setSearchResults([]);
      setInviteSearch('');
      setTimeout(() => setInviteMsg(''), 3000);
    } catch (err) {
      setInviteMsg('❌ ' + (err.response?.data?.message || 'Error'));
    }
  };

  const leaveGroup = async () => {
    await api.delete(`/groups/${id}/leave`);
    navigate('/dashboard');
  };

  if (loading) return (
    <div className="animated-bg" style={{ minHeight:'100vh' }}>
      <Navbar />
      <div style={{ textAlign:'center', padding:60, fontSize:20, color:'var(--text-muted)' }}>📡 Accessing Circle Data...</div>
    </div>
  );

  if (!group) return null;

  const myRole = group.members?.find(m => m.user?._id === user._id)?.role;

  return (
    <div className="animated-bg" style={{ minHeight:'100vh', paddingBottom:60 }}>
      <Navbar />
      <div style={{ maxWidth:1300, margin:'0 auto', padding:'10px 24px' }} className="page-enter">

        {/* Group Header */}
        <div className="glass-card" style={{ background: group.color || 'var(--primary-glow)', borderRadius:24, padding:'24px 28px', marginBottom:28, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16, border:'none' }}>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ fontSize:48 }}>{group.emoji || '📚'}</div>
            <div>
              <h1 style={{ fontFamily:"'Fredoka One',cursive", fontSize:28, color:'#1A1A2E', marginBottom:2 }}>{group.name}</h1>
              <p style={{ color:'rgba(0,0,0,0.55)', fontSize:14, fontWeight:700 }}>{group.description || 'No description'}</p>
              <div style={{ display:'flex', gap:6, marginTop:6 }}>
                {group.members?.slice(0,5).map((m, i) => (
                  <div key={i} title={m.user?.name} style={{ width:30, height:30, borderRadius:'50%', background:'#1A1A2E', color:'#FFD93D', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, border:'2px solid white' }}>
                    {m.user?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                ))}
                {group.members?.length > 5 && <div style={{ width:30, height:30, borderRadius:'50%', background:'rgba(0,0,0,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800 }}>+{group.members.length-5}</div>}
              </div>
            </div>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {myRole === 'admin' && (
              <button onClick={()=>setShowInvite(s=>!s)} className="btn btn-yellow" style={{ background:'#1A1A2E', color:'#FFD93D', boxShadow:'none' }}>👥 Invite</button>
            )}
            <button 
              onClick={() => setConfirmDelete({
                type: 'leave',
                title: 'LEAVE TRIBE?',
                message: 'Are you sure you want to leave this circle? The grind continues regardless. ⚔️'
              })} 
              className="btn btn-ghost" 
              style={{ background:'rgba(255,255,255,0.2)', color:'#000', fontWeight:900, border:'none' }}
            >
              🚪 Leave
            </button>
          </div>
        </div>

        {/* Invite Panel */}
            {showInvite && (
              <div style={{ marginBottom:32, padding:32, background:'rgba(255,255,255,0.02)', borderRadius:20, border:'1px solid var(--border-glass)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                  <div style={{ fontWeight:900, color:'var(--primary-glow)', fontSize:13, textTransform:'uppercase', letterSpacing:1 }}>⚔️ Summon Allies</div>
                  <input 
                    type="text" 
                    value={inviteSearch} 
                    onChange={e=>searchFriends(e.target.value)} 
                    placeholder="Search by precise UID (#...)" 
                    style={{ width:260, height:40, fontSize:12 }} 
                  />
                </div>

                {inviteMsg && <div style={{ marginBottom:16, fontWeight:800, color: inviteMsg.startsWith('✅') ? 'var(--primary-glow)' : 'var(--accent-hot)', fontSize:13 }}>{inviteMsg}</div>}

                {searchResults.length > 0 ? (
                  <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:24 }}>
                    {searchResults.map(u => (
                      <div key={u._id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', background:'rgba(255,255,255,0.03)', borderRadius:16, border:'1px solid var(--border-glass)' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                          <div style={{ width:36, height:36, borderRadius:10, background:'var(--primary-glow)', color:'#000', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:950, fontSize:15 }}>{u.name[0]}</div>
                          <div style={{ fontWeight:800, fontSize:15 }}>{u.name} <span style={{ color:'var(--text-muted)', fontSize:11, marginLeft:6 }}>{u.uid}</span></div>
                        </div>
                        <button onClick={()=>sendInvite(u._id)} className="btn btn-yellow" style={{ padding:'8px 20px', fontSize:12 }}>INVITE</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize:12, color:'var(--text-muted)', fontWeight:800, marginBottom:16, textTransform:'uppercase', letterSpacing:0.5 }}>Your Fellow Allies</div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:12 }}>
                      {friends.filter(f => !group.members.some(m => m.user._id === f._id)).length === 0 ? (
                        <div style={{ color:'var(--text-muted)', fontSize:12, fontStyle:'italic' }}>All your allies are already in the Tribe. 🛡️</div>
                      ) : (
                        friends.filter(f => !group.members.some(m => m.user._id === f._id)).map(f => (
                          <div key={f._id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background:'rgba(255,255,255,0.01)', borderRadius:14, border:'1px solid var(--border-glass)' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                              <div style={{ width:32, height:32, borderRadius:8, background:'rgba(255,255,255,0.05)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:13 }}>{f.name[0]}</div>
                              <div style={{ fontWeight:800, fontSize:13 }}>{f.name}</div>
                            </div>
                            <button onClick={()=>sendInvite(f._id)} className="btn btn-ghost" style={{ padding:'6px 12px', fontSize:10 }}>INVITE</button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Show Pending Invites */}
                {group.pendingInvites?.length > 0 && (
                  <div style={{ marginTop:32, paddingTop:24, borderTop:'1px solid var(--border-glass)' }}>
                    <div style={{ fontSize:12, color:'var(--text-muted)', fontWeight:800, marginBottom:16, textTransform:'uppercase', letterSpacing:0.5 }}>Active Summons ({group.pendingInvites.length})</div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:12 }}>
                      {group.pendingInvites.map(u => (
                        <div key={u._id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background:'rgba(255, 82, 82, 0.03)', borderRadius:14, border:'1px solid rgba(255, 82, 82, 0.1)' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <div style={{ width:32, height:32, borderRadius:8, background:'rgba(255, 82, 82, 0.1)', color:'#ff5252', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:13 }}>{u.name?.[0]}</div>
                            <div style={{ fontWeight:800, fontSize:13, color:'white' }}>{u.name}</div>
                          </div>
                          <button onClick={()=>handleCancelInvite(u._id)} className="btn btn-ghost" style={{ padding:'6px 14px', fontSize:10, color:'#ff5252', border:'1px solid rgba(255, 82, 82, 0.2)' }}>CANCEL</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

        {/* Tabs */}
        <div style={{ display:'flex', gap:8, marginBottom:24, flexWrap:'wrap' }}>
          {[['tasks','📌 Circle Board'],['activity','⚡ Intel (24h)'],['chat','💬 Comms'],['members','🛡️ Tribe']].map(([val,label]) => (
            <button key={val} onClick={()=>setTab(val)} className={`btn ${tab===val ? 'btn-yellow' : 'btn-ghost'}`} style={{ padding:'10px 20px', fontSize:13 }}>{label}</button>
          ))}
        </div>

        {/* Content */}
        {tab === 'tasks' && (
          <TaskBoard groupId={id} />
        )}

        {tab === 'activity' && (
          <div className="glass-card" style={{ padding:24 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
              <h3 style={{ fontSize:22, margin:0 }}>⚡ Tactical Intel (24h)</h3>
              <button className="btn btn-ghost" style={{ padding:'8px 16px', fontSize:11 }} onClick={() => api.get(`/tasks/group/${id}/activity`).then(res => setActivity(res.data))}>Refresh</button>
            </div>
            {activity.length === 0 ? (
              <div style={{ color:'var(--text-muted)', textAlign:'center', padding:30 }}>No missions completed in the last 24 hours. 🧘‍♂️</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {activity.map(t => (
                  <div key={t._id} className="glass-card" style={{ display:'flex', alignItems:'flex-start', gap:14, padding:'24px', background:'rgba(255,255,255,0.03)', borderLeft:`4px solid ${t.color || 'var(--primary-glow)'}` }}>
                    <div style={{ width:44, height:44, borderRadius:12, background:'var(--bg-dark)', color:'var(--primary-glow)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:950, flexShrink:0, border:'1px solid var(--border-glass)' }}>
                      {t.owner?.name?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:900, fontSize:15, color:'white', display:'flex', alignItems:'center', gap:8 }}>
                        {t.owner?.name} <span style={{ color:'var(--primary-glow)', fontWeight:900, fontSize:12, textTransform:'uppercase', letterSpacing:1 }}>⚔️ crushed a task</span>
                      </div>
                      <div style={{ fontSize:18, fontWeight:950, marginTop:6, color:'white', letterSpacing:-0.2 }}>{t.title}</div>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:10, fontWeight:800, textTransform:'uppercase', letterSpacing:1, display:'flex', alignItems:'center', gap:6 }}>
                        <span>⏱️ {new Date(t.completedAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</span>
                        <span>•</span>
                        <span>📅 {new Date(t.completedAt).toLocaleDateString()}</span>
                      </div>
                      <div style={{ display:'flex', gap:8, marginTop:16 }}>
                        {['🔥', '🙌', '🚀', '👀'].map(em => {
                          const count = t.reactions?.filter(r => r.emoji === em).length || 0;
                          const hasReacted = t.reactions?.some(r => r.emoji === em && r.user === user?._id);
                          return (
                            <button key={em} onClick={() => toggleReaction(t._id, em)} style={{ background: hasReacted ? 'var(--primary-glow)' : 'rgba(255,255,255,0.08)', border:'1px solid var(--border-glass)', borderRadius:11, padding:'6px 14px', fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', gap:6, transition:'all 0.2s', color: hasReacted ? '#000' : '#fff' }}>
                              {em} {count > 0 && <span style={{ fontSize:13, fontWeight:950 }}>{count}</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'chat' && (
          <div style={{ height:600 }}>
            <GroupChat groupId={id} stealth={user?.role === 'admin'} />
          </div>
        )}

        {tab === 'members' && (
          <div className="glass-card" style={{ padding:32 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:32, flexWrap:'wrap', gap:16 }}>
              <h3 style={{ fontSize:24, margin:0 }}>🛡️ The Tribe ({group.members?.length})</h3>
              {myRole === 'admin' && (
                <div style={{ display:'flex', gap:10 }}>
                  <button 
                    onClick={() => setConfirmDelete({ 
                      type:'circle', 
                      title:'THANOS SNAP CIRCLE?', 
                      message:'This will permanently delete all missions, intelligence, and comms for this Tribe. I don\'t feel so good... 💀🌫️' 
                    })} 
                    className="btn btn-ghost" 
                    style={{ fontSize:11, color:'var(--accent-hot)', border:'1px solid rgba(255, 82, 82, 0.2)' }}
                  >
                    🗑️ DELETE CIRCLE
                  </button>
                  <button 
                    onClick={() => setShowInvite(!showInvite)} 
                    className="btn btn-yellow" 
                    style={{ background:'var(--primary-glow)', color:'#000', fontSize:12, padding:'10px 20px' }}
                  >
                    {showInvite ? '✕ CLOSE' : '➕ ADD TO TRIBE'}
                  </button>
                </div>
              )}
            </div>

            {showInvite && (
              <div style={{ marginBottom:32, padding:24, background:'rgba(255,255,255,0.02)', borderRadius:20, border:'1px solid var(--border-glass)' }}>
                <div style={{ fontWeight:900, color:'var(--primary-glow)', fontSize:13, marginBottom:16, textTransform:'uppercase', letterSpacing:1 }}>🔍 Summon Ally</div>
                <div style={{ display:'flex', gap:12 }}>
                  <input 
                    type="text" 
                    value={inviteSearch} 
                    onChange={e=>searchFriends(e.target.value)} 
                    placeholder="Search by precise UID (#...)" 
                    style={{ flex:1, height:48 }} 
                  />
                </div>
                {searchResults.length > 0 && (
                  <div style={{ marginTop:20, display:'flex', flexDirection:'column', gap:10 }}>
                    {searchResults.map(u => (
                      <div key={u._id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', background:'rgba(255,255,255,0.03)', borderRadius:16, border:'1px solid var(--border-glass)' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                          <div style={{ width:36, height:36, borderRadius:10, background:'var(--primary-glow)', color:'#000', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:950, fontSize:15 }}>{u.name[0]}</div>
                          <div style={{ fontWeight:800, fontSize:15 }}>{u.name} <span style={{ color:'var(--text-muted)', fontSize:11, marginLeft:6 }}>{u.uid}</span></div>
                        </div>
                        <button onClick={()=>sendInvite(u._id)} className="btn btn-yellow" style={{ padding:'8px 20px', fontSize:12 }}>INVITE</button>
                      </div>
                    ))}
                  </div>
                )}
                {inviteMsg && <div style={{ marginTop:16, fontWeight:800, color: inviteMsg.startsWith('✅') ? 'var(--primary-glow)' : 'var(--accent-hot)', fontSize:14 }}>{inviteMsg}</div>}
              </div>
            )}

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px, 1fr))', gap:20 }}>
              {group.members?.map(m => (
                <div key={m.user?._id} className="glass-card" style={{ display:'flex', alignItems:'center', gap:16, padding:'20px', background:'rgba(255,255,255,0.02)', border:'1px solid var(--border-glass)', borderRadius:22 }}>
                  <div style={{ position:'relative' }}>
                    <div style={{ width:52, height:52, borderRadius:16, background: m.role==='admin' ? 'var(--primary-glow)' : 'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:950, color: m.role==='admin' ? '#000' : '#fff', border:'1px solid var(--border-glass)' }}>
                      {m.user?.name?.[0]?.toUpperCase()}
                    </div>
                    {m.role === 'admin' && <div style={{ position:'absolute', bottom:-5, right:-5, fontSize:16 }}>🛡️</div>}
                  </div>
                  <div style={{ flex:1, overflow:'hidden' }}>
                    <div style={{ fontWeight:900, fontSize:17, color:'white', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {m.user?.name} {m.user?._id === user._id ? <span style={{ color:'var(--primary-glow)', fontSize:12 }}>(YOU)</span> : ''}
                    </div>
                    <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:800, marginTop:2, textTransform:'uppercase', letterSpacing:0.5 }}>
                      {m.role === 'admin' ? 'Circle Master' : 'Frontliner'}
                    </div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontSize:10, color: activity.some(a => a.owner?._id === m.user?._id) ? 'var(--primary-glow)' : 'rgba(255,255,255,0.3)', fontWeight:900 }}>
                          {activity.some(a => a.owner?._id === m.user?._id) ? 'ACTIVE' : 'IDLE'}
                        </div>
                        <div style={{ 
                          width:8, height:8, borderRadius:'50%', 
                          background: activity.some(a => a.owner?._id === m.user?._id) ? 'var(--primary-glow)' : 'rgba(255,255,255,0.1)', 
                          boxShadow: activity.some(a => a.owner?._id === m.user?._id) ? '0 0 10px var(--primary-glow)' : 'none',
                          animation: activity.some(a => a.owner?._id === m.user?._id) ? 'pulse 2s infinite' : 'none',
                          marginLeft:'auto', marginTop:4
                        }}></div>
                      </div>
                      {myRole === 'admin' && m.user?._id !== user._id && (
                        <button 
                          onClick={() => setConfirmDelete({ 
                            type:'member', 
                            targetId: m.user._id,
                            title:'EJECT MEMBER?',
                            message:`One does not simply stay in the Tribe without the grind. Are you sure you want to eject ${m.user.name}? 🛡️💨`
                          })}
                          style={{ background:'rgba(255, 82, 82, 0.1)', border:'none', color:'#ff5252', width:32, height:32, borderRadius:10, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}
                          className="icon-hover"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {confirmDelete && (
          <ConfirmModal 
            title={confirmDelete.title}
            message={confirmDelete.message}
            onConfirm={() => {
              if (confirmDelete.type === 'circle') handleDeleteCircle();
              else if (confirmDelete.type === 'member') handleRemoveMember(confirmDelete.targetId);
              else if (confirmDelete.type === 'leave') leaveGroup();
            }}
            onCancel={() => setConfirmDelete(null)}
          />
        )}
      </div>
    </div>
  );
}
