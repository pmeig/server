import { AsyncSync, Nullable, OptionalAsyncSync, TooArray } from '@pmeig/srv-core';

export interface Env {
  get<T extends TooArray<Record<string, any> | number | string | boolean>>(key: string): Promise<T>;
  find<T extends Record<string, any> | number | string | boolean>(
    key: string,
    defaultValue: AsyncSync<T[]> | (() => AsyncSync<T[]>)
  ): Promise<T[]>;
  find<T extends Record<string, any> | number | string | boolean>(
    key: string,
    defaultValue: AsyncSync<T> | (() => AsyncSync<T>)
  ): Promise<T>;
  find<T extends Record<string, any> | number | string | boolean>(key: string): Promise<Nullable<T>>;
  find<T extends Record<string, any> | number | string | boolean>(
    key: string,
    defaultValue?: (() => OptionalAsyncSync<T | T[]>) | OptionalAsyncSync<T | T[]>
  ): Promise<Nullable<T> | T[]>;
  hasProfiles(...profiles: string[]): boolean;
  sources: Readonly<string[]>;
}
