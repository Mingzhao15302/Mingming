import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const ACCOUNT = 'hxadmin'
const PASSWORD = 'hx84556793'

const LoginPage = () => {
  const navigate = useNavigate()
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (account === ACCOUNT && password === PASSWORD) {
      setError('')
      navigate('/console')
    } else {
      setError('账号或密码错误')
    }
  }

  return (
    <section className="flex justify-center">
      <form onSubmit={handleSubmit} className="glass-card w-full max-w-md p-8 space-y-6">
        <h2 className="text-2xl font-semibold text-white/90">登录控制台</h2>
        <div className="space-y-2 text-left">
          <label className="text-sm text-white/70">账号</label>
          <input
            value={account}
            onChange={(event) => setAccount(event.target.value)}
            className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-white focus:border-white/60 focus:outline-none"
            placeholder="请输入账号"
          />
        </div>
        <div className="space-y-2 text-left">
          <label className="text-sm text-white/70">密码</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-white focus:border-white/60 focus:outline-none"
            placeholder="请输入密码"
          />
        </div>
        {error && <div className="text-sm text-red-300">{error}</div>}
        <button type="submit" className="glass-button w-full justify-center">
          登录
        </button>
      </form>
    </section>
  )
}

export default LoginPage
