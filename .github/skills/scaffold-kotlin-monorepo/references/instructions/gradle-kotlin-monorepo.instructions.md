---
description: "Use when creating new Gradle modules, configuring multi-module builds, adding subproject dependencies, or restructuring Gradle monorepo projects. Covers root build.gradle.kts, settings.gradle.kts, and submodule build files."
applyTo: ["**/build.gradle.kts", "**/settings.gradle.kts"]
---
# Gradle Kotlin DSL Monorepo Structure

## Module Layout

- Module naming convention: `{project-name}-api`, `{project-name}-core`, `{project-name}-async`, etc.
- Root `build.gradle.kts`: declares all plugins with versions, common `subprojects {}` block with shared dependencies, toolchain, and compiler options. Disables `jar` and `bootJar` at root level.
- `settings.gradle.kts`: declares `rootProject.name` and `include()` for each module.
- API modules (Spring Boot apps): own `build.gradle.kts` with `plugins { id("application") }`, `implementation(project(":{project-name}-core"))`, and test-specific dependencies (Testcontainers, etc.).
- Core/lib modules: own `build.gradle.kts` with `tasks.named("bootJar") { enabled = false }`.

## Conventions

- All plugins applied centrally in `subprojects {}` block via `apply(plugin = "...")`.
- Shared dependencies go in root `subprojects { dependencies {} }`.
- Module-specific dependencies go in the module's own `build.gradle.kts`.
- Use `implementation(project(":module-name"))` for inter-module dependencies.
- API modules depend on core; core never depends on API modules.

## Example Root build.gradle.kts

```kotlin
import org.springframework.boot.gradle.tasks.bundling.BootJar

plugins {
    kotlin("jvm") version "X.Y.Z"
    kotlin("plugin.spring") version "X.Y.Z"
    id("org.springframework.boot") version "X.Y.Z"
    id("io.spring.dependency-management") version "X.Y.Z"
    kotlin("plugin.jpa") version "X.Y.Z"
}

subprojects {
    // apply plugins, java toolchain, kotlin options, shared deps
}

tasks.getByName<Jar>("jar") { enabled = false }
tasks.getByName<BootJar>("bootJar") { enabled = false }
```

## Example settings.gradle.kts

```kotlin
rootProject.name = "{project-name}"

include("{project-name}-api")
include("{project-name}-core")
```

## Example API Module build.gradle.kts

```kotlin
plugins {
    id("application")
}

dependencies {
    implementation(project(":{project-name}-core"))
    // module-specific test deps
}
```

## Example Core Module build.gradle.kts

```kotlin
tasks.named("bootJar") {
    enabled = false
}
```
