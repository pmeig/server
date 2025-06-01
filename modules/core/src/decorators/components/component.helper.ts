import { ProviderFactory, SingletonProviderFactory } from '../../context/factory/provider.factory';
import { ProviderToken, ScopeType, Type } from '../../context/provider/provider.type';
import { FactoryProviderScoped } from '../../context/provider-scope';
import {
  getMetadataReflection,
  getMultiMetadataReflection,
  reflectMetadataContext,
  reflectMultiMetadataContext
} from '../decorators.helper';
import { Context } from '../../context/context.model';

const context_key = 'components:context';
const context_name = 'components:name';
const context_providers: Record<string, string[]> = {};
let context_requester: string[] = [];
export const internal_key = 'component:internal';

export interface ComponentContext {
  names?: (string | symbol)[];
  order: number;
  factory?: ProviderFactory;
  metadata: Record<string, any>;
}

export const PutType = (target: object, metadata: Record<string, any> = {}) => {
  const names = getMultiMetadataReflection<string | symbol>(context_name, target);
  if (names.length === 0) getNameProvider(target).forEach(name => names.push(name));
  updateContext({ metadata, names }, target);
};

export const retrieveContext = (target: object): ComponentContext => {
  return Reflect.getMetadata(context_key, target) as ComponentContext;
};

export const PutOrder = (target: object, order: number) => {
  updateContext({ order }, target);
};

export const PutScope = (target: object, scope: ScopeType) => {
  updateContext({ factory: new FactoryProviderScoped[scope](target as Type<any>) }, target);
};

export const PutName = (target: object, ...names: (string | symbol)[]) => {
  const handler = reflectMultiMetadataContext<string | symbol>(context_name, target);
  handler.set(names);
  const handlerContext = reflectMetadataContext<ComponentContext>(context_key, target);
  const context = handlerContext.get() ?? { order: 0, metadata: {} };
  context.names = names;
  handlerContext.set(context);
};

export const updateContext = (context: Partial<ComponentContext>, target: object) => {
  const previous = Reflect.getMetadata(context_key, target) as ComponentContext;
  const names = new Set(context.names ?? []);
  previous?.names?.forEach(name => names.add(name));
  Reflect.defineMetadata(
    context_key,
    {
      names: [...names],
      factory:
        context.factory?.valid(target) ??
        previous?.factory?.valid(target) ??
        new SingletonProviderFactory(target as Type<any>),
      order: context.order || previous?.order || 0,
      metadata: {
        ...context.metadata,
        ...previous?.metadata
      }
    },
    target
  );
};

export const isInternal = (target: object) => {
  return getMetadataReflection<boolean>(internal_key, target);
};

export const affectApplicationContext = (target: ProviderToken<any>, applicationContext: Context) => {
  const providers = context_providers[applicationContext.id] ?? [];
  const name = typeof target === 'function' ? target.name : target.toString();
  providers.push(name);
  context_providers[applicationContext.id] = providers;
  const app = context_providers[name] ?? [];
  app.push(applicationContext.id);
  context_providers[name] = app;
};

export const retrieveMyOwnContext = (target: Type<any>) => {
  return context_providers[target.name] ?? [];
};

export const isVisible = (target: Type<any>) => {
  return !isInternal(target) || context_providers[retrieveMyOwnContext(target)[0]]?.includes(retrieveRequester());
};

export const putRequester = (token?: string | symbol) => {
  if (token) {
    context_requester.push(token.toString());
  } else {
    context_requester.pop();
  }
};

export const retrieveRequester = () => {
  return context_requester[context_requester.length - 1];
};

const getNameProvider = (target: object) => {
  const names: string[] = [];
  let prototype: { name: string | undefined } = target as { name: string | undefined };
  while (prototype.name) {
    names.push(prototype.name);
    prototype = Object.getPrototypeOf(prototype);
  }
  return names;
};
