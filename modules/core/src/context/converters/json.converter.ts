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
    try {
      return JSON.parse(value);
    } catch (e) {
      console.warn('Invalid JSON: ', value);
      return value;
    }
  }
}
