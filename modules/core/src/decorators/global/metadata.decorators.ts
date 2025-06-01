import { Type } from '../../context/provider/provider.type';
import { getMetadataReflection, getMultiMetadataReflection } from '../decorators.helper';

const design_parameters = 'design:paramtypes';
const design_return = 'design:returntype';
const design_type = 'design:type';

export const PutDesignParam = (
  target: object,
  param: Type<any>,
  propertyKey?: string | symbol | number,
  index?: number
) => {
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
    Reflect.defineMetadata(design_parameters, insert(params), target, propertyKey as string | symbol);
  } else Reflect.defineMetadata(design_parameters, insert(params), target);
};

export const PutDesignReturn = (target: object, param: Type<any>, propertyKey: string | symbol) => {
  Reflect.defineMetadata(design_return, param, target, propertyKey);
};

export const PutDesignType = (target: object, param: Type<any>, propertyKey: string | symbol) => {
  Reflect.defineMetadata(design_type, param, target, propertyKey);
};

export const retrieveParameterTypes = (target: Type<any>, propertyKey?: string | symbol) => {
  return getMultiMetadataReflection<Type<any>>(design_parameters, target, propertyKey);
};

export const retrieveDesignReturn = (target: Type<any>, propertyKey: string | symbol) => {
  return getMetadataReflection(design_return, target, propertyKey);
};

export const retrieveDesignType = (target: Type<any>, propertyKey: string | symbol) => {
  return getMetadataReflection(design_type, target, propertyKey);
};
