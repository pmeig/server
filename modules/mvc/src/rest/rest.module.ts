import { Module } from '@server/core';
import { RestBootable } from './rest.boot';
import { RequestFactoryScoped, RequestGeneratorId } from './rest.scoped';

@Module({
  providers: [RestBootable, RequestFactoryScoped, RequestGeneratorId]
})
export class RestModule {}
