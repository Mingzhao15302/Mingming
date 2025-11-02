import { Link } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import Button from '../components/common/Button';

export default function Success() {
  return (
    <AppShell>
      <div className="mx-auto flex max-w-lg flex-col items-center gap-6 rounded-3xl bg-white/10 p-12 text-center shadow-glow">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
          ✓
        </div>
        <h2 className="text-3xl font-semibold text-white">下单成功</h2>
        <p className="text-slate-300">我们已收到订单，将尽快与您联系确认发货信息。</p>
        <div className="flex gap-4">
          <Link to="/shop">
            <Button className="px-6 py-3 text-base">返回商城</Button>
          </Link>
          <Link to="/console">
            <Button className="bg-white/20 px-6 py-3 text-base text-white hover:bg-white/40">查看订单</Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
