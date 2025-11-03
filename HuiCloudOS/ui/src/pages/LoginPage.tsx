import { FormEvent, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../app/AppContext';

export function LoginPage() {
  const { login } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      const redirect = (location.state as any)?.from ?? '/console';
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={{ display: 'grid', placeItems: 'center', minHeight: 'calc(100vh - 140px)' }}>
      <form className="glass" style={{ padding: '3rem', width: 'min(420px, 90vw)' }} onSubmit={handleSubmit}>
        <h2 style={{ marginTop: 0, marginBottom: '1.5rem', textAlign: 'center' }}>控制台登录</h2>
        <div style={{ display: 'grid', gap: '1rem' }}>
          <label style={{ display: 'grid', gap: '0.4rem' }}>
            <span style={{ fontWeight: 600 }}>账号</span>
            <input className="input" value={username} onChange={(event) => setUsername(event.target.value)} required />
          </label>
          <label style={{ display: 'grid', gap: '0.4rem' }}>
            <span style={{ fontWeight: 600 }}>密码</span>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error && (
            <div className="glass-inline" style={{ padding: '0.75rem 1rem', color: '#b91c1c', background: 'rgba(248,113,113,0.15)' }}>
              {error}
            </div>
          )}
          <button className="btn" type="submit" disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </button>
        </div>
      </form>
    </section>
  );
}
