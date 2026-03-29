import { After, ApplicationRegistrar, Configuration, Context, Registrar } from '@pmeig/srv-core';
import { DataProperties } from '../data.properties';
import { DataSource, DataSourceOptions } from 'typeorm';
import { EntitiesRegistrar } from './entities.registrar';

@Configuration
@After(EntitiesRegistrar)
export class DatasourceRegistrar extends Registrar {
  constructor(private readonly properties: DataProperties) {
    super();
  }

  async registrar(registrar: ApplicationRegistrar, context: Context): Promise<void> {
    const names = Object.getOwnPropertyNames(this.properties.sources);
    if (['name', 'type'].every(name => names.includes(name))) {
      const entities = await context.multiResolve('Entity');
      const options = { ...(this.properties.sources as DataSourceOptions), entities };
      const dataSource = new DataSource(options);
      await dataSource.initialize();
      registrar.register('DataSource', dataSource);
      registrar.register('DefaultDataSource', dataSource);
    } else {
      for (const name of names) {
        const options = {...(this.properties.sources[name] as DataSourceOptions)}
        options.entities = await context.multiResolve(`Entity${name}`);
        options.entities = options.entities.length > 0 ? options.entities : await context.multiResolve('EntityDefault');
        const datasource = new DataSource(options);
        await datasource.initialize();
        registrar.register('DataSource', datasource);
        registrar.register(`${name.slice(0, 1).toUpperCase() + name.slice(1)}DataSource`, datasource);
      }
    }
  }
}
