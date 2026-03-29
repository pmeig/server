import { ClassDecorator, Decorators, getMetadataReflection, reflectUpdate } from '@pmeig/srv-core';

const DATASOURCE_NAME = 'data::datasource'

export const DataSource = (name?: string) =>
  Decorators.all('DataSource', (target, propertyKey) => {
    reflectUpdate(() => name ?? 'default', DATASOURCE_NAME, target, propertyKey);
  }) as ClassDecorator & MethodDecorator

export const retrieveDataSourceName = (target: any, propertyKey?: string | symbol) =>{
  const datasourceName = getMetadataReflection(DATASOURCE_NAME, target, propertyKey) as string;
  return datasourceName.slice(0, 1).toUpperCase() + datasourceName.slice(1);
}
