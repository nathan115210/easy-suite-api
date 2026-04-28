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

Example:

```http
GET /v1/meals?q=pasta&difficulty=easy&cookTime=under_30&sort=created_desc
```

Meal responses include `mealType` as a JSON array or `null`:

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
      "mealType": ["dinner"]
    }
  ]
}
```

```http
GET /v1/meals/{id}
```

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
