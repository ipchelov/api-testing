# API Testing Project

A TypeScript-based API project for practicing and demonstrating API testing approaches.

Current release: `v0.3.0 - Role-Based Access Control`

## Tech Stack

- Node.js
- TypeScript
- Fastify
- `@fastify/jwt`
- Vitest
- Pino
- Prettier

## Setup

Install dependencies:

```bash
npm install
```

Required environment variable:

```env
JWT_SECRET=replace-with-a-secure-secret
```

A sample file is provided:

```text
.env.example
```

Start the API locally:

```bash
JWT_SECRET=local-dev-secret npm run dev
```

## Scripts

```bash
npm test              # run tests
npm run test:watch    # run tests in watch mode
npm run typecheck     # run TypeScript checks
npm run format:check  # check formatting
npm run format        # format files
npm run audit         # audit dependencies
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

Authenticates a fake user and returns a JWT access token. Send a JSON request body with
`Content-Type: application/json`. Invalid credentials return `401`; invalid JSON or a body that
fails validation returns `400`.

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

## Test Users

```text
admin@example.com  / Password123!1
viewer@example.com / Password123!2
```

These users are stored in a fake in-memory database for demo and testing purposes only.

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
- fake user helper functions

API tests use Fastify `inject`, so they verify API behavior without starting a real HTTP server.

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

## Next

### v0.4.0 - User Persistence

Planned scope:

- PostgreSQL users storage
- SQL migrations
- Repository layer replacing the fake users DB
- Existing authentication and RBAC flows backed by PostgreSQL
- Integration tests with a real database
