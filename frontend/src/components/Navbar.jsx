import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, LogOut, UtensilsCrossed, Download, Sparkles, User } from 'lucide-react';
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
  const location = useLocation();

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const guestLinks = [{ to: '/guest/menu', label: 'Menu' }];
  const links = user ? NAV_BY_ROLE[user.role] || [] : guestLinks;
  const cartPath = user ? '/student/cart' : '/guest/cart';
  const showCart = !user || user.role === 'student' || user.role === 'lecturer';

  return (
    <>
      <header className="sticky top-0 z-40 glass-nav border-b border-neutral-200/80 transition-all">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            to={user ? '/' : '/guest/menu'}
            className="flex items-center gap-2 font-extrabold text-lg text-neutral-900 tracking-tight group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-500 flex items-center justify-center text-white shadow-sm shadow-brand-500/30 group-hover:scale-105 transition-transform">
              <UtensilsCrossed size={19} />
            </div>
            <span className="flex items-center gap-1">
              Campus<span className="text-brand-600">Bite</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-neutral-600">
            {links.map((l) => {
              const active = location.pathname === l.to;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    active
                      ? 'bg-neutral-100 text-neutral-900 font-semibold'
                      : 'hover:text-brand-600 hover:bg-neutral-50'
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* PWA Install Button */}
            {deferredPrompt && !isInstalled && (
              <button
                onClick={handleInstallClick}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 border border-brand-200 hover:bg-brand-100 transition-colors shadow-2xs"
                title="Install app to your home screen"
              >
                <Download size={13} />
                Install App
              </button>
            )}

            {showCart && (
              <Link
                to={cartPath}
                className="relative p-2.5 hover:bg-neutral-100 rounded-xl transition-colors border border-transparent hover:border-neutral-200"
                title="View Cart"
              >
                <ShoppingCart size={20} className="text-neutral-700" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand-600 text-white text-[11px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-xs animate-scale-in">
                    {itemCount}
                  </span>
                )}
              </Link>
            )}

            {user ? (
              <div className="flex items-center gap-2 pl-1 border-l border-neutral-200">
                <div className="hidden sm:flex items-center gap-2 pl-2">
                  <div className="w-7 h-7 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-600 flex items-center justify-center text-xs font-bold">
                    {user.name?.charAt(0) || <User size={13} />}
                  </div>
                  <span className="text-xs font-medium text-neutral-700 truncate max-w-[120px]">
                    {user.name}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 hover:bg-rose-50 text-neutral-500 hover:text-rose-600 rounded-xl transition-colors"
                  title="Log out"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/login')}
                  className="btn-primary text-xs sm:text-sm py-2 px-4 shadow-sm"
                >
                  Login
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile App Bar bottom navigation for quick access */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200 py-1.5 px-3 flex items-center justify-around text-[10px] font-medium text-neutral-500 shadow-lg">
        {links.slice(0, 4).map((l) => {
          const active = location.pathname === l.to;
          return (
            <Link
              key={l.to}
              to={l.to}
              className={`flex flex-col items-center py-1 px-3 rounded-lg transition-colors ${
                active ? 'text-brand-600 font-bold' : 'hover:text-neutral-900'
              }`}
            >
              <span>{l.label}</span>
            </Link>
          );
        })}
        {showCart && (
          <Link
            to={cartPath}
            className={`flex flex-col items-center py-1 px-3 rounded-lg relative ${
              location.pathname === cartPath ? 'text-brand-600 font-bold' : ''
            }`}
          >
            <span>Cart ({itemCount})</span>
          </Link>
        )}
      </div>
    </>
  );
};

export default Navbar;

