import { AsyncSync } from '../../helper/type.helper';
import { ProviderType } from '../provider/provider.type';

export abstract class BeanPost<T = any> {
  // noinspection JSUnusedLocalSymbols
  isHandler(target: ProviderType<T>, name: string | symbol, bean: T): boolean {
    return true;
  }

  abstract postConstruct(target: ProviderType<T>, name: string | symbol, bean: T): AsyncSync<T>;
}
