import React, { createContext, useContext, useState, useMemo } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]); // [{ menuItemId, name, price, quantity, availableQuantity }]

  const addItem = (menuItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.menuItemId === menuItem._id);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === menuItem._id ? { ...i, quantity: Math.min(i.quantity + 1, menuItem.availableQuantity) } : i
        );
      }
      return [...prev, {
        menuItemId: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: 1,
        availableQuantity: menuItem.availableQuantity,
      }];
    });
  };

  const updateQuantity = (menuItemId, quantity) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.menuItemId !== menuItemId)
        : prev.map((i) => (i.menuItemId === menuItemId ? { ...i, quantity: Math.min(quantity, i.availableQuantity) } : i))
    );
  };

  const removeItem = (menuItemId) => setItems((prev) => prev.filter((i) => i.menuItemId !== menuItemId));
  const clearCart = () => setItems([]);

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items]);
  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  return (
    <CartContext.Provider value={{ items, addItem, updateQuantity, removeItem, clearCart, subtotal, itemCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
