# API Documentation

The current API foundation exposes a versioned Express API and Swagger UI.

## Local URLs

- API base: `http://localhost:8282`
- Health check: `http://localhost:8282/v1/health`
- Swagger UI: `http://localhost:8282/docs`

## Health Check

```http
GET /v1/health
```

Response:

```json
{
  "data": {
    "status": "ok",
    "service": "easy-meal-api"
  }
}
```

## Auth Sessions

```http
POST /v1/auth-sessions/signup
```

Registers a new user and creates an authenticated session. On success, an `authSessionId` cookie is set automatically.

**Request body:**

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

**Response `201`:**

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

Also sets an `authSessionId` HTTP-only cookie (expires in 7 days) used for subsequent authenticated requests.

**Response `400`** — invalid request body:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": []
  }
}
```

**Response `409`** — email or username already taken:

```json
{
  "error": {
    "code": "EMAIL_ALREADY_IN_USE | USERNAME_ALREADY_IN_USE",
    "message": "string"
  }
}
```

**Response `500`** — password processing or database failure:

```json
{
  "error": {
    "code": "PASSWORD_HASH_FAILED | DATABASE_ERROR | INTERNAL_ERROR",
    "message": "string"
  }
}
```

```http
POST /v1/auth-sessions/signin
```

Signs in an existing user and creates an authenticated session. On success, an `authSessionId` cookie is set automatically.

**Request body:**

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

**Response `200`:**

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

Also sets an `authSessionId` HTTP-only cookie (expires in 7 days).

Each successful signin creates a new session with a fresh expiry timestamp.
Existing sessions remain valid until they expire or are explicitly deleted.
Expired sessions are periodically removed by a background cleanup job.

**Response `400`** — invalid request body:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": []
  }
}
```

**Response `401`** — invalid credentials:

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid credentials"
  }
}
```

```http
GET /v1/auth-sessions/profile
```

Returns the current authenticated user's profile.

Authentication is required via `authSessionId` cookie (set by signup/signin).

**Request body:** none

**Response `200`:**

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

**Response `401`** — session missing or invalid:

```json
{
  "error": {
    "code": "SESSION_MISSING | SESSION_NOT_FOUND",
    "message": "string"
  }
}
```

**Response `404`** — user not found:

```json
{
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User not found"
  }
}
```

## Meals

```http
GET /v1/meals
```

Optional query params:

| Parameter    | Values                                                           |
| ------------ | ---------------------------------------------------------------- |
| `q`          | Search text matched against meal titles                          |
| `difficulty` | `any`, `easy`, `medium`, `hard`                                  |
| `cookTime`   | `any`, `under_15`, `under_30`, `under_45`, `under_60`, `over_60` |
| `sort`       | `created_desc`, `created_asc`, `cook_time_asc`, `cook_time_desc` |

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

Meal responses include `mealType` as a JSON array or `null`, plus related ingredients, instructions, and nutrition data:

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Simple Tomato Pasta",
      "slug": "simple-tomato-pasta",
      "image": "https://example.com/image.jpg",
      "description": "Quick pasta with tomato sauce.",
      "cookTime": 20,
      "difficulty": "easy",
      "mealType": ["dinner"],
      "ingredients": [
        {
          "text": "Spaghetti",
          "amount": "200g",
          "sort_order": 0
        }
      ],
      "instructions": [
        {
          "text": "Cook the pasta until al dente.",
          "image": null,
          "sort_order": 0
        }
      ],
      "nutrition": {
        "calories": 500,
        "protein": 20,
        "carbs": 70,
        "fat": 15
      }
    }
  ]
}
```

Related `ingredients`, `instructions`, and `nutrition` are `null` when no data is available.

```http
GET /v1/meals/{id}
```

Meal detail responses use the same enriched meal shape:

```json
{
  "data": {
    "id": "uuid",
    "title": "Simple Tomato Pasta",
    "slug": "simple-tomato-pasta",
    "image": "https://example.com/image.jpg",
    "description": "Quick pasta with tomato sauce.",
    "cookTime": 20,
    "difficulty": "easy",
    "mealType": ["dinner"],
    "ingredients": [
      {
        "text": "Spaghetti",
        "amount": "200g",
        "sort_order": 0
      }
    ],
    "instructions": [
      {
        "text": "Cook the pasta until al dente.",
        "image": null,
        "sort_order": 0
      }
    ],
    "nutrition": {
      "calories": 500,
      "protein": 20,
      "carbs": 70,
      "fat": 15
    }
  }
}
```

Related `ingredients`, `instructions`, and `nutrition` are `null` when no data is available.

```http
PUT /v1/meals/{id}
```

Partially updates a meal. Only fields present in the request body are changed. When `title` is updated, `slug` is automatically re-derived. Relation fields (`mealType`, `ingredients`, `instructions`, `nutrition`) are fully updated when provided, or left untouched when omitted.

All request body fields are optional:

| Field          | Type           | Notes                                        |
| -------------- | -------------- | -------------------------------------------- |
| `title`        | string         | Also auto-updates `slug`                     |
| `image`        | string         |                                              |
| `description`  | string         |                                              |
| `cookTime`     | number \| null | Minutes                                      |
| `difficulty`   | enum \| null   | `easy`, `medium`, `hard`                     |
| `mealType`     | array \| null  | Updates all meal type entries                |
| `ingredients`  | array \| null  | `sort_order` must be unique within the array |
| `instructions` | array \| null  | `sort_order` must be unique within the array |
| `nutrition`    | object \| null |                                              |

Returns the updated `MealDetail` on success (`200`), `404` if the meal does not exist, or `400` for validation errors (including `DUPLICATE_SORT_ORDER`).

## OpenAPI Foundation

OpenAPI document generation lives in:

```text
apps/easy-meal-api/src/openapi/document.ts
```

Swagger UI is registered in:

```text
apps/easy-meal-api/src/openapi/swagger.ts
```

The current OpenAPI document uses:

- OpenAPI `3.1.0`
- `@asteasolutions/zod-to-openapi`
- Swagger UI at `/docs`

## Adding New Endpoints

Add route handlers under the versioned API structure:

```text
apps/easy-meal-api/src/v1/
```

For new feature areas, prefer small route modules that are mounted from `src/v1/router.ts`.

When adding request or response schemas, define them with Zod where possible so they can later be reused for validation and OpenAPI generation.
