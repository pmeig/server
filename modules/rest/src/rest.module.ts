import { Module } from '@pmeig/srv-core';
import { RequestFactoryScoped } from './rest.scoped';
import { RestBootModule } from './boot/rest-boot.module';
import { AdvisorConverter } from './errors/advisor.converter';

@Module({
  imports: [RestBootModule],
  providers: [RequestFactoryScoped, AdvisorConverter]
})
export class RestModule {}
