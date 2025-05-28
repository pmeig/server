export interface Env {
  get: <T>(key: string) => Promise<T>;
  find<T>(key: string, defaultValue: T | Promise<T> | (() => T | Promise<T>)): Promise<T>;
  find<T>(key: string): Promise<T | undefined>;
  find<T>(
    key: string,
    defaultValue?: (() => T | Promise<T | undefined> | undefined) | T | Promise<T | undefined> | undefined
  ): Promise<T | undefined>;
  readonly sources: Readonly<string[]>;
}
