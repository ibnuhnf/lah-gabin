'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Product, BarVariant } from '@/types';
import { getActivePrice } from '@/lib/utils';

export interface CartItem {
  product: Product;
  quantity: number;
  activePrice: number;
  // null = belum dipilih untuk unit tersebut
  unitVariants: (BarVariant | null)[];
}

interface CartContextValue {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setUnitVariant: (productId: string, unitIndex: number, variant: BarVariant) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  allVariantsSelected: boolean;
}

const CartContext = createContext<CartContextValue>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  setUnitVariant: () => {},
  clearCart: () => {},
  totalItems: 0,
  subtotal: 0,
  allVariantsSelected: false,
});

const CART_STORAGE_KEY = 'lah_gabin_cart_v2'; // bump version — v1 incompatible

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore
    }
  }, [items]);

  const addItem = (product: Product, quantity = 1) => {
    const { price } = getActivePrice(
      product.base_price,
      product.discount_price,
      product.discount_start_date,
      product.discount_end_date
    );

    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const newQty = existing.quantity + quantity;
        // Extend unitVariants array with nulls for new units
        const newVariants = [...existing.unitVariants, ...Array(quantity).fill(null)];
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: newQty, activePrice: price, unitVariants: newVariants }
            : item
        );
      }
      return [...prev, { product, quantity, activePrice: price, unitVariants: Array(quantity).fill(null) }];
    });
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.product.id !== productId) return item;
        // Trim or extend unitVariants to match new quantity
        const variants = item.unitVariants.slice(0, quantity);
        while (variants.length < quantity) variants.push(null);
        return { ...item, quantity, unitVariants: variants };
      })
    );
  };

  const setUnitVariant = (productId: string, unitIndex: number, variant: BarVariant) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.product.id !== productId) return item;
        const newVariants = [...item.unitVariants];
        newVariants[unitIndex] = variant;
        return { ...item, unitVariants: newVariants };
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.activePrice * item.quantity, 0);
  const allVariantsSelected =
    items.length > 0 && items.every((item) => item.unitVariants.every((v) => v !== null));

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        setUnitVariant,
        clearCart,
        totalItems,
        subtotal,
        allVariantsSelected,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
