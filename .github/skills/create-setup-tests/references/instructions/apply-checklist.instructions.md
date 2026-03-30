# Apply Checklist (Generic)

Use this checklist when applying `create-setup-tests` in any Kotlin Spring Boot repository.

## 1. Detect project values

- Read `settings.gradle.kts` to get `project-name` and module names.
- Read api Application class to get `base-package`.
- Confirm Spring Boot major version in root `build.gradle.kts`.

## 2. Create test foundation

- Add `BaseIntegrationTest` in api test package root.
- Add `Test{ApplicationName}Application` for test context.
- Update `{ApplicationName}ApplicationTests` to extend `BaseIntegrationTest`.

## 3. Ensure migration source of truth is core

- Create/verify `{core-module}/src/main/resources/db/migration`.
- Add migration scripts with Flyway naming (`V1__...sql`, `V2__...sql`).

## 4. Runtime safety

- Add `spring.flyway.enabled=false` to runtime properties in api module.
- Ensure stage/prod property files also disable Flyway.

## 5. Pipeline migration path

- Configure Flyway plugin in core `build.gradle.kts`.
- Add `migratePipeline` task depending on `flywayMigrate`.
- Confirm CI exports `FLYWAY_URL`, `FLYWAY_USER`, `FLYWAY_PASSWORD`.

## 6. Example integration test

- Add a simple controller in main source if no HTTP sample exists.
- Add controller integration test in mirrored test package and extend `BaseIntegrationTest`.

## 7. Makefile targets

- `test` -> `./gradlew test`
- `test-health` -> runs only health integration test

## 8. Validate in order

```bash
./gradlew :{api-module}:compileTestKotlin
./gradlew :{api-module}:test --tests "*HealthControllerIntegrationTest"
./gradlew test
```

## 9. Common fixes

- Oracle startup timeout: increase `withStartupTimeout(Duration.ofMinutes(5))`.
- Disk pressure: free Docker/Gradle cache space.
- Wrong imports: use version-appropriate import mapping.
