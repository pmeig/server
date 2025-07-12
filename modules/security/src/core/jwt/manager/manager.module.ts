import { Module } from '@pmeig/srv-core';
import { BodyManager } from './body.manager';
import { HeaderManager } from './header.manager';
import { CookieModule } from './cookie/cookie.module';

@Module({
  providers: [BodyManager, HeaderManager],
  imports: [CookieModule]
})
export class JwtManagerModule {}
