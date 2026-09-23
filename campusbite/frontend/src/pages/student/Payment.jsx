import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Loader2, IndianRupee } from 'lucide-react';
import api from '../../api/axios';

const Payment = () => {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isGuest = location.pathname.startsWith('/guest');
  const base = isGuest ? '/guest' : '/student';
  const method = location.state?.method || 'UPI';

  const [status, setStatus] = useState('creating'); // creating | awaiting-upi | verifying | done | error
  const [upiIntent, setUpiIntent] = useState(null);
  const [providerReference, setProviderReference] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const createPayment = async () => {
      try {
        const { data } = await api.post('/payments/create', { orderId, method });
        if (method === 'WALLET') {
          sessionStorage.setItem(`qr:${orderId}`, JSON.stringify({ qrImage: data.qrImage, order: data.order }));
          setStatus('done');
          navigate(`${base}/qr/${orderId}`, { replace: true });
        } else {
          setUpiIntent(data.upiIntent);
          setProviderReference(data.payment.providerReference);
          setStatus('awaiting-upi');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Payment could not be started');
        setStatus('error');
      }
    };
    createPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, method]);

  const simulateUpiSuccess = async () => {
    setStatus('verifying');
    try {
      const { data } = await api.post('/payments/verify', { orderId, providerReference });
      sessionStorage.setItem(`qr:${orderId}`, JSON.stringify({ qrImage: data.qrImage, order: data.order }));
      navigate(`${base}/qr/${orderId}`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
      setStatus('error');
    }
  };

  if (status === 'creating') {
    return (
      <div className="max-w-sm mx-auto px-4 py-24 flex flex-col items-center text-neutral-500">
        <Loader2 className="animate-spin mb-3" />
        Preparing payment…
      </div>
    );
  }

  if (status === 'error') {
    return <div className="max-w-sm mx-auto px-4 py-16 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <h1 className="text-xl font-bold text-neutral-900 mb-1">Pay via UPI</h1>
      <p className="text-neutral-500 text-sm mb-6">Sandbox mode — no real money moves. Swap this for a live UPI gateway in production.</p>

      <div className="card p-6 text-center">
        <div className="w-40 h-40 mx-auto bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-400 text-xs mb-4">
          UPI QR (sandbox)
        </div>
        <p className="text-sm text-neutral-500">Pay to</p>
        <p className="font-mono text-sm text-neutral-900">{upiIntent?.payeeVpa}</p>
        <p className="flex items-center justify-center gap-1 text-2xl font-bold text-neutral-900 mt-2">
          <IndianRupee size={20} /> {upiIntent?.amount}
        </p>
        <p className="text-xs text-neutral-400 mt-1">{upiIntent?.note}</p>
      </div>

      <button
        onClick={simulateUpiSuccess}
        disabled={status === 'verifying'}
        className="btn-primary w-full mt-6"
      >
        {status === 'verifying' ? 'Verifying…' : "I've Completed Payment"}
      </button>
    </div>
  );
};

export default Payment;
