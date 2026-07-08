import { describe, expect, it } from 'vitest';

import {
  CATALOG_EMPTY_STATE_MESSAGE,
  DuckNotFoundError,
  getDuckDetailById,
  listDucks,
  searchCatalog,
} from './catalog';

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

  it('supports free-text search across name, tagline, and long description (case-insensitive)', () => {
    const byName = searchCatalog({ query: 'captain' });
    const byTagline = searchCatalog({ query: 'mirror-ball energy' });
    const byDescription = searchCatalog({ query: 'MOONLIGHT' });

    expect(byName.ducks.some((duck) => duck.id === 'captain-quack')).toBe(true);
    expect(byTagline.ducks.some((duck) => duck.id === 'disco-feather')).toBe(true);
    expect(byDescription.ducks.some((duck) => duck.id === 'midnight-quacker')).toBe(true);
  });

  it('filters by one or more categories', () => {
    const partyOnly = searchCatalog({ categories: ['Party'] });
    const classicAndLuxury = searchCatalog({ categories: ['Classic', 'Luxury'] });

    expect(partyOnly.ducks.length).toBeGreaterThan(0);
    expect(partyOnly.ducks.every((duck) => duck.category === 'Party')).toBe(true);

    expect(classicAndLuxury.ducks.length).toBeGreaterThan(0);
    expect(
      classicAndLuxury.ducks.every((duck) => ['Classic', 'Luxury'].includes(duck.category)),
    ).toBe(true);
  });

  it('filters by optional minimum and maximum price bounds', () => {
    const minimumOnly = searchCatalog({ minPrice: 15 });
    const maximumOnly = searchCatalog({ maxPrice: 6 });
    const bounded = searchCatalog({ minPrice: 6, maxPrice: 10 });

    expect(minimumOnly.ducks.length).toBeGreaterThan(0);
    expect(minimumOnly.ducks.every((duck) => duck.price >= 15)).toBe(true);

    expect(maximumOnly.ducks.length).toBeGreaterThan(0);
    expect(maximumOnly.ducks.every((duck) => duck.price <= 6)).toBe(true);

    expect(bounded.ducks.length).toBeGreaterThan(0);
    expect(bounded.ducks.every((duck) => duck.price >= 6 && duck.price <= 10)).toBe(true);
  });

  it('composes free-text, category, and price filters together using AND logic', () => {
    const result = searchCatalog({
      query: 'calm',
      categories: ['Adventure'],
      minPrice: 8,
      maxPrice: 9,
    });

    expect(result.ducks.map((duck) => duck.id)).toEqual(['lilypad-louie']);
  });

  it('returns a friendly empty-state message when no duck matches filters', () => {
    const result = searchCatalog({
      query: 'existential submarine philosopher king',
      categories: ['Party'],
      minPrice: 500,
    });

    expect(result.ducks).toHaveLength(0);
    expect(result.emptyStateMessage).toBe(CATALOG_EMPTY_STATE_MESSAGE);
  });
});