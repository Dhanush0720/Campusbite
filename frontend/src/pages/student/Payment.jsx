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

  const [status, setStatus] = useState('creating'); // creating | awaiting-upi | awaiting-razorpay | verifying | done | error
  const [upiIntent, setUpiIntent] = useState(null);
  const [razorpayData, setRazorpayData] = useState(null);
  const [providerReference, setProviderReference] = useState(null);
  const [error, setError] = useState('');

  const launchRazorpay = (rzpInfo) => {
    if (!window.Razorpay) {
      setError('Razorpay SDK failed to load. Please refresh the page.');
      setStatus('error');
      return;
    }

    const options = {
      key: rzpInfo.key || import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: rzpInfo.amount,
      currency: rzpInfo.currency || 'INR',
      name: 'CampusBite',
      description: `Order #${orderId.slice(-6).toUpperCase()}`,
      order_id: rzpInfo.orderId,
      handler: async function (response) {
        setStatus('verifying');
        try {
          const { data } = await api.post('/payments/verify', {
            orderId,
            providerReference: rzpInfo.orderId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          sessionStorage.setItem(`qr:${orderId}`, JSON.stringify({ qrImage: data.qrImage, order: data.order }));
          navigate(`${base}/qr/${orderId}`, { replace: true });
        } catch (err) {
          setError(err.response?.data?.message || 'Payment verification failed');
          setStatus('error');
        }
      },
      modal: {
        ondismiss: function () {
          setStatus('awaiting-razorpay');
        },
      },
      theme: { color: '#EA580C' },
    };

    const rzpInstance = new window.Razorpay(options);
    rzpInstance.on('payment.failed', function (response) {
      setError(response.error?.description || 'Payment failed');
      setStatus('awaiting-razorpay');
    });
    rzpInstance.open();
  };

  useEffect(() => {
    const createPayment = async () => {
      try {
        const { data } = await api.post('/payments/create', { orderId, method });
        if (method === 'WALLET') {
          sessionStorage.setItem(`qr:${orderId}`, JSON.stringify({ qrImage: data.qrImage, order: data.order }));
          setStatus('done');
          navigate(`${base}/qr/${orderId}`, { replace: true });
        } else if (data.razorpay) {
          setRazorpayData(data.razorpay);
          setProviderReference(data.payment.providerReference);
          setStatus('awaiting-razorpay');
          launchRazorpay(data.razorpay);
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
    return (
      <div className="max-w-sm mx-auto px-4 py-16 text-center">
        <div className="text-red-600 mb-4">{error}</div>
        <button onClick={() => navigate(-1)} className="btn-secondary text-sm">
          Go Back
        </button>
      </div>
    );
  }

  if (status === 'awaiting-razorpay') {
    return (
      <div className="max-w-sm mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-neutral-900 mb-2">Complete Payment</h1>
        <p className="text-neutral-500 text-sm mb-6">
          Click the button below to open Razorpay and pay via UPI, Card, NetBanking, or Wallet.
        </p>

        {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

        <button
          onClick={() => razorpayData && launchRazorpay(razorpayData)}
          className="btn-primary w-full py-3"
        >
          Pay with Razorpay
        </button>
      </div>
    );
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
