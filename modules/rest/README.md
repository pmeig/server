# @pmeig/srv-rest

A powerful REST API framework module built on Express.js with dependency injection, decorators, and automatic routing. Part of the @pmeig/srv framework ecosystem that provides NestJS-inspired server architecture.

## Installation

```bash
  npm install @pmeig/srv-rest
```


## Features

- 🎯 **Controller Decorators** - Define REST endpoints with intuitive decorators
- 🔧 **Express Integration** - Built on Express.js with full middleware support
- 📦 **Parameter Injection** - Automatic parameter extraction and injection
- 🛡️ **Error Handling** - Comprehensive error handling with controller advisors
- ✨ **HTTP Status Management** - Easy status code and media type configuration
- 🚀 **Dependency Injection** - Full integration with @pmeig/srv-core DI container
- 📱 **Request Scoping** - Request-scoped components for stateful operations
- ♿ **Middleware Support** - Class and method-level middleware application
- 🛠️ **Automatic Routing** - Convention-based routing with path parameters

## Usage

### Import the Module
```typescript
import { RestModule } from '@pmeig/srv-rest';
import { Module } from '@pmeig/srv-core';

@Module({
  imports: [RestModule],
  // ...
})
export class AppModule {}
```


### Basic Controller
```typescript
import { Controller, Get, Post, Put, Delete } from '@pmeig/srv-rest';

@Controller('users')
export class UserController {
  
  @Get(':id')
  async getUser(@Path('id') id: string) {
    return { id, name: 'John Doe' };
  }

  @Post()
  async createUser(@Body user: any) {
    return { id: '123', ...user };
  }

  @Put(':id')
  async updateUser(@Path('id') id: string, @Body user: any) {
    return { id, ...user };
  }

  @Delete(':id')
  async deleteUser(@Path('id') id: string) {
    return { message: 'User deleted' };
  }
}
```


### Parameter Injection
```typescript
import { Controller, Get, Params, Body, Headers, Req, Res } from '@pmeig/srv-rest';
import type { Request, Response } from 'express';

@Controller('api')
export class ApiController {
  
  @Get('search')
  async search(
    @Param('q') query: string,
    @Params params: Record<string, any>,
    @Header('authorization') auth: string
  ) {
    return { query, params, auth };
  }

  @Post('data')
  async processData(
    @Body data: any,
    @Headers headers: Record<string, any>,
    @Req request: Request,
    @Res response: Response
  ) {
    // Direct access to Express request/response
    return { data, userAgent: headers['user-agent'] };
  }
}
```


### Error Handling with Controller Advisors
```typescript
import { ControllerAdvisor, Catch } from '@pmeig/srv-rest';
import type { Response } from 'express';

@ControllerAdvisor('/api')
export class ApiAdvisor {
  
  @Catch(Error)
  handleGenericError(error: Error, response: Response) {
    return response.status(500).json({ 
      message: error.message,
      type: 'Internal Server Error' 
    });
  }

  @Catch(ValidationError)
  handleValidationError(error: ValidationError, response: Response) {
    return response.status(400).json({
      message: error.message,
      type: 'Validation Error'
    });
  }
}
```


## API Reference

### Controller Decorators

| Decorator | Type | Description |
|-----------|------|-------------|
| `@Controller(path)` | Class | Defines a REST controller with base path |
| `@Get(path)` | Method | Maps GET requests to method |
| `@Post(path)` | Method | Maps POST requests to method |
| `@Put(path)` | Method | Maps PUT requests to method |
| `@Patch(path)` | Method | Maps PATCH requests to method |
| `@Delete(path)` | Method | Maps DELETE requests to method |

### Parameter Decorators

| Decorator | Description |
|-----------|-------------|
| `@Path(name)` | Extracts path parameter by name |
| `@Paths` | Extracts all path parameters |
| `@Param(name)` | Extracts query parameter by name |
| `@Params` | Extracts all query parameters |
| `@Body` | Extracts request body |
| `@Header(name)` | Extracts header by name |
| `@Headers` | Extracts all headers |
| `@Req` | Injects Express Request object |
| `@Res` | Injects Express Response object |

### Status and Media Type Configuration

```typescript
import { Status, Media } from '@pmeig/srv-rest';

@Controller('files')
export class FileController {
  
  @Post('upload')
  @Status('CREATED') // or @Status(201)
  @Media('application/json')
  async uploadFile(@Body file: any) {
    return { message: 'File uploaded successfully' };
  }
}
```


### Middleware Application

```typescript
import { Middleware } from '@pmeig/srv-rest';
import rateLimit from 'express-rate-limit';

// Method-level middleware
@Controller('api')
export class ApiController {
  
  @Get('limited')
  @Middleware(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }))
  async limitedEndpoint() {
    return { message: 'Rate limited endpoint' };
  }
}

// Class-level middleware
@Controller('admin')
@Middleware(authenticationMiddleware)
export class AdminController {
  // All methods inherit the middleware
}
```


## How It Works

### Automatic Routing
The REST module automatically:
1. **Scans for controllers**: Finds classes decorated with `@Controller`
2. **Maps routes**: Creates Express routes based on method decorators
3. **Handles parameters**: Extracts and injects method parameters
4. **Applies middleware**: Processes class and method-level middleware
5. **Error handling**: Routes errors to appropriate controller advisors

### Request Lifecycle
1. **Route matching**: Express matches incoming request to controller method
2. **Parameter extraction**: Framework extracts parameters from request
3. **Dependency injection**: Injects services and request-scoped components
4. **Method execution**: Controller method executes with injected parameters
5. **Response handling**: Framework serializes and sends response
6. **Error processing**: Any errors are caught and processed by advisors


## Request Scoping

Use request-scoped components for stateful operations:

```typescript
import { Component, Scope } from '@pmeig/srv-core';

@Component
@Scope('request')
export class RequestContext {
  userId?: string;
  permissions: string[] = [];
  
  setUser(userId: string, permissions: string[]) {
    this.userId = userId;
    this.permissions = permissions;
  }
}

@Controller('secure')
export class SecureController {
  constructor(private readonly context: RequestContext) {}
  
  @Get('profile')
  async getProfile() {
    return { userId: this.context.userId };
  }
}
```


## Dependencies

- **@pmeig/srv-core**: ^0.1.0-SNAPSHOT - Core dependency injection and decorators
- **@pmeig/srv-properties**: ^0.1.0-SNAPSHOT - Configuration management
- **express**: ^5.1.0 - Web framework
- **compression**: ^1.8.0 - Response compression
- **express-rate-limit**: ^7.5.0 - Rate limiting middleware
- **node-match-path**: ^0.6.3 - Path matching utilities

## Compatibility

- Node.js: 18+
- TypeScript: 5.8.3+
- Express: 5.1.0+
- Modern ES2022+ environment

## Best Practices

### 1. Use Descriptive Controller Paths
```typescript
// Good: Clear, RESTful paths
@Controller('api/v1/users')
export class UserController {}

@Controller('admin/settings')
export class AdminSettingsController {}
```


### 2. Implement Proper Error Handling
```typescript
@ControllerAdvisor('/api')
export class GlobalErrorHandler {
  @Catch(ValidationError)
  handleValidation(error: ValidationError, response: Response) {
    return response.status(400).json({
      error: 'Validation Failed',
      details: error.details
    });
  }
}
```


## Common Patterns

### RESTful Resource Controller
```typescript
@Controller('api/products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async findAll(@Params query: any) {
    return this.productService.findAll(query);
  }

  @Get(':id')
  async findOne(@Path('id') id: string) {
    return this.productService.findById(id);
  }

  @Post()
  @Status('CREATED')
  async create(@Body product: CreateProductDto) {
    return this.productService.create(product);
  }

  @Put(':id')
  async update(@Path('id') id: string, @Body product: UpdateProductDto) {
    return this.productService.update(id, product);
  }

  @Delete(':id')
  @Status('NO_CONTENT')
  async remove(@Path('id') id: string) {
    await this.productService.delete(id);
  }
}
```


## Troubleshooting

### Common Issues

**Controllers not being registered**
- Ensure controllers are included in module providers
- Check that @Controller decorator is properly applied

**Parameter injection not working**
- Verify parameter decorators are correctly imported
- Check method parameter types and ordering

**Middleware not executing**
- Ensure middleware is properly imported and applied
- Check middleware execution order

**Error handlers not catching errors**
- Verify ControllerAdvisor path matches controller paths
- Check exception type matching in @Catch decorators

## License
This project is licensed under the ISC License.

## Support
For issues and questions, please open an issue on the GitHub repository.

