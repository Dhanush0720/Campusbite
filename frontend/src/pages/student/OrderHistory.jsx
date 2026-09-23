import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get('/orders/my-orders').then(({ data }) => setOrders(data.orders));
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">Order History</h1>

      {orders.length === 0 ? (
        <p className="text-neutral-400 text-sm">No orders yet.</p>
      ) : (
        <div className="card divide-y divide-neutral-100">
          {orders.map((o) => (
            <Link key={o._id} to={`/student/orders/${o._id}/track`} className="p-4 flex items-center justify-between hover:bg-neutral-50 block">
              <div>
                <p className="font-medium text-neutral-900">#{o.orderNumber}</p>
                <p className="text-xs text-neutral-400">{new Date(o.createdAt).toLocaleString()} · {o.items.length} item(s)</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-neutral-900">₹{o.totalAmount}</p>
                <span className={`status-badge status-${o.orderStatus}`}>{o.orderStatus}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
