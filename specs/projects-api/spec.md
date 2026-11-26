# Projects API

Target release: v0.5.0

Projects are stored in PostgreSQL. Both roles can read projects. Only `admin` can create, update,
or delete them. Requests without valid authentication return `401`. Writes by `viewer` return
`403` before validation or looking up a project and leave the database unchanged.

The public representation is `{ id, name, description, creatorId }`. The server generates the
UUID and takes the immutable `creatorId` from the authenticated user. Names are trimmed and
must contain 1–120 characters after trimming. Duplicate names are allowed. Descriptions are
optional, nullable, and limited to 2,000 characters. Omitted descriptions default to `null`
on creation. Text fields cannot contain NUL characters.

| Endpoint               | Success                                                      |
| ---------------------- | ------------------------------------------------------------ |
| `POST /projects`       | `201` with the created project                               |
| `GET /projects`        | `200` with an array ordered by ID ascending, or `[]`         |
| `GET /projects/:id`    | `200` with the project                                       |
| `PATCH /projects/:id`  | `200` with the updated project                               |
| `DELETE /projects/:id` | `204` without a body, after permanently deleting the project |

Create accepts only `name` and `description`. Patch requires at least one of those fields,
preserves omitted fields, and clears the description when explicitly set to `null`.
Authorized requests with invalid input or extra body properties return `400`. A valid but
absent ID returns `404` on read, update, or delete. Errors use `{ error, message }`.

Acceptance covers admin CRUD, creator attribution, partial updates, clearing the description,
missing resources, validation, and viewer reads and rejected writes. Verify rejected writes
leave data unchanged. Tasks, pagination, and filtering are outside this release.
