import React, { useEffect, useState } from 'react';
import { Plus, X, UserX, UserCheck } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const StaffPage = () => {
  const { user } = useAuth();
  const isAdmin = user.role === 'admin';
  const [users, setUsers] = useState([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff', phone: '' });
  const [error, setError] = useState('');

  const load = () => api.get('/admin/users', { params: isAdmin ? {} : { role: 'staff' } }).then(({ data }) => setUsers(data.users));
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/admin/users', form);
      setCreating(false);
      setForm({ name: '', email: '', password: '', role: 'staff', phone: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create account');
    }
  };

  const toggleActive = async (u) => {
    await api.patch(`/admin/users/${u._id}`, { isActive: !u.isActive });
    load();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">{isAdmin ? 'Manage Users' : 'Manage Staff'}</h1>
        <button onClick={() => setCreating(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add {isAdmin ? 'Manager/Staff' : 'Staff'}
        </button>
      </div>

      <div className="card divide-y divide-neutral-100">
        {users.map((u) => (
          <div key={u._id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-neutral-900">{u.name} <span className="text-xs text-neutral-400 capitalize">· {u.role}</span></p>
              <p className="text-xs text-neutral-500">{u.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-1 rounded-full ${u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-500'}`}>
                {u.isActive ? 'Active' : 'Inactive'}
              </span>
              <button onClick={() => toggleActive(u)} className="btn-secondary text-xs px-2 py-1">
                {u.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
              </button>
            </div>
          </div>
        ))}
        {users.length === 0 && <p className="p-4 text-sm text-neutral-400">No accounts yet.</p>}
      </div>

      {creating && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreate} className="bg-white rounded-xl p-6 w-full max-w-sm space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold">New Account</h2>
              <button type="button" onClick={() => setCreating(false)}><X size={18} /></button>
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <input required className="input" placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input required type="email" className="input" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input required type="password" minLength={6} className="input" placeholder="Temporary password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            {isAdmin && (
              <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="staff">Staff</option>
                <option value="manager">Manager</option>
              </select>
            )}
            <input className="input" placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <button type="submit" className="btn-primary w-full">Create Account</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default StaffPage;
