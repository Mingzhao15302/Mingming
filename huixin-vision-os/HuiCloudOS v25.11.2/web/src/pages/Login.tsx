import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../components/common/AuthProvider';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const success = await login(username, password);
    setLoading(false);
    if (success) {
      const redirect = (location.state as { from?: Location })?.from?.pathname ?? '/console';
      navigate(redirect, { replace: true });
    } else {
      setError('账号或密码错误');
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-3xl bg-white/10 p-10 shadow-2xl shadow-cyan-500/20 backdrop-blur-xl">
      <h2 className="mb-6 text-center text-3xl font-semibold text-white">登录控制台</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm text-white/70">账号</span>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="glass-input w-full"
            placeholder="请输入账号"
            required
            autoComplete="username"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm text-white/70">密码</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="glass-input w-full"
            placeholder="请输入密码"
            required
            autoComplete="current-password"
          />
        </label>
        {error && <p className="text-sm text-rose-300">{error}</p>}
        <button type="submit" className="glass-button w-full justify-center" disabled={loading}>
          {loading ? '登录中...' : '登录'}
        </button>
      </form>
    </div>
  );
};

export default Login;
