import { exec } from 'child_process';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';

export interface ConsoleCommand {
  success: string[];
  error: string[];
  exception?: Error;
}

export class Launcher {
  constructor(
    private readonly manager?: 'pnpm' | 'npm' | string,
    private readonly workspace = process.cwd()
  ) {
    if (!this.manager) {
      let current = process.cwd();
      do {
        const path = resolve(current, 'pnpm-lock.yaml');
        if (existsSync(path)) {
          this.manager = 'pnpm';
        } else {
          const path = resolve(current, 'package-lock.json');
          if (existsSync(path)) {
            this.manager = 'npm';
          }
        }
        current = dirname(current);
      } while (!this.manager && !current.endsWith('\\') && !current.endsWith('/'));
    }
  }

  cwd(cwd: string): Launcher {
    return new Launcher(this.manager, cwd);
  }

  bin(bin: string): Launcher {
    return new Launcher(bin, this.workspace);
  }

  launch(...args: any[]): Promise<ConsoleCommand>;
  launch(argument: string, ...args: any[]): Promise<ConsoleCommand>;
  launch(argument: string, ...args: any[]): Promise<ConsoleCommand> {
    return new Promise((resolve, reject) => {
      const consoleCommand: ConsoleCommand = {
        error: [],
        success: [],
      };
      const thread = exec(
        `${this.manager} ${argument} ${args.join(' ')}`,
        {
          cwd: this.workspace,
          encoding: 'utf8',
        },
        (error, stdout, stderr) => {
          if (error) {
            consoleCommand.exception = error;
          }
          if (stderr) {
            consoleCommand.error.push(stderr);
          }
          if (stdout) {
            consoleCommand.success.push(stdout);
          }
        }
      );
      thread.on('close', () => resolve(consoleCommand));
      thread.on('error', () => reject(consoleCommand));
    });
  }
}

export const launcher = new Launcher();
