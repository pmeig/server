import { Component, Module, Nullable, Order } from '@pmeig/srv-core';
import { GuardMiddleware } from './guard.middleware';
import { Guard } from './guard';
import { User } from '../models/user.model';
import { retrieveControllerCreator } from '@pmeig/srv-rest';
import type { RestRequest } from '@pmeig/srv-rest';
import { retrieveGuard } from '../decorators/security-service.decorators';

@Order(Number.MAX_SAFE_INTEGER)
@Component
export class DecoratorGuard extends Guard {
  canActivate(request: RestRequest, user: Nullable<User>): boolean {
    const controllerResolver = retrieveControllerCreator();
    if (!controllerResolver) {
      return false;
    }
    let guard = retrieveGuard(controllerResolver.controller as object, controllerResolver.method);
    if (!guard) {
      guard = retrieveGuard(controllerResolver.controller as object);
    }
    if (guard) {
      return (
        user?.authorities.some(authority => guard(authority)) ??
        guard({
          name: ''
        })
      );
    }
    return !!user;
  }
}

@Module({
  providers: [GuardMiddleware, DecoratorGuard]
})
export class GuardModule {}
