import { After, Component, Order } from '@pmeig/srv-core';
import { RestMiddleware } from '../rest.middleware';
import { RequestGeneratorId } from '../rest.scoped';
import { RestControllerResolver } from './resolver/rest-controller.resolver';
import { controllerStorage } from './rest-internal.boot';
import type { RestNext, RestRequest } from '../http/http.type';

@Component
@Order(Number.MIN_SAFE_INTEGER + 1)
@After(RequestGeneratorId)
export class RestControllerMiddleware extends RestMiddleware {
  global = true;
  constructor(private readonly restControllerResolver: RestControllerResolver) {
    super();
  }
  use(request: RestRequest, next: RestNext): void | Promise<void> {
    // The controller/method pair is attached to the Fastify route (see RestServerBuilder.addRoute)
    const context = request.routeOptions?.config?.rest;
    if (context) {
      Object.entries(context).forEach(([key, value]) => (this.restControllerResolver[key] = value));
      controllerStorage.run(context, next);
    } else next();
  }
}
