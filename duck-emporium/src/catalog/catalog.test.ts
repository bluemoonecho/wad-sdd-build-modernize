import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import type { Duck } from './catalog';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const catalogFilePath = resolve(currentDirectory, 'catalog-data.json');

function readCatalog(): Duck[] {
  const rawCatalog = readFileSync(catalogFilePath, 'utf8');
  return JSON.parse(rawCatalog) as Duck[];
}

describe('catalog seed data', () => {
  it('contains at least 10 ducks across at least 3 categories', () => {
    const ducks = readCatalog();
    const categories = new Set(ducks.map((duck) => duck.category));

    expect(ducks).toHaveLength(10);
    expect(categories.size).toBeGreaterThanOrEqual(3);
  });

  it('includes the required duck fields', () => {
    const ducks = readCatalog();

    for (const duck of ducks) {
      expect(duck.id).toEqual(expect.any(String));
      expect(duck.name).toEqual(expect.any(String));
      expect(duck.category).toEqual(expect.any(String));
      expect(duck.price).toEqual(expect.any(Number));
      expect(duck.tagline).toEqual(expect.any(String));
    }
  });
});