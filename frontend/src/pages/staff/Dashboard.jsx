import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { QrCode, Clock, CheckCircle2 } from 'lucide-react';
import api from '../../api/axios';
import { useSocket } from '../../context/SocketContext';

const ACTIVE_STATUSES = ['CONFIRMED', 'PREPARING', 'READY'];

const StaffDashboard = () => {
  const { events } = useSocket();
  const [orders, setOrders] = useState([]);
  const [busyId, setBusyId] = useState(null);

  const load = () => api.get('/orders').then(({ data }) => setOrders(data.orders.filter((o) => ACTIVE_STATUSES.includes(o.orderStatus))));

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (events[0]?.type === 'order:new' || events[0]?.type === 'order:status') load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);

  const advance = async (order) => {
    const next = order.orderStatus === 'CONFIRMED' ? 'PREPARING' : order.orderStatus === 'PREPARING' ? 'READY' : null;
    if (!next) return;
    setBusyId(order._id);
    try {
      await api.patch(`/orders/${order._id}/status`, { status: next });
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const grouped = {
    CONFIRMED: orders.filter((o) => o.orderStatus === 'CONFIRMED'),
    PREPARING: orders.filter((o) => o.orderStatus === 'PREPARING'),
    READY: orders.filter((o) => o.orderStatus === 'READY'),
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Staff Dashboard</h1>
        <Link to="/staff/scanner" className="btn-primary flex items-center gap-2">
          <QrCode size={16} /> Scan QR
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(grouped).map(([status, list]) => (
          <div key={status} className="card p-4">
            <h2 className="font-semibold text-neutral-900 mb-3 flex items-center justify-between">
              {status.charAt(0) + status.slice(1).toLowerCase()}
              <span className="text-xs bg-neutral-100 px-2 py-0.5 rounded-full">{list.length}</span>
            </h2>
            <div className="space-y-3">
              {list.length === 0 && <p className="text-xs text-neutral-400">No orders here.</p>}
              {list.map((o) => (
                <div key={o._id} className="border border-neutral-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm text-neutral-900">#{o.orderNumber}</p>
                    {o.orderType === 'READY_FOOD' ? (
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-medium">⚡ Ready Food</span>
                    ) : (
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-medium">🍳 Kitchen</span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    {o.items.map((i) => `${i.name} ×${i.quantity}`).join(', ')}
                  </p>
                  {status !== 'READY' && (
                    <button
                      onClick={() => advance(o)}
                      disabled={busyId === o._id}
                      className="btn-secondary text-xs mt-2 w-full flex items-center justify-center gap-1"
                    >
                      {status === 'CONFIRMED' ? <Clock size={14} /> : <CheckCircle2 size={14} />}
                      {status === 'CONFIRMED' ? 'Start Preparing' : 'Mark Ready'}
                    </button>
                  )}
                  {status === 'READY' && (
                    <p className="text-xs text-emerald-600 mt-2">Waiting for pickup — scan QR to hand over.</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StaffDashboard;
