import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, CreditCard, Wallet, ArrowRight, UserCheck } from 'lucide-react';
import api from '../../api/axios';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { DietaryDot } from '../../components/DietaryBadge';

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isGuest = location.pathname.startsWith('/guest');
  const base = isGuest ? '/guest' : '/student';

  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const [guestName, setGuestName] = useState(sessionStorage.getItem('campusbite_guest_name') || '');
  const [walletBalance, setWalletBalance] = useState(null);

  const [method, setMethod] = useState('UPI');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isGuest && user) {
      api.get('/wallet').then(({ data }) => setWalletBalance(data.wallet?.balance || 0)).catch(() => {});
    }
  }, [isGuest, user]);

  const handlePlaceOrder = async () => {
    setError('');

    if (isGuest && !guestName.trim()) {
      setError('Please enter your name for the order pickup pass.');
      return;
    }

    if (method === 'WALLET' && walletBalance !== null && walletBalance < subtotal) {
      setError(`Insufficient wallet balance (₹${walletBalance}). Please top up or choose UPI.`);
      return;
    }

    setPlacing(true);
    try {
      if (isGuest) {
        sessionStorage.setItem('campusbite_guest_name', guestName.trim());
      }

      const payload = {
        items: items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
        paymentMethod: method,
      };
      if (isGuest) payload.guestName = guestName.trim() || 'Guest';

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
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <p className="text-neutral-500 font-medium">Your cart is empty.</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-neutral-900 tracking-tight mb-2">Checkout</h1>
      <p className="text-xs text-neutral-500 mb-6">Review your order details and choose your payment method</p>

      {isGuest && (
        <div className="card p-5 mb-5 border border-amber-200/80 bg-amber-50/40 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-amber-900 font-bold text-sm">
            <UserCheck size={18} className="text-amber-600" />
            <span>Guest Pickup Details</span>
          </div>
          <p className="text-xs text-neutral-600 mb-3">
            Enter your name so the counter staff can call you or identify your order PIN.
          </p>
          <input
            className="input bg-white text-sm font-medium"
            placeholder="e.g. John Doe / Room 204"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            required
          />
        </div>
      )}

      {/* Order Summary */}
      <div className="card p-5 mb-5 border border-neutral-200 rounded-2xl shadow-sm">
        <h2 className="font-bold text-neutral-900 text-sm uppercase tracking-wider text-neutral-400 mb-3">Order Summary</h2>
        <div className="divide-y divide-neutral-100">
          {items.map((i) => (
            <div key={i.menuItemId} className="py-2.5 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <DietaryDot isVeg={i.isVeg} size="sm" />
                <span className="font-medium text-neutral-800">{i.name}</span>
                <span className="text-neutral-400 text-xs">× {i.quantity}</span>
              </div>
              <span className="font-semibold text-neutral-900">₹{i.price * i.quantity}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center font-extrabold text-neutral-900 border-t border-neutral-200/80 mt-3 pt-3">
          <span className="text-sm">Total Payable</span>
          <span className="text-xl text-brand-700">₹{subtotal}</span>
        </div>
      </div>

      {/* Payment Selection */}
      <div className="card p-5 mb-6 border border-neutral-200 rounded-2xl shadow-sm">
        <h2 className="font-bold text-neutral-900 text-sm uppercase tracking-wider text-neutral-400 mb-3">Select Payment Method</h2>
        <div className="space-y-3">
          {/* UPI */}
          <label
            onClick={() => setMethod('UPI')}
            className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
              method === 'UPI'
                ? 'border-brand-600 bg-brand-50/30 shadow-sm'
                : 'border-neutral-200 hover:border-neutral-300 bg-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="paymentMethod"
                checked={method === 'UPI'}
                onChange={() => setMethod('UPI')}
                className="accent-brand-600"
              />
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                UPI
              </div>
              <div>
                <p className="font-bold text-neutral-900 text-sm">Direct UPI / QR Code</p>
                <p className="text-xs text-neutral-500">Google Pay, PhonePe, Paytm, BHIM, or scan QR</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">0% Fee</span>
          </label>

          {/* Campus Wallet */}
          {!isGuest && (
            <label
              onClick={() => setMethod('WALLET')}
              className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                method === 'WALLET'
                  ? 'border-brand-600 bg-brand-50/30 shadow-sm'
                  : 'border-neutral-200 hover:border-neutral-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={method === 'WALLET'}
                  onChange={() => setMethod('WALLET')}
                  className="accent-brand-600"
                />
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                  <Wallet size={18} />
                </div>
                <div>
                  <p className="font-bold text-neutral-900 text-sm">Campus Wallet</p>
                  <p className="text-xs text-neutral-500">
                    Balance: <span className="font-bold text-neutral-800">₹{walletBalance !== null ? walletBalance : '…'}</span>
                  </p>
                </div>
              </div>
              {walletBalance !== null && walletBalance < subtotal ? (
                <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">Low balance</span>
              ) : (
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">1-Click</span>
              )}
            </label>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-xl mb-4 font-medium">
          {error}
        </div>
      )}

      <button
        onClick={handlePlaceOrder}
        disabled={placing}
        className="btn-primary w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25 active:scale-[0.99] text-base"
      >
        {placing ? (
          <span>Securing order…</span>
        ) : (
          <>
            <span>Confirm Order · ₹{subtotal}</span>
            <ArrowRight size={18} />
          </>
        )}
      </button>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-neutral-400">
        <ShieldCheck size={14} className="text-emerald-500" />
        <span>Direct Bank Settlement • Campus Verified Checkout</span>
      </div>
    </div>
  );
};

export default Checkout;

