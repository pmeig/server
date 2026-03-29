import { BeanPost, Configuration, Context, getPropsOf, getTypeOf, hasDecorator, ProviderType, Type } from '@pmeig/srv-core';
import { Repository } from './repository.decorator';
import { retrieveDataSourceName } from '../decorator/datasource.decorator';
import { DataSource, Repository as DataSourceRepository } from 'typeorm';
import { JpaRepository } from './jpaRepository';
import { retrieveQuery } from '../decorator/query.decorator';
import { retrieveParam } from '../decorator/param.decorator';

const SIMPLE_EXECUTOR = Object.freeze(Object.getOwnPropertyNames(new JpaRepository())
  .reduce((acc, name) => {
    acc[name] = (repository: DataSourceRepository<any>) => repository[name].bind(repository);
    return acc;
  },
    {} as Record<string, (repository: DataSourceRepository<any>) => (...parameters: any[]) => any>))
@Configuration
export class RepositoryConfiguration extends BeanPost {
  constructor(private readonly context: Context) {
    super();
  }

  async postConstruct(target: ProviderType<any>, name: string | symbol, bean: any): Promise<any> {
    const type = getTypeOf(bean);
    if (hasDecorator(type, Repository)) {
      const datasourceName = retrieveDataSourceName(type);
      const datasource = await this.context.resolveRequired(`${datasourceName}DataSource`);
      const handler = new RepositoryProxy(datasource.getRepository(type), type, this.context, datasourceName);
      await handler.initialize()
      return new Proxy(bean, handler);
    }
    return bean
  }
}

class RepositoryProxy implements ProxyHandler<any> {
  private executorsCache: Record<string | symbol, (...parameters: any[]) => any> = {};

  constructor(
    private readonly repository: DataSourceRepository<any>,
    private readonly type: Type<any>,
    private readonly context: Context,
    private readonly datasourceName: string
  ) {}

  get(_target: any, name: string | symbol, _: any): any {
    return (
      this.executorsCache[name] ??
      (() => {
        throw new Error(`Method ${name.toString()} not found in ${this.type.name}`);
      })
    );
  }

  async initialize() {
    for (const name of getPropsOf(this.type)) {
      const executorBuilder = SIMPLE_EXECUTOR[name.toString()] ?? this.createExecutor(name);
      const repository = await this.determineRepository(name);
      this.executorsCache[name] = executorBuilder(repository);
    }
  }

  private createExecutor(name: string | symbol) {
    const query = retrieveQuery(this.type, name);
    if (!query) {
      return () => () => {
        throw new Error(`Query not found for method ${name.toString()} in ${this.type.name}`);
      };
    }
    const { sql, parametersTransformer } = this.createQueryParameters(query, name);
    return (repository: DataSourceRepository<any>) =>
      (...parameters: any[]) =>
        repository.query(sql, parametersTransformer(parameters));
  }

  private async determineRepository(name: string | symbol) {
    const datasourceName = retrieveDataSourceName(this.type, name);
    if (datasourceName === this.datasourceName) return this.repository;
    const datasource = await this.context.resolveRequired<DataSource>(`${datasourceName}DataSource`);
    return datasource.getRepository(this.type);
  }

  private createQueryParameters(query: string, name: string | symbol) {
    const parameterNames = retrieveParam(this.type, name);
    let parametersTransformer: (parameters: any[]) => any[] = () => [];
    let sql = query;
    let index = 0;
    query.match(new RegExp(' (:[a-zA-Z0-9]+|[?]) ?', 'g'))?.forEach(match => {
      sql = sql.replace(match, ` ? `);
      const indexParam = this.findIndexParam(match, parameterNames, index++);
      const previous = parametersTransformer;
      parametersTransformer = (parameters: any[]) => {
        const params = previous(parameters);
        if (!indexParam || indexParam >= parameters.length)
          throw new Error(
            `Parameter ${match.slice(1)} not defined for query execution ${query} in repository ${this.type.name}`
          );
        const param = parameters[indexParam];
        return [...params, param];
      };
    });
    return {
      sql,
      parametersTransformer
    }
  }

  private findIndexParam(match: string, parameterNames: Record<string, number>, index: number) {
    if (match.startsWith(':')) {
      const name = match.slice(1);
      if (new RegExp('[0-9]+').test(name)) {
        return parseInt(name);
      }
      return parameterNames[name];
    }
    return index
  }
}
