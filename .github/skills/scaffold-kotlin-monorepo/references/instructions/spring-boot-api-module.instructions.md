---
description: "Use when creating controllers, request DTOs, config classes, or any code in the Spring Boot API module. Covers REST controller naming, package structure, request/response patterns."
applyTo: ["**/*-api/src/**/*.kt"]
---
# Spring Boot API Module Conventions

## Package Structure

```
<base-package>/
├── config/                    # Spring configuration classes
├── controllers/
│   ├── <domain>/              # One package per domain aggregate
│   │   ├── {Domain}CreateController.kt
│   │   ├── {Domain}CreateRequest.kt
│   │   ├── {Domain}UpdateController.kt
│   │   ├── {Domain}UpdateRequest.kt
│   │   ├── {Domain}GetController.kt
│   ├── <another-domain>/
│   │   ├── ...
└── {ProjectName}Application.kt
```

## Naming Conventions

- Controllers: `{Domain}{Action}Controller.kt` (e.g., `ProductsCreateController`, `OrdersGetController`)
- Request DTOs: `{Domain}{Action}Request.kt` (e.g., `ProductsCreateRequest`)
- One controller per action (Create, Update, Get, Delete) — not one fat controller per domain.

## Controller Rules

- Controllers only receive requests, validate input, delegate to core command handlers, and return responses.
- No business logic in controllers.
- Use `@RestController` with `@RequestMapping` at the class level for base path.
- Inject core command handlers, not services directly.

## Request DTOs

- Use `data class` for request objects.
- Validation annotations on constructor parameters.
- Request classes live next to their controller in the same package.
