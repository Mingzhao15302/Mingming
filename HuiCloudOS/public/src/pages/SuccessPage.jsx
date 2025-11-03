import React from 'react';
import { useNavigate } from 'react-router-dom';

const SuccessPage = () => {
  const navigate = useNavigate();
  return (
    <div className="glass-card" style={{ margin: '2rem auto', padding: '3rem', textAlign: 'center', maxWidth: '520px' }}>
      <div style={{ fontSize: '3rem' }}>✅</div>
      <h2>下单成功</h2>
      <p>感谢您的下单，我们的业务团队会尽快与您联系。</p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
        <button className="button" onClick={() => navigate('/shop')}>
          返回商城
        </button>
        <button className="button secondary" onClick={() => navigate('/console')}>
          查看订单
        </button>
      </div>
    </div>
  );
};

export default SuccessPage;
