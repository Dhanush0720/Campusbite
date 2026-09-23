import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../../api/axios';

const COLORS = ['#f97316', '#fb923c', '#fdba74', '#ea580c', '#c2410c'];
const RANGES = [
  { value: 'daily', label: 'Today (hourly)' },
  { value: 'weekly', label: 'This Week' },
  { value: 'monthly', label: 'This Month' },
];

const Reports = () => {
  const [range, setRange] = useState('daily');
  const [report, setReport] = useState(null);

  useEffect(() => {
    api.get('/manager/reports', { params: { range } }).then(({ data }) => setReport(data));
  }, [range]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Reports</h1>
        <select className="input w-48" value={range} onChange={(e) => setRange(e.target.value)}>
          {RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {!report ? (
        <p className="text-neutral-400 text-sm">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-4 md:col-span-2">
            <h2 className="font-semibold text-neutral-900 mb-3 text-sm">Sales Trend</h2>
            {report.salesTrend.length === 0 ? <p className="text-sm text-neutral-400">No paid orders in this range.</p> : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={report.salesTrend}>
                  <XAxis dataKey="_id" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" stroke="#f97316" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card p-4">
            <h2 className="font-semibold text-neutral-900 mb-3 text-sm">Order Status Distribution</h2>
            {report.statusDistribution.length === 0 ? <p className="text-sm text-neutral-400">No orders in this range.</p> : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={report.statusDistribution} dataKey="count" nameKey="_id" outerRadius={80} label>
                    {report.statusDistribution.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card p-4">
            <h2 className="font-semibold text-neutral-900 mb-3 text-sm">Category Breakdown</h2>
            {report.categoryBreakdown.length === 0 ? <p className="text-sm text-neutral-400">No paid orders in this range.</p> : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={report.categoryBreakdown.filter((c) => c._id)} dataKey="total" nameKey="_id" outerRadius={80} label>
                    {report.categoryBreakdown.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
