import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

const STATUSES = ['PLACED', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CLOSED', 'CANCELLED'];

const ManagerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('');

  const load = () => api.get('/orders', { params: filter ? { status: filter } : {} }).then(({ data }) => setOrders(data.orders));
  useEffect(() => { load(); }, [filter]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">All Orders</h1>
        <select className="input w-40" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500 text-left">
            <tr>
              <th className="p-3">Order #</th>
              <th className="p-3">Items</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Payment</th>
              <th className="p-3">Status</th>
              <th className="p-3">Placed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {orders.map((o) => (
              <tr key={o._id}>
                <td className="p-3 font-medium text-neutral-900">#{o.orderNumber}</td>
                <td className="p-3 text-neutral-600">{o.items.length} item(s)</td>
                <td className="p-3">₹{o.totalAmount}</td>
                <td className="p-3">{o.paymentMethod} <span className={`status-badge status-${o.paymentStatus} ml-1`}>{o.paymentStatus}</span></td>
                <td className="p-3"><span className={`status-badge status-${o.orderStatus}`}>{o.orderStatus}</span></td>
                <td className="p-3 text-neutral-400">{new Date(o.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={6} className="p-4 text-center text-neutral-400">No orders found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManagerOrders;
