import React, { useEffect, useState } from 'react';
import { Plus, X, AlertTriangle } from 'lucide-react';
import api from '../../api/axios';

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [adjusting, setAdjusting] = useState(null);
  const [adjustValue, setAdjustValue] = useState('');
  const [adjustReason, setAdjustReason] = useState('RESTOCK');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', unit: 'kg', quantity: '', lowStockThreshold: 10, supplier: '' });

  const load = () => api.get('/inventory').then(({ data }) => setItems(data.items));
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    await api.post('/inventory', { ...form, quantity: Number(form.quantity), lowStockThreshold: Number(form.lowStockThreshold) });
    setCreating(false);
    setForm({ name: '', unit: 'kg', quantity: '', lowStockThreshold: 10, supplier: '' });
    load();
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    await api.patch(`/inventory/${adjusting._id}/adjust`, { change: Number(adjustValue), reason: adjustReason });
    setAdjusting(null);
    setAdjustValue('');
    load();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Inventory</h1>
        <button onClick={() => setCreating(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Item
        </button>
      </div>

      <div className="card divide-y divide-neutral-100">
        {items.map((item) => (
          <div key={item._id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-neutral-900 flex items-center gap-2">
                {item.name}
                {item.quantity <= item.lowStockThreshold && (
                  <span className="text-amber-600 flex items-center gap-1 text-xs"><AlertTriangle size={12} /> Low stock</span>
                )}
              </p>
              <p className="text-xs text-neutral-500">{item.quantity} {item.unit} · threshold {item.lowStockThreshold}</p>
            </div>
            <button onClick={() => setAdjusting(item)} className="btn-secondary text-xs">Adjust</button>
          </div>
        ))}
        {items.length === 0 && <p className="p-4 text-sm text-neutral-400">No inventory items yet.</p>}
      </div>

      {creating && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreate} className="bg-white rounded-xl p-6 w-full max-w-sm space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold">New Inventory Item</h2>
              <button type="button" onClick={() => setCreating(false)}><X size={18} /></button>
            </div>
            <input required className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <input className="input" placeholder="Unit (kg, l...)" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
              <input required type="number" className="input" placeholder="Starting qty" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            </div>
            <input type="number" className="input" placeholder="Low stock threshold" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} />
            <input className="input" placeholder="Supplier (optional)" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
            <button type="submit" className="btn-primary w-full">Save</button>
          </form>
        </div>
      )}

      {adjusting && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAdjust} className="bg-white rounded-xl p-6 w-full max-w-sm space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold">Adjust: {adjusting.name}</h2>
              <button type="button" onClick={() => setAdjusting(null)}><X size={18} /></button>
            </div>
            <input required type="number" className="input" placeholder="Change (+add / -deduct)" value={adjustValue} onChange={(e) => setAdjustValue(e.target.value)} />
            <select className="input" value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)}>
              <option value="RESTOCK">Restock</option>
              <option value="WASTAGE">Wastage</option>
              <option value="ADJUSTMENT">Manual adjustment</option>
            </select>
            <button type="submit" className="btn-primary w-full">Apply</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Inventory;
