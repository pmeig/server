# @pmeig/srv-security
Security module for framework that provides authentication, authorization, and guard-based access control for REST APIs.
## Installation
``` bash
npm i @pmeig/srv-security @pmeig/srv-core @pmeig/srv-rest
npm i -D @types/express @types/jsonwebtoken
```
## Quick Start
### 1. Basic Setup
``` typescript
import { Application } from '@pmeig/srv-core';
import { SecurityModule } from '@pmeig/srv-security';
import { RestModule } from '@pmeig/srv-rest';

 const app = await Application.run(AppModule, {
      imports: [RestModule, SecurityModule]
    });
```
### 2. Protecting Routes with Guards
``` typescript
import { RestController, GET, POST } from '@pmeig/srv-rest';
import { Role, NotRole, Public } from '@pmeig/srv-security';

@RestController('/api/users')
export class UserController {
  
  @GET()
  @Public
  async getAllUsers() {
    return { users: [] };
  }
  
  @POST()
  @Role('USER_CREATE')
  @NotRole('USER_TEST')
  async createUser(req: Request) {
    return { created: true };
  }
  
  @GET('/admin')
  @Role('ADMIN')
  async getAdminData() {
    return { adminData: 'sensitive' };
  }
}
```
### 3. Custom Guards
``` typescript
import { Component } from '@pmeig/srv-core';
import { Guard, User } from '@pmeig/srv-security';
import { Request } from 'express';

@Component
export class RoleGuard extends Guard {
  canActivate(request: Request, user: User | null): boolean {
    if (!user) return false;
    
    // Custom authorization logic
    const requiredRole = request.headers['x-required-role'];
    return user.authorities.some(auth => auth.name === requiredRole);
  }
  
  unauthorized(request: Request, user: User | null) {
    return new AuthenticationException('Insufficient permissions');
  }
}
```
## Features
### Authentication Decorators
- `@Role(...authorities)` - Requires any  authorities/permissions
- `@NotRole(...authorities)` - Not requires any authorities/permissions
- `@AllRole(...authorities)` - Requires all  authorities/permissions
- `@NotAllRole(...authorities)` - Not requires all authorities/permissions
- `@Public` - Allow always access

## OIDC Configuration Properties
``` yaml
security:
  auth: oidc # is not required, by default is oidc
  validator:
    nonce: ${NONCE} # use by jwt and oidc, is auto-generated and print if undefined
    state: ${STATE} # use by oidc, is auto-generated and print if undefined
  oidc:
    # Client credentials from your OIDC provider (e.g., Google, Azure AD, Keycloak)
    credentials:
      client_id: "${OIDC_CLIENT_ID}"
      client_secret: "${OIDC_CLIENT_SECRET}"
    
    # URLs for OIDC flow
    url:
      # Where users are redirected after authentication
      redirect: "http://localhost:3000/auth/callback"
      # OIDC issuer URL for discovery
      issuer: "https://accounts.google.com"  # or your OIDC provider
    
    # OAuth scopes to request
    scope: "openid profile email groups picture"
```
## OIDC Authentication
### 1. **Callback Handling**
Paths is created by default
``` typescript
@RestController('/auth')
export class AuthController {
  
  constructor(private oidcService: OidcService) {}
  
  @GET('/login')
  async login() {
    const authUrl = await this.oidcService.login();
    return { redirectUrl: authUrl };
  }
  
  @GET('/callback')
  async callback(@Query('code') code: string, @Query('state') state: string) {
    const tokenData = await this.oidcService.createToken({ code, state });
    return {
      accessToken: tokenData.accessToken,
      expiresIn: tokenData.expiresIn,
      tokenType: tokenData.tokenType
    };
  }
}
```


### User Model
``` typescript
import { User, Authority } from '@pmeig/srv-security';

// Built-in User model
interface User {
  id: string;
  username: string;
  authorities: Authority[];
}

interface Authority {
  name: string;
}
```

### Exception Handling
``` typescript
import { ControllerAdvisor, Catch } from '@pmeig/srv-rest';
import { AuthenticationException } from '@pmeig/srv-security';

@ControllerAdvisor
export class SecurityExceptionHandler {
  
  @Catch(AuthenticationException)
  handleAuthException(exception: AuthenticationException, req: Request, res: Response) {
    res.status(401).json({
      error: 'Unauthorized',
      message: exception.message,
      timestamp: new Date().toISOString()
    });
  }
}
```
### Configuration
``` yaml
# application.yml
security:
  jwt:
    secret: "${JWT_SECRET}"
    expires: "1h"
    algorithm: "HS512"
    expose:
      type: "header" # could cookie/body/header
      prefix: "Bearer"
```
### Method-Level Security
``` typescript
@RestController('/api/documents')
export class DocumentController {
  
  @GET('/public')
  @Public
  async getPublicDocs() {
    return { docs: [] };
  }
  
  @GET('/private/:id')
  async getPrivateDoc(@Param('id') id: string, @CurrentUser() user: User) {
    // Access user information
    return { doc: { id, owner: user.username } };
  }
  
  @DELETE('/:id')  
  @Role('DOCUMENT_DELETE')
  async deleteDocument(@Param('id') id: string) {
    return { deleted: true };
  }
}
```
### Multiple Authority Requirements
``` typescript
@RestController('/api/admin')
export class AdminController {
  
  @GET('/users')
  @Role('ADMIN', 'USER_READ') // Requires ANY of these authorities
  async getUsers() {
    return { users: [] };
  }
  
  @POST('/system/reset')
  @Role(['ADMIN', 'SYSTEM_ADMIN']) // Requires ALL authorities
  async resetSystem() {
    return { reset: true };
  }
}
```
### Guard Execution Order
Guards are executed in order of their annotation: `@Order`
``` typescript
@Component
@Order(1) // Executes first
export class AuthenticationGuard extends Guard {
  canActivate(request: Request, user: User | null): boolean {
    return !!user;
  }
}

@Component  
@Order(2) // Executes second
export class AuthorizationGuard extends Guard {
  canActivate(request: Request, user: User | null): boolean {
    // Check user permissions
    return user?.authorities.length > 0;
  }
}
```

## API Reference
### Decorators
- `@Role(...authorities)` - Requires any  authorities/permissions
- `@NotRole(...authorities)` - Not requires any authorities/permissions
- `@AllRole(...authorities)` - Requires all  authorities/permissions
- `@NotAllRole(...authorities)` - Not requires all authorities/permissions
- `@Public` - Allow always access

### Classes
- Base class for custom guards `Guard`
- `AuthenticationProvider` - Base class for authentication providers
- Exception for authentication failures `AuthenticationException`
- User model interface `User`
- Authority/permission model interface `Authority`


## Module Structure
The SecurityModule includes:
- Authentication providers and services **AuthModule**
- Guard middleware and decorators **GuardModule**
- Core security functionality **SecurityCoreModule**

## License
MIT
