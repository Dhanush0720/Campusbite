import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Circle, Clock, Utensils, Zap, QrCode } from 'lucide-react';
import api from '../../api/axios';
import { useSocket } from '../../context/SocketContext';

const KITCHEN_STEPS = ['PLACED', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED'];
const READY_STEPS = ['PLACED', 'CONFIRMED', 'READY', 'DELIVERED'];

const OrderTracking = () => {
  const { orderId } = useParams();
  const { events } = useSocket();
  const [order, setOrder] = useState(null);

  const fetchOrder = () => api.get(`/orders/${orderId}`).then(({ data }) => setOrder(data.order));

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  useEffect(() => {
    const latest = events[0];
    if (latest?.payload?.orderId === orderId || latest?.payload?.order?._id === orderId) {
      fetchOrder();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);

  if (!order) return <div className="max-w-md mx-auto px-4 py-16 text-center text-neutral-400">Loading…</div>;

  const isReadyFood = order.orderType === 'READY_FOOD';
  const steps = isReadyFood ? READY_STEPS : KITCHEN_STEPS;
  const isDelivered = order.orderStatus === 'DELIVERED' || order.orderStatus === 'CLOSED';
  const isReady = order.orderStatus === 'READY';
  const isPreparing = order.orderStatus === 'PREPARING';
  const cancelled = order.orderStatus === 'CANCELLED';

  const currentIndex = steps.indexOf(isDelivered ? 'DELIVERED' : order.orderStatus);

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      {/* Header Info */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-bold text-neutral-900">Order #{order.orderNumber}</h1>
        {isReadyFood ? (
          <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
            <Zap size={13} /> Express Ready Food
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
            <Utensils size={13} /> Made to Order
          </span>
        )}
      </div>
      <p className="text-neutral-500 text-sm mb-6">₹{order.totalAmount} · {order.paymentMethod}</p>

      {/* Dynamic Status Alert Banner */}
      {cancelled && (
        <div className="card p-4 bg-red-50 text-red-700 text-sm mb-6">
          This order was cancelled.
        </div>
      )}

      {isDelivered && (
        <div className="card p-5 bg-emerald-50 border-emerald-200 text-center mb-6">
          <CheckCircle2 className="text-emerald-600 mx-auto mb-2" size={36} />
          <h2 className="text-lg font-bold text-emerald-900">Order Picked Up!</h2>
          <p className="text-emerald-700 text-sm mt-1">Thank you! Enjoy your meal.</p>
        </div>
      )}

      {isReady && !isDelivered && (
        <div className="card p-5 bg-emerald-50 border-2 border-emerald-400 text-center mb-6 animate-pulse">
          <div className="text-2xl mb-1">🎉</div>
          <h2 className="text-lg font-bold text-emerald-900">Your Food is Ready for Pickup!</h2>
          <p className="text-emerald-700 text-sm mt-1">
            Please proceed to the canteen counter and show your QR code or PIN below.
          </p>
        </div>
      )}

      {isPreparing && !isDelivered && (
        <div className="card p-4 bg-amber-50 border border-amber-200 flex items-center gap-3 mb-6">
          <Clock className="text-amber-600 animate-spin" size={24} />
          <div>
            <p className="font-semibold text-amber-900 text-sm">Kitchen is preparing your food</p>
            <p className="text-xs text-amber-700">We'll alert you the moment it's ready for collection.</p>
          </div>
        </div>
      )}

      {/* Pickup QR Code & PIN Card (always visible while active) */}
      {!isDelivered && !cancelled && order.qrImage && (
        <div className="card p-6 text-center border-2 border-brand-200 mb-6 shadow-sm">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-brand-700 uppercase tracking-wider mb-3">
            <QrCode size={16} /> Counter Pickup Pass
          </div>
          <img src={order.qrImage} alt="Pickup QR code" className="w-52 h-52 mx-auto rounded-lg shadow-inner bg-white p-2 border border-neutral-100" />
          <p className="text-xs text-neutral-500 mt-3">Show this QR at the counter to collect your order</p>
          {order.deliveryPin && (
            <div className="mt-3 inline-block bg-neutral-100 px-4 py-1.5 rounded-full">
              <span className="text-xs text-neutral-500 mr-2">Backup PIN:</span>
              <span className="font-mono text-base font-bold text-neutral-900 tracking-widest">{order.deliveryPin}</span>
            </div>
          )}
        </div>
      )}

      {/* Stepper */}
      {!cancelled && (
        <div className="card p-5 mb-6 space-y-3">
          <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Order Progress</h2>
          {steps.map((step, idx) => {
            const done = idx <= currentIndex;
            const current = idx === currentIndex && !isDelivered;
            return (
              <div key={step} className="flex items-center gap-3">
                {done ? (
                  <CheckCircle2 className="text-emerald-600" size={20} />
                ) : (
                  <Circle className="text-neutral-300" size={20} />
                )}
                <span className={`text-sm ${current ? 'font-bold text-brand-600' : done ? 'font-medium text-neutral-800' : 'text-neutral-400'}`}>
                  {step === 'READY' ? 'Ready for Pickup' : step.charAt(0) + step.slice(1).toLowerCase()}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Items Summary */}
      <div className="card p-4">
        <h2 className="font-semibold text-neutral-900 mb-2 text-sm">Order Items</h2>
        {order.items.map((i, idx) => (
          <div key={idx} className="flex justify-between text-sm py-1.5 border-b border-neutral-50 last:border-0 text-neutral-700">
            <span>{i.name} × {i.quantity}</span>
            <span className="font-medium">₹{i.price * i.quantity}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderTracking;
