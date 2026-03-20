import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const s = {
  wrap: { minHeight:'100vh', background:'linear-gradient(135deg,#1A1A2E,#0F3460)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 },
  card: { background:'white', borderRadius:24, padding:40, width:'100%', maxWidth:420, boxShadow:'0 20px 60px rgba(0,0,0,0.4)' },
};

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) { setError(err.response?.data?.message || 'Error'); }
    finally { setLoading(false); }
  };

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <h2 style={{ fontFamily:"'Fredoka One',cursive", fontSize:28, marginBottom:8 }}>🔑 Forgot Password</h2>
        {sent ? (
          <div>
            <p style={{ color:'#4CAF50', fontWeight:700, marginBottom:16 }}>✅ Check your email for the reset link!</p>
            <Link to="/login" className="btn btn-primary" style={{ display:'block', textAlign:'center' }}>Back to Login</Link>
          </div>
        ) : (
          <>
            {error && <div style={{ background:'#fff0f0', borderRadius:10, padding:'10px 14px', color:'#d32f2f', marginBottom:16, fontSize:14 }}>⚠️ {error}</div>}
            <p style={{ color:'#888', fontSize:14, marginBottom:20 }}>Enter your email and we'll send you a reset link.</p>
            <form onSubmit={handle}>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" required style={{ marginBottom:16 }} />
              <button type="submit" className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:14 }} disabled={loading}>
                {loading ? '⏳ Sending...' : '📨 Send Reset Link'}
              </button>
            </form>
            <div style={{ textAlign:'center', marginTop:16 }}><Link to="/login" style={{ color:'#888', fontSize:14 }}>← Back to Login</Link></div>
          </>
        )}
      </div>
    </div>
  );
}
