import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import api from '../../api/axios';

const QRCodePage = () => {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isGuest = location.pathname.startsWith('/guest');
  const base = isGuest ? '/guest' : '/student';

  const [qrImage, setQrImage] = useState(null);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const cached = sessionStorage.getItem(`qr:${orderId}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      setQrImage(parsed.qrImage);
      setOrder(parsed.order);
    } else {
      api.get(`/orders/${orderId}`).then(({ data }) => {
        setOrder(data.order);
        if (data.order?.qrImage) {
          setQrImage(data.order.qrImage);
        }
      });
    }
  }, [orderId]);

  if (!order) return <div className="max-w-sm mx-auto px-4 py-16 text-center text-neutral-400">Loading order…</div>;

  const isReady = order.orderStatus === 'READY';

  return (
    <div className="max-w-sm mx-auto px-4 py-12 text-center">
      <CheckCircle2 className="text-emerald-500 mx-auto mb-3" size={40} />
      <h1 className="text-xl font-bold text-neutral-900">
        {isReady ? 'Ready for Pickup!' : 'Order Confirmed!'}
      </h1>
      <p className="text-neutral-500 text-sm mt-1">Order #{order.orderNumber}</p>

      {qrImage ? (
        <div className="card p-6 mt-6">
          <img src={qrImage} alt="Pickup QR code" className="w-48 h-48 mx-auto" />
          <p className="text-sm text-neutral-500 mt-3">Show this QR code at the counter to collect your food.</p>
          {order.deliveryPin && (
            <p className="text-xs text-neutral-400 mt-2">Backup PIN: <span className="font-mono font-medium">{order.deliveryPin}</span></p>
          )}
        </div>
      ) : (
        <div className="card p-6 mt-6 text-sm text-neutral-500">
          QR was shown once at payment time. Use order status below, or ask staff for manual lookup via your PIN.
        </div>
      )}

      <button onClick={() => navigate(`${base}/orders/${orderId}/track`)} className="btn-primary w-full mt-6">
        Track My Order
      </button>
    </div>
  );
};

export default QRCodePage;
