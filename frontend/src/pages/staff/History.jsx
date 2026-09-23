import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

const History = () => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    api.get('/orders', { params: filter ? { status: filter } : {} }).then(({ data }) => setOrders(data.orders));
  }, [filter]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Order History</h1>
        <select className="input w-40" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All statuses</option>
          {['PLACED', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CLOSED', 'CANCELLED'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="card divide-y divide-neutral-100">
        {orders.length === 0 && <p className="p-4 text-sm text-neutral-400">No orders found.</p>}
        {orders.map((o) => (
          <div key={o._id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-neutral-900">#{o.orderNumber}</p>
              <p className="text-xs text-neutral-400">{new Date(o.createdAt).toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-neutral-900">₹{o.totalAmount}</p>
              <span className={`status-badge status-${o.orderStatus}`}>{o.orderStatus}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default History;
