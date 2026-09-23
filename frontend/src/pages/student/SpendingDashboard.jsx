import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import api from '../../api/axios';

const COLORS = ['#f97316', '#fb923c', '#fdba74', '#ea580c', '#c2410c'];

const SpendingDashboard = () => {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    api.get('/spending/summary').then(({ data }) => setSummary(data));
  }, []);

  if (!summary) return <div className="max-w-4xl mx-auto px-4 py-16 text-neutral-400 text-center">Loading…</div>;

  const categoryData = (summary.byCategory || [])
    .filter((c) => c._id)
    .map((c) => ({ name: c._id, value: c.total }));

  const methodData = (summary.byMethod || []).map((m) => ({ name: m._id, value: m.total }));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">Spending Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Today', value: summary.today },
          { label: 'This Week', value: summary.week },
          { label: 'This Month', value: summary.month },
          { label: 'All Time', value: summary.allTime },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <p className="text-xs text-neutral-500">{s.label}</p>
            <p className="text-xl font-bold text-neutral-900">₹{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-4">
          <h2 className="font-semibold text-neutral-900 mb-3 text-sm">Spending by Category</h2>
          {categoryData.length === 0 ? (
            <p className="text-sm text-neutral-400">No paid orders yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" outerRadius={80} label>
                  {categoryData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-4">
          <h2 className="font-semibold text-neutral-900 mb-3 text-sm">UPI vs Wallet Spending</h2>
          {methodData.length === 0 ? (
            <p className="text-sm text-neutral-400">No paid orders yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={methodData}>
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpendingDashboard;
