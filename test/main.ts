import { Component, Properties, Service, Module } from '@server/core';

interface Named {
  name: string;
}

@Component
class First implements Named {
  name = 'first';
}

@Service
class Second implements Named {
  name = 'second';
}

@Properties('test')
class Third implements Named {
  name = 'third';
}

class Fourth implements Named {
  name = 'fourth';
}

export const main = () => {
  const module = new Module([First, Second, Third]);
  module.init();
  console.log(module.resolveRequired(First).name);
  console.log(module.resolveRequired(Second).name);
  console.log(module.resolveRequired(Third).name);
  console.log(module.resolve(Fourth)?.name);
};

main();
