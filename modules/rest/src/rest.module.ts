import { Module } from '@server/core';
import { RestBootable } from './rest.boot';
import { RequestFactoryScoped, RequestGeneratorId } from './rest.scoped';
import { ExpressResolver } from './decorators/express.resolver';

@Module({
  providers: [RestBootable, RequestFactoryScoped, RequestGeneratorId, ExpressResolver]
})
export class RestModule {}
