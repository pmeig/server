import { getMetadataReflection } from '@pmeig/srv-core';
import { Authority } from '../models/user.model';

export const security_guard = 'security:guard';
export const security_public = 'security:public';

export type GuardAuthorities = (authority: Authority) => boolean;

const publicGuard: GuardAuthorities = () => true;

// `@Public` wins over any other guard decorator of the same target, whatever the order of the decorators
export const retrieveGuard = (target: object, propertyKey?: string | symbol) =>
  getMetadataReflection<boolean>(security_public, target, propertyKey)
    ? publicGuard
    : getMetadataReflection<GuardAuthorities>(security_guard, target, propertyKey);
