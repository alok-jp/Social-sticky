import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from './ToastContext';

const NAV_LINKS = [
  { path: '/dashboard',  label: 'Home',       icon: '🏠' },
  { path: '/goals',      label: 'Goals',      icon: '🎯' },
  { path: '/friends',    label: 'Friends',    icon: '👥' },
  { path: '/focus-mode', label: 'Focus',      icon: '🧘' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [glitch, setGlitch] = useState(false);
  const dropRef = useRef(null);
  const { show } = useToast();

  const handleLogoClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount === 5) {
      setGlitch(true);
      show('Built different. Respect the creator. 🤫', { type: 'celebrate' });
      setTimeout(() => { setGlitch(false); setClickCount(0); }, 3000);
    }
  };

  const isActive = (path) => location.pathname === path;
  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, [location]);

  return (
    <>
      <nav style={{
        background: 'rgba(8,8,16,0.85)',
        padding: '0 clamp(14px, 4vw, 24px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 68,
        position: 'sticky', top: 0, zIndex: 200,
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 4px 32px rgba(0,0,0,0.4)'
      }}>
        {/* Logo */}
        <Link to="/dashboard" onClick={handleLogoClick} style={{
          fontFamily: "'Fredoka One', cursive", fontSize: 'clamp(18px, 5vw, 22px)',
          color: glitch ? '#fff' : 'var(--primary-glow)', textDecoration: 'none',
          display: 'flex', alignItems: 'center', gap: 8,
          textShadow: glitch ? '0 0 20px #FF00FF, 0 0 10px #00FFFF, 2px 2px 0 red, -2px -2px 0 cyan' : '0 0 20px rgba(255,215,0,0.3)',
          letterSpacing: -0.5, flexShrink: 0,
          transform: glitch ? 'skewX(-15deg) scale(1.1)' : 'none',
          filter: glitch ? 'contrast(200%)' : 'none',
          transition: 'all 0.1s'
        }}>
          📌 <span>Sticky Chad</span> <span style={{ fontSize: 16, opacity: 0.7 }}>🗿</span>
        </Link>

        {/* Desktop nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="nav-desktop">
          {NAV_LINKS.map(({ path, label, icon }) => (
            <Link key={path} to={path} style={{
              padding: '8px 16px', borderRadius: 12,
              color: isActive(path) ? '#000' : 'rgba(255,255,255,0.5)',
              textDecoration: 'none', fontWeight: 800, fontSize: 13,
              letterSpacing: 0.5,
              background: isActive(path) ? 'linear-gradient(135deg,#FFD700,#FF9500)' : 'transparent',
              boxShadow: isActive(path) ? '0 0 16px rgba(255,215,0,0.25)' : 'none',
              transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
              display: 'flex', alignItems: 'center', gap: 6
            }}
              onMouseEnter={e => { if (!isActive(path)) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { if (!isActive(path)) e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
            >
              <span>{icon}</span> {label}
            </Link>
          ))}
          {user?.role === 'admin' && (
            <Link to="/admin" style={{
              padding: '8px 16px', borderRadius: 12, fontSize: 13, fontWeight: 800,
              color: isActive('/admin') ? '#000' : '#ff6b9d', textDecoration: 'none',
              background: isActive('/admin') ? '#ff6b9d' : 'rgba(255,107,157,0.08)',
              border: '1px solid rgba(255,107,157,0.25)',
              transition: 'all 0.2s'
            }}>🛡️ Admin</Link>
          )}

          {/* Avatar dropdown */}
          <div ref={dropRef} style={{ position: 'relative', marginLeft: 8 }}>
            <button onClick={() => setDropOpen(o => !o)} style={{
              width: 40, height: 40, borderRadius: 14, border: 'none', cursor: 'pointer',
              background: dropOpen ? 'linear-gradient(135deg,#FFD700,#FF8C00)' : 'rgba(255,215,0,0.12)',
              border: dropOpen ? '2px solid #FFD700' : '2px solid rgba(255,215,0,0.2)',
              color: dropOpen ? '#000' : '#FFD700', fontWeight: 900, fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s', flexShrink: 0
            }}>{initials}</button>

            {dropOpen && (
              <div style={{
                position: 'absolute', top: 52, right: 0,
                background: 'rgba(12,12,24,0.98)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18,
                padding: 8, minWidth: 210, zIndex: 300,
                boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
                animation: 'fadeIn 0.15s ease'
              }}>
                <div style={{ padding: '12px 16px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 6 }}>
                  <div style={{ fontWeight: 900, fontSize: 15, color: '#fff' }}>{user?.name}</div>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, marginTop: 2 }}>{user?.uid || user?.email}</div>
                </div>
                <Link to="/profile" onClick={() => setDropOpen(false)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                  borderRadius: 12, color: '#fff', textDecoration: 'none', fontWeight: 800, fontSize: 13,
                  transition: 'background 0.2s'
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >👤 Profile</Link>
                <div onClick={handleLogout} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                  borderRadius: 12, color: '#FF4076', fontWeight: 800, fontSize: 13, cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,64,118,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >🚪 Logout</div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile: hamburger + avatar */}
        <div style={{ display: 'none', alignItems: 'center', gap: 10 }} className="nav-mobile">
          <button onClick={() => setMenuOpen(o => !o)} style={{
            background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10, color: '#fff', width: 44, height: 44,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: menuOpen ? 0 : 5, cursor: 'pointer', padding: 0, transition: 'all 0.3s',
            position: 'relative'
          }}>
            <span style={{ width: 18, height: 2, background: '#fff', borderRadius: 2, display: 'block', transition: 'all 0.3s', transform: menuOpen ? 'rotate(45deg) translateY(2px)' : 'none' }} />
            <span style={{ width: 18, height: 2, background: '#fff', borderRadius: 2, display: 'block', transition: 'all 0.3s', opacity: menuOpen ? 0 : 1 }} />
            <span style={{ width: 18, height: 2, background: '#fff', borderRadius: 2, display: 'block', transition: 'all 0.3s', transform: menuOpen ? 'rotate(-45deg) translateY(-2px)' : 'none' }} />
          </button>
        </div>
      </nav>

      {/* Mobile Slide Menu */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: 68, left: 0, right: 0, bottom: 0, zIndex: 199,
          background: 'rgba(8,8,16,0.97)', backdropFilter: 'blur(20px)',
          padding: '24px 20px',
          display: 'flex', flexDirection: 'column', gap: 8,
          animation: 'fadeIn 0.2s ease'
        }}>
          {NAV_LINKS.map(({ path, label, icon }) => (
            <Link key={path} to={path} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '16px 20px', borderRadius: 16, textDecoration: 'none',
              fontWeight: 900, fontSize: 16, letterSpacing: 0.5,
              background: isActive(path) ? 'linear-gradient(135deg,rgba(255,215,0,0.15),rgba(255,149,0,0.1))' : 'rgba(255,255,255,0.03)',
              color: isActive(path) ? 'var(--primary-glow)' : 'rgba(255,255,255,0.7)',
              border: isActive(path) ? '1px solid rgba(255,215,0,0.25)' : '1px solid rgba(255,255,255,0.05)',
              transition: 'all 0.2s'
            }}><span style={{ fontSize: 20 }}>{icon}</span>{label}</Link>
          ))}
          {user?.role === 'admin' && (
            <Link to="/admin" style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px',
              borderRadius: 16, textDecoration: 'none', fontWeight: 900, fontSize: 16,
              background: 'rgba(255,107,157,0.08)', color: '#ff6b9d',
              border: '1px solid rgba(255,107,157,0.2)'
            }}>🛡️ Admin</Link>
          )}
          <Link to="/profile" style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px',
            borderRadius: 16, textDecoration: 'none', fontWeight: 900, fontSize: 16,
            background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.7)',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>👤 Profile</Link>
          <div style={{ marginTop: 'auto' }}>
            <div style={{ padding: '14px 20px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', marginBottom: 8 }}>
              <div style={{ fontWeight: 900, color: '#fff', fontSize: 15 }}>{user?.name}</div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>{user?.uid || user?.email}</div>
            </div>
            <button onClick={handleLogout} style={{
              width: '100%', padding: '14px', borderRadius: 14, border: 'none', cursor: 'pointer',
              background: 'rgba(255,64,118,0.1)', color: '#FF4076',
              fontWeight: 900, fontSize: 14, letterSpacing: 1
            }}>🚪 Logout</button>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-mobile  { display: flex !important; }
        }
      `}</style>
    </>
  );
}
