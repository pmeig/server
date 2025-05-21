import { exec } from 'child_process';

export interface ConsoleCommand {
  success: string[];
  error: string[];
  exception?: Error;
}

export class Command {
  private readonly launcher = 'tsc';

  constructor(private readonly manager: 'pnpm' | 'npm' = 'pnpm') {}

  launch(...args: any[]): Promise<ConsoleCommand>;
  launch(argument: string, ...args: any[]): Promise<ConsoleCommand>;
  launch(argument: string, ...args: any[]): Promise<ConsoleCommand> {
    return new Promise((resolve, reject) => {
      const consoleCommand: ConsoleCommand = {
        error: [],
        success: [],
      };
      const thread = exec(`${this.manager} ${this.launcher} ${argument} ${args.join(' ')}`, (error, stdout, stderr) => {
        if (error) {
          consoleCommand.exception = error;
        }
        if (stderr) {
          consoleCommand.error.push(stderr);
        }
        if (stdout) {
          consoleCommand.success.push(stdout);
        }
      });
      thread.on('close', () => resolve(consoleCommand));
      thread.on('error', () => reject(consoleCommand));
    });
  }
}
