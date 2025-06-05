import { Configuration, Decorators } from '@server/core';
import { RequestMapper } from './rest';

export const Controller = (path: string) =>
  Decorators.class('Controller', target => {
    Configuration(target);
    (RequestMapper(path) as ClassDecorator)(target);
  });
export const Get = (path: string) =>
  Decorators.method('Get', (target, propertyKey, descriptor) => {
    RequestMapper(path, 'GET')(target, propertyKey, descriptor);
  });
export const Post = (path: string) =>
  Decorators.method('Post', (target, propertyKey, descriptor) => {
    RequestMapper(path, 'POST')(target, propertyKey, descriptor);
  });
export const Put = (path: string) =>
  Decorators.method('Put', (target, propertyKey, descriptor) => {
    RequestMapper(path, 'PUT')(target, propertyKey, descriptor);
  });
export const Patch = (path: string) =>
  Decorators.method('Patch', (target, propertyKey, descriptor) => {
    RequestMapper(path, 'PATCH')(target, propertyKey, descriptor);
  });
export const Delete = (path: string) =>
  Decorators.method('Delete', (target, propertyKey, descriptor) => {
    RequestMapper(path, 'DELETE')(target, propertyKey, descriptor);
  });
