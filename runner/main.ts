import { Component, Module, Optional, Order, Properties, Service, List, Lifecycle } from '@server/core';
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

@Properties('test')
class Third implements Named, Lifecycle {
  name = 'third';
  id = randomBytes(16).toString('hex');

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
    return this.name;
  }
}

@Service
class Second extends First implements Named {
  override name = 'second';
  id = randomBytes(16).toString('hex');

  constructor(@Optional private readonly third?: Third) {
    super();
  }

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

export const main = async () => {
  const module = new Module({
    providers: [
      First,
      Second,
      Fourth,
      {
        provide: Third,
        useFactory: () => {
          return new Promise(resolve => resolve(new Third()));
        },
      },
    ],
  });
  console.log(await module.resolveRequired(First));
  console.log(await module.resolveRequired(Second));
  console.log(await module.resolve(Third));
  console.log(await module.resolveRequired(Fourth));
};

main();
