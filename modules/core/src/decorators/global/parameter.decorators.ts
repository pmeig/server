import {
  getMetadataReflection,
  getMultiMetadataReflection,
  reflectMultiMetadataContext,
  reflectUpdate
} from '../decorators.helper';
import { ProviderToken } from '../../context/provider/provider.type';
import { Decorators } from '../decorator.builder';
import { DecoratorRef } from '../type.decorators';

const optional_key = 'param:optional';
const list_key = 'param:list';
const decorator_key = 'param:decorator';

export interface ParameterListTyped {
  index: number;
  type: ProviderToken<any>;
}

export const List: (name: ProviderToken<any>) => ParameterDecorator = name =>
  Decorators.parameter.generic(
    'List',
    (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) => {
      const handlerList = reflectMultiMetadataContext<ParameterListTyped>(list_key, target, propertyKey);
      const listed = handlerList.get();
      listed.push({
        index: parameterIndex,
        type: name
      });
      handlerList.set(listed);
    }
  );

export const Optional = Decorators.parameter.generic(
  'Optional',
  (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) => {
    const handlerOptional = reflectMultiMetadataContext<number>(optional_key, target, propertyKey);
    const optionals = handlerOptional.get();
    optionals.push(parameterIndex);
    handlerOptional.set(optionals);
  }
);

export const InjectByDecorator = (decorator: DecoratorRef | string) =>
  Decorators.parameter.generic('Decorator', (target, propertyKey, parameterIndex) => {
    reflectUpdate<Record<number, DecoratorRef | string>>(
      item => {
        if (!item) {
          item = {};
        }
        item[parameterIndex] = decorator;
        return item;
      },
      decorator_key,
      target
    );
  });

export const retrieveElementTypes = (target: object, propertyKey?: string | symbol) => {
  return getMultiMetadataReflection<ParameterListTyped>(list_key, target, propertyKey);
};

export const retrieveOptionals = (target: object, propertyKey?: string | symbol) => {
  return getMultiMetadataReflection<number>(optional_key, target, propertyKey);
};

export const retrieveDecorator = (target: object) => {
  return getMetadataReflection<Record<number, DecoratorRef | string>>(decorator_key, target) ?? {};
};
