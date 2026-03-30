---
name: create-setup-tests
description: "Set up reusable integration tests in Kotlin Spring Boot projects with Testcontainers Oracle, Flyway migrations in the core module, runtime Flyway disabled in application properties, and Makefile test targets. Use for new or existing projects that need a BaseIntegrationTest pattern and pipeline-ready Flyway task."
argument-hint: "No arguments required. Auto-detect module names and base package from workspace."
---

# Create Setup Tests

Configures a reusable integration test foundation for Kotlin + Spring Boot projects using Oracle Testcontainers and Flyway.

This skill is generic and can be applied to new or existing projects.

## When To Use

- You need a shared integration base test (`BaseIntegrationTest`) for controller/repository tests.
- You need Flyway scripts in a shared/core module.
- You want Flyway enabled in tests but disabled in runtime app boot (`stage/prod/default`).
- You need a pipeline path to run Flyway explicitly (Gradle task/plugin), not at app startup.
- You want Makefile targets like `test` and `test-health`.

## Auto-Detection

Detect these values before writing files.

| Value | How to detect |
|---|---|
| `project-name` | Root folder name or `rootProject.name` in `settings.gradle.kts` |
| `api-module` | Module ending with `-api` in `settings.gradle.kts`, fallback `src/main/kotlin` root module |
| `core-module` | Module ending with `-core` in `settings.gradle.kts`, fallback create `<project-name>-core` |
| `base-package` | Package from `*Application.kt` in api module |
| `package-path` | `base-package` with `.` replaced by `/` |
| `spring-boot-major` | Boot version in root `build.gradle.kts` (`4.x` uses new package names) |

If detection fails for `base-package`, ask the user once.

## What This Skill Implements

1. Shared `BaseIntegrationTest` in api test source.
2. Test bootstrap app class (`Test...Application`) for controlled context loading.
3. Oracle Testcontainer with startup timeout tuned for slow machines.
4. Dynamic datasource/flyway test properties.
5. Runtime Flyway disabled in app properties (`application.properties`, `application-stage.properties`, `application-prod.properties`).
6. Flyway Gradle plugin and `migratePipeline` task in core module.
7. Core migration folder and initial SQL migration file.
8. Makefile targets for running tests.
9. Example controller integration test reusing `BaseIntegrationTest`.

## Procedure

### 1) Ensure Module Layout

Expected layout:

- `{api-module}/src/main/kotlin/{package-path}`
- `{api-module}/src/test/kotlin/{package-path}`
- `{core-module}/src/main/resources/db/migration`

Create folders if missing.

### 2) Create BaseIntegrationTest

Create `{api-module}/src/test/kotlin/{package-path}/BaseIntegrationTest.kt`.

Use template:
- [BaseIntegrationTest.kt template](./references/templates/BaseIntegrationTest.kt.template)

Important:
- Use `@DataJpaTest`, `@Testcontainers`, `@ImportAutoConfiguration(FlywayAutoConfiguration::class)`.
- Use `@AutoConfigureTestDatabase(replace = NONE)`.
- Configure `@EntityScan` and `@EnableJpaRepositories` for project-specific packages.
- Set `spring.flyway.enabled=true` in `DynamicPropertySource`.
- Set container startup timeout to 5 minutes.

### 3) Create Test Bootstrap App

Create `{api-module}/src/test/kotlin/{package-path}/Test{ApplicationName}Application.kt`.

Use template:
- [TestApplication.kt template](./references/templates/TestApplication.kt.template)

### 4) Update/Create Integration Smoke Test

Create or update `{api-module}/src/test/kotlin/{package-path}/{ApplicationName}ApplicationTests.kt` to extend `BaseIntegrationTest`.

Use template:
- [ApplicationIntegrationTest.kt template](./references/templates/ApplicationIntegrationTest.kt.template)

If project still uses `TestcontainersConfiguration` + `@SpringBootTest` for this purpose, remove that pattern and centralize container setup in `BaseIntegrationTest`.

### 5) Disable Flyway In Runtime Boot

Update or create:

- `{api-module}/src/main/resources/application.properties`
- `{api-module}/src/main/resources/application-stage.properties`
- `{api-module}/src/main/resources/application-prod.properties`

Set `spring.flyway.enabled=false` in runtime profiles.

Use templates:
- [application.properties template](./references/templates/application.properties.template)
- [application-stage.properties template](./references/templates/application-stage.properties.template)
- [application-prod.properties template](./references/templates/application-prod.properties.template)

### 6) Configure Flyway Plugin In Core

Update `{core-module}/build.gradle.kts`.

Use template:
- [core-build.gradle.kts Flyway template](./references/templates/core-build.gradle.kts.flyway.template)

Expected behavior:
- Flyway reads credentials from `FLYWAY_URL`, `FLYWAY_USER`, `FLYWAY_PASSWORD`, optional `FLYWAY_SCHEMA`.
- Migration location is core filesystem path.
- Custom task `migratePipeline` depends on `flywayMigrate`.

### 7) Create Migration File In Core

Create SQL files in `{core-module}/src/main/resources/db/migration` with Flyway naming pattern, for example:

- `V1__create_integration_healthcheck.sql`

Use template:
- [V1 migration template](./references/templates/V1__create_integration_healthcheck.sql.template)

### 8) Add Makefile Targets

If `Makefile` does not exist, create it.
If it exists, add missing targets.

Minimum targets:
- `test`: runs all tests.
- `test-health`: runs only example health controller integration test.

Use template:
- [Makefile template](./references/templates/Makefile.template)

### 9) Add Example Controller Test Reusing BaseIntegrationTest

If project has no controller sample, create one.

- Main controller template:
  - [HealthController.kt template](./references/templates/HealthController.kt.template)
- Test controller integration template:
  - [HealthControllerIntegrationTest.kt template](./references/templates/HealthControllerIntegrationTest.kt.template)

Test file must mirror controller package in test source:

- Main: `{api-module}/src/main/kotlin/{package-path}/controllers/HealthController.kt`
- Test: `{api-module}/src/test/kotlin/{package-path}/controllers/HealthControllerIntegrationTest.kt`

### 10) Validate

Run compile-first, then test:

```bash
./gradlew :{api-module}:compileTestKotlin
./gradlew :{api-module}:test --tests "*HealthControllerIntegrationTest"
```

If all good:

```bash
./gradlew test
```

## Spring Boot Compatibility Notes

Use correct imports for Spring Boot major version.

Detailed mapping file:

- [Spring Boot imports mapping](./references/spring-boot-imports.md)

For Spring Boot `4.x`:

- `DataJpaTest`: `org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest`
- `AutoConfigureTestDatabase`: `org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase`
- `EntityScan`: `org.springframework.boot.persistence.autoconfigure.EntityScan`
- `FlywayAutoConfiguration`: `org.springframework.boot.flyway.autoconfigure.FlywayAutoConfiguration`

For Spring Boot `3.x`, package names are different; adjust imports accordingly.

## Troubleshooting

- Oracle container timeout while waiting for `DATABASE IS READY TO USE!`
  - Increase startup timeout to 5 minutes or more.
  - Prefer pinned image tag instead of `latest` in stricter environments.
- Disk full during tests (`No space left on device`)
  - Free Docker and Gradle cache space and rerun.
- Flyway running on app boot in stage/prod
  - Ensure `spring.flyway.enabled=false` is present in runtime property files.
- Flyway pipeline task fails
  - Confirm `FLYWAY_URL`, `FLYWAY_USER`, `FLYWAY_PASSWORD` are present in CI.

## Reference Implementations

Examples from this repository:

- [Repository example notes](./references/examples/from-this-repo.md)
- [Implementation checklist instructions](./references/instructions/apply-checklist.instructions.md)
