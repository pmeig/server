import { Component, Decorators } from '@pmeig/srv-core';
import { DataSource } from '../decorator/datasource.decorator';

export const Repository = (datasource?: string) => Decorators.class('Repository', target => {
  Component(target);
  DataSource(datasource)(
    target
  )
});