---
description: "Use when writing Kotlin code in Spring Boot projects. Covers Kotlin idioms, data classes, null safety, extension functions, and Spring-specific Kotlin patterns."
applyTo: ["**/*.kt"]
---
# Kotlin Spring Boot Coding Conventions

## General

- Use `data class` for DTOs, commands, and value objects.
- Prefer `val` over `var`. Immutability by default.
- Use expression body for single-expression functions: `fun name() = value`.
- Use named arguments for constructors with 3+ parameters.
- Avoid nullable types unless the domain genuinely allows null.

## Spring Specifics

- Use constructor injection (primary constructor with `val` params). No `@Autowired`.
- Use `@Component`, `@Repository`, `@RestController` — not `@Service` (prefer `@Component` or `@Named`).
- Use `runApplication<App>(*args)` in main function.
- allOpen plugin handles JPA entities — no need for manual `open` keywords.

## Testing

- Use JUnit 5 with `kotlin-test-junit5`.
- Use Testcontainers for integration tests with `@ServiceConnection`.
- Test class name: `{ClassName}Test.kt` for unit, `{ClassName}IntegrationTest.kt` for integration.
