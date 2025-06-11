import { ApplicationContext, Component, Lifecycle, List, Module, Optional, Order, Scope } from '@server/core';
import { randomBytes } from 'crypto';
import { Properties, PropertiesModule } from '@server/properties';
import { Controller, Delete, Get, Params, Put, Req, Res, RestModule } from '@server/rest';
import * as express from 'express';

interface Named {
  name: string;
}

@Component
@Order(-5)
class First implements Named {
  name = 'first';
  id = randomBytes(16).toString('hex');

  toString(): string {
    return this.name;
  }
}

@Component
class Third implements Named, Lifecycle {
  name = 'third';
  id = randomBytes(16).toString('hex');

  constructor(private readonly first: First) {}

  destroy(): Promise<void> {
    console.log('destroy');
    return Promise.resolve(undefined);
  }

  dispose(): Promise<void> {
    console.log('dispose');
    return Promise.resolve(undefined);
  }

  initialize(): Promise<void> {
    console.log('initialize');
    return Promise.resolve(undefined);
  }

  refresh(): Promise<void> {
    console.log('refresh');
    return Promise.resolve(undefined);
  }

  toString(): string {
    return this.name + ', first: ' + this.first.name;
  }
}

@Component
class Second implements Named {
  name = 'second';
  id = randomBytes(16).toString('hex');

  constructor(@Optional private readonly third?: Third) {}

  toString(): string {
    return `me: ${this.name}, param: ${this.third ?? 'undefined'}`;
  }
}

@Component
class Fourth implements Named {
  name = 'fourth';
  id = randomBytes(16).toString('hex');

  constructor(@List(First) private readonly param: First[]) {}

  toString(): string {
    return `me: ${this.name}, param: ${this.param ?? 'undefined'}`;
  }
}

@Component
export class OverrideFirst extends First {
  override name = 'override';
  id = randomBytes(16).toString('hex');
}

@Properties('test.properties')
export class Props {
  test = 'test';
  toto = 'toto';
  popo = 'popo';
  lolo = 'lolo';
}

@Properties('check')
export class CheckContinue {
  continue = true;
}

@Component
@Scope('request')
export class ScopedRequest {
  message = 0;
  sub = {
    testing: 10
  };
}

@Component
export class TestService {
  constructor(public readonly test: ScopedRequest) {}
}

@Controller('test')
export class TestController {
  constructor(
    private readonly props: Props,
    private readonly context: ApplicationContext,
    private readonly testScopedRequest: ScopedRequest,
    private readonly testService: TestService
  ) {}

  @Get(':id/:number')
  async test(@Req request: express.Request, @Res response: express.Response, @Params params: Record<string, any>) {
    this.testService.test.sub.testing++;
    this.testService.test.message += 5;
    return this.testScopedRequest.message;
  }

  @Put('test')
  put() {}

  @Delete('delete')
  delete() {}
}

@Module({
  imports: [PropertiesModule, RestModule],
  providers: [Third, First, TestController, Props, ScopedRequest, TestService]
})
export class ThirdFourthModule {}

export const server = ApplicationContext.run(ThirdFourthModule, process.argv.slice(2));
