export type Nullable<T> = T | undefined;

export type Async<T> = Promise<T>;

export type AsyncSync<T> = Async<T> | T;

export type OptionalAsyncSync<T> = AsyncSync<Nullable<T>>;

export type TooArray<T> = T | T[];
