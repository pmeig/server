import { FactoryProviderScoped } from './factory/provider-scope';

export interface Type<T> extends Function {
  new (...args: any[]): T;
  prototype: any;
}

export type ScopeType = keyof typeof FactoryProviderScoped;
