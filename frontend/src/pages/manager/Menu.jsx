import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import api from '../../api/axios';

const EMPTY_FORM = { name: '', description: '', category: 'Lunch', price: '', availableQuantity: '', preparationTime: 10, image: '' };
const CATEGORIES = ['Breakfast', 'Lunch', 'Snacks', 'Beverages', 'Desserts'];

const ManagerMenu = () => {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null); // null = closed, {} = new, {...item} = edit
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  const load = () => api.get('/menu').then(({ data }) => setItems(data.items));
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(EMPTY_FORM); setEditing({}); };
  const openEdit = (item) => { setForm(item); setEditing(item); };
  const close = () => { setEditing(null); setError(''); };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        availableQuantity: Number(form.availableQuantity),
        preparationTime: Number(form.preparationTime),
      };
      if (editing._id) {
        await api.put(`/menu/${editing._id}`, payload);
      } else {
        await api.post('/menu', payload);
      }
      close();
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    }
  };

  const handleDeactivate = async (item) => {
    if (!confirm(`Deactivate ${item.name}?`)) return;
    await api.delete(`/menu/${item._id}`);
    load();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Menu Management</h1>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Item
        </button>
      </div>

      <div className="card divide-y divide-neutral-100">
        {items.map((item) => (
          <div key={item._id} className="p-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-medium text-neutral-900">{item.name} <span className="text-xs text-neutral-400">· {item.category}</span></p>
              <p className="text-xs text-neutral-500">₹{item.price} · {item.availableQuantity} in stock · {item.isAvailable ? 'Available' : 'Unavailable'}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => openEdit(item)} className="btn-secondary text-xs px-2 py-1"><Pencil size={14} /></button>
              <button onClick={() => handleDeactivate(item)} className="btn-secondary text-xs px-2 py-1 text-red-600"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSave} className="bg-white rounded-xl p-6 w-full max-w-md space-y-3">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold text-neutral-900">{editing._id ? 'Edit Item' : 'New Item'}</h2>
              <button type="button" onClick={close}><X size={18} /></button>
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <input required className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <textarea className="input" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input required type="number" min="0" className="input" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              <input required type="number" min="0" className="input" placeholder="Stock qty" value={form.availableQuantity} onChange={(e) => setForm({ ...form, availableQuantity: e.target.value })} />
              <input type="number" min="0" className="input" placeholder="Prep time (min)" value={form.preparationTime} onChange={(e) => setForm({ ...form, preparationTime: e.target.value })} />
            </div>
            <input className="input" placeholder="Image URL (optional)" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
            <button type="submit" className="btn-primary w-full">Save</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ManagerMenu;
