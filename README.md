# API Testing Project

A TypeScript-based API project for practicing and demonstrating API testing approaches.

Current release: `v0.2.0 - Auth Flow`

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
npm run audit         # audit production dependencies
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

Authenticates a fake user and returns a JWT access token.

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

### GET /users/me

Returns the current authenticated user.

Requires:

```http
Authorization: Bearer <accessToken>
```

Successful response:

```json
{
  "id": "user_2",
  "email": "viewer@example.com",
  "name": "Viewer",
  "role": "viewer"
}
```

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
- JWT access token response
- protected `/users/me` endpoint
- missing or invalid Bearer token cases
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

## Next

### v0.3.0 - Role-Based Access Control

Planned scope:

- Admin-only `GET /admin/users`
- Role-based authorization using JWT user role
- `200` for admin access
- `403` for viewer access
- `401` for missing or invalid auth
- API tests for admin, viewer, and unauthenticated flows
