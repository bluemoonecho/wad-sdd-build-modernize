import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface DuckSummary {
  id: string;
  name: string;
  category: string;
  price: number;
  tagline: string;
}

export interface DuckRecord extends DuckSummary {
  longDescription: string;
  personalityTraits: string[];
  specialPowers: string[];
  stockCount: number;
}

export type StockLevel = 'In stock' | 'Only 2 left' | 'Sold out';

export interface DuckDetail extends Omit<DuckRecord, 'stockCount'> {
  stockLevel: StockLevel;
}

export class DuckNotFoundError extends Error {
  readonly statusCode = 404;

  constructor(duckId: string) {
    super(`Duck not found: ${duckId}`);
    this.name = 'DuckNotFoundError';
  }
}

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const catalogFilePath = resolve(currentDirectory, 'catalog-data.json');

function readCatalog(): DuckRecord[] {
  const rawCatalog = readFileSync(catalogFilePath, 'utf8');
  return JSON.parse(rawCatalog) as DuckRecord[];
}

function toStockLevel(stockCount: number): StockLevel {
  if (stockCount <= 0) {
    return 'Sold out';
  }

  if (stockCount <= 2) {
    return 'Only 2 left';
  }

  return 'In stock';
}

export function listDucks(): DuckSummary[] {
  return readCatalog().map(({ id, name, category, price, tagline }) => ({
    id,
    name,
    category,
    price,
    tagline,
  }));
}

export function getDuckDetailById(duckId: string): DuckDetail {
  const duck = readCatalog().find((candidate) => candidate.id === duckId);

  if (!duck) {
    throw new DuckNotFoundError(duckId);
  }

  const { stockCount, ...duckWithoutStockCount } = duck;

  return {
    ...duckWithoutStockCount,
    stockLevel: toStockLevel(stockCount),
  };
}