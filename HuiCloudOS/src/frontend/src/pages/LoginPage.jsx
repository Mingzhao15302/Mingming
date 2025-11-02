import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext.jsx';

export default function LoginPage() {
  const { api, setUser } = useAppContext();
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const result = await api.post('/api/login', { account, password });
      setUser(result.user);
      navigate('/console');
    } catch (err) {
      setError(err.message || '登录失败');
    }
  };

  return (
    <section style={{ display: 'grid', placeItems: 'center', flex: 1 }}>
      <form className="hc-card" onSubmit={handleSubmit} style={{ width: 'min(520px, 92vw)', padding: '3rem 3.5rem', display: 'grid', gap: '1.5rem' }}>
        <header style={{ textAlign: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '2rem' }}>控制台登录</h2>
          <p style={{ opacity: 0.75, marginTop: '0.5rem' }}>请输入管理员账号与密码</p>
        </header>
        <label style={{ display: 'grid', gap: '0.4rem', textAlign: 'left' }}>
          <span>账号</span>
          <input value={account} onChange={(event) => setAccount(event.target.value)} placeholder="请输入账号" />
        </label>
        <label style={{ display: 'grid', gap: '0.4rem', textAlign: 'left' }}>
          <span>密码</span>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="请输入密码" />
        </label>
        {error && <div className="hc-card" style={{ padding: '0.85rem 1rem', background: 'rgba(255,80,120,0.2)', borderColor: 'rgba(255,130,160,0.55)' }}>{error}</div>}
        <button type="submit" style={{ width: '100%', padding: '0.9rem 1rem', fontSize: '1rem' }}>
          登录
        </button>
      </form>
    </section>
  );
}
