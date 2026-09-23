import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UtensilsCrossed, QrCode, Wallet, Clock } from 'lucide-react';

const roleHome = { student: '/student', lecturer: '/student', staff: '/staff', manager: '/manager', admin: '/manager' };

const Landing = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 px-3 py-1 rounded-full text-sm font-medium mb-6">
          <UtensilsCrossed size={16} /> Smart College Canteen System
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 tracking-tight">
          Order Smart. Pay Easy. Pick Up Fast.
        </h1>
        <p className="mt-4 text-neutral-600 text-lg">
          Browse the canteen menu, pay with UPI or your campus wallet, and skip the line with a QR code pickup.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {user ? (
            <Link to={roleHome[user.role] || '/'} className="btn-primary text-base px-6 py-3">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn-primary text-base px-6 py-3">Log In</Link>
              <Link to="/register" className="btn-secondary text-base px-6 py-3">Create Account</Link>
              <Link to="/guest" className="text-brand-700 font-medium px-4 py-3 hover:underline">
                Continue as Guest →
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <Wallet className="text-brand-600 mb-3" size={28} />
          <h3 className="font-semibold text-neutral-900">UPI & Wallet Payments</h3>
          <p className="text-sm text-neutral-500 mt-1">Pay instantly with UPI or your campus wallet balance — no cash needed at the counter.</p>
        </div>
        <div className="card p-6">
          <QrCode className="text-brand-600 mb-3" size={28} />
          <h3 className="font-semibold text-neutral-900">QR Pickup</h3>
          <p className="text-sm text-neutral-500 mt-1">Get a secure QR code after payment and show it at the counter for instant handover.</p>
        </div>
        <div className="card p-6">
          <Clock className="text-brand-600 mb-3" size={28} />
          <h3 className="font-semibold text-neutral-900">Live Order Tracking</h3>
          <p className="text-sm text-neutral-500 mt-1">Watch your order move from Confirmed to Preparing to Ready, in real time.</p>
        </div>
      </div>
    </div>
  );
};

export default Landing;
