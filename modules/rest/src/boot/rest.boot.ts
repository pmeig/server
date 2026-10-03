import { Bootable, Configuration, Context } from '@pmeig/srv-core';
import { Controller } from '../decorators/rest.decorators';
import type { Server } from 'http';
import type { FastifyInstance } from 'fastify';
import { RestServerBuilder } from './builder/rest-server.builder';
import { RestRouteBuilder } from './builder/rest-route.builder';
import { RestPathResolver } from './resolver/rest-path.resolver';

@Configuration
export class RestBootable extends Bootable {
  private server: FastifyInstance;

  constructor(
    private readonly serverBuilder: RestServerBuilder,
    private readonly routeBuilder: RestRouteBuilder,
    private readonly pathResolver: RestPathResolver
  ) {
    super();
  }

  async run(context: Context): Promise<{
    runner: Server;
    port: number;
  }> {
    const controllers = await context.withDecorator(Controller);
    const builder = await this.serverBuilder.builder();
    controllers.forEach(controller => {
      const routeBuilder = this.routeBuilder.builder(controller);
      const keys = Object.getOwnPropertyNames(Object.getPrototypeOf(controller));
      keys.forEach(key => {
        if (key !== 'constructor') {
          const method = controller[key];
          const path = this.pathResolver.resolve(controller, method);
          if (path) {
            routeBuilder.addPath(path);
          }
        }
      });
      builder.addRoute(routeBuilder.build());
    });
    this.server = await builder.start(3000);
    return {
      runner: this.server.server,
      port: 3000
    };
  }

  async close(): Promise<void> {
    await this.server?.close();
  }
}
