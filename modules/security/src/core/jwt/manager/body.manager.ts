import type { RestRequest, RestResponse } from '@pmeig/srv-rest';
import { CookieProperties } from './cookie/cookie.properties';
import { JwtProperties } from '../jwt.properties';
import { TokenManager } from '../token.manager';
import { HeaderManager } from './header.manager';
import { CookieManager } from './cookie/cookie.manager';
import { ApplicationProperties, ConditionalProperties } from '@pmeig/srv-properties';
import { TokenMetadata } from '../token';
import { Configuration } from '@pmeig/srv-core';

@Configuration
@ConditionalProperties('jwt.expose.type', 'body')
export class BodyManager extends TokenManager {
  name: 'body';
  private readonly header: HeaderManager;
  private readonly cookie: CookieManager;
  constructor(
    jwtProperties: JwtProperties,
    applicationProperties: ApplicationProperties,
    cookieProperties: CookieProperties
  ) {
    super(jwtProperties);
    this.header = new HeaderManager(jwtProperties);
    this.cookie = new CookieManager(jwtProperties, applicationProperties, cookieProperties);
  }

  expose(token: TokenMetadata, res: RestResponse) {
    return res.send(token);
  }

  extract(req: RestRequest): string | undefined {
    return this.header.extract(req) ?? this.cookie.extract(req);
  }
}
