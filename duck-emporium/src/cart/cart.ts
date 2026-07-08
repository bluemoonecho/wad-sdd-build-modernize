import { getDuckDetailById, getDuckStockCountById } from '../catalog/catalog';

export interface CartLineItem {
  duckId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface CartSnapshot {
  items: CartLineItem[];
  runningTotal: number;
}

export class CartStockExceededError extends Error {
  readonly statusCode = 400;

  constructor(duckId: string, requestedQuantity: number, availableStock: number) {
    super(
      `Cannot set quantity for duck "${duckId}" to ${requestedQuantity}. Only ${availableStock} in stock.`,
    );
    this.name = 'CartStockExceededError';
  }
}

export class CartLineNotFoundError extends Error {
  readonly statusCode = 404;

  constructor(duckId: string) {
    super(`Cart line not found for duck "${duckId}".`);
    this.name = 'CartLineNotFoundError';
  }
}

export class InvalidCartQuantityError extends Error {
  readonly statusCode = 400;

  constructor(quantity: number) {
    super(`Quantity must be a positive integer (or 0 when updating). Received: ${quantity}.`);
    this.name = 'InvalidCartQuantityError';
  }
}

export class CartSession {
  private readonly lineItems = new Map<string, number>();

  addDuck(duckId: string, quantity = 1): CartSnapshot {
    this.assertPositiveInteger(quantity);

    const nextQuantity = (this.lineItems.get(duckId) ?? 0) + quantity;
    this.ensureInStock(duckId, nextQuantity);

    this.lineItems.set(duckId, nextQuantity);
    return this.getSnapshot();
  }

  setDuckQuantity(duckId: string, quantity: number): CartSnapshot {
    this.assertNonNegativeInteger(quantity);

    if (!this.lineItems.has(duckId)) {
      throw new CartLineNotFoundError(duckId);
    }

    if (quantity === 0) {
      this.lineItems.delete(duckId);
      return this.getSnapshot();
    }

    this.ensureInStock(duckId, quantity);
    this.lineItems.set(duckId, quantity);

    return this.getSnapshot();
  }

  removeDuck(duckId: string): CartSnapshot {
    this.lineItems.delete(duckId);
    return this.getSnapshot();
  }

  getSnapshot(): CartSnapshot {
    const items = [...this.lineItems.entries()]
      .map(([duckId, quantity]) => {
        const detail = getDuckDetailById(duckId);
        const lineTotal = detail.price * quantity;

        return {
          duckId,
          name: detail.name,
          unitPrice: detail.price,
          quantity,
          lineTotal,
        };
      })
      .sort((left, right) => left.duckId.localeCompare(right.duckId));

    const runningTotal = items.reduce((total, item) => total + item.lineTotal, 0);

    return {
      items,
      runningTotal,
    };
  }

  private ensureInStock(duckId: string, requestedQuantity: number): void {
    const stockCount = getDuckStockCountById(duckId);

    if (requestedQuantity > stockCount) {
      throw new CartStockExceededError(duckId, requestedQuantity, stockCount);
    }
  }

  private assertPositiveInteger(quantity: number): void {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new InvalidCartQuantityError(quantity);
    }
  }

  private assertNonNegativeInteger(quantity: number): void {
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new InvalidCartQuantityError(quantity);
    }
  }
}
