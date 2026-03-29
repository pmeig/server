import { Decorators, getMetadataReflection, reflectMultiUpdate, reflectUpdate, Type } from '@pmeig/srv-core';

const PARAM_REFLECT_KEY = 'data::param';

export const Param = (name: string) => Decorators.parameter.method('Param', (target, propertyKey, parameterIndex) => {
  reflectUpdate<Record<string, number>>( acc => {
    if (!acc) {
      acc = {};
    }
    acc[name] = parameterIndex;
    return acc;
  }, PARAM_REFLECT_KEY, target, propertyKey)
});

export const retrieveParam = (target: Type<any>, propertyKey: string | symbol) => {
  return getMetadataReflection<Record<string, number>>(PARAM_REFLECT_KEY, target, propertyKey) ?? {};
}