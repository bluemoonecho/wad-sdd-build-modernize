import { randomUUID } from 'node:crypto';

import {
  decrementDuckStock,
  DuckNotFoundError,
  DuckStockConflictError,
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

export interface CheckoutServiceOptions extends CatalogDataSourceOptions, OrderDataSourceOptions {}

export class CheckoutService {
  constructor(
    private readonly cartSession: CartSession,
    private readonly options?: CheckoutServiceOptions,
  ) {}

  submit(request: CheckoutRequest): OrderConfirmation {
    this.validateCheckoutRequest(request);

    const cartSnapshot = this.cartSession.getSnapshot();
    if (cartSnapshot.items.length === 0) {
      throw new CheckoutEmptyCartError();
    }

    try {
      decrementDuckStock(
        cartSnapshot.items.map((item) => ({ duckId: item.duckId, quantity: item.quantity })),
        this.options,
      );
    } catch (error) {
      if (error instanceof DuckStockConflictError || error instanceof DuckNotFoundError) {
        throw new CheckoutStockError(error.message);
      }

      throw error;
    }

    const order: PersistedOrder = {
      orderId: randomUUID(),
      shippingName: request.shippingName.trim(),
      shippingEmail: request.shippingEmail.trim(),
      shippingAddress: request.shippingAddress.trim(),
      mockedCardDetails: request.mockedCardDetails.trim(),
      items: cartSnapshot.items,
      total: cartSnapshot.runningTotal,
      timestamp: new Date().toISOString(),
    };

    appendOrder(order, this.options);
    this.cartSession.clear();

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
