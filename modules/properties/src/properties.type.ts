export interface PropertiesFile<T extends Record<string, any> = Record<string, any>> {
  properties: T;
  sources: string[];
}
