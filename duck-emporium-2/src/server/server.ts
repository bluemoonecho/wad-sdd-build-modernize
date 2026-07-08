import { readFileSync } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  addDuck,
  DuckNotFoundError,
  DuckValidationError,
  getDuckOfTheDay,
  getDuckDetailById,
  listDucks,
  searchCatalog,
  type CatalogDataSourceOptions,
  type CreateDuckInput,
} from '../catalog/catalog';
import {
  CartSession,
  InvalidCartQuantityError,
} from '../cart/cart';
import {
  CheckoutEmptyCartError,
  CheckoutPersistenceError,
  CheckoutService,
  CheckoutStockError,
  CheckoutValidationError,
} from '../checkout/checkout';
import type { OrderDataSourceOptions } from '../orders/order-store';
import { evaluateQuiz, getQuizQuestions, QuizValidationError, type QuizAnswer } from '../quiz/quiz';

interface ErrorResponseBody {
  error: string;
}

interface UnauthorizedResponseBody {
  error: 'Unauthorized';
}

export interface CreateCatalogApiServerOptions {
  catalogDataSourceOptions?: CatalogDataSourceOptions;
  orderDataSourceOptions?: OrderDataSourceOptions;
  adminPassword?: string;
  logger?: Pick<Console, 'log'>;
  duckOfDayDateProvider?: () => Date;
}

const JSON_CONTENT_TYPE = 'application/json; charset=utf-8';
const currentDirectory = dirname(fileURLToPath(import.meta.url));
const publicDirectory = resolve(currentDirectory, 'public');

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

function toCheckoutRequest(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    throw new CheckoutValidationError('Request body must be a JSON object.');
  }

  const candidate = payload as Record<string, unknown>;

  return {
    shippingName: String(candidate.shippingName ?? ''),
    shippingEmail: String(candidate.shippingEmail ?? ''),
    shippingAddress: String(candidate.shippingAddress ?? ''),
    mockedCardDetails: String(candidate.mockedCardDetails ?? ''),
  };
}

function toAddCartItemRequest(payload: unknown): { duckId: string; quantity: number } {
  if (!payload || typeof payload !== 'object') {
    throw new InvalidCartQuantityError(Number.NaN);
  }

  const candidate = payload as Record<string, unknown>;

  return {
    duckId: String(candidate.duckId ?? '').trim(),
    quantity: candidate.quantity === undefined ? 1 : Number(candidate.quantity),
  };
}

function toSetCartQuantityRequest(payload: unknown): { quantity: number } {
  if (!payload || typeof payload !== 'object') {
    throw new InvalidCartQuantityError(Number.NaN);
  }

  const candidate = payload as Record<string, unknown>;

  return {
    quantity: Number(candidate.quantity),
  };
}

function getErrorStatusCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') {
    return undefined;
  }

  const candidate = error as { statusCode?: unknown };

  if (typeof candidate.statusCode === 'number') {
    return candidate.statusCode;
  }

  return undefined;
}

function sendStaticFile(response: ServerResponse, fileName: string, contentType: string): void {
  try {
    const filePath = resolve(publicDirectory, fileName);
    const content = readFileSync(filePath, 'utf8');
    response.statusCode = 200;
    response.setHeader('content-type', contentType);
    response.end(content);
  } catch {
    reportError(response, 404, 'Not found.');
  }
}

function toQuizAnswers(payload: unknown): QuizAnswer[] {
  if (!payload || typeof payload !== 'object') {
    throw new QuizValidationError('Request body must be a JSON object.');
  }

  const candidate = payload as Record<string, unknown>;

  if (!Array.isArray(candidate.answers)) {
    throw new QuizValidationError('answers must be an array.');
  }

  return candidate.answers.map((answer) => {
    if (!answer || typeof answer !== 'object') {
      throw new QuizValidationError('Each answer must be an object with questionId and optionId.');
    }

    const answerRecord = answer as Record<string, unknown>;

    return {
      questionId: String(answerRecord.questionId ?? ''),
      optionId: String(answerRecord.optionId ?? ''),
    };
  });
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
  const cartSession = new CartSession(options?.catalogDataSourceOptions);
  const checkoutService = new CheckoutService(cartSession, {
    ...(options?.catalogDataSourceOptions ?? {}),
    ...(options?.orderDataSourceOptions ?? {}),
  });

  return createServer(async (request, response) => {
    const method = request.method ?? 'GET';
    const requestUrl = new URL(request.url ?? '/', 'http://localhost');
    const pathname = requestUrl.pathname;

    if (method === 'GET' && pathname === '/') {
      sendStaticFile(response, 'index.html', 'text/html; charset=utf-8');
      return;
    }

    if (method === 'GET' && pathname === '/styles.css') {
      sendStaticFile(response, 'styles.css', 'text/css; charset=utf-8');
      return;
    }

    if (method === 'GET' && pathname === '/app.js') {
      sendStaticFile(response, 'app.js', 'text/javascript; charset=utf-8');
      return;
    }

    if (method === 'GET' && pathname === '/ducks') {
      const query = requestUrl.searchParams.get('query') ?? undefined;
      const categories = requestUrl.searchParams.getAll('category');
      const minPriceRaw = requestUrl.searchParams.get('minPrice');
      const maxPriceRaw = requestUrl.searchParams.get('maxPrice');

      const hasSearchFilter =
        query !== undefined ||
        categories.length > 0 ||
        minPriceRaw !== null ||
        maxPriceRaw !== null;

      if (hasSearchFilter) {
        const minPrice = minPriceRaw === null ? undefined : Number(minPriceRaw);
        const maxPrice = maxPriceRaw === null ? undefined : Number(maxPriceRaw);

        sendJson(response, 200, {
          ...searchCatalog(
            {
              query,
              categories,
              minPrice,
              maxPrice,
            },
            options?.catalogDataSourceOptions,
          ),
        });
        return;
      }

      sendJson(response, 200, {
        ducks: listDucks(options?.catalogDataSourceOptions),
      });
      return;
    }

    if (method === 'GET' && pathname.startsWith('/ducks/')) {
      const duckId = pathname.replace('/ducks/', '').trim();

      try {
        sendJson(response, 200, {
          duck: getDuckDetailById(duckId, options?.catalogDataSourceOptions),
        });
      } catch (error) {
        if (error instanceof DuckNotFoundError) {
          reportError(response, error.statusCode, error.message);
          return;
        }

        reportError(response, 500, 'Internal server error.');
      }

      return;
    }

    if (method === 'GET' && pathname === '/duck-of-the-day') {
      const date = options?.duckOfDayDateProvider?.() ?? new Date();
      sendJson(response, 200, getDuckOfTheDay(date, options?.catalogDataSourceOptions));
      return;
    }

    if (method === 'GET' && pathname === '/quiz/questions') {
      sendJson(response, 200, {
        questions: getQuizQuestions(),
      });
      return;
    }

    if (method === 'POST' && pathname === '/quiz/result') {
      try {
        const body = await readJsonBody(request);
        const result = evaluateQuiz(toQuizAnswers(body), options?.catalogDataSourceOptions);
        sendJson(response, 200, result);
      } catch (error) {
        if (error instanceof QuizValidationError) {
          reportError(response, error.statusCode, error.message);
          return;
        }

        reportError(response, 500, 'Internal server error.');
      }

      return;
    }

    if (method === 'GET' && pathname === '/cart') {
      sendJson(response, 200, cartSession.getSnapshot());
      return;
    }

    if (method === 'POST' && pathname === '/cart/items') {
      try {
        const body = await readJsonBody(request);
        const payload = toAddCartItemRequest(body);

        if (!payload.duckId) {
          throw new DuckValidationError('duckId is required.');
        }

        sendJson(response, 200, cartSession.addDuck(payload.duckId, payload.quantity));
      } catch (error) {
        const statusCode = getErrorStatusCode(error);

        if (typeof statusCode === 'number' && error instanceof Error) {
          reportError(response, statusCode, error.message);
          return;
        }

        reportError(response, 500, 'Internal server error.');
      }

      return;
    }

    if (method === 'PATCH' && pathname.startsWith('/cart/items/')) {
      const duckId = pathname.replace('/cart/items/', '').trim();

      try {
        const body = await readJsonBody(request);
        const payload = toSetCartQuantityRequest(body);

        if (!duckId) {
          throw new DuckValidationError('duckId is required.');
        }

        sendJson(response, 200, cartSession.setDuckQuantity(duckId, payload.quantity));
      } catch (error) {
        const statusCode = getErrorStatusCode(error);

        if (typeof statusCode === 'number' && error instanceof Error) {
          reportError(response, statusCode, error.message);
          return;
        }

        reportError(response, 500, 'Internal server error.');
      }

      return;
    }

    if (method === 'DELETE' && pathname.startsWith('/cart/items/')) {
      const duckId = pathname.replace('/cart/items/', '').trim();

      if (!duckId) {
        reportError(response, 400, 'duckId is required.');
        return;
      }

      sendJson(response, 200, cartSession.removeDuck(duckId));
      return;
    }

    if (method === 'POST' && pathname === '/checkout') {
      try {
        const body = await readJsonBody(request);
        const result = checkoutService.submit(toCheckoutRequest(body));
        sendJson(response, 200, result);
      } catch (error) {
        if (
          error instanceof CheckoutValidationError ||
          error instanceof CheckoutStockError ||
          error instanceof CheckoutEmptyCartError ||
          error instanceof CheckoutPersistenceError
        ) {
          reportError(response, error.statusCode, error.message);
          return;
        }

        reportError(response, 500, 'Internal server error.');
      }

      return;
    }

    if (method === 'POST' && pathname === '/admin/ducks') {
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
