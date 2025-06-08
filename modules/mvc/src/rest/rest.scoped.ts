import {
  ApplicationContext,
  AsyncSync,
  BeanPost,
  Configuration,
  Internal,
  ProviderType,
  retrieveContext
} from '@server/core';
import { RestMiddleware } from './rest.middleware';
import { NextFunction, Request, response, Response } from 'express';
import { randomUUID, UUID } from 'crypto';
import { AsyncLocalStorage } from 'async_hooks';

const requestStorage = new AsyncLocalStorage();

@Configuration
@Internal
export class RequestFactoryScoped extends BeanPost {
  private readonly requests = {};

  constructor(private readonly context: ApplicationContext) {
    super();
  }

  postConstruct(target: ProviderType<any>, name: string | symbol, origin: any): AsyncSync<any> {
    const factory = retrieveContext(target).factory!;
    return new Proxy(origin, {
      get(_: any, p: string | symbol, _receiver: any): any {
        const store = requestStorage.getStore() as { request: UUID; response: Response };
        const keyBean = store.request;
        let bean = this.requests[keyBean];
        if (!bean) {
          bean = factory.build(this.context, name);
          response.on('finish', () => {
            bean.destroy();
            delete this.requests[keyBean];
          });
        }
        this.requests[keyBean] = bean;
        return bean[p];
      }
    });
  }

  isHandler(target: ProviderType<any>, name: string | symbol, bean: any): boolean {
    return retrieveContext(target).factory?.scope === 'request';
  }
}

@Configuration
@Internal
export class RequestGeneratorId extends RestMiddleware {
  requests = {};

  constructor() {
    super();
  }
  use(_: Request, response: Response, next: NextFunction) {
    requestStorage.run({ request: randomUUID(), response }, next);
  }
}
