import { After, Before, Configuration } from '@pmeig/srv-core';
import { RestMiddleware } from '@pmeig/srv-rest';
import type { RestNext, RestRequest } from '@pmeig/srv-rest';
import { TokenManager } from '../core/jwt/token.manager';
import { JwtService } from '../core/jwt/jwt.service';
import { SECURITY_USER_FIELD_NAME } from '../core/security.constant';
import { IssuerProvider } from '../models/issuer.model';
import { CookieParserMiddleware } from '../core/jwt/manager/cookie/cookie-parser.middleware';
import { GuardMiddleware } from '../guards/guard.middleware';

@Configuration
@After(CookieParserMiddleware)
@Before(GuardMiddleware)
export class AuthMiddleware extends RestMiddleware {
  constructor(
    private readonly tokenManager: TokenManager,
    private readonly jwtService: JwtService,
    private readonly issuerProvider: IssuerProvider
  ) {
    super();
  }

  use(request: RestRequest, next: RestNext): void | Promise<void> {
    const token = this.tokenManager.extract(request);
    request[SECURITY_USER_FIELD_NAME] = token
      ? this.jwtService.decode(token, this.issuerProvider.getIssuer())
      : undefined;
    next();
  }
}
