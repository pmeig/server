import { RestMiddlewareResolver } from './rest-middleware.resolver';
import { Configuration, Internal, Nullable, toPromise } from '@server/core';
import { Method } from '../../models/rest.type';
import { HttpStatusNoValue, is3xx } from '../../models/status.model';
import { ErrorRequestHandler, RequestHandler, Response } from 'express';
import { ExpressParameterResolver } from './expressParameterResolver';
import { retrieveRestConfig } from '../../rest';

export interface RestPath {
  method: Method;
  path: string;
  handler: (RequestHandler | ErrorRequestHandler)[];
}

@Configuration
@Internal
export class RestPathResolver {
  constructor(
    private readonly middlewaresResolver: RestMiddlewareResolver,
    private readonly expressParameterResolver: ExpressParameterResolver
  ) {}

  resolve(controller: any, method: Function): Nullable<RestPath> {
    const handler = method.bind(controller);
    const methodName = method.name;
    const config = retrieveRestConfig(controller, methodName);
    if (config) {
      const responseHandler = this.createHandlerResponse(config.options);
      const params = this.expressParameterResolver.resolve(controller, methodName);
      const path = config.path ? (config.path.startsWith('/') ? config.path : '/' + config.path) : '';
      const middlewares = this.middlewaresResolver.resolvePath(path, config.options.method, controller, methodName);
      return {
        method: config.options.method,
        path,
        handler: [
          ...middlewares.middlewares.map(value => value),
          async (request: any, response: Response) => {
            const value = await toPromise(handler(...params(request, response)));
            response = response.appendHeader('Content-type', config.options.media);
            if (typeof value !== 'undefined') {
              responseHandler(value, response);
            } else response.sendStatus(HttpStatusNoValue(config.options.status));
          },
          ...middlewares.errorMiddlewares
        ]
      };
    }
    return undefined;
  }

  private createHandlerResponse(options: { status: number; media: string; method: Method }) {
    if (is3xx(options.status)) {
      return (value: any, response: Response) => response.status(options.status).redirect(value);
    }
    return (value: any, response: Response) => response.status(options.status).json(value);
  }
}
