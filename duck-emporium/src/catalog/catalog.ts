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

export class DuckValidationError extends Error {
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
    this.name = 'DuckValidationError';
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

export interface CreateDuckInput {
  name: string;
  category: string;
  price: number;
  tagline: string;
  description: string;
  personalityTraits: string[];
  initialStock: number;
}

export interface DuckOfDayResult {
  duck?: DuckSummary;
  detailPath?: string;
  emptyStateMessage?: string;
}

export const CATALOG_EMPTY_STATE_MESSAGE = 'No duck matches your existential criteria.';
export const DUCK_OF_THE_DAY_EMPTY_STATE_MESSAGE = 'The pond is empty today, come back tomorrow.';

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

function normalizeRequiredString(value: string, fieldName: string): string {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new DuckValidationError(`${fieldName} is required.`);
  }

  return normalizedValue;
}

function slugifyName(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!slug) {
    throw new DuckValidationError('name must include letters or numbers.');
  }

  return slug;
}

function generateDuckId(name: string, existingIds: Set<string>): string {
  const baseId = slugifyName(name);

  if (!existingIds.has(baseId)) {
    return baseId;
  }

  let suffix = 2;
  let candidateId = `${baseId}-${suffix}`;

  while (existingIds.has(candidateId)) {
    suffix += 1;
    candidateId = `${baseId}-${suffix}`;
  }

  return candidateId;
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

function getUtcDayNumber(date: Date): number {
  return Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86400000);
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

export function addDuck(input: CreateDuckInput, options?: CatalogDataSourceOptions): DuckSummary {
  const name = normalizeRequiredString(input.name, 'name');
  const category = normalizeRequiredString(input.category, 'category');
  const tagline = normalizeRequiredString(input.tagline, 'tagline');
  const longDescription = normalizeRequiredString(input.description, 'description');

  if (!Number.isFinite(input.price) || input.price < 0) {
    throw new DuckValidationError('price must be a non-negative number.');
  }

  if (!Number.isInteger(input.initialStock) || input.initialStock < 0) {
    throw new DuckValidationError('initialStock must be a non-negative integer.');
  }

  if (!Array.isArray(input.personalityTraits) || input.personalityTraits.length === 0) {
    throw new DuckValidationError('personalityTraits must include at least one trait.');
  }

  const personalityTraits = input.personalityTraits.map((trait) => {
    const normalizedTrait = trait.trim();

    if (!normalizedTrait) {
      throw new DuckValidationError('personalityTraits cannot include empty values.');
    }

    return normalizedTrait;
  });

  const catalog = readCatalog(options);
  const existingNames = new Set(catalog.map((duck) => duck.name.toLowerCase()));

  if (existingNames.has(name.toLowerCase())) {
    throw new DuckValidationError(`A duck named "${name}" already exists.`);
  }

  const duckId = generateDuckId(name, new Set(catalog.map((duck) => duck.id)));

  const newDuck: DuckRecord = {
    id: duckId,
    name,
    category,
    price: input.price,
    tagline,
    longDescription,
    personalityTraits,
    specialPowers: [],
    stockCount: input.initialStock,
  };

  writeCatalog([...catalog, newDuck], options);

  return {
    id: newDuck.id,
    name: newDuck.name,
    category: newDuck.category,
    price: newDuck.price,
    tagline: newDuck.tagline,
  };
}

export function getDuckOfTheDay(
  date: Date = new Date(),
  options?: CatalogDataSourceOptions,
): DuckOfDayResult {
  const inStockDucks = readCatalog(options)
    .filter((duck) => duck.stockCount > 0)
    .map(({ id, name, category, price, tagline }) => ({
      id,
      name,
      category,
      price,
      tagline,
    }));

  if (inStockDucks.length === 0) {
    return {
      emptyStateMessage: DUCK_OF_THE_DAY_EMPTY_STATE_MESSAGE,
    };
  }

  const dayNumber = getUtcDayNumber(date);
  const selectedIndex = ((dayNumber % inStockDucks.length) + inStockDucks.length) % inStockDucks.length;
  const duck = inStockDucks[selectedIndex];

  if (!duck) {
    return {
      emptyStateMessage: DUCK_OF_THE_DAY_EMPTY_STATE_MESSAGE,
    };
  }

  return {
    duck,
    detailPath: `/ducks/${duck.id}`,
  };
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