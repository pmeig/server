import { Module } from '@pmeig/srv-core';
import { JwtModule } from './jwt/jwt.module';
import { ValidatorProperties } from './validator.properties';
import { UserProvider } from './user.provider';

@Module({
  imports: [JwtModule],
  providers: [ValidatorProperties, UserProvider]
})
export class SecurityCoreModule {}
