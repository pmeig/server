import { ProviderToken } from '../../context/provider/provider.type';
import { Context } from '../../context/context.model';
import { PMEIG_ADMIN_TOKEN } from './conditional.helper';

const context_providers: Record<string, string[]> = {};
const context_requester: string[] = [];

export const affectApplicationContext = (target: ProviderToken<any>, applicationContext: Context) => {
  const providers = context_providers[applicationContext.id] ?? [];
  const name = typeof target === 'function' ? target.name : target.toString();
  providers.push(name);
  context_providers[applicationContext.id] = providers;
  const app = context_providers[name] ?? [];
  app.push(applicationContext.id);
  context_providers[name] = app;
};

export const putRequester = (token?: string | symbol) => {
  if (token) {
    context_requester.push(token.toString());
  } else {
    context_requester.pop();
  }
};

export const isVisible = (id: string) => {
  if (context_requester.length === 0) return false;
  const requester = context_requester[context_requester.length - 1];
  return PMEIG_ADMIN_TOKEN === requester || !!context_providers[id]?.includes(requester);
};
