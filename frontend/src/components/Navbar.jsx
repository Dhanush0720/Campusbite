import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Bell, LogOut, UtensilsCrossed } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const NAV_BY_ROLE = {
  student: [
    { to: '/student', label: 'Home' },
    { to: '/student/menu', label: 'Menu' },
    { to: '/student/orders', label: 'Orders' },
    { to: '/student/wallet', label: 'Wallet' },
    { to: '/student/spending', label: 'Spending' },
    { to: '/student/profile', label: 'Profile' },
  ],
  lecturer: [
    { to: '/student', label: 'Home' },
    { to: '/student/menu', label: 'Menu' },
    { to: '/student/orders', label: 'Orders' },
    { to: '/student/wallet', label: 'Wallet' },
    { to: '/student/spending', label: 'Spending' },
    { to: '/student/profile', label: 'Profile' },
  ],
  staff: [
    { to: '/staff', label: 'Dashboard' },
    { to: '/staff/scanner', label: 'QR Scanner' },
    { to: '/staff/history', label: 'History' },
  ],
  manager: [
    { to: '/manager', label: 'Dashboard' },
    { to: '/manager/menu', label: 'Menu' },
    { to: '/manager/orders', label: 'Orders' },
    { to: '/manager/inventory', label: 'Inventory' },
    { to: '/manager/reports', label: 'Reports' },
    { to: '/manager/staff', label: 'Staff' },
  ],
  admin: [
    { to: '/manager', label: 'Dashboard' },
    { to: '/manager/menu', label: 'Menu' },
    { to: '/manager/orders', label: 'Orders' },
    { to: '/manager/inventory', label: 'Inventory' },
    { to: '/manager/reports', label: 'Reports' },
    { to: '/manager/staff', label: 'Users' },
  ],
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const guestLinks = [{ to: '/guest/menu', label: 'Menu' }];
  const links = user ? NAV_BY_ROLE[user.role] || [] : guestLinks;
  const cartPath = user ? '/student/cart' : '/guest/cart';
  const showCart = !user || user.role === 'student' || user.role === 'lecturer';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-neutral-200">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to={user ? '/' : '/guest/menu'} className="flex items-center gap-2 font-bold text-lg text-neutral-900">
          <UtensilsCrossed className="text-brand-600" size={22} />
          CampusBite
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-600">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="hover:text-brand-600 transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {showCart && (
            <Link to={cartPath} className="relative p-2 hover:bg-neutral-100 rounded-lg" title="View Cart">
              <ShoppingCart size={20} className="text-neutral-700" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
          )}
          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-sm text-neutral-600">{user.name}</span>
              <button onClick={logout} className="p-2 hover:bg-neutral-100 rounded-lg" title="Log out">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button onClick={() => navigate('/login')} className="btn-primary text-sm">
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
