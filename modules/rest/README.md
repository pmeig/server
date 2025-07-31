# @pmeig/srv-rest
REST API module for framework that provides Express.js integration with decorators for building REST APIs. `@pmeig/srv-core`
## Installation
``` bash
pnpm add @pmeig/srv-rest @pmeig/srv-core express
pnpm add -D @types/express
```
## Quick Start
### 1. Basic REST Controller
``` typescript
import { Configuration } from '@pmeig/srv-core';
import { RestController, GET, POST, PUT, DELETE } from '@pmeig/srv-rest';

@RestController('/api/users')
export class UserController {
  
  @GET()
  async getAllUsers() {
    return { users: [] };
  }
  
  @GET('/:id')
  async getUserById(req: Request, res: Response) {
    const { id } = req.params;
    return { user: { id, name: 'John Doe' } };
  }
  
  @POST('/')
  async createUser(req: Request, res: Response) {
    const userData = req.body;
    return { created: true, user: userData };
  }
  
  @PUT('/:id')
  async updateUser(req: Request, res: Response) {
    const { id } = req.params;
    const userData = req.body;
    return { updated: true, user: { id, ...userData } };
  }
  
  @DELETE('/:id')
  async deleteUser(req: Request, res: Response) {
    const { id } = req.params;
    return { deleted: true, id };
  }
}
```
### 2. Application Setup
``` typescript
import { Application } from '@pmeig/srv-core';
import { RestModule } from '@pmeig/srv-rest';
import { UserController } from './controllers/user.controller';

@Configuration
export class AppModule {
  static async main() {
    const app = await Application.run(AppModule, {
      imports: [RestModule],
      controllers: [UserController]
    });
    return app;
  }
}

// Start the application
AppModule.main();
```
## Features
### HTTP Method Decorators
- `@GET(path)` - Handle GET requests
- `@POST(path)` - Handle POST requests
- `@PUT(path)` - Handle PUT requests
- `@DELETE(path)` - Handle DELETE requests
- `@PATCH(path)` - Handle PATCH requests

### Middleware Support
``` typescript
import { Middleware } from '@pmeig/srv-rest';

@RestController('/api/protected')
@Middleware(authMiddleware, loggingMiddleware)
export class ProtectedController {
  
  @GET('/data')
  @Middleware(validateToken)
  async getProtectedData() {
    return { data: 'sensitive information' };
  }
}
```
### Request/Response Handling
``` typescript
@RestController('/api/files')
export class FileController {
  
  @POST('/upload')
  async uploadFile(req: Request, res: Response) {
    // Handle file upload
    const file = req.file;
    return { uploaded: true, filename: file.filename };
  }
  
  @GET('/download/:id')
  async downloadFile(req: Request, res: Response) {
    const { id } = req.params;
    res.download(`./uploads/${id}`);
  }
}
```

### Error Handling
``` typescript
import { ControllerAdvisor, HttpError } from '@pmeig/srv-rest';

@ControllerAdvisor
export class GlobalExceptionHandler {
  
  @Catch(HttpException)
  handleHttpException(exception: HttpException, req: Request, res: Response) {
    res.status(exception.status).json({
      error: exception.message,
      timestamp: new Date().toISOString(),
      path: req.url
    });
  }
  
  @Catch(Error)
  handleGenericError(error: Error, req: Request, res: Response) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
}
```
### Dependency Injection
``` typescript
import { Service } from '@pmeig/srv-core';

@Service
export class UserService {
  async findAll() {
    return [{ id: 1, name: 'John' }];
  }
}

@RestController('/api/users')
export class UserController {
  
  constructor(private userService: UserService) {}
  
  @GET()
  async getUsers() {
    return await this.userService.findAll();
  }
}
```

## API Reference
### Decorators
- `@RestController(basePath?)` - Mark class as REST controller
- `@GET|POST|PUT|DELETE|PATCH(path)` - HTTP method handlers
- `@Middleware(...middlewares)` - Apply Express middleware
- `@Catch(ExceptionType)` - Handle specific exceptions

### Types
- `Request` - Express Request object
- `Response` - Express Response object
- `HttpError` - Base HTTP exception class

## License
MIT
