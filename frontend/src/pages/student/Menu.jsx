import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Search, Plus, Minus } from 'lucide-react';
import api from '../../api/axios';
import { useCart } from '../../context/CartContext';
import { DietaryDot } from '../../components/DietaryBadge';


const CATEGORIES = ['All', 'Breakfast', 'Lunch', 'Snacks', 'Beverages', 'Desserts'];

const Menu = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isGuest = location.pathname.startsWith('/guest');
  const base = isGuest ? '/guest' : '/student';

  const { items: cartItems, addItem, updateQuantity } = useCart();
  const [menu, setMenu] = useState([]);
  const [category, setCategory] = useState('All');
  const [dietFilter, setDietFilter] = useState('ALL'); // 'ALL' | 'VEG' | 'NON_VEG'
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const params = {};
      if (category !== 'All') params.category = category;
      if (search) params.search = search;
      if (dietFilter === 'VEG') params.isVeg = true;
      if (dietFilter === 'NON_VEG') params.isVeg = false;
      params.isAvailable = true;
      const { data } = await api.get('/menu', { params });
      setMenu(data.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchMenu, 200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, search, dietFilter]);

  const cartQty = (id) => cartItems.find((i) => i.menuItemId === id)?.quantity || 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-24">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Canteen Menu</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Order ahead, skip the queue, pay seamlessly.</p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" size={17} />
          <input
            className="w-full bg-white border border-neutral-300 rounded-xl pl-10 pr-9 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 placeholder:text-neutral-400 shadow-xs"
            placeholder="Search dosas, chai, biryani…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-600 bg-neutral-100 rounded-full w-5 h-5 flex items-center justify-center transition-colors"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>


      {/* Dietary + Category Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-2 border-b border-neutral-100">
        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shadow-xs ${
                category === c
                  ? 'bg-neutral-900 text-white shadow-md'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Veg / Non-Veg Toggle Buttons */}
        <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl">
          <button
            onClick={() => setDietFilter('ALL')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
              dietFilter === 'ALL' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setDietFilter(dietFilter === 'VEG' ? 'ALL' : 'VEG')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
              dietFilter === 'VEG' ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-xs' : 'text-neutral-600 hover:text-emerald-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" /> Veg
          </button>
          <button
            onClick={() => setDietFilter(dietFilter === 'NON_VEG' ? 'ALL' : 'NON_VEG')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
              dietFilter === 'NON_VEG' ? 'bg-red-50 text-red-800 border border-red-300 shadow-xs' : 'text-neutral-600 hover:text-red-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-700 inline-block" /> Non-Veg
          </button>
        </div>
      </div>

      {/* Food Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-neutral-400 text-sm">Loading delicious items…</div>
      ) : menu.length === 0 ? (
        <div className="py-16 text-center card p-8 max-w-md mx-auto">
          <p className="text-neutral-700 font-semibold mb-1">No items found</p>
          <p className="text-xs text-neutral-400 mb-4">Try clearing your filters or search term.</p>
          <button
            onClick={() => { setCategory('All'); setSearch(''); setDietFilter('ALL'); }}
            className="btn-secondary text-xs"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {menu.map((item) => {
            const qty = cartQty(item._id);
            const isReadyFood = item.preparationType === 'READY_FOOD' || ['Beverages', 'Snacks', 'Desserts'].includes(item.category);
            const isVeg = item.isVeg !== false;

            return (
              <div
                key={item._id}
                className="card p-4 flex flex-col justify-between hover:shadow-md hover:border-neutral-300 transition-all duration-200 group"
              >
                <div>
                  <Link to={`${base}/food/${item._id}`} className="block">
                    {/* Food Photo / Placeholder */}
                    <div className="w-full h-36 bg-gradient-to-tr from-neutral-100 via-neutral-50 to-neutral-200 rounded-xl mb-3 flex items-center justify-center text-neutral-400 text-xs overflow-hidden relative border border-neutral-100">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <span className="text-3xl filter saturate-75 select-none">
                          {item.category === 'Beverages' ? '☕' : item.category === 'Breakfast' ? '🥞' : item.category === 'Lunch' ? '🍛' : item.category === 'Desserts' ? '🍮' : '🥪'}
                        </span>
                      )}

                      {/* Veg / Non-Veg badge on top-left of image */}
                      <div className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-xs p-1 rounded-md shadow-xs border border-neutral-200">
                        <DietaryDot isVeg={isVeg} size="sm" />
                      </div>


                      {/* Preparation pill top-right */}
                      <div className="absolute top-2.5 right-2.5">
                        {isReadyFood ? (
                          <span className="text-[10px] font-bold bg-amber-500/90 text-white backdrop-blur-xs px-2 py-0.5 rounded-full shadow-xs">
                            ⚡ Express Ready
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-blue-600/90 text-white backdrop-blur-xs px-2 py-0.5 rounded-full shadow-xs">
                            🍳 Fresh Cooked
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Name & Price */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-neutral-900 group-hover:text-brand-600 transition-colors">
                          {item.name}
                        </h3>
                        <p className="text-xs text-neutral-500 mt-1 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                      <span className="text-base font-extrabold text-neutral-900 whitespace-nowrap shrink-0">
                        ₹{item.price}
                      </span>
                    </div>
                  </Link>
                </div>

                {/* Bottom Controls */}
                <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-neutral-400">
                    {item.availableQuantity > 0 ? (
                      <span className="text-neutral-500">{item.availableQuantity} available</span>
                    ) : (
                      <span className="text-rose-500 font-semibold">Sold Out</span>
                    )}
                  </span>

                  {qty > 0 ? (
                    <div className="flex items-center gap-1.5 sm:gap-2 bg-neutral-900 text-white px-2 py-1 rounded-xl shadow-sm">
                      <button
                        onClick={() => updateQuantity(item._id, qty - 1)}
                        className="w-7 h-7 sm:w-6 sm:h-6 rounded-lg hover:bg-neutral-700 active:bg-neutral-600 flex items-center justify-center transition-colors"
                        title="Decrease"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="text-xs sm:text-sm font-bold w-5 text-center">{qty}</span>
                      <button
                        onClick={() => addItem(item)}
                        disabled={qty >= item.availableQuantity}
                        className="w-7 h-7 sm:w-6 sm:h-6 rounded-lg hover:bg-neutral-700 active:bg-neutral-600 flex items-center justify-center transition-colors disabled:opacity-40"
                        title="Increase"
                        aria-label="Increase quantity"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addItem(item)}
                      disabled={item.availableQuantity === 0}
                      className="btn-primary text-xs px-4 py-2 rounded-xl shadow-xs font-bold flex items-center gap-1.5 active:scale-95"
                    >
                      <Plus size={14} /> Add
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating View Cart Pill for Mobile / Desktop (Positioned above mobile bottom bar) */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-16 md:bottom-6 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-md">
          <button
            onClick={() => navigate(`${base}/cart`)}
            className="w-full bg-neutral-900 hover:bg-black text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center justify-between border border-neutral-700 transition-all hover:scale-[1.01] active:scale-[0.98]"
          >
            <div className="flex items-center gap-2.5">
              <span className="bg-brand-600 text-white font-bold text-xs rounded-full w-6 h-6 flex items-center justify-center shadow-xs">
                {cartItems.reduce((s, i) => s + i.quantity, 0)}
              </span>
              <span className="text-sm font-semibold">View Order Cart</span>
            </div>
            <span className="text-sm font-bold text-brand-400">
              ₹{cartItems.reduce((s, i) => s + i.price * i.quantity, 0)} →
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Menu;

