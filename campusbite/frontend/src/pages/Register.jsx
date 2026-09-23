import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', studentId: '', phone: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(form);
      navigate(form.role === 'lecturer' ? '/student' : '/student');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold text-neutral-900 mb-1">Create your account</h1>
      <p className="text-neutral-500 text-sm mb-6">Students and lecturers can self-register. Staff and manager accounts are created by the college admin.</p>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}
        <div>
          <label className="text-sm font-medium text-neutral-700">Full name</label>
          <input required className="input mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium text-neutral-700">College email</label>
          <input type="email" required className="input mt-1" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium text-neutral-700">Password</label>
          <input type="password" required minLength={6} className="input mt-1" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium text-neutral-700">I am a</label>
          <select className="input mt-1" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="student">Student</option>
            <option value="lecturer">Lecturer</option>
          </select>
        </div>
        {form.role === 'student' && (
          <div>
            <label className="text-sm font-medium text-neutral-700">Student ID</label>
            <input className="input mt-1" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} />
          </div>
        )}
        <div>
          <label className="text-sm font-medium text-neutral-700">Phone (optional)</label>
          <input className="input mt-1" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Creating account…' : 'Register'}
        </button>
      </form>

      <p className="text-sm text-neutral-500 mt-4 text-center">
        Already have an account? <Link to="/login" className="text-brand-700 font-medium">Log in</Link>
      </p>
    </div>
  );
};

export default Register;
