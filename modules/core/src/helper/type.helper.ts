import { Type } from '../context/provider/provider.type';

export type Nullable<T> = T | undefined;

export type Async<T> = Promise<T>;

export type AsyncSync<T> = Async<T> | T;

export type OptionalAsyncSync<T> = AsyncSync<Nullable<T>>;

export type TooArray<T> = T | T[];

export const getTypeOf = <T = any>(value: T): Type<T> => Object.getPrototypeOf(value).constructor;

export type Partials<T extends Record<any, any>> = {
  [K in keyof T]?: T[K] extends Record<any, any> ? Partials<T[K]> : T[K];
};

export function toPromise<T>(value: OptionalAsyncSync<T>): Promise<T | undefined>;
export function toPromise<T>(value: OptionalAsyncSync<T>, defaultValue: AsyncSync<T>): Promise<T>;
export function toPromise<T>(value: OptionalAsyncSync<T>, defaultValue?: AsyncSync<T>): Promise<T | undefined> {
  if (typeof value === 'undefined') {
    value = defaultValue;
  }
  return value instanceof Promise ? value : Promise.resolve(value);
}

export const promiseFind = async <T extends any>(
  array: T[],
  filter: (item: T) => Promise<boolean>
): Promise<T | undefined> => {
  let index = array.length;
  let found: T | undefined = undefined;
  while (!found && index--) {
    const item = array[index];
    if (await filter(item)) {
      found = item;
    }
  }
  return found;
};

const excludes = [
  'constructor',
  'isPrototypeOf',
  'toLocaleString',
  'toString',
  'valueOf',
  'hasOwnProperty',
  'propertyIsEnumerable'
];

export const getPropsOf = (target: object & { prototype?: any }) => {
  const props = new Set<string>();
  let obj = target;

  if (target.prototype) {
    obj = target.prototype;
    do {
      Object.getOwnPropertyNames(obj).forEach(key => props.add(key));
    } while ((obj = Object.getPrototypeOf(obj)));
    obj = target;
  }

  do {
    Object.getOwnPropertyNames(obj).forEach(key => props.add(key));
  } while ((obj = Object.getPrototypeOf(obj)));

  return [...props].filter(key => !excludes.includes(key) && !key.startsWith('__'));
};
