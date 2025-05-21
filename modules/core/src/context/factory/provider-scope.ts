import { RequestProviderFactory, SingletonProviderFactory, TransientProviderFactory } from './provider-factory';

export const FactoryProviderScoped = Object.freeze({
  scope: SingletonProviderFactory,
  request: RequestProviderFactory,
  transient: TransientProviderFactory,
});
