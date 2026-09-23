import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Search, Plus, Minus } from 'lucide-react';
import api from '../../api/axios';
import { useCart } from '../../context/CartContext';

const CATEGORIES = ['All', 'Breakfast', 'Lunch', 'Snacks', 'Beverages', 'Desserts'];

const Menu = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isGuest = location.pathname.startsWith('/guest');
  const base = isGuest ? '/guest' : '/student';

  const { items: cartItems, addItem, updateQuantity } = useCart();
  const [menu, setMenu] = useState([]);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const params = {};
      if (category !== 'All') params.category = category;
      if (search) params.search = search;
      params.isAvailable = true;
      const { data } = await api.get('/menu', { params });
      setMenu(data.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchMenu, 250); // debounce search
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, search]);

  const cartQty = (id) => cartItems.find((i) => i.menuItemId === id)?.quantity || 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Menu</h1>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
          <input
            className="input pl-9"
            placeholder="Search for food…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border transition-colors ${
              category === c ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-neutral-600 border-neutral-200 hover:border-brand-300'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-neutral-400 text-sm">Loading menu…</div>
      ) : menu.length === 0 ? (
        <div className="text-neutral-400 text-sm">No items found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {menu.map((item) => {
            const qty = cartQty(item._id);
            return (
              <div key={item._id} className="card p-4 flex flex-col">
                <Link to={`${base}/food/${item._id}`} className="block">
                  <div className="w-full h-32 bg-neutral-100 rounded-lg mb-3 flex items-center justify-center text-neutral-300 text-xs overflow-hidden">
                    {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : 'No image'}
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-neutral-900">{item.name}</h3>
                      <div className="mt-1">
                        {(item.preparationType === 'READY_FOOD' || ['Beverages', 'Snacks', 'Desserts'].includes(item.category)) ? (
                          <span className="text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-md inline-block">
                            ⚡ Instant Counter Pickup
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-md inline-block">
                            🍳 Fresh Made · ~{item.preparationTime || 10}m
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-brand-700 font-semibold whitespace-nowrap">₹{item.price}</span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{item.description}</p>
                </Link>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-neutral-400">
                    {item.availableQuantity > 0 ? `${item.availableQuantity} left` : 'Out of stock'}
                  </span>
                  {qty > 0 ? (
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item._id, qty - 1)} className="w-7 h-7 rounded-full border border-neutral-300 flex items-center justify-center">
                        <Minus size={14} />
                      </button>
                      <span className="text-sm font-medium w-4 text-center">{qty}</span>
                      <button
                        onClick={() => addItem(item)}
                        disabled={qty >= item.availableQuantity}
                        className="w-7 h-7 rounded-full border border-neutral-300 flex items-center justify-center disabled:opacity-40"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addItem(item)}
                      disabled={item.availableQuantity === 0}
                      className="btn-primary text-xs px-3 py-1.5"
                    >
                      Add
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {cartItems.length > 0 && (
        <button
          onClick={() => navigate(`${base}/cart`)}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 btn-primary px-6 py-3 shadow-lg"
        >
          View Cart ({cartItems.reduce((s, i) => s + i.quantity, 0)})
        </button>
      )}
    </div>
  );
};

export default Menu;
