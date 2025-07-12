import { Component, Scope, Type } from '@pmeig/srv-core';

@Component
@Scope('request')
export class RestControllerResolver {
  constructor(
    public controller: Type<any> | undefined = undefined,
    public method: string = ''
  ) {}
}
