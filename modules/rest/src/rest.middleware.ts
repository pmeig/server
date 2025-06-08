import { NextFunction, Request, Response } from 'express';
import { Method } from './rest.type';

export const toExpressMiddleware =
  async (middleware: RestMiddleware) => async (request: Request, response: Response, next: NextFunction) => {
    const result = middleware.use(request, response, next);
    if (result instanceof Promise) {
      await result;
    }
  };

export abstract class RestMiddleware {
  global: boolean = false;

  constructor() {}

  accept(_: string, _method: Method): boolean {
    return false;
  }

  abstract use(request: Request, response: Response, next: NextFunction): void | Promise<void>;
}
