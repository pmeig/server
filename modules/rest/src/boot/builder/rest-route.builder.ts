import { RestMiddlewareResolver } from '../resolver/rest-middleware.resolver';
import { Configuration, getTypeOf } from '@pmeig/srv-core';
import { retrieveRestConfig } from '../../rest';
import { RestPath } from '../resolver/rest-path.resolver';
import type { RestErrorHandler, RestHandler } from '../../http/http.type';

export interface RestRoute {
  path: string;
  middlewares: RestHandler[];
  errorMiddlewares: RestErrorHandler[];
  paths: RestPath[];
}

@Configuration
export class RestRouteBuilder {
  private paths: RestPath[];
  private path: string;
  private middlewares: RestHandler[];
  private errorMiddleware: RestErrorHandler[];
  constructor(private readonly middlewareResolver: RestMiddlewareResolver) {}

  builder(controller: any) {
    const beanDecorator = getTypeOf(controller);
    const mapper = retrieveRestConfig(beanDecorator);
    this.paths = [];
    this.path = mapper?.path ? (mapper.path.startsWith('/') ? mapper.path : '/' + mapper.path) : '';

    const middlewares = this.middlewareResolver.resolveRoute(this.path, controller);
    this.middlewares = middlewares.middlewares;
    this.errorMiddleware = middlewares.errorMiddlewares;
    return this;
  }

  addPath(path: RestPath) {
    this.paths.push(path);
  }

  build(): RestRoute {
    return {
      path: this.path,
      middlewares: this.middlewares,
      errorMiddlewares: this.errorMiddleware,
      paths: this.paths
    };
  }
}
