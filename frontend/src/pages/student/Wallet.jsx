import React, { useEffect, useState } from 'react';
import {
  Wallet as WalletIcon,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  Zap,
  Sparkles,
  CheckCircle2,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  Smartphone,
  Banknote,
  Clock,
  AlertCircle,
  X,
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

const PRESETS = [100, 200, 500, 1000];

const Wallet = () => {
  const { user } = useAuth();
  const { events } = useSocket();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [topUpAmount, setTopUpAmount] = useState('200');
  const [busy, setBusy] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  const [upiModal, setUpiModal] = useState(null); // { referenceId, amount, payeeVpa, payeeName, upiUri, qrImageDataUrl }
  const [utrNumber, setUtrNumber] = useState('');
  const [copied, setCopied] = useState(false);
  const [verifyingUpi, setVerifyingUpi] = useState(false);

  const load = async () => {
    try {
      const [b, t, r] = await Promise.all([
        api.get('/wallet/balance'),
        api.get('/wallet/transactions'),
        api.get('/wallet/recharge/my'),
      ]);
      setBalance(b.data.balance);
      setTransactions(t.data.transactions);
      setMyRequests(r.data.requests || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Listen to socket events for real-time cashier approval
  useEffect(() => {
    const latest = events[0];
    if (latest?.type === 'recharge:status') {
      const payload = latest.payload;
      if (payload?.status === 'APPROVED') {
        setSuccessMsg(`🎉 Cashier approved token #${payload.requestCode}! ₹${payload.amount} added to your wallet.`);
        setError('');
      } else if (payload?.status === 'REJECTED') {
        setError(`Request #${payload.requestCode} was rejected: ${payload.reason || 'Cash not received'}`);
      }
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);

  const activePending = myRequests.find((r) => r.status === 'PENDING');

  // Submit Counter Cash Recharge Request
  const handleRequestCashRecharge = async (e) => {
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
      const { data } = await api.post('/wallet/recharge/request', {
        amount: amountNum,
        paymentType: 'CASH',
      });
      setSuccessMsg(`Ticket created! Hand ₹${amountNum} cash to the canteen cashier with token ${data.request.requestCode}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit recharge request');
    } finally {
      setBusy(false);
    }
  };

  // Cancel pending request
  const handleCancelRequest = async (id) => {
    try {
      await api.patch(`/wallet/recharge/${id}/cancel`);
      setSuccessMsg('Recharge request cancelled');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel request');
    }
  };

  // Initiate Dynamic UPI Top-Up
  const handleUpiTopUp = async () => {
    const amountNum = Number(topUpAmount);
    if (!amountNum || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setBusy(true);
    setError('');
    setSuccessMsg('');

    try {
      const { data } = await api.post('/wallet/topup/upi/create', { amount: amountNum });
      setUpiModal(data);
      setUtrNumber('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not generate UPI QR code');
    } finally {
      setBusy(false);
    }
  };

  // Verify / Confirm UPI Top-Up
  const handleVerifyUpiTopUp = async () => {
    if (!upiModal) return;
    const cleanUtr = utrNumber.trim();
    if (!cleanUtr) {
      setError('Please enter the 12-digit UPI Reference / UTR Number from your payment receipt.');
      return;
    }
    if (cleanUtr.length < 8) {
      setError('Please enter a valid UPI Reference / UTR Number (at least 8-12 digits).');
      return;
    }

    setVerifyingUpi(true);
    setError('');
    try {
      await api.post('/wallet/topup/upi/verify', {
        amount: upiModal.amount,
        referenceId: upiModal.referenceId,
        utrNumber: cleanUtr,
      });
      setSuccessMsg(`🎉 ₹${upiModal.amount} credited to your Campus Wallet!`);
      setUpiModal(null);
      setUtrNumber('');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Top-up verification failed');
    } finally {
      setVerifyingUpi(false);
    }
  };

  const handleCopyVpa = () => {
    if (upiModal?.payeeVpa) {
      navigator.clipboard.writeText(upiModal.payeeVpa);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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

      {/* Active Pending Cash Request Notice */}
      {activePending && (
        <div className="bg-amber-50/90 border-2 border-amber-300 rounded-2xl p-5 mt-6 shadow-xs animate-in fade-in">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Awaiting Counter Cash Verification
              </span>
            </div>
            <span className="text-xs font-mono font-black px-2 py-0.5 rounded bg-amber-200 text-amber-900">
              {activePending.requestCode}
            </span>
          </div>

          <div className="flex items-baseline justify-between my-2">
            <div>
              <p className="text-xs text-amber-800">Cash to hand to cashier:</p>
              <p className="text-2xl font-black text-neutral-900">₹{activePending.amount}</p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-amber-700 block">Show Token to Staff:</span>
              <span className="text-xl font-mono font-black text-amber-950">{activePending.requestCode}</span>
            </div>
          </div>

          <p className="text-xs text-neutral-600 bg-white/80 p-2.5 rounded-xl border border-amber-200/60 mb-3">
            Hand over physical cash to the canteen cashier. The moment the staff clicks <strong>Approve</strong>, your balance will increase instantly!
          </p>

          <button
            type="button"
            onClick={() => handleCancelRequest(activePending._id)}
            className="text-xs text-rose-600 hover:text-rose-800 font-semibold underline"
          >
            Cancel this ticket
          </button>
        </div>
      )}

      {/* Top-up Form */}
      <div className="card p-5 mt-6 border border-neutral-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-neutral-900 text-sm flex items-center gap-1.5">
            <Sparkles size={16} className="text-brand-600" /> Recharge Wallet
          </h2>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            Staff Verified
          </span>
        </div>

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

        <form onSubmit={handleRequestCashRecharge} className="space-y-3">
          <div className="relative">
            <span className="absolute left-3.5 top-3 text-neutral-400 font-bold text-sm">₹</span>
            <input
              type="number"
              min="10"
              max="5000"
              required
              className="input pl-8 text-sm font-semibold"
              placeholder="Enter custom amount"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="submit"
              disabled={busy}
              className="btn-primary w-full text-xs sm:text-sm py-2.5 px-4 flex items-center justify-center gap-1.5 shadow-md bg-emerald-600 hover:bg-emerald-700"
            >
              <Banknote size={16} />
              {busy ? 'Requesting…' : 'Request Cash Top-Up'}
            </button>
            <button
              type="button"
              onClick={handleUpiTopUp}
              disabled={busy}
              className="btn-secondary w-full text-xs sm:text-sm py-2.5 px-4 flex items-center justify-center gap-1.5"
            >
              <QrCode size={15} />
              Pay via UPI QR
            </button>
          </div>
        </form>

        {/* Cash Notice */}
        <div className="mt-4 p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-600 flex items-start gap-2">
          <span className="text-base leading-none">ℹ️</span>
          <div>
            <strong>How counter cash works:</strong> Tap <em>"Request Cash Top-Up"</em> to generate a verification token. Hand the cash to the canteen cashier, who will approve and credit your balance immediately.
          </div>
        </div>

        {successMsg && (
          <div className="mt-3 p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg flex items-center gap-2 border border-emerald-200">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && <p className="text-red-600 text-xs mt-3 bg-red-50 p-2.5 rounded-lg">{error}</p>}
      </div>

      {/* UPI Recharge Modal */}
      {upiModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-neutral-100 relative animate-in fade-in zoom-in duration-150">
            <div className="text-center mb-4">
              <h3 className="font-bold text-lg text-neutral-900">Recharge via UPI</h3>
              <p className="text-xs text-neutral-500">Scan using any UPI app to credit your wallet</p>
            </div>

            <div className="bg-brand-50/60 border border-brand-100 rounded-xl p-3 text-center mb-4">
              <span className="text-xs text-neutral-500">Amount:</span>
              <p className="text-2xl font-black text-neutral-900">₹{upiModal.amount}</p>
            </div>

            {/* QR Image */}
            <div className="p-3 bg-white border-2 border-neutral-200 rounded-2xl shadow-sm text-center mb-4">
              <img
                src={upiModal.qrImageDataUrl}
                alt="UPI QR Code"
                className="w-48 h-48 mx-auto object-contain rounded-lg"
              />
              <p className="text-[11px] text-neutral-400 mt-2">Scan with GPay, PhonePe, Paytm, or BHIM</p>
            </div>

            {/* Payee Info & Copy UPI ID */}
            <div className="bg-neutral-50 border border-neutral-200/80 rounded-xl p-2.5 mb-3 flex items-center justify-between text-left">
              <div className="truncate mr-2">
                <p className="text-[10px] text-neutral-400 uppercase font-semibold">UPI ID</p>
                <p className="font-mono text-xs font-bold text-neutral-800 truncate">{upiModal.payeeVpa}</p>
              </div>
              <button
                type="button"
                onClick={handleCopyVpa}
                className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md border border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-700 shrink-0"
              >
                {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Mobile App Link */}
            {upiModal.upiUri && (
              <a
                href={upiModal.upiUri}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-bold text-xs bg-indigo-600 text-white mb-3 shadow-sm md:hidden"
              >
                <Smartphone size={15} />
                <span>Open in UPI App</span>
                <ExternalLink size={12} />
              </a>
            )}

            {/* UTR Input */}
            <div className="mb-4 text-left">
              <label htmlFor="topupUtrInput" className="flex items-center justify-between text-[11px] font-bold text-neutral-800 mb-1">
                <span>UPI Reference / UTR Number</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded">
                  * Mandatory
                </span>
              </label>
              <input
                id="topupUtrInput"
                type="text"
                value={utrNumber}
                onChange={(e) => {
                  setUtrNumber(e.target.value);
                  if (error) setError('');
                }}
                placeholder="e.g. 426819203847 (12-digit UTR)"
                maxLength={22}
                required
                className={`w-full px-3 py-2 border rounded-lg text-xs font-mono focus:outline-none focus:ring-1 ${
                  !utrNumber.trim()
                    ? 'border-neutral-300 focus:border-brand-500 focus:ring-brand-500'
                    : 'border-emerald-500/60 bg-emerald-50/20 focus:ring-emerald-500'
                }`}
              />
              <p className="text-[10px] text-neutral-400 mt-1">
                Enter the 12-digit UTR number from your UPI receipt to credit wallet.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setUpiModal(null)}
                className="btn-secondary flex-1 py-2.5 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyUpiTopUp}
                disabled={verifyingUpi}
                className="btn-primary flex-1 py-2.5 text-xs font-bold"
              >
                {verifyingUpi ? 'Crediting…' : "I've Paid"}
              </button>
            </div>
          </div>
        </div>
      )}

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
