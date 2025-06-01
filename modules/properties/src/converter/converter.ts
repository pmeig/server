import { Configuration, Nullable } from '@server/core';
import { isBoolean, isNumber } from './converter.helper';

export type Primitive = string | number | boolean;

@Configuration
export class Converter<T extends Primitive = Primitive, U extends Primitive = Primitive> {
  static from(value: Nullable<Primitive>): Converter {
    if (isBoolean(value)) {
      return new BooleanConverter();
    }
    if (isNumber(value)) {
      return new NumberConverter();
    }
    return new StringConverter();
  }

  to(value: Nullable<T>): Nullable<U> {
    return Converter.from(value).to(value) as Nullable<U>;
  }
}

@Configuration
export class StringConverter extends Converter<string, string> {
  to(value: Nullable<string>): Nullable<string> {
    return undefined;
  }
}

@Configuration
export class NumberConverter extends Converter<number | string, number> {
  to(value: Nullable<number | string>): Nullable<number> {
    if (typeof value === 'number') return value;
    return Number(value);
  }
}

@Configuration
export class BooleanConverter extends Converter<boolean | string, boolean> {
  to(value: Nullable<boolean | string>): Nullable<boolean> {
    if (typeof value === 'boolean') return value;
    return value === 'true';
  }
}
