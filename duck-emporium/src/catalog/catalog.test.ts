import { describe, expect, it } from 'vitest';

import { DuckNotFoundError, getDuckDetailById, listDucks } from './catalog';

describe('catalog', () => {
  it('contains at least 10 ducks across at least 3 categories', () => {
    const ducks = listDucks();
    const categories = new Set(ducks.map((duck) => duck.category));

    expect(ducks).toHaveLength(10);
    expect(categories.size).toBeGreaterThanOrEqual(3);
  });

  it('lists the required catalog summary fields', () => {
    const ducks = listDucks();

    for (const duck of ducks) {
      expect(duck.id).toEqual(expect.any(String));
      expect(duck.name).toEqual(expect.any(String));
      expect(duck.category).toEqual(expect.any(String));
      expect(duck.price).toEqual(expect.any(Number));
      expect(duck.tagline).toEqual(expect.any(String));
    }
  });

  it('returns full duck details for a valid duck ID', () => {
    const detail = getDuckDetailById('captain-quack');

    expect(detail.id).toBe('captain-quack');
    expect(detail.name).toEqual(expect.any(String));
    expect(detail.category).toEqual(expect.any(String));
    expect(detail.price).toEqual(expect.any(Number));
    expect(detail.tagline).toEqual(expect.any(String));
    expect(detail.longDescription).toEqual(expect.any(String));
    expect(detail.personalityTraits.length).toBeGreaterThan(0);
    expect(detail.specialPowers.length).toBeGreaterThan(0);
    expect(['In stock', 'Only 2 left', 'Sold out']).toContain(detail.stockLevel);
  });

  it('returns explicit stock levels expected by the story', () => {
    expect(getDuckDetailById('captain-quack').stockLevel).toBe('In stock');
    expect(getDuckDetailById('disco-feather').stockLevel).toBe('Only 2 left');
    expect(getDuckDetailById('rose-gold-river').stockLevel).toBe('Sold out');
  });

  it('throws a clear not found error for an unknown duck ID', () => {
    expect(() => getDuckDetailById('does-not-exist')).toThrowError(DuckNotFoundError);

    try {
      getDuckDetailById('does-not-exist');
    } catch (error) {
      expect(error).toBeInstanceOf(DuckNotFoundError);
      expect((error as DuckNotFoundError).statusCode).toBe(404);
      expect((error as DuckNotFoundError).message.toLowerCase()).toContain('duck not found');
    }
  });

  it('allows catalog entries to refer to detail pages by ID', () => {
    const ducks = listDucks();

    for (const duck of ducks) {
      const detail = getDuckDetailById(duck.id);
      expect(detail.id).toBe(duck.id);
    }
  });
});