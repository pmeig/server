import { Configuration, Internal } from '@pmeig/srv-core';
import express, { ErrorRequestHandler, Express, json, urlencoded } from 'express';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { RestMiddlewareResolver } from '../resolver/rest-middleware.resolver';
import { RestRoute } from './rest-route.builder';

@Configuration
@Internal
export class RestServerBuilder {
  private server: Express;
  private errorMiddleware: ErrorRequestHandler[];
  constructor(private readonly middlewareResolver: RestMiddlewareResolver) {}

  builder() {
    this.server = express();
    this.server.use(compression());
    this.server.use(json());
    this.server.use(urlencoded({ extended: true }));
    const middlewares = this.middlewareResolver.resolveServer();
    middlewares.middlewares.unshift(
      rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 200,
        standardHeaders: true,
        legacyHeaders: false
      })
    );
    this.errorMiddleware = middlewares.errorMiddlewares;
    this.server.use(...middlewares.middlewares);
    return this;
  }

  addRoute(route: RestRoute) {
    this.server.use(route.path, route.handler);
  }

  start(port: number) {
    if (this.errorMiddleware.length > 0) this.server.use(...this.errorMiddleware);
    return this.server.listen(port, () => {
      console.log(`Server started on port ${port}`);
    });
  }
}
