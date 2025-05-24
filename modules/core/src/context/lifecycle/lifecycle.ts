export interface Initializable {
  initialize(): Promise<void>;
}

export interface Disposable {
  dispose(): Promise<void>;
}

export interface Destroyable {
  destroy(): Promise<void>;
}

export interface Refreshable {
  refresh(): Promise<void>;
}

export interface Lifecycle extends Initializable, Disposable, Refreshable, Destroyable {}

export const toLifecycle = <T>(target: any): Lifecycle & T => {
  return new Proxy(target, {
    get(target: any, p: string | symbol, receiver: any): any {
      const value = Reflect.get(target, p, receiver);
      if (!value && typeof p === 'string' && ['destroy', 'refresh', 'dispose', 'initialize'].includes(p)) {
        return () => Promise.resolve();
      }
      return value;
    },
  });
};

export const isInitializable = (target: any): target is Initializable => {
  return isFunctionLifecycle(target, target.initialize);
};

export const isDisposable = (target: any): target is Disposable => {
  return isFunctionLifecycle(target, target.dispose);
};

export const isDestroyable = (target: any): target is Destroyable => {
  return isFunctionLifecycle(target, target.destroy);
};

export const isRefreshable = (target: any): target is Refreshable => {
  return isFunctionLifecycle(target, target.refresh);
};

export const isLifecycle = (target: any): target is Lifecycle => {
  return (
    isFunctionLifecycle(target, target.initialze) &&
    isFunctionLifecycle(target, target.dispose) &&
    isFunctionLifecycle(target, target.destroy)
  );
};

const isFunctionLifecycle = (target: any, func: any) => {
  return typeof func === 'function' && func.length === 0;
};
