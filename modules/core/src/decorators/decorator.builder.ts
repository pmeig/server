import {
  ClassDecorator,
  ConstructorParameterDecorator,
  Decorator,
  DecoratorRef,
  DecoratorType,
  FieldDecorator,
  MethodDecorator,
  MethodParameterDecorator,
  ParameterDecorator
} from './type.decorators';
import { Type } from '../context/provider/provider.type';
import { getMultiMetadataReflection, reflectMultiMetadataContext } from './decorators.helper';

const decorator_names = 'decorator:names';

export type DecoratorMetadata = {
  name: string;
  type: 'parameter' | 'method' | 'class' | 'field' | 'concat' | 'all';
};

const createDecorator =
  <T extends DecoratorType | ConstructorParameterDecorator | MethodParameterDecorator = Decorator>(
    type: 'parameter' | 'method' | 'class' | 'field' | 'concat' | 'all'
  ) =>
  (name: string, decorator: T): T => {
    return ((target: object, propertyKey?: string | symbol, descriptor?: number | TypedPropertyDescriptor<any>) => {
      const context = reflectMultiMetadataContext<DecoratorMetadata>(decorator_names, target, propertyKey);
      const names = context.get();
      names.push({
        name,
        type
      });
      context.set(names);
      const reflector = decorator as Decorator;
      reflector(target, propertyKey, descriptor);
    }) as T;
  };

const parameterDecorator = createDecorator<ParameterDecorator>('parameter');
const methodDecorator = createDecorator<MethodDecorator>('method');
const classDecorator = createDecorator<ClassDecorator>('class');
const fieldDecorator = createDecorator<FieldDecorator>('field');
const constructorParameterDecorator = createDecorator<ConstructorParameterDecorator>('parameter');
const methodParameterDecorator = createDecorator<MethodParameterDecorator>('parameter');

export const Decorators = Object.freeze({
  parameter: {
    generic: parameterDecorator,
    constructor: constructorParameterDecorator,
    method: methodParameterDecorator
  },
  field: fieldDecorator,
  method: methodDecorator,
  class: classDecorator,
  all: createDecorator<Decorator>('all')
});

export const hasDecorator = (bean: Type<any>, decorator: DecoratorRef | string, propertyKey?: string | symbol) => {
  const names = getDecoratorNames(bean, propertyKey);
  return names.map(value => value.name).includes(typeof decorator === 'string' ? decorator : decorator.name);
};

export const getDecoratorNames = (bean: Type<any>, propertyKey?: string | symbol) =>
  getMultiMetadataReflection<DecoratorMetadata>(decorator_names, bean, propertyKey);
