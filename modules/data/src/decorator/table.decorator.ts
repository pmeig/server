import { Component, Decorators, Type } from '@pmeig/srv-core';
import { Entity } from 'typeorm';
import { EntityOptions } from 'typeorm/decorator/options/EntityOptions';
import { DataSource } from './datasource.decorator';

export type TableEntityOptions = EntityOptions & { dataSource?: string };

export const TableEntity = (name?: string | TableEntityOptions, options?: TableEntityOptions) => {
  let entityApply = (target: Type<any>) => Entity()(target);
  if (name) {
    if (typeof name === 'string') entityApply = target => Entity(name, options)(target);
    else entityApply = target => Entity(name)(target);
  }
  return Decorators.class('TableEntity', target => {
    Component(target);
    entityApply(target);
    DataSource(options?.dataSource)(target);
  });
};