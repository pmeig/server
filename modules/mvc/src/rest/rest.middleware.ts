import { NextFunction, Request, Response } from 'express';

export abstract class RestMiddleware {
  protected constructor() {}

  abstract use(request: Request, response: Response, next: NextFunction): void | Promise<void>;
}
