import { Context } from './context.model';

export abstract class Bootable {
  abstract run(context: Context, ...args: any[]): Promise<void | any>;

  close(context: Context): Promise<void> | void {}
}
