import { ApplicationContext, Component, Lifecycle, List, Module, Optional, Order, Scope } from '@server/core';
import { randomBytes } from 'crypto';
import { Properties, PropertiesModule } from '@server/properties';
import { Controller, Delete, Get, MvcModule, Put } from '@server/mvc';

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

@Properties('check')
@Scope('request')
export class CheckBreak {
  break = '';
}

@Controller('test')
export class TestController {
  constructor(
    private readonly props: Props,
    private readonly context: ApplicationContext
  ) {}

  @Get('test')
  async test() {
    return 'testing';
  }

  @Put('test')
  put() {}

  @Delete('delete')
  delete() {}
}

@Module({
  imports: [PropertiesModule, MvcModule],
  providers: [Third, First, TestController, Props]
})
export class ThirdFourthModule {}

export const server = ApplicationContext.run(ThirdFourthModule, process.argv.slice(2));
