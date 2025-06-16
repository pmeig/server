import {
  Bootable,
  Configuration,
  Context,
  getMethodWithDecorator,
  getTypeOf,
  Internal,
  toPromise,
  Type
} from '@server/core';
import express, {
  ErrorRequestHandler,
  Express,
  NextFunction,
  Request,
  RequestHandler,
  Response,
  Router
} from 'express';
import { RestMapper, retrieveErrorMiddleware, retrieveMiddleware, retrieveRestConfig } from './rest';
import { Controller } from './decorators/rest.decorators';
import { Server } from 'http';
import { RestErrorMiddleware, RestMiddleware, toExpressErrorMiddleware, toExpressMiddleware } from './rest.middleware';
import { ExpressResolver } from './decorators/express.resolver';
import { Method } from './models/rest.type';
import { HttpStatusNoValue, is3xx } from './models/status.model';
import { ControllerAdvisor, ExceptionAdvisor } from './errors/advisor.decorators';
import { retrieveExceptionAdvisor, retrievePathAdvisor } from './errors/advisor.services';
import { match } from 'node-match-path';

type Advisor = (error: Error, response: Response, request: Request, next?: NextFunction) => void | Promise<void>;

type AdvisorConfig = {
  regex: (RegExp | string)[];
  middleware: Advisor;
};

@Configuration
@Internal
export class RestBootable extends Bootable {
  private readonly server: Express = express();
  private runner: Server;

  constructor(private readonly resolver: ExpressResolver) {
    super();
  }

  async run(context: Context): Promise<{
    runner: Server;
    port: number;
  }> {
    this.server.use(express.json());
    this.server.use(express.urlencoded({ extended: true }));
    const middlewares = await context.multiResolve<RestMiddleware>(RestMiddleware.name);
    const errorMiddlewares = await context.multiResolve<RestErrorMiddleware>(RestErrorMiddleware.name);
    const controllerAdvisors = await this.getAllAdvisor(context);
    const globalErrorMiddlewares: RestErrorMiddleware[] = [];
    errorMiddlewares.push(...controllerAdvisors);
    await this.configurePath(
      context,
      errorMiddlewares.filter(value => {
        if (value.global) {
          globalErrorMiddlewares.push(value);
          return false;
        }
        return true;
      }),
      middlewares.filter(value => {
        if (value.global) {
          this.server.use((req, res, next) => value.use(req, res, next));
          return false;
        }
        return true;
      })
    );
    this.server.use(...globalErrorMiddlewares.map(value => toExpressErrorMiddleware(value)));
    return new Promise((resolve, reject) => {
      this.runner = this.server.listen(3000, error => {
        if (error) {
          reject(error);
        } else {
          resolve({
            runner: this.runner,
            port: 3000
          });
        }
      });
    });
  }

  close(): Promise<void> | void {
    this.runner.close();
  }

  private async configurePath(
    context: Context,
    errorMiddlewares: RestErrorMiddleware[],
    middlewares: RestMiddleware[]
  ) {
    const controllers = await context.withDecorator(Controller);
    controllers.forEach(controller => {
      const prototype = Object.getPrototypeOf(controller);
      const mapper = retrieveRestConfig(prototype.constructor);
      const router = Router();
      const parent = '/' + (mapper?.path ?? '');
      const routeErrorMiddlewares: ErrorRequestHandler[] = [];
      const routeMiddleware: RequestHandler[] = [];
      errorMiddlewares = errorMiddlewares.filter(value => {
        if (value.accept(parent)) {
          routeErrorMiddlewares.push(toExpressErrorMiddleware(value));
          return false;
        }
        return true;
      });
      middlewares = middlewares.filter(value => {
        if (value.accept(parent)) {
          routeMiddleware.push(toExpressMiddleware(value));
          return false;
        }
        return true;
      });
      Object.getOwnPropertyNames(prototype)
        .filter(key => key !== 'constructor')
        .forEach(key => {
          const config = retrieveRestConfig(controller, key);
          if (config) {
            this.configure(config, parent, router, errorMiddlewares, middlewares, controller, key);
          }
        });
      const used: (RequestHandler | ErrorRequestHandler)[] = [...routeMiddleware, router];
      const globalMiddleware = retrieveMiddleware(prototype.constructor);
      const globalErrorMiddleware = retrieveErrorMiddleware(prototype.constructor);
      if (globalErrorMiddleware) {
        routeErrorMiddlewares.unshift(globalErrorMiddleware);
      }
      if (globalMiddleware) {
        used.unshift(globalMiddleware!);
      }
      this.server.use(parent, ...used, ...routeErrorMiddlewares);
    });
  }

  private configure(
    config: RestMapper,
    parent: string,
    router: Router,
    errorMiddlewares: RestErrorMiddleware[],
    middlewares: RestMiddleware[],
    controller: Type<any>,
    key: string | symbol
  ) {
    const middleware = retrieveMiddleware(controller, key);
    const errorMiddleware = retrieveErrorMiddleware(controller, key);
    const used = middlewares.filter(
      middleware => middleware.accept(parent + (config.path ? '/' + config.path : ''), config.options.method),
      controller[key]
    );
    const errorUsed = errorMiddlewares.filter(
      middleware => middleware.accept(parent + (config.path ? '/' + config.path : ''), config.options.method),
      controller[key]
    );
    if (errorMiddleware) {
      errorUsed.unshift(
        new (class extends RestErrorMiddleware {
          use(error: Error, request: Request, response: Response, next: NextFunction): void | Promise<void> {
            return errorMiddleware(error, request, response, next);
          }
        })()
      );
    }
    if (middleware) {
      used.push(
        new (class extends RestMiddleware {
          use(request: Request, response: Response, next: NextFunction): void | Promise<void> {
            return middleware(request, response, next);
          }
        })()
      );
    }
    this.applyPath(config, router, errorUsed, used, controller, key);
  }

  private applyPath(
    config: RestMapper,
    router: Router,
    errorUsed: RestErrorMiddleware[],
    middlewares: RestMiddleware[],
    controller: object,
    key: string | symbol
  ) {
    const controllerElement = controller[key].bind(controller);
    const params = this.resolver.resolve(controller, key);
    const responseHandler = this.createHandlerResponse(config.options);
    router[config.options.method.toLowerCase()](
      '/' + config.path,
      ...middlewares.map(value => toExpressMiddleware(value)),
      async (request: Request, response: Response) => {
        const value = await toPromise(controllerElement(...params(request, response)));
        response = response.appendHeader('Content-type', config.options.media);
        if (typeof value !== 'undefined') {
          return responseHandler(value, response);
        }
        return response.sendStatus(HttpStatusNoValue(config.options.status));
      },
      ...errorUsed.map(value => toExpressErrorMiddleware(value))
    );
  }

  private createHandlerResponse(options: { status: number; media: string; method: Method }) {
    if (is3xx(options.status)) {
      return (value: any, response: Response) => response.status(options.status).redirect(value);
    }
    return (value: any, response: Response) => response.status(options.status).json(value);
  }

  private async getAllAdvisor(context: Context) {
    const advisors = (await context.withDecorator(ControllerAdvisor)).reverse();
    const init = [{ middleware: (error, _response, _, next) => next!(error), regex: [] }] as AdvisorConfig[];
    const configuration = advisors
      .map(advisor => {
        const prototype = getTypeOf(advisor);
        const path = retrievePathAdvisor(prototype);
        return {
          advisor,
          path,
          methods: getMethodWithDecorator(advisor, ExceptionAdvisor).map(value => {
            return {
              method: advisor[value].bind(advisor),
              error: retrieveExceptionAdvisor(advisor, value)
            };
          })
        };
      })
      .reduce((acc, item) => {
        const middleware: Advisor = (error, response, request) => {
          const errorName = Object.getPrototypeOf(error).constructor.name;
          const method = item.methods.find(value => value.error === errorName)?.method;
          if (method) {
            return method(error, response, request);
          }
          throw error;
        };
        if (!item.path) {
          const next = acc[0].middleware;
          acc[0].middleware = async (error, response, request, nextFunction) => {
            try {
              return await middleware(error, response, request);
            } catch (err) {
              return next(err, response, request, nextFunction);
            }
          };
        } else {
          acc.push({
            regex: item.path,
            middleware: middleware
          });
        }
        return acc;
      }, init);
    const advisorsMiddleware: RestErrorMiddleware[] = configuration.slice(1).map(config => {
      const regexes = config.regex.flatMap(tester => {
        const result: (RegExp | string)[] = [];
        if (typeof tester === 'string') {
          result.push(tester);
          result.push(tester + '/*');
        } else {
          result.push(tester);
          result.push(new RegExp(tester.source + '/.*', tester.flags));
        }
        return result;
      }) as (RegExp | string)[];
      return new (class extends RestErrorMiddleware {
        global = false;
        accept(path: string) {
          const controls = [path, path.slice(1)];
          return regexes.some(tester => controls.some(url => match(tester, url).matches));
        }
        use(error: Error, request: Request, response: Response, _: NextFunction): void | Promise<void> {
          return config.middleware(error, response, request);
        }
      })();
    });
    const globalAdvisor = configuration[0].middleware;
    advisorsMiddleware.unshift(
      new (class extends RestErrorMiddleware {
        global = true;
        use(error: Error, request: Request, response: Response, next: NextFunction): void | Promise<void> {
          return globalAdvisor(error, response, request, next);
        }
      })()
    );
    return advisorsMiddleware;
  }
}
