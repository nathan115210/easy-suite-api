# Easy Meal API — OpenAPI Reference

Interactive docs are available at `http://localhost:8282/docs` when the API is running locally.

## Endpoints

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

Example:

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
      "difficulty": "easy | medium | hard"
    }
  ]
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
    "difficulty": "easy | medium | hard"
  }
}
```

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
