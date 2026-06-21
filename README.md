# API Testing Project

A TypeScript-based API project for practicing and demonstrating API testing approaches.

The project is being developed incrementally. Each version adds a limited set of backend functionality together with automated API checks.

## Current Status

Current release: `v0.1.0 - Minimal API Baseline`

This version includes:

- Fastify application setup
- TypeScript configuration
- Health check endpoint
- Pino logger configuration
- API-level test with Fastify `inject`
- TypeScript type checking
- Prettier formatting setup
- Basic npm scripts

## Tech Stack

- Node.js
- TypeScript
- Fastify
- Vitest
- Pino
- Prettier

## Scripts

Start the API locally:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Run TypeScript type checking:

```bash
npm run typecheck
```

Check formatting:

```bash
npm run format:check
```

Format files:

```bash
npm run format
```

Run dependency audit for production dependencies:

```bash
npm run audit
```

## API

### GET /health

Returns API health status.

Response:

```json
{
  "status": "ok"
}
```

## Testing

Current test coverage:

- `GET /health` returns `200`
- `GET /health` returns the expected response body

The current test uses Fastify `inject` to verify API behavior without starting a real HTTP server.

## Release v0.1.0 - Minimal API Baseline

Status: Completed

This release establishes the initial project baseline:

- Fastify application setup
- Health endpoint
- Logger configuration
- Vitest API-level test
- TypeScript type checking
- Prettier formatting setup
- Basic project documentation

## Next Version

### v0.2.0 - Auth Flow

Planned scope:

- Fake users storage
- `POST /auth/login`
- JWT access token
- `GET /users/me`
- Bearer token authentication
- Positive and negative auth tests
- Full login to current-user API flow
