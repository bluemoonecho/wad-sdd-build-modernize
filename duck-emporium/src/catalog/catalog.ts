import { readFileSync, renameSync, writeFileSync } from 'node:fs';
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

export class DuckStockConflictError extends Error {
  readonly statusCode = 409;

  constructor(duckId: string, requestedQuantity: number, availableStock: number) {
    super(
      `Cannot reserve ${requestedQuantity} of duck "${duckId}". Only ${availableStock} left in stock.`,
    );
    this.name = 'DuckStockConflictError';
  }
}

export interface CatalogDataSourceOptions {
  catalogFilePath?: string;
}

export interface StockDecrementLineItem {
  duckId: string;
  quantity: number;
}

export interface CatalogSearchFilters {
  query?: string;
  categories?: string[];
  minPrice?: number;
  maxPrice?: number;
}

export interface CatalogSearchResult {
  ducks: DuckSummary[];
  emptyStateMessage?: string;
}

export const CATALOG_EMPTY_STATE_MESSAGE = 'No duck matches your existential criteria.';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const defaultCatalogFilePath = resolve(currentDirectory, 'catalog-data.json');

function getCatalogFilePath(options?: CatalogDataSourceOptions): string {
  return options?.catalogFilePath ?? defaultCatalogFilePath;
}

function readCatalog(options?: CatalogDataSourceOptions): DuckRecord[] {
  const catalogFilePath = getCatalogFilePath(options);
  const rawCatalog = readFileSync(catalogFilePath, 'utf8');
  return JSON.parse(rawCatalog) as DuckRecord[];
}

function writeCatalog(catalog: DuckRecord[], options?: CatalogDataSourceOptions): void {
  const catalogFilePath = getCatalogFilePath(options);
  const temporaryFilePath = `${catalogFilePath}.tmp`;

  writeFileSync(temporaryFilePath, JSON.stringify(catalog, null, 2), 'utf8');
  renameSync(temporaryFilePath, catalogFilePath);
}

function getDuckRecordById(duckId: string, options?: CatalogDataSourceOptions): DuckRecord {
  const duck = readCatalog(options).find((candidate) => candidate.id === duckId);

  if (!duck) {
    throw new DuckNotFoundError(duckId);
  }

  return duck;
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

export function listDucks(options?: CatalogDataSourceOptions): DuckSummary[] {
  return readCatalog(options).map(({ id, name, category, price, tagline }) => ({
    id,
    name,
    category,
    price,
    tagline,
  }));
}

export function getDuckDetailById(duckId: string, options?: CatalogDataSourceOptions): DuckDetail {
  const duck = getDuckRecordById(duckId, options);

  const { stockCount, ...duckWithoutStockCount } = duck;

  return {
    ...duckWithoutStockCount,
    stockLevel: toStockLevel(stockCount),
  };
}

export function getDuckStockCountById(duckId: string, options?: CatalogDataSourceOptions): number {
  return getDuckRecordById(duckId, options).stockCount;
}

export function decrementDuckStock(
  lineItems: StockDecrementLineItem[],
  options?: CatalogDataSourceOptions,
): void {
  const aggregatedQuantities = new Map<string, number>();

  for (const lineItem of lineItems) {
    if (!Number.isInteger(lineItem.quantity) || lineItem.quantity <= 0) {
      throw new Error(`Invalid stock decrement quantity for duck "${lineItem.duckId}".`);
    }

    const currentQuantity = aggregatedQuantities.get(lineItem.duckId) ?? 0;
    aggregatedQuantities.set(lineItem.duckId, currentQuantity + lineItem.quantity);
  }

  const catalog = readCatalog(options);
  const catalogByDuckId = new Map(catalog.map((duck) => [duck.id, duck]));

  for (const [duckId, requestedQuantity] of aggregatedQuantities.entries()) {
    const duck = catalogByDuckId.get(duckId);

    if (!duck) {
      throw new DuckNotFoundError(duckId);
    }

    if (requestedQuantity > duck.stockCount) {
      throw new DuckStockConflictError(duckId, requestedQuantity, duck.stockCount);
    }
  }

  const updatedCatalog = catalog.map((duck) => {
    const requestedQuantity = aggregatedQuantities.get(duck.id);

    if (!requestedQuantity) {
      return duck;
    }

    return {
      ...duck,
      stockCount: duck.stockCount - requestedQuantity,
    };
  });

  writeCatalog(updatedCatalog, options);
}

export function searchCatalog(
  filters: CatalogSearchFilters = {},
  options?: CatalogDataSourceOptions,
): CatalogSearchResult {
  const normalizedQuery = filters.query?.trim().toLowerCase();
  const activeCategories = new Set(
    (filters.categories ?? []).map((category) => category.trim()).filter((category) => category),
  );

  const ducks = readCatalog(options)
    .filter((duck) => {
      if (!normalizedQuery) {
        return true;
      }

      const searchableText = `${duck.name} ${duck.tagline} ${duck.longDescription}`.toLowerCase();
      return searchableText.includes(normalizedQuery);
    })
    .filter((duck) => {
      if (activeCategories.size === 0) {
        return true;
      }

      return activeCategories.has(duck.category);
    })
    .filter((duck) => {
      if (filters.minPrice === undefined) {
        return true;
      }

      return duck.price >= filters.minPrice;
    })
    .filter((duck) => {
      if (filters.maxPrice === undefined) {
        return true;
      }

      return duck.price <= filters.maxPrice;
    })
    .map(({ id, name, category, price, tagline }) => ({
      id,
      name,
      category,
      price,
      tagline,
    }));

  if (ducks.length === 0) {
    return {
      ducks,
      emptyStateMessage: CATALOG_EMPTY_STATE_MESSAGE,
    };
  }

  return {
    ducks,
  };
}