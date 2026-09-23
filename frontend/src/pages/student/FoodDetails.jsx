import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Clock, ArrowLeft, Plus, Minus, ShoppingBag, ShieldCheck, Zap } from 'lucide-react';
import api from '../../api/axios';
import { useCart } from '../../context/CartContext';
import { DietaryBadge, DietaryDot } from '../../components/DietaryBadge';

const FoodDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isGuest = location.pathname.startsWith('/guest');
  const base = isGuest ? '/guest' : '/student';

  const { addItem } = useCart();
  const [item, setItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    api.get(`/menu/${id}`).then(({ data }) => setItem(data.item));
  }, [id]);

  if (!item) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 flex items-center justify-center">
        <div className="flex items-center gap-3 text-neutral-500 font-medium">
          <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          Loading dish details...
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem(item);
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const isInstant = item.preparationType === 'READY_FOOD';

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="group inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-brand-600 mb-6 transition-colors"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back to menu
      </button>

      <div className="card overflow-hidden border border-neutral-200/80 shadow-lg shadow-neutral-100 rounded-2xl bg-white mb-6">
        <div className="relative w-full h-60 sm:h-80 bg-neutral-100 overflow-hidden">
          {item.image ? (
            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200 text-neutral-400">
              <ShoppingBag size={48} className="opacity-40 mb-2" />
              <span className="text-sm font-medium">No photo available</span>
            </div>
          )}

          <div className="absolute top-3 sm:top-4 left-3 sm:left-4 flex items-center gap-2">
            <DietaryBadge isVeg={item.isVeg} size="md" />
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 backdrop-blur-md text-neutral-700 shadow-sm border border-white/40">
              {item.category}
            </span>
          </div>

          <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
            {isInstant ? (
              <span className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold bg-amber-500 text-white shadow-md">
                <Zap size={13} /> Instant Pickup
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold bg-blue-600 text-white shadow-md">
                <Clock size={13} /> Freshly Cooked
              </span>
            )}
          </div>
        </div>

        <div className="p-5 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 pb-5 sm:pb-6 border-b border-neutral-100">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <DietaryDot isVeg={item.isVeg} size="lg" />
                <h1 className="text-xl sm:text-3xl font-bold text-neutral-900 tracking-tight">{item.name}</h1>
              </div>
              <p className="text-neutral-500 text-xs sm:text-sm mt-1">
                {isInstant ? 'Grab-and-go counter item • No kitchen waiting' : `Kitchen item • ~${item.preparationTime} mins preparation`}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">₹{item.price}</span>
              <p className="text-[11px] text-neutral-400 font-medium">Inclusive of all taxes</p>
            </div>
          </div>

          <div className="py-5 sm:py-6 border-b border-neutral-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">Description</h2>
            <p className="text-neutral-700 leading-relaxed text-sm sm:text-base">
              {item.description || 'Delicious, hygienically prepared food made with fresh ingredients at CampusBite.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 py-5 sm:py-6 border-b border-neutral-100 text-sm">
            <div className="flex items-center gap-2.5 sm:gap-3 p-3 bg-neutral-50 rounded-xl">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white border border-neutral-200/80 flex items-center justify-center text-brand-600 shadow-xs shrink-0">
                <Clock size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs text-neutral-400 font-medium">Prep Time</p>
                <p className="font-semibold text-neutral-800 text-xs sm:text-sm truncate">{item.preparationTime} mins</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 sm:gap-3 p-3 bg-neutral-50 rounded-xl">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white border border-neutral-200/80 flex items-center justify-center text-emerald-600 shadow-xs shrink-0">
                <ShieldCheck size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs text-neutral-400 font-medium">Availability</p>
                <p className="font-semibold text-neutral-800 text-xs sm:text-sm truncate">
                  {item.availableQuantity > 0 ? `${item.availableQuantity} left` : 'Out of stock'}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-5 sm:pt-6 flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            <div className="flex items-center justify-between border border-neutral-200 rounded-xl px-4 py-2 w-full sm:w-auto bg-neutral-50">
              <span className="text-xs font-semibold text-neutral-500 mr-4">Quantity:</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-lg bg-white border border-neutral-200 hover:bg-neutral-100 flex items-center justify-center font-bold text-neutral-700 active:scale-95 transition-all"
                  aria-label="Decrease quantity"
                >
                  <Minus size={14} />
                </button>
                <span className="w-6 text-center font-bold text-neutral-900 text-sm sm:text-base">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(item.availableQuantity || 99, quantity + 1))}
                  disabled={quantity >= (item.availableQuantity || 99)}
                  className="w-8 h-8 rounded-lg bg-white border border-neutral-200 hover:bg-neutral-100 flex items-center justify-center font-bold text-neutral-700 disabled:opacity-40 active:scale-95 transition-all"
                  aria-label="Increase quantity"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={item.availableQuantity === 0}
              className={`flex-1 w-full py-3.5 px-6 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all ${
                item.availableQuantity === 0
                  ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                  : added
                  ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                  : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/25 active:scale-[0.99]'
              }`}
            >
              <ShoppingBag size={18} />
              {item.availableQuantity === 0 ? 'Out of Stock' : added ? '✓ Added to Cart!' : `Add to Cart • ₹${item.price * quantity}`}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default FoodDetails;

