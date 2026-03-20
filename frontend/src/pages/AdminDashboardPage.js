import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Navbar from '../components/Common/Navbar';
import ConfirmModal from '../components/Common/ConfirmModal';
import { useToast } from '../components/Common/ToastContext';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { show } = useToast();
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeTab, setActiveTab] = useState('users');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // groupId
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    const fetchData = async () => {
      try {
        const [uRes, gRes] = await Promise.all([
          api.get('/admin/users'),
          api.get('/admin/groups')
        ]);
        setUsers(uRes.data);
        setGroups(gRes.data);
      } catch (err) {
        console.error('Failed to fetch admin data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const viewChats = async (groupId) => {
    try {
      const res = await api.get(`/admin/groups/${groupId}/chats`);
      setChats(res.data);
      setSelectedGroup(groups.find(g => g._id === groupId));
      setActiveTab('chats');
    } catch (err) {
      show('Failed to load chats', { type: 'error' });
    }
  };

  const deleteGroup = async (groupId) => {
    try {
      await api.delete(`/admin/groups/${groupId}`);
      setGroups(groups.filter(g => g._id !== groupId));
      if (selectedGroup?._id === groupId) {
        setSelectedGroup(null);
        setActiveTab('groups');
      }
      setConfirmDelete(null);
      show('Circle Thanos-snapped from the records. 🌫️', { type: 'error' });
    } catch (err) {
      show('Delete failed', { type: 'error' });
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="animated-bg" style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'white' }}>
        <h1 style={{ fontWeight:900, fontSize:48 }}>ACCESS DENIED. 🗿</h1>
      </div>
    );
  }

  return (
    <div className="animated-bg" style={{ minHeight:'100vh', paddingBottom:60 }}>
      <Navbar />
      <div className="page-enter" style={{ maxWidth:1200, margin:'0 auto', padding:24 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:32 }}>
          <div>
            <h1 style={{ fontSize:36, margin:0 }}>Admin Fortress 🛡️</h1>
            <p style={{ color:'var(--text-muted)', fontWeight:700, marginTop:8 }}>The eyes of the Architect are everywhere. 🗿</p>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button className={`btn ${activeTab === 'users' ? 'btn-yellow' : 'btn-ghost'}`} onClick={() => setActiveTab('users')}>👤 Users</button>
            <button className={`btn ${activeTab === 'groups' ? 'btn-yellow' : 'btn-ghost'}`} onClick={() => setActiveTab('groups')}>👥 Groups</button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>📡 Scanning the tribe...</div>
        ) : (
          <div className="glass-card" style={{ padding:32 }}>
            {activeTab === 'users' && (
              <div>
                <h3 style={{ marginTop:0, marginBottom:24 }}>Registered Citizens ({users.length})</h3>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', color:'white' }}>
                    <thead>
                      <tr style={{ textAlign:'left', borderBottom:'1px solid var(--border-glass)' }}>
                        <th style={{ padding:12 }}>Name</th>
                        <th style={{ padding:12 }}>Email</th>
                        <th style={{ padding:12 }}>UID</th>
                        <th style={{ padding:12 }}>Role</th>
                        <th style={{ padding:12 }}>Aura</th>
                        <th style={{ padding:12 }}>Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u._id} style={{ borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding:12 }}>{u.name} {u.role === 'admin' && '🛡️'}</td>
                          <td style={{ padding:12, color:'var(--text-muted)' }}>{u.email}</td>
                          <td style={{ padding:12, fontWeight:900, color:'var(--primary-glow)' }}>{u.uid}</td>
                          <td style={{ padding:12 }}>{u.role.toUpperCase()}</td>
                          <td style={{ padding:12, fontWeight:900 }}>{u.aura} 🔥</td>
                          <td style={{ padding:12, fontSize:12, color:'var(--text-muted)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'groups' && (
              <div>
                <h3 style={{ marginTop:0, marginBottom:24 }}>Active Circles ({groups.length})</h3>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:20 }}>
                  {groups.map(g => (
                    <div key={g._id} className="glass-card" style={{ background:'rgba(255,255,255,0.02)', padding:20, borderColor:'rgba(255,255,255,0.05)' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                        <span style={{ fontSize:24 }}>{g.emoji || '👥'}</span>
                        <div style={{ display:'flex', gap:8 }}>
                          <button className="btn btn-ghost" style={{ padding:8, fontSize:12 }} onClick={() => viewChats(g._id)}>💬 Chats</button>
                          <button className="btn btn-ghost" style={{ padding:8, fontSize:12, color:'var(--accent-hot)' }} onClick={() => setConfirmDelete(g._id)}>🗑️</button>
                        </div>
                      </div>
                      <h4 style={{ margin:0, fontSize:18 }}>{g.name}</h4>
                      <p style={{ fontSize:12, color:'var(--text-muted)', marginBottom:0 }}>Creator: {g.creator?.name || 'Unknown'}</p>
                      <p style={{ fontSize:10, color:'rgba(255,255,255,0.2)', marginTop:4 }}>Members: {g.members?.length || 0}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'chats' && selectedGroup && (
              <div>
                <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:24 }}>
                  <button className="btn btn-ghost" onClick={() => setActiveTab('groups')}>← Back</button>
                  <h3 style={{ margin:0 }}>Interception: {selectedGroup.name} 📡</h3>
                </div>
                <div className="custom-scroll" style={{ maxHeight:500, overflowY:'auto', display:'flex', flexDirection:'column', gap:12, padding:10 }}>
                  {chats.length === 0 ? (
                    <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>Silence in the ranks. 🧘‍♂️</div>
                  ) : (
                    chats.map(m => (
                      <div key={m._id} style={{ background:'rgba(255,255,255,0.03)', padding:'12px 16px', borderRadius:16, border:'1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                          <span style={{ fontSize:14 }}>{m.sender?.avatarIcon || '👤'}</span>
                          <span style={{ fontWeight:800, fontSize:13 }}>{m.sender?.name}</span>
                          <span style={{ fontSize:10, color:'var(--text-muted)' }}>{new Date(m.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <div style={{ fontSize:14, color:'var(--text-muted)' }}>{m.content}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {confirmDelete && (
        <ConfirmModal 
          title="THANOS SNAP CIRCLE?"
          message="This will wipe the entire Tribe's memory and records from existence. One does not simply undo a Snap. 💀🌫️"
          confirmText="DO IT (ULTRA CHAD)"
          onConfirm={() => deleteGroup(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
          danger
        />
      )}
    </div>
  );
}
