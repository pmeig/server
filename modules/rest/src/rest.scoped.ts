import {
  AsyncSync,
  BeanPost,
  Configuration,
  Order,
  ProviderType,
  RequestProviderFactory,
  retrieveContext
} from '@pmeig/srv-core';
import { RestMiddleware } from './rest.middleware';
import type { NextFunction, Request, Response } from 'express';
import { randomUUID, UUID } from 'crypto';
import { AsyncLocalStorage } from 'async_hooks';

export const requestStorage = new AsyncLocalStorage();
const factories: {
  factory: RequestProviderFactory;
  name: string;
}[] = [];

@Configuration
export class RequestFactoryScoped extends BeanPost {
  constructor() {
    super();
  }

  isHandler(target: ProviderType<any>): boolean {
    return retrieveContext(target).factory?.scope === 'request';
  }

  postConstruct(target: ProviderType<any>, name: string | symbol, origin: any): AsyncSync<any> {
    const factory = retrieveContext(target).factory as RequestProviderFactory;
    const key = name.toString();
    if (!factories.find(instance => instance.name === key)) {
      factories.push({
        name: key,
        factory
      });
    }
    return new Proxy(origin, {
      get(target: any, p: string | symbol, _: any): any {
        const store = requestStorage.getStore() as {
          request: UUID;
          response: Response;
        };
        if (store) {
          target = factory.getInstance(store.request);
        }
        return target[p];
      },
      set(target: any, p: string | symbol, value: any, _: any): boolean {
        const store = requestStorage.getStore() as {
          request: UUID;
          response: Response;
        };
        if (store) {
          target = factory.getInstance(store.request);
          target[p] = value;
        }
        return true;
      }
    });
  }
}

@Configuration
@Order(Number.MIN_SAFE_INTEGER)
export class RequestGeneratorId extends RestMiddleware {
  global = true;

  constructor() {
    super();
  }
  async use(_: Request, next: NextFunction, response: Response) {
    const request = randomUUID();
    for (const { factory } of factories) {
      await factory.createInstance(request);
    }
    requestStorage.run({ request, response }, next);
  }
}
