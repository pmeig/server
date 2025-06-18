import { Bootable, Configuration, Context, Internal } from '@server/core';
import { Controller } from '../decorators/rest.decorators';
import { Server } from 'http';
import { RestServerBuilder } from './builder/rest-server.builder';
import { RestRouteBuilder } from './builder/rest-route.builder';
import { RestPathResolver } from './resolver/rest-path.resolver';

@Configuration
@Internal
export class RestBootable extends Bootable {
  private runner: Server;

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
    const builder = this.serverBuilder.builder();
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
    this.runner = builder.start(3000);
    return {
      runner: this.runner,
      port: 3000
    };
  }

  close(): Promise<void> | void {
    this.runner.close();
  }
}
