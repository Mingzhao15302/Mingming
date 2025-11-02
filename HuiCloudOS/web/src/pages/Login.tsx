import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import Button from '../components/common/Button';
import { setAuthenticated } from '../app/auth';

export default function Login() {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const username = formData.get('username');
    const password = formData.get('password');
    if (username === 'hxadmin' && password === 'hx84556793') {
      setAuthenticated(true);
      navigate('/console');
    } else {
      setError('账号或密码错误');
    }
  };

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-xl rounded-3xl border border-white/10 bg-white/10 p-10 shadow-glow">
        <h2 className="mb-6 text-2xl font-semibold text-white">登录控制台</h2>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <label className="block text-sm text-slate-200">
            账号
            <input
              name="username"
              type="text"
              required
              autoComplete="off"
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </label>
          <label className="block text-sm text-slate-200">
            密码
            <input
              name="password"
              type="password"
              required
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </label>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <Button type="submit" className="w-full justify-center py-3 text-base">
            登录
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
