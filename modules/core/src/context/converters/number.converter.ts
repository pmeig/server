import { Converter } from './converter';
import { Configuration } from '../../decorators/components/component.decorator';

@Configuration
export class NumberConverter extends Converter<number> {
  hasConverter(value: any): boolean {
    return typeof value === 'number' || (typeof value === 'string' && !Number.isNaN(Number(value)) && value !== '');
  }

  to(value: any): number {
    return Number(value);
  }
}
