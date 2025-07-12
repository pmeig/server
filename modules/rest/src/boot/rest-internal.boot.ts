import { AsyncLocalStorage } from 'async_hooks';

export const controllerStorage = new AsyncLocalStorage();
