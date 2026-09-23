import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UtensilsCrossed, Wallet, BarChart3, History } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    api.get('/wallet/balance').then(({ data }) => setBalance(data.balance));
    api.get('/orders/my-orders').then(({ data }) => setRecentOrders(data.orders.slice(0, 3)));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-neutral-900 mb-1">Hi {user?.name?.split(' ')[0]} 👋</h1>
      <p className="text-neutral-500 mb-8">What would you like to eat today?</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link to="/student/menu" className="card p-4 hover:border-brand-300">
          <UtensilsCrossed className="text-brand-600 mb-2" size={22} />
          <p className="font-medium text-sm text-neutral-900">Browse Menu</p>
        </Link>
        <Link to="/student/wallet" className="card p-4 hover:border-brand-300">
          <Wallet className="text-brand-600 mb-2" size={22} />
          <p className="font-medium text-sm text-neutral-900">Wallet</p>
          <p className="text-xs text-neutral-400">{balance !== null ? `₹${balance}` : '…'}</p>
        </Link>
        <Link to="/student/spending" className="card p-4 hover:border-brand-300">
          <BarChart3 className="text-brand-600 mb-2" size={22} />
          <p className="font-medium text-sm text-neutral-900">Spending</p>
        </Link>
        <Link to="/student/orders" className="card p-4 hover:border-brand-300">
          <History className="text-brand-600 mb-2" size={22} />
          <p className="font-medium text-sm text-neutral-900">Order History</p>
        </Link>
      </div>

      <h2 className="font-semibold text-neutral-900 mb-3">Recent Orders</h2>
      {recentOrders.length === 0 ? (
        <p className="text-sm text-neutral-400">No orders yet — go grab something from the menu!</p>
      ) : (
        <div className="card divide-y divide-neutral-100">
          {recentOrders.map((o) => (
            <Link key={o._id} to={`/student/orders/${o._id}/track`} className="p-4 flex items-center justify-between hover:bg-neutral-50">
              <span className="text-sm text-neutral-700">#{o.orderNumber}</span>
              <span className={`status-badge status-${o.orderStatus}`}>{o.orderStatus}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
