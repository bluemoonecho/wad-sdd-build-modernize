import { copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createCatalogApiServer } from './server';

const currentDirectory = dirname(fileURLToPath(import.meta.url));

function createIsolatedCatalogFilePath(): { tempDirectoryPath: string; catalogFilePath: string } {
  const tempDirectoryPath = mkdtempSync(join(tmpdir(), 'duck-emporium-story-6-'));
  const catalogFilePath = join(tempDirectoryPath, 'catalog-data.json');
  const sourceCatalogFilePath = join(currentDirectory, '..', 'catalog', 'catalog-data.json');

  copyFileSync(sourceCatalogFilePath, catalogFilePath);

  return {
    tempDirectoryPath,
    catalogFilePath,
  };
}

describe('catalog API server', () => {
  const activeServers: Array<ReturnType<typeof createCatalogApiServer>> = [];
  const tempDirectoryPaths: string[] = [];

  async function startServer() {
    const { tempDirectoryPath, catalogFilePath } = createIsolatedCatalogFilePath();
    tempDirectoryPaths.push(tempDirectoryPath);

    const logger = {
      log: vi.fn<(message: string) => void>(),
    };

    const server = createCatalogApiServer({
      adminPassword: 'quack-secret',
      catalogDataSourceOptions: {
        catalogFilePath,
      },
      logger,
    });

    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, () => resolve());
    });

    activeServers.push(server);

    const address = server.address();

    if (!address || typeof address === 'string') {
      throw new Error('Server address unavailable.');
    }

    return {
      baseUrl: `http://127.0.0.1:${address.port}`,
      logger,
    };
  }

  afterEach(async () => {
    while (activeServers.length > 0) {
      const server = activeServers.pop();

      if (!server) {
        continue;
      }

      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    }

    while (tempDirectoryPaths.length > 0) {
      const tempDirectoryPath = tempDirectoryPaths.pop();

      if (!tempDirectoryPath) {
        continue;
      }

      rmSync(tempDirectoryPath, { recursive: true, force: true });
    }
  });

  it('rejects requests without or with wrong admin password', async () => {
    const { baseUrl } = await startServer();

    const missingPassword = await fetch(`${baseUrl}/admin/ducks`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const wrongPassword = await fetch(`${baseUrl}/admin/ducks`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-admin-password': 'wrong-password',
      },
      body: JSON.stringify({}),
    });

    expect(missingPassword.status).toBe(401);
    expect(await missingPassword.json()).toEqual({ error: 'Unauthorized' });
    expect(wrongPassword.status).toBe(401);
    expect(await wrongPassword.json()).toEqual({ error: 'Unauthorized' });
  });

  it('returns clear validation errors for duplicate names, negative values, and missing fields', async () => {
    const { baseUrl } = await startServer();

    const duplicateName = await fetch(`${baseUrl}/admin/ducks`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-admin-password': 'quack-secret',
      },
      body: JSON.stringify({
        name: 'Classic Yellow Duck',
        category: 'Classic',
        price: 10,
        tagline: 'Still classic.',
        description: 'Still yellow.',
        personalityTraits: ['friendly'],
        initialStock: 1,
      }),
    });

    const negativePrice = await fetch(`${baseUrl}/admin/ducks`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-admin-password': 'quack-secret',
      },
      body: JSON.stringify({
        name: 'Storm Duck',
        category: 'Adventure',
        price: -1,
        tagline: 'Tiny thunder.',
        description: 'Crackles with static joy.',
        personalityTraits: ['bold'],
        initialStock: 1,
      }),
    });

    const negativeStock = await fetch(`${baseUrl}/admin/ducks`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-admin-password': 'quack-secret',
      },
      body: JSON.stringify({
        name: 'Canyon Echo Duck',
        category: 'Adventure',
        price: 8,
        tagline: 'Echoes forever.',
        description: 'Likes dramatic bathtime acoustics.',
        personalityTraits: ['loud'],
        initialStock: -1,
      }),
    });

    const missingRequiredField = await fetch(`${baseUrl}/admin/ducks`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-admin-password': 'quack-secret',
      },
      body: JSON.stringify({
        name: '',
        category: 'Classic',
        price: 8,
        tagline: 'Quiet confidence.',
        description: 'A grounded duck.',
        personalityTraits: ['calm'],
        initialStock: 2,
      }),
    });

    expect(duplicateName.status).toBe(400);
    expect((await duplicateName.json()).error.toLowerCase()).toContain('already exists');

    expect(negativePrice.status).toBe(400);
    expect(await negativePrice.json()).toEqual({
      error: 'price must be a non-negative number.',
    });

    expect(negativeStock.status).toBe(400);
    expect(await negativeStock.json()).toEqual({
      error: 'initialStock must be a non-negative integer.',
    });

    expect(missingRequiredField.status).toBe(400);
    expect(await missingRequiredField.json()).toEqual({
      error: 'name is required.',
    });
  });

  it('adds a duck and exposes it immediately in the catalog listing', async () => {
    const { baseUrl } = await startServer();

    const createResponse = await fetch(`${baseUrl}/admin/ducks`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-admin-password': 'quack-secret',
      },
      body: JSON.stringify({
        name: 'Zen Glacier Duck',
        category: 'Wellness',
        price: 13.25,
        tagline: 'Cool-headed serenity.',
        description: 'Radiates calm like a floating glacier temple.',
        personalityTraits: ['calm', 'patient'],
        initialStock: 4,
      }),
    });

    expect(createResponse.status).toBe(201);

    const createBody = await createResponse.json();
    expect(createBody.duck.name).toBe('Zen Glacier Duck');
    expect(createBody.duck.id).toBe('zen-glacier-duck');

    const listResponse = await fetch(`${baseUrl}/ducks`);
    expect(listResponse.status).toBe(200);

    const listBody = await listResponse.json();
    const createdDuck = listBody.ducks.find((duck: { id: string }) => duck.id === 'zen-glacier-duck');

    expect(createdDuck).toEqual({
      id: 'zen-glacier-duck',
      name: 'Zen Glacier Duck',
      category: 'Wellness',
      price: 13.25,
      tagline: 'Cool-headed serenity.',
    });
  });

  it('logs the action with timestamp and duck name without logging customer data', async () => {
    const { baseUrl, logger } = await startServer();

    const response = await fetch(`${baseUrl}/admin/ducks`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-admin-password': 'quack-secret',
      },
      body: JSON.stringify({
        name: 'Aurora Quack',
        category: 'Luxury',
        price: 19.99,
        tagline: 'Northern lights, southern squeak.',
        description: 'Glows mysteriously in dramatic lighting.',
        personalityTraits: ['radiant', 'composed'],
        initialStock: 2,
        customerEmail: 'customer@example.com',
      }),
    });

    expect(response.status).toBe(201);
    expect(logger.log).toHaveBeenCalledTimes(1);

    const message = logger.log.mock.calls[0]?.[0] ?? '';
    expect(message).toContain('Aurora Quack');
    expect(message).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(message).not.toContain('customer@example.com');
  });
});
