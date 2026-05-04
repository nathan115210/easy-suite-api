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

Partially updates a meal. Only fields present in the request body are changed. When `title` is updated, `slug` is automatically re-derived. Relation fields (`mealType`, `ingredients`, `instructions`, `nutrition`) are fully replaced when provided, or left untouched when omitted.

All request body fields are optional:

| Field          | Type           | Notes                                        |
| -------------- | -------------- | -------------------------------------------- |
| `title`        | string         | Also auto-updates `slug`                     |
| `image`        | string         |                                              |
| `description`  | string         |                                              |
| `cookTime`     | number \| null | Minutes                                      |
| `difficulty`   | enum \| null   | `easy`, `medium`, `hard`                     |
| `mealType`     | array \| null  | Replaces all meal type entries               |
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
