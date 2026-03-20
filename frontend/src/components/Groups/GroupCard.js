import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function GroupCard({ group }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/group/${group._id}`)}
      className="wiggle"
      style={{
        background: group.color || '#FFD93D',
        borderRadius: 20,
        padding: 20,
        cursor: 'pointer',
        boxShadow: '4px 6px 20px rgba(0,0,0,0.12)',
        transition: 'all 0.2s',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ fontSize: 40, marginBottom: 10 }}>{group.emoji || '📚'}</div>
      <div style={{ fontFamily:"'Fredoka One',cursive", fontSize: 20, color: '#1A1A2E', marginBottom: 4 }}>{group.name}</div>
      {group.description && <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.55)', marginBottom: 10, lineHeight: 1.4 }}>{group.description}</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex' }}>
          {group.members?.slice(0,4).map((m, i) => (
            <div key={i} style={{ width:28, height:28, borderRadius:'50%', background:'#1A1A2E', color:'#FFD93D', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, marginLeft: i>0 ? -8 : 0, border:'2px solid white' }}>
              {m.user?.name?.[0]?.toUpperCase() || '?'}
            </div>
          ))}
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(0,0,0,0.5)' }}>{group.members?.length} members</span>
      </div>
    </div>
  );
}
