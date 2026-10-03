import { VaultCredentials, VaultPlugins, VaultProperties } from '@pmeig/srv-vault';
import { Env } from '../environment/model/env';
import { readAllProperties } from './io.helper';
import { EnvironmentItem } from '../environment/environment.item';
import { PropertiesFile } from '../properties.type';

const REGEX_INJECTOR_KEY = new RegExp('\\${(.*?)}', 'g');

export const mergeArray = (origin: any[], newValue: any[]) => {
  origin.push(...newValue);
  return origin;
};

export const mergeRecord = (origin: Record<string, any>, newValue: Record<string, any>) => {
  Object.entries(newValue).forEach(([key, value]) => {
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        origin[key] = mergeArray(origin[key] ?? [], value);
      } else origin[key] = mergeRecord(origin[key] ?? {}, value);
    } else {
      origin[key] = value;
    }
  });
  return origin;
};

export const extractKeys = (value: string) => {
  const matches = value.matchAll(REGEX_INJECTOR_KEY);
  let match = matches.next();
  const keys: string[] = [];
  while (!match.done) {
    keys.push(match.value[1]);
    match = matches.next();
  }
  return keys;
};

export const initProperties = (
  env: PropertiesFile,
  type: 'bootstrap' | 'app',
  profiles: string[],
  sourcesLocation: string = './resources'
) => {
  const properties = readAllProperties(type, profiles, sourcesLocation);
  return {
    sources: Object.freeze([...env.sources, ...properties.sources]),
    properties: EnvironmentItem.from(mergeRecord(env.properties, properties.properties))
  };
};

export const findVaultProperties = async (bootstrap: Env) => {
  const properties = await bootstrap.find<Record<string, any>>('secrets.vault', () => {});
  const vaultProperties = new VaultProperties(new VaultCredentials(), new VaultPlugins());
  if (properties) {
    vaultProperties.endpoint = properties['endpoint'] ?? vaultProperties.endpoint;
    vaultProperties.namespace = properties['namespace'] ?? vaultProperties.namespace;
    vaultProperties.credentials.role = properties['credentials']?.['role'] ?? vaultProperties.credentials.role;
    vaultProperties.credentials.secret = properties['credentials']?.['secret'] ?? vaultProperties.credentials.secret;
    vaultProperties.plugins.kubernetes = properties['plugins']?.['kubernetes'] ?? vaultProperties.plugins.kubernetes;
    // boolean or "true"/"false" string (e.g. enabled: ${VAULT_ENABLED})
    vaultProperties.enabled =
      typeof properties['enabled'] === 'undefined' ? vaultProperties.enabled : String(properties['enabled']) === 'true';
  }
  return vaultProperties;
};
