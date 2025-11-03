import { useApp } from '../../app/AppContext';

export function OrderModuleTab() {
  const { orders } = useApp();
  return (
    <div className="glass" style={{ padding: '1.5rem' }}>
      <h3 style={{ marginTop: 0 }}>订单记录</h3>
      <table className="table">
        <thead>
          <tr>
            <th>订单号</th>
            <th>客户</th>
            <th>金额</th>
            <th>状态</th>
            <th>时间</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.customer?.name ?? '-'}</td>
              <td>¥{order.total}</td>
              <td>{order.status}</td>
              <td>{new Date(order.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
