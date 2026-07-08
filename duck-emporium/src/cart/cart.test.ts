import { describe, expect, it } from 'vitest';

import {
  CartLineNotFoundError,
  CartSession,
  CartStockExceededError,
  InvalidCartQuantityError,
} from './cart';

describe('cart session', () => {
  it('adds a duck by ID with default quantity of 1', () => {
    const cart = new CartSession();
    const snapshot = cart.addDuck('captain-quack');

    expect(snapshot.items).toHaveLength(1);
    expect(snapshot.items[0]).toMatchObject({
      duckId: 'captain-quack',
      quantity: 1,
      name: 'Captain Quack',
      unitPrice: 9.5,
    });
    expect(snapshot.runningTotal).toBeCloseTo(9.5, 5);
  });

  it('adds multiple ducks and maintains a running total', () => {
    const cart = new CartSession();

    cart.addDuck('captain-quack', 2);
    const snapshot = cart.addDuck('classic-yellow', 3);

    expect(snapshot.items).toHaveLength(2);
    expect(snapshot.runningTotal).toBeCloseTo(33.97, 5);
  });

  it('increases quantity when adding an already present duck', () => {
    const cart = new CartSession();

    cart.addDuck('classic-yellow', 2);
    const snapshot = cart.addDuck('classic-yellow', 3);

    expect(snapshot.items).toHaveLength(1);
    expect(snapshot.items[0].quantity).toBe(5);
    expect(snapshot.runningTotal).toBeCloseTo(24.95, 5);
  });

  it('changes line-item quantity and removes the line when set to zero', () => {
    const cart = new CartSession();

    cart.addDuck('captain-quack', 2);
    const updatedSnapshot = cart.setDuckQuantity('captain-quack', 1);
    const emptySnapshot = cart.setDuckQuantity('captain-quack', 0);

    expect(updatedSnapshot.items[0].quantity).toBe(1);
    expect(emptySnapshot.items).toHaveLength(0);
    expect(emptySnapshot.runningTotal).toBe(0);
  });

  it('rejects quantities above available stock with a clear message', () => {
    const cart = new CartSession();

    expect(() => cart.addDuck('disco-feather', 3)).toThrowError(CartStockExceededError);

    try {
      cart.addDuck('disco-feather', 3);
    } catch (error) {
      expect(error).toBeInstanceOf(CartStockExceededError);
      expect((error as CartStockExceededError).message.toLowerCase()).toContain('only 2 in stock');
    }
  });

  it('preserves cart state within a single session instance', () => {
    const cart = new CartSession();

    cart.addDuck('captain-quack');
    cart.addDuck('classic-yellow', 2);

    const snapshot = cart.getSnapshot();

    expect(snapshot.items).toHaveLength(2);
    expect(snapshot.items.map((item) => item.duckId)).toEqual(['captain-quack', 'classic-yellow']);
  });

  it('rejects invalid quantities and unknown line-item updates', () => {
    const cart = new CartSession();

    expect(() => cart.addDuck('captain-quack', 0)).toThrowError(InvalidCartQuantityError);
    expect(() => cart.setDuckQuantity('captain-quack', -1)).toThrowError(InvalidCartQuantityError);
    expect(() => cart.setDuckQuantity('captain-quack', 1)).toThrowError(CartLineNotFoundError);
  });
});
