import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';

import {
  addDuck,
  DuckValidationError,
  getDuckOfTheDay,
  listDucks,
  type CatalogDataSourceOptions,
  type CreateDuckInput,
} from '../catalog/catalog';

interface ErrorResponseBody {
  error: string;
}

interface UnauthorizedResponseBody {
  error: 'Unauthorized';
}

export interface CreateCatalogApiServerOptions {
  catalogDataSourceOptions?: CatalogDataSourceOptions;
  adminPassword?: string;
  logger?: Pick<Console, 'log'>;
  duckOfDayDateProvider?: () => Date;
}

const JSON_CONTENT_TYPE = 'application/json; charset=utf-8';

function sendJson(response: ServerResponse, statusCode: number, body: unknown): void {
  response.statusCode = statusCode;
  response.setHeader('content-type', JSON_CONTENT_TYPE);
  response.end(JSON.stringify(body));
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: string[] = [];

  for await (const chunk of request) {
    chunks.push(chunk.toString());
  }

  if (chunks.length === 0) {
    return {};
  }

  try {
    return JSON.parse(chunks.join('')) as unknown;
  } catch {
    throw new DuckValidationError('Request body must be valid JSON.');
  }
}

function toCreateDuckInput(payload: unknown): CreateDuckInput {
  if (!payload || typeof payload !== 'object') {
    throw new DuckValidationError('Request body must be a JSON object.');
  }

  const candidate = payload as Record<string, unknown>;

  return {
    name: String(candidate.name ?? ''),
    category: String(candidate.category ?? ''),
    price: Number(candidate.price),
    tagline: String(candidate.tagline ?? ''),
    description: String(candidate.description ?? ''),
    personalityTraits: Array.isArray(candidate.personalityTraits)
      ? candidate.personalityTraits.map((trait) => String(trait))
      : [],
    initialStock: Number(candidate.initialStock),
  };
}

function unauthorized(response: ServerResponse): void {
  const body: UnauthorizedResponseBody = {
    error: 'Unauthorized',
  };

  sendJson(response, 401, body);
}

function reportError(response: ServerResponse, statusCode: number, message: string): void {
  const body: ErrorResponseBody = {
    error: message,
  };

  sendJson(response, statusCode, body);
}

function getConfiguredAdminPassword(options?: CreateCatalogApiServerOptions): string {
  return options?.adminPassword ?? process.env.ADMIN_PASSWORD ?? '';
}

export function createCatalogApiServer(options?: CreateCatalogApiServerOptions) {
  const logger = options?.logger ?? console;

  return createServer(async (request, response) => {
    const method = request.method ?? 'GET';
    const url = request.url ?? '/';

    if (method === 'GET' && url === '/ducks') {
      sendJson(response, 200, {
        ducks: listDucks(options?.catalogDataSourceOptions),
      });
      return;
    }

    if (method === 'GET' && url === '/duck-of-the-day') {
      const date = options?.duckOfDayDateProvider?.() ?? new Date();
      sendJson(response, 200, getDuckOfTheDay(date, options?.catalogDataSourceOptions));
      return;
    }

    if (method === 'POST' && url === '/admin/ducks') {
      const providedPassword = request.headers['x-admin-password'];
      const adminPassword = getConfiguredAdminPassword(options);

      if (typeof providedPassword !== 'string' || !adminPassword || providedPassword !== adminPassword) {
        unauthorized(response);
        return;
      }

      try {
        const body = await readJsonBody(request);
        const createdDuck = addDuck(toCreateDuckInput(body), options?.catalogDataSourceOptions);

        logger.log(`${new Date().toISOString()} Added duck "${createdDuck.name}"`);
        sendJson(response, 201, {
          duck: createdDuck,
        });
      } catch (error) {
        if (error instanceof DuckValidationError) {
          reportError(response, error.statusCode, error.message);
          return;
        }

        reportError(response, 500, 'Internal server error.');
      }

      return;
    }

    reportError(response, 404, 'Not found.');
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT ?? '3000');
  const server = createCatalogApiServer();

  server.listen(port, () => {
    console.log(`Catalog API listening on http://localhost:${port}`);
  });
}
