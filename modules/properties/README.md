# @pmeig/srv-properties

A TypeScript module for property and configuration management in modular server applications. Designed to work
seamlessly with the `@pmeig/srv-core` module runner system.

## Installation

Install the package using

* pnpm:

```bash
  pnpm add @pmeig/srv-properties
```

* npm

```bash
  npm i @pmeig/srv-properties
```

## Features

- 🏗️ **Module-Based Architecture** - Integrates with `@pmeig/srv-core` module system
- 🔧 **Decorator-Driven Configuration** - Use decorators to define property classes
- 🔄 **Environment Configuration** - Automatic environment-based property loading
- 🎯 **Profile-Based Configuration** - Load different configurations based on active profiles
- 🔐 **Vault Integration** - Secure property management with HashiCorp Vault
- 📦 **Bootstrap Support** - Early-stage configuration loading
- 🎯 **Conditional Properties** - Load modules based on property conditions
- 🚀 **TypeScript First** - Full TypeScript support with metadata reflection

## Quick Start

### 1. Define a Properties Class

```typescript 
import {Properties} from '@pmeig/srv-properties';

@Properties('database')
export class DatabaseProperties {
    host: string = 'localhost';
    port: number = 5432;
    name: string = 'myapp';
    ssl: boolean = false;
}
```

### 2. Create a Module

```typescript 
import {Module} from '@pmeig/srv-core';
import {DatabaseProperties} from './database.properties';
import {DatabaseService} from './database.service';
import {PropertiesModule} from '@pmeig/srv-properties';

@Module({
    providers: [DatabaseProperties, DatabaseService],
    imports: [PropertiesModule]
})
export class DatabaseModule {
}
```

### 3. Use Conditional

```typescript 
import {ConditionalProperties} from '@pmeig/srv-properties';

@ConditionalProperties('security.auth', 'oidc', true)
export class Oidc {
    login = ''
    callback = ''
}
```

## Profiles

The properties module supports profile-based configuration, allowing you to have different property files for different environments or deployment scenarios.

### Profile Configuration

Configure active profiles using the `APP_PROFILES` environment variable:
```bash
# Single profile
APP_PROFILES=development
# Multiple profiles (comma-separated)
APP_PROFILES=development,debug,local
``` 

### Profile-Based Property Files

The module automatically loads property files based on active profiles:
  * app.yml # Base properties (always loaded)
  * app-dev.yml # Development profile
  * app-prod.yml # Production profile

### Property Override Order

Properties are loaded and merged in the following order (later profiles override earlier ones):

1. **Environment variables** - base of configuration
2. **Base properties** - `app.yml`
3. **Profile properties** - `app-{profile}.yml` for each profile in order


Example with `APP_PROFILES=development,debug`:

1. Load `app.yml`
2. Load `app-dev.yml` (overrides base)
3. Load `app-debug.yml` (overrides development and base)

### Profile-Based Property Files Examples

#### app.properties (Base)
```yaml
# Default configuration
app:
  name: MyApplication
  port: 3000

database:
  host: localhost
  pool:
    max: 10

logging:
  level: info
``` 

#### app-development.properties
```yaml
# Development overrides
app:
  port: 3001

database:
  host: dev-db.company.com

logging:
  level: debug

debug:
  enabled: true
``` 

#### app-production.properties
```yaml
# Production overrides
app:
  port: 8080

database:
  host: prod-db.company.com
  pool:
    max: 50

logging:
  level: warn

security:
  strict: true
```

### Profile-Conditional Module Loading

Use the `@Profiles` decorator to conditionally load modules based on active profiles:
```typescript
 import {Module, Profiles} from '@pmeig/srv-properties';
// Only load in development profile
 @Module({ providers: [DevToolsService, MockDataService] }) 
 @Profiles('development') export class DevelopmentModule {}
// Load in both development and debug profiles 
 @Module({ providers: [DebugService, ProfilerService] }) 
 @Profiles('development', 'debug') 
 export class DebugModule {}
// Load only in production 
 @Module({ providers: [MetricsService, AlertingService] }) 
 @Profiles('production') 
 export class ProductionModule {}
``` 

### Programmatic Profile Access

Access active profiles programmatically in your services:
```typescript 
import {Service} from '@pmeig/srv-core';
import {Environment} from '@pmeig/srv-properties';

@Service()
export class ConfigurationService {
    constructor(private env: Environment) {
    }

    isDevelopment(): boolean {
        return this.env.hasProfiles('development');
    }

    isProduction(): boolean {
        return this.env.hasProfiles('production');
    }

    hasDebugEnabled(): boolean {
        return this.env.hasProfiles('debug', 'development');
    }

    initializeFeatures() {
        if (this.env.hasProfiles('monitoring')) {
            this.enableMonitoring();
        }
        if (this.env.hasProfiles('debug')) {
            this.enableDebugMode();
        }
    }
}
``` 

### Advanced Profile Usage

#### Complex Profile Combinations
```bash
# Staging environment with debugging
APP_PROFILES=staging,debug
# Production with monitoring and metrics
APP_PROFILES=production,monitoring,metrics
# Local development with database debugging
APP_PROFILES=development,local,db-debug
``` 

#### Conditional Services Based on Profiles
```typescript 
import { Service } from '@pmeig/srv-core'

@Service()
export class DatabaseService {
    constructor(private config: DatabaseProperties, private env: Environment) {
    }

    async connect() {
        const connectionConfig = {host: this.config.host, port: this.config.port, database: this.config.name};
// Add debug logging in development
        if (this.env.hasProfiles('development', 'debug')) {
            connectionConfig.logging = 'all';
            connectionConfig.synchronize = true;
        }

// Add SSL for production
        if (this.env.hasProfiles('production')) {
            connectionConfig.ssl = {
                rejectUnauthorized: true
            };
        }

        return createConnection(connectionConfig);
    }
}
````

## Bootstrap

For configuration application before started. Could override `APP_PROFILES` on bootstrap.yml only

1. **Loads first** - Before main application configuration
2. **Exposes external config** - Vault, config database connections
3. **Overrides core variables** - Can override by profiles like bootstrap-dev, bootstrap-prod, etc. `APP_PROFILES` `APP_MODE`
4. **Defines property precedence** - Controls which sources take priority
5. **Configures watchers** - For dynamic configuration updates

The bootstrap process would:
1. Read `bootstrap.yml` first
2. Use vault/database config to fetch additional properties
3. Override environment variables as specified
4. Load main application config with the resolved profiles and sources



## Core Concepts

### Properties Decorator

The `@Properties` decorator marks a class as a configuration properties holder:

```typescript 

@Properties('app.server')
export class ServerProperties {
    port: number = 3000;
    host: string = '0.0.0.0';
    cors: boolean = true;
}
```

The decorator:

- Associates the class with a property prefix (`app.server`)
- Automatically configures the class for dependency injection
- Enables property binding from various sources

### Module Integration

Properties are integrated into modules as providers:

```typescript 
import {PropertiesModule} from '@pmeig/srv-properties';

@Module({
    providers: [ServerProperties, DatabaseProperties],
    imports: [PropertiesModule]
})
export class AppModule {
}
```


### Property Sources

The module supports multiple property sources with precedence:

1. **Environment Variables** - Highest priority
2. **Vault Properties** - Secure configuration
3. **Application Properties** - File-based configuration
4. **Default Values** - Defined in property classes

## Advanced Usage

### Vault Integration

For secure property management:
```typescript 

@Properties('database') // ou bien yaml => database=vault(app/database)
export class DatabaseProperties { 
    // These can be loaded from Vault 
   username: string; // yaml => database.username=vault(app/database, username)
   password: string; // yaml => database.password=vault(app/database, password)
}
``` 

The module automatically:
- Connects to Vault using `VaultProperties`
- Refreshes properties on change
- Handles secure property injection


## Module Dependencies

This module integrates with the following `@pmeig` modules:

- **`@pmeig/srv-core`** - Required for module system and decorators
- **`@pmeig/srv-vault`** - Optional for Vault integration
- **`reflect-metadata`** - Required for decorator metadata

## Property Injection

Properties are automatically injected into services:


## Best Practices
1. **Use Descriptive Prefixes** - Choose clear, hierarchical property prefixes
2. **Provide Default Values** - Always set sensible defaults in property classes
3. **Group Related Properties** - Keep related configuration in the same property class
4. **Use Profile-Specific Overrides** - Leverage profiles for environment-specific configuration
5. **Secure Sensitive Data** - Use Vault integration for passwords and secrets
6. **Order Profiles Carefully** - Remember that later profiles override earlier ones
7. **Validate Critical Properties** - Add validation for production-required properties

## Profile Best Practices
1. **Keep Base Properties Minimal** - Use `app.properties` for common defaults
2. **Use Meaningful Profile Names** - Choose names that clearly indicate their purpose
3. **Document Profile Dependencies** - If profiles depend on each other, document it
4. **Test Profile Combinations** - Ensure your application works with different profile combinations
5. **Use Environment Variables for Secrets** - Even with profiles, use env vars for sensitive data

## Environment-Specific Configuration

The module automatically handles environment-specific configuration:

properties
# app.properties (default)
database.host=localhost
# app-production.properties
database.host=prod-db.company.com
# app-development.properties
database.host=dev-db.company.com

## License

This project is licensed under the MIT License.

## Related Packages

- [`@pmeig/srv-core`](https://www.npmjs.com/package/@pmeig/srv-core) - Core module system
- [`@pmeig/srv-vault`](https://www.npmjs.com/package/@pmeig/srv-vault) - Vault integration
---

Part of the PMEIG Server Framework
