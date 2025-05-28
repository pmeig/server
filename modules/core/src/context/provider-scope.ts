import { RequestProviderFactory, SingletonProviderFactory, TransientProviderFactory } from './factory/provider.factory';

export const FactoryProviderScoped = Object.freeze({
  singleton: SingletonProviderFactory,
  request: RequestProviderFactory,
  transient: TransientProviderFactory
});
