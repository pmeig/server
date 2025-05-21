import { ParameterDecorator } from '@server/core';

const optional_key = 'param:optional';

export const Optional: ParameterDecorator = (target, propertyKey, parameterIndex) => {
  let handlerOptional = {
    get: () => Reflect.getMetadata(optional_key, target) as number[] | undefined,
    set: (optionals: number[]) => Reflect.defineMetadata(optional_key, optionals, target),
  };
  if (propertyKey) {
    handlerOptional = {
      get: () => Reflect.getMetadata(optional_key, target, propertyKey) as number[] | undefined,
      set: optional => Reflect.defineMetadata(optional_key, optional, target, propertyKey),
    };
  }
  const optionals = handlerOptional.get() ?? [];
  optionals.push(parameterIndex);
  handlerOptional.set(optionals);
};

export const retrieveOptionals = (target: object, propertyKey?: string | symbol) => {
  return (
    ((propertyKey
      ? Reflect.getMetadata(optional_key, target, propertyKey)
      : Reflect.getMetadata(optional_key, target)) as number[] | undefined) ?? []
  );
};
