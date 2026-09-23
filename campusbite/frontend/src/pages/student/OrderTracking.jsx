import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, Circle } from 'lucide-react';
import api from '../../api/axios';
import { useSocket } from '../../context/SocketContext';

const STEPS = ['PLACED', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED'];

const OrderTracking = () => {
  const { orderId } = useParams();
  const { events } = useSocket();
  const [order, setOrder] = useState(null);

  const fetchOrder = () => api.get(`/orders/${orderId}`).then(({ data }) => setOrder(data.order));

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // Re-fetch whenever a socket event mentions this order, to stay in sync with real backend state.
  useEffect(() => {
    const latest = events[0];
    if (latest?.payload?.orderId === orderId) fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);

  if (!order) return <div className="max-w-sm mx-auto px-4 py-16 text-center text-neutral-400">Loading…</div>;

  const currentIndex = STEPS.indexOf(order.orderStatus === 'CLOSED' ? 'DELIVERED' : order.orderStatus);
  const cancelled = order.orderStatus === 'CANCELLED';

  return (
    <div className="max-w-sm mx-auto px-4 py-12">
      <h1 className="text-xl font-bold text-neutral-900 mb-1">Order #{order.orderNumber}</h1>
      <p className="text-neutral-500 text-sm mb-8">₹{order.totalAmount} · {order.paymentMethod}</p>

      {cancelled ? (
        <div className="card p-4 bg-red-50 text-red-700 text-sm">This order was cancelled.</div>
      ) : (
        <div className="space-y-4">
          {STEPS.map((step, idx) => {
            const done = idx <= currentIndex;
            return (
              <div key={step} className="flex items-center gap-3">
                {done ? <CheckCircle2 className="text-brand-600" size={22} /> : <Circle className="text-neutral-300" size={22} />}
                <span className={done ? 'font-medium text-neutral-900' : 'text-neutral-400'}>
                  {step.charAt(0) + step.slice(1).toLowerCase()}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="card p-4 mt-8">
        <h2 className="font-semibold text-neutral-900 mb-2 text-sm">Items</h2>
        {order.items.map((i, idx) => (
          <div key={idx} className="flex justify-between text-sm py-1 text-neutral-600">
            <span>{i.name} × {i.quantity}</span>
            <span>₹{i.price * i.quantity}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderTracking;
