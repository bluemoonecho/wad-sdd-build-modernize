import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface OrderDataSourceOptions {
  ordersFilePath?: string;
}

export interface PersistedOrderLineItem {
  duckId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface PersistedOrder {
  orderId: string;
  shippingName: string;
  shippingEmail: string;
  shippingAddress: string;
  mockedCardDetails: string;
  items: PersistedOrderLineItem[];
  total: number;
  timestamp: string;
}

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const defaultOrdersFilePath = resolve(currentDirectory, 'orders-data.json');

function getOrdersFilePath(options?: OrderDataSourceOptions): string {
  return options?.ordersFilePath ?? defaultOrdersFilePath;
}

function ensureOrdersStoreExists(ordersFilePath: string): void {
  const directory = dirname(ordersFilePath);

  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }

  if (!existsSync(ordersFilePath)) {
    writeFileSync(ordersFilePath, '[]\n', 'utf8');
  }
}

function writeOrders(orders: PersistedOrder[], options?: OrderDataSourceOptions): void {
  const ordersFilePath = getOrdersFilePath(options);
  ensureOrdersStoreExists(ordersFilePath);

  const temporaryFilePath = `${ordersFilePath}.tmp`;
  writeFileSync(temporaryFilePath, JSON.stringify(orders, null, 2), 'utf8');
  renameSync(temporaryFilePath, ordersFilePath);
}

export function readOrders(options?: OrderDataSourceOptions): PersistedOrder[] {
  const ordersFilePath = getOrdersFilePath(options);
  ensureOrdersStoreExists(ordersFilePath);

  const rawOrders = readFileSync(ordersFilePath, 'utf8');
  return JSON.parse(rawOrders) as PersistedOrder[];
}

export function appendOrder(order: PersistedOrder, options?: OrderDataSourceOptions): void {
  const orders = readOrders(options);
  orders.push(order);
  writeOrders(orders, options);
}
