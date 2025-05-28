import { ProviderType } from './provider.factory';

export abstract class BeanHandler<T = any> {
  isHandler(target: ProviderType<T>, name: string | symbol, bean: T): boolean {
    return true;
  }

  abstract postConstruct(target: ProviderType<T>, name: string | symbol, bean: T): Promise<T> | T;
}
