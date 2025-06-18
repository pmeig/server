import { Module } from '@server/core';
import { RestBootable } from './rest.boot';
import { RestServerBuilder } from './builder/rest-server.builder';
import { RestRouteBuilder } from './builder/rest-route.builder';
import { RestMiddlewareResolver } from './resolver/rest-middleware.resolver';
import { RestPathResolver } from './resolver/rest-path.resolver';
import { ExpressParameterResolver } from './resolver/expressParameterResolver';

@Module({
  providers: [
    RestBootable,
    RestServerBuilder,
    RestRouteBuilder,
    RestMiddlewareResolver,
    RestPathResolver,
    ExpressParameterResolver
  ]
})
export class RestBootModule {}
