import { ApplicationContext, AsyncSync, BeanPost, Configuration, ProviderType, retrieveContext } from '@server/core';
import { RestMiddleware } from './rest.middleware';
import { NextFunction, Request, Response } from 'express';
import { randomUUID, UUID } from 'crypto';
import { AsyncLocalStorage } from 'async_hooks';
import { ProviderFactory } from '@server/core/src/context/factory/provider.factory';

const requestStorage = new AsyncLocalStorage();
const requests: Record<string, any> = {};
const factories: {
  name: string;
  factory: ProviderFactory;
}[] = [];

@Configuration
export class RequestFactoryScoped extends BeanPost {
  constructor() {
    super();
  }

  isHandler(target: ProviderType<any>, name: string | symbol, bean: any): boolean {
    return retrieveContext(target).factory?.scope === 'request';
  }

  postConstruct(target: ProviderType<any>, name: string | symbol, origin: any): AsyncSync<any> {
    if (factories.find(value => value.name === name.toString())) {
      return origin;
    }
    factories.push({
      name: name.toString(),
      factory: retrieveContext(target).factory!
    });
    return new Proxy(origin, {
      get(target: any, p: string | symbol, _: any): any {
        const store = requestStorage.getStore() as { request: UUID; response: Response };
        if (store) {
          target = requests[store.request + `:${name.toString()}`];
          store.response.on('finish', () => delete requests[store.request + `:${name.toString()}`]);
        }
        return target[p];
      }
    });
  }
}

@Configuration
export class RequestGeneratorId extends RestMiddleware {
  global = true;

  constructor(private readonly context: ApplicationContext) {
    super();
  }
  async use(_: Request, response: Response, next: NextFunction) {
    const request = randomUUID();
    for (const factory of factories) {
      requests[request + `:${factory.name}`] = await factory.factory.build(this.context, factory.name);
    }
    requestStorage.run({ request, response }, next);
  }
}
