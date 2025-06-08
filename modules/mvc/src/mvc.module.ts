import { Module } from '@server/core';
import { RestBootable } from './rest/rest.boot';

@Module({
  providers: [RestBootable]
})
export class MvcModule {}
