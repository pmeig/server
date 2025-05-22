import { RequestProviderFactory, SingletonProviderFactory, TransientProviderFactory } from './provider-factory';

export const FactoryProviderScoped = Object.freeze({
  singleton: SingletonProviderFactory,
  request: RequestProviderFactory,
  transient: TransientProviderFactory,
});
