import { ClassDecorator, Decorators, reflectUpdate, Type } from '@pmeig/srv-core';
import { GuardAuthorities, security_guard } from './security-service.decorators';
import { Authority } from '../models/user.model';

const securityGuardReflection = (name: string, operator: '&&' | '||' | string, authorities: string[], not: boolean) =>
  Decorators.all(name, (target, propertyKey) => {
    if (!['&&', '||'].includes(operator)) {
      authorities.push(operator);
      operator = '||';
    }
    let control = (authority: Authority) => authorities.includes(authority.name);
    if (operator === '&&') {
      control = (authority: Authority) => authorities.every(a => a === authority.name);
    }
    let compare = (authority: Authority) => control(authority);
    if (not) {
      compare = (authority: Authority) => !control(authority);
    }
    UseGuard(authority => compare(authority))(target as Type<any>, propertyKey);
  }) as (target: Type<any>, propertyKey?: string | symbol) => void;

const SecurityDecorators = Object.freeze({
  some: (name: string, ...authorities: string[]) => securityGuardReflection(name, '||', authorities, false),
  notSome: (name: string, ...authorities: string[]) => securityGuardReflection(name, '||', authorities, true),
  every: (name: string, ...authorities: string[]) => securityGuardReflection(name, '&&', authorities, false),
  notEvery: (name: string, ...authorities: string[]) => securityGuardReflection(name, '&&', authorities, true)
});

export const Public = Decorators.all('Public', (target, propertyKey) => {
  setTimeout(() => {
    reflectUpdate<GuardAuthorities>(() => () => true, security_guard, target, propertyKey);
  }, 250);
}) as ClassDecorator & MethodDecorator;

export const UseGuard = (check: (authority: Authority) => boolean) =>
  Decorators.all('UseGuard', (target, propertyKey) => {
    reflectUpdate<GuardAuthorities>(
      item => {
        if (!item) {
          return check;
        }
        return authority => check(authority) && item(authority);
      },
      security_guard,
      target,
      propertyKey
    );
  }) as (target: Type<any>, propertyKey?: string | symbol) => void;

const applyPrefixRole = (roles: string[]) => roles.map(role => `ROLE_${role}`);

export const Role = (...roles: string[]) => SecurityDecorators.some('Role', ...applyPrefixRole(roles));

export const NotRole = (...roles: string[]) => SecurityDecorators.notSome('Role', ...applyPrefixRole(roles));

export const AllRole = (...roles: string[]) => SecurityDecorators.every('Role', ...applyPrefixRole(roles));

export const NotAllRole = (...roles: string[]) => SecurityDecorators.notEvery('Role', ...applyPrefixRole(roles));

export const Feature = (...features: string[]) => SecurityDecorators.some('Feature', ...features);

export const NotFeature = (...features: string[]) => SecurityDecorators.notSome('Feature', ...features);

export const AllFeature = (...features: string[]) => SecurityDecorators.every('Feature', ...features);

export const NotAllFeature = (...features: string[]) => SecurityDecorators.notEvery('Feature', ...features);
