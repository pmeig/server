import { NextFunction, Request, Response } from 'express';
import { Method } from './rest.type';
import { AsyncSync } from '@server/core';

export type ExpressMiddleware = (req: Request, res: Response, next: NextFunction) => AsyncSync<void>;

export const toExpressMiddleware =
  async (middleware: RestMiddleware) => async (request: Request, response: Response, next: NextFunction) => {
    const result = middleware.use(request, response, next);
    if (result instanceof Promise) {
      await result;
    }
  };

export abstract class RestMiddleware {
  global = false;

  constructor() {}

  accept(_: string, _method: Method): boolean {
    return false;
  }

  abstract use(request: Request, response: Response, next: NextFunction): void | Promise<void>;
}
