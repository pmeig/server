import { Context } from './context.model';

export abstract class Bootable {
  abstract run(context: Context, ...args: any[]): Promise<void | any>;

  // noinspection JSUnusedLocalSymbols
  close(context: Context): Promise<void> | void {}
}
