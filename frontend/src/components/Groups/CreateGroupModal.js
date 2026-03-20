import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const COLORS = ['#FFD93D','#FF6B9D','#6BCB77','#4FC3F7','#FF8C42','#B39DDB'];
const EMOJIS = ['📚','🎯','🔥','💡','🚀','🎮','📖','✏️','🧪','🎨','🏆','💪'];

const overlay = { 
  position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:2500, 
  display:'flex', alignItems:'center', justifyContent:'center', 
  padding:'clamp(16px, 4vw, 24px)', backdropFilter:'blur(10px)',
  animation: 'fadeIn 0.2s ease-out'
};
const modal = { 
  background:'var(--surface-bg)', borderRadius:28, padding:'clamp(24px, 5vw, 32px)', 
  width:'100%', maxWidth:480, border:'1px solid var(--border-glass)', 
  boxShadow:'0 30px 90px rgba(0,0,0,0.7)', position: 'relative',
  maxHeight: '90vh', overflowY: 'auto'
};

export default function CreateGroupModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name:'', description:'', emoji:'📚', color:'#FFD93D', isPrivate:false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const handle = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await api.post('/groups', form);
      onCreated(res.data); onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={overlay} onClick={e=>e.target===e.currentTarget&&onClose()} className="modal-overlay">
      <div style={modal} className="group-modal-box">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <h2 style={{ fontSize:26, margin:0, color:'var(--primary-glow)' }}>✨ Create Circle</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:24, cursor:'pointer', color:'var(--text-muted)' }}>✕</button>
        </div>
        {error && <div style={{ background:'rgba(255,0,0,0.1)', border:'1px solid rgba(255,0,0,0.2)', borderRadius:12, padding:'12px 16px', color:'#ff4d4d', marginBottom:20, fontSize:14, fontWeight:700 }}>⚠️ {error}</div>}
        <form onSubmit={handle}>
          <div style={{ marginBottom:20 }}>
            <label style={{ fontWeight:800, fontSize:12, color:'var(--text-muted)', display:'block', marginBottom:8, textTransform:'uppercase', letterSpacing:1 }}>Circle Name *</label>
            <input type="text" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Grinders Only 🗿" required style={{ width:'100%', boxSizing:'border-box' }} />
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ fontWeight:800, fontSize:12, color:'var(--text-muted)', display:'block', marginBottom:8, textTransform:'uppercase', letterSpacing:1 }}>Vision / Description</label>
            <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="What's the energy here?" rows={3} style={{ width:'100%', boxSizing:'border-box' }} />
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ fontWeight:800, fontSize:12, color:'var(--text-muted)', display:'block', marginBottom:8, textTransform:'uppercase', letterSpacing:1 }}>Vibe Emoji</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
              {EMOJIS.map(em => (
                <div key={em} onClick={()=>setForm({...form,emoji:em})} style={{ fontSize:26, cursor:'pointer', padding:8, borderRadius:12, background: form.emoji===em ? 'var(--primary-glow)' : 'rgba(255,255,255,0.03)', color: form.emoji===em ? '#000' : '#fff', transition:'all 0.2s' }}>{em}</div>
              ))}
            </div>
          </div>
          <div style={{ marginBottom:24 }}>
            <label style={{ fontWeight:800, fontSize:12, color:'var(--text-muted)', display:'block', marginBottom:8, textTransform:'uppercase', letterSpacing:1 }}>Card Aesthetic</label>
            <div style={{ display:'flex', gap:10 }}>
              {COLORS.map(c => (
                <div key={c} onClick={()=>setForm({...form,color:c})} style={{ width:36, height:36, borderRadius:10, background:c, cursor:'pointer', border: form.color===c ? '3px solid #fff' : '2px solid transparent', boxSizing:'border-box' }} />
              ))}
            </div>
          </div>
          {/* Preview */}
          <div style={{ background:form.color, borderRadius:18, padding:'20px 24px', marginBottom:24, display:'flex', alignItems:'center', gap:16, boxShadow:'0 10px 30px rgba(0,0,0,0.1)' }}>
            <span style={{ fontSize:40 }}>{form.emoji}</span>
            <div>
              <div style={{ fontWeight:900, fontSize:18, color:'#1A1A2E' }}>{form.name || 'Your Circle Name'}</div>
              <div style={{ fontSize:13, color:'rgba(26,26,46,0.6)', fontWeight:700, marginTop:4 }}>{form.description || 'Setting the vision...'}</div>
            </div>
          </div>
          <button type="submit" className="btn btn-yellow" style={{ width:'100%', padding:16, fontSize:15 }} disabled={loading}>
            {loading ? '⏳ SUMMONING...' : '🚀 SUMMON CIRCLE'}
          </button>
        </form>
      </div>
      <style>{`
        .group-modal-box {
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
          .group-modal-box {
            max-width: 100% !important;
            border-bottom-left-radius: 0 !important;
            border-bottom-right-radius: 0 !important;
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
