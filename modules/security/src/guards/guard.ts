import { User } from '../models/user.model';
import { Request } from 'express';
import { AuthenticationException } from './authentication.exception';
import { HttpStatusClientError } from '@pmeig/srv-rest';
import { AsyncSync, Nullable } from '@pmeig/srv-core';

export abstract class Guard<T extends User = User> {
  abstract canActivate(request: Request, user: Nullable<T>): AsyncSync<boolean>;

  unauthorized(request: Request, user: Nullable<T>): AuthenticationException {
    return new AuthenticationException(
      100,
      HttpStatusClientError.NOT_FOUND,
      `Unauthorized on path ${request.path} for user: ${user?.name}`
    );
  }
}
