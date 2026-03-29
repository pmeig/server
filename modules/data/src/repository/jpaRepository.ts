import { ObjectLiteral } from 'typeorm/common/ObjectLiteral';
import { DeepPartial } from 'typeorm/common/DeepPartial';
import { SaveOptions } from 'typeorm/repository/SaveOptions';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { UpsertOptions } from 'typeorm/repository/UpsertOptions';
import { InsertResult } from 'typeorm/query-builder/result/InsertResult';
import { ObjectId } from 'typeorm/driver/mongodb/typings';
import { FindOptionsWhere } from 'typeorm/find-options/FindOptionsWhere';
import { DeleteResult } from 'typeorm/query-builder/result/DeleteResult';
import { FindManyOptions } from 'typeorm/find-options/FindManyOptions';
import { FindOneOptions } from 'typeorm/find-options/FindOneOptions';
import { QueryRunner } from 'typeorm/query-runner/QueryRunner';
import { SelectQueryBuilder } from 'typeorm/query-builder/SelectQueryBuilder';

// noinspection JSUnusedLocalSymbols
export class JpaRepository<Entity extends ObjectLiteral> {
  constructor() {}

  createQueryBuilder(alias?: string, queryRunner?: QueryRunner): SelectQueryBuilder<Entity> {
    throw new Error('Method not implemented.');
  }

  hasId(entity: Entity): boolean {
    return false;
  }

  getId(entity: Entity) {
    return undefined;
  }

  save<T extends DeepPartial<Entity>>(entities: T[], options?: SaveOptions): Promise<(T & Entity)[]>;
  save<T extends DeepPartial<Entity>>(
    entity: T,
    options: SaveOptions & {
      reload: false;
    }
  ): Promise<T>;
  save<T extends DeepPartial<Entity>>(entity: T, options?: SaveOptions): Promise<T & Entity>;
  save<T extends DeepPartial<Entity>>(
    entities: T[],
    options: SaveOptions & {
      reload: false;
    }
  );
  save<T extends DeepPartial<Entity>>(entity: T | T[], options?: SaveOptions): Promise<T & Entity> {
    return Promise.resolve(entity as T & Entity);
  }

  delete(
    criteria:
      | string
      | string[]
      | number
      | number[]
      | Date
      | Date[]
      | ObjectId
      | ObjectId[]
      | FindOptionsWhere<Entity>
      | FindOptionsWhere<Entity>[]
  ): Promise<DeleteResult> {
    return Promise.resolve({ raw: [], affected: 0 } as unknown as DeleteResult);
  }
  deleteAll(): Promise<DeleteResult> {
    return Promise.resolve({ raw: [], affected: 0 } as unknown as DeleteResult);
  }

  upsert(
    entityOrEntities: QueryDeepPartialEntity<Entity> | QueryDeepPartialEntity<Entity>[],
    conflictPathsOrOptions: string[] | UpsertOptions<Entity>
  ): Promise<InsertResult> {
    return Promise.resolve({ raw: [], generatedMaps: [] } as unknown as InsertResult);
  }

  exists(options?: FindManyOptions<Entity>): Promise<boolean> {
    return Promise.resolve(false);
  }

  existsBy(where: FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[]): Promise<boolean> {
    return Promise.resolve(false);
  }
  count(options?: FindManyOptions<Entity>): Promise<number> {
    return Promise.resolve(0);
  }
  countBy(where: FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[]): Promise<number> {
    return Promise.resolve(0);
  }

  find(options?: FindManyOptions<Entity>): Promise<Entity[]> {
    return Promise.resolve([]);
  }
  findBy(where: FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[]): Promise<Entity[]> {
    return Promise.resolve([]);
  }
  findAndCount(options?: FindManyOptions<Entity>): Promise<[Entity[], number]> {
    return Promise.resolve([[], 0]);
  }
  findAndCountBy(where: FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[]): Promise<[Entity[], number]> {
    return Promise.resolve([[], 0]);
  }
  findOne(options: FindOneOptions<Entity>): Promise<Entity | null> {
    return Promise.resolve(null);
  }
  findOneBy(where: FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[]): Promise<Entity | null> {
    return Promise.resolve(null);
  }
}