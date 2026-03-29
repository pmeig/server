import { Decorators, getMetadataReflection, reflectUpdate, Type } from '@pmeig/srv-core';
import { DataSource } from './datasource.decorator';

const QUERY_REFLECT_KEY = 'data::query';

export const Query = (query: string, datasource: string = 'default') =>
  Decorators.method('Query', (target, propertyKey, descriptor) => {
    DataSource(datasource)(target, propertyKey, descriptor);
    reflectUpdate(() => query, QUERY_REFLECT_KEY, target, propertyKey);
  });


export const retrieveQuery = (target: Type<any>, propertyKey: string | symbol) =>
  getMetadataReflection<string>(QUERY_REFLECT_KEY, target, propertyKey);
