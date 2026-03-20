import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();
export const useToast = () => useContext(ToastContext);

let idCounter = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((message, opts = {}) => {
    const id = idCounter++;
    const toast = {
      id,
      message,
      type: opts.type || 'info',
      duration: opts.duration || 1800,
    };
    setToasts(t => [toast, ...t]);
    if (toast.duration > 0) setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), toast.duration + 200);
    return id;
  }, []);

  const dismiss = useCallback((id) => setToasts(t => t.filter(x => x.id !== id)), []);

  return (
    <ToastContext.Provider value={{ show, dismiss }}>
      {children}
      <div style={{ 
        position: 'fixed', 
        left: '50%', 
        top: 'clamp(16px, 4vw, 24px)', 
        transform: 'translateX(-50%)', 
        zIndex: 2100, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 10,
        width: '100%',
        maxWidth: '400px',
        padding: '0 20px',
        pointerEvents: 'none',
        alignItems: 'center'
      }}>
        {toasts.map(t => {
          return (
            <div key={t.id} style={{ 
              minWidth: 260, 
              maxWidth: 400, 
              position: 'relative',
              background: t.type==='success' ? 'linear-gradient(135deg, rgba(26,60,42,0.95) 0%, rgba(41,95,67,0.95) 100%)' : 
                          t.type==='celebrate' ? 'linear-gradient(135deg, rgba(45,35,0,0.95) 0%, rgba(77,59,0,0.95) 100%)' : 
                          t.type==='error' ? 'linear-gradient(135deg, rgba(61,16,26,0.95) 0%, rgba(92,24,39,0.95) 100%)' : 
                          'linear-gradient(135deg, rgba(21,21,37,0.95) 0%, rgba(26,26,48,0.95) 100%)',
              color: '#FFF', 
              padding: '16px 20px', 
              borderRadius: 20, 
              backdropFilter: 'blur(10px)',
              boxShadow: t.type==='celebrate' ? '0 15px 40px rgba(255,215,0,0.25)' :
                         t.type==='error' ? '0 15px 40px rgba(255,50,50,0.3)' : '0 15px 40px rgba(0,0,0,0.5)', 
              fontWeight: 800,
              border: t.type==='success' ? '1px solid rgba(107,203,119,0.4)' : 
                      t.type==='celebrate' ? '1px solid rgba(255,215,0,0.4)' : 
                      t.type==='error' ? '1px solid rgba(255,75,43,0.4)' : '1px solid rgba(255,255,255,0.1)',
              animation: (t.type === 'error' || t.type === 'celebrate') ? 'toastImpact 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'toastEnter 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
              overflow: 'hidden'
            }}>
              {/* Left Glow Bar */}
              <div style={{
                position: 'absolute', top: 0, left: 0, bottom: 0, width: 4,
                background: t.type==='success' ? '#6BCB77' : t.type==='celebrate' ? '#FFD700' : t.type==='error' ? '#FF4B2B' : '#38BDF8',
                boxShadow: t.type==='celebrate' ? '0 0 15px #FFD700' : t.type==='error' ? '0 0 15px #FF4B2B' : 'none'
              }} />
              
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ fontSize: 24, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
                  {t.type==='celebrate' ? '🗿' : t.type==='success' ? '😎' : t.type==='error' ? '💀' : '📡'}
                </span>
                <div style={{ flex: 1, letterSpacing: 0.5, lineHeight: 1.4, fontSize: 13, color: 'rgba(255,255,255,0.95)' }}>
                  {t.message}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Energy Surge overlay for celebrate toasts */}
      {toasts.some(t=>t.type==='celebrate') && (
        <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:1999, overflow:'hidden' }}>
          {/* Subtle Ripple / Glow */}
          <div style={{ 
            position:'absolute', top:'50%', left:'50%', width:'100vw', height:'100vw', 
            background:'radial-gradient(circle, rgba(255,215,0,0.15) 0%, transparent 60%)', 
            transform:'translate(-50%, -50%)', 
            animation:'auraRippleGlobal 1.5s ease-out forwards', 
            mixBlendMode:'screen' 
          }} />
          {/* Vertical Energy wave */}
          <div style={{
            position:'absolute', top:'100%', left:0, right:0, height:'100vh',
            background:'linear-gradient(0deg, rgba(255,215,0,0.1) 0%, transparent 100%)',
            animation:'energySurgeGlobal 1.2s cubic-bezier(0.1, 0.8, 0.2, 1) forwards'
          }} />
          <style>{`
            @keyframes auraRippleGlobal { 0% { opacity:1; transform:translate(-50%,-50%) scale(0.2); } 100% { opacity:0; transform:translate(-50%,-50%) scale(1.5); } }
            @keyframes energySurgeGlobal { 0% { transform: translateY(0); opacity: 0.8; } 100% { transform: translateY(-150%); opacity: 0; } }
            @keyframes toastEnter { 0% { opacity:0; transform:translateX(50px) scale(0.9); } 100% { opacity:1; transform:translateX(0) scale(1); } }
            @keyframes toastImpact { 
              0%   { opacity:0; transform:translateX(50px) scale(0.9); } 
              50%  { transform:translateX(-6px) scale(1.02); } 
              75%  { transform:translateX(3px) scale(1); }
              100% { opacity:1; transform:translateX(0) scale(1); } 
            }
          `}</style>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export default ToastContext;
