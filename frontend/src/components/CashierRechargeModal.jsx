import React, { useState } from 'react';
import { X, Banknote, CheckCircle2, AlertCircle, Loader2, IndianRupee } from 'lucide-react';
import api from '../api/axios';

const PRESETS = [50, 100, 200, 500];

const CashierRechargeModal = ({ isOpen, onClose }) => {
  const [identifier, setIdentifier] = useState('');
  const [amount, setAmount] = useState('100');
  const [notes, setNotes] = useState('Cash handed at canteen counter');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Please provide student email, phone, or Student ID');
      return;
    }
    const num = Number(amount);
    if (!num || num <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setBusy(true);
    setError('');
    setResult(null);

    try {
      const { data } = await api.post('/wallet/cashier-topup', {
        identifier: identifier.trim(),
        amount: num,
        notes: notes.trim(),
      });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to top-up student wallet');
    } finally {
      setBusy(false);
    }
  };

  const resetForm = () => {
    setIdentifier('');
    setAmount('100');
    setNotes('Cash handed at canteen counter');
    setResult(null);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-100 relative animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Banknote size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-900">Counter Cash Top-Up</h3>
              <p className="text-xs text-neutral-400">Credit student wallet upon receiving cash</p>
            </div>
          </div>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {result ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={28} />
            </div>
            <h4 className="font-bold text-base text-neutral-900 mb-1">Recharge Successful!</h4>
            <p className="text-sm text-neutral-600 mb-2">
              Credited <strong className="text-emerald-700">₹{amount}</strong> to{' '}
              <strong>{result.student?.name}</strong> ({result.student?.email})
            </p>
            <p className="text-xs text-neutral-400 font-mono mb-6">Txn ID: {result.transaction?._id}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary flex-1 py-2.5 text-xs font-semibold"
              >
                Top-Up Another Student
              </button>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                className="btn-primary flex-1 py-2.5 text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Student Email, Phone, or Student ID *
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. rahul@campus.edu or 9876543210 or CS101"
                className="input text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Cash Received (₹) *
              </label>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {PRESETS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmount(String(amt))}
                    className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      amount === String(amt)
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                        : 'border-neutral-200 hover:border-neutral-300 text-neutral-600'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-neutral-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input pl-7 text-sm font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Note / Register Reference
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional register or drawer note"
                className="input text-xs"
              />
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1 py-2.5 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="btn-primary flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                {busy ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Processing…</span>
                  </>
                ) : (
                  <>
                    <IndianRupee size={14} />
                    <span>Credit Wallet</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CashierRechargeModal;
