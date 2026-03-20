import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useToast } from '../Common/ToastContext';

const COLORS = ['#FFD93D','#FF6B9D','#6BCB77','#4FC3F7','#FF8C42','#B39DDB','#FF6B6B','#A8E6CF'];

const overlay = { 
  position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:2500, 
  display:'flex', alignItems:'center', justifyContent:'center', 
  padding:'clamp(16px, 4vw, 24px)', backdropFilter:'blur(10px)',
  animation: 'fadeIn 0.2s ease-out'
};
const modal = { 
  background:'var(--surface-bg)', borderRadius:28, 
  padding:'clamp(24px, 6vw, 36px)', width:'100%', maxWidth:500, 
  boxShadow:'0 30px 90px rgba(0,0,0,0.7)', maxHeight:'95vh', 
  overflowY:'auto', border:'1px solid var(--border-glass)',
  position: 'relative'
};

export default function CreateTaskModal({ groupId, onClose, onCreated }) {
  const [form, setForm] = useState({ title:'', description:'', color:'#FFD93D', priority:'medium', dueDate:'', tags:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { show } = useToast();
  
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const getContrastColor = (hex) => {
    if (!hex) return '#1A1A2E';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (r * 0.299 + g * 0.587 + b * 0.114) > 165 ? '#1A1A2E' : '#FFFFFF';
  };

  const previewColor = getContrastColor(form.color);
  const isDarkNote = previewColor === '#FFFFFF';

  const handle = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const tags = form.tags.split(',').map(t=>t.trim()).filter(Boolean);
      const res = await api.post('/tasks', { ...form, tags, groupId });
      onCreated(res.data);
      show('Nice! Mission assigned ✨', { type: 'success' });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create mission');
    } finally { setLoading(false); }
  };

  return (
    <div style={overlay} onClick={e => e.target===e.currentTarget && onClose()} className="modal-overlay">
      <div style={modal} className="task-modal-box">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
          <h2 style={{ fontFamily:"'Fredoka One',cursive", fontSize:28, color:'white', margin:0 }}>📝 New Note</h2>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.05)', border:'none', width:40, height:40, borderRadius:'50%', fontSize:20, cursor:'pointer', color:'var(--text-muted)', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' }} className="icon-hover">✕</button>
        </div>
        
        {error && <div style={{ background:'rgba(255, 82, 82, 0.1)', border:'1px solid #ff5252', borderRadius:14, padding:'12px 16px', color:'#ff8a80', marginBottom:20, fontSize:14, fontWeight:800 }}>⚠️ {error}</div>}
        
        <form onSubmit={handle}>
          <div style={{ marginBottom:20 }}>
            <label style={{ fontWeight:900, fontSize:12, color:'var(--text-muted)', display:'block', marginBottom:8, textTransform:'uppercase', letterSpacing:1 }}>Title *</label>
            <input type="text" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="What's the objective?" required maxLength={100} style={{ padding:'14px 18px', borderRadius:14, background:'rgba(255,255,255,0.03)', border:'1px solid var(--border-glass)', color:'white' }} />
          </div>
          
          <div style={{ marginBottom:20 }}>
            <label style={{ fontWeight:900, fontSize:12, color:'var(--text-muted)', display:'block', marginBottom:8, textTransform:'uppercase', letterSpacing:1 }}>Description</label>
            <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Brief intel..." rows={3} style={{ resize:'vertical', padding:'14px 18px', borderRadius:14, background:'rgba(255,255,255,0.03)', border:'1px solid var(--border-glass)', color:'white' }} />
          </div>
          
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
            <div>
              <label style={{ fontWeight:900, fontSize:12, color:'var(--text-muted)', display:'block', marginBottom:8, textTransform:'uppercase', letterSpacing:1 }}>Priority</label>
              <select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})} style={{ padding:'12px', borderRadius:14, background:'rgba(255,255,255,0.03)', border:'1px solid var(--border-glass)', color:'white', appearance:'none' }}>
                <option value="low">🟡 Low</option>
                <option value="medium">🟠 Medium</option>
                <option value="urgent">🔴 Urgent</option>
              </select>
            </div>
            <div>
              <label style={{ fontWeight:900, fontSize:12, color:'var(--text-muted)', display:'block', marginBottom:8, textTransform:'uppercase', letterSpacing:1 }}>Due Date</label>
              <input type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})} style={{ padding:'12px', borderRadius:14, background:'rgba(255,255,255,0.03)', border:'1px solid var(--border-glass)', color:'white' }} />
            </div>
          </div>
          
          <div style={{ marginBottom:20 }}>
            <label style={{ fontWeight:900, fontSize:12, color:'var(--text-muted)', display:'block', marginBottom:12, textTransform:'uppercase', letterSpacing:1 }}>Note Color Theme</label>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              {COLORS.map(c => (
                <div key={c} onClick={()=>setForm({...form,color:c})} style={{ width:36, height:36, borderRadius:10, background:c, cursor:'pointer', border: form.color===c ? '3px solid white' : '3px solid transparent', transition:'all 0.2s', boxShadow: form.color===c ? `0 0 15px ${c}` : 'none' }} />
              ))}
            </div>
          </div>
          
          <div style={{ marginBottom:28 }}>
            <label style={{ fontWeight:900, fontSize:12, color:'var(--text-muted)', display:'block', marginBottom:8, textTransform:'uppercase', letterSpacing:1 }}>Tags (Comma Separated)</label>
            <input type="text" value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})} placeholder="focus, grind, tribe" style={{ padding:'14px 18px', borderRadius:14, background:'rgba(255,255,255,0.03)', border:'1px solid var(--border-glass)', color:'white' }} />
          </div>
          
          {/* Animated Preview */}
          <div style={{ 
            background: `linear-gradient(135deg, ${form.color}, ${form.color}EE)`, 
            borderRadius: 20, 
            padding: '24px', 
            marginBottom: 32, 
            fontWeight: 950, 
            color: previewColor, 
            fontSize: 18, 
            position: 'relative', 
            boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            border: isDarkNote ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.1)',
            transform: 'rotate(-0.5deg)'
          }}>
            <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', fontSize:22, filter:'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>📍</div>
            <div style={{ opacity: form.title ? 1 : 0.5 }}>{form.title || 'Mission Objective Preview...'}</div>
            <div style={{ fontSize:11, marginTop:8, opacity:0.7, fontWeight:800, textTransform:'uppercase', letterSpacing:1 }}>Preview Mode</div>
          </div>
          
          <button type="submit" className="btn btn-yellow" style={{ width:'100%', padding:'18px', fontSize:16, borderRadius:16 }} disabled={loading}>
            {loading ? '🛰️ Transmitting...' : '✨ Deploy Note'}
          </button>
        </form>
      </div>
      <style>{`
        .task-modal-box {
          animation: modalSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (max-width: 600px) {
          .modal-overlay {
            align-items: flex-end !important;
            padding: 0 !important;
          }
          .task-modal-box {
            max-width: 100% !important;
            border-bottom-left-radius: 0 !important;
            border-bottom-right-radius: 0 !important;
            max-height: 90vh !important;
            padding: 24px 20px 40px !important;
            animation: bottomSheetUp 0.35s cubic-bezier(0.2, 0.8, 0.2, 1) !important;
          }
          @keyframes bottomSheetUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
