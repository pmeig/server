import { Converter } from './converter';
import { BooleanConverter } from './boolean.converter';
import { NumberConverter } from './number.converter';
import { Configuration } from '../../decorators/components/component.decorator';
import { JsonConverter } from './json.converter';

@Configuration
export class ObjectConverter extends Converter<any> {
  private readonly converters: Converter<any>[] = [new NumberConverter(), new BooleanConverter(), new JsonConverter()];

  hasConverter(value: any): boolean {
    return typeof value === 'object';
  }

  to(value: any): any {
    if (typeof value === 'undefined') return value;
    if (Array.isArray(value)) {
      return value.map(item => {
        const converter = this.converters.find(convert => convert.hasConverter(item));
        return this.applyConverter(item, converter);
      });
    }
    return Object.entries(value).reduce((acc, [key, value]) => {
      const converter = this.converters.find(convert => convert.hasConverter(value));
      acc[key] = this.applyConverter(value, converter);
      return acc;
    }, {});
  }

  private applyConverter(value: any, converter?: Converter<any>) {
    if (!converter && typeof value === 'object') {
      converter = this;
    }
    return converter?.to(value) ?? value;
  }
}
