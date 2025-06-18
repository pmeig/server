import { Internal } from '../../decorators/conditional/conditional.decorators';
import { Module } from '../context.decorators';
import { BooleanConverter } from './boolean.converter';
import { JsonConverter } from './json.converter';
import { NumberConverter } from './number.converter';
import { ObjectConverter } from './object.converter';
import { RefConverter } from './ref.converter';
import { ConverterPost } from './converter.post';

@Module({
  providers: [BooleanConverter, JsonConverter, NumberConverter, ObjectConverter, RefConverter, ConverterPost]
})
@Internal
export class ConverterModule {}
