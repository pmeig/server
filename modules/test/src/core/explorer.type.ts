export type Reader = { on: (event: 'line', listener: (line: string) => void) => void };
