import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

const Success: React.FC = () => {
  return (
    <div className="glass-card mx-auto mt-20 max-w-xl space-y-6 p-12 text-center">
      <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-400" />
      <h2 className="text-3xl font-semibold text-white">下单成功</h2>
      <p className="text-white/70">我们已收到您的订单，业务员将尽快与您确认细节。</p>
      <div className="flex justify-center gap-4">
        <Link to="/shop" className="glass-button">
          返回商城
        </Link>
        <Link to="/console" className="glass-button bg-white/10">
          查看订单
        </Link>
      </div>
    </div>
  );
};

export default Success;
