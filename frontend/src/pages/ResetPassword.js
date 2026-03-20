import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await api.put(`/auth/reset-password/${token}`, { password });
      setDone(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) { setError(err.response?.data?.message || 'Error'); }
    finally { setLoading(false); }
  };

  const s = { wrap:{ minHeight:'100vh', background:'linear-gradient(135deg,#1A1A2E,#0F3460)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }, card:{ background:'white', borderRadius:24, padding:40, width:'100%', maxWidth:420, boxShadow:'0 20px 60px rgba(0,0,0,0.4)' } };

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <h2 style={{ fontFamily:"'Fredoka One',cursive", fontSize:28, marginBottom:16 }}>🔐 Reset Password</h2>
        {done ? <p style={{ color:'#4CAF50', fontWeight:700 }}>✅ Password reset! Redirecting...</p> : (
          <>
            {error && <div style={{ background:'#fff0f0', borderRadius:10, padding:'10px 14px', color:'#d32f2f', marginBottom:16, fontSize:14 }}>⚠️ {error}</div>}
            <form onSubmit={handle}>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="New password (min 6 chars)" minLength={6} required style={{ marginBottom:16 }} />
              <button type="submit" className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:14 }} disabled={loading}>
                {loading ? '⏳ Resetting...' : '🔑 Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
