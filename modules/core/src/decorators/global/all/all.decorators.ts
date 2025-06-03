import { Decorators } from '../../decorator.builder';
import { Decorator } from '../../type.decorators';

let DECORATOR_NOT = false;
let DECORATOR_OR = false;

export const DECORATOR_STATE = {
  get not() {
    return DECORATOR_NOT;
  },
  get or() {
    return DECORATOR_OR;
  },
  complete: () => {}
};

export const Not = (...decorators: Decorator[]) => applyGlobalConfig('Not', decorators, () => switchNot());

export const Or = (...decorators: Decorator[]) => applyGlobalConfig('Or', decorators, () => switchOr());

const applyGlobalConfig = (name: string, decorators: Decorator[], switcher: () => void) =>
  Decorators.all(name, (...args) => {
    switcher();
    decorators.forEach(decorator => decorator(...args));
    switcher();
    DECORATOR_STATE.complete();
    DECORATOR_STATE.complete = () => {};
  });

const switchNot = () => (DECORATOR_NOT = !DECORATOR_NOT);
const switchOr = () => (DECORATOR_OR = !DECORATOR_OR);
