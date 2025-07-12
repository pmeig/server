import { getMetadataReflection } from '@pmeig/srv-core';
import { Authority } from '../models/user.model';

export const security_guard = 'security:guard';

export type GuardAuthorities = (authority: Authority) => boolean;

export const retrieveGuard = (target: object, propertyKey?: string | symbol) =>
  getMetadataReflection<GuardAuthorities>(security_guard, target, propertyKey);
