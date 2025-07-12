import { ConditionalProperties } from '@pmeig/srv-properties';
import { Module } from '@pmeig/srv-core';
import { CookieManager } from './cookie.manager';
import { CookieProperties } from './cookie.properties';
import { CookieParserMiddleware } from './cookie-parser.middleware';

@Module({
  providers: [CookieManager, CookieProperties, CookieParserMiddleware]
})
@ConditionalProperties('security.jwt.expose', 'cookie', true)
export class CookieModule {}
