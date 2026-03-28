---
description: "Use when creating command handlers, domain entities, repository implementations, infrastructure adapters, or any code in the core library module. Covers CQRS handler pattern, domain modeling, infrastructure layer with Oracle/HTTP/Kafka adapters."
applyTo: ["**/*-core/src/**/*.kt"]
---
# Core Library Module Conventions (CQRS + Clean Architecture)

## Package Structure

```
<base-package>.core/
├── application/
│   ├── <domain>/
│   │   └── handlers/
│   │       ├── create/
│   │       │   ├── {Domain}CreateCommand.kt
│   │       │   └── {Domain}CreateCommandHandler.kt
│   │       ├── update/
│   │       │   ├── {Domain}UpdateCommand.kt
│   │       │   └── {Domain}UpdateCommandHandler.kt
│   │       └── get/
│   │           ├── {Domain}GetAllPagedListCommand.kt
│   │           └── {Domain}GetAllPagedListCommandHandler.kt
│   ├── <another-domain>/
│       └── handlers/
│           ├── create/
│           ├── update/
│           └── get/
├── infrastructure/
│   ├── http/                  # HTTP client adapters
│   ├── oracle/                # Oracle DB repository implementations
│   │   ├── {Domain}RepositoryImpl.kt
│   │   └── {Domain}OracleRepository.kt  # Spring Data JPA interface
│   ├── kafka/                 # Kafka producer/consumer adapters
│   ├── {Domain}HttpProvider.kt   # Port interfaces for HTTP
│   ├── {Domain}Repository.kt     # Port interfaces for persistence
│   └── {Domain}Producer.kt       # Port interfaces for messaging
├── domain/
│   ├── {Domain}.kt            # Domain entities
│   └── enums/                 # Domain enums
└── buildingblocks/
    ├── config/                # Shared configuration
    └── exceptions/            # Domain exceptions
```

## Application Layer (Handlers)

- One package per action: `create/`, `update/`, `get/`.
- Each action has a **Command** (input data) and **CommandHandler** (business logic).
- Command: `data class {Domain}{Action}Command(...)` — immutable input.
- CommandHandler: `class {Domain}{Action}CommandHandler` — orchestrates domain logic, calls infrastructure ports.
- Handlers are Spring `@Component` beans.

## Infrastructure Layer

- **Port interfaces** (e.g., `{Domain}Repository`, `{Domain}Producer`, `{Domain}HttpProvider`) live at `infrastructure/` root level.
- **Implementations** live in technology-specific subpackages (`oracle/`, `http/`, `kafka/`).
- Implementations are `@Repository` or `@Component` beans.

## Domain Layer

- Pure domain entities, no Spring annotations.
- JPA annotations allowed on entities (via `allOpen` plugin).
- Enums in `domain/enums/`.

## Building Blocks

- Cross-cutting concerns: shared exceptions, base configurations.
- Reusable across all domain handlers.
