import { Configuration, InjectByDecorator, List, Optional } from '@pmeig/srv-core';
import { RestErrorMiddleware, RestMiddleware, toRestErrorHandler, toRestHandler } from '../../rest.middleware';
import { Method } from '../../models/rest.type';
import { retrieveErrorMiddleware, retrieveMiddleware } from '../../rest';
import type { RestErrorHandler, RestHandler } from '../../http/http.type';
import { ControllerAdvisor } from '../../errors/advisor.decorators';

export interface MiddlewareResolved {
  middlewares: RestHandler[];
  errorMiddlewares: RestErrorHandler[];
}

interface MiddlewareResolver<T> {
  global: T[];
  paths: T[];
}

@Configuration
export class RestMiddlewareResolver {
  private readonly middlewares: MiddlewareResolver<RestMiddleware> = {
    global: [],
    paths: []
  };
  private readonly errorMiddlewares: MiddlewareResolver<RestErrorMiddleware> = {
    global: [],
    paths: []
  };

  private state: {
    middlewares: RestMiddleware[];
    errorMiddlewares: RestErrorMiddleware[];
    path: string;
  } = {
    middlewares: [],
    errorMiddlewares: [],
    path: ''
  };

  constructor(
    @List(RestMiddleware) middlewares: RestMiddleware[],
    @Optional @List(RestErrorMiddleware) errorMiddlewares: RestErrorMiddleware[] = [],
    @Optional @InjectByDecorator(ControllerAdvisor) advisors: RestErrorMiddleware[] = []
  ) {
    const paths: RestMiddleware[] = [];
    this.middlewares = {
      global: middlewares.filter(value => {
        if (value.global) {
          return true;
        }
        paths.push(value);
        return false;
      }),
      paths
    };

    const errorPaths: RestErrorMiddleware[] = [];
    this.errorMiddlewares = {
      global: errorMiddlewares.filter(value => {
        if (value.global) {
          return true;
        }
        errorPaths.push(value);
        return false;
      }),
      paths: errorPaths
    };
    this.errorMiddlewares.global.push(
      ...advisors.filter(value => {
        if (value.global) return true;
        this.errorMiddlewares.paths.push(value);
        return false;
      })
    );
  }

  resolveServer(): MiddlewareResolved {
    return this.addMiddlewareFromDecorator(this.middlewares.global, this.errorMiddlewares.global);
  }

  resolveRoute(path: string, controller: any): MiddlewareResolved {
    this.state = {
      errorMiddlewares: [],
      middlewares: [],
      path
    };
    return this.addMiddlewareFromDecorator(
      this.middlewares.paths.filter(middleware => {
        if (middleware.accept(path)) return true;
        this.state.middlewares.push(middleware);
        return false;
      }),
      this.errorMiddlewares.paths.filter(middleware => {
        if (middleware.accept(path)) return true;
        this.state.errorMiddlewares.push(middleware);
        return false;
      }),
      controller
    );
  }

  resolvePath(path: string, method: Method, controller: any, methodName: string | symbol): MiddlewareResolved {
    const uri = this.state.path + path;
    const middlewares = this.state.middlewares.filter(value => value.accept(uri, method));
    const errorMiddlewares = this.state.errorMiddlewares.filter(value => value.accept(uri, method));
    return this.addMiddlewareFromDecorator(middlewares, errorMiddlewares, controller, methodName);
  }

  private addMiddlewareFromDecorator(
    middlewares: RestMiddleware[],
    errorMiddleware: RestErrorMiddleware[],
    controller?: any,
    key?: string | symbol
  ): MiddlewareResolved {
    const restMiddleware = middlewares.map(value => toRestHandler(value));
    const restErrorMiddleware = errorMiddleware.map(value => toRestErrorHandler(value));
    if (controller) {
      const middlewareDecorator = retrieveMiddleware(controller, key);
      const errorMiddlewareDecorator = retrieveErrorMiddleware(controller, key);
      if (middlewareDecorator) {
        restMiddleware.unshift(middlewareDecorator);
      }
      if (errorMiddlewareDecorator) {
        restErrorMiddleware.unshift(errorMiddlewareDecorator);
      }
    }
    return {
      middlewares: restMiddleware,
      errorMiddlewares: restErrorMiddleware
    };
  }
}
