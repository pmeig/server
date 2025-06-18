import { Module } from '@server/core';
import { RequestFactoryScoped, RequestGeneratorId } from './rest.scoped';
import { RestBootModule } from './boot/rest-boot.module';
import { AdvisorConverter } from './errors/advisor.converter';

@Module({
  imports: [RestBootModule],
  providers: [RequestFactoryScoped, RequestGeneratorId, AdvisorConverter]
})
export class RestModule {}
