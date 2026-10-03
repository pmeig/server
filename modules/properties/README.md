# @pmeig/srv-properties

A powerful configuration management module providing property injection, environment profiles, conditional loading, and Vault integration. Built for the @pmeig/srv framework ecosystem with decorator-based configuration binding and hot-reload capabilities.

## Installation

```bash
  npm install @pmeig/srv-properties
```


## Features

- 🎯 **Property Injection** - Decorator-based configuration binding to classes
- 📁 **Multiple Sources** - Support for .properties, YAML, JSON, and environment variables
- 🌍 **Environment Profiles** - Profile-based configuration with automatic activation
- 🔄 **Hot Reload** - Automatic configuration refresh during development
- 🗝️ **Vault Integration** - Secure configuration storage with HashiCorp Vault
- 📦 **Bootstrap Configuration** - Early configuration loading for framework setup
- ✨ **Conditional Loading** - Profile and property-based conditional bean creation
- 🔍 **Property Resolution** - Hierarchical property lookup with fallbacks
- 🛠️ **Type Safety** - Full TypeScript support with type inference
- 📱 **Watch Mode** - File system watching for configuration changes

## Usage

### Import the Module
```typescript
import { PropertiesModule } from '@pmeig/srv-properties';
import { Module } from '@pmeig/srv-core';

@Module({
  imports: [PropertiesModule],
  // ...
})
export class AppModule {}
```


### Basic Property Injection
```typescript
import { Properties } from '@pmeig/srv-properties';
import { Component } from '@pmeig/srv-core';

@Properties('database')
@Component
export class DatabaseConfig {
  host: string = 'localhost';
  port: number = 5432;
  username: string = 'admin';
  password: string = '';
  database: string = 'myapp';
  
  // Properties are automatically injected from configuration files
  // database.host, database.port, etc.
}
```


### Application Properties
```typescript
import { ApplicationProperties } from '@pmeig/srv-properties';
import { Component } from '@pmeig/srv-core';

@Component
export class MyService {
  constructor(private readonly appProps: ApplicationProperties) {}
  
  getAppInfo() {
    return {
      name: this.appProps.name,
      version: this.appProps.version,
      description: this.appProps.description
    };
  }
}
```


### Environment-Based Configuration
```typescript
import { Environment } from '@pmeig/srv-properties';
import { Component } from '@pmeig/srv-core';

@Component
export class ConfigService {
  constructor(private readonly env: Environment) {}
  
  async getDatabaseUrl() {
    // Get with fallback
    const host = await this.env.find('database.host', 'localhost');
    const port = await this.env.find('database.port', 5432);
    return `postgresql://${host}:${port}/mydb`;
  }
  
  async getRequiredConfig() {
    // Throws error if not found
    const apiKey = await this.env.get('api.key');
    return apiKey;
  }
  
  isProduction() {
    return this.env.hasProfiles('prod', 'production');
  }
}
```


## API Reference

### Property Decorators

| Decorator | Type | Description |
|-----------|------|-------------|
| `@Properties(prefix)` | Class | Injects properties with specified prefix into class fields |

### Configuration Sources

The module loads configuration from multiple sources in order of precedence:

1. **Environment Variables** - Process environment variables
2. **Command Line Arguments** - Runtime arguments
3. **application-{profile}.properties** - Profile-specific properties
4. **application.properties** - Default application properties
5. **bootstrap-{profile}.properties** - Profile-specific bootstrap
6. **bootstrap.properties** - Bootstrap configuration

### Property File Formats

#### Properties Format


#### YAML Format
```yaml
# application.yml
database:
  host: localhost
  port: 5432
  username: admin
  password: ${DB_PASSWORD:defaultpass}

app:
  features:
    authentication: true
    logging:
      level: DEBUG
```


## Profile Management

### Activating Profiles
```shell script
# Environment variable
APP_PROFILES=dev,debug

# Command line
node app.js --profiles=dev,debug
```


### Profile-Specific Configuration
```
resources/
├── application.properties          # Default configuration
├── application-dev.properties      # Development profile
├── application-prod.properties     # Production profile
├── application-test.properties     # Test profile
└── bootstrap.properties           # Bootstrap configuration
```


### Profile-Based Conditional Loading
```typescript
import { Profiles, ConditionalProperties } from '@pmeig/srv-properties';
import { Component } from '@pmeig/srv-core';

@Component
@Profiles('dev', 'test') // Only loads in dev or test profiles
export class DevOnlyService {
  // Development-specific service
}

@Component
@ConditionalProperties('feature.enabled', 'true') // Only if feature.enabled=true
export class ConditionalService {
  // Conditionally loaded service
}
```


## Environment Configuration

### Environment Interface
```typescript
interface Environment {
  // Get property (throws if not found)
  get<T>(key: string): Promise<T>;
  
  // Find property with optional default
  find<T>(key: string, defaultValue?: T): Promise<T | undefined>;
  
  // Check active profiles
  hasProfiles(...profiles: string[]): boolean;
  
  // Get configuration sources
  readonly sources: string[];
}
```


### Property Resolution Examples
```typescript
@Component
export class ConfigurationService {
  constructor(private readonly env: Environment) {}
  
  async loadDatabaseConfig() {
    // Simple property
    const host = await this.env.find('db.host', 'localhost');
    
    // Nested object
    const dbConfig = await this.env.find('database', {
      host: 'localhost',
      port: 5432
    });
    
    // Array values
    const servers = await this.env.find('servers', []);
    
    // Required property (throws if missing)
    const apiKey = await this.env.get('api.secret-key');
    
    return { host, dbConfig, servers, apiKey };
  }
}
```


## Configuration File Structure

### Bootstrap vs Application Configuration

**Bootstrap Configuration** (`bootstrap.properties`):
- Loaded early in application startup
- Used for framework configuration
- Available during module initialization
- Cannot be refreshed during runtime

**Application Configuration** (`application.properties`):
- Loaded after bootstrap phase
- Used for business logic configuration
- Supports hot reload in watch mode
- Injected into application components

### Property Hierarchy
```
Process Environment Variables
    ↓
Command Line Arguments
    ↓
application-{profile}.yml
    ↓
application.yml
    ↓
bootstrap-{profile}.properties
    ↓
bootstrap.properties
```


## Vault Integration

### Vault Configuration
```yaml
# bootstrap.properties
vault:
  enabled: true
  uri: 'https://vault.example.com:8200'
  token: ${VAULT_TOKEN}
  namespace: myapp
```

Vault is disabled unless `VAULT_ENABLED=true` (or `enabled: true` in the configuration above, which overrides the
environment variable). When disabled, no Vault client is created and `VaultClient` never calls Vault: `read()`
resolves `undefined` and `health()` reports a non-initialized, sealed Vault.


### Vault Property References
```yaml
database:
  password: vault(path/secrets/database, key_secrets_password)
```

The path is given without `/data`: the client lists the secret engines the token can access
(`sys/internal/ui/mounts`, no dedicated policy needed), takes the engine mounted on the longest prefix of the path
and, for a KV v2 engine, inserts `/data` after it (`pmeig/budget/app` on the engine `pmeig/budget/` →
`pmeig/budget/data/app`). KV v1 paths are read as is.


## Hot Reload and Watch Mode

### Enabling Watch Mode
```shell script
# Environment variable
APP_MODE=WATCH

```


## Advanced Configuration Patterns

### Nested Property Objects
```typescript
@Properties('server')
export class ServerConfig {
  http: {
    port: number;
    host: string;
    cors: {
      enabled: boolean;
      origins: string[];
    };
  } = {
    port: 3000,
    host: '0.0.0.0',
    cors: {
      enabled: true,
      origins: ['*']
    }
  };
}
```


## Dependencies

- **@pmeig/srv-core**: workspace:* - Core dependency injection and decorators
- **@pmeig/srv-vault**: workspace:* - HashiCorp Vault integration
- **js-yaml**: ^4.1.0 - YAML file parsing
- **rxjs**: ^7.8.2 - Reactive programming for hot reload

## Compatibility

- Node.js: 18+
- TypeScript: 5.8.3+
- Modern ES2022+ environment

## Best Practices

### Use Semantic Property Names
```yaml
url: http://localhost:3000
oidc:
  redirect: ${url}/auth/callback
```


## Troubleshooting

### Common Issues

**Properties not loading**
- Check file paths and naming conventions
- Verify active profiles with `APP_PROFILES`
- Ensure property files are in `resources/` directory

**Property injection not working**
- Confirm `@Properties` decorator is applied to class
- Check that PropertiesModule is imported
- Verify property names match configuration keys

**Vault connection issues**
- Validate Vault configuration in bootstrap.properties
- Check network connectivity and authentication
- Verify Vault policies allow key access

**Hot reload not triggering**
- Ensure `APP_MODE=WATCH` is set
- Check file system permissions
- Verify configuration files are being watched

## License
This project is licensed under the ISC License.

## Support
For issues and questions, please open an issue on the GitHub repository.
