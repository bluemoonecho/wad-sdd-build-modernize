import { randomUUID } from 'node:crypto';

import {
  decrementDuckStock,
  DuckNotFoundError,
  DuckStockConflictError,
  incrementDuckStock,
  type StockDecrementLineItem,
  type CatalogDataSourceOptions,
} from '../catalog/catalog';
import { CartSession } from '../cart/cart';
import {
  appendOrder,
  type OrderDataSourceOptions,
  type PersistedOrder,
  type PersistedOrderLineItem,
} from '../orders/order-store';

export interface CheckoutRequest {
  shippingName: string;
  shippingEmail: string;
  shippingAddress: string;
  mockedCardDetails: string;
}

export interface OrderConfirmation {
  orderId: string;
  timestamp: string;
  summary: {
    items: PersistedOrderLineItem[];
    total: number;
  };
}

export class CheckoutValidationError extends Error {
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
    this.name = 'CheckoutValidationError';
  }
}

export class CheckoutStockError extends Error {
  readonly statusCode = 409;

  constructor(message: string) {
    super(message);
    this.name = 'CheckoutStockError';
  }
}

export class CheckoutEmptyCartError extends Error {
  readonly statusCode = 400;

  constructor() {
    super('Cannot checkout an empty cart.');
    this.name = 'CheckoutEmptyCartError';
  }
}

export class CheckoutPersistenceError extends Error {
  readonly statusCode = 500;

  constructor(message = 'Could not persist order. Please try again.') {
    super(message);
    this.name = 'CheckoutPersistenceError';
  }
}

export interface CheckoutServiceOptions extends CatalogDataSourceOptions, OrderDataSourceOptions {}

interface CheckoutPorts {
  getCartSnapshot: () => ReturnType<CartSession['getSnapshot']>;
  clearCart: () => void;
  reserveStock: (lineItems: StockDecrementLineItem[]) => void;
  restoreStock: (lineItems: StockDecrementLineItem[]) => void;
  persistOrder: (order: PersistedOrder) => void;
  now: () => Date;
  createOrderId: () => string;
}

function createDefaultPorts(
  cartSession: CartSession,
  options?: CheckoutServiceOptions,
): CheckoutPorts {
  return {
    getCartSnapshot: () => cartSession.getSnapshot(),
    clearCart: () => {
      cartSession.clear();
    },
    reserveStock: (lineItems) => {
      decrementDuckStock(lineItems, options);
    },
    restoreStock: (lineItems) => {
      incrementDuckStock(lineItems, options);
    },
    persistOrder: (order) => {
      appendOrder(order, options);
    },
    now: () => new Date(),
    createOrderId: () => randomUUID(),
  };
}

export class CheckoutService {
  private readonly ports: CheckoutPorts;

  constructor(
    private readonly cartSession: CartSession,
    private readonly options?: CheckoutServiceOptions,
  ) {
    this.ports = createDefaultPorts(cartSession, options);
  }

  submit(request: CheckoutRequest): OrderConfirmation {
    this.validateCheckoutRequest(request);

    const cartSnapshot = this.ports.getCartSnapshot();
    if (cartSnapshot.items.length === 0) {
      throw new CheckoutEmptyCartError();
    }

    const stockLineItems: StockDecrementLineItem[] = cartSnapshot.items.map((item) => ({
      duckId: item.duckId,
      quantity: item.quantity,
    }));

    try {
      this.ports.reserveStock(stockLineItems);
    } catch (error) {
      if (error instanceof DuckStockConflictError || error instanceof DuckNotFoundError) {
        throw new CheckoutStockError(error.message);
      }

      throw error;
    }

    const order: PersistedOrder = {
      orderId: this.ports.createOrderId(),
      shippingName: request.shippingName.trim(),
      shippingEmail: request.shippingEmail.trim(),
      shippingAddress: request.shippingAddress.trim(),
      mockedCardDetails: request.mockedCardDetails.trim(),
      items: cartSnapshot.items,
      total: cartSnapshot.runningTotal,
      timestamp: this.ports.now().toISOString(),
    };

    try {
      this.ports.persistOrder(order);
    } catch {
      try {
        this.ports.restoreStock(stockLineItems);
      } catch {
        throw new CheckoutPersistenceError('Order persistence failed and stock rollback failed.');
      }

      throw new CheckoutPersistenceError();
    }

    this.ports.clearCart();

    return {
      orderId: order.orderId,
      timestamp: order.timestamp,
      summary: {
        items: order.items,
        total: order.total,
      },
    };
  }

  private validateCheckoutRequest(request: CheckoutRequest): void {
    if (!request.shippingName.trim()) {
      throw new CheckoutValidationError('Shipping name is required.');
    }

    if (!request.shippingAddress.trim()) {
      throw new CheckoutValidationError('Shipping address is required.');
    }

    if (!request.mockedCardDetails.trim()) {
      throw new CheckoutValidationError('Mocked card details are required.');
    }

    const email = request.shippingEmail.trim();
    const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!email || !looksLikeEmail) {
      throw new CheckoutValidationError('A valid shipping email is required.');
    }
  }
}
