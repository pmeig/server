import { Properties } from './properties.decorators';
import { readFileSync } from 'fs';

@Properties('application')
export class ApplicationProperties {
  name: string;
  version: string;
  description: string;
  author: string;

  /* eslint-disable */
  constructor() {
    try {
      const json = readFileSync('package.json', 'utf8');
      if (json) {
        const packageJson = JSON.parse(json);
        this.name = packageJson.name;
        this.version = packageJson.version;
        this.description = packageJson.description;
        this.author = packageJson.author;
      }
    } catch (error) {
      setTimeout(() => {
        if (!this.name) {
          console.warn(
            'if you want to use the application.properties without application properties section, you must have a package.json file (add package.json in your project)'
          );
        }
      }, 250);
    }
  }
}
