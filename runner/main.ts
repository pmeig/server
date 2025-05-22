import { Component, Module, Optional, Order, Properties, Service } from '@server/core';

interface Named {
  name: string;
}

@Component
@Order(-5)
class First implements Named {
  name = 'first';

  toString(): string {
    return this.name;
  }
}

@Properties('test')
class Third implements Named {
  name = 'third';

  toString(): string {
    return this.name;
  }
}

@Service
class Second extends First implements Named {
  override name = 'second';

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

  constructor(private readonly third: Third) {}

  toString(): string {
    return `me: ${this.name}, param: ${this.third ?? 'undefined'}`;
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
        useFactory: context => {
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
