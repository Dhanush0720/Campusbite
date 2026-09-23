import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const GuestCheckout = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');

  const handleContinue = (e) => {
    e.preventDefault();
    sessionStorage.setItem('campusbite_guest_name', name);
    navigate('/guest/menu');
  };

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold text-neutral-900 mb-1">Continue as guest</h1>
      <p className="text-neutral-500 text-sm mb-6">
        No account needed. You'll pay by UPI and get a QR code for counter pickup.
      </p>
      <form onSubmit={handleContinue} className="card p-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-neutral-700">Your name</label>
          <input required className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="For the order label" />
        </div>
        <button type="submit" className="btn-primary w-full">Browse Menu →</button>
      </form>
    </div>
  );
};

export default GuestCheckout;
