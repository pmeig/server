import type { NextFunction, Request, Response } from 'express';
import { Method } from './models/rest.type';
import { AsyncSync } from '@pmeig/srv-core';

export type ExpressMiddleware = (req: Request, res: Response, next: NextFunction) => AsyncSync<void>;
export type ExpressErrorMiddleware = (error: Error, req: Request, res: Response, next: NextFunction) => AsyncSync<void>;

export const toExpressMiddleware =
  (middleware: RestMiddleware) => (request: Request, response: Response, next: NextFunction) => {
    return middleware.use(request, next, response);
  };

export const toExpressErrorMiddleware = (middleware: RestErrorMiddleware) => {
  return (error: Error, req: Request, res: Response, next: NextFunction) => {
    return middleware.use(error, res, req, next);
  };
};

export const retrieveControllerCreator = (request: Request) =>
  request['rest:controller'] as {
    controller: any;
    method: string;
  };

export abstract class RestMiddleware {
  global = false;

  protected constructor() {}

  // noinspection JSUnusedLocalSymbols
  accept(path: string, method?: Method): boolean {
    return false;
  }

  abstract use(request: Request, next: NextFunction, response: Response): void | Promise<void>;
}

export abstract class RestErrorMiddleware {
  global = false;
  protected constructor() {}

  accept(_: string, _method?: Method) {
    return false;
  }

  abstract use(error: Error, response: Response, request: Request, next: NextFunction): void | Promise<void>;
}
