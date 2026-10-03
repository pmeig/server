import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { existsSync, readFileSync } from 'fs';
import { VaultKubernetesPlugin, VaultProperties } from './vault.properties';
import { VaultHealth } from './vault-health';
import { Component, Nullable } from '@pmeig/srv-core';

export type VaultNode = { [key: string]: string | undefined };

/** Secret engine as listed by sys/internal/ui/mounts, keyed by its path ("pmeig/budget/"). */
export interface VaultMount {
  type: string;
  options?: Nullable<{ version?: string }>;
}

export type VaultMounts = Record<string, VaultMount>;

interface VaultLogin {
  auth: { client_token: string; lease_duration: number };
}

const isKvV2 = (mount: VaultMount) => mount.type === 'kv' && mount.options?.version === '2';

/**
 * Finds the engine mounted on the longest prefix of the path and, for a KV v2 engine, replaces that engine path
 * by "<engine path>/data": "pmeig/budget/app" on "pmeig/budget/" → "pmeig/budget/data/app".
 * Returns undefined when no engine is mounted on the path.
 */
export const toSecretPath = (path: string, mounts: VaultMounts): { path: string; kvV2: boolean } | undefined => {
  const normalized = path.replace(/^\/+|\/+$/g, '');
  const mountPath = Object.keys(mounts)
    .filter(mount => `${normalized}/`.startsWith(mount))
    .sort((a, b) => b.length - a.length)[0];
  if (!mountPath) return undefined;
  const kvV2 = isKvV2(mounts[mountPath]);
  return {
    path: kvV2 ? `${mountPath}data/${normalized.substring(mountPath.length)}`.replace(/\/$/, '') : normalized,
    kvV2
  };
};

@Component
export class VaultClient {
  private ttl = new Date();
  private mounts?: VaultMounts;
  private vaultClient: AxiosInstance;

  constructor(private readonly vaultProperties?: VaultProperties) {
    if (vaultProperties) {
      this.vaultClient = axios.create({
        baseURL: `${vaultProperties.endpoint}/v1`,
        headers: { 'X-Vault-Namespace': vaultProperties.namespace }
      });
    }
  }

  read<T extends VaultNode>(path: string): Promise<T>;
  read(path: string, key: string): Promise<string>;
  read<T extends VaultNode>(path: string, key?: string): Promise<T | string> {
    if (!this.enabled) return Promise.resolve(undefined as unknown as T);
    return this.getData(path).then(data => {
      let value: T | string | undefined = data as T | undefined;
      if (key) {
        value = data?.hasOwnProperty(key) ? data[key] : undefined;
      }
      return typeof value === 'undefined' ? Promise.reject('element not found with path ' + path) : value;
    });
  }

  /** False when VAULT_ENABLED is not "true": the client then never calls Vault. */
  get enabled(): boolean {
    return !!this.vaultProperties?.enabled;
  }

  health(): Promise<Nullable<VaultHealth>> {
    if (!this.enabled) {
      return Promise.resolve({ initialized: false, sealed: true, standby: false } as VaultHealth);
    }
    return this.getResponseBody(
      this.vaultClient.get<VaultHealth>('sys/health', {
        headers: { 'X-Vault-Namespace': '', 'X-Vault-Token': '' }
      })
    );
  }

  /**
   * Secret engines the token can access. sys/internal/ui/mounts needs no dedicated policy (sys/mounts does):
   * Vault filters it with the token policies. Cached once loaded.
   */
  listMounts(): Promise<VaultMounts> {
    if (!this.enabled) return Promise.resolve({});
    if (this.mounts) return Promise.resolve(this.mounts);
    return this.apply(() =>
      this.getResponseBody<{ data: { secret: VaultMounts } }>(this.vaultClient.get('sys/internal/ui/mounts'))
    ).then(response => {
      const mounts = response?.data?.secret;
      if (mounts) this.mounts = mounts;
      return mounts ?? {};
    });
  }

  private getData<T extends VaultNode>(path: string): Promise<Nullable<T>> {
    return this.listMounts()
      .then(mounts => {
        const secret = toSecretPath(path, mounts);
        if (!secret) return undefined;
        return this.apply(() =>
          this.getResponseBody<{ data: T | { data: T } }>(this.vaultClient.get(secret.path)).then(response =>
            secret.kvV2 ? (response?.data as Nullable<{ data: T }>)?.data : (response?.data as Nullable<T>)
          )
        );
      })
      .catch(() => undefined as unknown as T);
  }

  private isTokenExpired(): boolean {
    return new Date().getTime() > this.ttl.getTime();
  }

  private apply<T = unknown>(func: () => Promise<T>): Promise<Nullable<T>> {
    return (this.isTokenExpired() ? this.initVaultClient().then(() => func()) : func()).catch(() => {
      return undefined;
    });
  }

  private initVaultClient(): Promise<void> {
    const kubernetes: VaultKubernetesPlugin = this.vaultProperties?.plugins?.kubernetes ?? {
      enable: false
    };
    let login: Promise<Nullable<VaultLogin>> | undefined;
    try {
      if (kubernetes.enable && kubernetes.token_path && existsSync(kubernetes.token_path)) {
        const jwt = readFileSync(kubernetes.token_path).toString();
        login = this.getResponseBody(
          this.vaultClient.post<VaultLogin>(`auth/${process.env.VAULT_K8S_AUTH_PATH}/login`, {
            jwt,
            role: process.env.VAULT_ROLE_NAME
          })
        );
      } else {
        login = this.getResponseBody(
          this.vaultClient.post<VaultLogin>('auth/approle/login', {
            role_id: this.vaultProperties?.credentials?.role,
            secret_id: this.vaultProperties?.credentials?.secret
          })
        );
      }
    } catch (error) {
      return Promise.reject(error);
    }

    return login?.then(response => {
      this.ttl = new Date();
      this.ttl.setSeconds(this.ttl.getSeconds() + (response?.auth?.lease_duration ?? 0));
      this.vaultClient.defaults.headers.common['X-Vault-Token'] = response?.auth?.client_token;
    });
  }

  private getResponseBody<T = any>(response: Promise<AxiosResponse<Nullable<T>>>): Promise<Nullable<T>> {
    try {
      return response.then(value => (value.status < 300 ? value.data : Promise.reject()));
    } catch (error) {
      return Promise.reject(error);
    }
  }
}

export const createVaultClient = async (vaultProperties?: VaultProperties) => {
  if (!vaultProperties?.enabled) return undefined;
  if (!vaultProperties?.credentials?.role && !vaultProperties?.credentials?.secret) return undefined;
  const vaultClient = new VaultClient(vaultProperties);
  const health = await vaultClient.health();
  if (!health || !health.initialized) {
    return undefined;
  }
  return vaultClient;
};
