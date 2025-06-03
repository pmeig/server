import { Provider, ProviderToken, Type } from './provider/provider.type';
import { AsyncSync, Nullable, OptionalAsyncSync } from '../helper/type.helper';
import { Decorators } from '../decorators/decorator.builder';

export type DefaultValue<T> = OptionalAsyncSync<T> | (() => OptionalAsyncSync<T>);
export type MultiDefaultValue<T> = AsyncSync<T[]> | (() => AsyncSync<T[]>);

export interface Context {
  resolve: <T extends any = any>(key: ProviderToken<T>, defaultValue?: DefaultValue<T>) => Promise<Nullable<T>>;
  resolveRequired: <T extends any = any>(key: ProviderToken<T>) => Promise<T>;
  multiResolve: <T extends any = any>(key: ProviderToken<T>, defaultValue?: MultiDefaultValue<T>) => Promise<T[]>;
  multiResolveRequired: <T extends any = any>(key: ProviderToken<T>) => Promise<T[]>;
  has: (key: ProviderToken<any>) => Promise<boolean>;
  withDecorator: (decorator: Decorators | string) => Promise<any[]>;
  id: string;
}

export interface ModuleContext {
  providers?: Provider[];
  imports?: Type<any>[];
}
