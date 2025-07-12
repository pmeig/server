import { After, Configuration, List, Optional, Order, toPromise } from '@pmeig/srv-core';
import { RestControllerMiddleware, RestMiddleware } from '@pmeig/srv-rest';
import { NextFunction, Request } from 'express';
import { Guard } from './guard';
import { SECURITY_USER_FIELD_NAME } from '../core/security.constant';
import { AuthenticationException } from './authentication.exception';

@Configuration
@After(RestControllerMiddleware)
@Order(Number.MIN_SAFE_INTEGER)
export class GuardMiddleware extends RestMiddleware {
  global = true;
  constructor(@List(Guard) @Optional private readonly guards: Guard[]) {
    super();
  }

  async use(request: Request, next: NextFunction): Promise<void> {
    const user = request[SECURITY_USER_FIELD_NAME];
    let max = this.guards.length;
    let exception: AuthenticationException | undefined = undefined;
    while (!exception && max-- > 0) {
      const guard = this.guards[max];
      const check = (await toPromise(guard.canActivate(request, user)))!;
      if (!check) {
        max = 0;
        exception = guard.unauthorized(request, user);
      }
    }
    next(exception);
  }
}
