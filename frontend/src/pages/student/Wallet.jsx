import React, { useEffect, useState } from 'react';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, ShieldCheck, Zap, Sparkles, CheckCircle2 } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const PRESETS = [100, 200, 500, 1000];

const Wallet = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [topUpAmount, setTopUpAmount] = useState('200');
  const [busy, setBusy] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [b, t] = await Promise.all([api.get('/wallet/balance'), api.get('/wallet/transactions')]);
      setBalance(b.data.balance);
      setTransactions(t.data.transactions);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { load(); }, []);

  const handleTopUp = async (e) => {
    if (e) e.preventDefault();
    const amountNum = Number(topUpAmount);
    if (!amountNum || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setBusy(true);
    setError('');
    setSuccessMsg('');

    try {
      // 1. Ask backend to create a Razorpay topup order
      const { data } = await api.post('/wallet/topup/razorpay/create', { amount: amountNum });

      // Fallback: If Razorpay keys aren't configured yet, perform direct topup
      if (data.isDemo || !data.razorpay) {
        await api.post('/wallet/topup', { amount: amountNum });
        setSuccessMsg(`₹${amountNum} added successfully to your Campus Wallet!`);
        await load();
        setBusy(false);
        return;
      }

      // 2. Open official Razorpay Checkout Modal
      const options = {
        key: data.razorpay.key || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.razorpay.amount,
        currency: data.razorpay.currency || 'INR',
        name: 'CampusBite Wallet',
        description: `Wallet Recharge: ₹${amountNum}`,
        order_id: data.razorpay.orderId,
        handler: async function (response) {
          try {
            await api.post('/wallet/topup/razorpay/verify', {
              amount: amountNum,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setSuccessMsg(`🎉 ₹${amountNum} credited to your Campus Wallet!`);
            await load();
          } catch (err) {
            setError(err.response?.data?.message || 'Top-up verification failed');
          } finally {
            setBusy(false);
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.phone,
        },
        modal: {
          ondismiss: () => setBusy(false),
        },
        theme: { color: '#EA580C' },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (res) {
        setError(res.error?.description || 'Payment failed');
        setBusy(false);
      });
      rzp.open();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not initiate top-up');
      setBusy(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-neutral-900 mb-1">Campus Wallet</h1>
      <p className="text-sm text-neutral-500 mb-6">Zero-wait, 1-tap payments at canteen counters.</p>

      {/* Wallet Balance Card */}
      <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-neutral-900 via-neutral-800 to-brand-900 text-white shadow-xl">
        <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-brand-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-neutral-300 text-xs font-semibold tracking-wider uppercase">
            <WalletIcon size={16} className="text-brand-400" /> Campus Pass Wallet
          </div>
          <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
            <ShieldCheck size={12} /> Instant 1-Tap Pay
          </span>
        </div>

        <p className="text-neutral-400 text-xs">Available Balance</p>
        <p className="text-4xl font-extrabold tracking-tight mt-1 text-white">₹{balance}</p>

        <div className="mt-4 pt-4 border-t border-neutral-700/60 flex items-center justify-between text-xs text-neutral-400">
          <span>Student: <strong className="text-neutral-200">{user?.name}</strong></span>
          <span>{user?.studentId || 'CampusBite ID'}</span>
        </div>
      </div>

      {/* Top-up Form */}
      <div className="card p-5 mt-6 border border-neutral-200 shadow-sm">
        <h2 className="font-semibold text-neutral-900 text-sm flex items-center gap-1.5 mb-3">
          <Sparkles size={16} className="text-brand-600" /> Recharge Wallet
        </h2>

        {/* Preset Chips */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {PRESETS.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => setTopUpAmount(String(amt))}
              className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                topUpAmount === String(amt)
                  ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-xs'
                  : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-brand-300'
              }`}
            >
              +₹{amt}
            </button>
          ))}
        </div>

        <form onSubmit={handleTopUp} className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-2.5 text-neutral-400 font-semibold text-sm">₹</span>
            <input
              type="number"
              min="10"
              max="5000"
              required
              className="input pl-7 text-sm font-medium"
              placeholder="Enter amount"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="btn-primary whitespace-nowrap text-sm px-5 flex items-center gap-1.5"
          >
            <Zap size={14} />
            {busy ? 'Opening…' : 'Add via UPI / Card'}
          </button>
        </form>

        {successMsg && (
          <div className="mt-3 p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg flex items-center gap-2 border border-emerald-200">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && <p className="text-red-600 text-xs mt-3 bg-red-50 p-2.5 rounded-lg">{error}</p>}
      </div>

      {/* Transaction History */}
      <h2 className="font-semibold text-neutral-900 mt-8 mb-3 text-base">Recent Transactions</h2>
      <div className="card divide-y divide-neutral-100 shadow-xs">
        {transactions.length === 0 ? (
          <p className="p-6 text-sm text-neutral-400 text-center">No wallet activity yet.</p>
        ) : (
          transactions.slice(0, 20).map((t) => {
            const isDebit = t.type === 'DEBIT';
            return (
              <div key={t._id} className="p-4 flex items-center justify-between hover:bg-neutral-50/60 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isDebit ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {isDebit ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      {isDebit ? 'Canteen Order' : 'Wallet Recharge'}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {new Date(t.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      {t.note ? ` · ${t.note}` : ''}
                    </p>
                  </div>
                </div>
                <span className={`font-bold text-sm ${isDebit ? 'text-red-600' : 'text-emerald-600'}`}>
                  {isDebit ? '-' : '+'}₹{t.amount}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Wallet;
