import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isGuest = location.pathname.startsWith('/guest');
  const base = isGuest ? '/guest' : '/student';

  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const guestName = sessionStorage.getItem('campusbite_guest_name') || '';

  const [method, setMethod] = useState('UPI');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  const handlePlaceOrder = async () => {
    setPlacing(true);
    setError('');
    try {
      const payload = {
        items: items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
        paymentMethod: method,
      };
      if (isGuest) payload.guestName = guestName || 'Guest';

      const { data } = await api.post('/orders', payload);
      clearCart();
      navigate(`${base}/payment/${data.order._id}`, { state: { method } });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not place order');
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return <div className="max-w-xl mx-auto px-4 py-16 text-center text-neutral-500">Your cart is empty.</div>;
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">Checkout</h1>

      <div className="card p-4 mb-4">
        <h2 className="font-semibold text-neutral-900 mb-3">Order Summary</h2>
        {items.map((i) => (
          <div key={i.menuItemId} className="flex justify-between text-sm py-1">
            <span>{i.name} × {i.quantity}</span>
            <span>₹{i.price * i.quantity}</span>
          </div>
        ))}
        <div className="flex justify-between font-bold text-neutral-900 border-t border-neutral-100 mt-2 pt-2">
          <span>Total</span>
          <span>₹{subtotal}</span>
        </div>
      </div>

      <div className="card p-4 mb-4">
        <h2 className="font-semibold text-neutral-900 mb-3">Payment Method</h2>
        <div className="space-y-2">
          <label className="flex items-center gap-3 p-3 border border-neutral-200 rounded-lg cursor-pointer">
            <input type="radio" checked={method === 'UPI'} onChange={() => setMethod('UPI')} />
            <span>UPI</span>
          </label>
          {!isGuest && (
            <label className="flex items-center gap-3 p-3 border border-neutral-200 rounded-lg cursor-pointer">
              <input type="radio" checked={method === 'WALLET'} onChange={() => setMethod('WALLET')} />
              <span>Campus Wallet</span>
            </label>
          )}
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>}

      <button onClick={handlePlaceOrder} disabled={placing} className="btn-primary w-full">
        {placing ? 'Placing order…' : `Place Order · ₹${subtotal}`}
      </button>
    </div>
  );
};

export default Checkout;
