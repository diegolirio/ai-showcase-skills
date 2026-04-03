---
name: scaffold-kotlin-monorepo
description: "Scaffold a Kotlin Spring Boot Gradle monorepo from scratch. Use when creating a new project with api and core modules, CQRS structure, Oracle/Flyway, Testcontainers. Generates build.gradle.kts, settings.gradle.kts, module directories, Application.kt, and .github/instructions."
argument-hint: "No arguments needed — project-name, group, and base-package are auto-detected from the workspace"
---

# Scaffold Kotlin Spring Boot Monorepo

Creates a complete multi-module Gradle project with api + core modules following CQRS + Clean Architecture conventions.

## When to Use

- Starting a new Kotlin Spring Boot project from scratch
- Creating a monorepo with api and core modules
- Need standardized project structure with instructions

## Required Inputs — Auto-Detection

All inputs are captured automatically from the existing workspace. **Do NOT ask the user for these values.**

| Input | How to Detect | Fallback |
|-------|---------------|----------|
| `project-name` | Name of the workspace root folder (e.g., folder `ai-showcase-skills` → `ai-showcase-skills`) | — |
| `group` | Parse `group = "..."` from the root `build.gradle.kts` | Ask the user as a question |
| `base-package` | Read the `package` declaration from the Application class (`*Application.kt` with a `fun main`) found under the api module `src/main/kotlin/` | Ask the user as a question |

### Detection Procedure

1. **project-name**: Use the workspace root folder name as-is (kebab-case).
2. **group**: Read the root `build.gradle.kts` and extract the value from `group = "..."`. If the file does not exist or `group` is not declared, ask the user.
3. **base-package**: Find the Kotlin file under `{project-name}-api/src/main/kotlin/` that contains `fun main(`. Read its `package` declaration. This is the base package. If not found, ask the user.

## Procedure

### Step 1 — Create Root build.gradle.kts

Use [root build template](./references/root-build.gradle.kts.template) replacing `{group}` with the provided group.

### Step 2 — Create settings.gradle.kts

```kotlin
rootProject.name = "{project-name}"

include("{project-name}-api")
include("{project-name}-core")
```

### Step 3 — Create API Module

Path: `{project-name}-api/`

1. Create `build.gradle.kts` using [api build template](./references/api-build.gradle.kts.template), replacing `{project-name}` with the actual name.

2. Create the Application class at `{project-name}-api/src/main/kotlin/{package-path}/{ApplicationName}Application.kt`:

```kotlin
package {base-package}

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class {ApplicationName}Application

fun main(args: Array<String>) {
    runApplication<{ApplicationName}Application>(*args)
}
```

Where `{ApplicationName}` is the PascalCase version of `{project-name}` (e.g., `my-awesome-service` → `MyAwesomeService`).

3. Create `{project-name}-api/src/main/resources/application.properties`:

```properties
spring.application.name={project-name}
```

4. Create directory structure:

```
{project-name}-api/src/main/kotlin/{package-path}/config/
{project-name}-api/src/main/kotlin/{package-path}/controllers/
{project-name}-api/src/main/resources/db/migration/
{project-name}-api/src/test/kotlin/{package-path}/
```

5. Create test support files at `{project-name}-api/src/test/kotlin/{package-path}/`:

**TestcontainersConfiguration.kt:**
```kotlin
package {base-package}

import org.springframework.boot.test.context.TestConfiguration
import org.springframework.boot.testcontainers.service.connection.ServiceConnection
import org.springframework.context.annotation.Bean
import org.testcontainers.oracle.OracleContainer
import org.testcontainers.utility.DockerImageName

@TestConfiguration(proxyBeanMethods = false)
class TestcontainersConfiguration {
    @Bean
    @ServiceConnection
    fun oracleFreeContainer(): OracleContainer {
        return OracleContainer(DockerImageName.parse("gvenzl/oracle-free:latest"))
    }
}
```

**Test{ApplicationName}Application.kt:**
```kotlin
package {base-package}

import org.springframework.boot.fromApplication
import org.springframework.boot.with

fun main(args: Array<String>) {
    fromApplication<{ApplicationName}Application>().with(TestcontainersConfiguration::class).run(*args)
}
```

**{ApplicationName}ApplicationTests.kt:**
```kotlin
package {base-package}

import org.junit.jupiter.api.Test
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import

@Import(TestcontainersConfiguration::class)
@SpringBootTest
class {ApplicationName}ApplicationTests {
    @Test
    fun contextLoads() {
    }
}
```

### Step 4 — Create Core Module

Path: `{project-name}-core/`

1. Create `build.gradle.kts` using [core build template](./references/core-build.gradle.kts.template).

2. Create directory structure:

```
{project-name}-core/src/main/kotlin/{package-path}/core/application/
{project-name}-core/src/main/kotlin/{package-path}/core/infrastructure/http/
{project-name}-core/src/main/kotlin/{package-path}/core/infrastructure/oracle/
{project-name}-core/src/main/kotlin/{package-path}/core/infrastructure/kafka/
{project-name}-core/src/main/kotlin/{package-path}/core/domain/enums/
{project-name}-core/src/main/kotlin/{package-path}/core/buildingblocks/config/
{project-name}-core/src/main/kotlin/{package-path}/core/buildingblocks/exceptions/
{project-name}-core/src/test/kotlin/{package-path}/core/
```

### Step 5 — Copy Instructions

Copy the `.github/instructions/` files from [instructions templates](./references/instructions/). These are generic and work for any project following this structure.

### Step 6 — Validate

Run `./gradlew clean build -x test` to verify the project compiles.

## Notes

- `{package-path}` is `{base-package}` with dots replaced by `/` (e.g., `ia.lirio.my.awesome.service` → `ia/lirio/my/awesome/service`)
- Kotlin version: `2.3.10`, Spring Boot: `4.0.5`, Java toolchain: `25`
- Core module disables `bootJar` since it's a library
