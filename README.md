# API Testing Project

A TypeScript-based API project for practicing and demonstrating API testing approaches.

Current release: `v0.5.0 - Projects API`

## Tech Stack

- Node.js
- TypeScript
- Fastify
- `@fastify/jwt`
- PostgreSQL 17 and `pg`
- Vitest
- Pino
- Prettier

## Setup

Install dependencies:

```bash
npm install
```

Use the existing PostgreSQL container `api-postgres` on `127.0.0.1:5432`, with the existing
`api_testing` and `api_testing_test` databases. The API runs locally with Node.js.
If the container is stopped, start it:

```bash
docker start api-postgres
```

Provide configuration in the shell environment, replacing the placeholders with your local values.
Connection URLs must name the intended database and contain no query parameters or fragment:

```bash
export DATABASE_URL='postgresql://<user>:<password>@127.0.0.1:5432/api_testing'
export TEST_DATABASE_URL='postgresql://<user>:<password>@127.0.0.1:5432/api_testing_test'
export JWT_SECRET='<secure-secret>'
export SEED_ADMIN_PASSWORD='<admin-password>'
export SEED_VIEWER_PASSWORD='<viewer-password>'
```

Apply migrations and create the development seed users. Repeating these commands preserves existing
users; migrations record applied SQL files in `schema_migrations`:

```bash
npm run db:migrate
npm run db:seed
npm run dev
```

Seeds use IDs `user_1` and `user_2` and the emails shown below. The published demo passwords are
for isolated local runs and tests only. Set unique passwords for any instance accessible to others,
including through a proxy or tunnel.
Passwords are stored as salted scrypt hashes, never as plaintext.

To apply migrations or seed explicitly to the test database:

```bash
npm run db:migrate -- --test
npm run db:seed -- --test
```

Each app owns its connection pool and closes it on shutdown. Startup checks PostgreSQL connectivity;
it does not apply migrations automatically.

## Scripts

```bash
npm test              # run all tests (requires TEST_DATABASE_URL and PostgreSQL)
npm run test:unit     # run unit tests without PostgreSQL
npm run test:db       # run PostgreSQL repository and app.inject() integration tests
npm run test:watch    # run tests in watch mode
npm run typecheck     # run TypeScript checks
npm run format:check  # check formatting
npm run format        # format files
npm run audit         # audit dependencies
npm run db:migrate    # apply migrations to api_testing (add -- --test for api_testing_test)
npm run db:seed       # seed users in api_testing (add -- --test for api_testing_test)
```

## API

### GET /health

Returns API health status.

```json
{
  "status": "ok"
}
```

### POST /auth/login

Authenticates a stored user and returns a JWT access token. Send a JSON request body with
`Content-Type: application/json`. Invalid credentials return `401`; invalid JSON or a body that
fails validation returns `400`.

Login allows 10 requests with a valid request body per client IP in a 60-second window. Requests
over the limit return `429` with `Retry-After` in seconds. The limiter is local to one application
instance and uses the direct connection IP with the default Fastify configuration. For a public
deployment behind a reverse proxy, configure per-client rate limiting at the proxy.

Request example:

```json
{
  "email": "viewer@example.com",
  "password": "Password123!2"
}
```

Successful response:

```json
{
  "accessToken": "<jwt>",
  "tokenType": "Bearer",
  "expiresIn": 3600
}
```

The token expires one hour after it is issued.

### GET /users/me

Returns the current authenticated user.

Requires:

```http
Authorization: Bearer <accessToken>
```

The header must contain exactly one Bearer token. Missing, malformed, invalid, or expired tokens
return `401`.

Successful response:

```json
{
  "id": "user_2",
  "email": "viewer@example.com",
  "name": "Viewer",
  "role": "viewer"
}
```

### GET /admin/users

Returns the public user list for an authenticated admin. Use the same Bearer header as `/users/me`.
An admin receives `200` with an array of `{ id, email, name, role }` objects. A viewer receives
`403`; missing or invalid authentication returns `401`.

### Projects

Send `Authorization: Bearer <accessToken>` for every request. Both roles can read projects.
Only `admin` can write. Projects contain `id`, `name`, `description`, and `creatorId`.
See the [Projects API spec](specs/projects-api/spec.md) for validation and access rules.

| Endpoint               | Success response                                                    |
| ---------------------- | ------------------------------------------------------------------- |
| `POST /projects`       | `201` with the new project. Send `name` and optional `description`. |
| `GET /projects`        | `200` with a list ordered by ID.                                    |
| `GET /projects/:id`    | `200` with the project.                                             |
| `PATCH /projects/:id`  | `200` with the updated project. Send at least one editable field.   |
| `DELETE /projects/:id` | `204` after permanent deletion.                                     |

An existing development database needs `npm run db:migrate` before using these endpoints.

## Test Users

```text
admin@example.com  / Password123!1
viewer@example.com / Password123!2
```

These users are created by the seed command. Development passwords come from the seed environment
variables. Integration fixtures and the isolated local request examples use the demo passwords above.
The seed command preserves existing passwords, so rerunning it does not rotate a demo password.

## Manual Check

Login as viewer:

```bash
curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"viewer@example.com","password":"Password123!2"}'
```

Call protected endpoint:

```bash
curl -s http://localhost:3000/users/me \
  -H "Authorization: Bearer <accessToken>"
```

## Development Workflow

Starting with v0.5.0, new features follow a spec-anchored approach to spec-driven development (SDD).
We agree on the expected behavior, scope, and acceptance criteria before implementation, then use
the feature spec to guide the code, tests, and review. See the [Projects API spec](specs/projects-api/spec.md)
for the first example.

## Testing Scope

Current automated checks cover:

- health endpoint
- login success and failure cases
- request body validation
- invalid JSON responses
- JWT access token response and expiration time
- protected `/users/me` endpoint
- missing, malformed, invalid, or expired Bearer token cases
- admin-only user list and `401`/`403` authorization cases
- rejection of JWT payload changes without a valid signature
- full login and current user flow
- PostgreSQL repository lookups, SQL constraints, and repeatable migrations/seeds
- password hashing, public user mapping, and database-target validation
- projects CRUD, request validation, and role-based access

API tests use Fastify `inject`, so they verify API behavior without starting a real HTTP server.

DB tests use only the local `api_testing_test` database. They check the configured URL and the actual
database name before writes, apply migrations, and clear `public.projects` and then `public.users`
before and after each test. The setup restores known hashed user fixtures before each case.
Development `api_testing` is never a fallback. Do not run multiple DB test processes simultaneously
against the same test database. Tests close their pools after completion; abrupt process termination
is recovered by the next run's fixture reset.

Unit tests do not require database configuration. To run the full validation suite:

```bash
npm test
npm run typecheck
npm run format:check
```

## Releases

### v0.1.0 - Minimal API Baseline

Completed:

- Fastify app setup
- health endpoint
- logger configuration
- basic API test setup
- TypeScript and Prettier setup

### v0.2.0 - Auth Flow

Completed:

- fake users storage
- `POST /auth/login`
- JWT access token
- `GET /users/me`
- Bearer token authentication
- positive and negative auth tests
- full login and current user flow

### v0.3.0 - Role-Based Access Control

Completed:

- Admin-only `GET /admin/users`
- Role-based authorization using JWT user role
- `200` for admin access
- `403` for viewer access
- `401` for missing or invalid auth
- API tests for admin, viewer, and unauthenticated flows

### v0.4.0 - User Persistence

Completed:

- PostgreSQL users storage
- SQL migrations
- Repository layer replacing the fake users DB
- Existing authentication and RBAC flows backed by PostgreSQL
- Integration tests with a real database
- Salted scrypt password hashes and repeatable seed users

### v0.5.0 - Projects API

Completed:

- Minimal Projects CRUD backed by PostgreSQL
- Project creator and request validation
- Admin management and viewer read access
- API integration tests

## Next

### v0.6.0 - Tasks API

Planned scope:

- Tasks CRUD within projects
- Task status, priority, creator, and assignee
- PostgreSQL relationships and API integration tests
