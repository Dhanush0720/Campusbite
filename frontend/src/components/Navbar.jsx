import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingCart,
  LogOut,
  UtensilsCrossed,
  Download,
  User,
  Home,
  Clock,
  Wallet,
  Menu as MenuIcon,
  X,
  QrCode,
  LayoutDashboard,
  BarChart3,
  Package,
  Users,
  ChevronRight,
  ShieldAlert,
  Banknote,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const NAV_BY_ROLE = {
  student: [
    { to: '/student', label: 'Home', icon: Home },
    { to: '/student/menu', label: 'Menu', icon: UtensilsCrossed },
    { to: '/student/orders', label: 'Orders', icon: Clock },
    { to: '/student/wallet', label: 'Wallet', icon: Wallet },
    { to: '/student/spending', label: 'Spending', icon: BarChart3 },
    { to: '/student/profile', label: 'Profile', icon: User },
  ],
  lecturer: [
    { to: '/student', label: 'Home', icon: Home },
    { to: '/student/menu', label: 'Menu', icon: UtensilsCrossed },
    { to: '/student/orders', label: 'Orders', icon: Clock },
    { to: '/student/wallet', label: 'Wallet', icon: Wallet },
    { to: '/student/spending', label: 'Spending', icon: BarChart3 },
    { to: '/student/profile', label: 'Profile', icon: User },
  ],
  staff: [
    { to: '/staff', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/staff/scanner', label: 'QR Scanner', icon: QrCode },
    { to: '/staff/wallet-approvals', label: 'Approvals', icon: Banknote },
    { to: '/staff/history', label: 'History', icon: Clock },
  ],
  manager: [
    { to: '/manager', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/manager/wallet-approvals', label: 'Approvals', icon: Banknote },
    { to: '/manager/menu', label: 'Menu', icon: UtensilsCrossed },
    { to: '/manager/orders', label: 'Orders', icon: Clock },
    { to: '/manager/inventory', label: 'Inventory', icon: Package },
    { to: '/manager/reports', label: 'Reports', icon: BarChart3 },
    { to: '/manager/staff', label: 'Staff', icon: Users },
  ],
  admin: [
    { to: '/manager', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/manager/wallet-approvals', label: 'Approvals', icon: Banknote },
    { to: '/manager/menu', label: 'Menu', icon: UtensilsCrossed },
    { to: '/manager/orders', label: 'Orders', icon: Clock },
    { to: '/manager/inventory', label: 'Inventory', icon: Package },
    { to: '/manager/reports', label: 'Reports', icon: BarChart3 },
    { to: '/manager/staff', label: 'Users', icon: Users },
  ],
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  // Close mobile drawer whenever location changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // PWA install listener
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
    if (outcome === 'accepted') setIsInstalled(true);
    setDeferredPrompt(null);
  };

  const guestLinks = [
    { to: '/guest/menu', label: 'Menu', icon: UtensilsCrossed },
    { to: '/guest/cart', label: 'Cart', icon: ShoppingCart },
  ];

  const links = user ? NAV_BY_ROLE[user.role] || [] : guestLinks;
  const cartPath = user ? '/student/cart' : '/guest/cart';
  const showCart = !user || user.role === 'student' || user.role === 'lecturer';

  // Bottom Nav items tailored for mobile reachability
  const getBottomNavItems = () => {
    if (!user) {
      return [
        { to: '/guest/menu', label: 'Menu', icon: UtensilsCrossed },
        { to: '/guest/cart', label: 'Cart', icon: ShoppingCart, badge: itemCount },
        { to: '/login', label: 'Login', icon: User },
      ];
    }
    if (user.role === 'student' || user.role === 'lecturer') {
      return [
        { to: '/student', label: 'Home', icon: Home },
        { to: '/student/menu', label: 'Menu', icon: UtensilsCrossed },
        { to: '/student/orders', label: 'Orders', icon: Clock },
        { to: '/student/wallet', label: 'Wallet', icon: Wallet },
        { to: cartPath, label: 'Cart', icon: ShoppingCart, badge: itemCount },
      ];
    }
    if (user.role === 'staff') {
      return [
        { to: '/staff', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/staff/scanner', label: 'Scanner', icon: QrCode },
        { to: '/staff/wallet-approvals', label: 'Approvals', icon: Banknote },
        { to: '/staff/history', label: 'History', icon: Clock },
      ];
    }
    // manager / admin
    return [
      { to: '/manager', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/manager/orders', label: 'Orders', icon: Clock },
      { to: '/manager/menu', label: 'Menu', icon: UtensilsCrossed },
      { to: '/manager/inventory', label: 'Stock', icon: Package },
    ];
  };

  const bottomItems = getBottomNavItems();

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 glass-nav border-b border-neutral-200/80 transition-all">
        <div className="max-w-6xl mx-auto px-4 h-15 md:h-16 flex items-center justify-between">
          {/* Logo */}
          <Link
            to={user ? (NAV_BY_ROLE[user.role]?.[0]?.to || '/') : '/guest/menu'}
            className="flex items-center gap-2 font-extrabold text-base sm:text-lg text-neutral-900 tracking-tight group"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-500 flex items-center justify-center text-white shadow-sm shadow-brand-500/30 group-hover:scale-105 transition-transform">
              <UtensilsCrossed size={17} />
            </div>
            <span className="flex items-center gap-0.5 sm:gap-1">
              Campus<span className="text-brand-600">Bite</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
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

          {/* Right Action Icons */}
          <div className="flex items-center gap-1.5 sm:gap-3">
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

            {/* Desktop Cart */}
            {showCart && (
              <Link
                to={cartPath}
                className="hidden md:flex relative p-2.5 hover:bg-neutral-100 rounded-xl transition-colors border border-transparent hover:border-neutral-200"
                title="View Cart"
              >
                <ShoppingCart size={19} className="text-neutral-700" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand-600 text-white text-[11px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-xs">
                    {itemCount}
                  </span>
                )}
              </Link>
            )}

            {/* User profile / Logout */}
            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2 sm:pl-2 sm:border-l sm:border-neutral-200">
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center text-xs font-bold">
                    {user.name?.charAt(0) || <User size={13} />}
                  </div>
                  <span className="text-xs font-semibold text-neutral-700 truncate max-w-[110px]">
                    {user.name}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="hidden md:flex p-2 hover:bg-rose-50 text-neutral-500 hover:text-rose-600 rounded-xl transition-colors"
                  title="Log out"
                >
                  <LogOut size={17} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="hidden md:inline-flex btn-primary text-xs py-2 px-3.5 shadow-sm"
              >
                Login
              </button>
            )}

            {/* Mobile Hamburger Drawer Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-neutral-700 hover:bg-neutral-100 transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <MenuIcon size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Over Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Menu */}
          <div className="relative ml-auto w-4/5 max-w-xs h-full bg-white shadow-2xl flex flex-col justify-between p-6 z-10 animate-in slide-in-from-right duration-200">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold">
                    {user?.name?.charAt(0) || <UtensilsCrossed size={16} />}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-neutral-900 leading-tight">
                      {user ? user.name : 'Welcome, Guest!'}
                    </p>
                    <p className="text-[11px] text-neutral-400 capitalize">
                      {user ? `${user.role} Account` : 'Campus Food Ordering'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-400"
                >
                  <X size={20} />
                </button>
              </div>

              {/* PWA Install Button inside mobile drawer */}
              {deferredPrompt && !isInstalled && (
                <button
                  onClick={handleInstallClick}
                  className="w-full mb-4 py-2.5 px-3 rounded-xl bg-gradient-to-r from-brand-50 to-orange-50 border border-brand-200/80 text-brand-700 text-xs font-bold flex items-center justify-between shadow-2xs"
                >
                  <span className="flex items-center gap-2">
                    <Download size={15} /> Add to Home Screen
                  </span>
                  <span className="text-[10px] bg-brand-600 text-white px-2 py-0.5 rounded-full font-bold">
                    Install
                  </span>
                </button>
              )}

              {/* All links for current role */}
              <div className="space-y-1">
                {links.map((l) => {
                  const Icon = l.icon || ChevronRight;
                  const active = location.pathname === l.to;
                  return (
                    <Link
                      key={l.to}
                      to={l.to}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        active
                          ? 'bg-brand-50 text-brand-700 font-bold'
                          : 'text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={17} className={active ? 'text-brand-600' : 'text-neutral-400'} />
                        <span>{l.label}</span>
                      </div>
                      <ChevronRight size={15} className="text-neutral-300" />
                    </Link>
                  );
                })}

                {/* Additional quick links for guests */}
                {!user && (
                  <Link
                    to="/login"
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold text-brand-600 bg-brand-50 mt-2"
                  >
                    <span>Student / Staff Login</span>
                    <ChevronRight size={15} />
                  </Link>
                )}
              </div>
            </div>

            {/* Drawer Bottom (Logout or Login) */}
            <div className="pt-4 border-t border-neutral-100">
              {user ? (
                <button
                  onClick={logout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="btn-primary w-full text-sm py-2.5"
                >
                  Sign In to CampusBite
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile App Bar (Fixed Bottom Navigation Bar) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-neutral-200/80 px-2 py-1 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex-1 flex flex-col items-center py-1 px-1 rounded-xl transition-all relative ${
                active ? 'text-brand-600 font-bold' : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <div className="relative">
                <Icon size={20} className={active ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-brand-600 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-0.5 tracking-tight ${active ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
};

export default Navbar;


