export class VaultCredentials {
  constructor(
    public readonly role: string = process.env.VAULT_ROLE_ID ?? '',
    public readonly secret: string = process.env.VAULT_SECRET_ID ?? ''
  ) {}
}

export interface VaultKubernetesPlugin {
  enable: boolean;
  token_path?: string;
  token?: string;
}

export class VaultPlugins {
  constructor(
    public readonly kubernetes: VaultKubernetesPlugin = {
      enable: process.env.VAULT_PLUGIN_KUBE === 'true',
      token_path: process.env.VAULT_KUBE_TOKEN_PATH,
      token: process.env.VAULT_KUBE_TOKEN
    }
  ) {}
}

export class VaultProperties {
  constructor(
    public readonly credentials: VaultCredentials,
    public readonly plugins: VaultPlugins,
    public readonly endpoint: string = process.env.VAULT_ADDRESS ?? 'https://vault.factory.cloud',
    public readonly namespace: string = process.env.VAULT_NAMESPACE ?? ''
  ) {}
}
