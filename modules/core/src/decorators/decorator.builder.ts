import {
  ClassDecorator,
  Decorator,
  ParameterDecorator,
  FieldDecorator,
  MethodDecorator,
  ConstructorParameterDecorator,
  MethodParameterDecorator,
} from './type.decorators';
import { Type } from '../context/provider.type';

const handler_key = 'decorator:handler';

export type Decorators = ClassDecorator | ParameterDecorator | FieldDecorator | MethodDecorator | Decorator;
export type DecoratorBuilder<T extends Decorators> = (() => T) | T;

const createDecorator = <T extends Decorators = Decorator>(handle: DecoratorBuilder<T>): Decorator => {
  let handlerAdded = handle as Decorator;
  if (handle.prototype.length === 0) {
    handlerAdded = (handle as () => Decorator)();
  }
  return target => {
    const handler: Decorator =
      Reflect.getMetadata(handler_key, target) ?? ((_subTarget, _subPropertyKey, _subDescriptor) => {});
    Reflect.defineMetadata(
      handler_key,
      (subTarget: object, subPropertyKey?: string | symbol, subDescriptor?: PropertyDescriptor | number) => {
        handler(subTarget, subPropertyKey, subDescriptor);
        handlerAdded(subTarget, subPropertyKey, subDescriptor);
      },
      target
    );
  };
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
        (_target, _propertyKey, _descriptor) => {}
      );
    return handlers as T;
  };
};

export const Decorators = Object.freeze({
  parameter: {
    generic: parameterDecorator,
    constructor: constructorParameterDecorator,
    method: methodParameterDecorator,
  },
  field: fieldDecorator,
  method: methodDecorator,
  class: classDecorator,
  all: createDecorator,
  concat: <T extends Decorators>(...decorators: T[]) => createDecorator(concatDecoratorFunction(...decorators)),
});

export const retrieveCustomDecorator = (target: object) => {
  return Reflect.getMetadata(handler_key, target) as Decorator;
};
