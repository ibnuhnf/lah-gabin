import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CartProvider, useCart } from '@/contexts/CartContext';
import type { Product } from '@/types';
import React from 'react';

const mockProduct: Product = {
  id: 'prod-1',
  name: 'Es Gabin Coklat',
  description: 'Es gabin coklat premium',
  base_price: 15000,
  discount_price: null,
  discount_start_date: null,
  discount_end_date: null,
  hpp_per_pcs: 775,
  stock_quantity: 10,
  minimum_stock: 3,
  unit: 'pcs',
  status: 'active',
  image_urls: ['https://example.com/coklat.jpg'],
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
};

function TestCartConsumer() {
  const { items, addItem, removeItem, updateQuantity, clearCart, subtotal } = useCart();
  return (
    <div>
      <span data-testid="count">{items.length}</span>
      <span data-testid="subtotal">{subtotal}</span>
      <button onClick={() => addItem(mockProduct)}>add</button>
      <button onClick={() => removeItem('prod-1')}>remove</button>
      <button onClick={() => updateQuantity('prod-1', 3)}>update</button>
      <button onClick={clearCart}>clear</button>
    </div>
  );
}

describe('CartContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts empty', () => {
    render(
      <CartProvider>
        <TestCartConsumer />
      </CartProvider>
    );
    expect(screen.getByTestId('count').textContent).toBe('0');
    expect(screen.getByTestId('subtotal').textContent).toBe('0');
  });

  it('adds item to cart', () => {
    render(
      <CartProvider>
        <TestCartConsumer />
      </CartProvider>
    );
    fireEvent.click(screen.getByText('add'));
    expect(screen.getByTestId('count').textContent).toBe('1');
    expect(screen.getByTestId('subtotal').textContent).toBe('15000');
  });

  it('removes item from cart', () => {
    render(
      <CartProvider>
        <TestCartConsumer />
      </CartProvider>
    );
    fireEvent.click(screen.getByText('add'));
    fireEvent.click(screen.getByText('remove'));
    expect(screen.getByTestId('count').textContent).toBe('0');
  });

  it('updates item quantity and recalculates subtotal', () => {
    render(
      <CartProvider>
        <TestCartConsumer />
      </CartProvider>
    );
    fireEvent.click(screen.getByText('add'));
    fireEvent.click(screen.getByText('update'));
    expect(screen.getByTestId('count').textContent).toBe('1');
    expect(screen.getByTestId('subtotal').textContent).toBe('45000');
  });

  it('clears all items', () => {
    render(
      <CartProvider>
        <TestCartConsumer />
      </CartProvider>
    );
    fireEvent.click(screen.getByText('add'));
    fireEvent.click(screen.getByText('clear'));
    expect(screen.getByTestId('count').textContent).toBe('0');
    expect(screen.getByTestId('subtotal').textContent).toBe('0');
  });

  it('accumulates quantity for same product', () => {
    render(
      <CartProvider>
        <TestCartConsumer />
      </CartProvider>
    );
    fireEvent.click(screen.getByText('add'));
    fireEvent.click(screen.getByText('add'));
    expect(screen.getByTestId('count').textContent).toBe('1');
    expect(screen.getByTestId('subtotal').textContent).toBe('30000');
  });

  it('persists cart in localStorage', () => {
    const { rerender } = render(
      <CartProvider>
        <TestCartConsumer />
      </CartProvider>
    );
    fireEvent.click(screen.getByText('add'));

    rerender(
      <CartProvider>
        <TestCartConsumer />
      </CartProvider>
    );

    expect(screen.getByTestId('count').textContent).toBe('1');
  });
});
