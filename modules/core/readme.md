# @Server/core

A powerful dependency injection and configuration framework for Node.js applications built with TypeScript.

## Installation
```bash
    npm i @server/core
```


## Overview

The `@server/core` module provides the foundational framework for building modular TypeScript applications with dependency injection, decorators, and application context management.

## Key Features

- **Dependency Injection Container**: Lightweight IoC container for managing dependencies
- **Module System**: Organize application components into modules
- **Decorator Framework**: Rich set of decorators for configuration and metadata
- **Application Context**: Centralized context management and lifecycle
- **Provider System**: Flexible provider registration with factory support
- **Type Conversion**: Built-in type conversion and transformation utilities
- **Component Management**: Automatic component discovery and registration

## Core Concepts

### Application Context
The application context manages the lifecycle of all components, providers, and modules in your application. It handles dependency resolution, component initialization, and cleanup.

### Modules
Modules are the building blocks of your application. They group related components and define how they should be initialized and connected.

```typescript
import { Module } from '@server/core';

@Module({ providers: [ UserService, ProductService ] })
export class AppModule {}
```

### Providers
Providers define how dependencies are created and injected into your application:

```typescript
// Class provider @Module({ providers: [UserService] })
// Factory provider @Module({ providers: [ { provide: DatabaseService, useFactory: async (context) => { const config = await context.resolveRequired(ConfigService); return new DatabaseService(config); } } ] })
// Scoped provider @Module({ providers: [ { scope: 'request', provide: DatabaseService, useFactory: async (context) => { const config = await context.resolveRequired(ConfigService); return new DatabaseService(config); } } ] })
```
### Decorators

The core module provides a comprehensive decorator system for:
- Component registration
- Configuration management
- Conditional logic
- Type metadata
- Global settings

## Usage Examples

### Basic Application Setup

* **first implementation**

```typescript
import {Module, ApplicationContext} from '@server/core'

@Module({
    providers: [MyService, {
        provide: ConfigService, useFactory: async () => {
            return new ConfigService();
        }
    }]
})
export class AppModule {
}

export const server = ApplicationContext.run(AppModule)
```

* **second implementation**

```typescript
import {ApplicationContext} from '@server/core'


export const server = ApplicationContext.run({
    providers: [MyService, {
        provide: ConfigService, useFactory: async () => {
            return new ConfigService();
        }
    }]
})
```

### Dependency Resolution

```typescript
// Within a factory function
{
  provide: UserController,
  useFactory: async (context) => {
    const userService = await context.resolveRequired(UserService);
    const logger = await context.resolveRequired(Logger);
    return new UserController(userService, logger);
  }
}
```

### Decorators

### Creating Basic Decorators
#### Class Decorator
```typescript
import { Decorators } from '@server/core';

export const MyClassDecorator = (config: string) =>
  Decorators.class('MyClassDecorator', target => {
    // Store metadata on the class
    Reflect.defineMetadata('my:config', config, target);
  });

// Usage
@MyClassDecorator('some-config')
class MyService {
  // Implementation
}
```
#### Method Decorator
```typescript
export const LogExecution = (level: 'info' | 'debug' = 'info') =>
  Decorators.method('LogExecution', (target, propertyKey, descriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = function(...args: any[]) {
      console.log(`[${level}] Executing ${String(propertyKey)}`, args);
      return originalMethod.apply(this, args);
    };
  });

// Usage
class UserService {
  @LogExecution('debug')
  createUser(userData: any) {
    // Method implementation
  }
}
```
#### Parameter Decorator
```typescript
export const Validate = (validator: (value: any) => boolean) =>
  Decorators.parameter('Validate', (target, propertyKey, parameterIndex) => {
    // Store validation metadata
    const existingValidators = Reflect.getMetadata('validators', target, propertyKey) || [];
    existingValidators[parameterIndex] = validator;
    Reflect.defineMetadata('validators', existingValidators, target, propertyKey);
  });

// Usage
class UserController {
  createUser(@Validate(isEmail) email: string, @Validate(isString) name: string) {
    // Method implementation
  }
}
```
#### Field/Property Decorator
```typescript
export const DefaultValue = (value: any) =>
  Decorators.field('DefaultValue', (target, propertyKey) => {
    // Store default value metadata
    Reflect.defineMetadata('default:value', value, target, propertyKey);
  });

// Usage
class Configuration {
  @DefaultValue('localhost')
  host: string;
  
  @DefaultValue(3000)
  port: number;
}
```
### Advanced Decorator Patterns
#### Multi-target Decorator
```typescript
export const Cacheable = (ttl: number = 300000) =>
  Decorators.all('Cacheable', (target, propertyKey, descriptor) => {
    if (typeof descriptor === 'number') {
      // Parameter decorator
      console.log(`Caching parameter at index ${descriptor}`);
    } else if (descriptor && typeof descriptor.value === 'function') {
      // Method decorator
      const originalMethod = descriptor.value;
      const cache = new Map();
      
      descriptor.value = function(...args: any[]) {
        const key = JSON.stringify(args);
        if (cache.has(key)) {
          return cache.get(key);
        }
        
        const result = originalMethod.apply(this, args);
        cache.set(key, result);
        
        // Clear cache after TTL
        setTimeout(() => cache.delete(key), ttl);
        
        return result;
      };
    } else {
      // Class or field decorator
      Reflect.defineMetadata('cacheable', { ttl }, target, propertyKey);
    }
  });
```


### Type Conversion

```typescript
import {Convert, Converter} from '@server/core'

export class StringToDateConverter extends Converter<Date, string> {

    hasConverter(value: any): boolean {
        return false;
    }

    to(value: string): Date {
        return new Date(value);
    }
}

export class App {
    constructor(@Convert(StringToDateConverter) private readonly date: Date) {
    }
}
```
### Conditional Components
```typescript
const HasDatabase = Conditionals.create('HasDatabase', async (target, context) => {
    try {
        const db = await context.resolve(DatabaseConnection);
        return db !== null;
    } catch {
        return false;
    }
});

@HasDatabase
class DatabaseBackedService {
    // Only loads if database is available
}

```

### Bootable

class use to run a code when ApplicationContext started. The class is extends by another class and is providing in applicationContext, is started method run

## Architecture

### Context Structure
- **Application Context**: Root context managing the entire application
- **Module Context**: Scoped context for individual modules
- **Provider Context**: Context for provider resolution and lifecycle

### Provider Scopes
- **Singleton**: Single instance per application (default)
- **Scoped**: Instance per request
- **Transient**: New instance every time

## Configuration
Ensure your includes: `tsconfig.json`

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "target": "ES2020",
    "lib": ["ES2020"]
  }
}

```

## Dependencies
- Required for decorator metadata support `reflect-metadata`
- TypeScript 5.8+ - For modern decorator and type support

## Best Practices
1. **Module Organization**: Group related components into focused modules
2. **Factory Functions**: Use async factory functions for complex initialization
3. **Lifecycle Management**: Properly handle component cleanup
4. **Conditional Loading**: Use conditional decorators for environment-specific components

## Integration
This core module integrates seamlessly with other server modules:
- `@server/rest` - REST API framework
- `@server/properties` - Configuration management
- `@server/vault` - Secret management

## License
See the [LICENSE](../../LICENSE) file for license information.
