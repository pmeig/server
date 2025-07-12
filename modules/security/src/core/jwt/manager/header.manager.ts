import { Request, Response } from 'express';
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

  expose(token: TokenMetadata, res: Response) {
    return res.setHeader(this.key, `${this.jwtProperties.expose.prefix.trimEnd()} ${token.accessToken}`);
  }

  extract(req: Request): string | undefined {
    const token = req.header(this.key);
    if (!token) {
      return undefined;
    }
    return token.replace(this.jwtProperties.expose.prefix, '').trim();
  }
}
