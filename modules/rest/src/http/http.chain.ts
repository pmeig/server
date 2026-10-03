import type { FastifyError } from 'fastify';
import type { RestErrorHandler, RestHandler, RestNext, RestRequest, RestResponse } from './http.type';

/**
 * Adapts an express-like handler `(request, response, next)` to a Fastify hook, Fastify runs the hooks of
 * a route one after the other.
 *
 * The hook stays callback-based (not async) on purpose: Fastify runs the next hook from `done`, so an
 * `AsyncLocalStorage.run(store, next)` performed by a handler is still active for the following hooks and
 * for the route handler. It must not return the promise of an async handler either, Fastify would then
 * move on by itself in addition to `next`.
 */
export const toHook =
  (handler: RestHandler) =>
  (request: RestRequest, response: RestResponse, done: (error?: Error) => void): void => {
    // calling `next` twice must not run the following hooks twice
    let called = false;
    const next: RestNext = error => {
      if (called) return;
      called = true;
      done(error as Error | undefined);
    };
    // Fastify already turns a synchronous throw into an error, a rejected promise has to be forwarded
    Promise.resolve(handler(request, response, next)).catch(next);
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
