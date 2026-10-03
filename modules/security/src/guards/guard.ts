import { User } from '../models/user.model';
import { AuthenticationException } from './authentication.exception';
import { HttpStatusClientError, requestPath } from '@pmeig/srv-rest';
import type { RestRequest } from '@pmeig/srv-rest';
import { AsyncSync, Nullable } from '@pmeig/srv-core';

export abstract class Guard<T extends User = User> {
  abstract canActivate(request: RestRequest, user: Nullable<T>): AsyncSync<boolean>;

  unauthorized(request: RestRequest, user: Nullable<T>): AuthenticationException {
    return new AuthenticationException(
      100,
      HttpStatusClientError.NOT_FOUND,
      `Unauthorized on path ${requestPath(request)} for user: ${user?.name}`
    );
  }
}
