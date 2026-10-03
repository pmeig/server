import type { RestErrorHandler, RestHandler, RestNext, RestRequest, RestResponse } from './http/http.type';
import { Method } from './models/rest.type';
import { Type } from '@pmeig/srv-core';
import { RestControllerResolver } from './boot/resolver/rest-controller.resolver';
import { controllerStorage } from './boot/rest-internal.boot';

export const toRestHandler =
  (middleware: RestMiddleware): RestHandler =>
  (request, response, next) => {
    return middleware.use(request, next, response);
  };

export const toRestErrorHandler =
  (middleware: RestErrorMiddleware): RestErrorHandler =>
  (error, request, response, next) => {
    return middleware.use(error, response, request, next);
  };

export const retrieveControllerCreator = () => {
  const store = controllerStorage.getStore() as { controller: Type<any>; method: string };
  if (store) {
    return new RestControllerResolver(store.controller, store.method);
  }
  return undefined;
};

export abstract class RestMiddleware {
  global = false;

  protected constructor() {}

  // noinspection JSUnusedLocalSymbols
  accept(path: string, method?: Method): boolean {
    return false;
  }

  abstract use(request: RestRequest, next: RestNext, response: RestResponse): void | Promise<void>;
}

export abstract class RestErrorMiddleware {
  global = false;
  protected constructor() {}

  accept(_: string, _method?: Method) {
    return false;
  }

  abstract use(error: Error, response: RestResponse, request: RestRequest, next: RestNext): void | Promise<void>;
}
