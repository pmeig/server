import { Decorators, getMetadataReflection, reflectMetadataContext, Type } from '@server/core';
import { Method } from './rest.type';

const rest_key = 'rest:mapper';

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
