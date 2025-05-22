import { ParameterDecorator, ProviderToken } from '@server/core';
import { getMultiMetadataReflection, reflectMultiMetadataContext } from '../decorators.helper';

const optional_key = 'param:optional';
const list_key = 'param:list';

export interface ParameterListTyped {
  index: number;
  type: ProviderToken<any>;
}

export const List: (name: ProviderToken<any>) => ParameterDecorator =
  name => (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) => {
    const handlerList = reflectMultiMetadataContext<ParameterListTyped>(list_key, target, propertyKey);
    const listed = handlerList.get();
    listed.push({
      index: parameterIndex,
      type: name,
    });
    handlerList.set(listed);
  };

export const Optional: ParameterDecorator = (
  target: object,
  propertyKey: string | symbol | undefined,
  parameterIndex: number
) => {
  const handlerOptional = reflectMultiMetadataContext<number>(optional_key, target, propertyKey);
  const optionals = handlerOptional.get();
  optionals.push(parameterIndex);
  handlerOptional.set(optionals);
};

export const retrieveElementTypes = (target: object, propertyKey?: string | symbol) => {
  return getMultiMetadataReflection<ParameterListTyped>(list_key, target, propertyKey);
};

export const retrieveOptionals = (target: object, propertyKey?: string | symbol) => {
  return getMultiMetadataReflection<number>(optional_key, target, propertyKey);
};
