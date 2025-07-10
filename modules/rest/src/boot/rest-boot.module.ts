import { Module } from '@pmeig/srv-core';
import { RestBootable } from './rest.boot';
import { RestServerBuilder } from './builder/rest-server.builder';
import { RestRouteBuilder } from './builder/rest-route.builder';
import { RestMiddlewareResolver } from './resolver/rest-middleware.resolver';
import { RestPathResolver } from './resolver/rest-path.resolver';
import { ExpressParameterResolver } from './resolver/express-parameter.resolver';
import { RequestGeneratorId } from '../rest.scoped';

@Module({
  providers: [
    RestBootable,
    RestServerBuilder,
    RestRouteBuilder,
    RestMiddlewareResolver,
    RestPathResolver,
    ExpressParameterResolver,
    RequestGeneratorId
  ]
})
export class RestBootModule {}
