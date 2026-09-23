import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';

const Cart = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isGuest = location.pathname.startsWith('/guest');
  const base = isGuest ? '/guest' : '/student';

  const { items, updateQuantity, removeItem, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-neutral-900 mb-2">Your cart is empty</h1>
        <p className="text-neutral-500 text-sm mb-6">Add something tasty from the menu first.</p>
        <Link to={`${base}/menu`} className="btn-primary">Browse Menu</Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">Your Cart</h1>

      <div className="card divide-y divide-neutral-100">
        {items.map((i) => (
          <div key={i.menuItemId} className="p-4 flex items-center justify-between gap-3">
            <div className="flex-1">
              <p className="font-medium text-neutral-900">{i.name}</p>
              <p className="text-sm text-neutral-500">₹{i.price} each</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => updateQuantity(i.menuItemId, i.quantity - 1)} className="w-7 h-7 rounded-full border border-neutral-300 flex items-center justify-center">
                <Minus size={14} />
              </button>
              <span className="text-sm font-medium w-4 text-center">{i.quantity}</span>
              <button
                onClick={() => updateQuantity(i.menuItemId, i.quantity + 1)}
                disabled={i.quantity >= i.availableQuantity}
                className="w-7 h-7 rounded-full border border-neutral-300 flex items-center justify-center disabled:opacity-40"
              >
                <Plus size={14} />
              </button>
            </div>
            <span className="w-16 text-right font-medium">₹{i.price * i.quantity}</span>
            <button onClick={() => removeItem(i.menuItemId)} className="text-neutral-400 hover:text-red-500">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="card p-4 mt-4 flex items-center justify-between">
        <span className="text-neutral-600">Subtotal</span>
        <span className="text-xl font-bold text-neutral-900">₹{subtotal}</span>
      </div>

      <button onClick={() => navigate(`${base}/checkout`)} className="btn-primary w-full mt-4">
        Proceed to Checkout
      </button>
    </div>
  );
};

export default Cart;
