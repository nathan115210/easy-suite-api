# Easy Meal API — OpenAPI Reference

Interactive docs are available at `http://localhost:8282/docs` when the API is running locally.

## Endpoints

### Auth Sessions

#### `POST /v1/auth-sessions/signup`

Registers a new user and opens an authenticated session. On success, an `authSessionId` HTTP-only cookie is set (TTL 7 days).

**Request body**

| Field      | Type   | Required | Constraints                                    |
| ---------- | ------ | -------- | ---------------------------------------------- |
| `username` | string | Yes      | 3–30 characters                                |
| `email`    | string | Yes      | Valid email format                             |
| `password` | string | Yes      | At least 3 chars, 1 uppercase letter, 1 number |

```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "secret123"
}
```

**Response `201`**

```json
{
  "message": "User created successfully",
  "data": {
    "user": {
      "id": "uuid",
      "username": "johndoe",
      "email": "john@example.com"
    }
  }
}
```

**Response `400`** — validation failure

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": []
  }
}
```

**Response `409`** — duplicate email or username

```json
{
  "error": {
    "code": "EMAIL_ALREADY_IN_USE | USERNAME_ALREADY_IN_USE",
    "message": "string"
  }
}
```

**Response `500`** — internal server error

```json
{
  "error": {
    "code": "PASSWORD_HASH_FAILED | DATABASE_ERROR | INTERNAL_ERROR",
    "message": "string"
  }
}
```

#### `POST /v1/auth-sessions/signin`

Signs in an existing user and opens an authenticated session. On success, an `authSessionId` HTTP-only cookie is set (TTL 7 days).

**Request body**

| Field      | Type   | Required | Constraints                                 |
| ---------- | ------ | -------- | ------------------------------------------- |
| `email`    | string | No       | Optional; must be a valid email if provided |
| `username` | string | No       | Optional                                    |
| `password` | string | Yes      | Must match user credentials                 |

`email` and `username` are both optional fields, but at least one of them must be provided.

```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```

```json
{
  "username": "johndoe",
  "password": "secret123"
}
```

**Response `200`**

```json
{
  "message": "Signin successful",
  "data": {
    "user": {
      "id": "uuid",
      "username": "johndoe",
      "email": "john@example.com"
    }
  }
}
```

Each successful signin creates a new session with a new `expiresAt`. Existing valid sessions are not invalidated by default.
Expired sessions are periodically removed by a background cleanup job.

**Response `400`** — validation failure

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": []
  }
}
```

**Response `401`** — invalid credentials

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid credentials"
  }
}
```

**Response `500`** — internal server error

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Internal Server Error"
  }
}
```

#### `GET /v1/auth-sessions/profile`

Returns the current authenticated user's profile.

Authentication is required via the `authSessionId` cookie (set by signup/signin).

**Request body**

None.

**Response `200`**

```json
{
  "message": "User profile retrieved successfully",
  "data": {
    "user": {
      "id": "uuid",
      "username": "johndoe",
      "email": "john@example.com"
    }
  }
}
```

**Response `401`** — session missing or invalid

```json
{
  "error": {
    "code": "SESSION_MISSING | SESSION_NOT_FOUND",
    "message": "string"
  }
}
```

**Response `404`** — user not found

```json
{
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User not found"
  }
}
```

**Response `500`** — internal server error

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Internal Server Error"
  }
}
```

---

### Meals

#### `GET /v1/meals`

Returns meals. Results can be searched by title, filtered by difficulty or cook time, and sorted.

**Query parameters**

| Parameter    | Type   | Values                                                           | Description                                  |
| ------------ | ------ | ---------------------------------------------------------------- | -------------------------------------------- |
| `q`          | string | Any search text                                                  | Full-text search against meal titles         |
| `difficulty` | string | `any`, `easy`, `medium`, `hard`                                  | Filter by difficulty; `any` skips the filter |
| `cookTime`   | string | `any`, `under_15`, `under_30`, `under_45`, `under_60`, `over_60` | Filter by cook time bucket                   |
| `sort`       | string | `created_desc`, `created_asc`, `cook_time_asc`, `cook_time_desc` | Sort returned meals                          |

Search by keyword:

Use `q` to search meal titles.

```http
GET /v1/meals?q=pasta
```

With URL-encoded spaces:

```http
GET /v1/meals?q=tomato%20pasta
```

Search can be combined with filters and sorting:

```http
GET /v1/meals?q=pasta&difficulty=easy&cookTime=under_30&sort=created_desc
```

**Response `200`**

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "string",
      "slug": "string",
      "image": "string",
      "description": "string",
      "cookTime": 30,
      "difficulty": "easy",
      "mealType": ["dinner"],
      "ingredients": [
        {
          "text": "string",
          "amount": "string",
          "sort_order": 0
        }
      ],
      "instructions": [
        {
          "text": "string",
          "image": null,
          "sort_order": 0
        }
      ],
      "nutrition": {
        "calories": 500,
        "protein": 30,
        "carbs": 60,
        "fat": 15
      }
    }
  ]
}
```

`mealType` is returned as a JSON array when assigned, for example `["dinner"]`. It is `null` when no meal types are assigned.
`ingredients` and `instructions` are ordered by `sort_order`. `ingredients`, `instructions`, and `nutrition` are `null` when no related data is available.

---

#### `POST /v1/meals`

Creates a new meal. `slug` is automatically derived from `title`.

**Request body**

| Field          | Type                                                                                                        | Required | Description                        |
| -------------- | ----------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------- |
| `title`        | string                                                                                                      | Yes      | Display name of the meal           |
| `image`        | string                                                                                                      | Yes      | Image URL                          |
| `description`  | string                                                                                                      | Yes      | Short description                  |
| `difficulty`   | `"easy" \| "medium" \| "hard" \| null`                                                                      | Yes      | Difficulty level; `null` for unset |
| `cookTime`     | number \| null                                                                                              | No       | Cook time in minutes               |
| `mealType`     | `["breakfast \| lunch \| dinner \| snacks \| dessert \| drinks"]` \| null                                   | No       | Meal categories                    |
| `ingredients`  | `[{ "text": string, "amount": string, "sort_order": number }]` \| null                                      | No       | Ingredient list                    |
| `instructions` | `[{ "text": string, "image": string \| null, "sort_order": number }]` \| null                               | No       | Preparation steps                  |
| `nutrition`    | `{ "calories": number, "protein": number \| null, "carbs": number \| null, "fat": number \| null }` \| null | No       | Per-serving nutrition              |

```json
{
  "title": "string",
  "image": "string",
  "description": "string",
  "difficulty": "easy",
  "cookTime": 30,
  "mealType": ["dinner"],
  "ingredients": [{ "text": "string", "amount": "string", "sort_order": 0 }],
  "instructions": [{ "text": "string", "image": null, "sort_order": 0 }],
  "nutrition": {
    "calories": 500,
    "protein": 30,
    "carbs": 60,
    "fat": 15
  }
}
```

- `sort_order` values must be unique within `ingredients` and within `instructions`.

**Response `201`**

Returns the full created `MealDetail` object (same shape as `GET /v1/meals/{id}`).

**Response `400`** — invalid request body or duplicate `sort_order` values

```json
{
  "error": {
    "code": "INVALID_BODY | DUPLICATE_SORT_ORDER",
    "message": "string",
    "details": []
  }
}
```

**Response `409`** — a meal with the same title already exists

```json
{
  "error": {
    "code": "MEAL_TITLE_ALREADY_EXISTS",
    "message": "string"
  }
}
```

---

#### `GET /v1/meals/{id}`

Returns a single meal by UUID.

**Path parameters**

| Parameter | Type | Description     |
| --------- | ---- | --------------- |
| `id`      | UUID | Meal identifier |

**Response `200`**

```json
{
  "data": {
    "id": "uuid",
    "title": "string",
    "slug": "string",
    "image": "string",
    "description": "string",
    "cookTime": 30,
    "difficulty": "easy",
    "mealType": ["dinner"],
    "ingredients": [
      {
        "text": "string",
        "amount": "string",
        "sort_order": 0
      }
    ],
    "instructions": [
      {
        "text": "string",
        "image": null,
        "sort_order": 0
      }
    ],
    "nutrition": {
      "calories": 500,
      "protein": 30,
      "carbs": 60,
      "fat": 15
    }
  }
}
```

`ingredients` and `instructions` are ordered by `sort_order`. `ingredients`, `instructions`, and `nutrition` are `null` when no related data is available.

**Response `400`** — `id` is not a valid UUID

```json
{
  "error": {
    "code": "INVALID_UUID",
    "message": "string"
  }
}
```

**Response `404`** — meal not found

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Meal not found"
  }
}
```

---

#### `PUT /v1/meals/{id}`

Partially updates a meal by UUID. Only the fields included in the request body are changed. When `title` is updated, `slug` is automatically re-derived from the new title.

**Path parameters**

| Parameter | Type | Description     |
| --------- | ---- | --------------- |
| `id`      | UUID | Meal identifier |

**Request body** _(all fields optional)_

```json
{
  "title": "string",
  "image": "string",
  "description": "string",
  "cookTime": 30,
  "difficulty": "easy",
  "mealType": ["dinner"],
  "ingredients": [{ "text": "string", "amount": "string", "sort_order": 0 }],
  "instructions": [{ "text": "string", "image": null, "sort_order": 0 }],
  "nutrition": {
    "calories": 500,
    "protein": 30,
    "carbs": 60,
    "fat": 15
  }
}
```

- Omitting a field leaves that data unchanged.
- Setting `mealType`, `ingredients`, `instructions`, or `nutrition` to `null` clears that related data.
- `sort_order` values must be unique within `ingredients` and within `instructions`.

**Response `200`**

Returns the full updated `MealDetail` object (same shape as `GET /v1/meals/{id}`).

**Response `400`** — invalid UUID or request body

```json
{
  "error": {
    "code": "INVALID_BODY | INVALID_ID | DUPLICATE_SORT_ORDER",
    "message": "string",
    "details": []
  }
}
```

**Response `404`** — meal not found

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Meal not found"
  }
}
```

---

## How it works

OpenAPI paths are registered using `@asteasolutions/zod-to-openapi`. Each module owns its own path registrations.

| File                                | Purpose                                                |
| ----------------------------------- | ------------------------------------------------------ |
| `src/openapi/registry.ts`           | Shared `OpenAPIRegistry` instance                      |
| `src/openapi/document.ts`           | Generates the OpenAPI 3.1.0 document from the registry |
| `src/openapi/swagger.ts`            | Mounts Swagger UI at `/docs`                           |
| `src/modules/meals/meals.schema.ts` | Registers `Meal` schema and `/v1/meals` paths          |

## Adding a new endpoint

1. Define the Zod schema and call `registry.registerPath(...)` in the module's `*.schema.ts` file.
2. Import the schema file (not `import type`) in the module's `*.routes.ts` file so the registration side effects run at startup.

```ts
// meals.routes.ts
import './meals.schema'; // ensures registerPath() runs at runtime
```
