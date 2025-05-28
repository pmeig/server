export class EnvironmentContext {
  location = './resources';
  watch = false;
  profiles: string[] = [];
  vault = false;

  constructor(update?: Partial<EnvironmentContext>) {
    if (update) {
      Object.entries(update).forEach(([key, value]) => {
        this[key] = value;
      });
    }
  }
}
