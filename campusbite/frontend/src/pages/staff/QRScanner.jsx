import React, { useState } from 'react';
import { ScanLine, CheckCircle2, XCircle } from 'lucide-react';
import api from '../../api/axios';

// Manual token/PIN entry by default (works with any USB/Bluetooth barcode-scanner "keyboard wedge"
// device, which is how most canteen counters actually operate). To scan with a device camera instead,
// drop in a library such as html5-qrcode: decode the QR image client-side into `qrToken` and call the
// same /orders/verify-qr endpoint below - the backend logic does not change.
const QRScanner = () => {
  const [qrToken, setQrToken] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [pin, setPin] = useState('');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setOrder(null);
    setBusy(true);
    try {
      const payload = qrToken ? { qrToken } : { orderNumber, deliveryPin: pin };
      const { data } = await api.post('/orders/verify-qr', payload);
      setOrder(data.order);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setBusy(false);
    }
  };

  const handleDeliver = async () => {
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post(`/orders/${order._id}/deliver`);
      setOrder(data.order);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not confirm delivery');
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setQrToken(''); setOrderNumber(''); setPin(''); setOrder(null); setError('');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-neutral-900 mb-1 flex items-center gap-2">
        <ScanLine className="text-brand-600" /> QR Scanner
      </h1>
      <p className="text-neutral-500 text-sm mb-6">Scan the student's QR code, or enter their order number + PIN.</p>

      {!order && (
        <form onSubmit={handleVerify} className="card p-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-neutral-700">QR Token</label>
            <input
              className="input mt-1" autoFocus placeholder="Scan or paste QR token"
              value={qrToken} onChange={(e) => setQrToken(e.target.value)}
            />
          </div>
          <div className="text-center text-xs text-neutral-400">— or —</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-neutral-700">Order Number</label>
              <input className="input mt-1" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700">PIN</label>
              <input className="input mt-1" value={pin} onChange={(e) => setPin(e.target.value)} />
            </div>
          </div>
          {error && <p className="text-red-600 text-sm flex items-center gap-1"><XCircle size={14} /> {error}</p>}
          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? 'Checking…' : 'Verify'}
          </button>
        </form>
      )}

      {order && (
        <div className="card p-5">
          <div className="flex items-center gap-2 text-emerald-600 mb-3">
            <CheckCircle2 size={20} /> <span className="font-medium">Order Verified</span>
          </div>
          <p className="font-bold text-lg text-neutral-900">#{order.orderNumber}</p>
          <p className="text-sm text-neutral-500 mb-3">{order.guestName ? `Guest: ${order.guestName}` : 'Registered user'}</p>
          <div className="border-t border-neutral-100 pt-3 space-y-1">
            {order.items.map((i, idx) => (
              <div key={idx} className="flex justify-between text-sm text-neutral-700">
                <span>{i.name} × {i.quantity}</span>
                <span>₹{i.price * i.quantity}</span>
              </div>
            ))}
          </div>
          <span className={`status-badge status-${order.orderStatus} mt-3`}>{order.orderStatus}</span>

          {error && <p className="text-red-600 text-sm mt-3">{error}</p>}

          {order.orderStatus === 'READY' ? (
            <button onClick={handleDeliver} disabled={busy} className="btn-primary w-full mt-4">
              {busy ? 'Confirming…' : 'Confirm Handover'}
            </button>
          ) : (
            <p className="text-xs text-amber-600 mt-4">
              Order must reach READY status (kitchen must finish preparing) before handover.
            </p>
          )}

          <button onClick={reset} className="btn-secondary w-full mt-2">Scan Next</button>
        </div>
      )}
    </div>
  );
};

export default QRScanner;
