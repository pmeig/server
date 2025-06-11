import { Converter } from './converter';
import { Configuration } from '../../decorators/components/component.decorator';

@Configuration
export class BooleanConverter extends Converter<boolean> {
  hasConverter(value: any): boolean {
    return typeof value === 'boolean' || (typeof value === 'string' && ['true', 'false'].includes(value.toLowerCase()));
  }

  to(value: any): boolean {
    return String(value).toLowerCase() === 'true';
  }
}
