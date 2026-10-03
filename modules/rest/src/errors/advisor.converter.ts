import { Configuration, Converter, getMethodWithDecorator, getTypeOf, hasDecorator } from '@pmeig/srv-core';
import { ControllerAdvisor, Catch } from './advisor.decorators';
import { retrieveExceptionAdvisor, retrievePathAdvisor } from './advisor.services';
import { RestErrorMiddleware } from '../rest.middleware';
import type { RestRequest, RestResponse } from '../http/http.type';
import { Method } from '../models/rest.type';
import { match } from 'node-match-path';

@Configuration
export class AdvisorConverter extends Converter<Advisor> {
  hasConverter(value: any): boolean {
    return hasDecorator(getTypeOf(value), ControllerAdvisor);
  }

  to(advisor: any): any {
    const prototype = getTypeOf(advisor);
    const path = retrievePathAdvisor(prototype);
    const methods = getMethodWithDecorator(advisor, Catch).map(value => {
      return {
        method: advisor[value].bind(advisor),
        error: retrieveExceptionAdvisor(advisor, value)
      };
    });
    return new Advisor(path, methods);
  }
}

class Advisor extends RestErrorMiddleware {
  private readonly regexes: (RegExp | string)[] = [];
  constructor(
    path: (RegExp | string)[],
    private readonly methods: { method: any; error: string | undefined }[]
  ) {
    super();
    this.global = path.length === 0;
    this.regexes = path.flatMap(regex => {
      const result: (RegExp | string)[] = [];
      if (typeof regex === 'string') {
        result.push(regex);
        result.push(regex + '/*');
      } else {
        result.push(regex);
        result.push(new RegExp(regex.source + '/.*', regex.flags));
      }
      return result;
    });
  }

  accept(path: string, _method?: Method): boolean {
    const controls = [path, path.slice(1)];
    return this.regexes.some(tester => controls.some(url => match(tester, url).matches));
  }

  use(error: Error, response: RestResponse, request: RestRequest): void | Promise<void> {
    const errorName = Object.getPrototypeOf(error).constructor.name;
    const method = this.methods.find(value => value.error === errorName)?.method;
    if (method) {
      return method(error, response, request);
    }
    throw error;
  }
}
