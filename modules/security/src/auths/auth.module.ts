import { Module } from '@pmeig/srv-core';
import { AuthController } from './auth.controller';
import { OidcModule } from './oidc/oidc.module';
import { AuthMiddleware } from './auth.middleware';
import { NoneModule } from './none/none.module';

@Module({
  providers: [AuthController, AuthMiddleware],
  imports: [OidcModule, NoneModule]
})
export class AuthModule {}
