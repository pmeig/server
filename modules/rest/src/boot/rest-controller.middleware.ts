import { After, Component, Order, Type } from '@pmeig/srv-core';
import { RestMiddleware } from '../rest.middleware';
import { RequestGeneratorId } from '../rest.scoped';
import { NextFunction, Request } from 'express';
import { RestControllerResolver } from './resolver/rest-controller.resolver';
import { controllerStorage } from './rest-internal.boot';
import { match } from 'node-match-path';

export const pathIdentifiers: Record<
  string,
  {
    controller: Type<any>;
    method: string;
  }
> = {};

@Component
@Order(Number.MIN_SAFE_INTEGER + 1)
@After(RequestGeneratorId)
export class RestControllerMiddleware extends RestMiddleware {
  global = true;
  constructor(private readonly restControllerResolver: RestControllerResolver) {
    super();
  }
  use(request: Request, next: NextFunction): void | Promise<void> {
    const key = Object.keys(pathIdentifiers).find(key => match(key, request.path).matches) ?? '';
    const context = pathIdentifiers[key];
    if (context) {
      Object.entries(context).forEach(([key, value]) => (this.restControllerResolver[key] = value));
      controllerStorage.run(context, next);
    } else next();
  }
}
