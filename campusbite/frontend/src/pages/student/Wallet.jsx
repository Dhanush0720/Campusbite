import React, { useEffect, useState } from 'react';
import { Wallet as WalletIcon, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import api from '../../api/axios';

const Wallet = () => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    const [b, t] = await Promise.all([api.get('/wallet/balance'), api.get('/wallet/transactions')]);
    setBalance(b.data.balance);
    setTransactions(t.data.transactions);
  };

  useEffect(() => { load(); }, []);

  const handleTopUp = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/wallet/topup', { amount: Number(topUpAmount) });
      setTopUpAmount('');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Top-up failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">Wallet</h1>

      <div className="card p-6 bg-gradient-to-br from-brand-600 to-brand-700 text-white">
        <div className="flex items-center gap-2 text-brand-100 text-sm">
          <WalletIcon size={16} /> Campus Wallet Balance
        </div>
        <p className="text-3xl font-bold mt-2">₹{balance}</p>
      </div>

      <form onSubmit={handleTopUp} className="card p-4 mt-4 flex items-center gap-3">
        <input
          type="number" min="1" max="5000" required
          className="input" placeholder="Amount (demo top-up, max ₹5000)"
          value={topUpAmount} onChange={(e) => setTopUpAmount(e.target.value)}
        />
        <button type="submit" disabled={busy} className="btn-primary whitespace-nowrap">Add Money</button>
      </form>
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      <p className="text-xs text-neutral-400 mt-2">
        Demo mode: top-up credits your wallet directly for testing. A production build would route this through the same UPI verification flow used for orders.
      </p>

      <h2 className="font-semibold text-neutral-900 mt-8 mb-3">Transaction History</h2>
      <div className="card divide-y divide-neutral-100">
        {transactions.length === 0 && <p className="p-4 text-sm text-neutral-400">No transactions yet.</p>}
        {transactions.map((t) => (
          <div key={t._id} className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {t.type === 'DEBIT' ? (
                <ArrowUpCircle className="text-red-500" size={20} />
              ) : (
                <ArrowDownCircle className="text-emerald-500" size={20} />
              )}
              <div>
                <p className="text-sm font-medium text-neutral-900">{t.type}</p>
                <p className="text-xs text-neutral-400">{new Date(t.createdAt).toLocaleString()}</p>
              </div>
            </div>
            <span className={`font-semibold ${t.type === 'DEBIT' ? 'text-red-600' : 'text-emerald-600'}`}>
              {t.type === 'DEBIT' ? '-' : '+'}₹{t.amount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Wallet;
