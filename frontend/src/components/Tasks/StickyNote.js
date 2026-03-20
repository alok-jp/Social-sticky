import React, { useState } from 'react';
import api from '../../utils/api';
import { useToast } from '../Common/ToastContext';
import { useAuth } from '../../context/AuthContext';

import ConfirmModal from '../Common/ConfirmModal';

const COLORS = ['#FFD93D','#FF6B9D','#6BCB77','#4FC3F7','#FF8C42','#B39DDB','#FF6B6B','#A8E6CF'];

const priorityColors = { low:'#6BCB77', medium:'#FF9F43', urgent:'#FF4B2B' };

export default function StickyNote({ task, onUpdate, onDelete, compact }) {
  const [loading, setLoading] = useState(false);
  const { show } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);
  const { user } = useAuth();

  const toggle = async () => {
    // [RULE] If already completed, cannot uncheck.
    if (task.completed) return;

    if (task.owner?._id !== user._id) {
      show('Not your mission, soldier! 💂', { type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await api.patch(`/tasks/${task._id}/toggle`);
      onUpdate(res.data);
      
      if (res.data.completed) {
        const msg = res.data.aiMessage || (res.data.auraAwarded > 0 ? `+${res.data.auraAwarded} Aura!! 🔥` : 'Task Completed! 🗿');
        show(msg, { type: 'celebrate', duration: 2500 });

        if (res.data.bonus) {
          setTimeout(() => show(`🔥 CHAD BONUS: +${res.data.bonus} Aura!! 🗿`, { type: 'celebrate', duration: 2800 }), 600);
        }
        
      }
    } catch (err) {
      show(err.response?.data?.message || 'Failed to update mission', { type: 'error' });
    } finally { setLoading(false); }
  };

  const del = async () => {
    if (task.owner?._id !== user._id) {
      show('Only the owner can scrap this! 💀', { type: 'error' });
      return;
    }
    try {
      await api.delete(`/tasks/${task._id}`);
      onDelete(task._id);
      setShowConfirm(false);
    } catch (err) {
      if (err.response?.status === 403) show(err.response.data?.message || 'Unauthorized purge! 🛡️', { type: 'error' });
      else show('Failed to scrap mission', { type: 'error' });
    }
  };

  const isOverdue = task.dueDate && !task.completed && new Date(task.dueDate) < new Date();

  const getContrastColor = (hex) => {
    if (!hex) return '#1A1A2E';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    // [Chad Math] Perceptive luminance threshold
    return (r * 0.299 + g * 0.587 + b * 0.114) > 165 ? '#1A1A2E' : '#FFFFFF';
  };

  const textColor = getContrastColor(task.color);
  const isDarkNote = textColor === '#FFFFFF';
  const mutedTextColor = isDarkNote ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.65)';
  const noteColor = task.color || '#FFD93D';

  return (
    <div 
      id={`task-${task._id}`} 
      className="sticky-note-hover"
      style={{
        background: `linear-gradient(135deg, ${noteColor}, ${noteColor}EE)`,
        borderRadius: 22,
        padding: compact ? 18 : 24,
        position: 'relative',
        boxShadow: task.completed
          ? '2px 4px 12px rgba(0,0,0,0.1)'
          : '0 12px 35px rgba(0,0,0,0.15)',
        opacity: task.completed ? 0.75 : 1,
        transform: task.completed ? 'none' : 'rotate(-0.8deg)',
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        cursor: 'default',
        minHeight: compact ? 100 : 170,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        border: compact ? `2px solid ${noteColor}99` : (isDarkNote ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.08)'),
        boxShadow: compact ? `0 4px 15px ${noteColor}33` : (task.completed ? '2px 4px 12px rgba(0,0,0,0.1)' : '0 12px 35px rgba(0,0,0,0.15)')
      }}
    >
      {/* Pin */}
      <div style={{ position:'absolute', top:-14, left:'50%', transform:'translateX(-50%)', fontSize:24, filter:'drop-shadow(0 4px 6px rgba(0,0,0,0.4))' }}>📍</div>

      {/* Priority badge */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ 
          background: priorityColors[task.priority] || '#ddd', 
          borderRadius:10, 
          padding:'4px 12px', 
          fontSize:10, 
          fontWeight:950, 
          color: 'white', 
          textShadow: '0 1px 3px rgba(0,0,0,0.3)',
          letterSpacing: 0.8,
          boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
        }}>
          {task.priority?.toUpperCase()}
        </span>
        {!task.group && (
          <button onClick={() => setShowConfirm(true)} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', opacity:0.5, transition:'all 0.3s' }} className="icon-hover">🗑️</button>
        )}
      </div>

      {/* Title */}
      <div style={{ 
        fontWeight:950, 
        fontSize: compact ? 16 : 19, 
        color: textColor, 
        lineHeight: 1.25,
        wordBreak:'break-word', 
        textDecoration: task.completed ? 'line-through' : 'none', 
        opacity: task.completed ? 0.6 : 1,
        letterSpacing: -0.3
      }}>
        {task.title}
      </div>

      {task.description && !compact && (
        <div style={{ fontSize:14, color: mutedTextColor, lineHeight:1.5, fontWeight:700 }}>{task.description}</div>
      )}

      <div style={{ marginTop:'auto', display:'flex', flexDirection:'column', gap:12 }}>
        {task.dueDate && !compact && (
          <div style={{ fontSize:12, fontWeight:900, color: isOverdue ? (isDarkNote ? '#ff8a80' : '#d32f2f') : mutedTextColor, display:'flex', alignItems:'center', gap:8 }}>
            {isOverdue ? '⚠️ OVERDUE' : '📅 MISSION DATE'}: {new Date(task.dueDate).toLocaleDateString()}
          </div>
        )}

        {task.owner && (
          <div style={{ fontSize:11, color: mutedTextColor, fontWeight:900, textTransform:'uppercase', letterSpacing:1, display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ opacity:0.7 }}>OPERATIVE:</span> {task.owner?.name || 'You'}
          </div>
        )}

        {/* Tags */}
        {task.tags?.length > 0 && !compact && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {task.tags.map(tag => (
              <span key={tag} style={{ background:'rgba(0,0,0,0.08)', borderRadius:8, padding:'4px 12px', fontSize:10, fontWeight:900, color: textColor, border:`1px solid ${isDarkNote ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}` }}>#{tag}</span>
            ))}
          </div>
        )}

        {/* Checkbox section */}
        <div style={{ display:'flex', alignItems:'center', gap:12, paddingTop:12, borderTop:`1px solid ${isDarkNote ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}` }}>
          <button
            onClick={toggle}
            disabled={loading || task.completed}
            style={{
              background: task.completed ? (isDarkNote ? '#fff' : '#000') : 'rgba(255,255,255,0.3)',
              border: `2px solid ${isDarkNote ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)'}`,
              borderRadius: 12,
              width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, cursor: task.completed ? 'default' : 'pointer', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              flexShrink: 0,
              color: task.completed ? (isDarkNote ? '#000' : '#fff') : 'transparent',
              boxShadow: task.completed ? '0 4px 15px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            {task.completed ? '✓' : ''}
          </button>
          <div style={{ display:'flex', flexDirection:'column' }}>
            <span style={{ fontSize:12, fontWeight:950, color: textColor, opacity: 0.9, textTransform:'uppercase', letterSpacing:1 }}>
              {task.completed ? 'Mission Accomplished' : 'Active Intelligence'}
            </span>
            {task.completed && task.completedAt && (
              <span style={{ fontSize:10, color: mutedTextColor, fontWeight:800 }}>{new Date(task.completedAt).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      </div>
      
      {showConfirm && (
        <ConfirmModal 
          title="PURGE INTEL?"
          message="Mission failed successfully? This tactical note will be removed from your mission intel forever. 💀🗿"
          onConfirm={del}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}
