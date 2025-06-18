import { Decorators } from '../../decorators/decorator.builder';
import { Type } from '../provider/provider.type';
import { getMetadataReflection, reflectUpdate } from '../../decorators/decorators.helper';

const converter_key = 'convert:converter';

export abstract class Converter<U, T = any> {
  hasConverter(value: any): boolean {
    return false;
  }

  abstract to(value: T): U;
}

export const Convert = (converter: Type<Converter<any>> | Converter<any>) =>
  Decorators.all('Convert', (target, propertyKey, parameterIndex) => {
    reflectUpdate<Record<number, Converter<any>>>(
      items => {
        if (!items) {
          items = {};
        }
        if (!(converter instanceof Converter)) {
          converter = new (converter as Type<Converter<any>>)();
        }
        if (!(typeof parameterIndex === 'number')) {
          parameterIndex = -1;
        }
        items[parameterIndex] = converter;
        return items;
      },
      converter_key,
      target,
      propertyKey
    );
  });

export const retrieveConverters = (target: object, propertyKey?: string | symbol) => {
  return getMetadataReflection<Record<number, Converter<any>>>(converter_key, target, propertyKey) ?? {};
};
