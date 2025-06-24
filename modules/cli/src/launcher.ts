import { dirname, resolve } from 'path';
import { existsSync } from 'fs';
import pino from 'pino';
import { spawn } from 'node:child_process';

export interface ConsoleCommand {
  success: string[];
  error: string[];
  code: number;
  exception?: Error;
}

export class Launcher {
  private env: Record<string, string> = {};
  private static readonly logger = pino({
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname'
      }
    }
  });

  constructor(
    private readonly manager?: 'pnpm' | 'npm' | string,
    private readonly workspace = process.cwd(),
    private readonly printCommand = false
  ) {
    // noinspection JSDeprecatedSymbols
    const separator = process.platform === 'win32' ? ';' : ':';
    this.env = {
      ...process.env,
      Path: dirname(process.argv[0]) + separator + process.env.Path
    };
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
    return new Launcher(this.manager, cwd, this.printCommand);
  }

  bin(bin: string): Launcher {
    return new Launcher(bin, this.workspace, this.printCommand);
  }

  print(): Launcher {
    return new Launcher(this.manager, this.workspace, true);
  }

  launch(...args: any[]): Promise<ConsoleCommand>;
  launch(argument: string, ...args: any[]): Promise<ConsoleCommand>;
  launch(argument: string, ...args: any[]): Promise<ConsoleCommand> {
    return new Promise((resolve, reject) => {
      const consoleCommand: ConsoleCommand = {
        error: [],
        success: [],
        code: 0
      };
      const log = this.printCommand
        ? {
            info: (message: string) => Launcher.logger.info(message),
            error: (message: string | Error) => Launcher.logger.error(message)
          }
        : {
            info: (_: string) => {},
            error: (_: string | Error) => {}
          };
      const thread = spawn(this.manager!, [argument, ...args], {
        cwd: this.workspace,
        shell: true
      });

      thread.on('error', error => {
        log.error(error);
        consoleCommand.exception = error;
        reject(consoleCommand);
      });
      thread.stderr?.on('data', data => {
        consoleCommand.error.push(data.toString());
        log.error(data.toString());
      });
      thread.stdout?.on('data', data => {
        const line = data.toString();
        if (!line.includes(`${argument} "${args.join('" "')}"`)) {
          consoleCommand.success.push(line);
        }
        log.info(data.toString());
      });
      thread.on('close', code => {
        consoleCommand.code = code ?? 0;
        // consoleCommand.success.shift();
        consoleCommand.error = consoleCommand.error.filter(error => {
          const message = error.trim();
          return !['Debugger listening on', 'Debugger attached', 'Waiting for the debugger to disconnect...'].some(
            starter => message.startsWith(starter)
          );
        });
        if (consoleCommand.code !== 0) {
          reject(consoleCommand);
        } else {
          resolve(consoleCommand);
        }
      });
    });
  }
}

export const launcher = new Launcher();
