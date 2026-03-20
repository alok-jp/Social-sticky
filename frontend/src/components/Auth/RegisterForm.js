import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const s = {
  wrap: { minHeight:'100vh', background:'var(--bg-dark)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 },
  card: { background:'var(--surface-bg)', borderRadius:32, padding:48, width:'100%', maxWidth:440, boxShadow:'0 20px 80px rgba(0,0,0,0.5)', border:'1px solid var(--border-glass)' },
  logo: { fontFamily:"'Fredoka One',cursive", fontSize:32, background:'linear-gradient(to right, #FFD93D, #FF8C00)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', textAlign:'center', marginBottom:4 },
  sub:  { textAlign:'center', color:'var(--text-muted)', fontSize:14, marginBottom:32, fontWeight:600 },
  label: { fontWeight:800, fontSize:12, color:'var(--text-muted)', display:'block', marginBottom:8, textTransform:'uppercase', letterSpacing:1 },
  group: { marginBottom:20 },
  err:  { background:'rgba(255,107,107,0.1)', border:'1px solid rgba(255,107,107,0.2)', borderRadius:12, padding:'12px 16px', color:'#ff6b6b', fontSize:14, marginBottom:20, fontWeight:700 },
  footer: { textAlign:'center', marginTop:24, fontSize:14, color:'var(--text-muted)' },
  hint: { fontSize:12, color:'rgba(255,255,255,0.3)', marginTop:4 },
};

export default function RegisterForm() {
  const [form, setForm] = useState({ name:'', email:'', password:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handle = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const data = await register(form.name, form.email, form.password);
      navigate(data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={s.logo}>📌 Join StickyNotes</div>
        <div style={s.sub}>Start collaborating with friends! 🚀</div>
        <form onSubmit={handle}>
          {[['name','Your Name','text','👤 e.g. Alex Smith'],['email','Email','email','you@example.com'],['password','Password','password','Min 6 characters']].map(([key,label,type,ph]) => (
            <div key={key} style={s.group}>
              <label style={s.label}>{label}</label>
              <input type={type} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})} placeholder={ph} required 
                style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'white', padding:'12px 16px', borderRadius:12, width:'100%' }}
              />
            </div>
          ))}
          <button type="submit" className="btn btn-yellow" style={{ width:'100%', justifyContent:'center', padding:'16px', fontSize:16, marginTop:10 }} disabled={loading}>
            {loading ? '⏳ Creating account...' : '✨ Create Account'}
          </button>
        </form>
        <div style={s.footer}>
          Already have an account? <Link to="/login" style={{ color:'#1A1A2E', fontWeight:800, textDecoration:'none' }}>Login</Link>
        </div>
      </div>
    </div>
  );
}
