import { Link } from 'react-router-dom'

const HomePage = () => {
  return (
    <section className="grid place-items-center min-h-[70vh] text-center">
      <div className="glass-card max-w-2xl p-10 space-y-8">
        <h2 className="text-3xl md:text-5xl font-bold tracking-wide text-white drop-shadow">
          欢迎使用辉云易达 OS
        </h2>
        <p className="text-white/80 leading-relaxed">
          打造轻量级业务中台，统一管理视频、商城、订单与合同，覆盖电脑、平板与手机多端体验。
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/videos" className="glass-button text-lg">
            浏览视频
          </Link>
          <Link to="/login" className="glass-button text-lg">
            登录控制台
          </Link>
        </div>
      </div>
    </section>
  )
}

export default HomePage
