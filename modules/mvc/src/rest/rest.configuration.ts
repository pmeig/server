import { Bootable, Configuration, Context } from '@server/core';
import express, { Express, Request, Response, Router } from 'express';
import { RestMapper, retrieveRestConfig } from './rest';
import { Controller } from './rest.decorators';

@Configuration
export class RestBootable extends Bootable {
  protected server: Express = express();

  async run(context: Context, ...args: any[]): Promise<void> {
    this.server.use(express.json());
    this.server.use(express.urlencoded({ extended: true }));
    const controllers = await context.withDecorator(Controller.name);
    controllers.forEach(controller => {
      const prototype = Object.getPrototypeOf(controller);
      const mapper = retrieveRestConfig(prototype.constructor);
      const router = Router();
      Object.getOwnPropertyNames(prototype)
        .filter(key => key !== 'constructor')
        .forEach(key => {
          const config = retrieveRestConfig(controller, key);
          if (config) {
            this.applyPath(config, router, controller[key].bind(controller));
          }
        });
      this.server.use('/' + (mapper?.path ?? ''), router);
    });
    return new Promise(resolve => {
      const server = this.server.listen(3000, () => console.log('Server started on port 3000'));
      server.on('close', () => resolve());
    });
  }

  private applyPath(config: RestMapper, router: Router, controllerElement: Function) {
    router[config.method.toLowerCase()]('/' + config.path, async (request: Request, response: Response) => {
      const value = await Promise.resolve(controllerElement());
      if (value) {
        response.json(value);
      }
    });
  }
}
