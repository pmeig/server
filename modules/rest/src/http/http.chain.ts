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

    // `step` moves the chain forward. It is called once to start the chain, then by the `next` given to
    // each handler:
    // - `step(error)`: a handler failed or called `next(error)`, the chain is aborted and the error goes to
    //   Fastify (`done(error)`), the remaining handlers are not run;
    // - `step()`: runs the next handler, or hands over to Fastify (`done()`) when all of them have run.
    // A handler that answers by itself and never calls `next` simply stops the chain: Fastify expects no
    // `done` once the reply is sent.
    const step = (error?: unknown): void => {
      if (error) return finish(error);
      const handler = handlers[index++];
      if (!handler) return finish();

      // calling `next` twice must not run the following handlers twice
      let called = false;
      const next: RestNext = nextError => {
        if (called) return;
        called = true;
        step(nextError);
      };

      // a synchronous throw or a rejected promise of the handler is turned into an error of the chain
      // (an error raised after `done` was called is ignored: Fastify can only be told once)
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
