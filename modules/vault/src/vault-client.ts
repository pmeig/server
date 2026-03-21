import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { existsSync, readFileSync } from 'fs';
import { VaultKubernetesPlugin, VaultProperties } from './vault.properties';
import { VaultHealth } from './vault-health';
import { Component, Nullable } from '@pmeig/srv-core';

export type VaultNode = { [key: string]: string | undefined };

interface VaultLogin {
  auth: { client_token: string; lease_duration: number };
}

@Component
export class VaultClient {
  private ttl = new Date();
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
    return this.getData(path).then(data => {
      let value: T | string | undefined = data as T | undefined;
      if (key) {
        value = data?.hasOwnProperty(key) ? data[key] : undefined;
      }
      return typeof value === 'undefined' ? Promise.reject('element not found with path ' + path) : value;
    });
  }

  health(): Promise<Nullable<VaultHealth>> {
    return this.getResponseBody(
      this.vaultClient.get<VaultHealth>('sys/health', {
        headers: { 'X-Vault-Namespace': '', 'X-Vault-Token': '' }
      })
    );
  }

  private getData<T extends VaultNode>(path: string): Promise<Nullable<T>> {
    return this.apply(() =>
      this.getResponseBody<{ data: { data: T } }>(this.vaultClient.get('secret/data/' + path)).then(
        response => response?.data?.data
      )
    ).catch(() => undefined as unknown as T);
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
  if (!vaultProperties?.credentials?.role && !vaultProperties?.credentials?.secret) return undefined;
  const vaultClient = new VaultClient(vaultProperties);
  const health = await vaultClient.health();
  if (!health || !health.initialized) {
    return undefined;
  }
  return vaultClient;
};
