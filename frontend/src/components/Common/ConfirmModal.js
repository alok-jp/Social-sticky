import React, { useEffect } from 'react';

const overlay = { 
  position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:3000, 
  display:'flex', alignItems:'center', justifyContent:'center', 
  padding: 'clamp(16px, 4vw, 24px)', backdropFilter:'blur(10px)',
  animation: 'fadeIn 0.2s ease-out', transition: 'all 0.3s'
};
const modal = { 
  background:'var(--surface-bg)', borderRadius:28, 
  padding:'clamp(24px, 6vw, 36px)', width:'100%', maxWidth:380, 
  boxShadow:'0 30px 90px rgba(0,0,0,0.9)', border:'1px solid var(--border-glass)', 
  textAlign:'center', position: 'relative'
};

export default function ConfirmModal({ title, message, onConfirm, onCancel, confirmText='CONFIRM', cancelText='CANCEL', danger=true }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  return (
    <div style={overlay} onClick={e => e.target===e.currentTarget && onCancel()} className="confirm-modal-overlay">
      <div style={modal} className="confirm-modal-box glass-card">
        <div style={{ fontSize:48, marginBottom:16, animation: danger ? 'shake 0.5s infinite' : 'bounce 2s infinite' }}>
          {title.includes('THANOS') ? '🫰' : title.includes('PURGE') ? '🗑️' : title.includes('DISCARD') ? '💀' : danger ? '⚠️' : '❓'}
        </div>
        <h2 style={{ fontFamily:"'Fredoka One',cursive", fontSize:26, color: danger ? '#ff4b2b' : 'white', margin:'0 0 12px 0', textTransform:'uppercase' }} className="confirm-title">{title}</h2>
        <p style={{ color:'var(--text-muted)', fontSize:15, fontWeight:700, lineHeight:1.6, marginBottom:32 }}>{message}</p>
        
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <button 
            onClick={onConfirm} 
            className="btn" 
            style={{ 
              background: danger ? '#ff4b2b' : 'var(--primary-glow)', 
              color: danger ? '#fff' : '#000', 
              padding:'14px', 
              fontSize:14, 
              fontWeight:950,
              width:'100%',
              borderRadius:16,
              boxShadow: danger ? '0 8px 20px rgba(255, 75, 43, 0.3)' : '0 8px 20px rgba(var(--primary-glow-rgb), 0.3)'
            }}
          >
            {confirmText}
          </button>
          <button 
            onClick={onCancel} 
            className="btn btn-ghost" 
            style={{ padding:'12px', fontSize:13, width:'100%', opacity:0.6 }}
          >
            {cancelText}
          </button>
        </div>
      </div>
      <style>{`
        .confirm-modal-box {
          animation: modalSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (max-width: 600px) {
          .confirm-modal-overlay {
            align-items: flex-end !important;
            padding: 0 !important;
          }
          .confirm-modal-box {
            max-width: 100% !important;
            border-bottom-left-radius: 0 !important;
            border-bottom-right-radius: 0 !important;
            padding: 32px 24px 44px !important;
            animation: bottomSheetUp 0.35s cubic-bezier(0.2, 0.8, 0.2, 1) !important;
          }
          @keyframes bottomSheetUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
          .confirm-title { font-size: 22px !important; }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
