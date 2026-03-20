import React, { useState } from 'react';
import api from '../../utils/api';
import ConfirmModal from '../Common/ConfirmModal';
import { useToast } from '../Common/ToastContext';

export default function Graveyard({ tasks, onDeleted }) {
  const [openGroups, setOpenGroups] = useState({});
  const [taskToDelete, setTaskToDelete] = useState(null);
  const { show } = useToast();
  if (!tasks || tasks.length === 0) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🌑</div>
        <div style={{ fontWeight: 800, fontSize:18 }}>The Graveyard is empty.</div>
        <div style={{ fontSize: 13, marginTop:8 }}>Finish some tasks to build your legacy. 🗿</div>
      </div>
    );
  }

  // Group by date
  const groups = tasks.reduce((acc, t) => {
    const d = new Date(t.completedAt || t.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    if (!acc[d]) acc[d] = [];
    acc[d].push(t);
    return acc;
  }, {});

  const confirmDelete = async () => {
    if (!taskToDelete) return;
    try {
      await api.delete(`/tasks/${taskToDelete._id}`);
      if (onDeleted) onDeleted(taskToDelete._id);
    } catch (e) { show('Purge failed! 🛡️', { type: 'error' }); }
    setTaskToDelete(null);
  };

  const toggleGroup = (date) => {
    setOpenGroups(prev => ({ ...prev, [date]: !prev[date] }));
  };

  return (
    <div className="custom-scroll" style={{ maxHeight: 600, overflowY: 'auto', paddingRight: 10 }}>
      {Object.entries(groups).map(([date, items]) => (
        <div key={date} style={{ marginBottom: 12 }}>
          <div 
            onClick={() => toggleGroup(date)}
            style={{ 
              fontSize: 11, 
              fontWeight: 900, 
              color: 'var(--primary-glow)', 
              marginBottom: 8, 
              letterSpacing: 1.5, 
              textTransform: 'uppercase',
              display:'flex',
              alignItems:'center',
              gap:10,
              cursor: 'pointer',
              background: 'rgba(255,255,255,0.03)',
              padding: '10px 16px',
              borderRadius: 12,
              userSelect: 'none'
            }}
          >
            <span>📅 {date} ({items.length})</span>
            <div style={{ flex:1, height:1, background:'var(--border-glass)' }} />
            <span style={{ fontSize:10, opacity:0.5 }}>{openGroups[date] ? '▲' : '▼'}</span>
          </div>
          
          {openGroups[date] && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, marginTop: 8, paddingLeft: 8 }}>
              {items.map(t => (
                <div 
                  key={t._id} 
                  className="glass-card"
                  style={{
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(255,255,255,0.01)',
                    borderColor: 'rgba(255,255,255,0.03)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ overflow:'hidden' }}>
                    <div style={{ 
                      fontSize: 13, 
                      fontWeight: 700, 
                      color: 'var(--text-muted)', 
                      textDecoration: 'line-through',
                      whiteSpace:'nowrap',
                      overflow:'hidden',
                      textOverflow:'ellipsis'
                    }}>
                      {t.title}
                    </div>
                    <div style={{ fontSize:9, color:'rgba(255,255,255,0.15)', fontWeight:800, marginTop:2 }}>
                      {new Date(t.completedAt || t.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setTaskToDelete(t); }}
                    style={{ background:'none', border:'none', cursor:'pointer', color:'var(--accent-hot)', padding:5, opacity:0.4 }}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {taskToDelete && (
        <ConfirmModal 
          title="Delete from History?"
          message={`Are you sure you want to permanently delete "${taskToDelete.title}"? This cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => setTaskToDelete(null)}
          confirmText="DELETE"
          danger={true}
        />
      )}
    </div>
  );
}
