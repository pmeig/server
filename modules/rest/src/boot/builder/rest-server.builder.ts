import { Configuration } from '@pmeig/srv-core';
import Fastify, { FastifyInstance } from 'fastify';
import compress from '@fastify/compress';
import formbody from '@fastify/formbody';
import rateLimit from '@fastify/rate-limit';
import qs from 'qs';
import { RestMiddlewareResolver } from '../resolver/rest-middleware.resolver';
import { RestRoute } from './rest-route.builder';
import { chainErrorHandlers, chainHandlers } from '../../http/http.chain';

const BODY_LIMIT = 100 * 1024;
const RATE_LIMIT = { max: 200, timeWindow: 15 * 60 * 1000 };

@Configuration
export class RestServerBuilder {
  private server: FastifyInstance;
  constructor(private readonly middlewareResolver: RestMiddlewareResolver) {}

  async builder() {
    this.server = Fastify({
      bodyLimit: BODY_LIMIT,
      // express routing is not strict about the trailing slash
      routerOptions: { ignoreTrailingSlash: true }
    });
    await this.server.register(compress);
    await this.server.register(formbody, { parser: (body: string) => qs.parse(body) });
    await this.server.register(rateLimit, { ...RATE_LIMIT, enableDraftSpec: true });

    const middlewares = this.middlewareResolver.resolveServer();
    // preHandler (and not onRequest) so that the middlewares can read the parsed body
    if (middlewares.middlewares.length > 0) {
      this.server.addHook('preHandler', chainHandlers(middlewares.middlewares));
    }
    if (middlewares.errorMiddlewares.length > 0) {
      this.server.setErrorHandler(chainErrorHandlers(middlewares.errorMiddlewares));
    }
    return this;
  }

  addRoute(route: RestRoute) {
    route.paths.forEach(path => {
      const middlewares = [...route.middlewares, ...path.middlewares];
      const errorMiddlewares = [...path.errorMiddlewares, ...route.errorMiddlewares];
      this.server.route({
        method: path.method,
        url: route.path + path.path || '/',
        config: { rest: path.context },
        ...(middlewares.length > 0 && { preHandler: chainHandlers(middlewares) }),
        ...(errorMiddlewares.length > 0 && { errorHandler: chainErrorHandlers(errorMiddlewares) }),
        handler: path.handler
      });
    });
  }

  async start(port: number) {
    await this.server.listen({ port, host: '0.0.0.0' });
    console.log(`Server started on port ${port}`);
    return this.server;
  }
}
