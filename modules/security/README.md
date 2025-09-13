# @pmeig/srv-security

A comprehensive security framework module providing authentication, authorization, JWT token management, and OIDC integration. Built for the @pmeig/srv framework ecosystem with decorator-based security controls and flexible authentication strategies.

## Installation

```bash
  npm install @pmeig/srv-security
```


## Features

- 🔐 **Authentication Services** - Pluggable authentication strategies (OIDC, custom)
- 🛡️ **Authorization Guards** - Role and feature-based access control
- 🎯 **Security Decorators** - Declarative security with intuitive decorators
- 🔑 **JWT Token Management** - Complete JWT encoding/decoding with configurable claims
- 🌐 **OIDC Integration** - OpenID Connect support with automatic user provisioning
- 👤 **User Context** - Request-scoped user information and authorities
- ⚡ **Parameter Injection** - Direct access to user data in controller methods
- 🔒 **Guard Middleware** - Automatic route protection based on annotations
- 🎨 **Flexible Authorities** - Support for roles, features, and custom authority types
- 🛠️ **Configurable Security** - Property-based configuration for all security aspects

## Usage

### Import the Module
```typescript
import { SecurityModule } from '@pmeig/srv-security';
import { Module } from '@pmeig/srv-core';

@Module({
  imports: [SecurityModule],
  // ...
})
export class AppModule {}
```


### Basic Security Decorators
```typescript
import { Controller, Get } from '@pmeig/srv-rest';
import { Public, Role, Feature, ReqUser } from '@pmeig/srv-security';

@Controller('api')
export class SecureController {
  
  @Get('public')
  @Public
  async publicEndpoint() {
    return { message: 'This endpoint is public' };
  }

  @Get('admin')
  @Role('ADMIN')
  async adminOnly(@ReqUser user: any) {
    return { message: `Hello ${user.name}, you are an admin!` };
  }

  @Get('feature')
  @Feature('PREMIUM_FEATURE')
  async premiumFeature() {
    return { message: 'Premium feature accessed' };
  }
}
```


### User Information Injection
```typescript
import { Controller, Get } from '@pmeig/srv-rest';
import { ReqUser, Username, Token, Authorities } from '@pmeig/srv-security';

@Controller('user')
export class UserController {
  
  @Get('profile')
  async getProfile(
    @ReqUser user: any,
    @Username username: string,
    @Authorities authorities: Authority[]
  ) {
    return {
      user,
      username,
      authorities: authorities.map(a => a.name)
    };
  }

  @Get('token-info')
  async getTokenInfo(@Token token: string) {
    return { hasToken: !!token };
  }
}
```


### Advanced Authorization Logic
```typescript
import { Controller, Get } from '@pmeig/srv-rest';
import { UseGuard, AllRole, NotFeature } from '@pmeig/srv-security';

@Controller('advanced')
export class AdvancedSecurityController {
  
  @Get('multi-role')
  @AllRole('USER', 'MODERATOR') // Requires both roles
  async requiresMultipleRoles() {
    return { message: 'You have both USER and MODERATOR roles' };
  }

  @Get('custom-guard')
  @UseGuard(authority => authority.name.startsWith('SPECIAL_'))
  async customGuardLogic() {
    return { message: 'Custom authorization passed' };
  }

  @Get('restricted')
  @NotFeature('BANNED') // Denied if user has BANNED feature
  async restrictedAccess() {
    return { message: 'Access granted - not banned' };
  }
}
```


## API Reference

### Security Decorators

| Decorator | Type | Description |
|-----------|------|-------------|
| `@Public` | Class/Method | Bypasses all security checks |
| `@Role(...roles)` | Class/Method | Requires any of the specified roles |
| `@AllRole(...roles)` | Class/Method | Requires all specified roles |
| `@NotRole(...roles)` | Class/Method | Denies access if user has any specified roles |
| `@NotAllRole(...roles)` | Class/Method | Denies access if user has all specified roles |
| `@Feature(...features)` | Class/Method | Requires any of the specified features |
| `@AllFeature(...features)` | Class/Method | Requires all specified features |
| `@NotFeature(...features)` | Class/Method | Denies access if user has any specified features |
| `@NotAllFeature(...features)` | Class/Method | Denies access if user has all specified features |
| `@UseGuard(check)` | Class/Method | Custom authorization logic |

### User Parameter Decorators

| Decorator | Description |
|-----------|-------------|
| `@ReqUser` | Injects complete user object |
| `@Username` | Injects username string |
| `@Token` | Injects JWT token string |
| `@Authorities` | Injects user authorities array |

### Authority Model

```typescript
interface Authority {
  name: string;
  description?: string;
  links?: Record<string, any>;
}

interface User {
  name: string;
  token?: string;
  authorities: Authority[];
}
```


## Authentication Strategies

### OIDC Authentication
```typescript
// Properties configuration (application.properties)
security.jwt.secret=your-secret-key
security.jwt.algorithm=HS256
security.jwt.expires=1h
security.validator.nonce=your-nonce

// OIDC specific properties
security.oidc.client-id=your-client-id
security.oidc.client-secret=your-client-secret
security.oidc.issuer-url=https://your-oidc-provider.com
security.oidc.redirect-uri=http://localhost:3000/auth/callback
```


### Custom Authentication Service
```typescript
import { Component } from '@pmeig/srv-core';
import { AuthService } from '@pmeig/srv-security';
import { TokenMetadata } from '@pmeig/srv-security';

@Component
export class CustomAuthService extends AuthService {
  
  async login(): Promise<string | void> {
    // Return redirect URL or handle login logic
    return '/custom-login-page';
  }

  async createToken(params: Record<string, string>): Promise<TokenMetadata> {
    // Validate credentials and create token
    const user = await this.validateUser(params.username, params.password);
    return this.jwtService.encode(user, 'custom-issuer', {
      expiresIn: 3600,
      tokenType: 'Bearer'
    });
  }

  async logout(): Promise<void> {
    // Handle logout logic
    console.log('User logged out');
  }
}
```


## JWT Configuration

### JWT Properties
```typescript
// application.properties
security.jwt.secret=your-256-bit-secret-key
security.jwt.algorithm=HS256
security.jwt.expires=24h
security.jwt.expose.type=Bearer

// Validator properties
security.validator.nonce=unique-nonce-value
```


### Custom JWT Claims
```typescript
import { JwtService } from '@pmeig/srv-security';
import { Component } from '@pmeig/srv-core';

@Component
export class CustomJwtService {
  constructor(private readonly jwtService: JwtService) {}

  createCustomToken(user: User, customClaims: Record<string, any>) {
    const enhancedUser = {
      ...user,
      ...customClaims,
      timestamp: Date.now()
    };
    
    return this.jwtService.encode(enhancedUser, 'custom-issuer', {
      expiresIn: 7200,
      tokenType: 'Bearer'
    });
  }
}
```


## User Provider Integration

### Custom User Provider
```typescript
import { Component } from '@pmeig/srv-core';
import { UserProvider } from '@pmeig/srv-security';
import { User, Authority, newAuthority } from '@pmeig/srv-security';

@Component
export class CustomUserProvider extends UserProvider {
  
  async createUser(userInfo: any): Promise<User> {
    // Map external user info to internal User model
    const authorities: Authority[] = [
      newAuthority('ROLE_USER', 'Basic user role'),
      ...userInfo.roles?.map(role => newAuthority(`ROLE_${role.toUpperCase()}`)) || []
    ];

    return {
      name: userInfo.preferred_username || userInfo.email,
      token: userInfo.sub,
      authorities
    };
  }
}
```


## How It Works

### Security Flow
1. **Request Interception**: Guard middleware intercepts all incoming requests
2. **Token Validation**: JWT tokens are validated and decoded
3. **User Context**: User information is stored in request-scoped context
4. **Authorization Check**: Decorators are evaluated against user authorities
5. **Access Decision**: Request proceeds or returns 401/403 error

### Authority Evaluation
- **Role-based**: Authorities starting with `ROLE_` prefix
- **Feature-based**: Custom feature flags for fine-grained control
- **Custom Logic**: `@UseGuard` allows complex authorization rules
- **Composition**: Multiple decorators can be combined for complex requirements

## Integration Examples

### Complete Security Setup
```typescript
import { Module } from '@pmeig/srv-core';
import { RestModule } from '@pmeig/srv-rest';
import { SecurityModule } from '@pmeig/srv-security';
import { PropertiesModule } from '@pmeig/srv-properties';

@Module({
  imports: [
    PropertiesModule,
    RestModule,
    SecurityModule
  ],
  providers: [
    // Your controllers and services
  ]
})
export class SecureApplicationModule {}

// Bootstrap
ApplicationContext.run(SecureApplicationModule);
```


### Authentication Controller
```typescript
import { Controller, Get, Post, Params } from '@pmeig/srv-rest';
import { Public, AuthService } from '@pmeig/srv-security';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('login')
  @Public
  async initiateLogin() {
    const redirectUrl = await this.authService.login();
    return { redirectUrl };
  }

  @Post('callback')
  @Public
  async handleCallback(@Params params: Record<string, string>) {
    const tokenData = await this.authService.createToken(params);
    return tokenData;
  }

  @Post('logout')
  async logout() {
    await this.authService.logout();
    return { message: 'Logged out successfully' };
  }
}
```


## Dependencies

- **@pmeig/srv-core**: ^0.1.0-SNAPSHOT - Core dependency injection and decorators
- **@pmeig/srv-properties**: ^0.1.0-SNAPSHOT - Configuration management
- **@pmeig/srv-rest**: ^0.1.0-SNAPSHOT - REST framework integration
- **jsonwebtoken**: ^9.0.2 - JWT token handling
- **openid-client**: ^6.6.1 - OIDC integration
- **cookie-parser**: ^1.4.7 - Cookie handling for sessions
- **ms**: ^2.1.3 - Time duration parsing

## Compatibility

- Node.js: 18+
- TypeScript: 5.8.3+
- Express: 5.1.0+
- Modern ES2022+ environment

## Common Patterns

### Resource-Based Authorization
```typescript
@Controller('documents')
@Role('USER')
export class DocumentController {
  
  @Get(':id')
  @UseGuard(authority => 
    authority.name === 'ROLE_ADMIN' || 
    authority.links?.ownedDocuments?.includes(id)
  )
  async getDocument(@Path('id') id: string, @ReqUser user: User) {
    return this.documentService.findByIdAndOwner(id, user.name);
  }
}
```


### Multi-Tenant Security
```typescript
@Controller('tenant/:tenantId/data')
@UseGuard(authority => authority.links?.tenantId === tenantId)
export class TenantDataController {
  
  @Get('')
  async getTenantData(@Path('tenantId') tenantId: string) {
    return this.dataService.findByTenant(tenantId);
  }
}
```


## Troubleshooting

### Common Issues

**Authentication not working**
- Verify JWT secret is properly configured
- Check token format and expiration
- Ensure OIDC configuration is correct

**Authorization failing unexpectedly**
- Check authority names match exactly (case-sensitive)
- Verify user authorities are properly set
- Debug with custom `@UseGuard` to inspect authority objects

**Token validation errors**
- Validate JWT algorithm matches configuration
- Check issuer and subject claims
- Verify nonce values match

**User context not available**
- Ensure SecurityModule is imported
- Check request-scoped components are properly configured
- Verify authentication middleware is running

## License
This project is licensed under the ISC License.

## Support
For issues and questions, please open an issue on the GitHub repository.
