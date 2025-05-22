import { Type } from '@server/core';

const parameter_type = 'design:paramtypes';

export const PutParam = (target: object, param: Type<any>, propertyKey?: string | symbol | number, index?: number) => {
  if (typeof propertyKey === 'number') {
    index = propertyKey;
    propertyKey = undefined;
  }
  let insert = (types: Type<any>[]) => {
    types.push(param as Type<any>);
    return types;
  };
  if (index) {
    insert = types =>
      types
        .slice(0, index)
        .concat(param)
        .concat(...types.slice(index));
  }
  const params = retrieveParameterTypes(target as Type<any>, propertyKey);
  if (propertyKey) {
    Reflect.defineMetadata(parameter_type, insert(params), target, propertyKey);
  } else Reflect.defineMetadata(parameter_type, insert(params), target);
};

export const retrieveParameterTypes = (target: Type<any>, propertyKey?: string | symbol) => {
  if (propertyKey) {
    return (Reflect.getMetadata(parameter_type, target, propertyKey) as Type<any>[]) ?? [];
  }
  return (Reflect.getMetadata(parameter_type, target) as Type<any>[]) ?? [];
};
