import { Module } from '@server/core';
import { RestBootable } from './rest/rest.configuration';

@Module({
  providers: [RestBootable]
})
export class MvcModule {}
