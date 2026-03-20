import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const s = {
  wrap: { minHeight:'100vh', background:'var(--bg-dark)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 },
  card: { background:'var(--surface-bg)', borderRadius:32, padding:48, width:'100%', maxWidth:440, boxShadow:'0 20px 80px rgba(0,0,0,0.5)', border:'1px solid var(--border-glass)' },
  logo: { fontFamily:"'Fredoka One',cursive", fontSize:36, background:'linear-gradient(to right, #FFD93D, #FF8C00)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', textAlign:'center', marginBottom:4 },
  sub:  { textAlign:'center', color:'var(--text-muted)', fontSize:14, marginBottom:32, fontWeight:600 },
  label: { fontWeight:800, fontSize:12, color:'var(--text-muted)', display:'block', marginBottom:8, textTransform:'uppercase', letterSpacing:1 },
  group: { marginBottom:20 },
  err:  { background:'rgba(255,107,107,0.1)', border:'1px solid rgba(255,107,107,0.2)', borderRadius:12, padding:'12px 16px', color:'#ff6b6b', fontSize:14, marginBottom:20, fontWeight:700 },
  footer: { textAlign:'center', marginTop:24, fontSize:14, color:'var(--text-muted)' },
};

export default function LoginForm() {
  const [form, setForm] = useState({ email:'', password:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handle = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const data = await login(form.email, form.password);
      navigate(data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={s.logo}>📌 Sticky Chad 🗿</div>
        <div style={s.sub}>Built Different. Study Smarter. ✨</div>
        {error && <div style={s.err}>⚠️ {error}</div>}
        <form onSubmit={handle}>
          <div style={s.group}>
            <label style={s.label}>Email Address</label>
            <input type="email" value={form.email} onChange={e => setForm({...form,email:e.target.value})} placeholder="alpha@chad.com" required 
              style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'white', padding:'14px 18px', borderRadius:14, width:'100%' }}
            />
          </div>
          <div style={s.group}>
            <label style={s.label}>Password</label>
            <input type="password" value={form.password} onChange={e => setForm({...form,password:e.target.value})} placeholder="••••••••" required 
              style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'white', padding:'14px 18px', borderRadius:14, width:'100%' }}
            />
          </div>
          <div style={{ textAlign:'right', marginBottom:24 }}>
            <Link to="/forgot-password" style={{ color:'var(--primary-glow)', fontWeight:800, fontSize:13, textDecoration:'none' }}>Forgot password?</Link>
          </div>
          <button type="submit" className="btn btn-yellow" style={{ width:'100%', justifyContent:'center', padding:'16px', fontSize:16, fontWeight:900 }} disabled={loading}>
            {loading ? '⏳ AUTHENTICATING...' : '🔑 UNLOCK BOARD'}
          </button>
        </form>
        <div style={s.footer}>
          New to the ritual? <Link to="/register" style={{ color:'var(--primary-glow)', fontWeight:800, textDecoration:'none' }}>Join the Tribe</Link>
        </div>
      </div>
    </div>
  );
}
