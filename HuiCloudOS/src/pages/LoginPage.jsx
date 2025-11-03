import React, { useState } from 'react';
import { useAppContext } from '../context/app-context.jsx';

export default function LoginPage() {
  const { setUser, navigate } = useAppContext();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form)
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = await res.json();
      setUser(data.user);
      navigate('#/console');
    } catch (err) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className="glass-card"
      onSubmit={handleSubmit}
      style={{ maxWidth: '420px', margin: '2rem auto', display: 'flex', flexDirection: 'column', gap: '1rem', padding: '2rem' }}
    >
      <h2 style={{ margin: 0, textAlign: 'center' }}>登录控制台</h2>
      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <span>账号</span>
        <input
          value={form.username}
          onChange={(event) => setForm({ ...form, username: event.target.value })}
          required
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.6)',
            background: 'rgba(255,255,255,0.4)'
          }}
        />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <span>密码</span>
        <input
          type="password"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
          required
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.6)',
            background: 'rgba(255,255,255,0.4)'
          }}
        />
      </label>
      {error && <div style={{ color: '#dc2626', fontWeight: 600 }}>{error}</div>}
      <button className="button-primary" type="submit" disabled={loading}>
        {loading ? '登录中...' : '登录'}
      </button>
    </form>
  );
}
