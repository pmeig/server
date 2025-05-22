import { FactoryProviderScoped } from '../factory/provider-scope';
import { Context } from '../application-context';

export interface Type<T> extends Function {
  new (...args: any[]): T;
  prototype: any;
}

export type ScopeType = keyof typeof FactoryProviderScoped;

export type ProviderToken<T> = Type<T> | string | symbol;

export type CustomProviderFactory<T> = (context: Context) => T | Promise<T>;

export interface CustomProvider<T> {
  provide: ProviderToken<T>;
  scope?: ScopeType;
  useFactory: CustomProviderFactory<T>;
}

export type Provider<T extends any = any> = Type<T> | CustomProvider<T>;
