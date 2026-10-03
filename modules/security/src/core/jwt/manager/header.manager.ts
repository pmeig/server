import type { RestRequest, RestResponse } from '@pmeig/srv-rest';
import { JwtProperties } from '../jwt.properties';
import { TokenManager } from '../token.manager';
import { Configuration } from '@pmeig/srv-core';
import { ConditionalProperties } from '@pmeig/srv-properties';
import { TokenMetadata } from '../token';

@Configuration
@ConditionalProperties('jwt.expose.type', 'header')
export class HeaderManager extends TokenManager {
  name: 'header';
  private readonly key = 'Authorization';

  constructor(jwtProperties: JwtProperties) {
    super(jwtProperties);
  }

  expose(token: TokenMetadata, res: RestResponse) {
    return res.header(this.key, `${this.jwtProperties.expose.prefix.trimEnd()} ${token.accessToken}`);
  }

  extract(req: RestRequest): string | undefined {
    const header = req.headers[this.key.toLowerCase()];
    const token = Array.isArray(header) ? header[0] : header;
    if (!token) {
      return undefined;
    }
    return token.replace(this.jwtProperties.expose.prefix, '').trim();
  }
}
