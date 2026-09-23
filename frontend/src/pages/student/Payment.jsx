import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Loader2, IndianRupee, Copy, Check, ExternalLink, ShieldCheck, Smartphone, QrCode } from 'lucide-react';
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
  const [utrNumber, setUtrNumber] = useState('');
  const [copied, setCopied] = useState(false);
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

  const handleCopyVpa = () => {
    if (upiIntent?.payeeVpa) {
      navigator.clipboard.writeText(upiIntent.payeeVpa);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleVerifyUpi = async () => {
    setStatus('verifying');
    setError('');
    try {
      const { data } = await api.post('/payments/verify', {
        orderId,
        providerReference,
        utrNumber: utrNumber.trim() || undefined,
      });
      sessionStorage.setItem(`qr:${orderId}`, JSON.stringify({ qrImage: data.qrImage, order: data.order }));
      navigate(`${base}/qr/${orderId}`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
      setStatus('awaiting-upi');
    }
  };

  if (status === 'creating') {
    return (
      <div className="max-w-md mx-auto px-4 py-24 flex flex-col items-center justify-center text-neutral-500">
        <Loader2 className="animate-spin mb-3 text-brand-600" size={32} />
        <p className="font-medium text-sm">Generating secure UPI QR code…</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 mb-5 text-sm font-medium">
          {error}
        </div>
        <button onClick={() => navigate(-1)} className="btn-secondary text-sm">
          Go Back
        </button>
      </div>
    );
  }

  if (status === 'awaiting-razorpay') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
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
    <div className="max-w-md mx-auto px-4 py-8">
      {/* Header card */}
      <div className="text-center mb-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
          <ShieldCheck size={14} /> Zero Gateway Fee · Direct UPI
        </span>
        <h1 className="text-2xl font-bold text-neutral-900">Scan & Pay via UPI</h1>
        <p className="text-neutral-500 text-xs mt-1">
          Pay using any UPI App (Google Pay, PhonePe, Paytm, BHIM)
        </p>
      </div>

      {/* Main QR Card */}
      <div className="card p-6 border border-neutral-200 rounded-2xl shadow-sm bg-white text-center">
        <div className="bg-brand-50/50 border border-brand-100 rounded-xl py-3 px-4 mb-4 flex items-center justify-between">
          <span className="text-xs text-neutral-600 font-medium">Amount Due:</span>
          <span className="text-2xl font-extrabold text-neutral-900 flex items-center gap-0.5">
            <IndianRupee size={22} className="text-brand-600" />
            {upiIntent?.amount}
          </span>
        </div>

        {/* Dynamic QR Code display */}
        <div className="relative inline-block mx-auto p-3 bg-white border-2 border-neutral-200 rounded-2xl shadow-sm mb-4">
          {upiIntent?.qrImageDataUrl ? (
            <img
              src={upiIntent.qrImageDataUrl}
              alt="UPI QR Code"
              className="w-56 h-56 mx-auto object-contain rounded-lg"
            />
          ) : (
            <div className="w-56 h-56 mx-auto bg-neutral-50 flex flex-col items-center justify-center text-neutral-400">
              <QrCode size={48} className="mb-2 text-neutral-300" />
              <span className="text-xs">Generating UPI QR…</span>
            </div>
          )}
          <div className="mt-2 text-[11px] text-neutral-500 font-medium flex items-center justify-center gap-1">
            <span>Powered by NPCI UPI</span>
          </div>
        </div>

        {/* Payee Info & Copy UPI ID */}
        <div className="bg-neutral-50 border border-neutral-200/80 rounded-xl p-3 text-left mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-neutral-400 uppercase font-semibold">Canteen UPI ID</p>
              <p className="font-mono text-sm font-bold text-neutral-800 break-all">{upiIntent?.payeeVpa}</p>
              <p className="text-xs text-neutral-500">{upiIntent?.payeeName}</p>
            </div>
            <button
              type="button"
              onClick={handleCopyVpa}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-700 transition-colors shadow-2xs"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Deep Link Button */}
        {upiIntent?.upiUri && (
          <a
            href={upiIntent.upiUri}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 active:scale-[0.99] transition-all mb-4 md:hidden"
          >
            <Smartphone size={18} />
            <span>Open in UPI App (GPay / PhonePe)</span>
            <ExternalLink size={14} />
          </a>
        )}

        {/* UTR Input */}
        <div className="text-left pt-2 border-t border-neutral-100">
          <label htmlFor="utrInput" className="block text-xs font-semibold text-neutral-700 mb-1">
            UPI Reference / UTR Number <span className="text-neutral-400 font-normal">(Optional)</span>
          </label>
          <input
            id="utrInput"
            type="text"
            value={utrNumber}
            onChange={(e) => setUtrNumber(e.target.value)}
            placeholder="12-digit UTR from your UPI payment receipt"
            maxLength={18}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
          <p className="text-[11px] text-neutral-400 mt-1">
            Found on your GPay, PhonePe, or Paytm receipt after paying.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3.5 py-2.5 rounded-xl mt-4 font-medium">
          {error}
        </div>
      )}

      {/* Confirmation Button */}
      <button
        type="button"
        onClick={handleVerifyUpi}
        disabled={status === 'verifying'}
        className="btn-primary w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25 active:scale-[0.99] text-base mt-4"
      >
        {status === 'verifying' ? (
          <>
            <Loader2 className="animate-spin" size={18} />
            <span>Verifying Payment…</span>
          </>
        ) : (
          <>
            <Check size={18} />
            <span>I've Completed Payment</span>
          </>
        )}
      </button>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-neutral-400">
        <ShieldCheck size={14} className="text-emerald-500" />
        <span>Direct Bank Settlement · Campus Safe</span>
      </div>
    </div>
  );
};

export default Payment;

