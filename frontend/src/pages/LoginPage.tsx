import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Lottie from 'lottie-react';
import loginAnim from '../assets/lottie/login.json';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      await login(email, password);
      nav('/');
    } catch (e:any) {
      setError(e.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  }

  return (
    <div style={{ display:'grid', placeItems:'center', minHeight:'100vh', padding:'2rem' }}>
      <div className="card" style={{ maxWidth:420, width:'100%' }}>
        <div style={{ width:160, margin:'0 auto' }}>
          <Lottie animationData={loginAnim} loop />
        </div>
        <h2 style={{ textAlign:'center' }}>Sign In</h2>
        {error && <div style={{ background:'#3b0d10', color:'#fda4af', padding:'0.5rem 0.75rem', borderRadius:8, marginBottom:12 }}>{error}</div>}
        <form className="grid" onSubmit={submit}>
          <div>
            <label>Email</label>
            <input value={email} onChange={e=>setEmail(e.target.value)} type="email" required />
          </div>
          <div>
            <label>Password</label>
            <input value={password} onChange={e=>setPassword(e.target.value)} type="password" required />
          </div>
          <button className="button" disabled={loading}>{loading ? '...' : 'Login'}</button>
        </form>
      </div>
    </div>
  );
};
export default LoginPage;
