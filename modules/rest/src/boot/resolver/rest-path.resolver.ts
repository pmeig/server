import { RestMiddlewareResolver } from './rest-middleware.resolver';
import { Configuration, Nullable, toPromise } from '@pmeig/srv-core';
import { Method } from '../../models/rest.type';
import { HttpStatusCode, HttpStatusNoValue, is3xx } from '../../models/status.model';
import { RestParameterResolver } from './rest-parameter.resolver';
import { retrieveRestConfig } from '../../rest';
import type { RestErrorHandler, RestHandler, RestRequest, RestResponse, RestRouteContext } from '../../http/http.type';

export interface RestPath {
  method: Method;
  configPath: string;
  context: RestRouteContext;
  middlewares: RestHandler[];
  errorMiddlewares: RestErrorHandler[];
  handler: (request: RestRequest, response: RestResponse) => Promise<RestResponse>;
}

@Configuration
export class RestPathResolver {
  constructor(
    private readonly middlewaresResolver: RestMiddlewareResolver,
    private readonly parameterResolver: RestParameterResolver
  ) {}

  resolve(controller: any, method: Function): Nullable<RestPath> {
    const handler = method.bind(controller);
    const methodName = method.name;
    const config = retrieveRestConfig(controller, methodName);
    if (config) {
      const responseHandler = this.createHandlerResponse(config.options);
      const params = this.parameterResolver.resolve(controller, methodName);
      const configPath = config.path ? (config.path.startsWith('/') ? config.path : '/' + config.path) : '';
      const middlewares = this.middlewaresResolver.resolvePath(
        configPath,
        config.options.method,
        controller,
        methodName
      );
      return {
        method: config.options.method,
        configPath,
        context: { controller, method: methodName },
        middlewares: middlewares.middlewares,
        errorMiddlewares: middlewares.errorMiddlewares,
        handler: async (request, response) => {
          const answered = trackAnswer(response);
          const value = await toPromise(handler(...params(request, response)));
          // the handler answered by itself through @Res (response.send(), redirect(), ...)
          if (answered() || response.sent) return response;
          response.header('content-type', config.options.media);
          if (typeof value === 'undefined' || value === response) {
            return response.code(HttpStatusNoValue(config.options.status)).send();
          }
          return responseHandler(value, response);
        }
      };
    }
    return undefined;
  }

  private createHandlerResponse(options: { status: HttpStatusCode; media: string; method: Method }) {
    if (is3xx(options.status)) {
      return (value: any, response: RestResponse) => response.redirect(value, options.status);
    }
    const json = options.media.includes('json');
    return (value: any, response: RestResponse) => {
      // strings and buffers are sent as is unless the media type is JSON, everything else is serialized
      const raw = !json && (typeof value === 'string' || Buffer.isBuffer(value));
      return response.code(options.status).send(raw ? value : JSON.stringify(value));
    };
  }
}

/**
 * `reply.sent` only turns true once the response is flushed, which is asynchronous with some onSend hooks
 * (compression for example), so the calls to `send` are tracked to avoid answering twice.
 */
const trackAnswer = (response: RestResponse) => {
  let answered = false;
  const send = response.send.bind(response);
  response.send = ((...args: Parameters<RestResponse['send']>) => {
    answered = true;
    return send(...args);
  }) as RestResponse['send'];
  return () => answered;
};
