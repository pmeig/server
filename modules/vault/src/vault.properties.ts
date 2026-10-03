export class VaultCredentials {
  constructor(
    public role: string = process.env.VAULT_ROLE_ID ?? '',
    public secret: string = process.env.VAULT_SECRET_ID ?? ''
  ) {}
}

export interface VaultKubernetesPlugin {
  enable: boolean;
  token_path?: string;
  token?: string;
}

export class VaultPlugins {
  constructor(
    public kubernetes: VaultKubernetesPlugin = {
      enable: process.env.VAULT_PLUGIN_KUBE === 'true',
      token_path: process.env.VAULT_KUBE_TOKEN_PATH,
      token: process.env.VAULT_KUBE_TOKEN
    }
  ) {}
}

export class VaultProperties {
  constructor(
    public credentials: VaultCredentials = new VaultCredentials(),
    public plugins: VaultPlugins = new VaultPlugins(),
    public endpoint: string = process.env.VAULT_ADDRESS ?? 'https://vault.factory.cloud',
    public namespace: string = process.env.VAULT_NAMESPACE ?? '',
    // Vault is only called when enabled (production): VAULT_ENABLED=true
    public enabled: boolean = process.env.VAULT_ENABLED === 'true'
  ) {}
}
