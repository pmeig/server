import { Converter } from './converter';
import { Configuration } from '../../decorators/components/component.decorator';

@Configuration
export class JsonConverter extends Converter<any> {
  hasConverter(value: any): boolean {
    if (typeof value === 'string') {
      const json = value.trim();
      return (json.startsWith('{') && json.endsWith('}')) || (json.startsWith('[') && json.endsWith(']'));
    }
    return false;
  }

  to(value: any): any {
    return JSON.parse(value);
  }
}
