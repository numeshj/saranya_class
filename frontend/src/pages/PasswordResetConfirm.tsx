import React, { useState } from 'react';
import { api } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastProvider';

const PasswordResetConfirm: React.FC = () => {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { push } = useToast();
  const nav = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/password/reset/confirm', { token, password });
      push({ message:'Password updated', type:'success' });
      setTimeout(()=> nav('/login'), 800);
    } catch(err:any) {
      push({ message:err.response?.data?.message || 'Reset failed', type:'error' });
    } finally { setLoading(false); }
  }

  return (
    <div className="auth-bg">
      <div className="auth-shell" style={{ maxWidth:480 }}>
        <div className="auth-card" style={{ gridTemplateColumns:'1fr' }}>
          <div className="auth-body">
            <h1>Set <span className="accent">New Password</span></h1>
            <p className="muted">Paste the token you received (shown in request for demo) and choose a strong password.</p>
            <form onSubmit={submit} className="form-grid" style={{ marginTop:'.5rem' }}>
              <label className="field">
                <span>Reset Token</span>
                <input required value={token} onChange={e=>setToken(e.target.value)} placeholder="token" />
              </label>
              <label className="field">
                <span>New Password</span>
                <input required type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" minLength={8} />
              </label>
              <button className="button primary wide" disabled={loading}>{loading? 'Updating…':'Update Password'}</button>
            </form>
            <div style={{ marginTop:'1.2rem' }}><Link className="link" to="/login">Back to login</Link></div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default PasswordResetConfirm;
