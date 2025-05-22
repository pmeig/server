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

export type ParameterDecorator = MethodParameterDecorator & ConstructorParameterDecorator;

export type Decorator = (
  target: object,
  propertyKey?: string | symbol,
  descriptor?: TypedPropertyDescriptor<any> | number
) => void;
