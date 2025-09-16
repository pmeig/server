import { CookieProperties } from './cookie.properties';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { Before, Configuration } from '@pmeig/srv-core';
import { RestMiddleware } from '@pmeig/srv-rest';
import { GuardMiddleware } from '../../../../guards/guard.middleware';

@Configuration
@Before(GuardMiddleware)
export class CookieParserMiddleware extends RestMiddleware {
  global = true;
  private parser: RequestHandler;

  constructor(private readonly cookieProperties: CookieProperties) {
    super();
  }

  use(req: Request, next: NextFunction, res: Response) {
    if (!this.parser) {
      if (this.cookieProperties.signed) {
        this.parser = cookieParser(this.cookieProperties.sign);
      } else {
        this.parser = (_, _res, next) => next();
      }
    }
    this.parser(req, res, next);
  }
}
