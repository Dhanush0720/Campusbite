import React from 'react';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
  const { user, logout } = useAuth();

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">Profile</h1>
      <div className="card p-6 space-y-3">
        <div>
          <p className="text-xs text-neutral-400">Name</p>
          <p className="font-medium text-neutral-900">{user?.name}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-400">Email</p>
          <p className="font-medium text-neutral-900">{user?.email}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-400">Role</p>
          <p className="font-medium text-neutral-900 capitalize">{user?.role}</p>
        </div>
      </div>
      <button onClick={logout} className="btn-secondary w-full mt-4">Log Out</button>
    </div>
  );
};

export default Profile;
