import { Type } from '../context/provider/provider.type';

export type MethodDecorator = (
  target: object,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<any>
) => void;

export type ClassDecorator = (target: Type<any>) => void;

export type FieldDecorator = (target: object, propertyKey: string | symbol) => void;

export type MethodParameterDecorator = (target: object, propertyKey: string | symbol, parameterIndex: number) => void;

export type ConstructorParameterDecorator = (target: Function, propertyKey: undefined, parameterIndex: number) => void;

export type ParameterDecorator = (
  target: object | Function,
  propertyKey: string | symbol | undefined,
  parameterIndex: number
) => void;

export type Decorator = (
  target: object | Type<any> | Function,
  propertyKey?: string | symbol,
  descriptor?: TypedPropertyDescriptor<any> | number
) => void;

export type DecoratorType = ClassDecorator | ParameterDecorator | FieldDecorator | MethodDecorator | Decorator;

export type DecoratorRef<T extends DecoratorType = Decorator> = ((...args: any[]) => T) | Type<T>;
