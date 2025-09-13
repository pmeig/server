# @pmeig/srv-core

The foundational dependency injection and application framework module for the @pmeig/srv ecosystem. Provides decorators, IoC container, lifecycle management, and application bootstrapping with NestJS-inspired architecture.

## Installation

```bash
  npm install @pmeig/srv-core
```


## Features

- 🏗️ **Dependency Injection** - Full IoC container with constructor and parameter injection
- 🎯 **Decorator System** - Comprehensive decorator framework for metadata and AOP
- 📦 **Module System** - Hierarchical module organization with imports and providers
- 🔄 **Lifecycle Management** - Component initialization, disposal, and refresh cycles
- ⚡ **Application Context** - Centralized application bootstrapping and management
- 🛡️ **Conditional Loading** - Profile and condition-based component registration
- 📊 **Scoped Components** - Singleton, prototype, and request-scoped instances
- 🎨 **Provider Factories** - Custom factory functions for complex instantiation
- 🔗 **Named Injection** - String-based and token-based dependency resolution
- 🛠️ **TypeScript First** - Full type safety with reflection metadata support

## Usage

### Import the Module
```typescript
import { ApplicationContext, Module } from '@pmeig/srv-core';

@Module({
  providers: [MyService],
  imports: [OtherModule]
})
export class AppModule {}

// Bootstrap application
ApplicationContext.run(AppModule);
```


### Basic Components
```typescript
import { Component, Service, Configuration } from '@pmeig/srv-core';

@Component
export class BasicComponent {
  getValue() {
    return 'Hello World';
  }
}

@Service
export class BusinessService {
  constructor(private readonly component: BasicComponent) {}
  
  processData() {
    return this.component.getValue().toUpperCase();
  }
}

@Configuration
export class AppConfiguration {
  // Configuration beans and factories
}
```


### Dependency Injection
```typescript
import { Component, Inject, Named } from '@pmeig/srv-core';

@Component
@Named('userService', 'UserManager') // Multiple names
export class UserService {
  getUsers() {
    return ['user1', 'user2'];
  }
}

@Component
export class UserController {
  constructor(
    private readonly userService: UserService,
    @Inject('UserManager') private readonly userManager: UserService
  ) {}
  
  async getUsers() {
    return this.userService.getUsers();
  }
}
```


### Module Organization
```typescript
import { Module, Import } from '@pmeig/srv-core';

@Module({
  providers: [DatabaseService, UserRepository],
  exports: [UserRepository] // Available to importing modules
})
export class DatabaseModule {}

@Module({
  providers: [UserService, UserController]
})
export class UserModule {}

@Module({
  imports: [DatabaseModule, UserModule],
  providers: [AppService]
})
export class AppModule {}
```


## API Reference

### Core Decorators

| Decorator | Type | Description |
|-----------|------|-------------|
| `@Component` | Class | Marks class as injectable component |
| `@Service` | Class | Business logic component (extends @Component) |
| `@Configuration` | Class | Configuration class with bean definitions |
| `@Module(config)` | Class | Module definition with providers and imports |
| `@Import(...modules)` | Class | Import other modules into current module |

### Dependency Injection Decorators

| Decorator | Type | Description |
|-----------|------|-------------|
| `@Inject(token)` | Parameter | Inject dependency by name or token |
| `@Named(...names)` | Class | Register component with specific names |
| `@Order(priority)` | Class | Set component loading priority |
| `@Scope(type)` | Class | Define component lifecycle scope |

### Lifecycle Decorators

| Decorator | Type | Description |
|-----------|------|-------------|
| `@Before(Component)` | Class | Load before specified component |
| `@After(Component)` | Class | Load after specified component |

### Conditional Decorators

| Decorator | Type | Description |
|-----------|------|-------------|
| `@Conditional(condition)` | Class | Load component based on condition |

## Component Scopes

### Singleton Scope (Default)
```typescript
@Component
export class SingletonService {
  // One instance per application
}
```


### Request Scope
```typescript
import { Scope } from '@pmeig/srv-core';

@Component
@Scope('request')
export class RequestScopedService {
  // New instance per request
}
```


### Prototype Scope
```typescript
@Component
@Scope('prototype')
export class PrototypeService {
  // New instance every time injected
}
```


## Application Context

### Basic Bootstrap
```typescript
import { ApplicationContext, Module } from '@pmeig/srv-core';

@Module({
  providers: [AppService]
})
export class AppModule {}

// Start application
const context = await ApplicationContext.run(AppModule);

// Access services
const appService = await context.resolve(AppService);
```


### Manual Resolution
```typescript
const context = await ApplicationContext.run(AppModule);

// Resolve single instance
const service = await context.resolve(MyService);
const serviceWithDefault = await context.resolve(OptionalService, new DefaultService());

// Resolve required (throws if not found)
const requiredService = await context.resolveRequired(RequiredService);

// Resolve multiple instances
const handlers = await context.multiResolve(EventHandler);
```


### Context Lifecycle
```typescript
const context = await ApplicationContext.run(AppModule);

// Restart application
await context.restart();

// Graceful shutdown
await context.close();
```


## Factory Providers

### Simple Factory
```typescript
@Module({
  providers: [
    {
      provide: 'DATABASE_CONNECTION',
      useFactory: async (context) => {
        const config = await context.resolve(DatabaseConfig);
        return createConnection(config);
      }
    }
  ]
})
export class DatabaseModule {}
```


### Factory with Dependencies
```typescript
@Module({
  providers: [
    {
      provide: HttpClient,
      useFactory: async (context) => {
        const config = await context.resolveRequired(HttpConfig);
        const logger = await context.resolve(Logger);
        return new HttpClient(config, logger);
      }
    }
  ]
})
export class HttpModule {}
```


## Conditional Loading

### Custom Conditions
```typescript
import { Conditional, ApplicationContext } from '@pmeig/srv-core';

@Component
@Conditional((target, context) => {
  // Load only in development
  return process.env.NODE_ENV === 'development';
})
export class DevOnlyService {}
```


### Combining Conditions
```typescript
import { Conditionals } from '@pmeig/srv-core';

const DevAndTest = Conditionals.or(
  (target, context) => process.env.NODE_ENV === 'development',
  (target, context) => process.env.NODE_ENV === 'test'
);

@Component
@Conditional(DevAndTest)
export class DevTestService {}
```


## Lifecycle Management

### Component Lifecycle Interfaces
```typescript
import { 
  Initializable, 
  Disposable, 
  Destroyable, 
  Refreshable 
} from '@pmeig/srv-core';

@Component
export class LifecycleService implements Initializable, Disposable {
  async initialize() {
    console.log('Service starting...');
  }
  
  async dispose() {
    console.log('Service shutting down...');
  }
}
```


### Lifecycle Events
```typescript
import { Bootable } from '@pmeig/srv-core';

@Component
export class AppBootstrap implements Bootable {
  async run(context: ApplicationContext, ...args: any[]) {
    console.log('Application starting with args:', args);
    // Perform startup tasks
  }
  
  async close(context: ApplicationContext) {
    console.log('Application shutting down');
    // Perform cleanup tasks
  }
}
```


## Component Ordering

### Priority-Based Loading
```typescript
@Component
@Order(-100) // Load early
export class DatabaseService {}

@Component
@Order(100) // Load late
export class WebService {}

@Component // Default order: 0
export class BusinessService {}
```


### Dependency-Based Ordering
```typescript
@Component
@After(DatabaseService) // Load after database
export class UserService {}

@Component
@Before(WebService) // Load before web layer
export class SecurityService {}
```


## Advanced Patterns

### Module Composition
```typescript
@Module({
  imports: [DatabaseModule, CacheModule],
  providers: [UserService]
})
export class UserModule {}

@Module({
  imports: [UserModule, AuthModule],
  providers: [ApiController]
})
export class ApiModule {}

@Module({
  imports: [ApiModule, HealthModule]
})
export class AppModule {}
```


### Dynamic Module Registration
```typescript
@Component
@Import(DatabaseModule, CacheModule) // Import at component level
export class DynamicService {
  // Service with dynamic dependencies
}
```


### Provider Aliasing
```typescript
@Module({
  providers: [
    UserService,
    {
      provide: 'UserManager',
      useFactory: (context) => context.resolve(UserService)
    }
  ]
})
export class UserModule {}
```


## Context Resolution

### Finding Components by Decorator
```typescript
const context = await ApplicationContext.run(AppModule);

// Find all components with specific decorator
const services = await context.withDecorator(Service);
const controllers = await context.withDecorator('Controller');
```


### Checking Component Availability
```typescript
const hasUserService = await context.has(UserService);
const hasNamedService = await context.has('UserManager');

if (hasUserService) {
  const service = await context.resolve(UserService);
}
```


## Dependencies

- **reflect-metadata**: ^0.2.2 - Reflection metadata support
- **@types/node**: ^22.15.19 - Node.js type definitions
- **typescript**: ^5.8.3 - TypeScript compiler

## Compatibility

- Node.js: 18+
- TypeScript: 5.8.3+
- Modern ES2022+ environment
- Reflection metadata support required



## Common Patterns

### Service Layer Architecture
```typescript
@Module({
  providers: [UserRepository, UserValidator, UserService]
})
export class UserModule {}

@Service
export class UserService {
  constructor(
    private readonly repository: UserRepository,
    private readonly validator: UserValidator
  ) {}
  
  async createUser(userData: any) {
    await this.validator.validate(userData);
    return this.repository.save(userData);
  }
}
```


### Configuration Management
```typescript
@Configuration
export class AppConfig {
  @Named('databaseUrl')
  getDatabaseUrl() {
    return process.env.DATABASE_URL || 'localhost:5432';
  }
}

@Service
export class DatabaseService {
  constructor(@Inject('databaseUrl') private readonly url: string) {}
}
```


## Troubleshooting

### Common Issues

**Circular dependency detected**
- Review component dependencies and break cycles
- Use factory providers to defer resolution
- Consider redesigning component relationships

**Component not found**
- Ensure component is decorated with @Component or related decorator
- Check that component is included in module providers
- Verify import statements and module registration

**Reflection metadata errors**
- Ensure `import 'reflect-metadata'` is at the top of main file
- Check TypeScript configuration for decorator support
- Verify emitDecoratorMetadata is enabled

**Scope-related issues**
- Understand scope lifecycles and appropriate usage
- Check that request-scoped components are used in request context
- Verify singleton vs prototype behavior expectations

## License
This project is licensed under the ISC License.

## Support
For issues and questions, please open an issue on the GitHub repository.
