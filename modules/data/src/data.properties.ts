import { Properties } from '@pmeig/srv-properties';
import { DataSourceOptions } from 'typeorm';

@Properties('data')
export class DataProperties {
  sources: Record<string, DataSourceOptions> | DataSourceOptions = {};
}