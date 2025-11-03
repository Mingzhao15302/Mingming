import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../utils/api.js';
import { useAuth, useToast } from '../hooks/useApp.js';

const LoginPage = () => {
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const auth = useAuth();
  const toast = useToast();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const result = await login({ account, password });
      auth.login(result);
      toast.push('登录成功');
      navigate('/console');
    } catch (error) {
      toast.push(error.message || '登录失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="glass-card" style={{ padding: '2rem', maxWidth: '420px', margin: '2rem auto' }} onSubmit={handleSubmit}>
      <h2>登录控制台</h2>
      <div style={{ display: 'grid', gap: '1rem', marginTop: '1.5rem' }}>
        <label>
          账号
          <input className="input" value={account} onChange={(e) => setAccount(e.target.value)} autoComplete="username" />
        </label>
        <label>
          密码
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>
        <button className="button" type="submit" disabled={loading}>
          {loading ? '登录中…' : '登录'}
        </button>
      </div>
    </form>
  );
};

export default LoginPage;
