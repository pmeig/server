import {
  Configuration,
  Destroyable,
  Initializable,
  isDestroyable,
  isDisposable,
  isInitializable,
  Disposable,
  isRefreshable,
  Refreshable
} from '../..';
import { BeanHandler } from '../factory/bean-handler';
import { ProviderType } from '../factory/provider.factory';

@Configuration
export class InitHandlerLifecycle extends BeanHandler<Initializable> {
  isHandler(target: ProviderType<any>, name: string | symbol, bean: any): boolean {
    return isInitializable(bean);
  }

  postConstruct(
    target: ProviderType<Initializable>,
    name: string | symbol,
    bean: Initializable
  ): Promise<Initializable> | Initializable {
    return bean.initialize().then(() => bean);
  }
}

@Configuration
export class DisposeHandlerLifecycle extends BeanHandler<Disposable> {
  isHandler(target: ProviderType<any>, name: string | symbol, bean: any): boolean {
    return isDisposable(bean);
  }

  postConstruct(
    target: ProviderType<Disposable>,
    name: string | symbol,
    bean: Disposable
  ): Promise<Disposable> | Disposable {
    return bean.dispose().then(() => bean);
  }
}

@Configuration
export class DestroyHandlerLifecycle extends BeanHandler<Destroyable> {
  isHandler(target: ProviderType<any>, name: string | symbol, bean: any): boolean {
    return isDestroyable(bean);
  }

  postConstruct(
    target: ProviderType<Destroyable>,
    name: string | symbol,
    bean: Destroyable
  ): Promise<Destroyable> | Destroyable {
    return bean.destroy().then(() => bean);
  }
}

@Configuration
export class RefreshHandlerLifecycle extends BeanHandler<Refreshable> {
  isHandler(target: ProviderType<any>, name: string | symbol, bean: any): boolean {
    return isRefreshable(bean);
  }

  postConstruct(
    target: ProviderType<Refreshable>,
    name: string | symbol,
    bean: Refreshable
  ): Promise<Refreshable> | Refreshable {
    return bean.refresh().then(() => bean);
  }
}

export const provideLifecycle = () => [
  InitHandlerLifecycle,
  DisposeHandlerLifecycle,
  DestroyHandlerLifecycle,
  RefreshHandlerLifecycle
];
