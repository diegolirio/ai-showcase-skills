# Reference From This Repository

Use these as concrete examples when applying the skill to other projects.

## Implemented Files

- `demos-skills-applied-api/src/test/kotlin/com/example/demos/skills/applied/BaseIntegrationTest.kt`
- `demos-skills-applied-api/src/test/kotlin/com/example/demos/skills/applied/TestDemosSkillsAppliedApplication.kt`
- `demos-skills-applied-api/src/test/kotlin/com/example/demos/skills/applied/controllers/HealthControllerIntegrationTest.kt`
- `demos-skills-applied-core/build.gradle.kts`
- `demos-skills-applied-core/src/main/resources/db/migration/V1__create_integration_healthcheck.sql`
- `demos-skills-applied-api/src/main/resources/application.properties`
- `demos-skills-applied-api/src/main/resources/application-stage.properties`
- `demos-skills-applied-api/src/main/resources/application-prod.properties`
- `Makefile`

## Why This Pattern

- Tests run Flyway against Oracle Testcontainer at test startup.
- Runtime boot keeps Flyway disabled to avoid DDL at app startup in restricted DB users.
- Pipeline can run Flyway explicitly via `:core-module:migratePipeline`.
