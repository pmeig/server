export interface EnvConfig {
  location: string;
  watch: boolean;
  profiles: string[];
  vault: boolean;
}

export const isEnvConfig = (value: any): value is EnvConfig => {
  return value && typeof value === 'object' && ['location', 'watch', 'profiles', 'vault'].every(key => key in value);
};
