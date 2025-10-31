# Challenge

A modern Node.js backend application built with Bun, Express, and GraphQL, featuring authentication, workspace management, and project organization capabilities.

## Features

- **Express REST API** - Traditional REST endpoints for core functionality
- **GraphQL API** - Apollo Server integration for flexible data queries
- **Authentication & Authorization** - JWT-based auth with secure cookie handling
- **Workspace Management** - Multi-workspace support with project organization
- **Email Service** - Integrated email notifications using Brevo
- **Database** - PostgreSQL with connection pooling
- **Security** - Helmet, CORS, encryption (AES-256-CBC)
- **Logging** - Winston logger with Morgan HTTP request logging
- **Type Safety** - Full TypeScript support with strict mode
- **Code Quality** - ESLint, Prettier, Husky pre-commit hooks
- **Docker Support** - Containerized deployment with Docker Compose

## Prerequisites

- [Bun](https://bun.sh/) >= 1.3.1
- [PostgreSQL](https://www.postgresql.org/) >= 17.5
- [Docker](https://www.docker.com/) (optional, for containerized deployment)

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd challenge
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your configuration:
   - `DATABASE_URL` - PostgreSQL connection string
   - `JWT_SECRET` - Secret key for JWT signing
   - `ENCRYPTION_KEY` & `ENCRYPTION_IV` - Encryption credentials
   - Other environment-specific settings

4. **Set up the database**

   ```bash
   # Using Docker Compose
   docker-compose up postgres -d

   # Or use your local PostgreSQL instance
   # Make sure the database specified in DATABASE_URL exists
   ```

## Running the Application

### Development Mode

```bash
bun run dev
```

The server will start with hot-reload enabled on `http://localhost:8000`

### Production Build

```bash
# Build the application
bun run build

# Start the production server
bun run start
```

### Docker Deployment

```bash
# Start all services (app + PostgreSQL)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Project Structure

```
challenge/
├── src/
│   ├── controllers/       # Request handlers
│   ├── graphql/          # GraphQL schema, resolvers, and Apollo setup
│   │   ├── schema/
│   │   │   ├── type-defs/   # GraphQL type definitions
│   │   │   └── resolvers/   # GraphQL resolvers
│   │   ├── apollo-server.ts
│   │   └── context.ts
│   ├── libs/             # Core libraries and utilities
│   │   ├── configs/      # Configuration management
│   │   ├── encryption/   # Encryption utilities
│   │   ├── exceptions/   # Custom error classes
│   │   └── logger.ts     # Winston logger setup
│   ├── middlewares/      # Express middlewares
│   ├── routes/           # REST API routes
│   ├── services/         # Business logic layer
│   │   ├── auth-service.ts
│   │   ├── user-service.ts
│   │   ├── workspace-service.ts
│   │   ├── project-service.ts
│   │   ├── email-service.ts
│   │   └── db-service.ts
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Helper functions
│   └── index.ts          # Application entry point
├── dist/                 # Compiled output
├── logs/                 # Application logs
├── .github/              # GitHub workflows
├── .husky/               # Git hooks
└── docker-compose.yml    # Docker services configuration
```

## API Endpoints

### REST API

- `GET /` - Health check endpoint
- `POST /auth/*` - Authentication endpoints

### GraphQL API

- `POST /graphql` - GraphQL endpoint
- `GET /graphql` - GraphQL Playground (development only)

Available GraphQL operations:

- **Auth**: Login, signup, password reset
- **Users**: User management and profiles
- **Workspaces**: Create and manage workspaces
- **Projects**: Project organization within workspaces

## Workspace Permissions

The application implements a robust role-based access control (RBAC) system for workspaces and projects. Permissions are enforced at the service layer using the `checkWorkspacePermission` utility.

### Roles

#### Workspace Roles

- **OWNER** - Full control over workspace, members, and projects
- **MEMBER** - Can manage projects but not workspace settings
- **VIEWER** - Read-only access to workspace

#### Project Roles

- **LEAD** - Can manage project tasks and members
- **CONTRIBUTOR** - Can create and manage tasks

### Usage Example

The permission system is enforced in service methods:

```typescript
// first you get the user membership

const workspaceMembership = await getWorkspaceMembershipForUser({
  userId: user.id,
  workspaceId,
});

// then you check if the user has enough permissions to perform the action
checkWorkspacePermission({
  user,
  membership: workspaceMembership,
  action: 'read',
  entity: 'Workspace',
});
```

- **Exception handling** - Throws `AppException.unauthorized()` on permission denial

### Supported Actions

- `create` - Create new entities
- `read` - View entities
- `update` - Modify existing entities
- `delete` - Remove entities

### Supported Entities

- `Workspace` - Workspace settings and metadata
- `Project` - Projects within workspaces
- `Task` - Tasks within projects
- `Member` - Workspace members
- `ProjectMember` - Project-specific members

## Code Quality

### Linting

```bash
bun run lint
```

### Formatting

```bash
bun run format
```

### Pre-commit Hooks

The project uses Husky and lint-staged to automatically:

- Run ESLint on staged TypeScript files
- Format code with Prettier
- Ensure code quality before commits

## Security Features

- **Helmet** - Sets secure HTTP headers
- **CORS** - Configurable cross-origin resource sharing
- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcrypt for password security
- **Data Encryption** - AES-256-CBC encryption for sensitive data
- **Cookie Security** - Secure cookie handling with httpOnly flags

## Environment Variables

| Variable             | Description                          | Default               |
| -------------------- | ------------------------------------ | --------------------- |
| `NODE_ENV`           | Environment (development/production) | development           |
| `APP_PORT`           | Application port                     | 8000                  |
| `BASE_URL`           | Base URL of the application          | http://localhost:8000 |
| `DATABASE_URL`       | PostgreSQL connection string         | -                     |
| `JWT_SECRET`         | Secret for JWT signing               | -                     |
| `ENCRYPTION_METHOD`  | Encryption algorithm                 | aes-256-cbc           |
| `ENCRYPTION_KEY`     | Encryption key                       | -                     |
| `ENCRYPTION_IV`      | Encryption initialization vector     | -                     |
| `BREVO_API_KEY`      | Brevo API key                        | -                     |
| `BREVO_SENDER_EMAIL` | Brevo sender email                   | -                     |

## Built With

- **Runtime**: [Bun](https://bun.sh/)
- **Framework**: [Express](https://expressjs.com/)
- **GraphQL**: [Apollo Server](https://www.apollographql.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Validation**: [Zod](https://zod.dev/)
- **Logging**: [Winston](https://github.com/winstonjs/winston) & [Morgan](https://github.com/expressjs/morgan)
- **Email**: [Brevo](https://www.brevo.com/)
