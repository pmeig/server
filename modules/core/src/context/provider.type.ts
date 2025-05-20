import { FactoryProviderScoped } from './factory/provider-scope.factory';

export interface Type<T> extends Function {
  new (...args: any[]): T;
  prototype: any;
}

export type ScopeType = keyof typeof FactoryProviderScoped;
