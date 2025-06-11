export abstract class Converter<U, T = any> {
  hasConverter(value: any): boolean {
    return false;
  }

  abstract to(value: T): U;
}
