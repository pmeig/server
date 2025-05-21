import { Type } from '@server/core';

const parameter_type = 'design:paramtypes';

export const retrieveParameterTypes = (target: object, propertyKey?: string | symbol) => {
  if (propertyKey) {
    return Reflect.getMetadata(parameter_type, target, propertyKey) as Type<any>[];
  }
  return Reflect.getMetadata(parameter_type, target) as Type<any>[];
};
