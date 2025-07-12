import { Module } from '@pmeig/srv-core';
import { AuthModule } from './auths/auth.module';
import { GuardModule } from './guards/guard.module';
import { SecurityCoreModule } from './core/security-core.module';

@Module({
  imports: [AuthModule, GuardModule, SecurityCoreModule]
})
export class SecurityModule {}
