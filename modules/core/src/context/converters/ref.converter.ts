import { Convert, Converter } from './converter';
import { Configuration, Order } from '../../decorators/components/component.decorator';
import { Decorators } from '../../decorators/decorator.builder';

@Configuration
@Order(Number.MAX_SAFE_INTEGER)
export class RefConverter extends Converter<any> {
  hasConverter(value: any): boolean {
    return true;
  }

  to(value: any): any {
    return value;
  }
}

export const NoConvert = Decorators.all('NoConvert', (target, propertyKey, parameterIndex) => {
  Convert(RefConverter)(target, propertyKey, parameterIndex);
});
