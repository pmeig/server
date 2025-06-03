export type Nullable<T> = T | undefined;

export type Async<T> = Promise<T>;

export type AsyncSync<T> = Async<T> | T;

export type OptionalAsyncSync<T> = AsyncSync<Nullable<T>>;

export type TooArray<T> = T | T[];

export function toPromise<T>(value: OptionalAsyncSync<T>): Promise<T | undefined>;
export function toPromise<T>(value: OptionalAsyncSync<T>, defaultValue: AsyncSync<T>): Promise<T>;
export function toPromise<T>(value: OptionalAsyncSync<T>, defaultValue?: AsyncSync<T>): Promise<T | undefined> {
  return Promise.resolve(value ?? defaultValue);
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
