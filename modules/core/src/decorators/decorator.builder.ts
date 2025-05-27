import {
  ClassDecorator,
  Decorator,
  ParameterDecorator,
  FieldDecorator,
  MethodDecorator,
  ConstructorParameterDecorator,
  MethodParameterDecorator
} from './type.decorators';
import { Type } from '../context/provider/provider.type';
import { Component } from './components/component.decorator';
import { getMultiMetadataReflection, reflectMultiMetadataContext } from './decorators.helper';

const decorator_names = 'decorator:names';

export type Decorators = ClassDecorator | ParameterDecorator | FieldDecorator | MethodDecorator | Decorator;

const createDecorator = <T extends Decorators = Decorator>(name: string, decorator: T): T => {
  return ((target: object, propertyKey?: string | symbol, descriptor?: number | TypedPropertyDescriptor<any>) => {
    const context = reflectMultiMetadataContext<string>(decorator_names, target, propertyKey);
    const names = context.get();
    names.push(name);
    context.set(names);
    const reflector = decorator as Decorator;
    reflector(target, propertyKey, descriptor);
  }) as T;
};

const parameterDecorator = createDecorator<ParameterDecorator>;
const methodDecorator = createDecorator<MethodDecorator>;
const classDecorator = createDecorator<ClassDecorator>;
const fieldDecorator = createDecorator<FieldDecorator>;
const constructorParameterDecorator = createDecorator<ConstructorParameterDecorator>;
const methodParameterDecorator = createDecorator<MethodParameterDecorator>;

const concatDecoratorFunction = <T extends Decorators>(...decorators: T[]) => {
  return () => {
    const handlers = decorators
      .map<Decorator>(decorator => {
        const numberArgumentsNeeded = decorator.length;
        if (numberArgumentsNeeded === 1) {
          return target => (decorator as ClassDecorator)(target as Type<any>);
        }
        if (numberArgumentsNeeded === 2) {
          return (target, propertyKey) => (decorator as FieldDecorator)(target, propertyKey!);
        }
        return decorator as Decorator;
      })
      .reduce(
        (acc, decorator) => (subTarget, subPropertyKey, subDescriptor) => {
          acc(subTarget, subPropertyKey, subDescriptor);
          decorator(subTarget, subPropertyKey, subDescriptor);
        },
        (_target, _propertyKey, _descriptor) => {
          isDecorator(_target as Type<any>, Component);
        }
      );
    return handlers as T;
  };
};

export const Decorators = Object.freeze({
  parameter: {
    generic: parameterDecorator,
    constructor: constructorParameterDecorator,
    method: methodParameterDecorator
  },
  field: fieldDecorator,
  method: methodDecorator,
  class: classDecorator,
  all: createDecorator,
  concat: <T extends Decorators>(...decorators: T[]) =>
    createDecorator('concat', concatDecoratorFunction(...decorators))
});

export const isDecorator = <T extends Decorators>(bean: Type<any>, decorator: T) => {
  const names = getMultiMetadataReflection<string>(decorator_names, bean);
  return names.includes(decorator.name);
};
