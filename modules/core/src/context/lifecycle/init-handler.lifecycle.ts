import { BeanPost } from '../bean/bean.post';
import { AsyncSync } from '../../helper/type.helper';
import { Configuration } from '../../decorators/components/component.decorator';
import { ProviderType } from '../provider/provider.type';
import {
  Destroyable,
  Initializable,
  isDestroyable,
  isDisposable,
  isInitializable,
  isRefreshable,
  Refreshable,
  Disposable
} from './lifecycle';

@Configuration
export class InitHandlerLifecycle extends BeanPost<Initializable> {
  isHandler(target: ProviderType<any>, name: string | symbol, bean: any): boolean {
    return isInitializable(bean);
  }

  postConstruct(
    target: ProviderType<Initializable>,
    name: string | symbol,
    bean: Initializable
  ): AsyncSync<Initializable> {
    return bean.initialize().then(() => bean);
  }
}

@Configuration
export class DisposeHandlerLifecycle extends BeanPost<Disposable> {
  isHandler(target: ProviderType<any>, name: string | symbol, bean: any): boolean {
    return isDisposable(bean);
  }

  postConstruct(target: ProviderType<Disposable>, name: string | symbol, bean: Disposable): AsyncSync<Disposable> {
    return bean.dispose().then(() => bean);
  }
}

@Configuration
export class DestroyHandlerLifecycle extends BeanPost<Destroyable> {
  isHandler(target: ProviderType<any>, name: string | symbol, bean: any): boolean {
    return isDestroyable(bean);
  }

  postConstruct(target: ProviderType<Destroyable>, name: string | symbol, bean: Destroyable): AsyncSync<Destroyable> {
    return bean.destroy().then(() => bean);
  }
}

@Configuration
export class RefreshHandlerLifecycle extends BeanPost<Refreshable> {
  isHandler(target: ProviderType<any>, name: string | symbol, bean: any): boolean {
    return isRefreshable(bean);
  }

  postConstruct(target: ProviderType<Refreshable>, name: string | symbol, bean: Refreshable): AsyncSync<Refreshable> {
    return bean.refresh().then(() => bean);
  }
}

export const provideLifecycle = () => [
  InitHandlerLifecycle,
  DisposeHandlerLifecycle,
  DestroyHandlerLifecycle,
  RefreshHandlerLifecycle
];
