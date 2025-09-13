# @pmeig/srv-cli

A powerful command-line interface for the @pmeig/srv framework ecosystem. Provides project scaffolding, code generation, build automation, and development tools for creating and managing framework-based applications and libraries.

## Installation

```bash
  npm install -g @pmeig/srv-cli
```


## Features

- 🏗️ **Project Scaffolding** - Create new applications and libraries with pre-configured templates
- 🎯 **Code Generation** - Generate components, services, controllers, and other framework artifacts
- 📦 **Build Automation** - Intelligent build system with dependency management
- 🌍 **Workspace Support** - Multi-project workspace management and coordination
- ✨ **Template System** - Extensible template engine for custom code generation
- 🔄 **Package Manager Integration** - Auto-detection and integration with pnpm/npm
- 📁 **Project Context** - Smart context detection and project-aware operations
- 🛠️ **Development Tools** - Enhanced development workflow with logging and debugging
- 🎨 **Customizable Architecture** - Configurable project structure and naming conventions
- ⚡ **Fast Operations** - Optimized for quick project setup and generation

## Usage

### Global Installation
```shell script
# Install globally
  npm install -g @pmeig/srv-cli
```


### Basic Commands
```shell script
# Create new project
pmeig new library my-lib
pmeig ++ application my-app
pmeig create application my-app

# Generate components
pmeig add service UserService
pmeig generate controller UserController
pmeig + component DatabaseConnection

# Build projects
pmeig build my-project
```


## API Reference

### Core Commands

| Command | Alias | Description |
|---------|--------|-------------|
| `new` | `create`, `n`, `c`, `++` | Create new project |
| `add` | `generate`, `g`, `a`, `+` | Generate code artifacts |
| `build` | | Build project(s) |


## Project Configuration

### pmeig-cli.json Structure
```json
{
  "name": "my-workspace",
  "type": "library",
  "architecture": {
    "prefix": "@myorg/",
    "library": {
      "root": "modules"
    },
    "application": {
      "root": "apps"
    }
  },
  "projects": {
    "core": {
      "type": "library",
      "location": {
        "root": "modules/core"
      },
      "assets": []
    },
    "api": {
      "type": "application",
      "location": {
        "root": "apps/api"
      },
      "assets": ["resources/**"]
    }
  }
}
```


### Architecture Configuration

#### Project Types
- **library** - Reusable module or package
- **application** - Executable application
- **noop** - No-operation placeholder

#### Directory Structure
```shell script
my-workspace/
├── pmeig-cli.json          # CLI configuration
├── modules/                # Libraries root
│   ├── core/
│   ├── auth/
│   └── database/
├── apps/                   # Applications root
│   ├── api/
│   └── web/
└── shared/                 # Shared resources
```


## Command Line Options

### New Project Options
```shell script
  pmeig new [type] [name]
```


### Code Generation Options
```shell script
  pmeig add [type] [name]
```


### Build Options
```shell script
    pmeig build [project...]
```


## Template System

### Built-in Templates

#### Library Template Structure
```shell script
library-template/
├── package.json            # Package configuration
├── tsconfig.json          # TypeScript config
├── src/
│   ├── index.ts          # Main export
│   └── example.ts        # Example component
└── README.md             # Documentation
```


#### Application Template Structure
```shell
application-template/
├── package.json          # Package configuration
├── tsconfig.json        # TypeScript config
├── vite.config.ts       # Build configuration
├── main.ts              # Application entry point
└── resources/           # Application resources
```


#### Component Templates
- **component.ts.template** - Basic framework component
- **service.ts.template** - Business logic service
- **controller.ts.template** - REST API controller
- **properties.ts.template** - Configuration class

## Workspace Management

### Multi-Project Operations
```shell script
# Initialize workspace
pmeig new library workspace-root

# Add projects to workspace
cd workspace-root
pmeig add library shared-utils

# Build entire workspace
pmeig build
```


### Project Dependencies
```json
{
  "projects": {
    "core": {
      "type": "library",
      "location": { "root": "modules/core" }
    },
    "api": {
      "type": "application",
      "location": { "root": "apps/api" },
      "dependencies": ["core"]
    }
  }
}
```


## Package Manager Integration

### Auto-Detection
The CLI automatically detects your package manager:
- **pnpm** - if `pnpm-lock.yaml` exists
- **npm** - if `package-lock.json` exists
- **yarn** - if `yarn.lock` exists


## Development Workflow

### Typical Development Process
```shell script
# 1. Create workspace
pmeig new library my-framework

# 2. Add core module
cd my-framework
pmeig add library core

# 3. Add application modules
pmeig add library rest
pmeig add library security

# 4. Create test application
pmeig add application demo

# 5. Build everything
pmeig build
```

## Build System

### Build Process
1. **Dependency Resolution** - Analyzes project dependencies
2. **TypeScript Compilation** - Compiles TypeScript to JavaScript
3. **Asset Processing** - Copies and processes static assets
4. **Package Generation** - Creates distributable packages

### Build Configuration
```json
// In project's package.json
{
  "scripts": {
    "build": "pmeig build"
  }
}
```


### Build Targets
- **Development** - Fast builds with source maps
- **Production** - Optimized builds with minification
- **Watch** - Continuous build on file changes

## Advanced Features

### Context-Aware Operations
```shell script
# CLI detects project context automatically
cd my-workspace/modules/core
pmeig add service CoreService    # Adds to core module

cd ../../apps/api  
pmeig add controller ApiController  # Adds to api application
```


### Custom Architecture
```json
{
  "architecture": {
    "prefix": "@company/",
    "library": {
      "root": "packages",
      "prefix": "lib-"
    },
    "application": {
      "root": "services",  
      "prefix": "svc-"
    }
  }
}
```


### Asset Management
```json
{
  "projects": {
    "api": {
      "type": "application",
      "assets": [
        "resources/**",
        "templates/**/*.hbs",
        "config/*.yml"
      ]
    }
  }
}
```


## Dependencies

- **fast-glob**: ^3.3.3 - File pattern matching
- **js-yaml**: ^4.1.0 - YAML parsing and generation
- **pino**: ^9.7.0 - Structured logging
- **pino-pretty**: ^13.0.0 - Pretty log formatting

## Compatibility

- Node.js: 18+
- TypeScript: 5.8.3+
- pnpm: 10.11.0+ (recommended)
- npm: 8+ (supported)


## Troubleshooting

### Common Issues

**Command not found**
- Ensure CLI is installed globally: `npm install -g @pmeig/srv-cli`
- Check PATH includes global npm/pnpm bin directory

**Project context not detected**
- Ensure `pmeig-cli.json` exists in project root
- Verify JSON syntax is valid
- Run commands from within project directory

**Build failures**
- Check TypeScript configuration
- Verify all dependencies are installed
- Review build logs for specific error messages

**Template generation issues**
- Verify template files exist and are valid
- Check file permissions in destination directory
- Ensure target directory structure exists

## License
This project is licensed under the ISC License.

## Support
For issues and questions, please open an issue on the GitHub repository.