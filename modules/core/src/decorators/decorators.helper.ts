import { getPropsOf, Nullable } from '../helper/type.helper';
import { DecoratorRef } from './type.decorators';
import { hasDecorator } from './decorator.builder';
import { Type } from '../context/provider/provider.type';

export const reflectMultiUpdate = <T = any>(
  handler: (items: T[]) => T[],
  key: string,
  target: object,
  propertyKey?: string | symbol
) => {
  const metadata = reflectMetadataContext<T[]>(key, target, propertyKey);
  const items = metadata.get() ?? [];
  const updated = handler(items);
  metadata.set(updated);
  return updated;
};

export const reflectUpdate = <T>(
  handler: (item: Nullable<T>) => Nullable<T>,
  key: string,
  target: object,
  propertyKey?: string | symbol
) => {
  const metadata = reflectMetadataContext<T>(key, target, propertyKey);
  const item = metadata.get();
  const updated = handler(item);
  metadata.set(updated);
};

export const reflectMultiMetadataContext = <T = any>(key: string, target: object, propertyKey?: string | symbol) => {
  const handler = reflectMetadataContext<T[]>(key, target, propertyKey);
  return {
    get: () => handler.get() ?? [],
    set: (metadata: T[]) => handler.set(metadata)
  };
};

export const reflectMetadataContext = <T = any>(key: string, target: object, propertyKey?: string | symbol) => {
  if (propertyKey) {
    return {
      get: () => getMetadataReflection<T>(key, target, propertyKey),
      set: (metadata: Nullable<T>) => {
        Reflect.defineMetadata(key, metadata, target, propertyKey);
      }
    };
  }
  return {
    get: () => getMetadataReflection<T>(key, target, propertyKey),
    set: (metadata: Nullable<T>) => Reflect.defineMetadata(key, metadata, target)
  };
};

export const getMultiMetadataReflection = <T = any>(key: string, target: object, propertyKey?: string | symbol) => {
  return getMetadataReflection<T[]>(key, target, propertyKey) ?? [];
};

export const getMetadataReflection = <T = any>(key: string, target: object, propertyKey?: string | symbol) => {
  return (
    propertyKey ? Reflect.getMetadata(key, target, propertyKey) : Reflect.getMetadata(key, target)
  ) as Nullable<T>;
};

export const getMethodWithDecorator = (target: Type<any>, decorator: DecoratorRef | string) => {
  return getPropsOf(target).filter(name => hasDecorator(target, decorator, name));
};
