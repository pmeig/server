import { CookieProperties } from './cookie.properties';
import cookieParser from 'cookie-parser';
import { Before, Configuration } from '@pmeig/srv-core';
import { RestMiddleware } from '@pmeig/srv-rest';
import type { RestNext, RestRequest, RestResponse } from '@pmeig/srv-rest';
import { GuardMiddleware } from '../../../../guards/guard.middleware';

@Configuration
@Before(GuardMiddleware)
export class CookieParserMiddleware extends RestMiddleware {
  global = true;
  // cookie-parser only relies on the node request (headers) and works as is on a Fastify request
  private parser: (req: any, res: any, next: (error?: unknown) => void) => void;

  constructor(private readonly cookieProperties: CookieProperties) {
    super();
  }

  use(req: RestRequest, next: RestNext, res: RestResponse) {
    if (!this.parser) {
      // without a secret cookie-parser still fills `request.cookies`, it only skips `request.signedCookies`
      this.parser = cookieParser(this.cookieProperties.signed ? this.cookieProperties.sign : undefined);
    }
    this.parser(req, res, next);
  }
}
