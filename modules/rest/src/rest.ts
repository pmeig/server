import { Decorators, getMetadataReflection, reflectMetadataContext, Type } from '@server/core';
import { Method } from './rest.type';
import { RequestHandler } from 'express';
import { ExpressMiddleware } from './rest.middleware';

const rest_key = 'rest:mapper';
const rest_middleware_key = 'rest:middleware';

export interface RestMapper {
  path: string;
  pathParams: string[];
  method: Method;
}

export const RequestMapper = (path: string, method: Method = 'GET') =>
  Decorators.all('RequestMapper', (target, propertyKey) => {
    const metadata = reflectMetadataContext<RestMapper>(rest_key, target, propertyKey);
    metadata.set({ path, pathParams: path.split('/').filter(param => param.startsWith(':')), method });
  }) as ClassDecorator & MethodDecorator;

export const retrieveRestConfig = (target: Type<any>, propertyKey?: string | symbol) =>
  getMetadataReflection<RestMapper>(rest_key, target, propertyKey);

export const insertMiddleware = (middleware: RequestHandler): ClassDecorator | MethodDecorator =>
  Decorators.concat<ClassDecorator | MethodDecorator>((target: Type<any>, propertyKey?: string | symbol) => {
    reflectMetadataContext(rest_middleware_key, target, propertyKey).set(middleware);
  });

export const retrieveMiddleware = (target: Type<any>, propertyKey?: string | symbol) =>
  getMetadataReflection<ExpressMiddleware>(rest_middleware_key, target, propertyKey);
