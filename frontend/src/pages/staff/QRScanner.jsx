import React, { useEffect, useRef, useState } from 'react';
import { ScanLine, CheckCircle2, XCircle, Camera, Keyboard, RefreshCw, SwitchCamera } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../../api/axios';

const QRScanner = () => {
  const [mode, setMode] = useState('camera'); // 'camera' | 'manual'
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [qrToken, setQrToken] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [pin, setPin] = useState('');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const scannerRef = useRef(null);

  const verifyPayload = async (payload) => {
    setError('');
    setBusy(true);
    try {
      const { data } = await api.post('/orders/verify-qr', payload);
      setOrder(data.order);
      // Play a short confirmation audio chime if supported
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880; // A5 note
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
      } catch (e) {
        // audio context not allowed without prior user gesture, safe to ignore
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
      // If camera was scanning and token was invalid, restart camera after 2s
      if (mode === 'camera' && scannerRef.current) {
        setTimeout(() => startCamera(facingMode), 1500);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleManualVerify = async (e) => {
    e.preventDefault();
    if (!qrToken && (!orderNumber || !pin)) {
      setError('Enter QR token OR both Order Number and PIN');
      return;
    }
    const payload = qrToken ? { qrToken } : { orderNumber, deliveryPin: pin };
    await verifyPayload(payload);
  };

  const startCamera = async (currentFacingMode = facingMode) => {
    setCameraError('');
    try {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
          await scannerRef.current.clear();
        } catch (e) {
          // ignore
        }
      }

      const html5QrCode = new Html5Qrcode('qr-camera-feed');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: currentFacingMode },
        {
          fps: 20,
          aspectRatio: 1.0,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const edgeSize = Math.max(180, Math.floor(minEdge * 0.75));
            return { width: edgeSize, height: edgeSize };
          },
        },
        async (decodedText) => {
          // Success! Stop camera and verify
          try {
            await html5QrCode.stop();
            setCameraActive(false);
          } catch (e) {
            // ignore
          }
          await verifyPayload({ qrToken: decodedText.trim() });
        },
        () => {
          // frame scan failure (no QR in view), normal during scanning
        }
      );
      setCameraActive(true);
    } catch (err) {
      console.warn('Camera error:', err);
      setCameraActive(false);
      setCameraError('Unable to open camera. Please grant camera permission or switch to Manual PIN.');
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (e) {
        // ignore
      }
      scannerRef.current = null;
      setCameraActive(false);
    }
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  useEffect(() => {
    if (mode === 'camera' && !order) {
      startCamera(facingMode);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, order, facingMode]);

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
    setQrToken('');
    setOrderNumber('');
    setPin('');
    setOrder(null);
    setError('');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-neutral-900 mb-1 flex items-center gap-2">
        <ScanLine className="text-brand-600" /> Counter QR Scanner
      </h1>
      <p className="text-neutral-500 text-sm mb-6">Scan student QR code or enter Order # + PIN for instant handover.</p>

      {!order && (
        <div className="card overflow-hidden mb-6 shadow-sm border border-neutral-200">
          {/* Tabs */}
          <div className="grid grid-cols-2 border-b border-neutral-200">
            <button
              onClick={() => { setMode('camera'); setError(''); }}
              className={`py-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
                mode === 'camera' ? 'border-brand-600 text-brand-600 bg-brand-50/50' : 'border-transparent text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Camera size={16} /> Live Camera
            </button>
            <button
              onClick={() => { setMode('manual'); setError(''); }}
              className={`py-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
                mode === 'manual' ? 'border-brand-600 text-brand-600 bg-brand-50/50' : 'border-transparent text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Keyboard size={16} /> Manual PIN
            </button>
          </div>

          {/* Mode 1: Camera Scanner */}
          {mode === 'camera' && (
            <div className="p-4 text-center">
              {/* Outer Viewport Container with Reticle */}
              <div className="relative w-full aspect-square bg-slate-950 rounded-2xl overflow-hidden mx-auto max-w-[320px] shadow-lg border border-neutral-800">
                {/* HTML5 Camera Stream */}
                <div id="qr-camera-feed" className="w-full h-full" />

                {/* Animated Laser Scanning Line */}
                {cameraActive && !busy && <div className="laser-line" />}

                {/* 4 Glowing Corner Reticles */}
                <div className="absolute inset-4 pointer-events-none z-10 flex flex-col justify-between">
                  <div className="flex justify-between">
                    <div className="w-8 h-8 border-t-4 border-l-4 border-brand-500 rounded-tl-xl shadow-[0_0_10px_rgba(234,88,12,0.9)]" />
                    <div className="w-8 h-8 border-t-4 border-r-4 border-brand-500 rounded-tr-xl shadow-[0_0_10px_rgba(234,88,12,0.9)]" />
                  </div>
                  <div className="flex justify-between">
                    <div className="w-8 h-8 border-b-4 border-l-4 border-brand-500 rounded-bl-xl shadow-[0_0_10px_rgba(234,88,12,0.9)]" />
                    <div className="w-8 h-8 border-b-4 border-r-4 border-brand-500 rounded-br-xl shadow-[0_0_10px_rgba(234,88,12,0.9)]" />
                  </div>
                </div>

                {/* Top Badge: Aim Indicator */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-bold text-white flex items-center gap-1.5 shadow-sm whitespace-nowrap">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Aim at Student QR</span>
                </div>

                {/* Bottom Control: Flip Camera (Front/Back) */}
                <div className="absolute bottom-3 right-3 z-20">
                  <button
                    type="button"
                    onClick={toggleCamera}
                    className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-md shadow-md transition-all active:scale-95 flex items-center gap-1 text-xs font-semibold"
                    title="Flip Camera"
                  >
                    <SwitchCamera size={16} />
                  </button>
                </div>
              </div>

              {busy && (
                <div className="mt-3 text-sm font-bold text-brand-600 flex items-center justify-center gap-2">
                  <RefreshCw className="animate-spin" size={16} /> Verifying scanned QR…
                </div>
              )}

              {cameraError && (
                <div className="mt-3 p-3 bg-amber-50 text-amber-800 text-xs rounded-xl text-left border border-amber-200">
                  <p className="font-semibold mb-1">Camera Notice:</p>
                  <p>{cameraError}</p>
                  <button
                    onClick={() => setMode('manual')}
                    className="mt-2 btn-secondary text-xs w-full py-2 font-bold"
                  >
                    Switch to Manual PIN Entry
                  </button>
                </div>
              )}

              {error && (
                <div className="mt-3 p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-200 font-medium">
                  <XCircle size={16} className="shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              <p className="text-xs text-neutral-400 mt-3 font-medium">
                Hold the student's pickup QR code steady inside the frame.
              </p>
            </div>
          )}

          {/* Mode 2: Manual Entry Form */}
          {mode === 'manual' && (
            <form onSubmit={handleManualVerify} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-600">Order Number</label>
                  <input
                    className="input mt-1 text-sm font-mono"
                    placeholder="e.g. CB-20260923-44728"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-600">4-6 Digit PIN</label>
                  <input
                    className="input mt-1 text-sm font-mono tracking-widest text-center"
                    placeholder="e.g. 290507"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                  />
                </div>
              </div>

              <div className="text-center text-xs text-neutral-400">— or paste QR Token / Barcode gun —</div>

              <div>
                <label className="text-xs font-semibold text-neutral-600">QR Raw Token</label>
                <input
                  className="input mt-1 text-xs font-mono"
                  placeholder="Paste raw QR token string"
                  value={qrToken}
                  onChange={(e) => setQrToken(e.target.value)}
                />
              </div>

              {error && (
                <p className="text-red-600 text-xs flex items-center gap-1.5 bg-red-50 p-2.5 rounded-lg">
                  <XCircle size={14} /> {error}
                </p>
              )}

              <button type="submit" disabled={busy} className="btn-primary w-full py-2.5 text-sm">
                {busy ? 'Verifying…' : 'Verify Order'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Verified Order Card */}
      {order && (
        <div className="card p-5 border-2 border-emerald-400 shadow-md">
          <div className="flex items-center gap-2 text-emerald-600 mb-2">
            <CheckCircle2 size={22} /> <span className="font-bold text-base">Order Verified!</span>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <p className="font-bold text-xl text-neutral-900">#{order.orderNumber}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{order.guestName ? `Guest: ${order.guestName}` : 'Student Account'}</p>
            </div>
            <span className="font-bold text-lg text-neutral-900">₹{order.totalAmount}</span>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <span className={`status-badge status-${order.orderStatus}`}>{order.orderStatus}</span>
            {order.orderType === 'READY_FOOD' ? (
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">⚡ Express Ready Food</span>
            ) : (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">🍳 Kitchen Made-to-Order</span>
            )}
          </div>

          <div className="border-t border-neutral-100 pt-3 mt-4 space-y-1.5">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Items to Hand Over:</p>
            {order.items.map((i, idx) => (
              <div key={idx} className="flex justify-between text-sm text-neutral-800 font-medium py-0.5">
                <span>{i.name} × {i.quantity}</span>
                <span>₹{i.price * i.quantity}</span>
              </div>
            ))}
          </div>

          {error && <p className="text-red-600 text-xs mt-3 bg-red-50 p-2 rounded">{error}</p>}

          {order.orderStatus === 'DELIVERED' || order.orderStatus === 'CLOSED' ? (
            <div className="bg-emerald-50 text-emerald-800 text-sm p-3.5 rounded-lg mt-5 text-center font-bold">
              ✅ Order Handed Over & Completed
            </div>
          ) : (
            <button
              onClick={handleDeliver}
              disabled={busy}
              className="btn-primary w-full mt-5 flex items-center justify-center gap-2 py-3.5 text-base font-bold shadow-lg"
            >
              <CheckCircle2 size={20} />
              {busy ? 'Confirming…' : 'Confirm Handover & Deliver Food'}
            </button>
          )}

          <button onClick={reset} className="btn-secondary w-full mt-3 py-2 text-sm">
            Scan Next Order
          </button>
        </div>
      )}
    </div>
  );
};

export default QRScanner;
