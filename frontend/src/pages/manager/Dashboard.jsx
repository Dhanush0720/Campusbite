import React, { useEffect, useState } from 'react';
import { TrendingUp, ShoppingBag, Clock, AlertTriangle, Banknote } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import api from '../../api/axios';
import CashierRechargeModal from '../../components/CashierRechargeModal';

const COLORS = ['#f97316', '#fb923c', '#fdba74', '#ea580c'];

const ManagerDashboard = () => {
  const [dash, setDash] = useState(null);
  const [showCashierModal, setShowCashierModal] = useState(false);

  useEffect(() => {
    api.get('/manager/dashboard').then(({ data }) => setDash(data));
  }, []);

  if (!dash) return <div className="max-w-6xl mx-auto px-4 py-16 text-center text-neutral-400">Loading…</div>;

  const paymentData = (dash.paymentSplit || []).map((p) => ({ name: p._id, value: p.total }));
  const popularData = (dash.popularItems || []).map((p) => ({ name: p._id, qty: p.qty }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Manager Dashboard</h1>
        <button
          onClick={() => setShowCashierModal(true)}
          className="btn-secondary flex items-center gap-1.5 text-sm py-2 px-3.5 border-emerald-300 text-emerald-800 bg-emerald-50/60 hover:bg-emerald-100/70"
        >
          <Banknote size={16} className="text-emerald-600" />
          <span>Counter Cash Top-Up</span>
        </button>
      </div>

      <CashierRechargeModal
        isOpen={showCashierModal}
        onClose={() => setShowCashierModal(false)}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card p-4">
          <TrendingUp className="text-brand-600 mb-2" size={20} />
          <p className="text-xs text-neutral-500">Today's Sales</p>
          <p className="text-xl font-bold text-neutral-900">₹{dash.todaySales}</p>
          <p className="text-xs text-neutral-400">{dash.todayOrderCount} orders</p>
        </div>
        <div className="card p-4">
          <ShoppingBag className="text-brand-600 mb-2" size={20} />
          <p className="text-xs text-neutral-500">Total Orders</p>
          <p className="text-xl font-bold text-neutral-900">{dash.totalOrders}</p>
        </div>
        <div className="card p-4">
          <Clock className="text-amber-500 mb-2" size={20} />
          <p className="text-xs text-neutral-500">Pending</p>
          <p className="text-xl font-bold text-neutral-900">{dash.pendingOrders}</p>
        </div>
        <div className="card p-4">
          <AlertTriangle className="text-red-500 mb-2" size={20} />
          <p className="text-xs text-neutral-500">Low Stock Items</p>
          <p className="text-xl font-bold text-neutral-900">{dash.lowStockMenu?.length || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card p-4">
          <h2 className="font-semibold text-neutral-900 mb-3 text-sm">Payment Method Split</h2>
          {paymentData.length === 0 ? <p className="text-sm text-neutral-400">No paid orders yet.</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={paymentData} dataKey="value" nameKey="name" outerRadius={80} label>
                  {paymentData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="card p-4">
          <h2 className="font-semibold text-neutral-900 mb-3 text-sm">Popular Items</h2>
          {popularData.length === 0 ? <p className="text-sm text-neutral-400">No paid orders yet.</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={popularData} layout="vertical">
                <XAxis type="number" fontSize={12} />
                <YAxis type="category" dataKey="name" width={100} fontSize={11} />
                <Tooltip />
                <Bar dataKey="qty" fill="#f97316" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {dash.lowStockMenu?.length > 0 && (
        <div className="card p-4 border-amber-200 bg-amber-50">
          <h2 className="font-semibold text-amber-800 mb-2 text-sm flex items-center gap-2">
            <AlertTriangle size={16} /> Low Stock Alerts
          </h2>
          <ul className="text-sm text-amber-700 space-y-1">
            {dash.lowStockMenu.map((m) => (
              <li key={m._id}>{m.name} — {m.availableQuantity} left</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;
