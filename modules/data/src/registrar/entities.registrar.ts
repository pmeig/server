import { ApplicationRegistrar, Configuration, Context, getTypeOf, Registrar, Type } from '@pmeig/srv-core';
import { TableEntity } from '../decorator/table.decorator';
import { retrieveDataSourceName } from '../decorator/datasource.decorator';

@Configuration
export class EntitiesRegistrar extends Registrar {
  async registrar(registrar: ApplicationRegistrar, context: Context): Promise<void> {
    const entities = await context.withDecorator(TableEntity);
    const groupEntities = this.groupEntitiesByDataSource(entities);
    Object.entries(groupEntities).forEach(([datasource, entities]) => {
      entities.forEach(entity => {
        registrar.register(`Entity${datasource}`, entity);
        registrar.register('Entity', entity);
      })
    });
  }


  private groupEntitiesByDataSource(entities: any[]) {
    return entities.reduce(
      (acc, entity) => {
        const type = getTypeOf(entity);
        const datasource = retrieveDataSourceName(type);
        if (!acc[datasource]) {
          acc[datasource] = [];
        }
        acc[datasource].push(type);
        return acc;
      },
      {} as Record<string, Type<any>[]>
    ) as Record<string, Type<any>[]>;
  }
}