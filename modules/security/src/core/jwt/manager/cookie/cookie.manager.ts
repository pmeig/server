import type { CookieOptions, Request, Response } from 'express';
import { CookieProperties } from './cookie.properties';
import { TokenManager } from '../../token.manager';
import { JwtProperties } from '../../jwt.properties';
import { Configuration } from '@pmeig/srv-core';
import { ApplicationProperties } from '@pmeig/srv-properties';
import { TokenMetadata } from '../../token';

const SUFFIX_LENGTH = 3;

@Configuration
export class CookieManager extends TokenManager {
  name: 'cookie';

  private readonly key: string;
  private readonly maxLength = 3500;

  constructor(
    jwtProperties: JwtProperties,
    applicationProperties: ApplicationProperties,
    private readonly cookieProperties: CookieProperties
  ) {
    super(jwtProperties);
    this.key = `authorization-${applicationProperties.name ?? 'pmeig'}`;
    this.maxLength -= this.key.length;
  }

  expose(token: TokenMetadata, res: Response) {
    const options = {
      httpOnly: this.cookieProperties.httpOnly,
      secure: this.cookieProperties.secure,
      sameSite: this.cookieProperties.sameSite,
      maxAge: token.expiresIn,
      domain:
        this.cookieProperties.domain ??
        res.req.header('Referer') ??
        res.req.header('Origin') ??
        res.req.header('Host')?.split(':')[0] ??
        res.req.hostname,
      signed: this.cookieProperties.signed
    };
    if (token.accessToken.length > this.maxLength) {
      return this.sendMultipleCookie(token, res, options);
    }
    return res.cookie(this.key, token.accessToken, options);
  }

  extract(req: Request): string | undefined {
    if (this.cookieProperties.signed) {
      if (!req.signedCookies) {
        return undefined;
      }
      if (req.signedCookies[this.key + '-0']) {
        return this.concatCookies(req.signedCookies);
      }
      return req.signedCookies[this.key] as string;
    }
    if (!req.cookies) {
      return undefined;
    }
    if (req.cookies[this.key + '-0']) {
      return this.concatCookies(req.cookies);
    }
    return req.cookies[this.key] as string;
  }

  private sendMultipleCookie(token: TokenMetadata, res: Response, options: CookieOptions) {
    const values = [token.accessToken];
    const maxLength = this.maxLength - SUFFIX_LENGTH;
    while (values[values.length - 1].length > maxLength) {
      const rest = values.pop();
      values.push(rest!.slice(0, maxLength));
      values.push(rest!.slice(maxLength));
    }
    values.forEach((value, index) => {
      const key = `${this.key}-${index}`;
      res.cookie(key, value, options);
    });
    return res;
  }

  private concatCookies(cookies: Record<string, any>) {
    let token = '';
    let index = 0;
    while (cookies[`${this.key}-${index}`]) {
      token += cookies[`${this.key}-${index}`];
      index++;
    }
    return token;
  }
}
