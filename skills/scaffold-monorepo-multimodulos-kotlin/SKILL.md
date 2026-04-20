---
name: scaffold-monorepo-multimodulos-kotlin
description: >-
  Scaffolds or extends a Gradle Kotlin DSL monorepo with Kotlin, Java toolchain,
  Spring Boot apps ({group}-api) and Kotlin libraries ({group}-core), plus an
  optional root-level shared-libs module. Use when the user asks to create a
  monorepo, add a domain module (e.g. running/running-api, running-core), or
  mentions multimodule Kotlin, Spring Boot, Gradle version catalog, modulo-raiz,
  modulo-app-spring boot, or modulo-library.
---

# Scaffold monorepo multimodulos (Kotlin)

## Variaveis (substituir a partir do pedido)

| Placeholder | Descricao | Exemplo |
|-------------|-----------|---------|
| `{MONOREPO}` | `rootProject.name` / pasta do repo | `healthy` |
| `{GROUP}` | Slug do dominio (minusculas, um segmento) | `running` |
| `{GROUP_API}` | App Spring Boot | `{GROUP}-api` -> `running-api` |
| `{GROUP_CORE}` | Biblioteca Kotlin | `{GROUP}-core` -> `running-core` |
| `{BASE_PKG}` | Pacote base do dominio | `com.{empresa}.{GROUP}` (ou `group` Gradle existente, ex.: `com.healthy`) |
| `{BASE_PKG_ROOT}` | Pacote base da raiz, para `shared-libs` | `com.{empresa}` |

Regra fixa de nomes: **`{GROUP}-api`** e **`{GROUP}-core`** (kebab-case nos paths Gradle).

## Arvore por dominio (padrao principal)

```text
{MONOREPO}/
└── {GROUP}/
    ├── {GROUP}-api/       # Spring Boot - depende de :{GROUP}:{GROUP}-core
    └── {GROUP}-core/      # Kotlin JVM library
```

`settings.gradle.kts`: `include("{GROUP}:{GROUP}-api", "{GROUP}:{GROUP}-core")`.

## Modulo raiz - shared-libs

Para codigo compartilhado entre dominios, usar sempre o modulo raiz **`shared-libs/`** no mesmo nivel dos dominios, nunca dentro de um dominio interno:

```text
{MONOREPO}/
├── {GROUP}/
│   ├── {GROUP}-api/
│   └── {GROUP}-core/
└── shared-libs/           # Kotlin JVM library (sem Spring Boot)
```

`include("shared-libs")`. Caminho fisico: `shared-libs/`.

Observacoes:
- **Sem** plugin Spring Boot; apenas `kotlin("jvm")`.
- Pacote base sugerido: `{BASE_PKG_ROOT}.sharedlibs`.
- `*-api` de outros dominios consomem via `implementation(project(":shared-libs"))`.
- `shared-libs` e root-only: nunca criar dentro de `properties/` ou de qualquer outro dominio.

## Configuracao Gradle (obrigatoria e explicita)

Arquivos obrigatorios no root do repositorio:

```text
{MONOREPO}/
├── gradlew
├── gradlew.bat
├── gradle/
│   ├── libs.versions.toml
│   └── wrapper/
│       ├── gradle-wrapper.jar
│       └── gradle-wrapper.properties
├── settings.gradle.kts
├── build.gradle.kts
└── gradle.properties
```

Regras obrigatorias do wrapper:
- Sempre executar build com `./gradlew` (nunca `gradle` puro em automacao).
- `gradle/wrapper/gradle-wrapper.jar` deve estar versionado no Git.
- Se existir regra global `*.jar` no `.gitignore`, adicionar excecao explicita: `!gradle/wrapper/gradle-wrapper.jar`.
- `gradle/wrapper/gradle-wrapper.properties` deve ter `distributionUrl` explicito.

Troubleshooting rapido (CI):
- Erro `Could not find or load main class org.gradle.wrapper.GradleWrapperMain` indica wrapper incompleto no checkout.
- Validar no repo: `gradle/wrapper/gradle-wrapper.jar` existe e esta versionado.
- Se ausente, regenerar com `gradle wrapper --gradle-version 9.4.1 --distribution-type bin` e commitar `gradlew`, `gradlew.bat`, `gradle/wrapper/gradle-wrapper.jar` e `gradle/wrapper/gradle-wrapper.properties`.

Exemplo valido de `gradle/wrapper/gradle-wrapper.properties`:
```properties
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-9.4.1-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
```

Exemplo de include em `settings.gradle.kts` para modulo aninhado:
```kotlin
include("{GROUP}:{GROUP}-api", "{GROUP}:{GROUP}-core", "shared-libs")
```

Regra de task para modulo aninhado:
- Correto: `./gradlew :{GROUP}:{GROUP}-api:bootRun`
- Incorreto: `./gradlew {GROUP}-api:bootRun`

## Versoes Recomendadas (Validadas)

| Componente | Versao | Observacao |
|---|---|---|
| **Gradle** | 9.4.1 | Via wrapper (gradlew) |
| **Spring Boot** | 4.0.5 | LTS, Jakarta EE, Tomcat 11.0.20 |
| **Kotlin** | 2.3.0 | Compativel com Spring Boot 4.0.5 |
| **Java Toolchain** | 25 | LTS (JDK 25) |
| **Dependency Management** | 1.1.7+ | io.spring.dependency-management |

> Todas as versoes acima foram **testadas e validadas** com build e execucao bem-sucedidos.

## Convencoes tecnicas

- **Build:** Gradle **Kotlin DSL** (`settings.gradle.kts`, `build.gradle.kts`), **version catalog** `gradle/libs.versions.toml`.
- **Plugins raiz:** `kotlin-jvm`, `kotlin-spring`, `spring-boot`, `dependency-management` com `apply false`; **Foojay** em `settings` se o projeto ja usar (`org.gradle.toolchains.foojay-resolver-convention`).
- **`*-api`:** `kotlin("jvm")`, `kotlin("plugin.spring")`, `org.springframework.boot`, `io.spring.dependency-management`; `implementation(project(":{GROUP}:{GROUP}-core"))`, `spring-boot-starter-web`; testes com `spring-boot-starter-test` + JUnit Platform se o repo ja padronizar assim.
- **`*-core`:** so `org.jetbrains.kotlin.jvm`.
- **`shared-libs`:** so `org.jetbrains.kotlin.jvm`, sem Spring Boot.
- **Pacotes:** `{BASE_PKG}.api` na app (`*Application`, controllers), `{BASE_PKG}.core` na library; `application.yml` com `spring.application.name: {GROUP}-api`.
- **Java / Kotlin:** alinhar **Java toolchain**, **Kotlin `jvmToolchain`**, e **`KotlinCompile` `jvmTarget`** ao mesmo nivel (ex.: 25). **Kotlin que gera bytecode JVM 25** requer versao compativel do compilador (ver [reference.md](reference.md)).
- **Portas:** varias APIs locais -> portas distintas por `server.port` em cada `application.yml`.

## Dependencias Recomendadas (Validadas Spring Boot 4.0.5)

Exemplo de `{GROUP}-api/build.gradle.kts`:

```kotlin
plugins {
    alias(libs.plugins.kotlin.jvm)
    alias(libs.plugins.kotlin.spring)
    alias(libs.plugins.spring.boot)
    alias(libs.plugins.dependency.management)
}

dependencies {
    implementation(project(":{GROUP}:{GROUP}-core"))
    implementation("org.springframework.boot:spring-boot-starter-webmvc")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.jetbrains.kotlin:kotlin-reflect")

    testImplementation("org.springframework.boot:spring-boot-starter-actuator-test")
    testImplementation("org.springframework.boot:spring-boot-starter-webmvc-test")
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit5")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(25))
    }
}

kotlin {
    jvmToolchain(25)
    compilerOptions {
        freeCompilerArgs.addAll("-Xjsr305=strict", "-Xannotation-default-target=param-property")
    }
}

tasks.withType<Test>().configureEach {
    useJUnitPlatform()
}
```

Exemplo de `{GROUP}-core/build.gradle.kts`:

```kotlin
plugins {
    alias(libs.plugins.kotlin.jvm)
}

dependencies {
    implementation("org.jetbrains.kotlin:kotlin-reflect")

    testImplementation("org.jetbrains.kotlin:kotlin-test-junit5")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(25))
    }
}

kotlin {
    jvmToolchain(25)
    compilerOptions {
        freeCompilerArgs.addAll("-Xjsr305=strict", "-Xannotation-default-target=param-property")
    }
}

tasks.withType<Test>().configureEach {
    useJUnitPlatform()
}
```

**Notas importantes:**
- `spring-boot-starter-webmvc` em vez de `spring-boot-starter-web` (mais explícito)
- `jackson-module-kotlin` gerenciado automaticamente pelo Spring Boot BOM
- Compilador options com `-Xjsr305=strict` para null-safety
- Testes separados em `actuator-test` + `webmvc-test` + `kotlin-test`

## Fluxo do agente

1. Extrair `{MONOREPO}`, `{GROUP}` e `{BASE_PKG}` (ou derivar de `subprojects { group = "..." }` existente).
2. Se o repositorio **ja existir**, copiar padroes do `settings.gradle.kts`, catalog e `build.gradle.kts` raiz; so **adicionar** `include` e modulos novos.
3. Se for **greenfield**, criar estrutura minima: wrapper Gradle, catalog, raiz, modulos, classes placeholder e `build` passando.
4. `shared-libs` deve ser criado somente no root do monorepo, nunca dentro de um dominio interno.

## Exemplo de pedido

**Input:** criar dominio `running` com API e core.

**Resultado:** pastas `running/running-api`, `running/running-core`; projetos `:running:running-api`, `:running:running-core`; dependencia da API no core.

## Referencia

Versoes, matriz Boot/Java/Kotlin e detalhes extras: [reference.md](reference.md).
