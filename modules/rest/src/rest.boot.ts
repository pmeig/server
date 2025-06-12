import { Bootable, Configuration, Context, Internal, toPromise } from '@server/core';
import express, { Express, NextFunction, Request, RequestHandler, Response, Router } from 'express';
import { RestMapper, retrieveMiddleware, retrieveRestConfig } from './rest';
import { Controller } from './decorators/rest.decorators';
import { Server } from 'http';
import { RestMiddleware, toExpressMiddleware } from './rest.middleware';
import { ExpressResolver } from './decorators/express.resolver';

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
    await this.configurePath(
      context,
      middlewares.filter(value => {
        if (value.global) {
          this.server.use((req, res, next) => value.use(req, res, next));
          return false;
        }
        return true;
      })
    );
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

  private async configurePath(context: Context, middlewares: RestMiddleware[]) {
    const controllers = await context.withDecorator(Controller);
    controllers.forEach(controller => {
      const prototype = Object.getPrototypeOf(controller);
      const mapper = retrieveRestConfig(prototype.constructor);
      const router = Router();
      const parent = '/' + (mapper?.path ?? '');
      Object.getOwnPropertyNames(prototype)
        .filter(key => key !== 'constructor')
        .forEach(key => {
          const config = retrieveRestConfig(controller, key);
          if (config) {
            const middleware = retrieveMiddleware(controller, key);
            const used = middlewares.filter(
              middleware => middleware.accept(parent + (config.path ? '/' + config.path : ''), config.method),
              controller[key]
            );
            if (middleware) {
              used.push(
                new (class extends RestMiddleware {
                  use(request: Request, response: Response, next: NextFunction): void | Promise<void> {
                    return middleware(request, response, next);
                  }
                })()
              );
            }
            this.applyPath(config, router, used, controller, key);
          }
        });
      const used: RequestHandler[] = [router];
      const globalMiddleware = retrieveMiddleware(prototype.constructor);
      if (globalMiddleware) {
        used.unshift(globalMiddleware!);
      }
      this.server.use(parent, ...used);
    });
  }

  private applyPath(
    config: RestMapper,
    router: Router,
    middlewares: RestMiddleware[],
    controller: object,
    key: string | symbol
  ) {
    const controllerElement = controller[key].bind(controller);
    const params = this.resolver.resolve(controller, key);
    router[config.method.toLowerCase()](
      '/' + config.path,
      ...middlewares.map(value => toExpressMiddleware(value)),
      async (request: Request, response: Response) => {
        const value = await toPromise(controllerElement(...params(request, response)));
        if (typeof value !== 'undefined') {
          response.json(value);
        } else {
          response.status(204).send();
        }
      }
    );
  }
}
