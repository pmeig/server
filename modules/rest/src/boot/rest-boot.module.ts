import { Module } from '@pmeig/srv-core';
import { RestBootable } from './rest.boot';
import { RestServerBuilder } from './builder/rest-server.builder';
import { RestRouteBuilder } from './builder/rest-route.builder';
import { RestMiddlewareResolver } from './resolver/rest-middleware.resolver';
import { RestPathResolver } from './resolver/rest-path.resolver';
import { RestParameterResolver } from './resolver/rest-parameter.resolver';
import { RequestGeneratorId } from '../rest.scoped';
import { RestControllerMiddleware } from './rest-controller.middleware';
import { RestControllerResolver } from './resolver/rest-controller.resolver';

@Module({
  providers: [
    RestBootable,
    RestControllerMiddleware,
    RestControllerResolver,
    RestServerBuilder,
    RestRouteBuilder,
    RestMiddlewareResolver,
    RestPathResolver,
    RestParameterResolver,
    RequestGeneratorId
  ]
})
export class RestBootModule {}
