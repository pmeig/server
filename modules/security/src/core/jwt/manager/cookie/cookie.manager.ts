import type { RestRequest, RestResponse } from '@pmeig/srv-rest';
import { CookieProperties } from './cookie.properties';
import { CookieWriteOptions, writeCookie } from './cookie.writer';
import { TokenManager } from '../../token.manager';
import { JwtProperties } from '../../jwt.properties';
import { Configuration } from '@pmeig/srv-core';
import { ApplicationProperties } from '@pmeig/srv-properties';
import { TokenMetadata } from '../../token';

const SUFFIX_LENGTH = 3;

// filled by cookie-parser (see CookieParserMiddleware)
type CookieRequest = RestRequest & { cookies?: Record<string, any>; signedCookies?: Record<string, any> };

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

  expose(token: TokenMetadata, res: RestResponse) {
    const options: CookieWriteOptions = {
      httpOnly: this.cookieProperties.httpOnly,
      secure: this.cookieProperties.secure,
      sameSite: this.cookieProperties.sameSite,
      maxAge: token.expiresIn,
      domain:
        this.cookieProperties.domain ??
        res.request.headers.referer ??
        res.request.headers.origin ??
        res.request.headers.host?.split(':')[0] ??
        res.request.hostname.split(':')[0],
      signed: this.cookieProperties.signed,
      secret: this.cookieProperties.sign
    };
    if (token.accessToken.length > this.maxLength) {
      return this.sendMultipleCookie(token, res, options);
    }
    return writeCookie(res, this.key, token.accessToken, options);
  }

  extract(request: RestRequest): string | undefined {
    const req = request as CookieRequest;
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

  private sendMultipleCookie(token: TokenMetadata, res: RestResponse, options: CookieWriteOptions) {
    const values = [token.accessToken];
    const maxLength = this.maxLength - SUFFIX_LENGTH;
    while (values[values.length - 1].length > maxLength) {
      const rest = values.pop();
      values.push(rest!.slice(0, maxLength));
      values.push(rest!.slice(maxLength));
    }
    values.forEach((value, index) => {
      const key = `${this.key}-${index}`;
      writeCookie(res, key, value, options);
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
