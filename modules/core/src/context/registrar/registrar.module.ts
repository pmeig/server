import { Module } from '../context.decorators';
import { ApplicationRegistrar } from './application.registrar';

@Module({
  providers: [ApplicationRegistrar]
})
export class RegistrarModule {}