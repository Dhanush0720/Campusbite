import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Plus, Minus, Trash2, ArrowRight, ShoppingBag, ShieldCheck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { DietaryDot } from '../../components/DietaryBadge';

const Cart = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isGuest = location.pathname.startsWith('/guest');
  const base = isGuest ? '/guest' : '/student';

  const { items, updateQuantity, removeItem, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-600">
          <ShoppingBag size={36} />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Your cart is empty</h1>
        <p className="text-neutral-500 text-sm max-w-sm mx-auto mb-6">
          Looks like you haven't added anything to your tray yet. Check out today's delicious menu!
        </p>
        <Link to={`${base}/menu`} className="btn-primary inline-flex items-center gap-2">
          Explore Menu <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  const hasMadeToOrder = items.some(i => i.preparationType === 'MADE_TO_ORDER');
  const hasReadyFood = items.some(i => i.preparationType === 'READY_FOOD');

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Your Cart</h1>
          <p className="text-xs text-neutral-500 mt-0.5">{items.length} unique item{items.length > 1 ? 's' : ''}</p>
        </div>
        <Link to={`${base}/menu`} className="text-xs font-semibold text-brand-600 hover:text-brand-700">
          + Add more items
        </Link>
      </div>

      {(hasMadeToOrder && hasReadyFood) && (
        <div className="p-3 mb-4 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-800 flex items-start gap-2">
          <span className="font-bold">Note:</span>
          <span>Your cart contains both instant grab items and freshly cooked items. You can pick them up when your order PIN is called!</span>
        </div>
      )}

      <div className="card divide-y divide-neutral-100 shadow-sm border border-neutral-200 rounded-2xl overflow-hidden mb-5">
        {items.map((i) => (
          <div key={i.menuItemId} className="p-3.5 sm:p-5 flex items-center justify-between gap-2.5 sm:gap-3 hover:bg-neutral-50/50 transition-colors">
            <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
              <div className="mt-1 shrink-0">
                <DietaryDot isVeg={i.isVeg} size="sm" />
              </div>
              <div className="min-w-0 pr-1">
                <p className="font-semibold text-neutral-900 truncate text-xs sm:text-sm">{i.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[11px] text-neutral-500">₹{i.price}</span>
                  <span className="text-[9px] px-1.5 py-0.2 bg-neutral-100 text-neutral-600 rounded font-medium">
                    {i.preparationType === 'READY_FOOD' ? 'Instant' : 'Kitchen'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => updateQuantity(i.menuItemId, i.quantity - 1)}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-neutral-200 hover:border-neutral-300 bg-white flex items-center justify-center text-neutral-600 active:scale-90 transition-all"
                aria-label="Decrease quantity"
              >
                <Minus size={13} />
              </button>
              <span className="text-xs sm:text-sm font-bold w-4 text-center text-neutral-800">{i.quantity}</span>
              <button
                type="button"
                onClick={() => updateQuantity(i.menuItemId, i.quantity + 1)}
                disabled={i.quantity >= (i.availableQuantity || 99)}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-neutral-200 hover:border-neutral-300 bg-white flex items-center justify-center text-neutral-600 active:scale-90 disabled:opacity-40 transition-all"
                aria-label="Increase quantity"
              >
                <Plus size={13} />
              </button>
            </div>

            <div className="text-right shrink-0 min-w-[50px]">
              <span className="font-bold text-neutral-900 text-xs sm:text-sm">₹{i.price * i.quantity}</span>
            </div>


            <button
              type="button"
              onClick={() => removeItem(i.menuItemId)}
              className="text-neutral-300 hover:text-rose-500 p-1 rounded transition-colors"
              title="Remove item"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="card p-5 border border-neutral-200 rounded-2xl shadow-sm space-y-3 mb-6">
        <div className="flex items-center justify-between text-sm text-neutral-600">
          <span>Items Subtotal</span>
          <span className="font-medium text-neutral-800">₹{subtotal}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-neutral-600">
          <span>Campus Packaging & Taxes</span>
          <span className="text-emerald-600 font-medium">FREE</span>
        </div>
        <div className="border-t border-neutral-100 pt-3 flex items-center justify-between">
          <div>
            <span className="font-bold text-neutral-900 text-base">To Pay</span>
            <p className="text-[11px] text-neutral-400">Total payable amount</p>
          </div>
          <span className="text-2xl font-extrabold text-brand-700">₹{subtotal}</span>
        </div>
      </div>

      <button
        onClick={() => navigate(`${base}/checkout`)}
        className="btn-primary w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25 active:scale-[0.99]"
      >
        <span>Proceed to Checkout</span>
        <ArrowRight size={18} />
      </button>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-neutral-400">
        <ShieldCheck size={14} className="text-emerald-500" />
        <span>Secure checkout • Instant order verification</span>
      </div>
    </div>
  );
};

export default Cart;

