import { RestMiddlewareResolver } from '../resolver/rest-middleware.resolver';
import { Configuration, getTypeOf } from '@pmeig/srv-core';
import { retrieveRestConfig } from '../../rest';
import { ErrorRequestHandler, RequestHandler, Router } from 'express';
import { RestPath } from '../resolver/rest-path.resolver';

export interface RestRoute {
  path: string;
  handler: RequestHandler;
}

@Configuration
export class RestRouteBuilder {
  private route: Router;
  private path: string;
  private errorMiddleware: ErrorRequestHandler[];
  constructor(private readonly middlewareResolver: RestMiddlewareResolver) {}

  builder(controller: any) {
    const beanDecorator = getTypeOf(controller);
    const mapper = retrieveRestConfig(beanDecorator);
    this.route = Router();
    this.path = `/${mapper?.path ?? ''}`;

    const middlewares = this.middlewareResolver.resolveRoute(this.path, controller);
    if (middlewares.middlewares.length > 0) this.route.use(...middlewares.middlewares);
    this.errorMiddleware = middlewares.errorMiddlewares;
    return this;
  }

  addPath(path: RestPath) {
    this.route[path.method.toLowerCase()](path.path, ...path.handler);
  }

  build(): RestRoute {
    if (this.errorMiddleware.length > 0) this.route.use(...this.errorMiddleware);
    return {
      path: this.path,
      handler: this.route
    };
  }
}
