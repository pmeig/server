# @pmeig/srv-rest

A powerful REST API framework module built on Fastify with dependency injection, decorators, and automatic routing. Part of the @pmeig/srv framework ecosystem that provides NestJS-inspired server architecture.

## Installation

```bash
  npm install @pmeig/srv-rest
```


## Features

- 🎯 **Controller Decorators** - Define REST endpoints with intuitive decorators
- 🔧 **Fastify Integration** - Built on Fastify (compression, rate limiting and form bodies included) with express-like middleware support
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
import type { RestRequest, RestResponse } from '@pmeig/srv-rest';

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
    @Req request: RestRequest,
    @Res response: RestResponse
  ) {
    // Direct access to the Fastify request/reply
    return { data, userAgent: headers['user-agent'] };
  }
}
```


### Error Handling with Controller Advisors
```typescript
import { ControllerAdvisor, Catch } from '@pmeig/srv-rest';
import type { RestResponse } from '@pmeig/srv-rest';

@ControllerAdvisor('/api')
export class ApiAdvisor {
  
  @Catch(Error)
  handleGenericError(error: Error, response: Response) {
    return response.code(500).send({ 
      message: error.message,
      type: 'Internal Server Error' 
    });
  }

  @Catch(ValidationError)
  handleValidationError(error: ValidationError, response: Response) {
    return response.code(400).send({
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
| `@Req` | Injects the Fastify request (`RestRequest`) |
| `@Res` | Injects the Fastify reply (`RestResponse`) |

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

// Middlewares keep the `(request, response, next)` signature, `request` and
// `response` being the Fastify request and reply. They run in the `preHandler` phase
// (the body is already parsed), call `next(error)` to fail the request.
const apiKey = (request, response, next) =>
  request.headers['x-api-key'] === 'secret' ? next() : next(new Error('missing api key'));

// Method-level middleware
@Controller('api')
export class ApiController {
  
  @Get('limited')
  @Middleware(apiKey)
  async limitedEndpoint() {
    return { message: 'Protected endpoint' };
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
2. **Maps routes**: Registers Fastify routes based on method decorators
3. **Handles parameters**: Extracts and injects method parameters
4. **Applies middleware**: Processes class and method-level middleware
5. **Error handling**: Routes errors to appropriate controller advisors

### Request Lifecycle
1. **Route matching**: Fastify matches incoming request to controller method
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
- **fastify**: ^5.6.0 - Web framework
- **@fastify/compress**: ^8.0.1 - Response compression
- **@fastify/rate-limit**: ^10.3.0 - Rate limiting (200 requests / 15 minutes by default)
- **@fastify/formbody**: ^8.0.2 - `application/x-www-form-urlencoded` bodies (parsed with `qs`)
- **node-match-path**: ^0.6.3 - Path matching utilities

## Compatibility

- Node.js: 20+
- TypeScript: 5.8.3+
- Fastify: 5.6.0+
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
    return response.code(400).send({
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

