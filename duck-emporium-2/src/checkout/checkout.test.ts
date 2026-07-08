import { cpSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { decrementDuckStock, getDuckStockCountById } from '../catalog/catalog';
import { CartSession } from '../cart/cart';
import {
  CheckoutEmptyCartError,
  CheckoutPersistenceError,
  CheckoutService,
  CheckoutStockError,
  CheckoutValidationError,
  type CheckoutServiceOptions,
} from './checkout';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const sourceCatalogPath = resolve(currentDirectory, '../catalog/catalog-data.json');

const validRequest = {
  shippingName: 'Quincy Quacker',
  shippingEmail: 'quincy@example.com',
  shippingAddress: '42 Bubble Street, Duckburg',
  mockedCardDetails: '4111-1111-1111-1111',
};

describe('checkout service', () => {
  let temporaryDirectory: string;
  let checkoutOptions: CheckoutServiceOptions;

  beforeEach(() => {
    temporaryDirectory = mkdtempSync(join(tmpdir(), 'duck-emporium-checkout-'));

    const temporaryCatalogPath = resolve(temporaryDirectory, 'catalog-data.json');
    const temporaryOrdersPath = resolve(temporaryDirectory, 'orders-data.json');

    cpSync(sourceCatalogPath, temporaryCatalogPath);

    checkoutOptions = {
      catalogFilePath: temporaryCatalogPath,
      ordersFilePath: temporaryOrdersPath,
    };
  });

  afterEach(() => {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  });

  it('validates required fields and rejects invalid email', () => {
    const cart = new CartSession({ catalogFilePath: checkoutOptions.catalogFilePath });
    cart.addDuck('captain-quack');

    const checkoutService = new CheckoutService(cart, checkoutOptions);

    expect(() => checkoutService.submit({ ...validRequest, shippingName: '   ' })).toThrowError(
      CheckoutValidationError,
    );
    expect(() => checkoutService.submit({ ...validRequest, shippingAddress: '   ' })).toThrowError(
      CheckoutValidationError,
    );
    expect(() => checkoutService.submit({ ...validRequest, mockedCardDetails: '   ' })).toThrowError(
      CheckoutValidationError,
    );
    expect(() => checkoutService.submit({ ...validRequest, shippingEmail: 'not-an-email' })).toThrowError(
      CheckoutValidationError,
    );
  });

  it('rejects checkout when cart is empty', () => {
    const cart = new CartSession({ catalogFilePath: checkoutOptions.catalogFilePath });
    const checkoutService = new CheckoutService(cart, checkoutOptions);

    expect(() => checkoutService.submit(validRequest)).toThrowError(CheckoutEmptyCartError);
  });

  it('re-validates stock at submit time and rejects stale carts', () => {
    const cart = new CartSession({ catalogFilePath: checkoutOptions.catalogFilePath });
    cart.addDuck('disco-feather', 2);

    decrementDuckStock([{ duckId: 'disco-feather', quantity: 1 }], {
      catalogFilePath: checkoutOptions.catalogFilePath,
    });

    const checkoutService = new CheckoutService(cart, checkoutOptions);

    expect(() => checkoutService.submit(validRequest)).toThrowError(CheckoutStockError);
  });

  it('decrements stock atomically for all line items, creates order, and clears cart', () => {
    const cart = new CartSession({ catalogFilePath: checkoutOptions.catalogFilePath });
    cart.addDuck('captain-quack', 2);
    cart.addDuck('classic-yellow', 3);

    const captainStockBefore = getDuckStockCountById('captain-quack', {
      catalogFilePath: checkoutOptions.catalogFilePath,
    });
    const classicStockBefore = getDuckStockCountById('classic-yellow', {
      catalogFilePath: checkoutOptions.catalogFilePath,
    });

    const checkoutService = new CheckoutService(cart, checkoutOptions);
    const confirmation = checkoutService.submit(validRequest);

    expect(confirmation.orderId).toEqual(expect.any(String));
    expect(confirmation.timestamp).toEqual(expect.any(String));
    expect(confirmation.summary.items).toHaveLength(2);
    expect(confirmation.summary.total).toBeCloseTo(33.97, 5);

    const captainStockAfter = getDuckStockCountById('captain-quack', {
      catalogFilePath: checkoutOptions.catalogFilePath,
    });
    const classicStockAfter = getDuckStockCountById('classic-yellow', {
      catalogFilePath: checkoutOptions.catalogFilePath,
    });

    expect(captainStockAfter).toBe(captainStockBefore - 2);
    expect(classicStockAfter).toBe(classicStockBefore - 3);
    expect(cart.getSnapshot().items).toHaveLength(0);

    const persistedOrders = JSON.parse(
      readFileSync(checkoutOptions.ordersFilePath as string, 'utf8'),
    ) as Array<{ orderId: string; items: unknown[]; total: number; timestamp: string }>;

    expect(persistedOrders).toHaveLength(1);
    expect(persistedOrders[0].orderId).toBe(confirmation.orderId);
    expect(persistedOrders[0].items).toHaveLength(2);
    expect(persistedOrders[0].total).toBeCloseTo(33.97, 5);
    expect(persistedOrders[0].timestamp).toEqual(expect.any(String));
  });

  it('persists orders so they survive service recreation', () => {
    const cartSessionA = new CartSession({ catalogFilePath: checkoutOptions.catalogFilePath });
    cartSessionA.addDuck('captain-quack');

    const checkoutServiceA = new CheckoutService(cartSessionA, checkoutOptions);
    const firstOrder = checkoutServiceA.submit(validRequest);

    const cartSessionB = new CartSession({ catalogFilePath: checkoutOptions.catalogFilePath });
    cartSessionB.addDuck('classic-yellow');

    const checkoutServiceB = new CheckoutService(cartSessionB, checkoutOptions);
    const secondOrder = checkoutServiceB.submit(validRequest);

    const persistedOrders = JSON.parse(
      readFileSync(checkoutOptions.ordersFilePath as string, 'utf8'),
    ) as Array<{ orderId: string }>;

    expect(persistedOrders).toHaveLength(2);
    expect(persistedOrders.map((order) => order.orderId)).toEqual([
      firstOrder.orderId,
      secondOrder.orderId,
    ]);
  });

  it('rolls back decremented stock and preserves cart when order persistence fails', () => {
    const optionsWithBrokenOrdersStore: CheckoutServiceOptions = {
      catalogFilePath: checkoutOptions.catalogFilePath,
      ordersFilePath: temporaryDirectory,
    };

    const cart = new CartSession({ catalogFilePath: optionsWithBrokenOrdersStore.catalogFilePath });
    cart.addDuck('captain-quack', 1);

    const stockBefore = getDuckStockCountById('captain-quack', {
      catalogFilePath: optionsWithBrokenOrdersStore.catalogFilePath,
    });

    const checkoutService = new CheckoutService(cart, optionsWithBrokenOrdersStore);

    expect(() => checkoutService.submit(validRequest)).toThrowError(CheckoutPersistenceError);

    const stockAfter = getDuckStockCountById('captain-quack', {
      catalogFilePath: optionsWithBrokenOrdersStore.catalogFilePath,
    });

    expect(stockAfter).toBe(stockBefore);

    const snapshotAfterFailure = cart.getSnapshot();
    expect(snapshotAfterFailure.items).toHaveLength(1);
    expect(snapshotAfterFailure.items[0].duckId).toBe('captain-quack');
    expect(snapshotAfterFailure.items[0].quantity).toBe(1);
  });
});
