import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roleHome = { student: '/student', lecturer: '/student', staff: '/staff', manager: '/manager', admin: '/manager' };

const Login = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const user = await login(form.email, form.password);
      navigate(roleHome[user.role] || '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold text-neutral-900 mb-1">Welcome back</h1>
      <p className="text-neutral-500 text-sm mb-6">Log in with your college email and password.</p>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}
        <div>
          <label className="text-sm font-medium text-neutral-700">Email</label>
          <input
            type="email" required className="input mt-1"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@college.edu"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-neutral-700">Password</label>
          <input
            type="password" required className="input mt-1"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Logging in…' : 'Log In'}
        </button>
      </form>

      <p className="text-sm text-neutral-500 mt-4 text-center">
        No account? <Link to="/register" className="text-brand-700 font-medium">Register</Link>
        {' · '}
        <Link to="/guest" className="text-brand-700 font-medium">Continue as guest</Link>
      </p>

      <div className="mt-6 text-xs text-neutral-400 text-center">
        Demo accounts (after running the seed script): admin@campusbite.edu / Admin@123 ·
        manager@campusbite.edu / Manager@123 · staff@campusbite.edu / Staff@123 · student@campusbite.edu / Student@123
      </div>
    </div>
  );
};

export default Login;
