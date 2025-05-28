import { Component, Lifecycle, List, Module, Optional, Order, ApplicationContext } from '@server/core';
import { randomBytes } from 'crypto';

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

@Module({
  providers: [Third, First]
})
export class ThirdFourthModule {}

export const main = async () => {
  const module = new ApplicationContext({
    providers: [OverrideFirst, Second],
    imports: [ThirdFourthModule]
  });
  console.log(await module.resolveRequired(First));
  console.log(await module.resolveRequired(Second));
  console.log(await module.resolve(Third));
  // console.log(await module.resolveRequired(Fourth));
};

main();
