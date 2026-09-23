import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Clock, ArrowLeft } from 'lucide-react';
import api from '../../api/axios';
import { useCart } from '../../context/CartContext';

const FoodDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isGuest = location.pathname.startsWith('/guest');
  const base = isGuest ? '/guest' : '/student';

  const { addItem } = useCart();
  const [item, setItem] = useState(null);

  useEffect(() => {
    api.get(`/menu/${id}`).then(({ data }) => setItem(data.item));
  }, [id]);

  if (!item) return <div className="max-w-2xl mx-auto px-4 py-8 text-neutral-400 text-sm">Loading…</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-neutral-500 mb-4">
        <ArrowLeft size={16} /> Back to menu
      </button>

      <div className="card p-6">
        <div className="w-full h-56 bg-neutral-100 rounded-lg mb-4 flex items-center justify-center text-neutral-300 overflow-hidden">
          {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : 'No image'}
        </div>
        <div className="flex items-start justify-between">
          <div>
            <span className="status-badge bg-neutral-100 text-neutral-600 mb-2">{item.category}</span>
            <h1 className="text-2xl font-bold text-neutral-900">{item.name}</h1>
          </div>
          <span className="text-2xl font-bold text-brand-700">₹{item.price}</span>
        </div>
        <p className="text-neutral-600 mt-3">{item.description}</p>

        <div className="flex items-center gap-4 mt-4 text-sm text-neutral-500">
          <span className="flex items-center gap-1"><Clock size={14} /> {item.preparationTime} min prep</span>
          <span>{item.availableQuantity > 0 ? `${item.availableQuantity} available` : 'Out of stock'}</span>
        </div>

        <button
          onClick={() => { addItem(item); navigate(`${base}/cart`); }}
          disabled={item.availableQuantity === 0}
          className="btn-primary w-full mt-6"
        >
          {item.availableQuantity === 0 ? 'Out of stock' : 'Add to cart'}
        </button>
      </div>
    </div>
  );
};

export default FoodDetails;
