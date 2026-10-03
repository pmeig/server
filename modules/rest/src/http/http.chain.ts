import type { FastifyError } from 'fastify';
import type { RestErrorHandler, RestHandler, RestNext, RestRequest, RestResponse } from './http.type';

type HookDone = (error?: Error) => void;

/**
 * Chains express-like handlers `(request, response, next)` into one callback-style Fastify hook.
 *
 * The hook deliberately stays callback-based (not async): every handler is called from the `next`
 * of the previous one, so an `AsyncLocalStorage.run(store, next)` performed by a handler is still
 * active for the next handlers *and* for the rest of the Fastify lifecycle (`done`).
 */
export const chainHandlers =
  (handlers: RestHandler[]) =>
  (request: RestRequest, response: RestResponse, done: HookDone): void => {
    let index = 0;
    let finished = false;

    const finish = (error?: unknown) => {
      if (finished) return;
      finished = true;
      done(error as Error | undefined);
    };

    const step = (error?: unknown): void => {
      if (error) return finish(error);
      const handler = handlers[index++];
      if (!handler) return finish();

      let called = false;
      const next: RestNext = nextError => {
        if (called) return;
        called = true;
        step(nextError);
      };

      try {
        const result = handler(request, response, next);
        if (result && typeof result.catch === 'function') result.catch(finish);
      } catch (e) {
        finish(e);
      }
    };

    step();
  };

/**
 * Chains error handlers `(error, request, response, next)` into one Fastify error handler.
 *
 * - returning normally means the error is handled (the handler answered through `response`);
 * - throwing, or `next(error)`, hands the error to the next handler of the chain;
 * - when the chain is exhausted the error is re-thrown, so Fastify forwards it to the parent
 *   error handler (route -> server -> Fastify default).
 */
export const chainErrorHandlers =
  (handlers: RestErrorHandler[]) =>
  async (error: FastifyError, request: RestRequest, response: RestResponse): Promise<RestResponse> => {
    let current: unknown = error;
    for (const handler of handlers) {
      const outcome = await new Promise<{ error: unknown } | undefined>(resolve => {
        const next: RestNext = nextError => resolve({ error: nextError ?? current });
        try {
          Promise.resolve(handler(current as Error, request, response, next)).then(
            () => resolve(undefined),
            e => resolve({ error: e })
          );
        } catch (e) {
          resolve({ error: e });
        }
      });
      if (!outcome) return response;
      current = outcome.error;
    }
    throw current;
  };
