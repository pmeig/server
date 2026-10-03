import { Configuration } from '@pmeig/srv-core';
import Fastify, { FastifyInstance } from 'fastify';
import compress from '@fastify/compress';
import formbody from '@fastify/formbody';
import rateLimit from '@fastify/rate-limit';
import qs from 'qs';
import { RestMiddlewareResolver } from '../resolver/rest-middleware.resolver';
import { RestRoute } from './rest-route.builder';
import { chainErrorHandlers, chainHandlers } from '../../http/http.chain';

// 200 requests per client every 15 minutes
const RATE_LIMIT = { max: 200, timeWindow: 15 * 60 * 1000 };

@Configuration
export class RestServerBuilder {
  private server: FastifyInstance;
  constructor(private readonly middlewareResolver: RestMiddlewareResolver) {}

  async builder() {
    this.server = Fastify({
      // built-in Pino logger: one structured log line per request and response, and the listening address
      logger: true,
      // REST clients send `/users/` as often as `/users`: serve both instead of answering 404
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
    route.paths.forEach(restPath => {
      const middlewares = [...route.middlewares, ...restPath.middlewares];
      const errorMiddlewares = [...restPath.errorMiddlewares, ...route.errorMiddlewares];
      this.server.route({
        method: restPath.method,
        url: route.configPath + restPath.configPath || '/',
        config: { rest: restPath.context },
        ...(middlewares.length > 0 && { preHandler: chainHandlers(middlewares) }),
        ...(errorMiddlewares.length > 0 && { errorHandler: chainErrorHandlers(errorMiddlewares) }),
        handler: restPath.handler
      });
    });
  }

  async start(port: number) {
    // 0.0.0.0 to be reachable from outside a container, Fastify only listens on localhost by default
    await this.server.listen({ port, host: '0.0.0.0' });
    return this.server;
  }
}
